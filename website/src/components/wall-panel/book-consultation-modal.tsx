"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Phone,
  User,
  Layers,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getAuthClient } from "@/lib/firebase/auth";
import type { WallPanelProduct } from "@/lib/wall-panel/models";

const SLOTS = [
  "9:00 AM – 11:00 AM",
  "11:00 AM – 1:00 PM",
  "2:00 PM – 4:00 PM",
  "4:00 PM – 6:00 PM",
];

interface BookConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct?: WallPanelProduct | null;
}

export function BookConsultationModal({
  isOpen,
  onClose,
  selectedProduct,
}: BookConsultationModalProps) {
  const { user } = useAuth();
  const router = useRouter();

  // Tomorrow's date in YYYY-MM-DD
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const [form, setForm] = useState({
    name: user?.displayName || "",
    phone: user?.phoneNumber || "",
    line1: "",
    city: "Gurugram",
    pincode: "",
    date: minDate,
    slot: SLOTS[0],
    notes: "",
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [successBookingId, setSuccessBookingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    if (!form.line1.trim() || !form.pincode.trim()) {
      setError("Please enter complete delivery address and pincode");
      return;
    }

    setBusy(true);

    try {
      const auth = getAuthClient();
      const token = await auth?.currentUser?.getIdToken();

      const payload = {
        address: {
          line1: form.line1.trim(),
          city: form.city.trim() || "Gurugram",
          pincode: form.pincode.trim(),
          state: "Haryana",
          fullAddress: `${form.line1.trim()}, ${form.city.trim()} - ${form.pincode.trim()}`,
        },
        scheduledDate: form.date,
        scheduledSlotLabel: form.slot,
        customerNotes: form.notes.trim(),
        customerName: form.name.trim(),
        customerPhone: form.phone.trim(),
        interestedDesignIds: selectedProduct ? [selectedProduct.id] : [],
      };

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/wall-panel/bookings/create", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        // If auth required, redirect to auth with redirect back
        if (res.status === 401) {
          router.push(
            `/auth?return=${encodeURIComponent(
              selectedProduct ? `/wall-panel/${selectedProduct.id}` : "/wall-panel"
            )}`
          );
          return;
        }
        throw new Error(json.error || "Failed to create consultation booking");
      }

      setSuccessBookingId(json.bookingId || "CONFIRMED");
    } catch (err) {
      setError((err as Error).message || "Could not complete booking. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="relative flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#C45508]">
              <Layers className="size-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Wall Panels At-Home Consultation
              </h2>
              <p className="text-[11px] font-semibold text-[#C45508]">
                Doorstep Samples · Laser Measurements · ₹49 Only
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {successBookingId ? (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="size-9" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Consultation Booked!</h3>
                <p className="text-sm text-slate-600 mt-1 max-w-xs mx-auto">
                  Our Wall Panel design specialist will visit on{" "}
                  <span className="font-semibold text-slate-800">{form.date}</span> during{" "}
                  <span className="font-semibold text-slate-800">{form.slot}</span> with physical samples.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left max-w-sm mx-auto space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Consultation Fee:</span>
                  <span className="font-bold text-slate-900">₹49 (Payable on arrival)</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Address:</span>
                  <span className="font-medium text-slate-800 text-right truncate max-w-[200px]">
                    {form.line1}, {form.city}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Specialist Guarantee:</span>
                  <span className="text-emerald-700 font-semibold">100% credited on order</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2 max-w-sm mx-auto">
                {successBookingId !== "CONFIRMED" ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push(`/wall-panel/bookings/${successBookingId}`);
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#C45508] py-3 text-sm font-bold text-white shadow-md hover:bg-[#A84706] transition"
                  >
                    <span>View Booking Details</span>
                    <ArrowRight className="size-4" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Continue Browsing
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product preview if selected */}
              {selectedProduct ? (
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3">
                  <div className="size-14 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedProduct.images?.[0] || ""}
                      alt={selectedProduct.title}
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-[#C45508] uppercase tracking-wider">
                      Selected Style
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 truncate">
                      {selectedProduct.title}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Starts at ₹{selectedProduct.price.toLocaleString("en-IN")} for{" "}
                      {selectedProduct.dimensions}
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Consultation Perks Banner */}
              <div className="rounded-2xl bg-amber-50/80 border border-amber-200/70 p-3 flex items-start gap-2.5 text-xs text-amber-900">
                <Sparkles className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <span className="font-bold">What to expect:</span> Our interior specialist carries physical material swatches, inspects wall moisture, and provides accurate laser measurements.
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-700">
                  {error}
                </div>
              ) : null}

              {/* Form Fields */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-[#C45508] focus:ring-1 focus:ring-[#C45508] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        placeholder="10-digit mobile"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-[#C45508] focus:ring-1 focus:ring-[#C45508] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Doorstep Address *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 size-4 text-slate-400" />
                    <textarea
                      required
                      rows={2}
                      placeholder="House / Flat No., Apartment / Building, Street, Area"
                      value={form.line1}
                      onChange={(e) => setForm({ ...form, line1: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-[#C45508] focus:ring-1 focus:ring-[#C45508] outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#C45508] focus:ring-1 focus:ring-[#C45508] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 122002"
                      value={form.pincode}
                      onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#C45508] focus:ring-1 focus:ring-[#C45508] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Preferred Date *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <input
                        type="date"
                        required
                        min={minDate}
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-[#C45508] focus:ring-1 focus:ring-[#C45508] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Time Slot *
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                      <select
                        value={form.slot}
                        onChange={(e) => setForm({ ...form, slot: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-[#C45508] focus:ring-1 focus:ring-[#C45508] outline-none appearance-none"
                      >
                        {SLOTS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Special Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Looking for TV unit accent wall, 2 bedrooms"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#C45508] focus:ring-1 focus:ring-[#C45508] outline-none"
                  />
                </div>
              </div>

              {/* Consultation Fee Breakdown */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-slate-700">Doorstep Consultation Fee:</span>
                  <span className="font-black text-slate-900 text-base">₹49</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                  <ShieldCheck className="size-4 shrink-0" />
                  <span>Fee is 100% credited back when you order any wall panel package.</span>
                </div>
              </div>

              {/* CTA Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C45508] to-[#9A3412] py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-[#C45508]/25 hover:opacity-95 active:scale-[0.99] transition disabled:opacity-60"
                >
                  {busy ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Confirming Appointment…</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm & Book Consultation – ₹49</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
