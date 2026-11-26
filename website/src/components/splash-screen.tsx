"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CheckCircle2, MapPin, Sparkles } from "lucide-react";
import { reverseGeocode } from "@/lib/geocode";
import { dispatchLocationChanged } from "@/lib/location/events";
import {
  isStoredLocationFresh,
  loadStoredUserLocation,
  saveStoredUserLocation,
} from "@/lib/location/user-location";

type SplashPhase = "brand" | "detecting" | "success" | "done";

export function SplashScreen() {
  const pathname = usePathname();

  // Start false on SSR so search engine crawlers get instant access to clean DOM
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<SplashPhase>("brand");
  const [fadeOut, setFadeOut] = useState(false);
  const [detectedArea, setDetectedArea] = useState<string>("");
  const detectionStarted = useRef(false);
  const completedRef = useRef(false);

  useEffect(() => {
    // 1. Immediately ignore search crawlers, bots, lighthouse and headless tests
    if (
      typeof navigator !== "undefined" &&
      /bot|googlebot|crawler|spider|robot|crawling|lighthouse|inspection/i.test(
        navigator.userAgent,
      )
    ) {
      return;
    }

    // 2. Bypass on SEO location pages, wall-panel studio, or dev routes
    if (
      pathname?.startsWith("/service-areas") ||
      pathname?.startsWith("/wall-panel") ||
      pathname?.startsWith("/dev")
    ) {
      return;
    }

    // 3. Intelligent session check: returning users in the same session don't see splash
    try {
      const hasSeenSplash = sessionStorage.getItem("rs_splash_shown");
      if (hasSeenSplash) {
        return;
      }
    } catch {
      /* ignore */
    }

    setVisible(true);

    const triggerExit = (delayMs = 400) => {
      if (completedRef.current) return;
      completedRef.current = true;
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setVisible(false);
          try {
            sessionStorage.setItem("rs_splash_shown", "1");
          } catch {
            /* ignore */
          }
        }, 500);
      }, delayMs);
    };

    // TIMING STRATEGY
    // 0–1.4s: Brand introduction
    const timerBrandToDetect = setTimeout(() => {
      if (completedRef.current) return;
      setPhase("detecting");
    }, 1400);

    // Hard cutoff: 5.0s maximum duration
    const timerHardCutoff = setTimeout(() => {
      triggerExit(0);
    }, 4800);

    return () => {
      clearTimeout(timerBrandToDetect);
      clearTimeout(timerHardCutoff);
    };
  }, [pathname]);

  // Handle Location Detection once phase reaches "detecting"
  useEffect(() => {
    if (phase !== "detecting" || detectionStarted.current) return;
    detectionStarted.current = true;

    const triggerExit = (delayMs = 600) => {
      if (completedRef.current) return;
      completedRef.current = true;
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setVisible(false);
          try {
            sessionStorage.setItem("rs_splash_shown", "1");
          } catch {
            /* ignore */
          }
        }, 500);
      }, delayMs);
    };

    // Check if fresh cached location is already available (fast path for returning users)
    const cached = loadStoredUserLocation();
    if (cached && isStoredLocationFresh(cached)) {
      const label = cached.area || cached.city || cached.label || "Gurugram, Haryana";
      setDetectedArea(label);
      setPhase("success");
      triggerExit(800);
      return;
    }

    // Check Geolocation support
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      // Gracefully default to Gurugram without blocking user
      saveStoredUserLocation({
        lat: 28.4595,
        lng: 77.0266,
        label: "Gurugram, Haryana",
        city: "Gurugram",
        state: "Haryana",
        pincode: "122001",
        cachedAt: Date.now(),
      });
      dispatchLocationChanged();
      triggerExit(400);
      return;
    }

    // Request browser location with maximum 3.0s timeout to respect 5s total budget
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (completedRef.current) return;
        const { latitude, longitude } = pos.coords;
        let areaLabel = "Gurugram, Haryana";

        try {
          // Fast reverse geocoding with 1.2s timeout
          const timeoutPromise = new Promise((_, rej) =>
            setTimeout(() => rej(new Error("Timeout")), 1200),
          );
          const parsed = (await Promise.race([
            reverseGeocode(latitude, longitude),
            timeoutPromise,
          ])) as any;

          if (parsed && (parsed.area || parsed.city)) {
            areaLabel = [parsed.area, parsed.city].filter(Boolean).join(", ");
          }

          saveStoredUserLocation({
            lat: latitude,
            lng: longitude,
            label: areaLabel,
            address: parsed?.fullAddress || areaLabel,
            city: parsed?.city || "Gurugram",
            state: parsed?.state || "Haryana",
            pincode: parsed?.pincode || "122001",
            street: parsed?.street || "",
            area: parsed?.area || "",
            cachedAt: Date.now(),
          });
        } catch {
          saveStoredUserLocation({
            lat: latitude,
            lng: longitude,
            label: "Gurugram, Haryana",
            cachedAt: Date.now(),
          });
        }

        dispatchLocationChanged();

        if (!completedRef.current) {
          setDetectedArea(areaLabel);
          setPhase("success");
          triggerExit(900);
        }
      },
      () => {
        // Permission denied, timeout or GPS off: Graceful continuation
        if (completedRef.current) return;
        saveStoredUserLocation({
          lat: 28.4595,
          lng: 77.0266,
          label: "Gurugram, Haryana",
          city: "Gurugram",
          state: "Haryana",
          pincode: "122001",
          cachedAt: Date.now(),
        });
        dispatchLocationChanged();
        triggerExit(300);
      },
      { enableHighAccuracy: false, timeout: 2800 },
    );
  }, [phase]);

  if (!visible) return null;

  return (
    <div
      id="rs-splash-screen"
      suppressHydrationWarning
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0A0F1C] text-white select-none transition-all duration-500 ease-out ${
        fadeOut ? "opacity-0 scale-[1.03] pointer-events-none" : "opacity-100 scale-100 pointer-events-auto"
      }`}
    >
      {/* Ambient background glowing orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 size-96 rounded-full bg-[#C86A37]/15 blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-[#7E1926]/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,106,55,0.06)_0%,transparent_65%)]" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 text-center max-w-sm">
        {/* ======================================================== */}
        {/* STAGE 1: BRAND LOGO INTRODUCTION (0–1.5s) */}
        {/* ======================================================== */}
        <div
          className={`flex flex-col items-center transition-all duration-500 ${
            phase === "brand"
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-40 scale-90 -translate-y-2"
          }`}
        >
          {/* Logo with warm halo glow */}
          <div className="relative size-20 sm:size-24 mb-3.5 flex items-center justify-center">
            <span className="absolute inset-0 rounded-3xl bg-[#C86A37]/25 blur-lg animate-pulse" />
            <div className="relative size-full rounded-2xl bg-white/5 border border-white/10 p-2.5 backdrop-blur-md flex items-center justify-center shadow-2xl">
              <Image
                src="/logo.png"
                alt="RepairSeries"
                width={80}
                height={80}
                priority
                className="size-full object-contain drop-shadow-md"
              />
            </div>
          </div>

          {/* Brand Name */}
          <div className="flex items-center gap-1">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Repair<span className="text-[#C86A37]">Series</span>
            </span>
          </div>

          <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            Home Services &amp; Repairs
          </p>
        </div>

        {/* ======================================================== */}
        {/* STAGE 2: LOCATION DETECTION & RADAR (1.5–3.5s) */}
        {/* ======================================================== */}
        {phase === "detecting" && (
          <div className="mt-8 flex flex-col items-center animate-in fade-in zoom-in-95 duration-400">
            {/* Animated Radar Pulse Rings */}
            <div className="relative flex size-20 items-center justify-center mb-4">
              <span className="absolute size-full rounded-full bg-[#C86A37]/20 animate-ping duration-1000" />
              <span className="absolute size-14 rounded-full border border-[#C86A37]/40 animate-pulse duration-700" />
              <div className="relative flex size-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#C86A37] to-[#FED7AA] text-slate-950 shadow-lg shadow-[#C86A37]/30">
                <MapPin className="size-6 text-slate-950" />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-[#FDBA74] border border-white/10 backdrop-blur-md">
              <Sparkles className="size-3 text-[#FB923C] animate-spin" />
              <span>Locating Doorstep Technicians</span>
            </div>

            <p className="mt-2 text-xs font-medium text-slate-400">
              Finding verified service professionals near you...
            </p>
          </div>
        )}

        {/* ======================================================== */}
        {/* STAGE 3: LOCATION SUCCESS & VERIFIED AREA (3.5–5s) */}
        {/* ======================================================== */}
        {phase === "success" && (
          <div className="mt-8 flex flex-col items-center animate-in fade-in zoom-in-95 duration-400">
            {/* Success Checkmark with glowing halo */}
            <div className="relative flex size-20 items-center justify-center mb-3">
              <span className="absolute inset-2 rounded-full bg-emerald-500/20 blur-md animate-pulse" />
              <div className="relative flex size-14 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-xl shadow-emerald-500/30">
                <CheckCircle2 className="size-8 text-white" />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-3.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
              <MapPin className="size-3.5 text-emerald-400" />
              <span className="truncate max-w-[220px]">
                {detectedArea || "Gurugram, Haryana"}
              </span>
            </div>

            <p className="mt-2 text-xs font-medium text-slate-300">
              Doorstep service active · 45–60 min arrival
            </p>
          </div>
        )}

        {/* Bottom subtle progress line */}
        <div className="mt-10 h-1 w-32 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-full bg-gradient-to-r from-[#C86A37] via-[#FED7AA] to-[#7E1926] animate-pulse" />
        </div>
      </div>
    </div>
  );
}
