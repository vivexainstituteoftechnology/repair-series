"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, Clock, MapPin, Sparkles, User, ArrowRight, X } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { getDb } from "@/lib/firebase/firestore";

export type BookingSuccessData = {
  bookingId: string;
  bookingCode: string;
  serviceName: string;
  scheduledDate: string;
  scheduledTime: string;
  totalAmount: number;
};

export function BookingSuccessModal({
  data,
  onClose,
}: {
  data: BookingSuccessData | null;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [partnerAssigned, setPartnerAssigned] = useState<string | null>(null);

  useEffect(() => {
    if (!data?.bookingId) return;
    const db = getDb();
    if (!db) return;

    // Real-time listener for partner assignment update
    const unsub = onSnapshot(doc(db, "bookings", data.bookingId), (snap) => {
      if (!snap.exists()) return;
      const b = snap.data() || {};
      const techName = String(b.technicianName || "").trim();
      const techId = String(b.technicianId || "").trim();
      if (techName || techId) {
        setPartnerAssigned(techName || "Verified Expert");
      }
    });

    return () => unsub();
  }, [data?.bookingId]);

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 size-48 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />

        {/* Top Close Button */}
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        ) : null}

        <div className="flex flex-col items-center text-center">
          {/* Animated Success Checkmark Ring */}
          <div className="relative mb-4 flex size-20 items-center justify-center">
            <span className="absolute size-full rounded-full bg-emerald-500/20 animate-ping duration-1000" />
            <span className="absolute size-16 rounded-full bg-emerald-500/25 blur-sm" />
            <div className="relative flex size-16 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white shadow-lg shadow-emerald-500/30">
              <Check className="size-9 stroke-[3]" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Your booking is confirmed!
          </h2>

          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-xs">
            {partnerAssigned ? (
              <span className="text-emerald-700 font-semibold">
                Great news! Technician <strong>{partnerAssigned}</strong> has been assigned to your service.
              </span>
            ) : (
              "We're finding the best available service partner for you. You'll be notified once a partner is assigned."
            )}
          </p>

          {/* Live Status Indicator Pill */}
          <div className="mt-4 mb-5">
            {partnerAssigned ? (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-xs font-bold text-emerald-800 animate-in fade-in duration-300">
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                <span>Partner Assigned: {partnerAssigned}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1 text-xs font-bold text-amber-800">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2 bg-amber-500" />
                </span>
                <span>Finding Nearest Partner...</span>
              </div>
            )}
          </div>

          {/* Booking Summary Card */}
          <div className="w-full rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-left space-y-2.5">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
              <span className="text-slate-500 font-semibold">Booking ID</span>
              <span className="font-mono font-bold text-slate-900">
                {data.bookingCode || data.bookingId.slice(-8).toUpperCase()}
              </span>
            </div>

            <div className="flex items-start justify-between text-xs pt-0.5">
              <span className="text-slate-500 font-semibold">Service</span>
              <span className="font-extrabold text-slate-900 text-right max-w-[200px] line-clamp-1">
                {data.serviceName}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">Scheduled For</span>
              <span className="font-bold text-slate-900">
                {data.scheduledDate} · {data.scheduledTime}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
              <span className="text-slate-700 font-bold">Total Amount</span>
              <span className="text-sm font-black text-[#C86A37]">
                ₹{Math.round(data.totalAmount).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mt-6 w-full space-y-2.5">
            <Link
              href={`/dashboard/bookings/${data.bookingId}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C86A37] to-[#A85028] py-3 text-center text-sm font-bold text-white shadow-md hover:opacity-95 transition active:scale-95"
            >
              <span>View Booking Details</span>
              <ArrowRight className="size-4" />
            </Link>

            <Link
              href="/dashboard/bookings"
              className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white py-2.5 text-center text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Go to My Bookings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
