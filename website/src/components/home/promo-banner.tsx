"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Container } from "@/components/container";
import {
  normalizeBanners,
  subscribeAllBanners,
  type BannerDoc,
  type NormalizedBanner,
} from "@/lib/banners/store";
import { DynamicBannerSlide } from "@/components/banners/dynamic-banner-slide";

function MobileBannerCard({ banner }: { banner: NormalizedBanner }) {
  const hasDynamicContent = Boolean(banner.title || banner.tagline || banner.buttonText || banner.overlay);
  return (
    <div
      className="relative h-[260px] w-[min(100%,380px)] shrink-0 snap-center overflow-hidden rounded-[20px] bg-[#E7E5E4] shadow-[0_12px_28px_rgba(8,15,28,0.12)] transition active:scale-[0.985]"
      aria-label="Promotional banner"
    >
      {hasDynamicContent ? (
        <DynamicBannerSlide banner={banner} deviceMode="mobile" className="size-full" />
      ) : (
        <Link href={banner.href} className="block size-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner.image}
            alt=""
            className="h-full w-full object-cover"
          />
        </Link>
      )}
    </div>
  );
}

function DesktopBannerCard({ banner }: { banner: NormalizedBanner }) {
  const hasDynamicContent = Boolean(banner.title || banner.tagline || banner.buttonText || banner.overlay);
  return (
    <div
      className="relative block min-h-[420px] w-full shrink-0 overflow-hidden rounded-[28px] border border-black/5 bg-[#E7E5E4] shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
      aria-label="Promotional banner"
    >
      {hasDynamicContent ? (
        <DynamicBannerSlide banner={banner} deviceMode="desktop" className="size-full" />
      ) : (
        <Link href={banner.href || "/services"} className="block size-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        </Link>
      )}
    </div>
  );
}

type PromoBannerSectionProps = {
  section?: string | string[];
  mobileOnly?: boolean;
  className?: string;
};

export function PromoBannerSection({
  section = ["home", "offers"],
  mobileOnly = false,
  className = "",
}: PromoBannerSectionProps) {
  const [rows, setRows] = useState<BannerDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const sectionKey = Array.isArray(section)
    ? section.filter(Boolean).join("|")
    : String(section ?? "");

  const sections = useMemo(() => {
    if (section == null) return null;
    if (!sectionKey) return [];
    return sectionKey.split("|");
  }, [section, sectionKey]);

  useEffect(() => {
    return subscribeAllBanners((next) => {
      setRows(next);
      setLoading(false);
    });
  }, []);

  const list = useMemo(
    () => normalizeBanners(rows, true, sections),
    [rows, sections],
  );
  const mobileList = useMemo(
    () => normalizeBanners(rows, false, sections),
    [rows, sections],
  );

  // No empty/broken placeholder: hide until we have at least one image.
  if (loading && !list.length && !mobileList.length) return null;
  if (!list.length && !mobileList.length) return null;

  const mobileItems = mobileList.length ? mobileList : list;

  return (
    <>
      <section className={`px-4 py-3 md:hidden ${className}`}>
        <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {mobileItems.map((b) => (
            <MobileBannerCard key={b.id} banner={b} />
          ))}
        </div>
      </section>

      {!mobileOnly && list.length > 0 ? (
        <section className={`hidden py-6 md:block ${className}`}>
          <div className="w-full">
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {list.map((b) => (
                <div key={b.id} className="min-w-full snap-center">
                  <DesktopBannerCard banner={b} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

/** Same carousel as home top — for any section placement. */
export function SectionPromoBanner({
  section,
  className,
}: {
  section: string | string[];
  className?: string;
}) {
  return (
    <PromoBannerSection section={section} mobileOnly className={className} />
  );
}
