"use client";

import Link from "next/link";
import { Container } from "@/components/container";
import {
  ShieldCheck,
  ArrowRight,
  MapPin,
  Star,
  Clock,
  UserCheck,
  Tag,
  Settings,
  MessageCircle,
  Wrench,
  Search,
  CheckCircle2,
  Sparkles,
  Layers,
  ChevronRight,
  Phone,
  Zap,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isWallPanelCatalogItem } from "@/lib/catalog/wallPanel";
import { isCatalogActive, sortByDisplayOrder } from "@/lib/catalog/hierarchy";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import {
  ApplianceRepairSection,
  CleaningEssentialsSection,
  MostBookedSection,
} from "@/components/home/service-sections";
import { DynamicHomeSections } from "@/components/home/dynamic-home-sections";
import { HeroMarketplace, type HeroMarketplaceItem } from "@/components/home/hero-marketplace";
import { FloatingCartBar } from "@/components/home/floating-cart-bar";
import { BookConsultationModal } from "@/components/wall-panel/book-consultation-modal";
import { SERVICE_CITIES, SITE_NAME } from "@/lib/seo/site";
import { getDb } from "@/lib/firebase/firestore";
import type { ServiceDoc as FirestoreServiceDoc } from "@/lib/booking/types";
import {
  filterHomeSectionsForPlatform,
  type HomeBannerDoc,
  type HomeSectionDoc,
} from "@/lib/home-sections/resolve";
import { MobileGlobalHeader } from "@/components/header/mobile-global-header";
import { LocalSeoBreadcrumbs } from "@/components/seo/local-seo-breadcrumbs";
import { useServiceModal } from "@/context/service-modal-context";
import {
  APPLIANCE_SERVICES,
  type ApplianceService,
  type GurgaonLocation,
  type GurgaonZone,
} from "@/lib/seo/gurgaon-locations";

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
};

type ServiceDoc = FirestoreServiceDoc;

type HomeReview = {
  name: string;
  area: string;
  rating: number;
  text: string;
  reviewDate?: string;
};

type LocationHomeClientProps = {
  location: GurgaonLocation;
  zone?: GurgaonZone | null;
  nearby: GurgaonLocation[];
  faqs: Array<{ q: string; a: string }>;
  appliance?: ApplianceService | null;
};

export function LocationHomeClient({
  location,
  zone,
  nearby,
  faqs,
  appliance,
}: LocationHomeClientProps) {
  const [categories, setCategories] = useState<CategoryDoc[]>([]);
  const [services, setServices] = useState<ServiceDoc[]>([]);
  const [comingSoon, setComingSoon] = useState<ServiceDoc[]>([]);
  const [homeReviews, setHomeReviews] = useState<HomeReview[]>([]);
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [cmsSections, setCmsSections] = useState<HomeSectionDoc[]>([]);
  const [serviceTypes, setServiceTypes] = useState<CategoryDoc[]>([]);
  const [serviceCategories, setServiceCategories] = useState<CategoryDoc[]>([]);
  const [banners, setBanners] = useState<HomeBannerDoc[]>([]);
  const [heroMarketplaceItems, setHeroMarketplaceItems] = useState<HeroMarketplaceItem[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isWallPanelModalOpen, setIsWallPanelModalOpen] = useState(false);
  const [selectedServiceTypeForModal, setSelectedServiceTypeForModal] = useState<CategoryDoc | null>(null);

  const { openServiceModal } = useServiceModal();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoadError(null);
        const db = getDb();
        if (!db) return;

        const [catSnap, svcSnap, soonSnap, typeSnap, issueSnap, bannerSnap] =
          await Promise.all([
            getDocs(query(collection(db, "categories"), orderBy("name", "asc"))).catch(() => null),
            getDocs(query(collection(db, "services"), orderBy("name", "asc"))).catch(() => null),
            getDocs(query(collection(db, "services"), where("status", "==", "Coming Soon"))).catch(() => null),
            getDocs(collection(db, "serviceTypes")).catch(() => null),
            getDocs(collection(db, "serviceCategories")).catch(() => null),
            getDocs(collection(db, "banners")).catch(() => null),
          ]);

        if (catSnap) {
          const fetchedCategories = catSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as CategoryDoc[];
          setCategories(
            fetchedCategories.filter((cat) => cat.active !== false && cat.isActive !== false),
          );
        }

        if (svcSnap) {
          setServices(
            svcSnap.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .filter((s) => String((s as ServiceDoc).status ?? "Active") === "Active") as ServiceDoc[],
          );
        }

        if (soonSnap) {
          setComingSoon(
            soonSnap.docs
              .map((d) => ({ id: d.id, ...d.data() }) as ServiceDoc)
              .filter((s) => String((s as { previewStatus?: string }).previewStatus ?? "Active") !== "Inactive"),
          );
        }

        if (typeSnap) {
          setServiceTypes(
            sortByDisplayOrder(
              typeSnap.docs
                .map((d) => ({ id: d.id, ...d.data() }) as CategoryDoc)
                .filter((row) => isCatalogActive(row)),
            ),
          );
        }

        if (issueSnap) {
          setServiceCategories(issueSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as CategoryDoc));
        }

        if (bannerSnap) {
          setBanners(bannerSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as HomeBannerDoc));
        }
      } catch (error) {
        setLoadError(
          error instanceof Error ? error.message : "Could not load services. Please refresh.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    const db = getDb();
    if (!db) return;
    const unsub = onSnapshot(doc(db, "settings", "general"), (snap) => {
      const data = snap.exists() ? snap.data() : {};
      const url = String(data.googleReviewUrl ?? "").trim();
      setGoogleReviewUrl(url);
      const rows = Array.isArray(data.homeReviews) ? data.homeReviews : [];
      const parsed = rows
        .filter((r) => r && typeof r === "object")
        .map((r) => ({
          name: String(r.name ?? "").trim(),
          area: String(r.area ?? "").trim(),
          rating: Math.min(5, Math.max(1, Number(r.rating) || 5)),
          text: String(r.text ?? r.review ?? "").trim(),
          reviewDate: String(r.reviewDate ?? r.date ?? "").trim(),
        }))
        .filter((r) => r.name && r.text);
      if (parsed.length) setHomeReviews(parsed);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const db = getDb();
    if (!db) return;
    const unsub = onSnapshot(collection(db, "homeSections"), (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as HomeSectionDoc);
      setCmsSections(filterHomeSectionsForPlatform(rows, "desktopWeb"));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const db = getDb();
    if (!db) return;
    const unsub = onSnapshot(doc(db, "settings", "heroMarketplace"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data?.items)) {
          setHeroMarketplaceItems(data.items as HeroMarketplaceItem[]);
        }
      }
    });
    return () => unsub();
  }, []);

  const features = [
    {
      title: `${location.responseTime} Arrival`,
      desc: `Rapid dispatch of verified technicians across ${location.name} and adjoining Gurgaon sectors.`,
      icon: Clock,
    },
    {
      title: "Vetted & Background-Verified",
      desc: "Police-verified, skill-tested professionals for your family's safety.",
      icon: UserCheck,
    },
    {
      title: "Upfront & Fixed Pricing",
      desc: "Standard inspection fee starting ₹199 (waived on repair). No hidden charges.",
      icon: Tag,
    },
    {
      title: "30-Day Service Warranty",
      desc: "Unconditional 30-day service revisit warranty and genuine OEM spare parts.",
      icon: Settings,
    },
  ];

  const modalCategories = useMemo(() => {
    if (!selectedServiceTypeForModal) return [];
    const typeId = selectedServiceTypeForModal.id;
    const directMatches = categories.filter(
      (c) => (c as Record<string, unknown>).serviceTypeId === typeId,
    );
    if (directMatches.length > 0) return directMatches;
    return categories;
  }, [selectedServiceTypeForModal, categories]);

  const useCms = cmsSections.length > 0;

  // WhatsApp pre-filled chat URL
  const whatsappQuery = appliance
    ? `Hi Repair Series, I need ${appliance.name} in ${location.name}, Gurgaon.`
    : `Hi Repair Series, I need home appliance repair service in ${location.name}, Gurgaon.`;
  const whatsappUrl = `https://wa.me/919311788877?text=${encodeURIComponent(whatsappQuery)}`;

  // Default reviews fallback if general settings reviews empty
  const displayReviews = useMemo(() => {
    if (homeReviews.length > 0) return homeReviews;
    return [
      {
        name: "Rohit Malhotra",
        area: `${location.name}, Gurgaon`,
        rating: 5,
        text: `Called Repair Series for split AC cooling issue in ${location.name}. The technician arrived within 45 minutes, checked gas pressure, cleaned filters, and gave a transparent quote. Excellent service!`,
        reviewDate: "Recent Service",
      },
      {
        name: "Pooja Sharma",
        area: `Sector 37D, Gurgaon`,
        rating: 5,
        text: "My washing machine was vibrating and not spinning. The technician diagnosed a worn-out drive belt, had a genuine replacement part ready, and fixed it the same day with 30 days warranty.",
        reviewDate: "Verified Customer",
      },
      {
        name: "Anand Verma",
        area: `${location.name}, Gurgaon`,
        rating: 5,
        text: `Kitchen chimney deep cleaning was done thoroughly. All grease and oil removed with high-pressure foam jet wash. Very professional service in ${location.name}!`,
        reviewDate: "Verified Customer",
      },
    ];
  }, [homeReviews, location.name]);

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] text-slate-900 antialiased font-sans">
      {/* Mobile-Only Header Bar with 2 Rows: Location + Cart, Search */}
      <MobileGlobalHeader />

      {loadError ? (
        <div className="border-b border-rose-200 bg-rose-50 px-4 py-2.5 text-center text-xs font-semibold text-rose-800">
          {loadError}{" "}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="font-bold underline ml-1"
          >
            Retry
          </button>
        </div>
      ) : null}

      <main className="pb-16 sm:pb-24">
        <Container>
          {/* SECTION 0: Location Header & Context (Cleanly Integrated into Homepage Visual System) */}
          <div className="pt-4 sm:pt-6 pb-2">
            <LocalSeoBreadcrumbs
              items={[
                { name: "Service Areas", url: "/service-areas" },
                ...(zone ? [{ name: zone.name, url: "/service-areas" }] : []),
                { name: location.name, url: `/service-areas/${location.slug}` },
                ...(appliance ? [{ name: appliance.shortName, url: `/service-areas/${location.slug}/${appliance.slug}` }] : []),
              ]}
            />

            <div className="mt-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF7ED] px-3 py-1 text-xs font-extrabold text-[#C86A37] border border-[#FED7AA]">
                  <MapPin className="size-3.5 text-[#C86A37]" />
                  <span>Doorstep Service in {location.name}, Gurgaon · {location.responseTime}</span>
                </div>
                <h1 className="mt-2 text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  {appliance
                    ? `${appliance.name} in ${location.name}, Gurgaon`
                    : `Home Appliance Repair Services in ${location.name}, Gurgaon`}
                </h1>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-600 font-medium max-w-2xl leading-relaxed">
                  {appliance
                    ? `Looking for reliable ${appliance.shortName} repair in ${location.name}? RepairSeries provides certified doorstep repair solutions with genuine parts and 30-day warranty.`
                    : `Looking for reliable home appliance repair services in ${location.name}? RepairSeries provides professional doorstep repair solutions for your household appliances.`}
                </p>
              </div>

              {/* Instant Call & WhatsApp CTAs */}
              <div className="flex items-center gap-2.5 shrink-0">
                <a
                  href="tel:+919311788877"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-xs hover:border-[#C45508] hover:text-[#C45508] transition"
                >
                  <Phone className="size-3.5 text-[#C45508]" />
                  <span>Call +91 93117 88877</span>
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] px-3.5 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-[#20bd5a] transition active:scale-95"
                >
                  <MessageCircle className="size-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* SECTION 1: Urban Company Signature Split Hero Card (Exact Homepage Component) */}
          <HeroMarketplace
            categories={categories}
            services={services}
            serviceTypes={serviceTypes}
            serviceCategories={serviceCategories}
            banners={banners}
            customItems={heroMarketplaceItems}
            onSelectServiceType={(id) => {
              const type = serviceTypes.find((t) => t.id === id);
              if (type) {
                if (isWallPanelCatalogItem(type)) {
                  router.push("/wall-panel");
                  return;
                }
                setSelectedServiceTypeForModal(type);
              }
            }}
          />

          {/* SPECIAL SECTION: Featured Selected Appliance Spotlight (When visiting specific appliance URL) */}
          {appliance && (
            <section className="mt-4 mb-6 rounded-3xl border border-[#C45508]/30 bg-gradient-to-br from-white via-[#FFF7ED]/40 to-[#FED7AA]/20 p-5 sm:p-8 shadow-sm">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="rounded-full bg-[#C45508] px-3 py-1 text-xs font-black text-white">
                      Featured Service in {location.name}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-extrabold text-slate-800 border border-slate-200 shadow-xs">
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      <span>{appliance.rating || 4.85} ({appliance.reviewCount || "4.2K+"})</span>
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                      ₹{appliance.startingPrice} Onwards
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {appliance.name} in {location.name}, Gurgaon
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 font-medium max-w-2xl leading-relaxed">
                    Same-day doorstep service across {location.name} and surrounding sectors. Verified technicians arrive in {location.responseTime} equipped with genuine spare parts.
                  </p>

                  {/* Sub-services pills */}
                  <div className="mt-4">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Available Solutions &amp; Pricing:
                    </span>
                    <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                      {appliance.subServices.map((sub, sIdx) => (
                        <span
                          key={sIdx}
                          className="inline-flex items-center gap-1 rounded-xl bg-white/90 border border-slate-200/90 px-2.5 py-1 text-xs font-bold text-slate-800 shadow-2xs"
                        >
                          <CheckCircle2 className="size-3 text-[#C45508]" />
                          <span>{sub}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Types supported */}
                  {appliance.typesSupported && appliance.typesSupported.length > 0 && (
                    <div className="mt-3">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                        Models &amp; Types Serviced:
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {appliance.typesSupported.map((t, tIdx) => (
                          <span
                            key={tIdx}
                            className="rounded-lg bg-orange-100/60 text-[#C45508] px-2 py-0.5 text-[11px] font-semibold"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right side: Image & Book Button */}
                <div className="w-full lg:w-72 shrink-0 flex flex-col sm:flex-row lg:flex-col items-center gap-3">
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs">
                    <img
                      src={appliance.image || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80"}
                      alt={`${appliance.name} in ${location.name}`}
                      className="size-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 rounded-md bg-slate-900/80 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white">
                      ⏱️ {appliance.avgDuration}
                    </div>
                    <div className="absolute bottom-2 right-2 rounded-md bg-emerald-600/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white">
                      🛡️ {appliance.warranty}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const dbSvc = services.find(
                        (s) =>
                          String(s.name || s.title || "").toLowerCase().includes(appliance.shortName.toLowerCase()),
                      );
                      if (dbSvc) {
                        openServiceModal(dbSvc);
                      } else {
                        openServiceModal({
                          id: appliance.id,
                          name: `${appliance.name} in ${location.name}`,
                          price: appliance.startingPrice,
                          duration: appliance.avgDuration,
                          image: appliance.image,
                        } as any);
                      }
                    }}
                    className="w-full rounded-xl bg-[#C45508] py-3 text-center text-xs font-black text-white shadow-md hover:bg-[#A84504] transition active:scale-95 cursor-pointer"
                  >
                    Book {appliance.shortName} in {location.name} →
                  </button>
                </div>
              </div>
            </section>
          )}



          {/* SECTION 3: Dynamic Home Sections / Trending Services (Homepage Component) */}
          {useCms ? (
            <DynamicHomeSections
              variant="desktop"
              platform="desktopWeb"
              sections={cmsSections}
              categories={categories}
              services={services}
              comingSoon={comingSoon}
              extraCatalog={{ serviceTypes, serviceCategories }}
              selectedServiceTypeId=""
              selectedServiceTypeName="All Services"
              banners={banners}
              onSelectServiceType={(id) => {
                const type = serviceTypes.find((t) => t.id === id);
                if (type) {
                  if (isWallPanelCatalogItem(type)) {
                    router.push("/wall-panel");
                    return;
                  }
                  setSelectedServiceTypeForModal(type);
                }
              }}
            />
          ) : (
            <div className="space-y-6">
              <MostBookedSection services={services} />
              <ApplianceRepairSection services={services} />
              <CleaningEssentialsSection services={services} />
            </div>
          )}

          {/* Service Type Associated Categories Modal */}
          {selectedServiceTypeForModal ? (
            <div className="fixed inset-0 z-999 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
              <div className="w-full max-w-lg overflow-hidden rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {selectedServiceTypeForModal.title || selectedServiceTypeForModal.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select a category to view available doorstep services in {location.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedServiceTypeForModal(null)}
                    className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-[60vh] overflow-y-auto p-1">
                  {modalCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/categories/${cat.id}`}
                      onClick={() => setSelectedServiceTypeForModal(null)}
                      className="flex flex-col items-center text-center p-2.5 rounded-2xl border border-slate-200/80 hover:border-[#C45508]/40 hover:bg-[#FFF7ED]/30 transition group"
                    >
                      <div className="size-14 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                        {cat.homeImage || cat.imageUrl || cat.image || cat.icon ? (
                          <img
                            src={cat.homeImage || cat.imageUrl || cat.image || cat.icon}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <Wrench className="size-6 text-slate-300" />
                        )}
                      </div>
                      <span className="text-[11px] sm:text-xs font-bold text-slate-800 line-clamp-2 leading-tight">
                        {cat.name || cat.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {/* SECTION 4: Wall Panels Exclusive Studio Feature Banner (Exact Homepage Component) */}
          <section className="my-10 rounded-3xl overflow-hidden border border-slate-200/90 bg-gradient-to-r from-[#240308] via-[#540D17] to-[#7E1926] p-8 sm:p-14 min-h-[360px] sm:min-h-[400px] flex flex-col justify-center text-white shadow-xl relative">
            <div className="absolute right-0 top-0 w-1/2 h-full opacity-20 pointer-events-none">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80"
                alt=""
                className="size-full object-cover"
              />
            </div>
            <div className="relative z-10 max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#FDBA74] backdrop-blur-md mb-3 border border-white/15">
                <Sparkles className="size-3.5 text-[#FB923C]" />
                <span>RepairSeries Studio · Designer Wall Panels</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                Transform your home in {location.name} with luxury wall panels & louvers
              </h2>
              <p className="mt-2.5 text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                Charcoal louvers, fluted acoustic panels, and custom TV unit paneling. Book a free doorstep design consultation in {location.name} with actual material swatches.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/wall-panel"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs sm:text-sm font-extrabold text-[#7E1926] hover:bg-slate-100 transition-transform active:scale-95 shadow-md"
                >
                  <span>Explore 50+ Wall Designs</span>
                  <ArrowRight className="size-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsWallPanelModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <span>Book Consultation – ₹49</span>
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 5: Why Choose RepairSeries ("The RepairSeries Promise") */}
          <section className="py-12 border-t border-slate-200/80">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="rounded-full bg-[#FFF7ED] text-[#C86A37] border border-[#FED7AA] px-3 py-1 text-xs font-black uppercase tracking-wider">
                The RepairSeries Standard
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-3">
                Why households in {location.name} trust RepairSeries
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1.5">
                Professionalism, standardized pricing, and guaranteed accountability on every job.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#C86A37] border border-[#FED7AA] mb-3.5">
                    <item.icon className="size-5.5" />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-xs text-slate-500 font-semibold leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 6: Customer Reviews */}
          <section className="py-12 border-t border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#C86A37]">
                  Verified Customer Reviews
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                  Trusted by homeowners in {location.name} & Gurugram
                </h2>
              </div>
              {googleReviewUrl ? (
                <a
                  href={googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C86A37] hover:underline shrink-0"
                >
                  <span>Read on Google Maps</span>
                  <ArrowRight className="size-3.5" />
                </a>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {displayReviews.slice(0, 3).map((review, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1 mb-2.5">
                      {Array.from({ length: review.rating }).map((_, starIdx) => (
                        <Star key={starIdx} className="size-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed italic">
                      &ldquo;{review.text}&rdquo;
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900">{review.name}</span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {[review.area, review.reviewDate].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 7: Coverage & Related Service Areas */}
          <section className="my-10 rounded-3xl bg-slate-900 p-8 sm:p-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,106,55,0.15)_0%,transparent_70%)] pointer-events-none" />
            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/80 border border-white/15">
                {zone ? `Zone: ${zone.name}` : "Gurgaon Operations"}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-3">
                Doorstep service guaranteed in {location.name} & adjoining areas
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 font-semibold">
                Average technician arrival time: <strong className="text-white">{location.responseTime}</strong>
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <span className="rounded-full border border-[#C45508] bg-[#C45508]/20 px-3 py-1.5 text-xs font-bold text-white">
                  📍 {location.name} (Active)
                </span>
                {nearby.map((near) => (
                  <Link
                    key={near.slug}
                    href={`/service-areas/${near.slug}`}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/15 hover:text-white transition"
                  >
                    {near.name}
                  </Link>
                ))}
                <Link
                  href="/service-areas"
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-[#FDBA74] hover:bg-white/20 transition"
                >
                  View All 188 Gurgaon Areas →
                </Link>
              </div>
            </div>
          </section>

          {/* SECTION 8: Frequently Asked Questions Accordion (Exact Homepage Design) */}
          <section className="py-10 border-t border-slate-200/80">
            <div className="text-center max-w-xl mx-auto mb-8">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Frequently Asked Questions in {location.name}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                Everything you need to know about our doorstep appliance repairs in {location.name}
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-3">
              {faqs.map((faq, idx) => (
                <details
                  key={idx}
                  className="group rounded-2xl border border-slate-200/80 bg-white p-4 transition-all [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer items-center justify-between font-extrabold text-sm text-slate-900 group-open:text-[#C86A37]">
                    <span>{faq.q}</span>
                    <span className="transition-transform duration-200 group-open:rotate-180 text-slate-400">
                      ▼
                    </span>
                  </summary>
                  <p className="mt-3 text-xs sm:text-sm font-semibold text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        </Container>
      </main>

      {/* Floating WhatsApp Action Button */}
      <aside aria-label="WhatsApp Contact" className="fixed bottom-24 right-4 sm:bottom-28 sm:right-6 z-40">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Chat on WhatsApp about appliance repair in ${location.name}`}
          className="flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-2xl hover:bg-[#20bd5a] hover:scale-105 active:scale-95 transition-all"
        >
          <MessageCircle className="size-5" />
          <span className="hidden sm:inline font-bold text-xs tracking-wide">
            Chat on WhatsApp
          </span>
        </a>
      </aside>

      {/* Wall Panels Consultation Modal */}
      <BookConsultationModal
        isOpen={isWallPanelModalOpen}
        onClose={() => setIsWallPanelModalOpen(false)}
      />

      {/* Urban Company Signature Floating Cart Bar */}
      <FloatingCartBar />
    </div>
  );
}
