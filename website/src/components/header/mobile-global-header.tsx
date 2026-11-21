"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { HeaderLocationDropdown } from "@/components/header/header-location";
import { HeaderCartButton } from "@/components/header/header-cart";
import { HeaderSearch } from "@/components/header/header-search";

export function MobileGlobalHeader() {
  const pathname = usePathname() || "/";
  const [isScrolled, setIsScrolled] = useState(false);

  const isHomePage = pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      setIsScrolled(scrolled);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // When on homepage, starts transparent at scroll top; on other pages or when scrolled, uses solid theme background #C45508
  const showSolidBackground = isScrolled || !isHomePage;
  const variant = showSolidBackground ? "onTheme" : "default";

  return (
    <header
      className={`md:hidden sticky top-0 z-40 w-full transition-all duration-300 ease-in-out select-none ${
        showSolidBackground
          ? "bg-[#C45508] border-b border-[#A84706] shadow-md"
          : "bg-transparent border-b border-transparent shadow-none"
      }`}
      aria-label="Mobile Navigation Header"
    >
      <div className="px-3.5 pt-2.5 pb-2.5 flex flex-col gap-2">
        {/* Row 1: Location Selector (Left) + Cart Button (Right) */}
        <div className="flex items-center justify-between gap-3">
          <div className="shrink-0 max-w-[calc(100%-54px)]">
            <HeaderLocationDropdown variant={variant} />
          </div>
          <div className="shrink-0">
            <HeaderCartButton variant={variant} />
          </div>
        </div>

        {/* Row 2: Full-width Search Bar */}
        <div className="w-full">
          <HeaderSearch variant={variant} />
        </div>
      </div>
    </header>
  );
}
