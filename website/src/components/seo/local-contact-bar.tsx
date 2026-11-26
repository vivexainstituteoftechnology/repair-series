"use client";

import Link from "next/link";
import { MessageCircle, Phone, ShieldCheck, Zap } from "lucide-react";
import { useAppSettings } from "@/context/app-settings-context";

type Props = {
  areaName: string;
  serviceName?: string;
  className?: string;
  variant?: "inline" | "sticky" | "banner";
};

export function LocalContactBar({
  areaName,
  serviceName = "Appliance Repair",
  className = "",
  variant = "inline",
}: Props) {
  const { resolvedSupportPhone } = useAppSettings();
  const phone = resolvedSupportPhone || "+918000001111";
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const whatsappText = encodeURIComponent(
    `Hi Repair Series! I need ${serviceName} service at my address in ${areaName}, Gurgaon. Please share available slots.`,
  );
  const whatsappUrl = `https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`}?text=${whatsappText}`;

  if (variant === "sticky") {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur-md md:hidden dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <a
            href={`tel:${phone}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#C45508] py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95"
          >
            <Phone className="size-3.5 fill-current" />
            <span>Call Now</span>
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95"
          >
            <MessageCircle className="size-3.5 fill-current" />
            <span>WhatsApp</span>
          </a>
          <Link
            href="/services"
            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95 dark:bg-slate-800"
          >
            <Zap className="size-3.5 text-amber-400" />
            <span>Book Online</span>
          </Link>
        </div>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div
        className={`rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 via-[#FFF7ED] to-amber-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 ${className}`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#C45508] text-white">
                <Zap className="size-4 fill-current" />
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#C45508]">
                Instant Doorstep Dispatch
              </span>
            </div>
            <h3 className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">
              Need Same-Day {serviceName} in {areaName}?
            </h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Verified technicians active in {areaName}, Gurgaon. Upfront pricing &amp; 30-day service warranty.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href={`tel:${phone}`}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#C45508] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#A84506] active:scale-95"
            >
              <Phone className="size-3.5" />
              <span>Call Technician</span>
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#25D366] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#1EBE5D] active:scale-95"
            >
              <MessageCircle className="size-3.5" />
              <span>WhatsApp Chat</span>
            </a>
            <Link
              href="/services"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-800 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <span>View Rates</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Doorstep service available today across <strong className="text-slate-900 dark:text-white">{areaName}</strong>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`tel:${phone}`}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#C45508]/30 bg-white px-3 text-xs font-bold text-[#C45508] transition hover:bg-[#FFF7ED] dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <Phone className="size-3" />
          <span>Call: {phone}</span>
        </a>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#25D366] px-3 text-xs font-bold text-white transition hover:bg-[#1EBE5D]"
        >
          <MessageCircle className="size-3" />
          <span>Chat on WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
