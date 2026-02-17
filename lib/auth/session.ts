import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@/components/dashboard/types";
import { AUTH_SESSION_TTL_SECONDS } from "@/lib/auth/constants";

export type SessionUser = {
  userId: string;
  email: string | null;
  name: string | null;
  role: UserRole;
};

function getAuthSecret() {
  const secret =
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "dev-only-auth-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(user: SessionUser) {
  return new SignJWT({
    userId: user.userId,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${AUTH_SESSION_TTL_SECONDS}s`)
    .sign(getAuthSecret());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getAuthSecret());

  if (
    typeof payload.userId !== "string" ||
    (payload.email !== null && payload.email !== undefined && typeof payload.email !== "string") ||
    (payload.name !== null && payload.name !== undefined && typeof payload.name !== "string") ||
    (payload.role !== "ADMIN" && payload.role !== "MODERATOR" && payload.role !== "MEMBER")
  ) {
    throw new Error("Invalid session payload");
  }

  return {
    userId: payload.userId,
    email: payload.email ?? null,
    name: payload.name ?? null,
    role: payload.role,
  } satisfies SessionUser;
}

