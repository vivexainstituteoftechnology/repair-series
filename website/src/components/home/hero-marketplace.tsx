"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Wrench,
  Layers,
  Flame,
  Award,
} from "lucide-react";
import { getCategoryPath } from "@/lib/catalog/slug";
import type { HomeBannerDoc } from "@/lib/home-sections/resolve";
import { DynamicBannerSlide } from "@/components/banners/dynamic-banner-slide";
import { useServiceModal } from "@/context/service-modal-context";
import { isWallPanelCatalogItem } from "@/lib/catalog/wallPanel";

type CategoryDoc = {
  id: string;
  name?: string;
  title?: string;
  icon?: string;
  image?: string;
  imageUrl?: string;
  homeImage?: string;
  slug?: string;
  desc?: string;
  active?: boolean;
  isActive?: boolean;
  serviceTypeId?: string;
};

export type HeroMarketplaceItem = {
  id: string;
  itemType: "service" | "category" | "serviceType" | "serviceCategory" | string;
  targetId: string;
  title?: string;
  image?: string;
  badge?: string;
  visible?: boolean;
  displayOrder?: number;
  href?: string;
};

type HeroMarketplaceProps = {
  categories: CategoryDoc[];
  services?: any[];
  serviceTypes?: CategoryDoc[];
  serviceCategories?: CategoryDoc[];
  banners?: HomeBannerDoc[];
  customItems?: HeroMarketplaceItem[];
  onSelectServiceType?: (id: string) => void;
};

// High-fidelity curated service cards with estimated arrival times & realistic 3D icons (matching Urban Company reference)
const CURATED_DEFAULT_CATEGORIES = [
  {
    id: "ac-appliance",
    name: "AC & Appliance Repair",
    time: "30 mins",
    iconBg: "bg-blue-50 text-blue-600 border-blue-100",
    badge: "30 mins",
    keywords: ["ac", "appliance", "air conditioner"],
    img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "electrician-plumber",
    name: "Electrician, Plumber & Carpenter",
    time: "25 mins",
    iconBg: "bg-amber-50 text-amber-600 border-amber-100",
    badge: "25 mins",
    keywords: ["electrician", "plumber", "carpenter"],
    img: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "washing-fridge",
    name: "Washing Machine & Refrigerator",
    time: "45 mins",
    iconBg: "bg-cyan-50 text-cyan-600 border-cyan-100",
    badge: "45 mins",
    keywords: ["washing", "refrigerator", "fridge"],
    img: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "cleaning-pest",
    name: "Cleaning & Pest Control",
    time: "45 mins",
    iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
    badge: "45 mins",
    keywords: ["cleaning", "pest", "deep cleaning"],
    img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "wall-panels",
    name: "Wall Panels by Repair Series",
    time: "Custom",
    iconBg: "bg-orange-50 text-orange-600 border-orange-100",
    badge: "★ Studio",
    keywords: ["wall panel", "fluted", "charcoal"],
    href: "/wall-panel",
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "kitchen-chimney",
    name: "Kitchen & Chimney Service",
    time: "30 mins",
    iconBg: "bg-rose-50 text-rose-600 border-rose-100",
    badge: "30 mins",
    keywords: ["chimney", "hob", "kitchen"],
    img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "ro-water",
    name: "RO Water Purifier Repair",
    time: "20 mins",
    iconBg: "bg-sky-50 text-sky-600 border-sky-100",
    badge: "20 mins",
    keywords: ["ro", "water purifier", "filter"],
    img: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "painting-upgrade",
    name: "Home Painting & Waterproofing",
    time: "Same Day",
    iconBg: "bg-purple-50 text-purple-600 border-purple-100",
    badge: "Same day",
    keywords: ["painting", "waterproofing"],
    img: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=150&auto=format&fit=crop&q=80",
  },
];

const PROMISES = [
  "Trained & experienced professionals",
  "Vetted & background-verified",
  "Transparent & fixed pricing",
  "Unconditional warranty on all repair jobs",
];

const DEFAULT_PROMO_SLIDES = [
  {
    title: "Get 25% off",
    subtitle: "on your first repair booking",
    code: "REPAIR25",
    badge: "Limited Time Offer",
    cta: "Book Service",
    href: "/services",
    bgClass: "from-[#431407] via-[#7E1926] to-[#C86A37]",
    img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80",
  },
  {
    title: "Instant AC Checkup ₹199",
    subtitle: "Complete 18-point inspection & gas check",
    code: "COOL199",
    badge: "Summer Special",
    cta: "Explore AC Care",
    href: "/categories",
    bgClass: "from-[#1E1B4B] via-[#312E81] to-[#4338CA]",
    img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80",
  },
  {
    title: "Wall Panels Studio",
    subtitle: "Transform your living room in 24 hours",
    code: "STUDIO",
    badge: "Designer Collection",
    cta: "View Designs",
    href: "/wall-panel",
    bgClass: "from-[#2A1608] via-[#540D17] to-[#9A3412]",
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80",
  },
];

export function HeroMarketplace({
  categories,
  services = [],
  serviceTypes = [],
  serviceCategories = [],
  banners,
  customItems,
  onSelectServiceType,
}: HeroMarketplaceProps) {
  const { openServiceModal } = useServiceModal();
  const [currentSlide, setCurrentSlide] = useState(0);

  // If customItems configured from Hero Marketplace editor, resolve them dynamically
  const dynamicItems = useMemo(() => {
    if (!customItems || customItems.length === 0) return null;
    const active = customItems
      .filter((it) => it.visible !== false)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    if (active.length === 0) return null;

    return active.map((it, idx) => {
      let resolvedTitle = it.title || "";
      let resolvedImage = it.image || "";
      let resolvedBadge = it.badge || "30 mins";
      let resolvedHref = it.href || "";
      const isService = it.itemType === "service";
      const isServiceType = it.itemType === "serviceType";
      let dbService: any = null;

      if (it.itemType === "service") {
        dbService = (services || []).find((s) => s.id === it.targetId);
        resolvedTitle = it.title || dbService?.name || dbService?.title || "Service";
        resolvedImage = it.image || dbService?.image || dbService?.imageUrl || dbService?.homeImage || "";
        resolvedBadge = it.badge || "45 mins";
      } else if (it.itemType === "category") {
        const cat = (categories || []).find((c) => c.id === it.targetId);
        resolvedTitle = it.title || cat?.name || cat?.title || "Category";
        resolvedImage = it.image || cat?.homeImage || cat?.imageUrl || cat?.image || cat?.icon || "";
        resolvedBadge = it.badge || "30 mins";
        resolvedHref = `/categories/${it.targetId}`;
      } else if (it.itemType === "serviceType") {
        const st = (serviceTypes || []).find((t) => t.id === it.targetId);
        resolvedTitle = it.title || st?.title || st?.name || "Service Type";
        resolvedImage = it.image || st?.homeImage || st?.imageUrl || st?.image || st?.icon || "";
        resolvedBadge = it.badge || "25 mins";
        resolvedHref = "#";
      } else if (it.itemType === "serviceCategory") {
        const sc = (serviceCategories || []).find((c) => c.id === it.targetId);
        resolvedTitle = it.title || sc?.title || sc?.name || "Category";
        resolvedImage = it.image || sc?.homeImage || sc?.imageUrl || sc?.image || sc?.icon || "";
        resolvedBadge = it.badge || "30 mins";
        resolvedHref = `/categories/${it.targetId}`;
      }

      return {
        id: it.id,
        targetId: it.targetId,
        uniqueKey: `dynamic-${it.id}-${idx}`,
        name: resolvedTitle,
        img: resolvedImage,
        badge: resolvedBadge,
        href: resolvedHref,
        isService,
        isServiceType,
        serviceObj: dbService || { id: it.targetId, name: resolvedTitle, title: resolvedTitle, image: resolvedImage },
      };
    });
  }, [customItems, services, categories, serviceTypes, serviceCategories]);

  // Match Firestore categories with curated items or fallback to real categories
  const displayCategories = useMemo(() => {
    if (!categories || categories.length === 0) {
      return CURATED_DEFAULT_CATEGORIES.map((tpl, i) => ({
        ...tpl,
        uniqueKey: `${tpl.id}-${i}`,
      }));
    }

    const usedIds = new Set<string>();

    // Map each curated template to a real category if name matches
    return CURATED_DEFAULT_CATEGORIES.map((tpl, tplIdx) => {
      const match = categories.find((c) => {
        if (usedIds.has(c.id)) return false;
        const cName = String(c.name ?? c.title ?? "").toLowerCase();
        return tpl.keywords.some((kw) => cName.includes(kw));
      });
      if (match) {
        usedIds.add(match.id);
        return {
          ...tpl,
          id: match.id,
          uniqueKey: `cat-${match.id}-${tplIdx}`,
          name: match.name ?? match.title ?? tpl.name,
          href: tpl.href || getCategoryPath(match),
          img: match.homeImage || match.imageUrl || match.image || match.icon || tpl.img,
        };
      }
      return {
        ...tpl,
        uniqueKey: `tpl-${tpl.id}-${tplIdx}`,
      };
    });
  }, [categories]);

  const itemsToRender = dynamicItems || displayCategories;

  // Active slide duration
  const activeSlideDuration = useMemo(() => {
    if (banners && banners.length > 0) {
      const b = banners[currentSlide % banners.length];
      return Number(b?.slideDuration) || 4500;
    }
    return 5000;
  }, [banners, currentSlide]);

  const slideCount = banners && banners.length > 0 ? banners.length : DEFAULT_PROMO_SLIDES.length;

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % slideCount);
    }, activeSlideDuration);
    return () => clearTimeout(timer);
  }, [currentSlide, slideCount, activeSlideDuration]);

  return (
    <section className="pt-2 pb-8 sm:py-8">
      <div className="grid gap-5 lg:gap-6 lg:grid-cols-12 lg:items-stretch">
        {/* LEFT CONTAINER (Desktop) / SECOND (Mobile & Tablet): Service Categories Grid (No outer card on mobile/tablet) */}
        <div className="order-2 lg:order-1 lg:col-span-7 xl:col-span-6 flex flex-col justify-between lg:rounded-3xl lg:border lg:border-slate-200/80 lg:bg-white p-0 lg:p-7 lg:shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
          <div>
            {/* 4 columns across Mobile, Tablet, and Desktop */}
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5">
              {itemsToRender.map((item, idx) => {
                const isService = (item as any).isService;
                const isServiceType = (item as any).isServiceType;
                const href = item.href || (isServiceType ? "#" : `/categories/${item.id}`);

                const handleClick = (e: React.MouseEvent) => {
                  if (isService) {
                    e.preventDefault();
                    openServiceModal((item as any).serviceObj);
                    return;
                  }
                  if (isServiceType) {
                    e.preventDefault();
                    onSelectServiceType?.(String((item as any).targetId || item.id));
                    return;
                  }
                };

                return (
                  <Link
                    key={item.uniqueKey || `${item.id}-${idx}`}
                    href={href}
                    onClick={handleClick}
                    className="group relative flex flex-col items-center text-center p-2.5 sm:p-3.5 rounded-2xl border border-slate-200/80 lg:border-slate-100 bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200"
                  >
                    {/* Time / Speed Badge — Always on top (z-10) across all views */}
                    {item.badge ? (
                      <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black text-emerald-700 border border-emerald-200 shadow-2xs">
                        {item.badge}
                      </span>
                    ) : null}

                    {/* Image / Icon container */}
                    <div className="relative z-0 size-14 sm:size-18 lg:size-20 rounded-xl sm:rounded-2xl overflow-hidden bg-slate-50 border border-slate-100/80 mb-2 sm:mb-2.5 p-0.5 sm:p-1 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                      {item.img ? (
                        <img
                          src={item.img}
                          alt={item.name}
                          className="size-full object-cover rounded-lg sm:rounded-xl"
                          loading="lazy"
                        />
                      ) : (
                        <Wrench className="size-6 text-slate-300" />
                      )}
                    </div>

                    {/* Title */}
                    <span className="relative z-10 text-[11px] sm:text-xs lg:text-[13px] font-bold text-slate-800 group-hover:text-[#C86A37] transition-colors line-clamp-2 leading-snug">
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Sub-section: Wall Panel & Special Projects Bar — Hidden on mobile, visible on sm+ */}
          <div className="hidden sm:flex mt-4 sm:mt-5 pt-4 border-t border-slate-200/70 lg:border-slate-100 flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#C86A37] border border-[#FED7AA]">
                <Layers className="size-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900">
                  Wall Panels & Living Space Upgrade
                </p>
                <p className="text-[11px] sm:text-xs font-semibold text-slate-500">
                  Charcoal, louvers, fluted panels with doorstep consultation
                </p>
              </div>
            </div>
            <Link
              href="/wall-panel"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs sm:text-sm font-bold text-white transition-colors shrink-0"
            >
              <span>Explore Studio</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* RIGHT CONTAINER (Desktop) / FIRST (Mobile & Tablet): Promo Banner + Our Promises */}
        <div className="order-1 lg:order-2 lg:col-span-5 xl:col-span-6 flex flex-col gap-4 sm:gap-6 justify-between">
          {/* Top Promotional Carousel Card — Full-bleed edge-to-edge on Mobile & Tablet with bottom rounded corners */}
          <div className="relative -mx-4 sm:-mx-6 lg:mx-0 min-h-[250px] sm:min-h-[330px] lg:min-h-[310px] flex-1 overflow-hidden rounded-b-3xl rounded-t-none lg:rounded-3xl shadow-lg shadow-black/5 bg-slate-900">
            {banners && banners.length > 0 ? (
              banners.map((b, index) => {
                const active = index === currentSlide;
                return (
                  <div
                    key={b.id || index}
                    className={`absolute inset-0 transition-opacity duration-700 ${active ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
                      }`}
                  >
                    <DynamicBannerSlide
                      banner={b}
                      replayKey={`${b.id}-${currentSlide}`}
                      priority={index === 0}
                      className="size-full"
                    />
                  </div>
                );
              })
            ) : (
              DEFAULT_PROMO_SLIDES.map((slide, index) => {
                const active = index === currentSlide;
                return (
                  <div
                    key={index}
                    className={`absolute inset-0 p-6 sm:p-7 flex flex-col justify-between text-white transition-opacity duration-700 bg-gradient-to-br ${slide.bgClass} ${active ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
                      }`}
                  >
                    {/* Background Ambient Graphic */}
                    <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-25 pointer-events-none overflow-hidden">
                      <img
                        src={slide.img}
                        alt=""
                        className="size-full object-cover mix-blend-overlay"
                      />
                    </div>

                    {/* Top Badge */}
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="rounded-full bg-white/15 backdrop-blur-md px-3 py-1 text-xs font-black tracking-wider uppercase text-white border border-white/20">
                        {slide.badge}
                      </span>
                      <span className="rounded-md bg-white/20 px-2.5 py-0.5 text-xs sm:text-sm font-mono font-bold text-white border border-white/20">
                        {slide.code}
                      </span>
                    </div>

                    {/* Middle Copy */}
                    <div className="relative z-10 my-2">
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white drop-shadow-xs">
                        {slide.title}
                      </h2>
                      <p className="mt-1.5 text-xs sm:text-sm lg:text-base font-semibold text-white/90">
                        {slide.subtitle}
                      </p>
                    </div>

                    {/* Bottom Action */}
                    <div className="relative z-10 flex items-center justify-between pt-2">
                      <Link
                        href={slide.href}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs sm:text-sm font-extrabold text-[#7E1926] hover:bg-slate-50 transition-transform active:scale-95 shadow-sm"
                      >
                        <span>{slide.cta}</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}

            {/* Pagination Dots */}
            {slideCount > 1 ? (
              <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-black/25 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
                {Array.from({ length: slideCount }).map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => setCurrentSlide(dotIdx)}
                    aria-label={`Go to slide ${dotIdx + 1}`}
                    className={`size-2 rounded-full transition-all ${dotIdx === currentSlide ? "w-5 bg-white" : "bg-white/40 hover:bg-white/70"
                      }`}
                  />
                ))}
              </div>
            ) : null}
          </div>

          {/* Bottom "Our Promises" Trust Card — Hidden on Mobile & Tablet, Visible on Desktop */}
          <div className="hidden lg:block rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-2.5 mb-3.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-[#7E1926] text-white shadow-xs">
                <ShieldCheck className="size-4" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Our promises
              </h3>
            </div>

            <ul className="space-y-2.5">
              {PROMISES.map((promise, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                  <CheckCircle2 className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>{promise}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
