"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Tag,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { RemoteImage as Image } from "@/components/remote-image";
import { calculateBookingCharges, buildLocalCheckoutQuote } from "@/lib/pricing";
import { calculateDiscount, validateCoupon, type CouponResult } from "@/lib/coupons/validate";
import { getDb } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/use-auth";

export function CartDrawer() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, itemCount, isCartOpen, closeCart, updateQuantity, removeItem } = useCart();
  const db = useMemo(() => getDb(), []);

  const [promoCode, setPromoCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen, closeCart]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  const pricingItems = useMemo(
    () =>
      items.map((i) => ({
        lineId: i.lineId,
        serviceId: i.serviceId,
        variationId: i.variationId,
        categoryId: i.categoryId,
        unitPrice: i.price,
        quantity: i.quantity,
      })),
    [items],
  );

  const charges = useMemo(() => calculateBookingCharges(pricingItems), [pricingItems]);
  const discountAmount = useMemo(
    () => calculateDiscount(charges.serviceSubtotal + charges.convenienceFee, appliedCoupon),
    [charges.serviceSubtotal, charges.convenienceFee, appliedCoupon],
  );

  const quote = useMemo(
    () =>
      items.length
        ? buildLocalCheckoutQuote({
            items: pricingItems,
            discountAmount,
          })
        : null,
    [items.length, pricingItems, discountAmount],
  );

  const applyPromo = async () => {
    if (!db) {
      setPromoError("Database not connected.");
      return;
    }
    setPromoLoading(true);
    setPromoError("");
    try {
      const result = await validateCoupon(
        db,
        promoCode,
        charges.serviceSubtotal + charges.convenienceFee,
      );
      if (!result.valid) {
        setAppliedCoupon(null);
        setPromoError(result.message);
        return;
      }
      setAppliedCoupon(result);
    } catch (e) {
      setAppliedCoupon(null);
      setPromoError(e instanceof Error ? e.message : "Could not apply coupon.");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleCheckout = () => {
    closeCart();
    if (items.length === 0) return;
    if (!user) {
      router.push("/auth?return=/cart/checkout");
      return;
    }
    router.push("/cart/checkout");
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      {/* Slide-over Drawer */}
      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#C86A37]">
              <ShoppingBag className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Your Cart</h2>
              <p className="text-xs text-slate-500 font-medium">
                {itemCount} {itemCount === 1 ? "service" : "services"} selected
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="flex size-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content Body */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 mb-4">
              <ShoppingBag className="size-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Your cart is empty</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-xs leading-relaxed">
              Explore our top-rated appliance repair, plumbing, and home cleaning services.
            </p>
            <button
              type="button"
              onClick={() => {
                closeCart();
                router.push("/services");
              }}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#C86A37] to-[#A85028] px-6 text-xs font-bold text-white shadow-sm transition hover:opacity-95"
            >
              Browse Services
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Guarantee Pill */}
            <div className="flex items-center gap-2 rounded-xl bg-[#FFF7ED] border border-[#FED7AA]/60 px-3.5 py-2.5 text-xs text-[#C86A37] font-semibold">
              <ShieldCheck className="size-4 shrink-0" />
              <span>⚡ Doorstep in 15-30 mins · 🛡️ 30-day warranty</span>
            </div>

            {/* Cart Items List */}
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.lineId}
                  className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs"
                >
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{item.name}</h4>
                      <p className="text-xs font-extrabold text-[#0F172A] mt-0.5">
                        ₹{item.price.toLocaleString("en-IN")}{" "}
                        <span className="text-[10px] text-slate-500 font-normal">/ item</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      {/* Stepper */}
                      <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                          className="flex size-7 items-center justify-center text-slate-600 hover:text-black transition"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="min-w-6 text-center text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                          className="flex size-7 items-center justify-center text-slate-600 hover:text-black transition"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.lineId)}
                        className="text-slate-400 hover:text-red-600 transition p-1"
                        title="Remove"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupons Section */}
            <div className="rounded-2xl border border-slate-200/80 p-3.5 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Tag className="size-3.5 text-[#C86A37]" />
                <span>Coupon & Offers</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs uppercase font-bold text-slate-800 outline-none focus:border-[#C86A37]"
                />
                <button
                  type="button"
                  onClick={applyPromo}
                  disabled={promoLoading || !promoCode.trim()}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-[#0F172A] px-3 text-xs font-bold text-white hover:bg-black transition disabled:opacity-50"
                >
                  {promoLoading ? <Loader2 className="size-3 animate-spin" /> : "Apply"}
                </button>
              </div>

              {!appliedCoupon && (
                <button
                  type="button"
                  onClick={() => setPromoCode("REPAIR25")}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#C86A37] hover:underline"
                >
                  <Sparkles className="size-3" />
                  <span>Tap to apply coupon: <strong>REPAIR25</strong></span>
                </button>
              )}

              {promoError ? <p className="text-[11px] text-red-600 font-medium">{promoError}</p> : null}
              {appliedCoupon?.valid ? (
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-800">
                  <span>✓ {appliedCoupon.code} applied</span>
                  <span>{appliedCoupon.message}</span>
                </div>
              ) : null}
            </div>

            {/* Itemized Price Details */}
            <div className="rounded-2xl border border-slate-200/80 p-4 bg-white space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2">
                Bill Summary
              </h4>
              <div className="flex justify-between text-slate-600">
                <span>Item Subtotal</span>
                <span className="font-semibold text-slate-900">
                  ₹{charges.serviceSubtotal.toLocaleString("en-IN")}
                </span>
              </div>
              {charges.convenienceFee > 0 ? (
                <div className="flex justify-between text-slate-600">
                  <span>Convenience Fee</span>
                  <span className="font-semibold text-slate-900">
                    ₹{charges.convenienceFee.toLocaleString("en-IN")}
                  </span>
                </div>
              ) : null}
              {charges.visitingCharge > 0 ? (
                <div className="flex justify-between text-slate-600">
                  <span>Visiting Charge</span>
                  <span className="font-semibold text-slate-900">
                    ₹{charges.visitingCharge.toLocaleString("en-IN")}
                  </span>
                </div>
              ) : null}
              {discountAmount > 0 ? (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Savings</span>
                  <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-slate-900 font-bold border-t border-slate-100 pt-2 text-sm">
                <span>Total Payable</span>
                <span className="text-[#C86A37] font-black">
                  ₹{(quote?.cart.customerTotal ?? charges.customerTotal).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Checkout Bar */}
        {items.length > 0 && (
          <div className="border-t border-slate-100 bg-white p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[11px] font-medium text-slate-500">Total</span>
                <div className="text-lg font-black text-[#C86A37]">
                  ₹{(quote?.cart.customerTotal ?? charges.customerTotal).toLocaleString("en-IN")}
                </div>
              </div>
              <Link
                href="/cart"
                onClick={closeCart}
                className="text-xs font-bold text-slate-600 hover:text-[#C86A37] underline"
              >
                View full cart
              </Link>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C86A37] to-[#A85028] text-sm font-bold text-white shadow-md transition hover:opacity-95 active:scale-[0.98]"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
