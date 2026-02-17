import { prisma } from "@/lib/prisma";

export type MemberActivityItem = {
  id: string;
  type: "JOB" | "ACCOMPLISHMENT";
  title: string;
  subtitle: string;
  createdAt: Date;
  status: string;
};

export type MemberDashboardData = {
  profile: {
    name: string;
    email: string;
    department: string | null;
    graduationYear: number | null;
    employer: string | null;
    jobTitle: string | null;
    city: string | null;
  };
  stats: {
    myJobsApplied: number;
    myAccomplishments: number;
    networkSize: number;
  };
  activity: MemberActivityItem[];
};

export async function getMemberDashboardData(userId: string): Promise<MemberDashboardData> {
  const [alumniProfile, myJobsApplied, myAccomplishments, networkSize, jobs, accomplishments] =
    await prisma.$transaction([
      prisma.alumni.findUnique({
        where: { userId },
        select: {
          department: true,
          graduationYear: true,
          employer: true,
          jobTitle: true,
          currentCity: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.jobApplication.count({
        where: {
          applicant: {
            userId,
          },
        },
      }),
      prisma.accomplishment.count({
        where: {
          alumni: {
            userId,
          },
        },
      }),
      prisma.alumni.count({
        where: {
          NOT: {
            userId,
          },
        },
      }),
      prisma.job.findMany({
        where: {
          poster: {
            userId,
          },
        },
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          isApproved: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
      }),
      prisma.accomplishment.findMany({
        where: {
          alumni: {
            userId,
          },
        },
        select: {
          id: true,
          title: true,
          type: true,
          isApproved: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
      }),
    ]);

  const activity: MemberActivityItem[] = [
    ...jobs.map((job) => ({
      id: `job-${job.id}`,
      type: "JOB" as const,
      title: job.title,
      subtitle: [job.company, job.location].filter(Boolean).join(" | ") || "Job post",
      createdAt: job.createdAt,
      status: job.isApproved ? "Approved" : "Pending",
    })),
    ...accomplishments.map((entry) => ({
      id: `acc-${entry.id}`,
      type: "ACCOMPLISHMENT" as const,
      title: entry.title,
      subtitle: entry.type.replaceAll("_", " "),
      createdAt: entry.createdAt,
      status: entry.isApproved ? "Approved" : "Pending",
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8);

  return {
    profile: {
      name: alumniProfile?.user.name ?? "Member",
      email: alumniProfile?.user.email ?? "",
      department: alumniProfile?.department ?? null,
      graduationYear: alumniProfile?.graduationYear ?? null,
      employer: alumniProfile?.employer ?? null,
      jobTitle: alumniProfile?.jobTitle ?? null,
      city: alumniProfile?.currentCity ?? null,
    },
    stats: {
      myJobsApplied,
      myAccomplishments,
      networkSize,
    },
    activity,
  };
}
