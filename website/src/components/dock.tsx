"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wrench, CalendarCheck, Layers, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface DockItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
  matches: (pathname: string) => boolean;
}

const DOCK_ITEMS: DockItem[] = [
  {
    name: "Home",
    href: "/",
    icon: Home,
    matches: (pathname) => pathname === "/",
  },
  {
    name: "Services",
    href: "/services",
    icon: Wrench,
    matches: (pathname) =>
      pathname === "/services" ||
      pathname.startsWith("/services/") ||
      pathname.startsWith("/categories") ||
      pathname.startsWith("/category") ||
      pathname.startsWith("/search"),
  },
  {
    name: "Bookings",
    href: "/dashboard/bookings",
    icon: CalendarCheck,
    matches: (pathname) => pathname.startsWith("/dashboard/bookings"),
  },
  {
    name: "Wall Panels",
    href: "/wall-panel",
    icon: Layers,
    matches: (pathname) => pathname.startsWith("/wall-panel"),
  },
  {
    name: "Account",
    href: "/dashboard",
    icon: UserRound,
    matches: (pathname) =>
      pathname.startsWith("/dashboard") && !pathname.startsWith("/dashboard/bookings"),
  },
];

export default function Dock() {
  const pathname = usePathname() || "/";
  const { user } = useAuth();

  // Hide on focused checkout and booking payment flows
  const shouldHide =
    pathname.startsWith("/cart/checkout") ||
    pathname.startsWith("/book/") ||
    pathname.startsWith("/auth");

  if (shouldHide) return null;

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href === "/" && pathname === "/") {
      e.preventDefault();
      try {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      } catch {
        window.scrollTo(0, 0);
      }
      document.documentElement?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      document.body?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  };

  return (
    <nav
      aria-label="Floating Navigation Dock"
      className="fixed  bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex w-[calc(100%-1.5rem)] max-w-xl sm:max-w-2xl items-center justify-between gap-1.5 sm:gap-3 rounded-xl border border-white/75 bg-white/70 px-3 py-2 sm:px-6 sm:py-2.5 shadow-[0_12px_40px_rgba(15,23,42,0.14),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-300 hover:bg-white/80 hover:shadow-[0_16px_48px_rgba(15,23,42,0.2)] animate-in fade-in slide-in-from-bottom-4"
    >
      {DOCK_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.matches(pathname);
        const resolvedHref =
          item.href.startsWith("/dashboard") && !user ? "/auth" : item.href;

        return (
          <Link
            key={item.name}
            href={resolvedHref}
            onClick={(e) => handleHomeClick(e, item.href)}
            className={`group relative flex flex-1 flex-col items-center justify-center rounded-full px-2.5 sm:px-5 py-1.5 sm:py-2 transition-all duration-200 active:scale-95 ${
              isActive
                ? "text-[#C86A37]"
                : "text-slate-700 hover:text-slate-950 hover:bg-white/50"
            }`}
          >
            {/* Active Glass Pill Highlight */}
            {isActive && (
              <span className="absolute inset-0 -z-10 rounded-full bg-white/85 ring-1 ring-[#C86A37]/30 shadow-[0_4px_14px_rgba(200,106,55,0.14),inset_0_1px_0_rgba(255,255,255,1)] transition-all duration-300" />
            )}

            <Icon
              size={21}
              strokeWidth={isActive ? 2.5 : 2}
              className={`transition-transform duration-200 group-hover:scale-110 ${
                isActive ? "text-[#C86A37]" : "text-slate-700 group-hover:text-slate-950"
              }`}
            />

            <span
              className={`mt-0.5 text-[10px] sm:text-xs leading-tight whitespace-nowrap transition-colors duration-200 ${
                isActive
                  ? "font-bold text-[#C86A37]"
                  : "font-semibold text-slate-600 group-hover:text-slate-950"
              }`}
            >
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}