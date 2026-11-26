"use client";

import React from "react";

// ==========================================
// 1. BASE SKELETON WITH SHIMMER SWEEP
// ==========================================
export function Skeleton({
  className = "",
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={`relative overflow-hidden bg-slate-200/80 dark:bg-slate-800/80 animate-shimmer rounded-xl select-none ${className}`}
      {...props}
    />
  );
}

// ==========================================
// 2. TEXT SKELETON
// ==========================================
export function SkeletonText({
  lines = 2,
  className = "",
  lineClassName = "",
}: {
  lines?: number;
  className?: string;
  lineClassName?: string;
}) {
  const widths = ["w-full", "w-4/5", "w-3/5", "w-2/3", "w-1/2"];
  return (
    <div aria-hidden="true" className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 rounded-md ${widths[i % widths.length]} ${lineClassName}`}
        />
      ))}
    </div>
  );
}

// ==========================================
// 3. IMAGE SKELETON
// ==========================================
export function SkeletonImage({
  className = "w-full aspect-video rounded-2xl",
}: {
  className?: string;
}) {
  return <Skeleton className={className} />;
}

// ==========================================
// 4. BUTTON SKELETON
// ==========================================
export function SkeletonButton({
  className = "h-11 w-32 rounded-xl",
}: {
  className?: string;
}) {
  return <Skeleton className={className} />;
}

// ==========================================
// 5. AVATAR SKELETON
// ==========================================
export function SkeletonAvatar({
  className = "size-10 rounded-full",
}: {
  className?: string;
}) {
  return <Skeleton className={`rounded-full ${className}`} />;
}

// ==========================================
// 6. CATEGORY CARD SKELETON
// ==========================================
export function SkeletonCategoryCard({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`flex flex-col items-center p-3 rounded-2xl border border-slate-200/80 bg-white shadow-2xs ${className}`}
    >
      <Skeleton className="size-14 rounded-2xl mb-2.5" />
      <Skeleton className="h-3.5 w-16 rounded-md mb-1" />
      <Skeleton className="h-3 w-10 rounded-md" />
    </div>
  );
}

// ==========================================
// 7. SERVICE CARD SKELETON (Matches UrbanServiceCard / LocalServiceCard)
// ==========================================
export function SkeletonServiceCard({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] ${className}`}
    >
      {/* Top Image area with badges */}
      <div className="relative mb-3.5 h-44 w-full overflow-hidden rounded-xl bg-slate-100">
        <Skeleton className="size-full rounded-xl" />
        <div className="absolute top-2.5 left-2.5">
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="absolute top-2.5 right-2.5">
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>

      {/* Card Content */}
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-3/5 rounded-md" />
          <Skeleton className="h-5 w-14 rounded-md" />
        </div>

        <Skeleton className="h-3.5 w-4/5 rounded-md" />

        {/* Bullet points */}
        <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5">
            <Skeleton className="size-3 rounded-full shrink-0" />
            <Skeleton className="h-3 w-4/5 rounded" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="size-3 rounded-full shrink-0" />
            <Skeleton className="h-3 w-3/5 rounded" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="size-3 rounded-full shrink-0" />
            <Skeleton className="h-3 w-2/3 rounded" />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-20 rounded" />
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>
    </div>
  );
}

// ==========================================
// 8. HERO MARKETPLACE SKELETON
// ==========================================
export function SkeletonHeroMarketplace({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`my-4 sm:my-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 ${className}`}
    >
      {/* Left split: Category Grid Card */}
      <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-44 rounded-md" />
              <Skeleton className="h-3.5 w-64 rounded-md" />
            </div>
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>

          {/* 3x3 or 4x2 Category Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {Array.from({ length: 8 }).map((_, idx) => (
              <SkeletonCategoryCard key={idx} />
            ))}
          </div>
        </div>

        {/* Bottom micro-banner */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <Skeleton className="h-4 w-48 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
      </div>

      {/* Right split: Promotional Banners Slider */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="relative min-h-[260px] sm:min-h-[300px] lg:min-h-full rounded-3xl overflow-hidden border border-slate-200/90 bg-slate-100 shadow-sm">
          <Skeleton className="size-full min-h-[280px] rounded-3xl" />
          <div className="absolute bottom-6 left-6 space-y-2 max-w-xs">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-7 w-52 rounded-md" />
            <Skeleton className="h-4 w-40 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 9. REVIEW CARD SKELETON
// ==========================================
export function SkeletonReviewCard({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex flex-col justify-between ${className}`}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="size-4 rounded-sm" />
          ))}
        </div>
        <SkeletonText lines={3} />
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
      </div>
    </div>
  );
}

// ==========================================
// 10. SECTION SKELETON (Header + Cards Grid)
// ==========================================
export function SkeletonSection({
  title,
  cardCount = 3,
  className = "",
}: {
  title?: string;
  cardCount?: number;
  className?: string;
}) {
  return (
    <section aria-hidden="true" className={`pt-6 pb-10 border-t border-slate-200/80 ${className}`}>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-32 rounded-full" />
          {title ? (
            <h3 className="text-xl sm:text-2xl font-black text-slate-800">{title}</h3>
          ) : (
            <Skeleton className="h-7 w-64 sm:w-80 rounded-md" />
          )}
          <Skeleton className="h-4 w-48 sm:w-96 rounded-md" />
        </div>
        <Skeleton className="h-7 w-48 rounded-full shrink-0" />
      </div>

      {/* Grid of service cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cardCount }).map((_, i) => (
          <SkeletonServiceCard key={i} />
        ))}
      </div>
    </section>
  );
}

// ==========================================
// 11. BOOKING CARD SKELETON (Dashboard / History)
// ==========================================
export function SkeletonBookingCard({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-3 w-36 rounded" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      <div className="flex items-center gap-3 py-2 border-y border-slate-100">
        <Skeleton className="size-12 rounded-xl shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-48 rounded" />
          <Skeleton className="h-3 w-32 rounded" />
        </div>
        <Skeleton className="h-5 w-16 rounded" />
      </div>

      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-4 w-40 rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-xl" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 12. ADDRESS CARD SKELETON
// ==========================================
export function SkeletonAddressCard({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm flex items-start justify-between gap-4 ${className}`}
    >
      <div className="space-y-2 flex-1">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3.5 w-full rounded" />
        <Skeleton className="h-3.5 w-3/4 rounded" />
        <Skeleton className="h-3 w-28 rounded" />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="size-8 rounded-lg" />
      </div>
    </div>
  );
}

// ==========================================
// 13. CART / CHECKOUT SKELETON
// ==========================================
export function SkeletonCheckoutSummary({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-5 ${className}`}
    >
      <Skeleton className="h-5 w-36 rounded-md" />

      {/* Cart item row */}
      <div className="space-y-3 divide-y divide-slate-100">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between pt-3 first:pt-0">
            <div className="space-y-1">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-20 rounded-lg" />
              <Skeleton className="h-4 w-14 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Bill details */}
      <div className="pt-4 border-t border-slate-100 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3.5 w-24 rounded" />
          <Skeleton className="h-3.5 w-16 rounded" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3.5 w-32 rounded" />
          <Skeleton className="h-3.5 w-12 rounded" />
        </div>
        <div className="flex justify-between pt-2 border-t border-slate-100">
          <Skeleton className="h-5 w-28 rounded" />
          <Skeleton className="h-5 w-20 rounded" />
        </div>
      </div>

      <Skeleton className="h-12 w-full rounded-2xl" />
    </div>
  );
}
