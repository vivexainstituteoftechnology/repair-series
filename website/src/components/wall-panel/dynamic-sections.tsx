"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import type {
  WallPanelSection,
  WallPanelCategory,
  WallPanelProduct,
  WallPanelCustomCard,
} from "@/lib/wall-panel/models";
import {
  WallPanelCategoryCard,
  WallPanelProductCard,
  WallPanelCustomCardItem,
} from "./cards";

interface DynamicSectionsProps {
  sections: WallPanelSection[];
  categories: WallPanelCategory[];
  products: WallPanelProduct[];
}

export function WallPanelDynamicSections({
  sections,
  categories,
  products,
}: DynamicSectionsProps) {
  // Sort and filter active sections
  const activeSections = [...sections]
    .filter((s) => s.active !== false)
    .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));

  return (
    <div className="space-y-12 sm:space-y-16">
      {activeSections.map((section) => (
        <SectionBlock
          key={section.id}
          section={section}
          categories={categories}
          products={products}
        />
      ))}
    </div>
  );
}

function SectionBlock({
  section,
  categories,
  products,
}: {
  section: WallPanelSection;
  categories: WallPanelCategory[];
  products: WallPanelProduct[];
}) {
  const { title, showTitle, displayType, contentType, selectedItemIds, customCards } = section;

  // Resolve items for this section
  let itemsToRender: React.ReactNode[] = [];

  if (contentType === "categories") {
    const list =
      selectedItemIds && selectedItemIds.length > 0
        ? selectedItemIds
            .map((id) => categories.find((c) => c.id === id))
            .filter((c): c is WallPanelCategory => Boolean(c && c.active !== false))
        : categories.filter((c) => c.active !== false);

    itemsToRender = list.map((cat) => (
      <WallPanelCategoryCard key={cat.id} category={cat} className="w-full" />
    ));
  } else if (contentType === "products") {
    const list =
      selectedItemIds && selectedItemIds.length > 0
        ? selectedItemIds
            .map((id) => products.find((p) => p.id === id))
            .filter((p): p is WallPanelProduct => Boolean(p && p.active !== false))
        : products.filter((p) => p.active !== false);

    itemsToRender = list.map((prod) => (
      <WallPanelProductCard key={prod.id} product={prod} className="w-full" />
    ));
  } else if (contentType === "customCards") {
    const list = Array.isArray(customCards)
      ? [...customCards]
          .filter((c) => c.active !== false)
          .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
      : [];

    itemsToRender = list.map((card) => (
      <WallPanelCustomCardItem key={card.id} card={card} className="w-full" />
    ));
  }

  if (itemsToRender.length === 0) return null;

  return (
    <section className="relative">
      {/* Optional Section Title */}
      {showTitle && title ? (
        <div className="mb-4 sm:mb-6 flex items-baseline justify-between">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            {title}
          </h2>
        </div>
      ) : null}

      {/* Render layout based on displayType */}
      {displayType === "slider" ? (
        <SliderLayout items={itemsToRender} />
      ) : displayType === "slideshow" ? (
        <SlideshowLayout items={itemsToRender} />
      ) : displayType === "list" ? (
        <ListLayout items={itemsToRender} />
      ) : (
        <GridLayout items={itemsToRender} />
      )}
    </section>
  );
}

/**
 * 1. Horizontal Slider Layout:
 * Smooth horizontal scroll with circular left/right buttons and hidden scrollbars
 */
function SliderLayout({ items }: { items: React.ReactNode[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    checkScroll();
    const handleResize = () => checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [checkScroll]);

  const scrollByAmount = (direction: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative group/slider">
      {/* Left button */}
      {canScrollLeft ? (
        <button
          type="button"
          onClick={() => scrollByAmount("left")}
          aria-label="Scroll left"
          className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-20 hidden sm:flex size-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.15)] border border-slate-200/80 hover:bg-slate-50 transition active:scale-95"
        >
          <ChevronLeft className="size-5" />
        </button>
      ) : null}

      {/* Track */}
      <div
        ref={scrollerRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 scrollbar-none snap-x -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {items.map((item, idx) => (
          <div
            key={idx}
            className="w-[240px] sm:w-[280px] md:w-[320px] shrink-0 snap-start"
          >
            {item}
          </div>
        ))}
      </div>

      {/* Right button */}
      {canScrollRight ? (
        <button
          type="button"
          onClick={() => scrollByAmount("right")}
          aria-label="Scroll right"
          className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-20 hidden sm:flex size-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.15)] border border-slate-200/80 hover:bg-slate-50 transition active:scale-95"
        >
          <ChevronRight className="size-5" />
        </button>
      ) : null}
    </div>
  );
}

/**
 * 2. Slideshow Layout:
 * Auto-advancing full-width card carousel with dots
 */
function SlideshowLayout({ items }: { items: React.ReactNode[] }) {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % items.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [items.length]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-sm">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${activeIdx * 100}%)` }}
      >
        {items.map((item, idx) => (
          <div key={idx} className="w-full shrink-0">
            {item}
          </div>
        ))}
      </div>

      {/* Dots Indicator */}
      {items.length > 1 ? (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={`size-2 rounded-full transition-all ${
                i === activeIdx ? "bg-white w-5 shadow-xs" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * 3. List Layout:
 * Clean stacked cards with generous spacing
 */
function ListLayout({ items }: { items: React.ReactNode[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {items.map((item, idx) => (
        <div key={idx} className="w-full">
          {item}
        </div>
      ))}
    </div>
  );
}

/**
 * 4. Grid Layout:
 * 2 columns on mobile, 3/4 columns on tablet & desktop
 */
function GridLayout({ items }: { items: React.ReactNode[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
      {items.map((item, idx) => (
        <div key={idx} className="w-full">
          {item}
        </div>
      ))}
    </div>
  );
}
