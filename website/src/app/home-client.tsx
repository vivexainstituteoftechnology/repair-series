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
import { ServicePrice } from "@/components/services/service-price";
import {
  ApplianceRepairSection,
  CleaningEssentialsSection,
  MostBookedSection,
} from "@/components/home/service-sections";
import { DynamicHomeSections } from "@/components/home/dynamic-home-sections";
import { HeroMarketplace } from "@/components/home/hero-marketplace";
import { SpotlightSection } from "@/components/home/spotlight-section";
import { FloatingCartBar } from "@/components/home/floating-cart-bar";
import { SERVICE_CITIES } from "@/lib/seo/site";
import { getDb } from "@/lib/firebase/firestore";
import type { ServiceDoc as FirestoreServiceDoc } from "@/lib/booking/types";
import { serviceHasVariations } from "@/lib/services/pricing";
import {
  getBookPath,
  getCategoryPath,
  getComingSoonPath,
  getServicePath,
} from "@/lib/catalog/slug";
import { splitComingSoonByCategory } from "@/lib/catalog/coming-soon";
import {
  filterHomeSectionsForPlatform,
  filterHomeSectionsForServiceType,
  type HomeBannerDoc,
  type HomeSectionDoc,
} from "@/lib/home-sections/resolve";
import { HeaderSearch } from "@/components/header/header-search";
import { HeaderLocationDropdown } from "@/components/header/header-location";
import { HeaderCartButton } from "@/components/header/header-cart";
import { HeaderAuth } from "@/components/header-auth";

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

export function HomePageClient() {
  const [categories, setCategories] = useState<CategoryDoc[]>([]);
  const [services, setServices] = useState<ServiceDoc[]>([]);
  const [comingSoon, setComingSoon] = useState<ServiceDoc[]>([]);
  const [homeReviews, setHomeReviews] = useState<HomeReview[]>([]);
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [cmsSections, setCmsSections] = useState<HomeSectionDoc[]>([]);
  const [serviceTypes, setServiceTypes] = useState<CategoryDoc[]>([]);
  const [serviceCategories, setServiceCategories] = useState<CategoryDoc[]>([]);
  const [banners, setBanners] = useState<HomeBannerDoc[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoadError(null);
        const db = getDb();
        if (!db) throw new Error("Firebase is not configured");

        const [catSnap, svcSnap, soonSnap, typeSnap, issueSnap, bannerSnap] =
          await Promise.all([
            getDocs(query(collection(db, "categories"), orderBy("name", "asc"))),
            getDocs(query(collection(db, "services"), orderBy("name", "asc"))),
            getDocs(query(collection(db, "services"), where("status", "==", "Coming Soon"))),
            getDocs(collection(db, "serviceTypes")),
            getDocs(collection(db, "serviceCategories")),
            getDocs(collection(db, "banners")),
          ]);

        const fetchedCategories = catSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as CategoryDoc[];

        setCategories(
          fetchedCategories.filter(
            (cat) => cat.active !== false && cat.isActive !== false,
          ),
        );
        setServices(
          svcSnap.docs
            .map((d) => ({
              id: d.id,
              ...d.data(),
            }))
            .filter((s) => String((s as ServiceDoc).status ?? "Active") === "Active") as ServiceDoc[],
        );
        setComingSoon(
          soonSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as ServiceDoc)
            .filter((s) => String((s as { previewStatus?: string }).previewStatus ?? "Active") !== "Inactive"),
        );
        setServiceTypes(
          sortByDisplayOrder(
            typeSnap.docs
              .map((d) => ({ id: d.id, ...d.data() }) as CategoryDoc)
              .filter((row) => isCatalogActive(row)),
          ),
        );
        setServiceCategories(issueSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as CategoryDoc));
        setBanners(bannerSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as HomeBannerDoc));
      } catch (error) {
        setLoadError(
          error instanceof Error ? error.message : "Could not load services. Please refresh the page.",
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

  const features = [
    {
      title: "60-90 Min Doorstep Arrival",
      desc: "Fast dispatch of verified experts across Gurugram, Hyderabad & Aligarh.",
      icon: Clock,
    },
    {
      title: "Vetted & Background-Verified",
      desc: "Police-verified, skill-tested professionals for your family's safety.",
      icon: UserCheck,
    },
    {
      title: "Upfront & Fixed Pricing",
      desc: "No hidden charges or surprise invoices. Pay only for what you approve.",
      icon: Tag,
    },
    {
      title: "30-Day Service Warranty",
      desc: "Unconditional 30-day service revisit warranty and genuine OEM spare parts.",
      icon: Settings,
    },
  ];

  const coverageAreas = [
    "DLF Phase 1-5", "Sushant Lok", "Golf Course Road", "Sohna Road",
    "Cyber City", "MG Road", "Palam Vihar", "New Gurugram",
    "Gachibowli", "Madhapur", "Banjara Hills", "Aligarh City",
  ];

  const cityLabel = SERVICE_CITIES.join(", ");

  const brands = [
    "LG", "SAMSUNG", "Whirlpool", "Bosch", "IFB", "Haier", "Godrej",
    "Panasonic", "Elica", "Faber", "Glen", "Moda", "Sunflame"
  ];

  const faqs = [
    {
      q: "What are your visiting charges?",
      a: "Our standard visiting and inspection charge is ₹199. This fee is completely waived off if you proceed with the repair service with us.",
    },
    {
      q: "Do you provide a warranty on repairs?",
      a: "Yes, we offer a strict 30-day service warranty on our repairs and up to 90 days of warranty on specific spare parts replaced by our technicians.",
    },
    {
      q: "How long does a repair usually take?",
      a: "Most standard repairs are completed within 1 to 2 hours right at your doorstep. For severe issues requiring specific parts, it may take 24-48 hours.",
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept Cash, UPI (Google Pay, PhonePe, Paytm), and major Credit/Debit cards after the service is successfully completed.",
    },
  ];

  const { main: comingSoonMain, commercial: comingSoonCommercial } = useMemo(
    () => splitComingSoonByCategory(comingSoon),
    [comingSoon],
  );

  const useCms = cmsSections.length > 0;

  useEffect(() => {
    if (selectedTypeId) return;
    const first = serviceTypes[0]?.id;
    if (first) setSelectedTypeId(first);
  }, [selectedTypeId, serviceTypes]);

  const selectedType = serviceTypes.find((t) => t.id === selectedTypeId) || serviceTypes[0];
  const homeLayoutSections = useMemo(
    () => filterHomeSectionsForServiceType(cmsSections, selectedType?.id),
    [cmsSections, selectedType?.id],
  );

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] text-slate-900 antialiased font-sans">
      {/* Mobile-Only Header Bar (matches Urban Company mobile top app bar) */}
      <div className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="RepairSeries" className="size-7 object-contain" />
            <span className="font-extrabold text-base tracking-tight text-slate-900">
              Repair<span className="text-[#C86A37]">Series</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <HeaderCartButton />
            <HeaderAuth />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <HeaderLocationDropdown />
          <div className="flex-1">
            <HeaderSearch />
          </div>
        </div>
      </div>

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
          {/* SECTION 1: Urban Company Signature Split Hero Card */}
          <HeroMarketplace
            categories={categories}
            serviceTypes={serviceTypes}
            banners={banners}
          />

          {/* SECTION 2: "In the spotlight" / Most Booked Services Carousel */}
          <SpotlightSection
            services={services}
            title="In the spotlight"
            subtitle="Most booked appliance & home repairs trusted by customers daily"
          />

          {/* SECTION 3: Dynamic Home Sections (from Firestore CMS) or Curated Sliders */}
          {useCms ? (
            <DynamicHomeSections
              variant="desktop"
              platform="desktopWeb"
              sections={homeLayoutSections}
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
              }}
            />
          ) : (
            <div className="space-y-6">
              <MostBookedSection services={services} />
              <ApplianceRepairSection services={services} />
              <CleaningEssentialsSection services={services} />
            </div>
          )}

          {/* SECTION 4: Wall Panels Exclusive Studio Feature Banner */}
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
                Transform your home with luxury wall panels & louvers
              </h2>
              <p className="mt-2.5 text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                Charcoal louvers, fluted acoustic panels, and custom TV unit paneling. Book a free doorstep design consultation with actual material swatches.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/wall-panel"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs sm:text-sm font-extrabold text-[#7E1926] hover:bg-slate-100 transition-transform active:scale-95 shadow-md"
                >
                  <span>Explore 50+ Wall Designs</span>
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/wall-panel/book"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-white/20 transition-colors"
                >
                  <span>Book Consultation ₹0</span>
                </Link>
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
                Why households trust RepairSeries over local mechanics
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
          {homeReviews.length > 0 || googleReviewUrl ? (
            <section className="py-12 border-t border-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#C86A37]">
                    Verified Customer Reviews
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                    Loved by thousands of homes in {cityLabel}
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
                {homeReviews.slice(0, 6).map((review, i) => (
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
          ) : null}

          {/* SECTION 7: Coverage & Cities */}
          <section className="my-10 rounded-3xl bg-slate-900 p-8 sm:p-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,106,55,0.15)_0%,transparent_70%)] pointer-events-none" />
            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/80 border border-white/15">
                Multi-City Operations
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-3">
                Doorstep service guaranteed across Gurugram, Hyderabad & Aligarh
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 font-semibold">
                Average technician arrival time: <strong className="text-white">60-90 minutes</strong>
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {coverageAreas.map((area) => (
                  <span
                    key={area}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 8: FAQs Accordion */}
          <section className="py-10 border-t border-slate-200/80">
            <div className="text-center max-w-xl mx-auto mb-8">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                Everything you need to know about our repair and maintenance services
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

      {/* Urban Company Signature Floating Cart Bar */}
      <FloatingCartBar />
    </div>
  );
}
