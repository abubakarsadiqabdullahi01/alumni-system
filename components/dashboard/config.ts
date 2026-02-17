import type { UserRole } from "@/components/dashboard/types";

export type NavIconKey =
  | "layoutDashboard"
  | "barChart3"
  | "search"
  | "users"
  | "folderTree"
  | "briefcase"
  | "award"
  | "shieldCheck"
  | "fileClock"
  | "calendarDays"
  | "settings";

export type NavItem = {
  id: string;
  label: string;
  icon: NavIconKey;
  href: string;
  badge?: string;
};

export const navByRole: Record<UserRole, NavItem[]> = {
  ADMIN: [
    { id: "overview", label: "Overview", icon: "layoutDashboard", href: "/dashboard/admin" },
    { id: "members", label: "Member Management", icon: "users", href: "/dashboard/admin/members" },
    { id: "search", label: "Search Alumni", icon: "search", href: "/dashboard/search" },
    { id: "post-job", label: "Post Job", icon: "briefcase", href: "/dashboard/post-job" },
    { id: "my-jobs", label: "My Jobs", icon: "folderTree", href: "/dashboard/my-jobs" },
    { id: "moderation", label: "Moderation", icon: "shieldCheck", href: "/dashboard/moderation", badge: "Live" },
    { id: "reports", label: "Reports", icon: "barChart3", href: "/dashboard/admin/reports" },
    { id: "settings", label: "System Settings", icon: "settings", href: "/dashboard/admin/settings" },
    { id: "profile", label: "My Profile", icon: "settings", href: "/profile" },
  ],
  MODERATOR: [
    { id: "overview", label: "Overview", icon: "layoutDashboard", href: "/dashboard/moderator" },
    { id: "search", label: "Search Alumni", icon: "search", href: "/dashboard/search" },
    { id: "my-jobs", label: "My Jobs", icon: "folderTree", href: "/dashboard/my-jobs" },
    { id: "moderation", label: "Moderation Queue", icon: "shieldCheck", href: "/dashboard/moderation", badge: "8" },
    { id: "jobs", label: "Job Approvals", icon: "briefcase", href: "/dashboard/moderator#jobs", badge: "3" },
    { id: "achievements", label: "Achievement Review", icon: "award", href: "/dashboard/moderator#achievements", badge: "5" },
    { id: "reports", label: "Reports", icon: "fileClock", href: "/dashboard/moderator#reports" },
    { id: "settings", label: "Moderator Settings", icon: "settings", href: "/dashboard/moderator#settings" },
  ],
  MEMBER: [
    { id: "overview", label: "My Dashboard", icon: "layoutDashboard", href: "/dashboard/member" },
    { id: "search", label: "Search Alumni", icon: "search", href: "/dashboard/search" },
    { id: "post-job", label: "Post Job", icon: "briefcase", href: "/dashboard/post-job" },
    { id: "my-jobs", label: "My Jobs", icon: "folderTree", href: "/dashboard/my-jobs" },
    { id: "achievements", label: "Share Achievement", icon: "award", href: "/dashboard/share-achievement" },
    { id: "events", label: "Events", icon: "calendarDays", href: "/dashboard/member/events" },
    { id: "settings", label: "My Profile", icon: "settings", href: "/profile" },
  ],
};

export const roleTitle: Record<UserRole, string> = {
  ADMIN: "Administrator Console",
  MODERATOR: "Moderator Workspace",
  MEMBER: "Alumni Member Dashboard",
};
