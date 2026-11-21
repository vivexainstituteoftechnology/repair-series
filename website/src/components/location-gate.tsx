"use client";

import { Loader2, MapPin, Navigation, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { reverseGeocode } from "@/lib/geocode";
import { dispatchLocationChanged } from "@/lib/location/events";
import {
  isStoredLocationFresh,
  loadStoredUserLocation,
  saveStoredUserLocation,
} from "@/lib/location/user-location";

type Phase = "detecting" | "denied" | "hidden";

const SESSION_KEY = "rs_location_gate_session_v1";

/**
 * Shows location animation on open, but reuses a fresh cached pin/label so
 * the header location does not jump every refresh.
 */
export function LocationGate() {
  const [phase, setPhase] = useState<Phase>("hidden");
  const [progress, setProgress] = useState(0);
  const [statusLine, setStatusLine] = useState("Finding your location");
  const started = useRef(false);

  const detect = useCallback(async (force = false) => {
    const isInsecureNetwork =
      typeof window !== "undefined" &&
      !window.isSecureContext &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1";

    if (isInsecureNetwork && !force) {
      // Insecure HTTP on LAN IP (e.g. mobile testing on Wi-Fi):
      // Browser blocks navigator.geolocation in insecure context.
      // Auto-dismiss gracefully so homepage is never blocked.
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
      setPhase("hidden");
      return;
    }

    const cached = loadStoredUserLocation();
    if (!force && cached && isStoredLocationFresh(cached)) {
      setPhase("detecting");
      setStatusLine(cached.label || cached.address || "Saved location");
      setProgress(100);
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
      setTimeout(() => setPhase("hidden"), 550);
      return;
    }

    if (!navigator.geolocation) {
      setPhase("denied");
      return;
    }
    setPhase("detecting");
    setStatusLine("Finding your location");
    setProgress(12);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setProgress(65);
        const { latitude, longitude } = pos.coords;
        try {
          const parsed = await reverseGeocode(latitude, longitude);
          // Prefer previous label if still near same pin (avoids micro-changes).
          const prev = loadStoredUserLocation();
          const samePin =
            prev &&
            Math.abs(prev.lat - latitude) < 0.0008 &&
            Math.abs(prev.lng - longitude) < 0.0008 &&
            prev.label;
          saveStoredUserLocation({
            lat: latitude,
            lng: longitude,
            label: samePin
              ? prev.label
              : parsed.fullAddress || parsed.city || "Current location",
            address: samePin
              ? prev.address || prev.label
              : parsed.fullAddress || "",
            city: parsed.city || prev?.city,
            state: parsed.state || prev?.state,
            pincode: parsed.pincode || prev?.pincode,
            street: parsed.street || prev?.street,
            area: parsed.area || prev?.area,
            cachedAt: Date.now(),
          });
          dispatchLocationChanged();
          setStatusLine(
            samePin
              ? prev!.label
              : parsed.fullAddress || parsed.city || "Current location",
          );
        } catch {
          saveStoredUserLocation({
            lat: latitude,
            lng: longitude,
            label: "Current location",
            cachedAt: Date.now(),
          });
          dispatchLocationChanged();
        }
        setProgress(100);
        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
          /* ignore */
        }
        setTimeout(() => setPhase("hidden"), 380);
      },
      () => {
        setPhase("denied");
      },
      { enableHighAccuracy: true, timeout: 20000 },
    );
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    try {
      if (sessionStorage.getItem(SESSION_KEY)) {
        return;
      }
    } catch {
      /* ignore */
    }
    void detect(false);
  }, [detect]);

  useEffect(() => {
    if (phase !== "detecting") return;
    const t = setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + 6));
    }, 300);
    return () => clearInterval(t);
  }, [phase]);

  if (phase === "hidden") return null;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    setPhase("hidden");
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 rounded-[28px] border border-white/20 bg-white p-8 shadow-2xl">
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close location prompt"
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="size-5" />
        </button>
        {phase === "detecting" ? (
          <>
            <div className="relative mx-auto mb-6 flex size-24 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-[#C86A37]/20" />
              <span className="absolute inset-2 animate-pulse rounded-full border-2 border-[#C86A37]/50" />
              <div className="relative flex size-20 items-center justify-center rounded-full bg-[#FFF7ED]">
                <MapPin className="size-10 text-[#C86A37]" />
              </div>
            </div>
            <h2 className="text-center text-xl font-bold text-[#0a0f1c]">{statusLine}</h2>
            <p className="mt-3 text-center text-sm leading-relaxed text-[#64748b]">
              Using your saved pin when available so nearby services stay consistent.
            </p>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#C86A37] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-[#C86A37]">
              <Loader2 className="size-4 animate-spin" />
              {Math.min(99, Math.round(progress))}%
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-red-50">
              <Navigation className="size-10 text-red-500" />
            </div>
            <h2 className="text-center text-xl font-bold text-[#0a0f1c]">Location needed</h2>
            <p className="mt-3 text-center text-sm leading-relaxed text-[#64748b]">
              Location access is required to show nearby services and available technicians.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => void detect(true)}
                className="h-12 rounded-full bg-[#C86A37] hover:bg-[#A85028] text-sm font-bold text-white transition-colors"
              >
                Allow Location
              </button>
              <Link
                href="/book"
                onClick={handleDismiss}
                className="flex h-12 items-center justify-center rounded-full border border-gray-200 text-sm font-semibold text-[#0a0f1c]"
              >
                Enter Address Manually
              </Link>
              <button
                type="button"
                onClick={handleDismiss}
                className="h-10 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                Skip for now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
