"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Crosshair, ExternalLink, Loader2, MapPin, Search, X } from "lucide-react";
import { reverseGeocode } from "@/lib/geocode";

type PopulatedAddress = {
  street?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  fullAddress?: string;
  lat: number;
  lng: number;
};

type Props = {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  onAddressPopulate?: (details: PopulatedAddress) => void;
};

type AutocompletePrediction = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  lat?: number;
  lng?: number;
  details?: {
    street?: string;
    area?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
};

export function MapPinPicker({ lat, lng, onChange, onAddressPopulate }: Props) {
  const hasPin = Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
  const la = Number(lat);
  const ln = Number(lng);
  const delta = 0.0008;

  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<AutocompletePrediction[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Autocomplete search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setPredictions([]);
      setDropdownOpen(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/maps/autocomplete?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.predictions)) {
            setPredictions(data.predictions);
            setDropdownOpen(data.predictions.length > 0);
          }
        }
      } catch (err) {
        console.warn("Places search error:", err);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  const selectPrediction = async (item: AutocompletePrediction) => {
    setDropdownOpen(false);
    setSearchQuery(item.mainText || item.description);

    let selectedLat = item.lat;
    let selectedLng = item.lng;

    // If coordinates are not directly in prediction (e.g. from Google Place ID), geocode
    if (selectedLat == null || selectedLng == null) {
      try {
        const res = await fetch(`/api/maps/autocomplete?q=${encodeURIComponent(item.description)}`);
        const data = await res.json();
        const first = data.predictions?.[0];
        if (first?.lat != null && first?.lng != null) {
          selectedLat = first.lat;
          selectedLng = first.lng;
        }
      } catch {
        // Fallback
      }
    }

    if (selectedLat != null && selectedLng != null) {
      onChange(selectedLat, selectedLng);

      // Populate address fields
      if (onAddressPopulate) {
        if (item.details) {
          onAddressPopulate({
            ...item.details,
            fullAddress: item.description,
            lat: selectedLat,
            lng: selectedLng,
          });
        } else {
          // Reverse geocode to get clean address components
          try {
            const rev = await reverseGeocode(selectedLat, selectedLng);
            onAddressPopulate({
              ...rev,
              lat: selectedLat,
              lng: selectedLng,
            });
          } catch {
            onAddressPopulate({
              fullAddress: item.description,
              lat: selectedLat,
              lng: selectedLng,
            });
          }
        }
      }
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const curLat = pos.coords.latitude;
        const curLng = pos.coords.longitude;
        onChange(curLat, curLng);
        try {
          const rev = await reverseGeocode(curLat, curLng);
          if (onAddressPopulate) {
            onAddressPopulate({
              ...rev,
              lat: curLat,
              lng: curLng,
            });
          }
          if (rev?.fullAddress) {
            setSearchQuery(rev.fullAddress);
          }
        } catch {
          // ignore
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        console.warn("Geolocation failed:", err);
        alert("Could not retrieve current location. Please grant location permissions.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Google Maps embed with marker
  const googleEmbedUrl = hasPin
    ? `https://www.google.com/maps?q=${la},${ln}&z=16&output=embed`
    : null;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-[#C45508]" />
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            Select Location on Google Maps
          </span>
        </div>

        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={locating}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#C45508]/30 bg-white px-3 text-xs font-bold text-[#C45508] transition hover:bg-[#FFF7ED] disabled:opacity-50 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          {locating ? <Loader2 className="size-3.5 animate-spin" /> : <Crosshair className="size-3.5" />}
          <span>{locating ? "Detecting GPS..." : "Detect My Location"}</span>
        </button>
      </div>

      {/* Autocomplete Search Bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 size-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search society, landmark, area, or street name..."
            className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-9 text-xs text-slate-900 placeholder-slate-400 focus:border-[#C45508] focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setPredictions([]);
                setDropdownOpen(false);
              }}
              className="absolute right-3 text-slate-400 hover:text-slate-600"
            >
              <X className="size-3.5" />
            </button>
          ) : searching ? (
            <Loader2 className="absolute right-3 size-3.5 animate-spin text-[#C45508]" />
          ) : null}
        </div>

        {/* Dropdown Predictions */}
        {dropdownOpen && predictions.length > 0 && (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
            {predictions.map((item) => (
              <button
                key={item.placeId}
                type="button"
                onClick={() => selectPrediction(item)}
                className="flex w-full items-start gap-2.5 border-b border-slate-100 p-2.5 text-left text-xs transition hover:bg-slate-50 last:border-0 dark:border-slate-700 dark:hover:bg-slate-700/50"
              >
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#C45508]" />
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-slate-100">{item.mainText}</p>
                  {item.secondaryText && (
                    <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                      {item.secondaryText}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Google Map Preview */}
      <div className="relative overflow-hidden rounded-xl border border-slate-300 bg-slate-100 shadow-inner dark:border-slate-700 dark:bg-slate-800">
        {googleEmbedUrl ? (
          <iframe
            title="Google Maps Location Picker"
            src={googleEmbedUrl}
            className="h-52 w-full border-0 bg-white"
            loading="lazy"
          />
        ) : (
          <div className="flex h-52 flex-col items-center justify-center p-4 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-[#C45508]/10 text-[#C45508]">
              <MapPin className="size-5" />
            </div>
            <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              No pin location selected
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Search your address above or tap &quot;Detect My Location&quot; to pin your doorstep.
            </p>
          </div>
        )}

        {hasPin && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-emerald-800 shadow-sm backdrop-blur-xs dark:bg-slate-900/90 dark:text-emerald-300">
            <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
            <span>Serviceable Location</span>
          </div>
        )}
      </div>

      {/* Pin Details & Nudge Controls */}
      {hasPin && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-600 dark:text-slate-400">
          <div className="font-mono text-[11px]">
            GPS: <span className="font-bold text-slate-900 dark:text-slate-100">{la.toFixed(5)}, {ln.toFixed(5)}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="mr-1 text-[11px] font-bold uppercase text-slate-400">Fine-tune:</span>
            <Nudge label="↑" title="Move North" onClick={() => onChange(la + delta, ln)} />
            <Nudge label="↓" title="Move South" onClick={() => onChange(la - delta, ln)} />
            <Nudge label="←" title="Move West" onClick={() => onChange(la, ln - delta)} />
            <Nudge label="→" title="Move East" onClick={() => onChange(la, ln + delta)} />
            <a
              href={`https://www.google.com/maps?q=${la},${ln}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 inline-flex h-7 items-center gap-1 rounded-lg border border-slate-300 px-2 text-[11px] font-bold text-[#C45508] transition hover:bg-[#FFF7ED] dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <ExternalLink className="size-3" />
              Full Map
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function Nudge({ label, title, onClick }: { label: string; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="inline-flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-extrabold text-slate-700 shadow-2xs transition hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
    >
      {label}
    </button>
  );
}
