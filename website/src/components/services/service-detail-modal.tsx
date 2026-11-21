"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  Star,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Wrench,
  AlertCircle,
  Loader2,
  Calendar,
} from "lucide-react";
import { useServiceModal } from "@/context/service-modal-context";
import { AddToCartButton } from "@/components/services/add-to-cart-button";
import { ServiceReviewsSection } from "@/components/reviews/service-reviews-section";
import {
  getActiveVariations,
  getServicePrice,
  getVariationImage,
} from "@/lib/services/pricing";
import { getServiceImage, getServiceName } from "@/lib/services/helpers";
import Link from "next/link";
import { getBookPath } from "@/lib/catalog/slug";

function normalizeProcessStepImageUri(raw: unknown): string | null {
  if (raw == null) return null;
  const s = typeof raw === "string" ? raw.trim() : String(raw).trim();
  if (!s || s.toLowerCase() === "null" || s.toLowerCase() === "undefined") {
    return null;
  }
  try {
    if (/^\/\//.test(s)) return new URL(`https:${s}`).href;
    if (/^https?:\/\//i.test(s)) return new URL(s).href;
    if (/^data:image\//i.test(s)) return s;
  } catch {
    return null;
  }
  return null;
}

export function ServiceDetailModal() {
  const { isOpen, service, loading, error, closeServiceModal } = useServiceModal();
  const variationsRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Swipe-to-dismiss states for mobile
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchDeltaY, setTouchDeltaY] = useState(0);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeServiceModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeServiceModal]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Touch handlers for pull-down dismiss on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (sheetRef.current && sheetRef.current.scrollTop <= 5) {
      setTouchStartY(e.touches[0].clientY);
    } else {
      setTouchStartY(null);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    if (diff > 0) {
      setTouchDeltaY(diff);
    } else {
      setTouchDeltaY(0);
    }
  };

  const handleTouchEnd = () => {
    if (touchDeltaY > 100) {
      closeServiceModal();
    }
    setTouchStartY(null);
    setTouchDeltaY(0);
  };

  // Scroll controls for variations
  const scrollVariations = (direction: "left" | "right") => {
    if (variationsRef.current) {
      const scrollAmount = 260;
      variationsRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const anyService = (service || {}) as Record<string, unknown>;
  const name = service ? getServiceName(service) : "Service Details";
  const img = service ? getServiceImage(service) : null;
  const variations = service ? getActiveVariations(service) : [];
  const hasVariations = variations.length > 0;

  // Rating & Review count
  const ratingRaw = Number(
    anyService.rating || anyService.avgRating || anyService.starRating || 4.81,
  );
  const rating =
    Number.isFinite(ratingRaw) && ratingRaw > 0
      ? ratingRaw.toFixed(ratingRaw % 1 === 0 ? 1 : 2)
      : "4.81";

  const reviewsRaw = Number(
    anyService.reviewCount ||
      anyService.reviewsCount ||
      anyService.totalReviews ||
      anyService.totalBookings ||
      1420,
  );
  let reviewsStr = "1.4K";
  if (reviewsRaw >= 1000000) {
    reviewsStr = `${(reviewsRaw / 1000000).toFixed(1)}M`;
  } else if (reviewsRaw >= 1000) {
    reviewsStr = `${(reviewsRaw / 1000).toFixed(reviewsRaw % 1000 === 0 ? 0 : 1)}K`;
  } else if (reviewsRaw > 0) {
    reviewsStr = `${reviewsRaw}`;
  }

  // Duration
  let durationStr = "45 MINS";
  if (service?.duration) {
    const rawDur = String(service.duration).trim().toUpperCase();
    if (rawDur.includes("MIN") || rawDur.includes("HR") || rawDur.includes("HOUR")) {
      durationStr = rawDur;
    } else if (!isNaN(Number(rawDur))) {
      durationStr = `${rawDur} MINS`;
    } else {
      durationStr = rawDur;
    }
  }

  // Price & MRP
  const basePrice = service ? getServicePrice(service) || 499 : 499;
  const rawMrp = Number(
    anyService.originalPrice ||
      anyService.mrp ||
      anyService.oldPrice ||
      anyService.compareAtPrice ||
      0,
  );
  const originalPrice = rawMrp > basePrice ? rawMrp : Math.round(basePrice * 1.18);

  // Brand Image URL
  const brandImg =
    String(
      anyService.brandImage ||
        anyService.brandBanner ||
        anyService.brandSectionImage ||
        anyService.brandImageUrl ||
        "",
    ).trim() || null;

  return (
    <div className="fixed inset-0 z-999 flex items-end justify-center md:items-center p-0 md:p-6 select-none sm:select-auto">
      {/* Semi-transparent background overlay */}
      <div
        onClick={closeServiceModal}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      {/* Slide-Up Bottom Sheet (Mobile) & Centered Modal (Desktop) */}
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: touchDeltaY > 0 ? `translateY(${touchDeltaY}px)` : undefined,
          transition: touchDeltaY === 0 ? "transform 0.25s ease-out" : undefined,
        }}
        className="relative z-10 flex flex-col w-full max-h-[92vh] md:max-h-[88vh] md:max-w-2xl lg:max-w-3xl rounded-t-[28px] md:rounded-[28px] bg-white shadow-2xl overflow-hidden transition-transform animate-in slide-in-from-bottom duration-300 md:animate-in md:fade-in md:zoom-in-95"
      >
        {/* Mobile Drag Handle Indicator */}
        <div className="pt-2.5 pb-1 flex justify-center md:hidden shrink-0 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 rounded-full bg-slate-300" />
        </div>

        {/* Floating Close Button */}
        <button
          type="button"
          onClick={closeServiceModal}
          aria-label="Close"
          className="absolute top-3.5 right-3.5 z-20 flex size-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md shadow-md hover:bg-black/70 active:scale-95 transition"
        >
          <X className="size-5" />
        </button>

        {/* Loading State */}
        {loading && !service ? (
          <div className="flex flex-col items-center justify-center p-16 text-slate-400">
            <Loader2 className="size-10 animate-spin text-[#C86A37]" />
            <p className="mt-4 text-sm font-medium text-slate-500">Loading service details...</p>
          </div>
        ) : null}

        {/* Error State */}
        {error && !service ? (
          <div className="p-8 text-center">
            <AlertCircle className="mx-auto size-10 text-red-500 mb-3" />
            <h3 className="text-base font-bold text-slate-900">Couldn’t load service</h3>
            <p className="mt-1 text-sm text-slate-600">{error}</p>
            <button
              type="button"
              onClick={closeServiceModal}
              className="mt-4 rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white"
            >
              Close
            </button>
          </div>
        ) : null}

        {/* Modal Main Scrollable Content Container */}
        {service ? (
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6">
            {/* ======================================================== */}
            {/* 1. SERVICE IMAGE (Large cover image, rounded corners)     */}
            {/* ======================================================== */}
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100">
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img}
                  alt={name}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full flex-col items-center justify-center text-slate-300 bg-slate-50">
                  <Wrench className="size-12 mb-2" />
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                    Repair Series
                  </span>
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* 2. SERVICE TITLE (Title, Rating/Reviews, Duration, Price) */}
            {/* ======================================================== */}
            <div className="border-b border-slate-100 pb-5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {name}
              </h2>

              {/* Star Rating & Duration Row */}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
                <div className="inline-flex items-center gap-1">
                  <Star className="size-3.5 fill-slate-800 text-slate-800 shrink-0" />
                  <span className="font-bold text-slate-900">{rating}</span>
                  <span className="text-slate-500">({reviewsStr} reviews)</span>
                </div>
                <span className="text-slate-300 font-bold">·</span>
                <div className="inline-flex items-center gap-1 text-slate-600">
                  <Clock className="size-3.5 text-slate-400 shrink-0" />
                  <span className="uppercase text-xs font-semibold text-slate-600">{durationStr}</span>
                </div>
              </div>

              {/* Price & Add to Cart button (if single item with no variations) */}
              <div className="mt-3.5 flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-black text-slate-900">
                    ₹{basePrice.toLocaleString("en-IN")}
                  </span>
                  {originalPrice > basePrice ? (
                    <span className="text-sm text-slate-400 line-through font-normal">
                      ₹{originalPrice.toLocaleString("en-IN")}
                    </span>
                  ) : null}
                  {hasVariations ? (
                    <span className="text-xs text-slate-500 font-medium">starting price</span>
                  ) : null}
                </div>

                {!hasVariations ? (
                  <div>
                    <AddToCartButton
                      service={service}
                      variant="urbanFloating"
                      className="scale-105"
                    />
                  </div>
                ) : null}
              </div>

              {service.description ? (
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {service.description}
                </p>
              ) : null}
            </div>

            {/* ======================================================== */}
            {/* 3. VARIATIONS (If Available - Horizontally Sliding Cards) */}
            {/* ======================================================== */}
            {hasVariations ? (
              <div className="border-b border-slate-100 pb-6">
                <div className="flex items-center justify-between mb-3.5">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Select Option ({variations.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Choose the service option that fits your requirement
                    </p>
                  </div>
                  {/* Left / Right horizontal navigation buttons for desktop */}
                  {variations.length > 2 ? (
                    <div className="hidden sm:flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => scrollVariations("left")}
                        aria-label="Scroll left"
                        className="flex size-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs active:scale-95"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollVariations("right")}
                        aria-label="Scroll right"
                        className="flex size-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs active:scale-95"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* Horizontally scrollable variation cards container */}
                <div
                  ref={variationsRef}
                  className="flex gap-3.5 overflow-x-auto pb-2 pt-1 scrollbar-none snap-x"
                >
                  {variations.map((v) => {
                    const varImg = getVariationImage(v);
                    const varMrp = v.originalPrice;
                    const showStrike = varMrp != null && Number(varMrp) > Number(v.price);
                    return (
                      <div
                        key={v.id}
                        className="w-[210px] sm:w-[230px] shrink-0 snap-start flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs hover:border-[#C86A37]/50 hover:shadow-md transition-all duration-200"
                      >
                        <div>
                          {/* Variation Thumbnail if available */}
                          {varImg ? (
                            <div className="mb-2.5 aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={varImg}
                                alt={v.title}
                                className="size-full object-cover"
                              />
                            </div>
                          ) : null}

                          {/* Variation Title */}
                          <h4 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">
                            {v.title || v.name}
                          </h4>

                          {/* Tagline / short description if available */}
                          {v.tagline ? (
                            <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-tight">
                              {v.tagline}
                            </p>
                          ) : null}
                        </div>

                        {/* Price & Add to Cart button row */}
                        <div className="mt-3.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-sm sm:text-base text-slate-900">
                              ₹{Math.round(v.price).toLocaleString("en-IN")}
                            </span>
                            {showStrike ? (
                              <span className="ml-1.5 text-xs text-slate-400 line-through">
                                ₹{Math.round(Number(varMrp)).toLocaleString("en-IN")}
                              </span>
                            ) : null}
                          </div>
                          <div>
                            <AddToCartButton
                              service={service}
                              variationId={v.id}
                              variant="urbanFloating"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* ======================================================== */}
            {/* 4. OUR PROCESS (Process steps dynamically loaded)         */}
            {/* ======================================================== */}
            {Array.isArray(service.processSteps) && service.processSteps.length > 0 ? (
              <div className="border-b border-slate-100 pb-6">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Sparkles className="size-4.5 text-[#C86A37]" />
                  <span>Our Process</span>
                </h3>
                <div className="space-y-4">
                  {service.processSteps.map((step, idx) => {
                    const stepTitle = String(step?.title || "").trim();
                    const stepDesc = String(step?.description || "").trim();
                    const stepImgUri = normalizeProcessStepImageUri(
                      step?.image ?? step?.imageUrl,
                    );
                    if (!stepTitle && !stepDesc && !stepImgUri) return null;
                    const isLast = idx === service.processSteps!.length - 1;

                    return (
                      <div key={idx} className="flex items-start gap-3.5">
                        <div className="flex flex-col items-center shrink-0">
                          <span className="flex size-7 items-center justify-center rounded-full bg-[#C86A37] text-xs font-bold text-white shadow-xs">
                            {idx + 1}
                          </span>
                          {!isLast ? (
                            <span className="w-0.5 min-h-[36px] flex-1 bg-slate-200 mt-1" />
                          ) : null}
                        </div>
                        <div className="flex-1 pb-2">
                          {stepImgUri ? (
                            <div className="mb-2.5 aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-100 border border-slate-100">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={stepImgUri}
                                alt={stepTitle || `Step ${idx + 1}`}
                                className="size-full object-cover"
                              />
                            </div>
                          ) : null}
                          {stepTitle ? (
                            <h4 className="font-semibold text-sm sm:text-base text-slate-900">
                              {stepTitle}
                            </h4>
                          ) : null}
                          {stepDesc ? (
                            <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                              {stepDesc}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* ======================================================== */}
            {/* 5. KEY POINTS (Highlights with icons loaded dynamically)  */}
            {/* ======================================================== */}
            {Array.isArray(service.keyPoints) && service.keyPoints.length > 0 ? (
              <div className="border-b border-slate-100 pb-6">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3.5 flex items-center gap-2">
                  <CheckCircle2 className="size-4.5 text-emerald-600" />
                  <span>Key Highlights</span>
                </h3>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {service.keyPoints.map((point, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 rounded-xl bg-slate-50/80 p-3 border border-slate-100"
                    >
                      <CheckCircle2 className="mt-0.5 size-4 text-emerald-600 shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-slate-700 leading-snug">
                        {typeof point === "string" ? point : (point as { title?: string; point?: string }).title || (point as { point?: string }).point}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* ======================================================== */}
            {/* 6. BRAND SECTION (One full-width brand image)             */}
            {/* ======================================================== */}
            {brandImg ? (
              <div className="border-b border-slate-100 pb-6">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3">
                  Authorized Brand Service
                </h3>
                <div className="w-full overflow-hidden rounded-2xl border border-slate-100 shadow-xs bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={brandImg}
                    alt={name}
                    className="w-full h-auto max-h-[260px] object-cover"
                  />
                </div>
              </div>
            ) : null}

            {/* ======================================================== */}
            {/* 7. REVIEWS SECTION (Customer ratings and reviews)        */}
            {/* ======================================================== */}
            <div className="pt-2">
              <ServiceReviewsSection
                serviceId={service.id}
                serviceName={name}
                initialRating={service.rating}
                initialReviewCount={service.reviewCount}
                initialDistribution={
                  service.ratingDistribution as Record<number, number> | undefined
                }
              />
            </div>
          </div>
        ) : null}

        {/* Modal Sticky Bottom Action Bar */}
        {service ? (
          <div className="sticky bottom-0 z-20 border-t border-slate-100 bg-white/95 backdrop-blur-md px-5 py-3 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
            <div>
              <div className="text-[11px] font-medium text-slate-500">Service Price</div>
              <div className="text-base sm:text-lg font-bold text-slate-900">
                ₹{basePrice.toLocaleString("en-IN")}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AddToCartButton
                service={service}
                variant="urbanFloating"
              />
              <Link
                href={getBookPath(service)}
                onClick={closeServiceModal}
                className="inline-flex h-9 sm:h-10 items-center justify-center rounded-xl bg-[#C86A37] hover:bg-[#A85028] px-4 text-xs sm:text-sm font-bold text-white shadow-xs transition active:scale-95"
              >
                Book Now
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
