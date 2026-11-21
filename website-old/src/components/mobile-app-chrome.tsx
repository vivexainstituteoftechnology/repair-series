"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Home,
  Search,
  UserRound,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const TABS = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  {
    href: "/dashboard/bookings",
    label: "Bookings",
    icon: CalendarDays,
    match: (p: string) => p.startsWith("/dashboard/bookings"),
  },
  {
    href: "/services",
    label: "Services",
    icon: Wrench,
    match: (p: string) =>
      p === "/services" ||
      p.startsWith("/categories") ||
      p.startsWith("/category") ||
      p.startsWith("/search") ||
      p.startsWith("/coming-soon"),
  },
  {
    href: "/dashboard",
    label: "Account",
    icon: UserRound,
    match: (p: string) =>
      p.startsWith("/dashboard") && !p.startsWith("/dashboard/bookings"),
  },
] as const;

/**
 * Native app-like bottom navigation — visible on phone widths only.
 * Hidden on focused checkout, auth, and detail flows to allow full-bleed action bars.
 */
export function MobileBottomNav() {
  const pathname = usePathname() || "/";
  const { user } = useAuth();

  const hide =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/book") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/services/");

  if (hide) return null;

  const handleNavClick = (tabHref: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    if (tabHref === "/") {
      if (pathname === "/") {
        e.preventDefault();
        try {
          window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        } catch {
          window.scrollTo(0, 0);
        }
        document.documentElement?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        document.body?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      } else {
        try {
          window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        } catch {
          window.scrollTo(0, 0);
        }
      }
    }
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-[#E8E4E0] bg-white/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md shadow-[0_-2px_12px_rgba(0,0,0,0.04)] md:hidden"
      aria-label="App navigation"
    >
      <div className="mx-auto grid h-[64px] max-w-lg grid-cols-4 items-center">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const href =
            tab.href.startsWith("/dashboard") && !user ? "/auth" : tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={href}
              onClick={(e) => handleNavClick(tab.href, e)}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-all active:scale-95 ${
                active ? "text-[#C45508]" : "text-[#8A8F98] hover:text-[#4A4D54]"
              }`}
            >
              <div
                className={`flex items-center justify-center rounded-full px-3 py-1 transition-colors ${
                  active ? "bg-orange-50 text-[#C45508]" : ""
                }`}
              >
                <Icon className={`size-5 ${active ? "stroke-[2.4]" : "stroke-[1.8]"}`} />
              </div>
              <span className="leading-tight">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileAppHeaderActions() {
  return (
    <Link
      href="/search"
      className="flex size-10 items-center justify-center rounded-full bg-[#FDE7DD] text-[#C45508] active:scale-95 transition-transform md:hidden"
      aria-label="Search services"
    >
      <Search className="size-5" />
    </Link>
  );
}
