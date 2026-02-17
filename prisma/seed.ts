import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { hashPassword } from "../lib/auth/password";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function upsertUserWithRole(input: {
  name: string;
  email: string;
  role: "ADMIN" | "MODERATOR" | "MEMBER";
  password: string;
  phone?: string;
  alumni?: {
    matricNo: string;
    department: string;
    graduationYear: number;
  };
}) {
  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.upsert({
    where: { email: input.email.toLowerCase() },
    update: {
      name: input.name,
      role: input.role,
      phone: input.phone ?? null,
      passwordHash,
      isVerified: true,
    },
    create: {
      name: input.name,
      email: input.email.toLowerCase(),
      role: input.role,
      phone: input.phone ?? null,
      passwordHash,
      isVerified: true,
    },
    select: { id: true, email: true, role: true },
  });

  if (input.alumni) {
    await prisma.alumni.upsert({
      where: { userId: user.id },
      update: {
        matricNo: input.alumni.matricNo,
        department: input.alumni.department,
        graduationYear: input.alumni.graduationYear,
      },
      create: {
        userId: user.id,
        matricNo: input.alumni.matricNo,
        department: input.alumni.department,
        graduationYear: input.alumni.graduationYear,
      },
    });
  }

  return user;
}

async function main() {
  const seeded = await Promise.all([
    upsertUserWithRole({
      name: "GSU System Admin",
      email: "admin@gsu-alumni.local",
      role: "ADMIN",
      password: "Password@123",
      phone: "+2348000000001",
    }),
    upsertUserWithRole({
      name: "GSU Moderator",
      email: "moderator@gsu-alumni.local",
      role: "MODERATOR",
      password: "Password@123",
      phone: "+2348000000002",
      alumni: {
        matricNo: "GSU/MOD/2017/0001",
        department: "Mass Communication",
        graduationYear: 2017,
      },
    }),
    upsertUserWithRole({
      name: "GSU Member",
      email: "member@gsu-alumni.local",
      role: "MEMBER",
      password: "Password@123",
      phone: "+2348000000003",
      alumni: {
        matricNo: "GSU/MEM/2019/0001",
        department: "Computer Science",
        graduationYear: 2019,
      },
    }),
  ]);

  console.log("Seed complete:");
  for (const user of seeded) {
    console.log(`- ${user.role}: ${user.email}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

