"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { RemoteImage as Image } from "@/components/remote-image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getDb } from "@/lib/firebase/firestore";
import { loadService } from "@/lib/services/helpers";
import { getComingSoonPath, isComingSoonService } from "@/lib/catalog/slug";
import type { ServiceDoc } from "@/lib/booking/types";
import {
  getActiveVariations,
  getSelectedVariationPrice,
  getServicePriceDisplay,
  getVariationImage,
} from "@/lib/services/pricing";
import { AddToCartButton } from "@/components/services/add-to-cart-button";
import { useCart } from "@/context/cart-context";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ImageOff,
  MapPin,
  SearchX,
  Check,
} from "lucide-react";
import { PromoBannerSection } from "@/components/home/promo-banner";
import { resolveBannerSectionsForCategory } from "@/lib/banners/sections";
import { ServiceReviewsSection } from "@/components/reviews/service-reviews-section";
import { useServiceModal } from "@/context/service-modal-context";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

function getServiceName(s: ServiceDoc) {
  return s.name ?? s.title ?? "Service";
}

function getServiceImage(s: ServiceDoc) {
  return s.imageUrl ?? s.image ?? null;
}

/** Same rules as the User App process-step images: keep catalog order, skip unloadable URIs. */
function normalizeProcessStepImageUri(raw: unknown): string | null {
  if (raw == null) return null;
  const s = typeof raw === "string" ? raw.trim() : String(raw).trim();
  if (!s || s.toLowerCase() === "null" || s.toLowerCase() === "undefined") {
    return null;
  }
  try {
    if (/^\/\//.test(s)) {
      return new URL(`https:${s}`).href;
    }
    if (/^https?:\/\//i.test(s)) {
      return new URL(s).href;
    }
    if (/^data:image\//i.test(s)) {
      return s;
    }
  } catch {
    return null;
  }
  return null;
}

function ProcessStepImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <div className="relative mb-3 aspect-[20/9] w-full overflow-hidden rounded-xl bg-[#F3F0ED]">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 640px"
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function ServiceDetail({ serviceIdOrSlug }: { serviceIdOrSlug: string }) {
  const router = useRouter();
  const { openServiceModal } = useServiceModal();
  const { addItem } = useCart();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [service, setService] = useState<ServiceDoc | null>(null);
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);

  const db = useMemo(() => getDb(), []);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (mounted) {
        setLoading(true);
        setError(null);
        setService(null);
      }

      try {
        if (!db) {
          throw new Error(
            "Firebase is not configured. Create `.env.local` with NEXT_PUBLIC_FIREBASE_* values."
          );
        }
        const row = await loadService(db, serviceIdOrSlug);

        if (!mounted) return;
        
        if (row) {
          if (isComingSoonService(row as ServiceDoc)) {
            router.replace(getComingSoonPath(row as ServiceDoc));
            return;
          }
          openServiceModal(row as ServiceDoc);
          router.replace(`/?service=${serviceIdOrSlug}`);
          return;
        } else {
          setService(null);
        }

      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load service");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [db, serviceIdOrSlug, router]);

  // Premium Error State
  if (error) {
    return (
      <div className="mx-auto mt-8 flex max-w-3xl items-start gap-4 rounded-2xl border border-red-100 bg-red-50 p-6 text-red-900 shadow-sm">
        <AlertCircle className="mt-0.5 size-6 shrink-0 text-red-500" />
        <div>
          <h3 className="text-base font-bold">Couldn’t load service</h3>
          <p className="mt-1 text-sm leading-relaxed text-red-700/90">{error}</p>
          <Link href="/services" className="mt-4 inline-flex items-center text-sm font-bold text-red-600 hover:underline">
            <ArrowLeft className="mr-1.5 size-4" /> Back to services
          </Link>
        </div>
      </div>
    );
  }

  // Premium Loading Skeletons
  if (loading) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-[20px] border border-black/5 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
          <Skeleton className="aspect-[16/10] w-full rounded-t-[20px] rounded-b-none" />
          <div className="p-6 sm:p-8 space-y-4">
            <Skeleton className="h-9 w-3/5 rounded-lg" />
            <SkeletonText lines={3} />
            <div className="pt-6 border-t border-gray-100 space-y-3">
              <Skeleton className="h-5 w-1/3 rounded-md" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-10 rounded-xl" />
                <Skeleton className="h-10 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-[20px] border border-black/5 bg-white p-6 shadow-sm space-y-4">
            <Skeleton className="h-8 w-28 rounded-md" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <div className="rounded-[20px] border border-black/5 bg-white p-6 shadow-sm space-y-4">
            <Skeleton className="h-6 w-40 rounded-md" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Premium Not Found State
  if (!service) {
    return (
      <div className="mx-auto mt-8 flex max-w-2xl flex-col items-center justify-center rounded-[20px] border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-gray-100">
          <SearchX className="size-7 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-[#0a0f1c]">Service not found</h3>
        <p className="mt-2 max-w-md text-sm text-[#64748b]">
          The service might be unavailable, or your Firestore security rules don’t allow reads for this page.
        </p>
        <Link 
          href="/services" 
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#0a0f1c] px-6 text-sm font-medium text-white transition-colors hover:bg-[#162032]"
        >
          <ArrowLeft className="mr-2 size-4" /> Back to services
        </Link>
      </div>
    );
  }

  const name = getServiceName(service);
  const img = getServiceImage(service);
  const activeVariations = getActiveVariations(service);
  const priceDisplay = getServicePriceDisplay(service);
  const displayPrice = getSelectedVariationPrice(service, selectedVariationId);
  const bannerSections = resolveBannerSectionsForCategory(service, ["service_details"]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="-mx-4 mb-2 md:mx-0">
        <PromoBannerSection section={bannerSections} />
      </div>
      
      {/* Back Navigation */}
      <Link 
        href="/services" 
        className="mb-6 hidden items-center text-sm font-semibold text-[#64748b] transition-colors hover:text-[#C86A37] md:inline-flex"
      >
        <ArrowLeft className="mr-2 size-4" /> Back to all services
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        
        {/* Left Column: Image and Details */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-[20px] border border-black/5 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
            <div className="relative aspect-[16/10] w-full bg-gray-100">
              {img ? (
                <img 
                  alt={name} 
                  src={img} 
                  className="h-full w-full object-cover" 
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-[#94a3b8]">
                  <ImageOff className="mb-2 size-10 opacity-50" />
                  <span className="text-sm font-medium uppercase tracking-wider opacity-70">No image available</span>
                </div>
              )}
            </div>
            
            <div className="p-6 sm:p-8">
              <h1 className="text-3xl font-bold tracking-tight text-[#0a0f1c] sm:text-4xl">{name}</h1>
              <div className="mt-6">
                <h3 className="mb-2 text-lg font-bold text-[#0a0f1c]">Service Description</h3>
                <p className="text-[1.05rem] leading-relaxed text-[#64748b]">
                  {service.description ?? "Expert repair, installation, and maintenance by verified professionals. Book a slot today to get your appliance working perfectly."}
                </p>
              </div>

              {/* Key Points */}
              {service.keyPoints && service.keyPoints.length > 0 && (
                <div className="mt-8 border-t border-gray-100 pt-8">
                  <h3 className="mb-4 text-lg font-bold text-[#0a0f1c]">Key Highlights</h3>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {service.keyPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-[0.95rem] text-[#64748b]">
                        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#25D366]" />
                        <span className="leading-snug">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Process steps — same images and order as the User App */}
              {Array.isArray(service.processSteps) && service.processSteps.length > 0 && (
                <div className="mt-8 border-t border-gray-100 pt-8">
                  <h3 className="mb-6 text-lg font-bold text-[#0a0f1c]">Our process</h3>
                  <div className="space-y-0">
                    {service.processSteps.map((step, idx) => {
                      const title = String(step?.title || "").trim();
                      const description = String(step?.description || "").trim();
                      const imageUri = normalizeProcessStepImageUri(
                        step?.image ?? step?.imageUrl,
                      );
                      if (!title && !description && !imageUri) return null;
                      const isLast = idx === service.processSteps!.length - 1;
                      return (
                        <div key={idx} className="flex gap-4">
                          <div className="flex w-8 shrink-0 flex-col items-center">
                            <span className="flex size-8 items-center justify-center rounded-full bg-[#C86A37] text-sm font-bold text-white">
                              {idx + 1}
                            </span>
                            {!isLast ? (
                              <span className="mt-1 min-h-8 w-0.5 flex-1 bg-[#C86A37]/25" />
                            ) : null}
                          </div>
                          <div className={isLast ? "min-w-0 flex-1 pb-1" : "min-w-0 flex-1 pb-8"}>
                            {imageUri ? (
                              <ProcessStepImage src={imageUri} alt={title || `Step ${idx + 1}`} />
                            ) : null}
                            {title ? (
                              <h4 className="font-bold text-[#0a0f1c]">{title}</h4>
                            ) : null}
                            {description ? (
                              <p className="mt-1 text-sm leading-relaxed text-[#64748b]">
                                {description}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Steps */}
        <aside className="space-y-6">
          
          {/* Pricing Card */}
          <div className="rounded-[20px] border border-[#C86A37]/20 bg-[#FFF7ED]/30 p-6 shadow-xs sm:p-8">
            <div className="text-xs font-bold uppercase tracking-wider text-[#C86A37]">Service Pricing</div>
            <div className="mt-2 flex items-baseline gap-2 text-[#0a0f1c]">
              <span className="text-4xl font-black text-[#0a0f1c]">
                {typeof displayPrice === "number"
                  ? `₹${displayPrice}`
                  : priceDisplay.label ?? "—"}
              </span>
              {typeof displayPrice === "number" && (
                <span className="text-xs font-semibold text-[#64748b]">/ total</span>
              )}
            </div>
            {priceDisplay.optionsLabel ? (
              <p className="mt-1 text-xs font-medium text-[#64748b]">
                {priceDisplay.optionsLabel}
              </p>
            ) : null}
            <div className="mt-3 flex items-center gap-2 text-xs font-medium text-[#64748b]">
              <Clock className="size-3.5" />
              {service.duration ? `Duration: ${service.duration}` : "Duration varies based on repair"}
            </div>

            {/* Variations — image cards like the app */}
            {activeVariations.length > 0 && (
              <div className="mt-6 space-y-3 border-t border-gray-200/70 pt-6">
                <div className="text-sm font-bold text-[#0a0f1c]">
                  Select option ({activeVariations.length})
                </div>
                <div className="grid gap-3">
                  {activeVariations.map((variation) => {
                    const isSelected = selectedVariationId === variation.id;
                    const img = getVariationImage(variation);
                    const mrp = variation.originalPrice;
                    const showStrike =
                      mrp != null && Number(mrp) > Number(variation.price);
                    return (
                      <button
                        key={variation.id}
                        type="button"
                        onClick={() => setSelectedVariationId(variation.id)}
                        className={[
                          "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all",
                          isSelected
                            ? "border-[#C86A37] bg-white shadow-xs ring-1 ring-[#C86A37]"
                            : "border-gray-200 bg-white/80 hover:border-[#C86A37]/50 hover:bg-white",
                        ].join(" ")}
                      >
                        <div className="relative size-[72px] shrink-0 overflow-hidden rounded-xl bg-[#F3F0ED]">
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={img}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[#C4BDB6]">
                              <ImageOff className="size-6" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={[
                                "line-clamp-2 text-sm font-semibold",
                                isSelected ? "text-[#0a0f1c]" : "text-[#334155]",
                              ].join(" ")}
                            >
                              {variation.title}
                            </span>
                            <span
                              className={[
                                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                                isSelected
                                  ? "border-[#C86A37] bg-[#C86A37]"
                                  : "border-gray-300",
                              ].join(" ")}
                            >
                              {isSelected ? (
                                <Check className="size-3.5 text-white" />
                              ) : null}
                            </span>
                          </div>
                          {variation.rating != null ? (
                            <p className="mt-1 text-xs font-semibold text-emerald-600">
                              ★ {Number(variation.rating).toFixed(1)}
                            </p>
                          ) : null}
                          <div className="mt-1.5 flex items-baseline gap-2">
                            <span className="text-sm font-bold text-[#C86A37]">
                              ₹{Math.round(variation.price).toLocaleString("en-IN")}
                            </span>
                            {showStrike ? (
                              <span className="text-xs text-[#94a3b8] line-through">
                                ₹{Math.round(Number(mrp)).toLocaleString("en-IN")}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            <button
              type="button"
              onClick={() => {
                if (!service) return;
                const activeVars = getActiveVariations(service);
                const v = activeVars.find((x) => x.id === selectedVariationId) || activeVars[0];
                if (v) {
                  addItem(service, 1, {
                    id: v.id,
                    title: v.title,
                    price: v.price,
                    imageUrl: v.imageUrl || v.image || undefined,
                  });
                } else {
                  addItem(service, 1);
                }
                router.push("/cart/checkout");
              }}
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#C86A37] to-[#A85028] px-5 text-sm font-bold text-white shadow-xs transition-all duration-300 hover:opacity-95 cursor-pointer"
            >
              Book Now
            </button>
            <div className="mt-3">
              <AddToCartButton
                service={service}
                variationId={selectedVariationId}
                className="w-full"
              />
            </div>
            <p className="mt-4 text-center text-xs text-[#64748b]">
              No hidden fees. 30-day warranty on all repairs.
            </p>
          </div>

          {/* Steps Card */}
          <div className="rounded-[20px] border border-black/5 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.02)] sm:p-8">
            <h3 className="text-lg font-bold text-[#0a0f1c]">What happens next?</h3>
            <ul className="mt-6 space-y-5">
              <li className="flex items-start gap-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Calendar className="size-4" />
                </div>
                <div>
                  <div className="font-bold text-[#0a0f1c]">1. Choose a date</div>
                  <div className="text-sm text-[#64748b]">Pick a day that works for you.</div>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#FFF7ED] text-[#C86A37]">
                  <Clock className="size-4" />
                </div>
                <div>
                  <div className="font-bold text-[#0a0f1c]">2. Pick a time slot</div>
                  <div className="text-sm text-[#64748b]">Select an available 90-minute window.</div>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                  <MapPin className="size-4" />
                </div>
                <div>
                  <div className="font-bold text-[#0a0f1c]">3. Confirm address</div>
                  <div className="text-sm text-[#64748b]">Provide your exact service location.</div>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <div className="font-bold text-[#0a0f1c]">4. Track your booking</div>
                  <div className="text-sm text-[#64748b]">Get live updates on technician arrival.</div>
                </div>
              </li>
            </ul>
          </div>
          
        </aside>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 p-3 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-[#64748b]">Total Price</div>
            <div className="truncate text-lg font-black text-[#C86A37]">
              {displayPrice != null
                ? `₹${Math.round(displayPrice).toLocaleString("en-IN")}`
                : priceDisplay.label ?? "-"}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <AddToCartButton
              service={service}
              variationId={selectedVariationId}
            />
            <Link
              href={`/book/${service.slug ?? service.id}${selectedVariationId ? `?variation=${selectedVariationId}` : ""}`}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#C86A37] hover:bg-[#A85028] px-5 text-sm font-bold text-white shadow-md transition-transform active:scale-95"
            >
              Book Now
            </Link>
          </div>
        </div>
      </div>
            </div>

      {/* Customer Reviews & Ratings Section */}
      <ServiceReviewsSection
        serviceId={service.id}
        serviceName={name}
        initialRating={service.rating}
        initialReviewCount={service.reviewCount}
        initialDistribution={service.ratingDistribution as Record<number, number> | undefined}
      />
    </div>
  );
}
