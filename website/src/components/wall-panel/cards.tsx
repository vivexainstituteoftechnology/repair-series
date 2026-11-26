"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Layers, ArrowUpRight } from "lucide-react";
import type {
  WallPanelCategory,
  WallPanelProduct,
  WallPanelCustomCard,
} from "@/lib/wall-panel/models";

/**
 * Category Card (Requirement 2.A):
 * - Category image.
 * - Category title positioned at bottom-left.
 * - Clicking a category opens its dedicated product listing page.
 */
export function WallPanelCategoryCard({
  category,
  className = "",
}: {
  category: WallPanelCategory;
  className?: string;
}) {
  return (
    <Link
      href={`/wall-panel/category/${category.id}`}
      className={`group relative flex flex-col justify-end overflow-hidden rounded-2xl bg-slate-900 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 aspect-[4/5] sm:aspect-[3/4] select-none ${className}`}
    >
      {/* Background Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={category.image}
        alt={category.title || category.name}
        className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        loading="lazy"
      />

      {/* Gradient Overlay for bottom-left title contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-opacity duration-300" />

      {/* Content at Bottom-Left */}
      <div className="relative z-10 p-4 sm:p-5 text-left">
        {category.tags && category.tags.length > 0 ? (
          <span className="inline-block rounded-full bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider mb-2 border border-white/25">
            {category.tags[0]}
          </span>
        ) : null}
        <h3 className="font-extrabold text-base sm:text-lg text-white leading-snug drop-shadow-sm group-hover:text-[#F3C7A8] transition-colors">
          {category.title || category.name}
        </h3>
        {category.description ? (
          <p className="mt-1 line-clamp-1 text-xs text-white/80 font-medium leading-relaxed">
            {category.description}
          </p>
        ) : null}
      </div>

      {/* Top right subtle action hint */}
      <div className="absolute top-3 right-3 z-10 flex size-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowUpRight className="size-4" />
      </div>
    </Link>
  );
}

/**
 * Product Card (Requirement 2.B):
 * - Product image slideshow.
 * - Product title.
 * - Starting price with dimensions (e.g. Starts at ₹16,999 for 9.5 × 6 ft wall).
 * - Clicking opens product detail page.
 */
export function WallPanelProductCard({
  product,
  className = "",
}: {
  product: WallPanelProduct;
  className?: string;
}) {
  const images =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : ["/placeholder.jpg"];

  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImageIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImageIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <Link
      href={`/wall-panel/${product.id}`}
      className={`group flex flex-col rounded-2xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-xl transition-all duration-300 overflow-hidden select-none ${className}`}
    >
      {/* 1. Slideshow Image Area */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[activeImageIdx]}
          alt={product.title || product.name}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Slideshow Arrows (if multiple images) */}
        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
            >
              <ChevronRight className="size-4" />
            </button>

            {/* Dots indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`size-1.5 rounded-full transition-all ${
                    i === activeImageIdx
                      ? "bg-white w-3 shadow-xs"
                      : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}

        {/* Optional Tag badge */}
        {product.tags && product.tags.length > 0 ? (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-black/50 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white border border-white/20">
            {product.tags[0]}
          </span>
        ) : null}
      </div>

      {/* 2. Product Information */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 line-clamp-1 group-hover:text-[#C45508] transition-colors">
            {product.title || product.name}
          </h3>

          {product.tagline ? (
            <p className="mt-1 line-clamp-1 text-xs text-slate-500 font-medium">
              {product.tagline}
            </p>
          ) : null}
        </div>

        {/* Starting price with dimensions */}
        <div className="mt-3 pt-2.5 border-t border-slate-100">
          <p className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug">
            Starts at{" "}
            <span className="text-[#C45508] font-black text-sm sm:text-base">
              ₹{product.price.toLocaleString("en-IN")}
            </span>{" "}
            <span className="text-slate-500 font-semibold text-[11px] sm:text-xs">
              for {product.dimensions}
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
}

/**
 * Custom Card (Requirement 2.C):
 * - Admin-created cards without requiring an actual category or product card.
 * - Image, title (bottom-left overlay).
 * - Optional serial number (top-left) with glassmorphism styling.
 * - Clicking any custom card redirects to its assigned product detail page.
 */
export function WallPanelCustomCardItem({
  card,
  className = "",
}: {
  card: WallPanelCustomCard;
  className?: string;
}) {
  const targetHref = card.productId ? `/wall-panel/${card.productId}` : "/wall-panel";

  return (
    <Link
      href={targetHref}
      className={`group relative flex flex-col justify-end overflow-hidden rounded-2xl bg-slate-900 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 aspect-[4/5] sm:aspect-[3/4] select-none ${className}`}
    >
      {/* Background Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={card.image}
        alt={card.title}
        className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        loading="lazy"
      />

      {/* Gradient Overlay for bottom-left title contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent transition-opacity duration-300" />

      {/* Top-Left: Optional serial number with glassmorphism styling */}
      {card.serialNumber ? (
        <div className="absolute top-3 left-3 z-10 flex items-center justify-center rounded-xl bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1 text-xs font-black text-white shadow-sm">
          {card.serialNumber}
        </div>
      ) : null}

      {/* Bottom-Left: Title */}
      <div className="relative z-10 p-4 sm:p-5 text-left">
        <h3 className="font-extrabold text-base sm:text-lg text-white leading-snug drop-shadow-sm group-hover:text-[#F3C7A8] transition-colors">
          {card.title}
        </h3>
        <p className="mt-1 text-[11px] font-semibold text-white/75 flex items-center gap-1">
          <span>Explore this look</span>
          <ArrowUpRight className="size-3.5" />
        </p>
      </div>
    </Link>
  );
}
