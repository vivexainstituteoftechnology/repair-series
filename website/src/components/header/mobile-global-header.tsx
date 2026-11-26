"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { HeaderLocationDropdown } from "@/components/header/header-location";
import { HeaderCartButton } from "@/components/header/header-cart";
import { HeaderSearch } from "@/components/header/header-search";

export function MobileGlobalHeader() {
  const pathname = usePathname() || "/";
  const [isScrolled, setIsScrolled] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const lastScrollY = useRef(0);

  const isHomePage = pathname === "/" || pathname.startsWith("/service-areas");

  // Hide on dedicated Wall Panels studio screens (Requirement 2)
  if (pathname.startsWith("/wall-panel")) return null;

  useEffect(() => {
    let ticking = false;
    const threshold = 8;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setIsScrolled(currentScrollY > 20);

          if (currentScrollY <= 40) {
            setIsScrollingDown(false);
          } else if (currentScrollY > lastScrollY.current + threshold) {
            // Scrolling down: collapse row 1, keep only search bar fixed
            setIsScrollingDown(true);
          } else if (currentScrollY < lastScrollY.current - threshold) {
            // Scrolling up: show row 1
            setIsScrollingDown(false);
          }

          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
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
      <div className="px-3.5 pt-2 pb-2.5 flex flex-col gap-1.5 transition-all duration-300">
        {/* Row 1: Location Selector (Left) + Cart Button (Right) - collapses on downward scroll */}
        <div
          className={`flex items-center justify-between gap-3 transition-all duration-300 ease-in-out origin-top ${
            isScrollingDown
              ? "max-h-0 opacity-0 -translate-y-2 pointer-events-none overflow-hidden my-0"
              : "max-h-12 opacity-100 translate-y-0"
          }`}
        >
          <div className="shrink-0 max-w-[calc(100%-54px)]">
            <HeaderLocationDropdown variant={variant} />
          </div>
          <div className="shrink-0">
            <HeaderCartButton variant={variant} />
          </div>
        </div>

        {/* Row 2: Full-width Search Bar - Always stays fixed at top during downward scroll */}
        <div className="w-full">
          <HeaderSearch variant={variant} />
        </div>
      </div>
    </header>
  );
}
