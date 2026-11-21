"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, ArrowRight } from "lucide-react";
import type { ServiceDoc } from "@/lib/booking/types";
import { useCart } from "@/context/cart-context";
import { buildLineId } from "@/lib/cart/storage";
import { getServicePath } from "@/lib/catalog/slug";
import {
  getActiveVariations,
  serviceHasVariations,
} from "@/lib/services/pricing";

type AddToCartButtonProps = {
  service: ServiceDoc;
  variationId?: string | null;
  className?: string;
  size?: "sm" | "md";
  showViewOptionsOnly?: boolean;
};

export function AddToCartButton({
  service,
  variationId,
  className = "",
  size = "md",
  showViewOptionsOnly = false,
}: AddToCartButtonProps) {
  const router = useRouter();
  const { items, addItem, updateQuantity } = useCart();
  const [error, setError] = useState("");

  const hasVar = serviceHasVariations(service);
  const variations = getActiveVariations(service);

  // If service has variations and no specific variation is passed, we check if any variation of this service is in cart
  const targetVariationId = variationId ?? (hasVar && variations.length === 1 ? variations[0]?.id : undefined);

  const lineId = useMemo(() => {
    return buildLineId(service.id, targetVariationId || undefined);
  }, [service.id, targetVariationId]);

  // Find existing cart row
  const cartItem = useMemo(() => {
    if (lineId) {
      const match = items.find((i) => i.lineId === lineId);
      if (match) return match;
    }
    // If hasVar and no specific variation chosen, find if any variation of this service is in cart
    if (hasVar && !variationId) {
      return items.find((i) => i.serviceId === service.id);
    }
    return undefined;
  }, [items, lineId, hasVar, variationId, service.id]);

  const quantity = cartItem ? Math.max(0, cartItem.quantity) : 0;
  const activeLineId = cartItem?.lineId || lineId;

  const handleInitialAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError("");

    // If service has multiple selectable variations and none specified, guide user to service detail
    if (hasVar && !variationId && variations.length > 1) {
      router.push(getServicePath(service));
      return;
    }

    try {
      if (hasVar) {
        const vId = targetVariationId || variations[0]?.id;
        const v = variations.find((x) => x.id === vId) || variations[0];
        if (!v) {
          router.push(getServicePath(service));
          return;
        }
        addItem(service, 1, {
          id: v.id,
          title: v.title,
          price: v.price,
          imageUrl: v.imageUrl || v.image || undefined,
        });
      } else {
        addItem(service, 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add to cart");
    }
  };

  const handleMinus = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError("");
    if (!activeLineId) return;
    try {
      updateQuantity(activeLineId, quantity - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update cart");
    }
  };

  const handlePlus = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError("");
    if (!activeLineId) return;
    try {
      updateQuantity(activeLineId, quantity + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update cart");
    }
  };

  const isSmall = size === "sm";

  // If service has multiple variations and user is on a card (not detail page with variation selected)
  if (hasVar && !variationId && variations.length > 1 && (showViewOptionsOnly || quantity === 0)) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          router.push(getServicePath(service));
        }}
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#C86A37]/35 bg-white font-bold text-[#C86A37] shadow-xs transition hover:bg-[#C86A37] hover:text-white ${
          isSmall ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm"
        } ${className}`}
      >
        <span>View Options</span>
        <ArrowRight className="size-3.5" />
      </button>
    );
  }

  // Active Stepper state when item is in cart
  if (quantity > 0) {
    return (
      <div className={`flex flex-col items-start ${className}`}>
        <div
          className={`inline-flex items-center rounded-xl border-1.5 border-[#C86A37] bg-[#FFF7ED] shadow-xs select-none ${
            isSmall ? "h-8" : "h-10"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleMinus}
            aria-label="Decrease quantity"
            className={`flex items-center justify-center text-[#C86A37] hover:bg-[#FFEDD5] active:scale-90 transition-transform ${
              isSmall ? "w-8 h-8" : "w-9 h-10"
            }`}
          >
            <Minus className={isSmall ? "size-3.5" : "size-4"} strokeWidth={2.5} />
          </button>
          <span
            className={`text-center font-extrabold text-[#C86A37] tabular-nums ${
              isSmall ? "min-w-[24px] text-xs px-1" : "min-w-[32px] text-sm px-1.5"
            }`}
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={handlePlus}
            aria-label="Increase quantity"
            className={`flex items-center justify-center text-[#C86A37] hover:bg-[#FFEDD5] active:scale-90 transition-transform ${
              isSmall ? "w-8 h-8" : "w-9 h-10"
            }`}
          >
            <Plus className={isSmall ? "size-3.5" : "size-4"} strokeWidth={2.5} />
          </button>
        </div>
        {error ? <span className="text-[10px] text-red-600 mt-1">{error}</span> : null}
      </div>
    );
  }

  // Initial State: + Add / Book
  return (
    <div className={`flex flex-col items-start ${className}`}>
      <button
        type="button"
        onClick={handleInitialAdd}
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#C86A37]/35 bg-white font-bold text-[#C86A37] shadow-xs transition hover:bg-[#C86A37] hover:text-white active:scale-95 ${
          isSmall ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm"
        } ${className}`}
      >
        <ShoppingCart className={isSmall ? "size-3" : "size-3.5"} />
        <span>+ Add / Book</span>
      </button>
      {error ? <span className="text-[10px] text-red-600 mt-1">{error}</span> : null}
    </div>
  );
}
