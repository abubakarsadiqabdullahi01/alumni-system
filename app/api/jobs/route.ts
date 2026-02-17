import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/server";
import { getSystemSettings } from "@/lib/admin/system-settings";

const createJobSchema = z.object({
  company: z.string().max(120).optional().nullable(),
  title: z.string().min(4).max(180),
  description: z.string().min(20).max(5000),
  requirements: z.string().max(5000).optional().nullable(),
  location: z.string().max(180).optional().nullable(),
  salaryRange: z.string().max(120).optional().nullable(),
  deadline: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const settings = await getSystemSettings();
    if (settings.maintenanceMode && sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Job posting is temporarily disabled due to maintenance mode." },
        { status: 503 },
      );
    }

    const body = await request.json();
    const parsed = createJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid job payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existingAlumni = await prisma.alumni.findUnique({
      where: { userId: sessionUser.userId },
      select: { id: true },
    });

    let alumniId = existingAlumni?.id ?? null;

    if (!alumniId && sessionUser.role === "ADMIN") {
      const generatedMatricNo = `ADMIN-${sessionUser.userId.slice(-12).toUpperCase()}`;
      const created = await prisma.alumni.create({
        data: {
          userId: sessionUser.userId,
          matricNo: generatedMatricNo,
          department: "Administration",
          graduationYear: new Date().getFullYear(),
        },
        select: { id: true },
      });
      alumniId = created.id;
    }

    if (!alumniId) {
      return NextResponse.json(
        { error: "Only members with an alumni profile can post jobs." },
        { status: 403 },
      );
    }

    const deadline =
      parsed.data.deadline && parsed.data.deadline.trim().length > 0
        ? new Date(parsed.data.deadline)
        : null;

    const isAdmin = sessionUser.role === "ADMIN";
    const isApproved = isAdmin
      ? settings.adminAutoApproveOwnContent || !settings.requireApprovalForJobs
      : !settings.requireApprovalForJobs;

    const job = await prisma.job.create({
      data: {
        posterId: alumniId,
        company: parsed.data.company?.trim() || null,
        title: parsed.data.title.trim(),
        description: parsed.data.description.trim(),
        requirements: parsed.data.requirements?.trim() || null,
        location: parsed.data.location?.trim() || null,
        salaryRange: parsed.data.salaryRange?.trim() || null,
        deadline,
        isApproved,
        approvedById: isApproved && isAdmin ? sessionUser.userId : null,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          isApproved && isAdmin
            ? "Job posted and approved instantly."
            : isApproved
              ? "Job posted successfully and is live."
              : "Job submitted successfully. It is now pending admin approval.",
        job,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create job error:", error);
    return NextResponse.json({ error: "Unable to create job" }, { status: 500 });
  }
}
