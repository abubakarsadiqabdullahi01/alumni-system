import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/server";

function toCsvLine(values: Array<string | number>) {
  return values
    .map((value) => {
      const raw = String(value ?? "");
      if (raw.includes(",") || raw.includes("\"") || raw.includes("\n")) {
        return `"${raw.replaceAll("\"", "\"\"")}"`;
      }
      return raw;
    })
    .join(",");
}

export async function GET(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const range = Number(searchParams.get("range") ?? "30");
  const days = range === 7 || range === 90 ? range : 30;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const [
    totalUsers,
    totalAlumni,
    verifiedUsers,
    activeJobs,
    pendingJobs,
    pendingAccomplishments,
    totalApplications,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.alumni.count(),
    prisma.user.count({ where: { isVerified: true } }),
    prisma.job.count({ where: { isActive: true } }),
    prisma.job.count({ where: { isApproved: false, isActive: true } }),
    prisma.accomplishment.count({ where: { isApproved: false } }),
    prisma.jobApplication.count(),
  ]);

  const dailyRows = await prisma.$queryRaw<Array<{ day: Date; users: bigint; jobs: bigint; applications: bigint; accomplishments: bigint }>>`
    WITH days AS (
      SELECT generate_series(${start}::date, CURRENT_DATE, INTERVAL '1 day')::date AS day
    )
    SELECT
      d.day AS day,
      COALESCE(u.users, 0) AS users,
      COALESCE(j.jobs, 0) AS jobs,
      COALESCE(a.applications, 0) AS applications,
      COALESCE(c.accomplishments, 0) AS accomplishments
    FROM days d
    LEFT JOIN (
      SELECT DATE("createdAt") AS day, COUNT(*)::bigint AS users
      FROM "User"
      WHERE "createdAt" >= ${start}
      GROUP BY DATE("createdAt")
    ) u ON d.day = u.day
    LEFT JOIN (
      SELECT DATE("createdAt") AS day, COUNT(*)::bigint AS jobs
      FROM "jobs"
      WHERE "createdAt" >= ${start}
      GROUP BY DATE("createdAt")
    ) j ON d.day = j.day
    LEFT JOIN (
      SELECT DATE("createdAt") AS day, COUNT(*)::bigint AS applications
      FROM "job_applications"
      WHERE "createdAt" >= ${start}
      GROUP BY DATE("createdAt")
    ) a ON d.day = a.day
    LEFT JOIN (
      SELECT DATE("createdAt") AS day, COUNT(*)::bigint AS accomplishments
      FROM "accomplishments"
      WHERE "createdAt" >= ${start}
      GROUP BY DATE("createdAt")
    ) c ON d.day = c.day
    ORDER BY d.day ASC
  `;

  const lines: string[] = [];
  lines.push("SUMMARY");
  lines.push(toCsvLine(["Metric", "Value"]));
  lines.push(toCsvLine(["Total Users", totalUsers]));
  lines.push(toCsvLine(["Total Alumni", totalAlumni]));
  lines.push(toCsvLine(["Verified Users", verifiedUsers]));
  lines.push(toCsvLine(["Active Jobs", activeJobs]));
  lines.push(toCsvLine(["Pending Jobs", pendingJobs]));
  lines.push(toCsvLine(["Pending Accomplishments", pendingAccomplishments]));
  lines.push(toCsvLine(["Total Applications", totalApplications]));
  lines.push("");
  lines.push("DAILY_TRENDS");
  lines.push(toCsvLine(["Date", "Users", "Jobs", "Applications", "Accomplishments"]));
  for (const row of dailyRows) {
    lines.push(
      toCsvLine([
        new Date(row.day).toISOString().slice(0, 10),
        Number(row.users),
        Number(row.jobs),
        Number(row.applications),
        Number(row.accomplishments),
      ]),
    );
  }

  const csv = lines.join("\n");
  const fileName = `admin-reports-${days}d-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
