import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/server";

function escapeCsv(value: string | null | undefined) {
  const raw = value ?? "";
  if (raw.includes(",") || raw.includes("\"") || raw.includes("\n")) {
    return `"${raw.replaceAll("\"", "\"\"")}"`;
  }
  return raw;
}

export async function GET(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const dept = searchParams.get("dept")?.trim() ?? "";
  const year = searchParams.get("year")?.trim() ?? "";
  const city = searchParams.get("city")?.trim() ?? "";
  const employer = searchParams.get("employer")?.trim() ?? "";
  const skills = searchParams.get("skills")?.trim() ?? "";

  const parsedYear = Number(year);
  const yearFilter = Number.isFinite(parsedYear) && parsedYear > 0 ? parsedYear : null;

  const filters = [];
  if (dept) filters.push({ department: { contains: dept, mode: "insensitive" as const } });
  if (yearFilter) filters.push({ graduationYear: yearFilter });
  if (city) filters.push({ currentCity: { contains: city, mode: "insensitive" as const } });
  if (employer) filters.push({ employer: { contains: employer, mode: "insensitive" as const } });
  if (skills) filters.push({ skills: { contains: skills, mode: "insensitive" as const } });

  const rows = await prisma.alumni.findMany({
    where: filters.length > 0 ? { AND: filters } : undefined,
    select: {
      matricNo: true,
      department: true,
      graduationYear: true,
      currentCity: true,
      employer: true,
      jobTitle: true,
      skills: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10000,
  });

  const header = [
    "Name",
    "Email",
    "Matric No",
    "Department",
    "Graduation Year",
    "City",
    "Employer",
    "Job Title",
    "Skills",
  ].join(",");

  const body = rows
    .map(
      (row: {
        matricNo: string;
        department: string;
        graduationYear: number;
        currentCity: string | null;
        employer: string | null;
        jobTitle: string | null;
        skills: string | null;
        user: { name: string | null; email: string | null };
      }) =>
      [
        escapeCsv(row.user.name),
        escapeCsv(row.user.email),
        escapeCsv(row.matricNo),
        escapeCsv(row.department),
        row.graduationYear.toString(),
        escapeCsv(row.currentCity),
        escapeCsv(row.employer),
        escapeCsv(row.jobTitle),
        escapeCsv(row.skills),
      ].join(","),
    )
    .join("\n");

  const csv = `${header}\n${body}`;
  const fileName = `alumni-search-export-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
