"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { collection, onSnapshot } from "firebase/firestore";
import {
  ArrowLeft,
  Sparkles,
  ArrowRight,
  Layers,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { getDb } from "@/lib/firebase/firestore";
import type {
  WallPanelCategory,
  WallPanelProduct,
} from "@/lib/wall-panel/models";
import {
  DEFAULT_WALL_PANEL_CATEGORIES,
  DEFAULT_WALL_PANEL_PRODUCTS,
} from "@/lib/wall-panel/seed-data";
import { WallPanelProductCard } from "@/components/wall-panel/cards";
import { BookConsultationModal } from "@/components/wall-panel/book-consultation-modal";

export default function WallPanelCategoryPage() {
  const params = useParams();
  const categoryId = String(params?.id || "");
  const router = useRouter();

  const [categories, setCategories] = useState<WallPanelCategory[]>(DEFAULT_WALL_PANEL_CATEGORIES);
  const [products, setProducts] = useState<WallPanelProduct[]>(DEFAULT_WALL_PANEL_PRODUCTS);
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);

  useEffect(() => {
    const db = getDb();
    if (!db) return;

    const unsubCat = onSnapshot(collection(db, "wallPanelCategories"), (snap) => {
      if (!snap.empty) {
        setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as WallPanelCategory[]);
      }
    });

    const unsubProd = onSnapshot(collection(db, "wallPanelProducts"), (snap) => {
      if (!snap.empty) {
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as WallPanelProduct[]);
      }
    });

    return () => {
      unsubCat();
      unsubProd();
    };
  }, []);

  const currentCategory = useMemo(() => {
    return categories.find((c) => c.id === categoryId) || categories[0];
  }, [categories, categoryId]);

  // Products belonging to this category
  const categoryProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.active !== false &&
        (p.categoryId === categoryId ||
          p.categoryName?.toLowerCase() === currentCategory?.name?.toLowerCase())
    );
  }, [products, categoryId, currentCategory]);

  // All unique tags available in this category
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    categoryProducts.forEach((p) => {
      (p.tags || []).forEach((t) => set.add(t));
    });
    return ["All", ...Array.from(set)];
  }, [categoryProducts]);

  // Filtered by selected tag
  const filteredProducts = useMemo(() => {
    if (selectedTag === "All") return categoryProducts;
    return categoryProducts.filter((p) => (p.tags || []).includes(selectedTag));
  }, [categoryProducts, selectedTag]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 pb-28 selection:bg-[#C45508] selection:text-white">
      {/* 1. Header with Back Button */}
      <nav className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link
          href="/wall-panel"
          className="inline-flex items-center gap-2 rounded-full bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition active:scale-95"
        >
          <ArrowLeft className="size-4" />
          <span>All Wall Panels</span>
        </Link>

        <span className="text-xs sm:text-sm font-extrabold text-slate-800 truncate max-w-[200px] sm:max-w-none">
          {currentCategory?.title || currentCategory?.name}
        </span>

        <button
          type="button"
          onClick={() => setIsConsultationModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#C45508] px-3.5 py-1.5 text-xs font-extrabold text-white shadow-sm hover:bg-[#A84706] transition"
        >
          <Sparkles className="size-3.5" />
          <span className="hidden sm:inline">Book Consultation – ₹49</span>
          <span className="sm:hidden">₹49 Visit</span>
        </button>
      </nav>

      {/* 2. Category Hero Banner */}
      <div className="relative w-full aspect-[16/6] sm:aspect-[21/6] max-h-[320px] overflow-hidden bg-slate-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentCategory?.image || ""}
          alt={currentCategory?.title || currentCategory?.name}
          className="size-full object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-6 sm:pb-8 w-full">
            <span className="inline-block rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2 border border-white/20">
              Style Collection
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
              {currentCategory?.title || currentCategory?.name}
            </h1>
            {currentCategory?.description ? (
              <p className="mt-1 text-xs sm:text-sm text-white/85 max-w-xl font-medium">
                {currentCategory.description}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* 3. Product Catalog Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Filter Tags */}
        {availableTags.length > 2 ? (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <Filter className="size-4 text-slate-400 shrink-0 mr-1" />
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition whitespace-nowrap active:scale-95 ${
                  selectedTag === tag
                    ? "bg-[#C45508] text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        ) : null}

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Layers className="size-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">No Products Found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              No wall panel designs published under this filter yet. You can book a consultation to explore physical catalog samples.
            </p>
            <button
              type="button"
              onClick={() => setIsConsultationModalOpen(true)}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#C45508] px-5 py-2.5 text-xs font-bold text-white shadow-sm"
            >
              Book In-Home Consultation – ₹49
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {filteredProducts.map((prod) => (
              <WallPanelProductCard key={prod.id} product={prod} className="w-full" />
            ))}
          </div>
        )}
      </main>

      {/* Floating Book Consultation CTA */}
      <div className="fixed bottom-5 sm:bottom-8 right-4 sm:right-8 z-40">
        <button
          type="button"
          onClick={() => setIsConsultationModalOpen(true)}
          className="group relative flex items-center gap-3 rounded-full bg-gradient-to-r from-[#C45508] via-[#B84E07] to-[#8C2C04] px-5 sm:px-6 py-3.5 sm:py-4 text-white shadow-[0_10px_35px_rgba(196,85,8,0.45)] hover:shadow-[0_14px_45px_rgba(196,85,8,0.55)] transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden select-none"
        >
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-amber-400 to-[#C45508] opacity-35 blur-xs animate-pulse" />
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:translate-x-full duration-1000 transition-transform" />

          <div className="relative z-10 flex size-7 sm:size-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
            <Sparkles className="size-4 text-amber-200" />
          </div>

          <div className="relative z-10 text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-200 leading-none">
              Doorstep Samples & Measure
            </p>
            <p className="text-sm sm:text-base font-black text-white leading-tight mt-0.5">
              Book Consultation – ₹49
            </p>
          </div>

          <ArrowRight className="relative z-10 size-4.5 sm:size-5 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>

      <BookConsultationModal
        isOpen={isConsultationModalOpen}
        onClose={() => setIsConsultationModalOpen(false)}
      />
    </div>
  );
}
