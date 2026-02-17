import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/server";
import { getSystemSettings } from "@/lib/admin/system-settings";

const accomplishmentSchema = z.object({
  type: z.enum(["WEDDING", "PROMOTION", "NEW_EMPLOYMENT", "BIRTH", "OTHER"]),
  title: z.string().min(4).max(180),
  description: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().min(10).max(3000).optional().nullable(),
  ),
  imageUrl: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().url().max(1000).optional().nullable(),
  ),
  date: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  ),
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
        { error: "Achievement sharing is temporarily disabled due to maintenance mode." },
        { status: 503 },
      );
    }

    const body = await request.json();
    const parsed = accomplishmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid accomplishment payload", issues: parsed.error.flatten() },
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
        { error: "Only members with an alumni profile can share achievements." },
        { status: 403 },
      );
    }

    const entryDate = parsed.data.date ? new Date(parsed.data.date) : null;
    if (entryDate && Number.isNaN(entryDate.getTime())) {
      return NextResponse.json({ error: "Invalid date value" }, { status: 400 });
    }

    const isAdmin = sessionUser.role === "ADMIN";
    const isApproved = isAdmin
      ? settings.adminAutoApproveOwnContent || !settings.requireApprovalForAccomplishments
      : !settings.requireApprovalForAccomplishments;

    const accomplishment = await prisma.accomplishment.create({
      data: {
        alumniId,
        type: parsed.data.type,
        title: parsed.data.title.trim(),
        description: parsed.data.description?.trim() || null,
        imageUrl: parsed.data.imageUrl?.trim() || null,
        date: entryDate,
        isApproved,
        approvedById: isApproved && isAdmin ? sessionUser.userId : null,
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
            ? "Achievement posted and approved instantly."
            : isApproved
              ? "Achievement posted successfully and is live."
              : "Achievement submitted. It is pending admin approval.",
        accomplishment,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create accomplishment error:", error);
    return NextResponse.json({ error: "Unable to submit achievement" }, { status: 500 });
  }
}
