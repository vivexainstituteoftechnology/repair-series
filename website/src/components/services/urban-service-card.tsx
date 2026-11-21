"use client";

import Link from "next/link";
import { Star, Wrench } from "lucide-react";
import { AddToCartButton } from "@/components/services/add-to-cart-button";
import type { ServiceDoc } from "@/lib/booking/types";
import { getBookPath, getServicePath } from "@/lib/catalog/slug";
import { serviceHasVariations, getServicePrice } from "@/lib/services/pricing";
import { getServiceImage, getServiceName } from "@/lib/services/helpers";
import { CAROUSEL_CARD_WIDTH } from "@/components/services/service-carousel";

type UrbanServiceCardProps = {
  service: ServiceDoc;
  href?: string;
  badge?: string | null;
  className?: string;
  widthClass?: string;
  onClick?: (e: React.MouseEvent) => void;
};

export function UrbanServiceCard({
  service,
  href,
  badge,
  className = "",
  widthClass = CAROUSEL_CARD_WIDTH,
  onClick,
}: UrbanServiceCardProps) {
  const name = getServiceName(service);
  const img = getServiceImage(service);
  const targetHref =
    href || (serviceHasVariations(service) ? getServicePath(service) : getBookPath(service));

  const anyS = service as Record<string, unknown>;

  // Rating: e.g. 4.81 or 4.8
  const ratingRaw = Number(anyS.rating || anyS.avgRating || anyS.starRating || 4.81);
  const rating =
    Number.isFinite(ratingRaw) && ratingRaw > 0
      ? ratingRaw.toFixed(ratingRaw % 1 === 0 ? 1 : 2)
      : "4.81";

  // Reviews count: e.g. (8.2M) or (1.4K)
  const reviewsRaw = Number(
    anyS.reviewCount || anyS.reviewsCount || anyS.totalReviews || anyS.totalBookings || 1420,
  );
  let reviewsStr = "1.4K";
  if (reviewsRaw >= 1000000) {
    reviewsStr = `${(reviewsRaw / 1000000).toFixed(1)}M`;
  } else if (reviewsRaw >= 1000) {
    reviewsStr = `${(reviewsRaw / 1000).toFixed(reviewsRaw % 1000 === 0 ? 0 : 1)}K`;
  } else if (reviewsRaw > 0) {
    reviewsStr = `${reviewsRaw}`;
  }

  // Duration: e.g. "60 MINS"
  let durationStr = "45 MINS";
  if (service.duration) {
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
  const price = getServicePrice(service) || 499;
  const rawMrp = Number(
    anyS.originalPrice || anyS.mrp || anyS.oldPrice || anyS.compareAtPrice || 0,
  );
  const originalPrice = rawMrp > price ? rawMrp : Math.round(price * 1.18);

  return (
    <div
      className={`group flex flex-col transition-all duration-200 select-none ${widthClass} ${className}`}
    >
      {/* 1. Rounded Top Image Container with Overlaid "Add" Button */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100">
        <Link href={targetHref} onClick={onClick} className="block size-full">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={name}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-slate-300 bg-slate-50">
              <Wrench className="size-10" />
            </div>
          )}
        </Link>

        {/* Optional Badge */}
        {badge ? (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-[#C86A37] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
            {badge}
          </span>
        ) : null}

        {/* Floating "Add" Button in bottom-right corner */}
        <div className="absolute bottom-2.5 right-2.5 z-10">
          <AddToCartButton service={service} variant="urbanFloating" />
        </div>
      </div>

      {/* 2. Service Details */}
      <div className="pt-2.5 pb-1 flex flex-col flex-1">
        {/* Title */}
        <Link href={targetHref} onClick={onClick} className="block">
          <h3 className="font-semibold text-sm sm:text-[15px] text-slate-900 line-clamp-2 leading-snug group-hover:text-slate-950 transition-colors">
            {name}
          </h3>
        </Link>

        {/* Rating & Duration Row: ★ 4.81 (8.2M) · 60 MINS */}
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Star className="size-3 fill-slate-700 text-slate-700 shrink-0" />
          <span className="font-semibold text-slate-800">{rating}</span>
          <span className="text-slate-500">({reviewsStr})</span>
          <span className="text-slate-400 font-bold">·</span>
          <span className="uppercase text-[11px] font-semibold text-slate-500">{durationStr}</span>
        </div>

        {/* Price Row: ₹958  ₹1,098 */}
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-bold text-sm sm:text-base text-slate-900">
            ₹{price.toLocaleString("en-IN")}
          </span>
          {originalPrice > price ? (
            <span className="text-xs sm:text-sm text-slate-400 line-through font-normal">
              ₹{originalPrice.toLocaleString("en-IN")}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
