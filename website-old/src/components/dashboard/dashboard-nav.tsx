"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  LogOut,
  MapPin,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { logOut } from "@/lib/firebase/auth-actions";

const NAV = [
  { href: "/dashboard/profile", label: "My Profile", icon: User },
  { href: "/dashboard/bookings", label: "My Bookings", icon: BookOpen },
  { href: "/dashboard/addresses", label: "Saved Addresses", icon: MapPin },
  { href: "/delete-account", label: "Delete Account", icon: Trash2 },
] as const;

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { customer } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const onLogout = async () => {
    setLoggingOut(true);
    try {
      await logOut();
      router.replace("/");
    } catch {
      setLoggingOut(false);
    }
  };

  const desktopNavContent = (
    <>
      <div className="mb-6 px-1">
        <div className="text-lg font-bold text-[#0a0f1c]">My Dashboard</div>
        {customer?.name ? (
          <div className="mt-1 truncate text-sm text-[#64748b]">{customer.name}</div>
        ) : null}
      </div>

      <nav className="space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all active:scale-[0.98]",
                active
                  ? item.href === "/delete-account"
                    ? "bg-red-50 text-red-700"
                    : "bg-[#f96316] text-white shadow-sm"
                  : item.href === "/delete-account"
                    ? "text-red-600 hover:bg-red-50"
                    : "text-[#64748b] hover:bg-orange-50 hover:text-[#0a0f1c]",
              ].join(" ")}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-gray-100 pt-4">
        <Button
          variant="outline"
          size="lg"
          className="w-full justify-start gap-3 rounded-xl active:scale-[0.98]"
          disabled={loggingOut}
          onClick={onLogout}
        >
          <LogOut className="size-4" />
          {loggingOut ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile & Tablet segmented tab bar */}
      <div className="mb-4 lg:hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all active:scale-95 ${
                  active
                    ? item.href === "/delete-account"
                      ? "bg-red-100 text-red-700 shadow-sm ring-1 ring-red-200"
                      : "bg-[#f96316] text-white shadow-sm ring-2 ring-[#f96316]/20"
                    : item.href === "/delete-account"
                    ? "border border-gray-200 bg-white text-red-600"
                    : "border border-gray-200 bg-white text-[#64748b] hover:border-[#f96316]/40"
                }`}
              >
                <item.icon className="size-3.5" />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            disabled={loggingOut}
            onClick={onLogout}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#64748b] transition-colors hover:text-red-600 active:scale-95"
          >
            <LogOut className="size-3.5" />
            {loggingOut ? "..." : "Logout"}
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-[260px] shrink-0 lg:block">
        <div className="sticky top-24 rounded-[20px] border border-black/5 bg-white/90 p-5 shadow-sm backdrop-blur-sm">
          {desktopNavContent}
        </div>
      </aside>
    </>
  );
}
