import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, AUTH_SESSION_TTL_SECONDS } from "@/lib/auth/constants";
import { hashPassword } from "@/lib/auth/password";
import { signSessionToken } from "@/lib/auth/session";
import { getSystemSettings } from "@/lib/admin/system-settings";

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(255),
  phone: z.string().max(30).optional().nullable(),
  matricNo: z.string().min(4).max(60),
  department: z.string().min(2).max(120),
  graduationYear: z.number().int().min(1980).max(2100),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  try {
    const settings = await getSystemSettings();
    if (settings.maintenanceMode) {
      return NextResponse.json(
        { error: "Registration is temporarily disabled due to maintenance mode." },
        { status: 503 },
      );
    }

    if (!settings.allowPublicRegistration) {
      return NextResponse.json(
        { error: "Public registration is currently disabled by the administrator." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid registration payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { name, email, phone, matricNo, department, graduationYear, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedMatricNo = matricNo.trim().toUpperCase();

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { alumni: { is: { matricNo: normalizedMatricNo } } }],
      },
      select: { id: true, email: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email or matric number already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || null,
        passwordHash,
        role: "MEMBER",
        isVerified: settings.defaultNewUserVerified,
        alumni: {
          create: {
            matricNo: normalizedMatricNo,
            department: department.trim(),
            graduationYear,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json(
      { success: true, role: user.role, redirectTo: "/dashboard" },
      { status: 201 },
    );

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: AUTH_SESSION_TTL_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Unable to register" }, { status: 500 });
  }
}
