"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/container";
// import { HeaderAuth } from "@/components/header-auth";
import { HeaderCartButton } from "@/components/header/header-cart";
import { HeaderLocationDropdown } from "@/components/header/header-location";
import { HeaderSearch } from "@/components/header/header-search";

export function SiteHeader() {
  const pathname = usePathname();

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
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
    <header className="sticky top-0 z-50 hidden border-b border-slate-200/80 bg-white/95 backdrop-blur-md md:block transition-all">
      <Container className="flex h-[76px] items-center justify-between gap-4 lg:gap-6">
        {/* Left: Brand Logo & Location Pill */}
        <div className="flex items-center gap-4 lg:gap-6 shrink-0">
          <Link
            href="/"
            onClick={handleHomeClick}
            className="flex items-center gap-2.5 transition-transform active:scale-95"
          >
            <div className="flex size-10 items-center justify-center rounded-2xl bg-white p-1 border border-slate-200 shadow-xs">
              <img
                src="/logo.png"
                alt="RepairSeries Logo"
                className="size-8 object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-slate-900 leading-tight">
                Repair<span className="text-[#C86A37]">Series</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                Services
              </span>
            </div>
          </Link>

          {/* Urban Company style In 15 mins Location Pill */}
          <HeaderLocationDropdown />
        </div>

        {/* Center: Search Bar */}
        <div className="flex flex-1 items-center justify-center">
          <HeaderSearch />
        </div>

        {/* Right: Cart & Auth Profile */}
        <div className="flex shrink-0 items-center gap-3">
          <HeaderCartButton />
          {/* <HeaderAuth /> */}
        </div>
      </Container>
    </header>
  );
}
