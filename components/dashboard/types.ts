export type UserRole = "ADMIN" | "MODERATOR" | "MEMBER";

export function isUserRole(value: string): value is UserRole {
  return value === "ADMIN" || value === "MODERATOR" || value === "MEMBER";
}

