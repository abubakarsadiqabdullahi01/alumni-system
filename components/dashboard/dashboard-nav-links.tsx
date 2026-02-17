"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { type ComponentType, useEffect, useState } from "react";
import {
  Award,
  BarChart3,
  Briefcase,
  CalendarDays,
  FileClock,
  FolderTree,
  LayoutDashboard,
  Search,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { NavIconKey, NavItem } from "@/components/dashboard/config";

const navIcons: Record<NavIconKey, ComponentType<{ className?: string }>> = {
  layoutDashboard: LayoutDashboard,
  barChart3: BarChart3,
  search: Search,
  users: Users,
  folderTree: FolderTree,
  briefcase: Briefcase,
  award: Award,
  shieldCheck: ShieldCheck,
  fileClock: FileClock,
  calendarDays: CalendarDays,
  settings: Settings,
};

function splitHref(href: string) {
  const [base, hash] = href.split("#");
  return { base, hash: hash ? `#${hash}` : "" };
}

function resolveActiveHref(pathname: string, navItems: NavItem[]) {
  const exactPathMatch = navItems.find((item) => item.href === pathname);
  if (exactPathMatch) {
    return exactPathMatch.href;
  }

  const basePathMatch = navItems.find((item) => splitHref(item.href).base === pathname);
  if (basePathMatch) {
    return basePathMatch.href;
  }

  return navItems[0]?.href ?? "";
}

function resolveActiveHrefWithHash(pathname: string, navItems: NavItem[]) {
  if (typeof window !== "undefined" && window.location.hash) {
    const withHash = `${pathname}${window.location.hash}`;
    const hashMatch = navItems.find((item) => item.href === withHash);
    if (hashMatch) {
      return hashMatch.href;
    }
  }

  return resolveActiveHref(pathname, navItems);
}

function scrollToHashTarget(hash: string, offset = 110) {
  if (!hash) return false;
  const target = document.querySelector(hash);
  if (!target) return false;

  const top = target.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({
    top: Math.max(top, 0),
    behavior: "smooth",
  });
  return true;
}

export function DashboardNavLinks({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname();
  const [activeHref, setActiveHref] = useState(() => resolveActiveHref(pathname, navItems));

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash;
      requestAnimationFrame(() => {
        scrollToHashTarget(hash);
      });
    }
  }, [pathname, navItems]);

  useEffect(() => {
    function onHashChange() {
      setActiveHref(resolveActiveHrefWithHash(pathname, navItems));
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [pathname, navItems]);

  function handleNavClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
    setActiveHref(href);

    const { base, hash } = splitHref(href);
    if (!hash || base !== pathname) {
      return;
    }

    event.preventDefault();

    const found = scrollToHashTarget(hash);
    if (found) {
      window.history.pushState(null, "", href);
      return;
    }

    window.history.pushState(null, "", `${pathname}${hash}`);
  }

  return (
    <>
      {navItems.map((item) => {
        const Icon = navIcons[item.icon];
        const isActive = activeHref === item.href;
        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={(event) => handleNavClick(event, item.href)}
            className={`group relative flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-all ${
              isActive
                ? "border-indigo-400/40 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 text-white shadow-[0_14px_34px_-14px_rgba(37,99,235,0.9)]"
                : "border-transparent bg-transparent text-slate-700 hover:border-white/80 hover:bg-white/80 hover:text-slate-900"
            }`}
          >
            <span className="flex items-center gap-3 text-sm font-medium">
              <Icon className={`size-4 ${isActive ? "text-white" : "text-indigo-600"}`} />
              {item.label}
            </span>
            {item.badge ? (
              <Badge
                className={`rounded-full border-0 ${
                  isActive ? "bg-white/20 text-white" : "bg-indigo-600 text-white"
                }`}
              >
                {item.badge}
              </Badge>
            ) : null}
            {isActive ? <span className="absolute right-2 h-2 w-2 rounded-full bg-white/90" /> : null}
          </Link>
        );
      })}
    </>
  );
}
