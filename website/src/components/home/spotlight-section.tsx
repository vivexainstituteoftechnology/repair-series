"use client";

import Link from "next/link";
import { useRef, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Plus,
  Check,
  Wrench,
  Sparkles,
} from "lucide-react";
import { AddToCartButton } from "@/components/services/add-to-cart-button";
import { ServicePrice } from "@/components/services/service-price";
import type { ServiceDoc } from "@/lib/booking/types";
import { getBookPath, getServicePath } from "@/lib/catalog/slug";
import { serviceHasVariations } from "@/lib/services/pricing";
import { getServiceImage, getServiceName } from "@/lib/services/helpers";

type SpotlightSectionProps = {
  services: ServiceDoc[];
  title?: string;
  subtitle?: string;
};

export function SpotlightSection({
  services,
  title = "In the spotlight",
  subtitle = "Handpicked household services booked by thousands of customers daily",
}: SpotlightSectionProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const spotlightItems = useMemo(() => {
    if (!services || services.length === 0) return [];

    // Filter active services and sort by popularity / rating
    return [...services]
      .filter((s) => String((s as { status?: string }).status ?? "Active") === "Active")
      .slice(0, 10);
  }, [services]);

  const scroll = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  if (spotlightItems.length === 0) return null;

  return (
    <section className="py-8 border-t border-slate-100">
      <div className="flex items-end justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              {title}
            </h2>
            <span className="flex size-2 rounded-full bg-[#C86A37] animate-pulse" />
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
            {subtitle}
          </p>
        </div>

        {/* Desktop Carousel Controls */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
            className="flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Scroll right"
            className="flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={trackRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto scroll-smooth pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {spotlightItems.map((s) => {
          const name = getServiceName(s);
          const img = getServiceImage(s);
          const href = serviceHasVariations(s) ? getServicePath(s) : getBookPath(s);
          const rating = (s as { rating?: number }).rating || 4.8;
          const reviewsCount = (s as { reviewsCount?: number }).reviewsCount || 1420;

          return (
            <div
              key={s.id}
              className="group relative flex w-[230px] sm:w-[260px] shrink-0 flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:border-slate-300 hover:shadow-md transition-all duration-200"
            >
              <div>
                {/* Image Container with Rating Pill */}
                <Link href={href} className="relative block aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 mb-3">
                  {img ? (
                    <img
                      src={img}
                      alt={name}
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-slate-300">
                      <Wrench className="size-10" />
                    </div>
                  )}

                  {/* Rating Badge Overlay */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-white/95 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-slate-900 shadow-xs">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    <span>{rating}</span>
                    <span className="text-slate-400 font-medium">({(reviewsCount / 1000).toFixed(1)}k)</span>
                    {s.duration ? (
                      <>
                        <span className="text-slate-300 font-black">•</span>
                        <span className="uppercase text-[9px] font-bold text-slate-600">{s.duration}</span>
                      </>
                    ) : null}
                  </div>
                </Link>

                {/* Service Name */}
                <Link href={href}>
                  <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-[#C86A37] transition-colors line-clamp-2 leading-snug">
                    {name}
                  </h3>
                </Link>
              </div>

              {/* Price & Add to Cart Action */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Starts at</span>
                  <ServicePrice service={s} className="font-extrabold text-slate-900 text-sm" />
                </div>

                <div className="shrink-0">
                  <AddToCartButton
                    service={s}
                    size="sm"
                    className="h-8 rounded-xl font-bold px-3 bg-[#FFF7ED] text-[#C86A37] border border-[#FED7AA] hover:bg-[#C86A37] hover:text-white transition-colors"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
