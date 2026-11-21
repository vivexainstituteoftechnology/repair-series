"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const CAROUSEL_CARD_WIDTH =
  "w-[calc((100%-12px)/2.2)] sm:w-[calc((100%-32px)/3)] md:w-[calc((100%-48px)/4)] lg:w-[calc((100%-64px)/5)] shrink-0";

type ServiceCarouselProps = {
  children: React.ReactNode;
  className?: string;
  trackClassName?: string;
};

export function ServiceCarousel({
  children,
  className = "",
  trackClassName = "",
}: ServiceCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    checkScroll();

    // Check after images load or content updates
    const timer = setTimeout(checkScroll, 300);

    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const handleScroll = (direction: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    // Smoothly scroll by the visible container width to show the next batch of cards
    const scrollAmount = Math.max(300, el.clientWidth * 0.85);
    el.scrollBy({ left: direction * scrollAmount, behavior: "smooth" });
  };

  return (
    <div className={`group/carousel relative w-full ${className}`}>
      {/* Left Circular Navigation Button */}
      <button
        type="button"
        onClick={() => handleScroll(-1)}
        disabled={!canScrollLeft}
        aria-label="Previous services"
        className={`absolute -left-2.5 sm:-left-5 top-1/2 -translate-y-1/2 z-20 flex size-9 sm:size-11 items-center justify-center rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.16)] border border-slate-200/90 text-slate-800 transition-all duration-300 hover:bg-slate-50 hover:scale-110 active:scale-95 disabled:pointer-events-none disabled:opacity-0 ${
          canScrollLeft
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <ChevronLeft className="size-4 sm:size-5 stroke-[2.5]" />
      </button>

      {/* Right Circular Navigation Button */}
      <button
        type="button"
        onClick={() => handleScroll(1)}
        disabled={!canScrollRight}
        aria-label="Next services"
        className={`absolute -right-2.5 sm:-right-5 top-1/2 -translate-y-1/2 z-20 flex size-9 sm:size-11 items-center justify-center rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.16)] border border-slate-200/90 text-slate-800 transition-all duration-300 hover:bg-slate-50 hover:scale-110 active:scale-95 disabled:pointer-events-none disabled:opacity-0 ${
          canScrollRight
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <ChevronRight className="size-4 sm:size-5 stroke-[2.5]" />
      </button>

      {/* Horizontal Carousel Track with Hidden Scrollbar */}
      <div
        ref={trackRef}
        className={`flex gap-4 overflow-x-auto scroll-smooth pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${trackClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
