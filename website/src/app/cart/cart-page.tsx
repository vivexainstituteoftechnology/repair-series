"use client";

import Link from "next/link";
import { RemoteImage as Image } from "@/components/remote-image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Container } from "@/components/container";
import { useCart } from "@/context/cart-context";
import { type CartItem } from "@/lib/cart/storage";
import {
  buildLocalCheckoutQuote,
  calculateBookingCharges,
} from "@/lib/pricing";
import { getBookPath } from "@/lib/catalog/slug";
import { SectionPromoBanner } from "@/components/home/promo-banner";
import { useAuth } from "@/hooks/use-auth";
import { getDb } from "@/lib/firebase/firestore";
import {
  calculateDiscount,
  validateCoupon,
  type CouponResult,
} from "@/lib/coupons/validate";

export default function CartPageClient() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const db = useMemo(() => getDb(), []);

  const [promoCode, setPromoCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  const pricingItems = useMemo(
    () =>
      items.map((i: CartItem) => ({
        lineId: i.lineId,
        serviceId: i.serviceId,
        variationId: i.variationId,
        categoryId: i.categoryId,
        unitPrice: i.price,
        quantity: i.quantity,
      })),
    [items],
  );
  const charges = useMemo(
    () => calculateBookingCharges(pricingItems),
    [pricingItems],
  );
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
      setPromoError("Firebase is not configured.");
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
      try {
        sessionStorage.setItem(
          "rs_cart_promo",
          JSON.stringify({ code: result.code, at: Date.now() }),
        );
      } catch {
        /* optional */
      }
    } catch (e) {
      setAppliedCoupon(null);
      setPromoError(e instanceof Error ? e.message : "Could not apply promo.");
    } finally {
      setPromoLoading(false);
    }
  };

  const checkout = () => {
    if (items.length === 0) return;
    if (!user) {
      router.push("/auth?return=/cart/checkout");
      return;
    }
    router.push("/cart/checkout");
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-[#FBFBFB] py-4 md:bg-[#F8FAFC] md:py-10 min-h-[75vh]">
      <Container className="max-w-4xl">
        <div className="md:hidden">
          <h1 className="text-2xl font-extrabold text-[#1A1A1A]">
            Service <span className="text-[#C86A37]">Cart</span>
          </h1>
          <p className="mt-1 text-sm text-[#64748b]">
            Review your selected services before booking.
          </p>
        </div>
        <h1 className="hidden text-3xl font-extrabold text-[#0a0f1c] md:block">Your Cart</h1>
        <p className="mt-2 hidden text-sm text-[#64748b] md:block">
          Review services before booking. Book Now remains the fastest way to schedule a visit.
        </p>

        <div className="-mx-4 mt-3 md:mx-0">
          <SectionPromoBanner section="cart" />
        </div>

        {items.length === 0 ? (
          <div className="mt-12 flex flex-col items-center rounded-3xl border border-dashed border-gray-200 bg-white py-16 text-center shadow-xs">
            <ShoppingBag className="mb-4 size-14 text-gray-300" />
            <h2 className="text-xl font-bold text-[#0a0f1c]">Your cart is empty</h2>
            <p className="mt-1 max-w-sm text-sm text-[#64748b]">Explore our popular home repair, maintenance, and salon services.</p>
            <Link
              href="/services"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#C86A37] to-[#A85028] px-8 text-sm font-bold text-white shadow-sm transition hover:opacity-95"
            >
              Browse All Services
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.lineId}
                  className="flex gap-4 rounded-2xl border border-black/5 bg-white p-4 shadow-xs transition hover:shadow-sm"
                >
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-[#0a0f1c] text-base">{item.name}</h3>
                    <p className="mt-1 text-sm font-bold text-[#0a0f1c]">
                      ₹{item.price.toLocaleString("en-IN")}{" "}
                      <span className="text-xs font-normal text-[#64748b]">each</span>
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div className="inline-flex items-center rounded-xl border border-gray-200 bg-gray-50/50">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                          className="flex size-8 items-center justify-center text-[#64748b] hover:text-[#0a0f1c] active:scale-90 transition-transform"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="min-w-8 text-center text-sm font-bold text-[#0a0f1c]">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                          className="flex size-8 items-center justify-center text-[#64748b] hover:text-[#0a0f1c] active:scale-90 transition-transform"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.lineId)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                      >
                        <Trash2 className="size-3.5" />
                        Remove
                      </button>
                      <Link
                        href={getBookPath({ id: item.serviceId, slug: item.slug })}
                        className="ml-auto text-xs font-bold text-[#C86A37] hover:underline"
                      >
                        Direct Slot →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {/* Urban Company Assurance Card */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0a0f1c]">
                  <span className="flex size-4 items-center justify-center rounded-full bg-emerald-100 text-[10px] text-emerald-800 font-black">✓</span>
                  RepairSeries Promise
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px] text-[#64748b]">
                  <div className="rounded-xl bg-gray-50 p-2">⚡ 15-30 min arrival</div>
                  <div className="rounded-xl bg-gray-50 p-2">🛡️ 30-day warranty</div>
                  <div className="rounded-xl bg-gray-50 p-2">👤 Verified pros</div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <Link
                  href="/services"
                  className="text-xs font-bold text-[#C86A37] hover:underline"
                >
                  + Add more services
                </Link>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs font-medium text-[#64748b] hover:text-red-600"
                >
                  Clear cart
                </button>
              </div>
            </div>

            <aside className="h-fit rounded-2xl border border-black/5 bg-white p-6 shadow-xs">
              <h2 className="text-base font-bold text-[#0a0f1c]">Coupons & Offers</h2>
              <div className="mt-3 flex gap-2">
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="h-10 flex-1 rounded-xl border border-gray-200 px-3 text-xs uppercase font-semibold focus:outline-[#C86A37]"
                />
                <button
                  type="button"
                  disabled={promoLoading}
                  onClick={() => void applyPromo()}
                  className="inline-flex h-10 items-center rounded-xl bg-[#0a0f1c] px-4 text-xs font-bold text-white transition hover:bg-black"
                >
                  {promoLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </button>
              </div>
              {!appliedCoupon && (
                <button
                  type="button"
                  onClick={() => {
                    setPromoCode("REPAIR25");
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#C86A37] hover:underline"
                >
                  <span>🎉 Try coupon: <strong className="underline">REPAIR25</strong></span>
                </button>
              )}
              {promoError ? (
                <p className="mt-2 text-xs text-red-600">{promoError}</p>
              ) : null}
              {appliedCoupon?.valid ? (
                <div className="mt-2 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                  <span>✓ {appliedCoupon.code} applied!</span>
                  <span>{appliedCoupon.message}</span>
                </div>
              ) : null}

              <h2 className="mt-6 border-t border-gray-100 pt-4 text-base font-bold text-[#0a0f1c]">Price Details</h2>
              <dl className="mt-3 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#64748b]">Service Subtotal</dt>
                  <dd className="font-semibold text-[#0a0f1c]">
                    ₹{charges.serviceSubtotal.toLocaleString("en-IN")}
                  </dd>
                </div>
                {charges.convenienceFee > 0 ? (
                  <div className="flex justify-between">
                    <dt className="text-[#64748b]">Convenience Fee</dt>
                    <dd className="font-semibold text-[#0a0f1c]">
                      ₹{charges.convenienceFee.toLocaleString("en-IN")}
                    </dd>
                  </div>
                ) : null}
                {charges.visitingCharge > 0 ? (
                  <div className="flex justify-between">
                    <dt className="text-[#64748b]">Visiting Charge</dt>
                    <dd className="font-semibold text-[#0a0f1c]">
                      ₹{charges.visitingCharge.toLocaleString("en-IN")}
                    </dd>
                  </div>
                ) : null}
                {charges.gstAmount > 0 ? (
                  <div className="flex justify-between">
                    <dt className="text-[#64748b]">GST (18%)</dt>
                    <dd className="font-semibold text-[#0a0f1c]">
                      ₹{charges.gstAmount.toLocaleString("en-IN")}
                    </dd>
                  </div>
                ) : null}
                {discountAmount > 0 ? (
                  <div className="flex justify-between text-emerald-700">
                    <dt className="font-medium">Coupon Discount</dt>
                    <dd className="font-bold">
                      -₹{discountAmount.toLocaleString("en-IN")}
                    </dd>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-gray-100 pt-3 text-base">
                  <dt className="font-bold text-[#0a0f1c]">Total Payable</dt>
                  <dd className="font-black text-[#C86A37]">
                    ₹{(quote?.cart.customerTotal ?? charges.customerTotal).toLocaleString("en-IN")}
                  </dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={checkout}
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#C86A37] to-[#A85028] text-sm font-bold text-white shadow-sm transition hover:opacity-95 active:scale-[0.98]"
              >
                Proceed to Checkout
              </button>
              <p className="mt-3 text-center text-[11px] text-[#64748b]">
                Multi-service cart books together when one partner covers all categories.
              </p>
            </aside>
          </div>
        )}
      </Container>

      {/* Mobile Sticky Checkout Action Bar */}
      {items.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md md:hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-medium text-[#64748b]">Total to pay</div>
              <div className="text-xl font-black text-[#C86A37]">
                ₹{(quote?.cart.customerTotal ?? charges.customerTotal).toLocaleString("en-IN")}
              </div>
            </div>
            <button
              type="button"
              onClick={checkout}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-[#C86A37] to-[#A85028] px-6 text-sm font-bold text-white shadow-sm transition-transform active:scale-95"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
