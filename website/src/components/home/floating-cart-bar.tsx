"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ShoppingBag, ArrowRight, X } from "lucide-react";
import { useCart } from "@/context/cart-context";

export function FloatingCartBar() {
  const pathname = usePathname() || "";
  const { items, itemCount, openCart } = useCart();
  const [dismissed, setDismissed] = useState(false);

  // Hide on checkout / cart pages or if dismissed / empty
  const shouldHide =
    itemCount === 0 ||
    dismissed ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/book");

  const categoryCount = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.categoryId) set.add(item.categoryId);
    }
    return Math.max(1, set.size);
  }, [items]);

  const totalEstimate = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0);
  }, [items]);

  if (shouldHide) return null;

  return (
<div className="fixed bottom-20 sm:bottom-24 mb-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-300">
  <div className="pointer-events-auto flex items-center justify-between gap-3 sm:gap-6 rounded-2xl bg-white/55 backdrop-blur-xl backdrop-saturate-150 px-4 sm:px-5 py-3 shadow-[0_8px_32px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.7)] border border-white/60 ring-1 ring-slate-900/5 max-w-xl w-full">
    {/* Left item & category count */}
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF7ED]/70 backdrop-blur-md text-[#C86A37] border border-white/80 shadow-xs">
        <ShoppingBag className="size-5" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm text-slate-900 truncate">
            {itemCount} {itemCount === 1 ? "item" : "items"} in cart
          </span>
          <span className="hidden sm:inline-block text-xs font-semibold text-slate-400">·</span>
          <span className="hidden sm:inline-block text-xs font-semibold text-slate-700 truncate">
            from {categoryCount} {categoryCount === 1 ? "category" : "categories"}
          </span>
        </div>
        {totalEstimate > 0 ? (
          <p className="text-xs font-bold text-[#C86A37]">
            ₹{totalEstimate.toLocaleString("en-IN")}{" "}
            <span className="text-[11px] font-medium text-slate-500">(est.)</span>
          </p>
        ) : null}
      </div>
    </div>

    {/* Right CTA button & close icon */}
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={openCart}
        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#C86A37]/95 to-[#A85028]/95 backdrop-blur-md px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-[0_4px_14px_rgba(200,106,55,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] border border-white/20 transition-all active:scale-95 hover:opacity-95 cursor-pointer"
      >
        <span>View Cart</span>
        <ArrowRight className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss floating cart"
        className="flex size-8 items-center justify-center rounded-lg bg-white/40 hover:bg-white/75 text-slate-500 hover:text-slate-800 border border-white/50 backdrop-blur-sm transition-colors cursor-pointer"
      >
        <X className="size-4" />
      </button>
    </div>
  </div>
</div>
  );
}
