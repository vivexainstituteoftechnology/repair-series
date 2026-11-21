"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Search, Wrench } from "lucide-react";
import {
  filterHomeSectionsForPlatform,
  normalizeClientLayout,
  resolveSectionBannerSlides,
  resolveHomeSectionItems,
  type HomeBannerDoc,
  type HomeSectionDoc,
  type HomeSectionPlatform,
  type MarketplaceItem,
} from "@/lib/home-sections/resolve";
import { useServiceModal } from "@/context/service-modal-context";
import {
  getCategoryPath,
  getComingSoonPath,
  getServicePath,
} from "@/lib/catalog/slug";
import { ServicePrice } from "@/components/services/service-price";
import { AddToCartButton } from "@/components/services/add-to-cart-button";
import { UrbanServiceCard } from "@/components/services/urban-service-card";
import {
  ServiceCarousel,
  CAROUSEL_CARD_WIDTH,
} from "@/components/services/service-carousel";
import { DynamicBannerSlide } from "@/components/banners/dynamic-banner-slide";

type CategoryDoc = {
  id: string;
  name?: string;
  title?: string;
  slug?: string;
  icon?: string;
  image?: string;
  imageUrl?: string;
  homeImage?: string;
  desc?: string;
  active?: boolean;
  isActive?: boolean;
  serviceTypeId?: string;
  categoryId?: string;
  contentLevel?: string;
};

type ServiceDoc = {
  id: string;
  name?: string;
  title?: string;
  status?: string;
  image?: string;
  imageUrl?: string;
  homeImage?: string;
  featured?: boolean;
  isFeatured?: boolean;
};

type ExtraCatalog = {
  serviceTypes?: CategoryDoc[];
  serviceCategories?: CategoryDoc[];
};

type SectionCatalog = {
  categories: CategoryDoc[];
  services: ServiceDoc[];
  comingSoon: ServiceDoc[];
  extraCatalog?: ExtraCatalog;
  selectedServiceTypeId?: string;
  selectedServiceTypeName?: string;
  banners?: HomeBannerDoc[];
  onSelectServiceType?: (id: string) => void;
};

function sectionContentType(section: HomeSectionDoc) {
  return String(section.contentType || section.type || "");
}

function isTileContent(contentType: string) {
  return (
    contentType === "categories" ||
    contentType === "serviceTypes" ||
    contentType === "serviceCategories"
  );
}

function viewAllHref(section: HomeSectionDoc) {
  const custom = String(section.viewAllPath || "").trim();
  if (custom) return custom;
  if (isTileContent(sectionContentType(section))) return "/categories";
  return "/services";
}

function isComingSoonMode(section: HomeSectionDoc) {
  return String(section.selectionMode || "").startsWith("coming_soon");
}

function isServiceTypeItem(section: HomeSectionDoc, item: CategoryDoc | ServiceDoc) {
  return (
    sectionContentType(section) === "serviceTypes" ||
    (item as CategoryDoc).contentLevel === "serviceType"
  );
}

function itemHref(section: HomeSectionDoc, item: CategoryDoc | ServiceDoc) {
  if (isServiceTypeItem(section, item)) return "#";
  const contentType = sectionContentType(section);
  const row = item as CategoryDoc & { serviceId?: string };
  if (contentType === "serviceCategories" || row.contentLevel === "serviceCategory") {
    return getCategoryPath(item as CategoryDoc);
  }
  if (contentType === "categories") {
    return getCategoryPath(item as CategoryDoc);
  }
  if (contentType === "variations" && row.serviceId) {
    return getServicePath({ id: String(row.serviceId), name: row.name, title: row.title });
  }
  if (isComingSoonMode(section) || String((item as ServiceDoc).status) === "Coming Soon") {
    return getComingSoonPath(item as ServiceDoc);
  }
  return getServicePath(item as ServiceDoc);
}

function sectionBadge(section: HomeSectionDoc) {
  if (section.selectionMode === "coming_soon_main") return "Coming Soon";
  if (section.selectionMode === "coming_soon_commercial") return "Coming Soon";
  if (section.selectionMode === "coming_soon") return "Coming Soon";
  return null;
}

function itemImage(section: HomeSectionDoc, item: CategoryDoc | ServiceDoc) {
  if (isTileContent(sectionContentType(section))) {
    return String((item as CategoryDoc).icon || (item as CategoryDoc).image || (item as CategoryDoc).imageUrl || "");
  }
  const s = item as ServiceDoc;
  return String(s.homeImage || s.imageUrl || s.image || "");
}

function RobustCategoryIcon({
  item,
  className = "size-10 object-contain",
}: {
  item: CategoryDoc | ServiceDoc;
  className?: string;
}) {
  const [error, setError] = useState(false);
  const cat = item as CategoryDoc;
  const src = (cat.icon || cat.image || (cat as { imageUrl?: string }).imageUrl || "").trim();

  if (!src || error) {
    return (
      <div className="flex size-10 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#C86A37]">
        <Wrench className="size-5" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={cat.name || cat.title || "Category"}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}

function HomeSearchBlock({
  typeName,
  typeId,
}: {
  typeName?: string;
  typeId?: string;
}) {
  const placeholder = typeName
    ? `Search ${typeName} services...`
    : "Search services...";
  return (
    <form action="/search" className="mt-5 px-4">
      {typeId ? <input type="hidden" name="type" value={typeId} /> : null}
      <div className="flex h-12 items-center gap-2 rounded-2xl bg-white px-4 shadow-sm ring-1 ring-[#E8E4E0]">
        <Search className="size-5 text-[#C86A37]" />
        <input
          name="q"
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#1A1A1A] outline-none placeholder:text-[#6B6B6B]"
        />
      </div>
    </form>
  );
}

function bannerSlideHref(b: HomeBannerDoc) {
  const action = String(b.clickAction || "").trim();
  if (action === "none") return "";
  if (action === "external") return String(b.redirectLink || "").trim();
  if (action === "service" && b.serviceId) return `/services/${b.serviceId}`;
  if (action === "category" && b.categoryId) return `/categories/${b.categoryId}`;
  if (action === "serviceCategory" && b.serviceCategoryId && b.categoryId) {
    return `/categories/${b.categoryId}?sc=${encodeURIComponent(b.serviceCategoryId)}`;
  }
  const link = String(b.redirectLink || "").trim();
  return link;
}

function HomeBannerBlock({
  section,
  banners,
  selectedServiceTypeId,
  variant,
  fullWidth,
  onSelectServiceType,
}: {
  section: HomeSectionDoc;
  banners?: HomeBannerDoc[];
  selectedServiceTypeId?: string;
  variant: "mobile" | "desktop";
  fullWidth?: boolean;
  onSelectServiceType?: (id: string) => void;
}) {
  const router = useRouter();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const rows = resolveSectionBannerSlides(section, banners, selectedServiceTypeId);
  if (!rows.length) return null;
  const layout = normalizeClientLayout(section.layout);
  const rawHeight = Number(section.settings?.height);
  const defaultHeight =
    variant === "desktop"
      ? (layout === "single" ? 360 : 380)
      : (layout === "single" ? 230 : 260);
  const height = rawHeight && rawHeight > 288 ? rawHeight : defaultHeight;
  const list = layout === "single" ? rows.slice(0, 1) : rows;
  const autoplay = section.settings?.autoplay !== false && list.length > 1;
  const manualSwipe = section.settings?.manualSwipe !== false;
  const duration = Number(section.settings?.slideDuration) || 3000;
  const isFullWidth =
    Boolean(fullWidth) ||
    sectionContentType(section) === "fullWidthBanner" ||
    layout === "fullWidth" ||
    Boolean(section.settings?.fullWidth);
  const isFitWidth =
    isFullWidth ||
    section.settings?.imageWidth === "fit" ||
    section.settings?.imageFit === "fit";

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const activeIndexRef = useRef(0);
  activeIndexRef.current = activeIndex;

  const scrollToSlide = useCallback((targetIndex: number) => {
    const container = scrollerRef.current;
    if (!container) return;
    const child = container.children[targetIndex] as HTMLElement | undefined;
    if (child) {
      container.scrollTo({
        left: child.offsetLeft,
        behavior: "smooth",
      });
      setActiveIndex(targetIndex);
    }
  }, []);

  // Passive scroll listener to keep activeIndex synced with user touch / swipe gestures
  useEffect(() => {
    const container = scrollerRef.current;
    if (!container) return;

    let rafId: number | undefined;
    const onScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const scrollLeft = container.scrollLeft;
        const width = container.offsetWidth;
        if (width > 0) {
          const newIndex = Math.round(scrollLeft / width);
          if (newIndex >= 0 && newIndex < list.length && newIndex !== activeIndexRef.current) {
            setActiveIndex(newIndex);
          }
        }
      });
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [list.length]);

  // Autoplay strictly on container.scrollTo: never moves or scrolls the window or parent page
  useEffect(() => {
    if (!autoplay || list.length <= 1 || isPaused) return;

    const id = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      const nextIndex = (activeIndexRef.current + 1) % list.length;
      scrollToSlide(nextIndex);
    }, duration);

    return () => window.clearInterval(id);
  }, [autoplay, duration, list.length, isPaused, scrollToSlide]);

  return (
    <div
      className={isFullWidth ? "w-full px-0 mx-0" : (variant === "mobile" ? "mt-5 px-4" : "w-full py-6")}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div
        ref={scrollerRef}
        className={`flex snap-x snap-mandatory ${isFullWidth ? "gap-0" : "gap-3"} scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          manualSwipe ? "overflow-x-auto" : "overflow-hidden"
        }`}
      >
        {list.map((b, bIdx) => {
          const action = String(b.clickAction || "").trim();
          const href = action === "serviceType" ? "" : bannerSlideHref(b);
          const img = b.websiteImage || b.mobileImage || b.image || b.imageUrl || "";
          const hasDynamicContent = Boolean(b.title || b.tagline || b.buttonText || b.overlay);
          const node = hasDynamicContent ? (
            <DynamicBannerSlide
              banner={b}
              replayKey={`${b.id}-${activeIndex}`}
              priority={bIdx === 0}
              className={`w-full ${isFullWidth ? "rounded-none" : "rounded-2xl"} overflow-hidden`}
              style={isFitWidth ? { width: "100%", minHeight: "220px" } : { height }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={b.title || ""}
              className={`w-full ${isFullWidth ? "rounded-none" : "rounded-2xl"} ${isFitWidth ? "h-auto object-contain" : "object-cover"} transition-transform duration-300`}
              style={isFitWidth ? { width: "100%", height: "auto", display: "block" } : { height }}
              loading={bIdx === 0 ? "eager" : "lazy"}
            />
          );
          if (action === "serviceType" && b.serviceTypeId && onSelectServiceType) {
            return (
              <button
                key={`${b.id}-${bIdx}`}
                type="button"
                className="min-w-full shrink-0 snap-start text-left focus:outline-none"
                onClick={() => onSelectServiceType(b.serviceTypeId!)}
              >
                {node}
              </button>
            );
          }
          if (!href) return <div key={`${b.id}-${bIdx}`} className="min-w-full shrink-0 snap-start">{node}</div>;
          const external = href.startsWith("http");
          return (
            <div
              key={`${b.id}-${bIdx}`}
              role="button"
              tabIndex={0}
              onClick={() => {
                if (external) {
                  window.open(href, "_blank", "noopener,noreferrer");
                } else {
                  router.push(href);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (external) {
                    window.open(href, "_blank", "noopener,noreferrer");
                  } else {
                    router.push(href);
                  }
                }
              }}
              className="min-w-full shrink-0 snap-start cursor-pointer focus:outline-none"
            >
              {node}
            </div>
          );
        })}
      </div>

      {/* Spring-style pill pagination dots matching mobile app HomeOfferCarousel */}
      {list.length > 1 && (
        <div
          className={`flex items-center justify-center gap-1.5 ${isFullWidth ? "py-2.5" : "pt-3 pb-1"}`}
          aria-label="Banner pagination"
        >
          {list.map((_, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={i}
                type="button"
                onClick={() => scrollToSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none ${
                  isActive
                    ? "w-6 bg-[#C86A37] opacity-100"
                    : "w-1.5 bg-[#E7E5E4] opacity-50 hover:opacity-80"
                }`}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={isActive ? "true" : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function mobileGridCols(columns: number) {
  if (columns <= 1) return "grid-cols-1";
  if (columns === 2) return "grid-cols-2";
  if (columns === 3) return "grid-cols-3";
  return "grid-cols-4";
}

function desktopGridCols(columns: number) {
  if (columns <= 1) return "grid-cols-1";
  if (columns === 2) return "grid-cols-1 sm:grid-cols-2";
  if (columns === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
}

function MobileSections({
  sections,
  categories,
  services,
  comingSoon,
  extraCatalog,
  selectedServiceTypeId,
  selectedServiceTypeName,
  banners,
  onSelectServiceType,
}: {
  sections: HomeSectionDoc[];
} & SectionCatalog) {
  return (
    <>
      {sections.map((section) => {
        const contentType = sectionContentType(section);
        const layout = normalizeClientLayout(section.layout);

        if (contentType === "search") {
          return (
            <HomeSearchBlock
              key={section.id}
              typeName={selectedServiceTypeName}
              typeId={selectedServiceTypeId}
            />
          );
        }

        if (contentType === "banners" || contentType === "fullWidthBanner") {
          return (
            <HomeBannerBlock
              key={section.id}
              section={section}
              banners={banners}
              selectedServiceTypeId={selectedServiceTypeId}
              variant="mobile"
              fullWidth={contentType === "fullWidthBanner" || layout === "fullWidth"}
              onSelectServiceType={onSelectServiceType}
            />
          );
        }

        if (layout === "static" || contentType === "static") {
          return (
            <section key={section.id} className="mt-7 px-4">
              <h2 className="mb-1 text-lg font-extrabold text-[#1A1A1A]">{section.title}</h2>
              {section.subtitle ? (
                <p className="mb-3 text-xs font-medium text-[#6B6B6B]">{section.subtitle}</p>
              ) : null}
              <div className="overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#E8E4E0]">
                {section.staticImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={section.staticImage}
                    alt=""
                    className="mb-3 h-36 w-full rounded-xl object-cover"
                  />
                ) : null}
                {section.staticBody ? (
                  <p className="text-sm leading-relaxed text-[#3A3A3A]">{section.staticBody}</p>
                ) : null}
                {section.staticCtaLabel && section.staticCtaLink ? (
                  <Link
                    href={section.staticCtaLink}
                    className="mt-3 inline-flex text-sm font-bold text-[#C86A37] hover:underline"
                  >
                    {section.staticCtaLabel}
                  </Link>
                ) : null}
              </div>
            </section>
          );
        }

        if (contentType === "marketplace") {
          return (
            <HomeMarketplaceBlock
              key={section.id}
              section={section}
              services={services}
              categories={categories}
              serviceTypes={extraCatalog?.serviceTypes}
              serviceCategories={extraCatalog?.serviceCategories}
              onSelectServiceType={onSelectServiceType}
            />
          );
        }

        const items = resolveHomeSectionItems(section, {
          categories,
          services,
          comingSoon,
          serviceTypes: extraCatalog?.serviceTypes || [],
          serviceCategories: extraCatalog?.serviceCategories || [],
          selectedServiceTypeId,
        }) as Array<CategoryDoc | ServiceDoc>;
        if (!items.length) return null;

        const columns =
          layout === "grid2" ? 2 : Math.min(4, Math.max(1, Number(section.columns) || 4));
        const badge = sectionBadge(section);
        const tile = isTileContent(contentType);
        const sliderLayout = layout === "slider" || layout === "autoSlider";
        const gridLayout = layout === "grid" || layout === "grid2";

        return (
          <section key={section.id} className="mt-7 px-4">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-[#1A1A1A]">{section.title}</h2>
                {section.subtitle ? (
                  <p className="mt-0.5 text-xs font-medium text-[#6B6B6B]">{section.subtitle}</p>
                ) : null}
              </div>
              {section.showViewAll ? (
                <Link
                  href={viewAllHref(section)}
                  className="shrink-0 text-xs font-bold text-[#C86A37] hover:underline"
                >
                  See all
                </Link>
              ) : null}
            </div>

            {layout === "list" ? (
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <Link
                    key={`${item.id}-${idx}`}
                    href={itemHref(section, item)}
                      onClick={(e) => {
                        if (!isServiceTypeItem(section, item)) return;
                        e.preventDefault();
                        onSelectServiceType?.(String(item.id));
                      }}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-[#E8E4E0]"
                  >
                    <span className="flex size-7 items-center justify-center rounded-full bg-[#FFF7ED] text-xs font-extrabold text-[#C86A37]">
                      {idx + 1}
                    </span>
                    <div className="size-11 overflow-hidden rounded-xl bg-[#F4F5F7]">
                      {itemImage(section, item) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={itemImage(section, item)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#1A1A1A]">
                        {item.name || item.title}
                      </p>
                      {section.contentType === "services" ? (
                        <div className="mt-0.5 text-[11px] font-semibold text-[#C86A37]">
                          <ServicePrice service={item as never} />
                        </div>
                      ) : (
                        <p className="text-[11px] font-medium text-[#6B6B6B]">Browse services</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}

            {sliderLayout ? (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
                {items.map((item, idx) =>
                  tile ? (
                    <Link
                      key={`${item.id}-${idx}`}
                      href={itemHref(section, item)}
                      onClick={(e) => {
                        if (!isServiceTypeItem(section, item)) return;
                        e.preventDefault();
                        onSelectServiceType?.(String(item.id));
                      }}
                      className="flex w-[88px] shrink-0 snap-start flex-col items-center gap-2 transition-transform active:scale-95"
                    >
                      <div className="flex size-14 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#E8E4E0]">
                        <RobustCategoryIcon item={item} />
                      </div>
                      <span className="line-clamp-2 text-center text-[11px] font-bold text-[#1A1A1A]">
                        {item.name || item.title}
                      </span>
                    </Link>
                  ) : (
                    <UrbanServiceCard
                      key={`${item.id}-${idx}`}
                      service={item as ServiceDoc}
                      href={itemHref(section, item)}
                      badge={badge}
                      widthClass="w-[160px] sm:w-[180px] shrink-0 snap-start"
                      onClick={(e) => {
                        if (!isServiceTypeItem(section, item)) return;
                        e.preventDefault();
                        onSelectServiceType?.(String(item.id));
                      }}
                    />
                  ),
                )}
              </div>
            ) : null}

            {gridLayout ? (
              <div className={`grid gap-3 ${mobileGridCols(columns)}`}>
                {items.map((item, idx) =>
                  tile ? (
                    <Link
                      key={`${item.id}-${idx}`}
                      href={itemHref(section, item)}
                      onClick={(e) => {
                        if (!isServiceTypeItem(section, item)) return;
                        e.preventDefault();
                        onSelectServiceType?.(String(item.id));
                      }}
                      className="flex flex-col items-center gap-2 transition-transform active:scale-95"
                    >
                      <div className="flex size-14 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#E8E4E0]">
                        <RobustCategoryIcon item={item} />
                      </div>
                      <span className="line-clamp-2 text-center text-[11px] font-bold text-[#1A1A1A]">
                        {item.name || item.title}
                      </span>
                    </Link>
                  ) : (
                    <UrbanServiceCard
                      key={`${item.id}-${idx}`}
                      service={item as ServiceDoc}
                      href={itemHref(section, item)}
                      badge={badge}
                      widthClass="w-full"
                      onClick={(e) => {
                        if (!isServiceTypeItem(section, item)) return;
                        e.preventDefault();
                        onSelectServiceType?.(String(item.id));
                      }}
                    />
                  ),
                )}
              </div>
            ) : null}
          </section>
        );
      })}
    </>
  );
}

function HomeMarketplaceBlock({
  section,
  services,
  categories,
  serviceTypes = [],
  serviceCategories = [],
  onSelectServiceType,
}: {
  section: HomeSectionDoc;
  services: ServiceDoc[];
  categories: CategoryDoc[];
  serviceTypes?: CategoryDoc[];
  serviceCategories?: CategoryDoc[];
  onSelectServiceType?: (id: string) => void;
}) {
  const { openServiceModal } = useServiceModal();
  const rawItems = Array.isArray(section.items) ? section.items : [];
  const visibleItems = rawItems.filter((it) => it.visible !== false);
  if (!visibleItems.length) return null;

  const layout = normalizeClientLayout(section.layout);
  const columns =
    layout === "grid2" ? 2 : Math.min(4, Math.max(1, Number(section.columns) || 4));
  const sliderLayout = layout === "slider" || layout === "autoSlider";

  const renderMarketplaceItem = (item: MarketplaceItem, idx: number) => {
    // 1. Service Item -> Slide-Up Detail Modal
    if (item.itemType === "service") {
      const dbService = services.find((s) => s.id === item.targetId);
      const serviceObj: ServiceDoc = dbService || {
        id: item.targetId,
        name: item.title,
        title: item.title,
        image: item.image,
      };

      return (
        <UrbanServiceCard
          key={item.id || `${item.targetId}-${idx}`}
          service={serviceObj as never}
          badge={item.badge || null}
          widthClass={sliderLayout ? CAROUSEL_CARD_WIDTH : undefined}
          onClick={(e) => {
            e.preventDefault();
            openServiceModal(serviceObj as never);
          }}
        />
      );
    }

    // 2. Category Item -> Category Page
    if (item.itemType === "category") {
      const dbCat = categories.find((c) => c.id === item.targetId);
      const title = item.title || dbCat?.name || dbCat?.title || "Category";
      const img =
        item.image || dbCat?.homeImage || dbCat?.image || dbCat?.imageUrl || dbCat?.icon || "";
      const href = `/categories/${item.targetId}`;

      return (
        <Link
          key={item.id || `${item.targetId}-${idx}`}
          href={href}
          className={`group ${sliderLayout ? CAROUSEL_CARD_WIDTH : ""} flex flex-col rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs hover:border-slate-300 hover:shadow-md transition-all active:scale-[0.98]`}
        >
          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-50 mb-2 flex items-center justify-center p-2">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img}
                alt={title}
                className="size-full object-cover rounded-lg group-hover:scale-105 transition-transform"
              />
            ) : (
              <Wrench className="size-8 text-slate-300" />
            )}
            {item.badge ? (
              <span className="absolute top-2 right-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                {item.badge}
              </span>
            ) : null}
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#C45508] transition-colors line-clamp-1">
            {title}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">Explore services →</span>
        </Link>
      );
    }

    // 3. Service Type Item -> Category Modal Popup
    if (item.itemType === "serviceType") {
      const dbType = serviceTypes.find((t) => t.id === item.targetId);
      const title = item.title || dbType?.title || dbType?.name || "Service Type";
      const img =
        item.image || dbType?.homeImage || dbType?.image || dbType?.imageUrl || dbType?.icon || "";

      return (
        <div
          key={item.id || `${item.targetId}-${idx}`}
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.preventDefault();
            onSelectServiceType?.(item.targetId);
          }}
          className={`group ${sliderLayout ? CAROUSEL_CARD_WIDTH : ""} cursor-pointer flex flex-col rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs hover:border-[#C45508]/40 hover:shadow-md transition-all active:scale-[0.98]`}
        >
          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-50 mb-2 flex items-center justify-center p-2">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img}
                alt={title}
                className="size-full object-cover rounded-lg group-hover:scale-105 transition-transform"
              />
            ) : (
              <Wrench className="size-8 text-slate-300" />
            )}
            <span className="absolute top-2 left-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
              {item.badge || "Marketplace"}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#C45508] transition-colors line-clamp-1">
            {title}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">View all categories →</span>
        </div>
      );
    }

    // 4. Category Type (Service Category) Item -> Category Page
    const dbSc = serviceCategories.find((sc) => sc.id === item.targetId);
    const title = item.title || dbSc?.title || dbSc?.name || "Category";
    const img =
      item.image || dbSc?.homeImage || dbSc?.image || dbSc?.imageUrl || dbSc?.icon || "";
    const href = `/categories/${item.targetId}`;

    return (
      <Link
        key={item.id || `${item.targetId}-${idx}`}
        href={href}
        className={`group ${sliderLayout ? CAROUSEL_CARD_WIDTH : ""} flex flex-col rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs hover:border-slate-300 hover:shadow-md transition-all active:scale-[0.98]`}
      >
        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-50 mb-2 flex items-center justify-center p-2">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={title}
              className="size-full object-cover rounded-lg group-hover:scale-105 transition-transform"
            />
          ) : (
            <Wrench className="size-8 text-slate-300" />
          )}
          {item.badge ? (
            <span className="absolute top-2 right-2 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
              {item.badge}
            </span>
          ) : null}
        </div>
        <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#C45508] transition-colors line-clamp-1">
          {title}
        </span>
        <span className="text-[11px] text-slate-400 mt-0.5">Browse services →</span>
      </Link>
    );
  };

  return (
    <section className="py-6 sm:py-8">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <span className="mb-1 block text-xs font-black uppercase tracking-wider text-[#C45508]">
              Marketplace
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {section.title}
            </h2>
            {section.subtitle ? (
              <p className="mt-1 text-sm text-slate-500">{section.subtitle}</p>
            ) : null}
          </div>
        </div>

        {/* Layout */}
        {sliderLayout ? (
          <ServiceCarousel>
            {visibleItems.map((item, idx) => renderMarketplaceItem(item, idx))}
          </ServiceCarousel>
        ) : (
          <div className={`grid gap-4 sm:gap-6 ${desktopGridCols(columns)}`}>
            {visibleItems.map((item, idx) => renderMarketplaceItem(item, idx))}
          </div>
        )}
      </div>
    </section>
  );
}

function DesktopSections({
  sections,
  categories,
  services,
  comingSoon,
  extraCatalog,
  selectedServiceTypeId,
  selectedServiceTypeName,
  banners,
  onSelectServiceType,
}: {
  sections: HomeSectionDoc[];
} & SectionCatalog) {
  return (
    <>
      {sections.map((section, sectionIdx) => {
        const contentType = sectionContentType(section);
        const layout = normalizeClientLayout(section.layout);
        const shell = "border-t border-slate-100 py-10 lg:py-14";

        if (contentType === "search") {
          return (
            <section key={section.id} className={shell}>
              <div className="mx-auto max-w-3xl px-4">
                <HomeSearchBlock
                  typeName={selectedServiceTypeName}
                  typeId={selectedServiceTypeId}
                />
              </div>
            </section>
          );
        }

        if (contentType === "banners" || contentType === "fullWidthBanner") {
          const isFullWidth =
            contentType === "fullWidthBanner" ||
            layout === "fullWidth" ||
            Boolean(section.settings?.fullWidth);

          if (isFullWidth) {
            return (
              <div key={section.id} className="w-full px-0 mx-0">
                <HomeBannerBlock
                  section={section}
                  banners={banners}
                  selectedServiceTypeId={selectedServiceTypeId}
                  variant="desktop"
                  fullWidth={true}
                  onSelectServiceType={onSelectServiceType}
                />
              </div>
            );
          }
          return (
            <section key={section.id} className={shell}>
              <HomeBannerBlock
                section={section}
                banners={banners}
                selectedServiceTypeId={selectedServiceTypeId}
                variant="desktop"
                onSelectServiceType={onSelectServiceType}
              />
            </section>
          );
        }

        if (layout === "static" || contentType === "static") {
          return (
            <section key={section.id} className={shell}>
              <div className="grid w-full items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-[#C86A37]">
                    Spotlight
                  </span>
                  <h2 className="text-3xl font-bold tracking-tight text-[#0a0f1c] sm:text-4xl">
                    {section.title}
                  </h2>
                  {section.subtitle ? (
                    <p className="mt-3 text-lg text-[#64748b]">{section.subtitle}</p>
                  ) : null}
                  {section.staticBody ? (
                    <p className="mt-5 text-base leading-relaxed text-[#475569]">
                      {section.staticBody}
                    </p>
                  ) : null}
                  {section.staticCtaLabel && section.staticCtaLink ? (
                    <Link
                      href={section.staticCtaLink}
                      className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C86A37] to-[#A85028] px-7 py-3.5 text-sm font-semibold text-white shadow-xs transition hover:opacity-95"
                    >
                      {section.staticCtaLabel}
                      <ArrowRight className="size-4" />
                    </Link>
                  ) : null}
                </div>
                {section.staticImage ? (
                  <div className="overflow-hidden rounded-[28px] border border-black/5 shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={section.staticImage}
                      alt=""
                      className="aspect-[4/3] w-full object-cover"
                    />
                  </div>
                ) : null}
              </div>
            </section>
          );
        }

        if (contentType === "marketplace") {
          return (
            <HomeMarketplaceBlock
              key={section.id}
              section={section}
              services={services}
              categories={categories}
              serviceTypes={extraCatalog?.serviceTypes}
              serviceCategories={extraCatalog?.serviceCategories}
              onSelectServiceType={onSelectServiceType}
            />
          );
        }

        const items = resolveHomeSectionItems(section, {
          categories,
          services,
          comingSoon,
          serviceTypes: extraCatalog?.serviceTypes || [],
          serviceCategories: extraCatalog?.serviceCategories || [],
          selectedServiceTypeId,
        }) as Array<CategoryDoc | ServiceDoc>;
        if (!items.length) return null;

        const columns =
          layout === "grid2" ? 2 : Math.min(4, Math.max(1, Number(section.columns) || 4));
        const badge = sectionBadge(section);
        const isCategory = isTileContent(contentType);
        const isComing = isComingSoonMode(section);
        const sliderLayout = layout === "slider" || layout === "autoSlider";
        const gridLayout = layout === "grid" || layout === "grid2";

        return (
          <section key={section.id} id={sectionIdx === 0 ? "services" : undefined} className={shell}>
            <div className="w-full">
              <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div className="max-w-2xl">
                  <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-[#C86A37]">
                    {isComing ? "Coming Soon" : isCategory ? "Browse" : "Services"}
                  </span>
                  <h2 className="text-3xl font-bold tracking-tight text-[#0a0f1c] sm:text-4xl">
                    {section.title}
                  </h2>
                  {section.subtitle ? (
                    <p className="mt-3 text-lg text-[#64748b]">{section.subtitle}</p>
                  ) : null}
                </div>
                {section.showViewAll ? (
                  <Link
                    href={viewAllHref(section)}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-[#C86A37] transition hover:underline"
                  >
                    View all
                    <ArrowRight className="size-4" />
                  </Link>
                ) : null}
              </div>

              {layout === "list" ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {items.map((item, idx) => (
                    <Link
                      key={`${item.id}-${idx}`}
                      href={itemHref(section, item)}
                      onClick={(e) => {
                        if (!isServiceTypeItem(section, item)) return;
                        e.preventDefault();
                        onSelectServiceType?.(String(item.id));
                      }}
                      className="group flex items-center gap-4 rounded-[22px] border border-black/5 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.03)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,0.08)]"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FFF7ED] text-sm font-extrabold text-[#C86A37]">
                        {idx + 1}
                      </span>
                      <div className="size-16 shrink-0 overflow-hidden rounded-2xl bg-[#f1f5f9]">
                        {itemImage(section, item) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={itemImage(section, item)}
                            alt=""
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Wrench className="size-6 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-bold text-[#0a0f1c] group-hover:text-[#C86A37]">
                          {item.name || item.title}
                        </p>
                        {section.contentType === "services" ? (
                          <div className="mt-1 text-sm font-semibold text-[#0a0f1c]">
                            <ServicePrice service={item as never} />
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-[#64748b]">Explore services in this category</p>
                        )}
                      </div>
                      <ArrowRight className="size-5 shrink-0 text-[#C86A37] opacity-0 transition group-hover:opacity-100" />
                    </Link>
                  ))}
                </div>
              ) : null}

              {sliderLayout ? (
                <ServiceCarousel>
                  {items.map((item, idx) =>
                    isCategory ? (
                      <Link
                        key={`${item.id}-${idx}`}
                        href={itemHref(section, item)}
                        onClick={(e) => {
                          if (!isServiceTypeItem(section, item)) return;
                          e.preventDefault();
                          onSelectServiceType?.(String(item.id));
                        }}
                        className={`group ${CAROUSEL_CARD_WIDTH} overflow-hidden rounded-[22px] border border-black/5 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] transition hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]`}
                      >
                        <div className="relative flex h-[150px] items-center justify-center bg-[#f1f5f9]">
                          <RobustCategoryIcon
                            item={item}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="text-base font-bold text-[#0a0f1c] group-hover:text-[#C86A37]">
                            {item.name || item.title}
                          </h3>
                        </div>
                      </Link>
                    ) : (
                      <UrbanServiceCard
                        key={`${item.id}-${idx}`}
                        service={item as ServiceDoc}
                        href={itemHref(section, item)}
                        badge={badge}
                        widthClass={CAROUSEL_CARD_WIDTH}
                        onClick={(e) => {
                          if (!isServiceTypeItem(section, item)) return;
                          e.preventDefault();
                          onSelectServiceType?.(String(item.id));
                        }}
                      />
                    ),
                  )}
                </ServiceCarousel>
              ) : null}

              {gridLayout ? (
                <div className={`grid gap-6 ${desktopGridCols(columns)}`}>
                  {items.map((item, idx) =>
                    isCategory ? (
                      <Link
                        key={`${item.id}-${idx}`}
                        href={itemHref(section, item)}
                      onClick={(e) => {
                        if (!isServiceTypeItem(section, item)) return;
                        e.preventDefault();
                        onSelectServiceType?.(String(item.id));
                      }}
                        className="group relative flex flex-col justify-between overflow-hidden rounded-[20px] border border-black/5 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]"
                      >
                        <div className="relative flex h-[200px] w-full items-center justify-center overflow-hidden bg-gray-100">
                          <RobustCategoryIcon item={item} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        </div>
                        <div className="bg-white p-5">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <h3 className="text-lg font-bold text-[#0a0f1c]">
                              {item.name || item.title}
                            </h3>
                            <ArrowRight className="size-5 -translate-x-2 text-[#C86A37] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                          </div>
                          <p className="line-clamp-2 text-sm text-[#64748b]">
                            {(item as CategoryDoc).desc ||
                              "Explore this service and book an expert today."}
                          </p>
                        </div>
                      </Link>
                    ) : (
                      <UrbanServiceCard
                        key={item.id}
                        service={item as ServiceDoc}
                        href={itemHref(section, item)}
                        badge={badge}
                        widthClass="w-full"
                        onClick={(e) => {
                          if (!isServiceTypeItem(section, item)) return;
                          e.preventDefault();
                          onSelectServiceType?.(String(item.id));
                        }}
                      />
                    ),
                  )}
                </div>
              ) : null}
            </div>
          </section>
        );
      })}
    </>
  );
}

export function DynamicHomeSections({
  sections,
  categories,
  services,
  comingSoon,
  extraCatalog,
  selectedServiceTypeId,
  selectedServiceTypeName,
  banners,
  onSelectServiceType,
  variant = "mobile",
  platform,
}: {
  sections: HomeSectionDoc[];
  categories: CategoryDoc[];
  services: ServiceDoc[];
  comingSoon: ServiceDoc[];
  extraCatalog?: ExtraCatalog;
  selectedServiceTypeId?: string;
  selectedServiceTypeName?: string;
  banners?: HomeBannerDoc[];
  onSelectServiceType?: (id: string) => void;
  /** `mobile` = app-like phone UI; `desktop` = marketing homepage */
  variant?: "mobile" | "desktop";
  /** CMS visibility: mobileWeb / desktopWeb (defaults from variant) */
  platform?: HomeSectionPlatform;
}) {
  const resolvedPlatform: HomeSectionPlatform =
    platform ?? (variant === "desktop" ? "desktopWeb" : "mobileWeb");
  const visible = filterHomeSectionsForPlatform(sections, resolvedPlatform);
  if (!visible.length) return null;

  const shared = {
    sections: visible,
    categories,
    services,
    comingSoon,
    extraCatalog,
    selectedServiceTypeId,
    selectedServiceTypeName,
    banners,
    onSelectServiceType,
  };

  if (variant === "desktop") {
    return <DesktopSections {...shared} />;
  }

  return <MobileSections {...shared} />;
}
