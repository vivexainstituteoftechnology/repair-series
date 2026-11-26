"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { collection, onSnapshot } from "firebase/firestore";
import {
  ArrowLeft,
  Share2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Lightbulb,
  Shield,
  Palette,
  Hammer,
  Box,
  CheckCircle2,
  Check,
  Plus,
  ArrowRight,
  Info,
  CalendarCheck,
} from "lucide-react";
import { getDb } from "@/lib/firebase/firestore";
import type {
  WallPanelProduct,
  WallPanelComponent,
} from "@/lib/wall-panel/models";
import { DEFAULT_WALL_PANEL_PRODUCTS } from "@/lib/wall-panel/seed-data";
import { BookConsultationModal } from "@/components/wall-panel/book-consultation-modal";

const COMPONENT_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  layers: Layers,
  lightbulb: Lightbulb,
  shield: Shield,
  palette: Palette,
  hammer: Hammer,
  box: Box,
  sparkles: Sparkles,
};

export default function WallPanelProductDetailPage() {
  const params = useParams();
  const productId = String(params?.productId || "");
  const router = useRouter();

  const [products, setProducts] = useState<WallPanelProduct[]>(DEFAULT_WALL_PANEL_PRODUCTS);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [selectedComponentIds, setSelectedComponentIds] = useState<Set<string>>(new Set(["comp-base"]));
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);

  const heroImageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const db = getDb();
    if (!db) return;
    const unsub = onSnapshot(collection(db, "wallPanelProducts"), (snap) => {
      if (!snap.empty) {
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as WallPanelProduct[]);
      }
    });
    return () => unsub();
  }, []);

  const product = useMemo(() => {
    return products.find((p) => p.id === productId) || products[0];
  }, [products, productId]);

  // Default select base wall component on product load
  useEffect(() => {
    if (product?.components?.length) {
      const defaultIds = product.components
        .filter((c) => c.isDefault)
        .map((c) => c.id);
      setSelectedComponentIds(
        new Set(defaultIds.length ? defaultIds : [product.components[0].id])
      );
    }
  }, [product]);

  // Track scroll position to transition header between transparent and solid sticky
  useEffect(() => {
    const handleScroll = () => {
      if (!heroImageRef.current) return;
      const rect = heroImageRef.current.getBoundingClientRect();
      // When hero image bottom scrolls above 70px, make header sticky
      setIsHeaderSticky(rect.bottom <= 70);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const images = Array.isArray(product?.images) && product.images.length > 0
    ? product.images
    : ["/placeholder.jpg"];

  // Toggle optional components
  const toggleComponent = (comp: WallPanelComponent) => {
    if (comp.isDefault) return; // Base wall design is mandatory
    setSelectedComponentIds((prev) => {
      const next = new Set(prev);
      if (next.has(comp.id)) {
        next.delete(comp.id);
      } else {
        next.add(comp.id);
      }
      return next;
    });
  };

  // Calculate estimated total based on selected components
  const estimatedTotal = useMemo(() => {
    if (!product?.components?.length) return product?.price || 16999;
    return product.components.reduce((sum, comp) => {
      if (selectedComponentIds.has(comp.id)) {
        return sum + (Number(comp.price) || 0);
      }
      return sum;
    }, 0);
  }, [product, selectedComponentIds]);

  // Similar looks / related products
  const similarProducts = useMemo(() => {
    if (!product) return [];
    if (product.similarProductIds?.length) {
      const matches = product.similarProductIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is WallPanelProduct => Boolean(p && p.active !== false));
      if (matches.length) return matches;
    }
    // Fallback: other products in same or other categories
    return products
      .filter((p) => p.id !== product.id && p.active !== false)
      .slice(0, 4);
  }, [product, products]);

  // Native share or copy link
  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out ${product.title} on Repair Series Wall Panels Studio!`,
          url,
        });
      } catch {
        // user cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setShareToast("Link copied to clipboard!");
        setTimeout(() => setShareToast(null), 2500);
      } catch {
        setShareToast("Share URL: " + url);
        setTimeout(() => setShareToast(null), 3500);
      }
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="size-8 rounded-full border-2 border-[#C45508] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 pb-36 selection:bg-[#C45508] selection:text-white">
      {/* 1. Header (Transparent initially -> Transitions smoothly to Sticky with Product Name on scroll) */}
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ease-in-out px-4 sm:px-8 py-3.5 flex items-center justify-between ${
          isHeaderSticky
            ? "bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <Link
          href="/wall-panel"
          className={`flex size-10 items-center justify-center rounded-full transition-all duration-200 active:scale-90 ${
            isHeaderSticky
              ? "bg-slate-100 text-slate-800 hover:bg-slate-200"
              : "bg-black/40 backdrop-blur-md text-white hover:bg-black/60 shadow-md"
          }`}
          aria-label="Back to Wall Panel Studio"
        >
          <ArrowLeft className="size-5" />
        </Link>

        {/* Product Title visible when sticky */}
        <div
          className={`transition-all duration-300 text-center truncate max-w-[220px] sm:max-w-md ${
            isHeaderSticky ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          <h2 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
            {product.title}
          </h2>
          <p className="text-[11px] font-bold text-[#C45508]">
            Starts at ₹{product.price.toLocaleString("en-IN")}
          </p>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className={`flex size-10 items-center justify-center rounded-full transition-all duration-200 active:scale-90 ${
            isHeaderSticky
              ? "bg-slate-100 text-slate-800 hover:bg-slate-200"
              : "bg-black/40 backdrop-blur-md text-white hover:bg-black/60 shadow-md"
          }`}
          aria-label="Share product"
        >
          <Share2 className="size-4.5" />
        </button>
      </header>

      {/* 2. Full-Width Product Image Slideshow */}
      <div
        ref={heroImageRef}
        className="relative w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] max-h-[580px] bg-slate-950 overflow-hidden"
      >
        <div
          className="flex size-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${activeImageIdx * 100}%)` }}
        >
          {images.map((imgUrl, idx) => (
            <div key={idx} className="relative size-full shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgUrl}
                alt={`${product.title} photo ${idx + 1}`}
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
            </div>
          ))}
        </div>

        {/* Slideshow Arrows (if multiple photos) */}
        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() =>
                setActiveImageIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1))
              }
              aria-label="Previous photo"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex size-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/70 transition"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() =>
                setActiveImageIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0))
              }
              aria-label="Next photo"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex size-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/70 transition"
            >
              <ChevronRight className="size-5" />
            </button>

            {/* Thumbnail dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImageIdx(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === activeImageIdx
                      ? "bg-white w-6 shadow-md"
                      : "bg-white/50 w-2 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {/* 3. Product Information & Content Body */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-8">
        {/* Category & Tags Row */}
        <div className="flex flex-wrap items-center gap-2">
          {product.categoryName ? (
            <Link
              href={`/wall-panel/category/${product.categoryId}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF7ED] text-[#C45508] border border-[#FED7AA] px-3 py-1 text-xs font-bold uppercase tracking-wider hover:bg-[#FED7AA] transition"
            >
              <Layers className="size-3" />
              <span>{product.categoryName}</span>
            </Link>
          ) : null}

          {(product.tags || []).map((t) => (
            <span
              key={t}
              className="rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-semibold"
            >
              {t}
            </span>
          ))}
        </div>

        {/* Product Title & Starting Price with Dimensions */}
        <div className="space-y-2 border-b border-slate-200/80 pb-6">
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {product.title}
          </h1>

          {product.tagline ? (
            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
              {product.tagline}
            </p>
          ) : null}

          {/* Pricing Highlight Box */}
          <div className="mt-4 inline-flex items-baseline gap-2 rounded-2xl bg-amber-50/80 border border-amber-200/80 px-4 py-2.5">
            <span className="text-xs sm:text-sm font-bold text-amber-950">Starting at</span>
            <span className="text-xl sm:text-2xl font-black text-[#C45508]">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-amber-800">
              for {product.dimensions}
            </span>
          </div>
        </div>

        {/* Product Description */}
        {product.description ? (
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              About This Design
            </h3>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
              {product.description}
            </p>
          </div>
        ) : null}

        {/* 4. Product Items / Components (Configurable breakdown) */}
        {product.components && product.components.length > 0 ? (
          <div className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Included & Optional Components
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Customizable materials configured during your home consultation.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {product.components.map((comp) => {
                const IconComponent = COMPONENT_ICON_MAP[comp.icon || "layers"] || Layers;
                const isSelected = selectedComponentIds.has(comp.id);

                return (
                  <div
                    key={comp.id}
                    onClick={() => toggleComponent(comp)}
                    className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#C45508] bg-[#FFF7ED]/40 shadow-xs"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                    } ${comp.isDefault ? "cursor-default" : ""}`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`flex size-10 items-center justify-center rounded-xl transition ${
                          isSelected
                            ? "bg-[#C45508] text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        <IconComponent className="size-5" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm sm:text-base text-slate-900">
                            {comp.name}
                          </h4>
                          {comp.isDefault ? (
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                              Mandatory Base
                            </span>
                          ) : null}
                        </div>
                        {comp.description ? (
                          <p className="text-xs text-slate-500 mt-0.5">{comp.description}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-sm text-slate-900">
                        +₹{Number(comp.price || 0).toLocaleString("en-IN")}
                      </span>
                      <div
                        className={`flex size-6 items-center justify-center rounded-full border transition ${
                          isSelected
                            ? "border-[#C45508] bg-[#C45508] text-white"
                            : "border-slate-300 bg-white text-transparent"
                        }`}
                      >
                        <Check className="size-3.5 stroke-[3]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Estimated Configuration Total */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-600 font-medium">Estimated configuration price:</span>
              <span className="text-base sm:text-lg font-black text-[#C45508]">
                ₹{estimatedTotal.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        ) : null}

        {/* 5. In-Home Consultation Highlight Card */}
        <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 p-5 sm:p-7 space-y-4">
          <div className="flex items-center gap-2.5 text-[#C45508]">
            <Sparkles className="size-5" />
            <span className="text-xs font-black uppercase tracking-wider">
              100% Hassle-Free Process
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-slate-900">
            How Repair Series Wall Panel Booking Works
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs text-slate-700">
            <div className="p-3.5 rounded-2xl bg-white/80 border border-amber-100">
              <div className="font-black text-[#C45508] text-base mb-1">01</div>
              <div className="font-bold text-slate-900">Book Visit (₹49)</div>
              <div className="text-slate-500 mt-0.5">
                Design specialist visits with physical swatches & laser measure.
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 border border-amber-100">
              <div className="font-black text-[#C45508] text-base mb-1">02</div>
              <div className="font-bold text-slate-900">Approve Quotation</div>
              <div className="text-slate-500 mt-0.5">
                Exact transparent quote. ₹49 consultation fee is 100% credited back.
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 border border-amber-100">
              <div className="font-black text-[#C45508] text-base mb-1">03</div>
              <div className="font-bold text-slate-900">48-Hour Installation</div>
              <div className="text-slate-500 mt-0.5">
                Dust-free installation backed by our 10-year structural warranty.
              </div>
            </div>
          </div>
        </div>

        {/* 6. Explore Similar Looks (2-column grid of related products) */}
        {similarProducts.length > 0 ? (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">Explore Similar Looks</h3>
              <Link
                href="/wall-panel"
                className="text-xs font-bold text-[#C45508] hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3.5 sm:gap-6">
              {similarProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/wall-panel/${p.id}`}
                  className="group flex flex-col rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-lg transition-all"
                >
                  <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.images?.[0] || ""}
                      alt={p.title}
                      className="size-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="p-3 sm:p-4">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate group-hover:text-[#C45508] transition">
                      {p.title}
                    </h4>
                    <p className="mt-1 text-[11px] sm:text-xs font-semibold text-slate-500">
                      Starts at{" "}
                      <span className="font-black text-[#C45508]">
                        ₹{p.price.toLocaleString("en-IN")}
                      </span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </main>

      {/* 7. Fixed Bottom CTA: "Book at-home consultation for ₹49" */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3.5 sm:py-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:block">
            <p className="text-xs text-slate-500 font-medium">Doorstep Consultation</p>
            <p className="text-base font-black text-slate-900">
              ₹49{" "}
              <span className="text-xs font-normal text-emerald-700 font-semibold">
                (Fully refundable on order)
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsConsultationModalOpen(true)}
            className="w-full sm:w-auto flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#C45508] via-[#B84E07] to-[#8C2C04] px-6 py-3.5 text-sm sm:text-base font-bold text-white shadow-lg shadow-[#C45508]/30 hover:opacity-95 active:scale-[0.99] transition"
          >
            <CalendarCheck className="size-5" />
            <span>Book at-home consultation for ₹49</span>
            <ArrowRight className="size-4.5" />
          </button>
        </div>
      </div>

      {/* Toast Notification Pill */}
      {shareToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 rounded-full bg-slate-900/90 text-white px-5 py-2.5 text-xs sm:text-sm font-medium shadow-xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span>{shareToast}</span>
        </div>
      )}

      {/* Consultation Booking Modal */}
      <BookConsultationModal
        isOpen={isConsultationModalOpen}
        onClose={() => setIsConsultationModalOpen(false)}
        selectedProduct={product}
      />
    </div>
  );
}
