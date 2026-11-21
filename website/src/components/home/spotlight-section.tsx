"use client";

import { useMemo } from "react";
import {
  ServiceCarousel,
  CAROUSEL_CARD_WIDTH,
} from "@/components/services/service-carousel";
import { UrbanServiceCard } from "@/components/services/urban-service-card";
import type { ServiceDoc } from "@/lib/booking/types";

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
  const spotlightItems = useMemo(() => {
    if (!services || services.length === 0) return [];

    // Filter active services and sort by popularity / rating
    return [...services]
      .filter((s) => String((s as { status?: string }).status ?? "Active") === "Active")
      .slice(0, 10);
  }, [services]);

  if (spotlightItems.length === 0) return null;

  return (
    <section className="py-8 border-t border-slate-100">
      <div className="mb-5">
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

      <ServiceCarousel>
        {spotlightItems.map((s) => (
          <UrbanServiceCard
            key={s.id}
            service={s}
            widthClass={CAROUSEL_CARD_WIDTH}
          />
        ))}
      </ServiceCarousel>
    </section>
  );
}
