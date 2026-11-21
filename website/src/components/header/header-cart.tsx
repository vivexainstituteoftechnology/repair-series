"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/cart-context";

type HeaderCartButtonProps = {
  variant?: "default" | "onTheme";
  className?: string;
};

export function HeaderCartButton({ variant = "default", className = "" }: HeaderCartButtonProps) {
  const { itemCount, openCart } = useCart();

  const isTheme = variant === "onTheme";

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Cart, ${itemCount} items`}
      className={`relative flex size-10 items-center justify-center rounded-full border transition-all cursor-pointer ${
        isTheme
          ? "border-white/30 bg-white text-slate-900 shadow-xs hover:bg-slate-50"
          : "border-slate-200/90 bg-white/95 backdrop-blur-md text-slate-800 shadow-xs hover:bg-white"
      } ${className}`}
    >
      <ShoppingCart className="size-5" />
      {itemCount > 0 ? (
        <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#C45508] px-1 text-[10px] font-black text-white shadow-xs animate-in zoom-in duration-200 border-2 border-white">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      ) : null}
    </button>
  );
}
