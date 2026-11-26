"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { collection, onSnapshot } from "firebase/firestore";
import {
  Sparkles,
  ArrowRight,
  Layers,
  Home,
} from "lucide-react";
import { getDb } from "@/lib/firebase/firestore";
import type {
  WallPanelCategory,
  WallPanelProduct,
  WallPanelSection,
  WallPanelBanner,
} from "@/lib/wall-panel/models";
import {
  DEFAULT_WALL_PANEL_BANNERS,
  DEFAULT_WALL_PANEL_CATEGORIES,
  DEFAULT_WALL_PANEL_PRODUCTS,
  DEFAULT_WALL_PANEL_SECTIONS,
} from "@/lib/wall-panel/seed-data";
import { WallPanelDynamicSections } from "@/components/wall-panel/dynamic-sections";
import { BookConsultationModal } from "@/components/wall-panel/book-consultation-modal";

export default function WallPanelPage() {
  const [banners, setBanners] = useState<WallPanelBanner[]>(DEFAULT_WALL_PANEL_BANNERS);
  const [categories, setCategories] = useState<WallPanelCategory[]>(DEFAULT_WALL_PANEL_CATEGORIES);
  const [products, setProducts] = useState<WallPanelProduct[]>(DEFAULT_WALL_PANEL_PRODUCTS);
  const [sections, setSections] = useState<WallPanelSection[]>(DEFAULT_WALL_PANEL_SECTIONS);
  const [loading, setLoading] = useState(true);

  // Floating Consultation Modal
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);

  // Real-time Firestore subscriptions with clean fallback
  useEffect(() => {
    const db = getDb();
    if (!db) {
      setLoading(false);
      return;
    }

    // 1. Subscribe to Banners
    const unsubBanners = onSnapshot(
      collection(db, "wallPanelBanners"),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as WallPanelBanner[];
          list.sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));
          setBanners(list);
        }
      },
      () => {}
    );

    // 2. Subscribe to Categories
    const unsubCategories = onSnapshot(
      collection(db, "wallPanelCategories"),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as WallPanelCategory[];
          list.sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));
          setCategories(list);
        }
      },
      () => {}
    );

    // 3. Subscribe to Products
    const unsubProducts = onSnapshot(
      collection(db, "wallPanelProducts"),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as WallPanelProduct[];
          list.sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));
          setProducts(list);
        }
      },
      () => {}
    );

    // 4. Subscribe to Dynamic Sections
    const unsubSections = onSnapshot(
      collection(db, "wallPanelSections"),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as WallPanelSection[];
          list.sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));
          setSections(list);
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => {
      unsubBanners();
      unsubCategories();
      unsubProducts();
      unsubSections();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 pb-28 selection:bg-[#C45508] selection:text-white">
      {/* 1. Immersive Studio Top Navigation Bar (No standard website header) */}
      <nav className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition"
          >
            <Home className="size-3.5" />
            <span>Home</span>
          </Link>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#C45508] text-white">
              <Layers className="size-4" />
            </div>
            <span className="font-black text-sm sm:text-base tracking-tight text-slate-900">
              Wall Panels <span className="text-[#C45508] font-bold">Studio</span>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsConsultationModalOpen(true)}
          className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-[#C45508] px-4 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-[#A84706] transition active:scale-95"
        >
          <Sparkles className="size-3.5" />
          <span>Book Consultation – ₹49</span>
        </button>
      </nav>

      {/* 2. Hero Slideshow / Banner (Managed via Admin Panel) */}
      <HeroBannerSlider
        banners={banners}
        onBookClick={() => setIsConsultationModalOpen(true)}
      />

      {/* 3. Main Studio Dynamic Sections */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 space-y-12 sm:space-y-16">
        <WallPanelDynamicSections
          sections={sections}
          categories={categories}
          products={products}
        />
      </main>

      {/* 4. Attractive Floating "Book Consultation – ₹49" Button with Subtle Attention-Grabbing Animation */}
      <div className="fixed bottom-5 sm:bottom-8 right-4 sm:right-8 z-40">
        <button
          type="button"
          onClick={() => setIsConsultationModalOpen(true)}
          className="group relative flex items-center gap-3 rounded-full bg-gradient-to-r from-[#C45508] via-[#B84E07] to-[#8C2C04] px-5 sm:px-6 py-3.5 sm:py-4 text-white shadow-[0_10px_35px_rgba(196,85,8,0.45)] hover:shadow-[0_14px_45px_rgba(196,85,8,0.55)] transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden select-none"
        >
          {/* Subtle Ambient Pulse Ring */}
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-amber-400 to-[#C45508] opacity-35 blur-xs animate-pulse" />

          {/* Shimmer Light Ray passing across */}
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:translate-x-full duration-1000 transition-transform" />

          <div className="relative z-10 flex size-7 sm:size-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
            <Sparkles className="size-4 text-amber-200 animate-spin-slow" />
          </div>

          <div className="relative z-10 text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-200 leading-none">
              Doorstep Samples & 3D Measure
            </p>
            <p className="text-sm sm:text-base font-black text-white leading-tight mt-0.5">
              Book Consultation – ₹49
            </p>
          </div>

          <ArrowRight className="relative z-10 size-4.5 sm:size-5 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>

      {/* 5. Consultation Booking Modal */}
      <BookConsultationModal
        isOpen={isConsultationModalOpen}
        onClose={() => setIsConsultationModalOpen(false)}
      />
    </div>
  );
}

/**
 * Customizable Hero Slideshow Slider
 */
function HeroBannerSlider({
  banners,
  onBookClick,
}: {
  banners: WallPanelBanner[];
  onBookClick: () => void;
}) {
  const activeBanners = [...banners].filter((b) => b.active !== false);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % activeBanners.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  if (activeBanners.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden bg-slate-950 aspect-[16/9] sm:aspect-[21/9] max-h-[580px]">
      <div
        className="flex size-full transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${currentIdx * 100}%)` }}
      >
        {activeBanners.map((b) => (
          <div key={b.id} className="relative size-full shrink-0">
            {/* Background image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={b.imageUrl}
              alt={b.title}
              className="size-full object-cover opacity-85"
            />

            {/* Gradient Mask for High Contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

            {/* Banner Text Content */}
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-7xl mx-auto px-5 sm:px-8 w-full">
                <div className="max-w-xl text-left space-y-3 sm:space-y-4">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-amber-300 border border-white/20">
                    <Sparkles className="size-3" />
                    <span>Exclusive Architectural Finishes</span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                    {b.title}
                  </h1>

                  {b.subtitle ? (
                    <p className="text-xs sm:text-base text-white/85 font-medium leading-relaxed max-w-lg drop-shadow-sm">
                      {b.subtitle}
                    </p>
                  ) : null}

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onBookClick}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C45508] to-[#9A3412] px-5 sm:px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-[#C45508]/30 hover:opacity-95 transition active:scale-95"
                    >
                      <span>{b.ctaText || "Book Consultation – ₹49"}</span>
                      <ArrowRight className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Slideshow Dots Indicator */}
      {activeBanners.length > 1 ? (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {activeBanners.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentIdx(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentIdx ? "bg-white w-6 shadow-md" : "bg-white/40 w-2 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
