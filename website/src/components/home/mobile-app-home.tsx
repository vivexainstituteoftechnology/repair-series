"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isWallPanelCatalogItem } from "@/lib/catalog/wallPanel";
import { isCatalogActive, sortByDisplayOrder } from "@/lib/catalog/hierarchy";
import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import {
  MapPin,
  ShoppingCart,
  Navigation,
  Pencil,
  Loader2,
  ChevronDown,
  Search,
  Wrench,
  Grid,
} from "lucide-react";
import { DynamicHomeSections } from "@/components/home/dynamic-home-sections";
import { AddToCartButton } from "@/components/services/add-to-cart-button";
import { ServicePrice } from "@/components/services/service-price";
import { getServicePath } from "@/lib/catalog/slug";
import { serviceHasVariations, getActiveVariations } from "@/lib/services/pricing";
import { getDb } from "@/lib/firebase/firestore";
import { useLocation } from "@/context/location-context";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/context/cart-context";
import {
  filterHomeSectionsForPlatform,
  filterHomeSectionsForServiceType,
  type HomeBannerDoc,
  type HomeSectionDoc,
} from "@/lib/home-sections/resolve";

type CategoryDoc = {
  id: string;
  name?: string;
  title?: string;
  icon?: string;
  image?: string;
  imageUrl?: string;
  homeImage?: string;
  active?: boolean;
  isActive?: boolean;
  serviceTypeId?: string;
  slug?: string;
};

type ServiceDoc = {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  slug?: string;
  categoryId?: string;
  category_id?: string;
  serviceTypeId?: string;
  serviceCategoryId?: string;
  status?: string;
  comingSoonCategory?: string;
  price?: number;
  image?: string;
  imageUrl?: string;
  homeImage?: string;
  variations?: Array<{
    id: string;
    title: string;
    price: number;
    status?: string;
    image?: string;
    imageUrl?: string;
  }>;
};

type SavedAddress = {
  id?: string;
  label?: string;
  type?: string;
  city?: string;
  state?: string;
  pincode?: string;
  street?: string;
  area?: string;
  fullAddress?: string;
  lat?: number;
  lng?: number;
};

/** Category Icon with fail-safe SVG fallback so images NEVER disappear or collapse */
function CategoryIcon({
  cat,
  className = "size-9 object-contain",
}: {
  cat: CategoryDoc;
  className?: string;
}) {
  const [error, setError] = useState(false);
  const src = (cat.icon || cat.image || cat.imageUrl || cat.homeImage || "").trim();

  if (!src || error) {
    return (
      <div className="flex size-9 items-center justify-center rounded-xl bg-[#FDE7DD] text-[#C86A37]">
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

/** Horizontal service card matching reference app ServiceCard.js */
function MobileServiceCard({ service }: { service: ServiceDoc }) {
  const name = service.name || service.title || "Service";
  const desc =
    service.description || "Expert service and maintenance. Book a slot today.";
  const img = service.imageUrl || service.image || service.homeImage;
  const hasVar = serviceHasVariations(service);
  const vars = getActiveVariations(service);
  const serviceHref = getServicePath(service);

  return (
    <div className="group relative flex items-start gap-3 p-3.5 rounded-[22px] bg-white border border-[#E8E4E0] shadow-[0_6px_16px_rgba(0,0,0,0.05)] mb-3.5 transition-all duration-200 active:scale-[0.985] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
      <Link
        href={serviceHref}
        className="w-[100px] h-[100px] min-w-[100px] rounded-2xl overflow-hidden bg-[#F4F5F7] shrink-0 relative block"
      >
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50 text-xs font-semibold">
            Service
          </div>
        )}
      </Link>
      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
        <div>
          <Link href={serviceHref} className="block">
            <h4 className="text-sm font-bold text-[#1A1A1A] line-clamp-2 leading-snug hover:text-[#C86A37] transition-colors">
              {name}
            </h4>
          </Link>
          <p className="text-xs text-[#6B6B6B] line-clamp-2 mt-1 leading-normal">
            {desc}
          </p>
          {hasVar && vars.length > 0 ? (
            <span className="inline-block mt-1.5 text-[10px] font-bold text-[#C86A37] bg-[#FDE7DD] px-2 py-0.5 rounded-md">
              {vars.length} options
            </span>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-gray-100">
          <div className="text-base font-extrabold text-[#0F172A]">
            <ServicePrice service={service} />
          </div>
          <AddToCartButton service={service} size="sm" />
        </div>
      </div>
    </div>
  );
}

/** Phone-width home that faithfully mirrors the reference Repair Series app */
export function MobileAppHome() {
  const router = useRouter();
  const { customer } = useAuth();
  const { itemCount } = useCart();
  const { label, loading: locationLoading, refreshFromGps, applySavedAddress } =
    useLocation();
  const [categories, setCategories] = useState<CategoryDoc[]>([]);
  const [services, setServices] = useState<ServiceDoc[]>([]);
  const [comingSoon, setComingSoon] = useState<ServiceDoc[]>([]);
  const [cmsSections, setCmsSections] = useState<HomeSectionDoc[]>([]);
  const [serviceTypes, setServiceTypes] = useState<CategoryDoc[]>([]);
  const [serviceCategories, setServiceCategories] = useState<CategoryDoc[]>([]);
  const [banners, setBanners] = useState<HomeBannerDoc[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationError, setLocationError] = useState("");
  const locationRef = useRef<HTMLDivElement>(null);

  const savedAddresses = (Array.isArray(customer?.addresses)
    ? customer.addresses
    : []) as SavedAddress[];

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!locationRef.current?.contains(e.target as Node)) {
        setLocationOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const db = getDb();
    if (!db) return;
    void getDocs(query(collection(db, "categories"), orderBy("name", "asc"))).then((snap) => {
      setCategories(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as CategoryDoc)
          .filter((c) => c.active !== false && c.isActive !== false),
      );
    });
    void getDocs(collection(db, "serviceTypes")).then((snap) => {
      setServiceTypes(
        sortByDisplayOrder(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as CategoryDoc)
            .filter((row) => isCatalogActive(row)),
        ),
      );
    });
    void getDocs(collection(db, "serviceCategories")).then((snap) => {
      setServiceCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CategoryDoc));
    });
    void getDocs(collection(db, "banners")).then((snap) => {
      setBanners(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as HomeBannerDoc));
    });
    void getDocs(query(collection(db, "services"), orderBy("name", "asc"))).then((snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ServiceDoc);
      setServices(all.filter((s) => String(s.status || "Active") === "Active"));
    });
    const unsubSoon = onSnapshot(
      query(collection(db, "services"), where("status", "==", "Coming Soon")),
      (snap) => {
        setComingSoon(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as ServiceDoc & { previewStatus?: string })
            .filter(
              (s) => String(s.previewStatus ?? "Active") !== "Inactive",
            ),
        );
      },
    );
    const unsubSections = onSnapshot(collection(db, "homeSections"), (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as HomeSectionDoc);
      setCmsSections(filterHomeSectionsForPlatform(rows, "mobileWeb"));
    });
    return () => {
      unsubSoon();
      unsubSections();
    };
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("rs.homeServiceTypeId");
      if (saved) setSelectedTypeId(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (selectedTypeId) {
      try {
        window.localStorage.setItem("rs.homeServiceTypeId", selectedTypeId);
      } catch {
        /* ignore */
      }
      return;
    }
    const first = serviceTypes[0]?.id;
    if (first) setSelectedTypeId(first);
  }, [selectedTypeId, serviceTypes]);

  const selectedType = useMemo(
    () => serviceTypes.find((t) => t.id === selectedTypeId) || serviceTypes[0] || null,
    [serviceTypes, selectedTypeId],
  );

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) || null,
    [categories, selectedCategoryId],
  );

  const layoutSections = useMemo(
    () => filterHomeSectionsForServiceType(cmsSections, selectedType?.id),
    [cmsSections, selectedType?.id],
  );

  // Scoped categories for current service type (if mapped), else all categories
  const scopedCategories = useMemo(() => {
    if (!selectedType?.id) return categories;
    const filtered = categories.filter(
      (c) => !c.serviceTypeId || String(c.serviceTypeId) === String(selectedType.id),
    );
    return filtered.length > 0 ? filtered : categories;
  }, [categories, selectedType?.id]);

  const scopedServices = useMemo(() => {
    if (!selectedType?.id) return services;
    const filtered = services.filter(
      (s) => !s.serviceTypeId || String(s.serviceTypeId) === String(selectedType.id),
    );
    return filtered.length > 0 ? filtered : services;
  }, [services, selectedType?.id]);

  // When a category is selected in the category chrome, filter services by that category
  const filteredCategoryServices = useMemo(() => {
    if (!selectedCategoryId) return [];
    return scopedServices.filter(
      (s) =>
        String(s.categoryId || s.category_id || "") === String(selectedCategoryId),
    );
  }, [scopedServices, selectedCategoryId]);

  const onDetectLocation = async () => {
    setLocationError("");
    try {
      await refreshFromGps();
      setLocationOpen(false);
    } catch {
      setLocationError("Could not detect location. Try again or change manually.");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (selectedType?.id) params.set("type", selectedType.id);
    if (selectedCategoryId) params.set("category", selectedCategoryId);
    router.push(`/search?${params.toString()}`);
  };

  const searchPlaceholder = selectedCategory
    ? `Search in ${selectedCategory.name || selectedCategory.title}...`
    : selectedType
      ? `Search ${selectedType.name || selectedType.title} services...`
      : "Search services...";

  return (
    <div className="min-h-[100dvh] bg-[#F8F6F4] pb-20">
      {/* 1. Header (Reference App Match: Warm background, circular soft-orange location pin, uppercase SERVICE LOCATION, city + chevron, cart button) */}
      <header className="bg-gradient-to-b from-[#FFF7ED] via-white to-[#FAFAF9] px-4 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-3 border-b border-black/5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between gap-3">
          {/* Location Selector */}
          <div ref={locationRef} className="relative min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setLocationOpen((v) => !v)}
              className="flex items-center text-left max-w-full group"
              aria-expanded={locationOpen}
              aria-haspopup="listbox"
            >
              {/* Circular Soft-Orange Location Icon */}
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FFF7ED] text-[#C86A37] mr-2.5 transition-transform group-active:scale-95">
                <MapPin className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#C86A37]">
                  SERVICE LOCATION
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="truncate text-[15px] font-extrabold text-[#0F172A]">
                    {label || "Set your location"}
                  </span>
                  <ChevronDown
                    className={`size-4 shrink-0 text-[#64748B] transition-transform duration-200 ${
                      locationOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>
            </button>

            {/* Location Dropdown Modal */}
            {locationOpen ? (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-black/5 bg-white text-[#1A1A1A] shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150">
                <div className="border-b border-gray-100 px-3.5 py-2.5 bg-gray-50/70">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                    Current location
                  </div>
                  <div className="mt-0.5 truncate text-sm font-bold text-[#0F172A]">
                    {label || "Not set"}
                  </div>
                </div>
                <div className="p-1.5">
                  <button
                    type="button"
                    onClick={() => void onDetectLocation()}
                    disabled={locationLoading}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-orange-50 disabled:opacity-60"
                  >
                    {locationLoading ? (
                      <Loader2 className="size-4 animate-spin text-[#C86A37]" />
                    ) : (
                      <Navigation className="size-4 text-[#C86A37]" />
                    )}
                    Detect current location
                  </button>
                  <Link
                    href="/book"
                    onClick={() => setLocationOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-orange-50"
                  >
                    <Pencil className="size-4 text-[#C86A37]" />
                    Change location manually
                  </Link>
                </div>
                {savedAddresses.length > 0 ? (
                  <div className="border-t border-gray-100 p-1.5">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#64748b]">
                      Saved addresses
                    </div>
                    {savedAddresses.map((addr, idx) => {
                      const addrLabel =
                        String(addr.label ?? addr.type ?? "Address").trim() ||
                        `Address ${idx + 1}`;
                      const sub = [addr.area, addr.city, addr.pincode]
                        .filter(Boolean)
                        .join(", ");
                      return (
                        <button
                          key={addr.id ?? `${addrLabel}-${idx}`}
                          type="button"
                          onClick={() => {
                            applySavedAddress({
                              label: addrLabel,
                              lat: addr.lat,
                              lng: addr.lng,
                              city: addr.city,
                              state: addr.state,
                              pincode: addr.pincode,
                              street: addr.street,
                              area: addr.area,
                              fullAddress: addr.fullAddress,
                            });
                            setLocationOpen(false);
                          }}
                          className="flex w-full flex-col rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-orange-50"
                        >
                          <span className="font-bold text-[#0F172A]">{addrLabel}</span>
                          {sub ? (
                            <span className="truncate text-xs text-[#64748b]">
                              {sub}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                {locationError ? (
                  <div className="border-t border-gray-100 px-3 py-2 text-xs text-red-600">
                    {locationError}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Circular Cart Button with Live Badge */}
          <Link
            href="/cart"
            className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-white border border-black/10 shadow-sm transition-transform active:scale-90"
            aria-label={`Cart with ${itemCount} items`}
          >
            <ShoppingCart className="size-5 text-[#0F172A]" />
            {itemCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#C86A37] px-1 text-[10px] font-black text-white shadow-xs animate-in zoom-in-50 duration-200">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            ) : null}
          </Link>
        </div>
      </header>

      {/* 2. Reference App Catalog Chrome: Prominent Section */}
      <section className="bg-[#FFF7ED] rounded-b-[24px] px-3.5 pt-3 pb-4 space-y-3.5 border-b border-black/5 shadow-xs">
        {/* Service Type Strip (if multiple types) */}
        {serviceTypes.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {serviceTypes.map((t) => {
              const active = t.id === selectedTypeId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    if (isWallPanelCatalogItem(t)) {
                      router.push("/wall-panel");
                      return;
                    }
                    setSelectedTypeId(t.id);
                    setSelectedCategoryId(null);
                  }}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs ${
                    active
                      ? "bg-[#C86A37] text-white"
                      : "bg-white/75 text-[#475569] hover:bg-white hover:text-[#0F172A]"
                  }`}
                >
                  {t.name || t.title}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* CMS Category Filter Cards */}
        {scopedCategories.length > 0 ? (
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none snap-x">
            {/* "All" Categories Card */}
            <button
              type="button"
              data-category-card="all"
              onClick={() => setSelectedCategoryId(null)}
              className={`w-[84px] min-w-[84px] shrink-0 snap-start rounded-2xl overflow-hidden cursor-pointer transition-all duration-150 active:scale-95 flex flex-col text-left ${
                selectedCategoryId === null
                  ? "bg-white border-2 border-[#C86A37] shadow-md ring-2 ring-[#C86A37]/20"
                  : "bg-white/70 border border-[#E8E4E0] hover:bg-white"
              }`}
            >
              <div className="h-[56px] w-full bg-[#FFF7ED] flex items-center justify-center p-1.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#C86A37]">
                  <Grid className="size-5" />
                </div>
              </div>
              <div className="px-1.5 py-1.5 bg-white w-full flex items-center justify-center min-h-[38px]">
                <span className="text-[11px] font-bold text-[#1A1A1A] line-clamp-2 text-center leading-tight">
                  All
                </span>
              </div>
            </button>

            {/* Individual Category Cards */}
            {scopedCategories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  data-category-card="true"
                  onClick={() => {
                    setSelectedCategoryId((prev) => (prev === cat.id ? null : cat.id));
                  }}
                  className={`w-[84px] min-w-[84px] shrink-0 snap-start rounded-2xl overflow-hidden cursor-pointer transition-all duration-150 active:scale-95 flex flex-col text-left ${
                    isSelected
                      ? "bg-white border-2 border-[#C86A37] shadow-md ring-2 ring-[#C86A37]/20"
                      : "bg-white/70 border border-[#E8E4E0] hover:bg-white"
                  }`}
                >
                  <div className="h-[56px] w-full bg-[#FFF7ED] flex items-center justify-center p-1.5">
                    <CategoryIcon cat={cat} />
                  </div>
                  <div className="px-1.5 py-1.5 bg-white w-full flex items-center justify-center min-h-[38px]">
                    <span className="text-[11px] font-bold text-[#1A1A1A] line-clamp-2 text-center leading-tight">
                      {cat.name || cat.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}

        {/* 3. Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <div className="flex h-12 w-full items-center gap-2.5 rounded-2xl bg-white px-3.5 shadow-xs border border-black/5 focus-within:ring-2 focus-within:ring-[#C86A37]/30">
            <Search className="size-5 shrink-0 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#0F172A] outline-none placeholder:text-[#64748B]"
            />
          </div>
        </form>
      </section>

      {/* 4. Content Area: Selected Category Services OR Dynamic CMS Home Sections */}
      <main className="mt-3">
        {selectedCategory ? (
          /* When a category is selected: Render its services in reference app horizontal layout */
          <div className="px-4 py-2">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#0F172A]">
                  {selectedCategory.name || selectedCategory.title} Services
                </h3>
                <p className="text-xs text-[#64748B]">
                  {filteredCategoryServices.length} {filteredCategoryServices.length === 1 ? "service" : "services"} available
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCategoryId(null)}
                className="text-xs font-bold text-[#C86A37] hover:underline"
              >
                Clear filter
              </button>
            </div>

            {filteredCategoryServices.length > 0 ? (
              <div className="space-y-3">
                {filteredCategoryServices.map((svc) => (
                  <MobileServiceCard key={svc.id} service={svc} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
                <Wrench className="mx-auto size-8 text-gray-300" />
                <p className="mt-2 text-sm font-bold text-[#0F172A]">
                  No services found in this category
                </p>
                <p className="mt-1 text-xs text-[#64748B]">
                  Services for this category are being updated. Check back soon.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* When no category is selected: Render dynamic CMS sections (Banners, Featured Services, All Services) */
          layoutSections.length > 0 ? (
            <DynamicHomeSections
              variant="mobile"
              platform="mobileWeb"
              sections={layoutSections}
              categories={categories}
              services={services}
              comingSoon={comingSoon}
              extraCatalog={{ serviceTypes, serviceCategories }}
              selectedServiceTypeId={selectedType?.id || ""}
              selectedServiceTypeName={String(selectedType?.title || selectedType?.name || "")}
              banners={banners}
              onSelectServiceType={(id) => {
                const type = serviceTypes.find((t) => t.id === id);
                if (isWallPanelCatalogItem(type)) {
                  router.push("/wall-panel");
                  return;
                }
                setSelectedTypeId(id);
                setSelectedCategoryId(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          ) : (
            <div className="px-4 py-3">
              <div className="mb-3">
                <h3 className="text-base font-extrabold text-[#0F172A]">
                  Popular Services
                </h3>
                <p className="text-xs text-[#64748B]">
                  Most requested services in your area
                </p>
              </div>
              <div className="space-y-3">
                {scopedServices.slice(0, 8).map((svc) => (
                  <MobileServiceCard key={svc.id} service={svc} />
                ))}
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}
