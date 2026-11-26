"use client";

import { useEffect, useState } from "react";
import { Clock, ExternalLink, MapPin, Navigation, Phone, ShieldCheck, User } from "lucide-react";
import { RemoteImage as Image } from "@/components/remote-image";
import type { BookingDoc, TechnicianDoc } from "@/lib/booking/types";

type Props = {
  booking: BookingDoc;
  technician: TechnicianDoc | null;
};

export function LivePartnerTracking({ booking, technician }: Props) {
  const [distanceInfo, setDistanceInfo] = useState<{
    distanceKm: number;
    durationMinutes: number;
    source?: string;
  } | null>(null);
  const [loadingDistance, setLoadingDistance] = useState(false);

  // Customer Coordinates
  const addressObj = (booking.address || {}) as Record<string, unknown>;
  const custLat =
    typeof addressObj.lat === "number"
      ? addressObj.lat
      : typeof booking.latitude === "number"
        ? booking.latitude
        : null;
  const custLng =
    typeof addressObj.lng === "number"
      ? addressObj.lng
      : typeof booking.longitude === "number"
        ? booking.longitude
        : null;

  // Partner Coordinates
  const techLoc = (technician?.location || {}) as Record<string, unknown>;
  const techLat =
    typeof techLoc.lat === "number"
      ? techLoc.lat
      : typeof technician?.latitude === "number"
        ? technician.latitude
        : null;
  const techLng =
    typeof techLoc.lng === "number"
      ? techLoc.lng
      : typeof technician?.longitude === "number"
        ? technician.longitude
        : null;

  const hasCustomerCoords = Number.isFinite(custLat) && Number.isFinite(custLng);
  const hasPartnerCoords = Number.isFinite(techLat) && Number.isFinite(techLng);

  // Fetch distance and ETA when both coordinates are available
  useEffect(() => {
    if (!hasCustomerCoords || !hasPartnerCoords) return;

    let cancelled = false;
    async function fetchTravelDistance() {
      setLoadingDistance(true);
      try {
        const res = await fetch(
          `/api/maps/distance?originLat=${techLat}&originLng=${techLng}&destLat=${custLat}&destLng=${custLng}`,
        );
        if (res.ok && !cancelled) {
          const data = await res.json();
          setDistanceInfo({
            distanceKm: data.distanceKm,
            durationMinutes: data.durationMinutes,
            source: data.source,
          });
        }
      } catch (err) {
        console.warn("Distance matrix fetch failed:", err);
      } finally {
        if (!cancelled) setLoadingDistance(false);
      }
    }

    void fetchTravelDistance();
    const interval = setInterval(() => {
      void fetchTravelDistance();
    }, 20000); // refresh distance every 20s

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [hasCustomerCoords, hasPartnerCoords, techLat, techLng, custLat, custLng]);

  const statusStr = String(booking.status || "").toLowerCase();
  const isOnTheWay =
    statusStr.includes("way") ||
    statusStr === "assigned" ||
    statusStr === "started" ||
    statusStr === "in_progress";

  if (!isOnTheWay || !technician) {
    return null;
  }

  // Google Maps Direction Route URL in embed format
  const routeEmbedUrl =
    hasPartnerCoords && hasCustomerCoords
      ? `https://www.google.com/maps?saddr=${techLat},${techLng}&daddr=${custLat},${custLng}&output=embed`
      : hasCustomerCoords
        ? `https://www.google.com/maps?q=${custLat},${custLng}&z=15&output=embed`
        : null;

  const googleMapsDirectionsUrl =
    hasPartnerCoords && hasCustomerCoords
      ? `https://www.google.com/maps/dir/?api=1&origin=${techLat},${techLng}&destination=${custLat},${custLng}`
      : hasCustomerCoords
        ? `https://www.google.com/maps?q=${custLat},${custLng}`
        : null;

  return (
    <div className="overflow-hidden rounded-[24px] border border-orange-200 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-100 bg-orange-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-[#C45508] text-white shadow-xs">
            <Navigation className="size-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#0a0f1c] dark:text-white">
              Live Partner Tracking
            </h2>
            <p className="text-xs font-medium text-[#64748b] dark:text-slate-400">
              {statusStr === "started" || statusStr === "in_progress"
                ? "Service is currently in progress at your doorstep"
                : "Your Repair Series partner is en route to your address"}
            </p>
          </div>
        </div>

        {distanceInfo ? (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Estimated Arrival
              </span>
              <span className="text-lg font-black text-[#C45508]">
                ~{distanceInfo.durationMinutes} mins
              </span>
            </div>
            <div className="h-8 w-px bg-orange-200 dark:bg-slate-700" />
            <div className="text-right">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Distance
              </span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white">
                {distanceInfo.distanceKm} km
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Embedded Route Google Map */}
      <div className="relative h-64 w-full bg-slate-100 dark:bg-slate-800">
        {routeEmbedUrl ? (
          <iframe
            title="Live Route to Doorstep"
            src={routeEmbedUrl}
            className="size-full border-0"
            loading="lazy"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center p-6 text-center text-slate-500">
            <MapPin className="size-8 text-[#C45508]" />
            <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-300">
              Tracking Route Active
            </p>
            <p className="text-xs">Partner dispatched to your registered address.</p>
          </div>
        )}

        {googleMapsDirectionsUrl && (
          <a
            href={googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#C45508] shadow-md backdrop-blur-xs transition hover:bg-[#FFF7ED] dark:bg-slate-900/90"
          >
            <ExternalLink className="size-3.5" />
            Open in Google Maps
          </a>
        )}
      </div>

      {/* Partner Info & Safety Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-full border-2 border-[#C45508]/20 bg-gray-100">
            {technician.profilePhotoUrl ? (
              <Image
                src={technician.profilePhotoUrl}
                alt={technician.name ?? "Partner"}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-slate-400">
                <User className="size-7" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 dark:text-white">
                {technician.name ?? "Service Partner"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
                KYC Verified
              </span>
            </div>
            {technician.phone && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Contact: <span className="font-semibold">{technician.phone}</span>
              </p>
            )}
            <p className="mt-0.5 text-[11px] text-slate-500">
              Uniformed technician with genuine Repair Series ID and standard tools.
            </p>
          </div>
        </div>

        {technician.phone ? (
          <a
            href={`tel:${technician.phone}`}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-xs font-bold text-slate-800 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            <Phone className="size-3.5 text-[#C45508]" />
            Call Partner
          </a>
        ) : null}
      </div>
    </div>
  );
}
