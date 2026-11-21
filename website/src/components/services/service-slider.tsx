"use client";

import {
  ServiceCarousel,
  CAROUSEL_CARD_WIDTH,
} from "@/components/services/service-carousel";
import { UrbanServiceCard } from "@/components/services/urban-service-card";
import type { ServiceDoc } from "@/lib/booking/types";

type ServiceSliderProps = {
  services: ServiceDoc[];
};

export function ServiceSlider({ services }: ServiceSliderProps) {
  if (services.length === 0) return null;

  return (
    <ServiceCarousel>
      {services.map((s) => (
        <UrbanServiceCard
          key={s.id}
          service={s}
          widthClass={CAROUSEL_CARD_WIDTH}
        />
      ))}
    </ServiceCarousel>
  );
}
