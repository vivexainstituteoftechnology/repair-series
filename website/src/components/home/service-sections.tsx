"use client";

import { useMemo } from "react";
import { Container } from "@/components/container";
import { ServiceSlider } from "@/components/services/service-slider";
import type { ServiceDoc } from "@/lib/booking/types";
import { filterServicesByAnyKeyword, filterServicesByNameKeywords } from "@/lib/search/catalog-search";

function serviceBookingCount(service: ServiceDoc): number {
  const raw = service as ServiceDoc & {
    totalBookings?: number;
    bookingCount?: number;
  };
  const value = raw.totalBookings ?? raw.bookingCount;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function MostBookedSection({ services }: { services: ServiceDoc[] }) {
  const items = useMemo(() => {
    return [...services]
      .sort((a, b) => {
        const diff = serviceBookingCount(b) - serviceBookingCount(a);
        if (diff !== 0) return diff;
        return getServiceName(a).localeCompare(getServiceName(b));
      })
      .slice(0, 12);
  }, [services]);

  if (items.length === 0) return null;

  return (
    <section id="most-booked" className="border-t border-slate-100 py-10">
      <div className="w-full">
        <div className="mb-8">
          <span className="text-sm font-bold uppercase tracking-wide text-[#C86A37]">
            Trending
          </span>
          <h2 className="mt-1 text-3xl font-bold text-[#0a0f1c]">Most Booked Services</h2>
          <p className="mt-2 text-[#64748b]">
            Popular services trusted by households across Gurugram, Hyderabad & Aligarh.
          </p>
        </div>
        <ServiceSlider services={items} />
      </div>
    </section>
  );
}

function getServiceName(s: ServiceDoc): string {
  return String(s.name ?? s.title ?? "").trim();
}

export function CleaningEssentialsSection({ services }: { services: ServiceDoc[] }) {
  const items = useMemo(
    () => filterServicesByNameKeywords(services, ["cleaning"]),
    [services],
  );

  if (items.length === 0) return null;

  return (
    <section id="cleaning" className="border-t border-slate-100 py-10">
      <div className="w-full">
        <div className="mb-8">
          <span className="text-sm font-bold uppercase tracking-wide text-[#C86A37]">
            Home Care
          </span>
          <h2 className="mt-1 text-3xl font-bold text-[#0a0f1c]">Cleaning Essentials</h2>
        </div>
        <ServiceSlider services={items} />
      </div>
    </section>
  );
}

export function ApplianceRepairSection({ services }: { services: ServiceDoc[] }) {
  const items = useMemo(
    () => filterServicesByAnyKeyword(services, ["repair", "service", "check-up", "checkup"]),
    [services],
  );

  if (items.length === 0) return null;

  return (
    <section id="appliance-repair" className="border-t border-slate-100 py-10">
      <div className="w-full">
        <div className="mb-8">
          <span className="text-sm font-bold uppercase tracking-wide text-[#C86A37]">
            Expert Fixes
          </span>
          <h2 className="mt-1 text-3xl font-bold text-[#0a0f1c]">
            Appliance Repair &amp; Service
          </h2>
        </div>
        <ServiceSlider services={items} />
      </div>
    </section>
  );
}
