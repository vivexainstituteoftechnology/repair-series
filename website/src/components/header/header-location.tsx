"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Loader2,
  MapPin,
  Navigation,
  Pencil,
  Check,
  Building2,
  Home as HomeIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "@/context/location-context";

type SavedAddress = {
  id?: string;
  label?: string;
  type?: string;
  city?: string;
  state?: string;
  pincode?: string;
  street?: string;
  area?: string;
  fullAddress?: string;
  lat?: number;
  lng?: number;
};

type HeaderLocationDropdownProps = {
  variant?: "default" | "onTheme";
  className?: string;
};

export function HeaderLocationDropdown({
  variant = "default",
  className = "",
}: HeaderLocationDropdownProps) {
  const { customer } = useAuth();
  const { label, loading, refreshFromGps, applySavedAddress } = useLocation();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const isTheme = variant === "onTheme";

  const savedAddresses = (Array.isArray(customer?.addresses)
    ? customer.addresses
    : []) as SavedAddress[];

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const onDetect = async () => {
    setError("");
    try {
      await refreshFromGps();
      setOpen(false);
    } catch {
      setError("Could not detect location. Please select or enter manually.");
    }
  };

  return (
    <div ref={ref} className="relative">
      {/* Urban Company style Location Button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`group flex items-center gap-2 rounded-full border px-3 sm:px-3.5 py-1.5 text-left transition-all ${
          isTheme
            ? "border-white/30 bg-white text-slate-900 shadow-xs hover:bg-slate-50"
            : "border-slate-200/90 bg-white/95 backdrop-blur-md text-slate-800 shadow-xs hover:bg-white"
        } ${className}`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {/* Emerald "In 15 mins" pill */}
        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] sm:text-[11px] font-black text-emerald-700 border border-emerald-200 shrink-0">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          In 15 mins
        </span>

        {/* Location Label */}
        <div className="flex min-w-0 max-w-[140px] lg:max-w-[190px] items-center gap-1 text-slate-800">
          <span className="truncate text-xs font-bold">{label || "Select Location"}</span>
        </div>

        <ChevronDown
          className={`size-3.5 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {open ? (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[100] w-[300px] sm:w-[340px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Current Service Area
            </span>
            <div className="mt-1 flex items-start gap-2">
              <MapPin className="size-4 text-[#C86A37] mt-0.5 shrink-0" />
              <span className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">{label}</span>
            </div>
          </div>

          <div className="p-2 space-y-1">
            {/* Detect Location Button */}
            <button
              type="button"
              onClick={() => void onDetect()}
              disabled={loading}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-800 transition-colors hover:bg-[#FFF7ED] hover:text-[#C86A37] disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin text-[#C86A37]" />
              ) : (
                <Navigation className="size-4 text-[#C86A37]" />
              )}
              <span>Detect current location</span>
            </button>

            {/* Change Location Button */}
            <Link
              href="/book"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-800 transition-colors hover:bg-slate-50"
            >
              <Pencil className="size-4 text-slate-500" />
              <span>Choose on map / manual</span>
            </Link>
          </div>

          {/* Saved Addresses list */}
          {savedAddresses.length > 0 ? (
            <div className="border-t border-slate-100 p-2">
              <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                Saved Addresses
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {savedAddresses.map((addr, idx) => {
                  const addrLabel =
                    String(addr.label ?? addr.type ?? "Address").trim() ||
                    `Address ${idx + 1}`;
                  const sub = [addr.area, addr.city, addr.pincode]
                    .filter(Boolean)
                    .join(", ");
                  return (
                    <button
                      key={addr.id ?? `${addrLabel}-${idx}`}
                      type="button"
                      onClick={() => {
                        applySavedAddress({
                          label: addrLabel,
                          lat: addr.lat,
                          lng: addr.lng,
                          city: addr.city,
                          state: addr.state,
                          pincode: addr.pincode,
                          street: addr.street,
                          area: addr.area,
                          fullAddress: addr.fullAddress,
                        });
                        setOpen(false);
                      }}
                      className="flex w-full flex-col rounded-xl px-3 py-2 text-left transition-colors hover:bg-slate-50"
                    >
                      <span className="font-bold text-xs text-slate-900">{addrLabel}</span>
                      {sub ? (
                        <span className="truncate text-[11px] font-medium text-slate-500 mt-0.5">{sub}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="border-t border-slate-100 px-4 py-2.5 text-xs font-semibold text-rose-600 bg-rose-50/50">
              {error}
            </div>
          ) : null}

          {/* Footer note */}
          <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2 text-[10px] font-semibold text-slate-400 text-center">
            Serving Gurugram, Hyderabad & Aligarh
          </div>
        </div>
      ) : null}
    </div>
  );
}
