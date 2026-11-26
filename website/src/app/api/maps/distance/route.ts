import { NextRequest } from "next/server";
import { apiOptions, jsonWithCors } from "@/lib/server/http";
import { haversineDistanceKm } from "@/lib/geo";

export const runtime = "nodejs";

const distanceCache = new Map<string, { distanceKm: number; durationMinutes: number; provider: string }>();

function buildCacheKey(lat1: number, lng1: number, lat2: number, lng2: number): string {
  // Round to 3 decimal places (~110m accuracy) for optimal caching & cost control
  return `${lat1.toFixed(3)},${lng1.toFixed(3)}_${lat2.toFixed(3)},${lng2.toFixed(3)}`;
}

export function OPTIONS(req: NextRequest) {
  return apiOptions(req);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const originLat = Number(searchParams.get("originLat"));
    const originLng = Number(searchParams.get("originLng"));
    const destLat = Number(searchParams.get("destLat"));
    const destLng = Number(searchParams.get("destLng"));

    if (
      !Number.isFinite(originLat) ||
      !Number.isFinite(originLng) ||
      !Number.isFinite(destLat) ||
      !Number.isFinite(destLng)
    ) {
      return jsonWithCors(
        req,
        { error: "Valid originLat, originLng, destLat, and destLng query parameters are required." },
        { status: 400 },
      );
    }

    const key = buildCacheKey(originLat, originLng, destLat, destLng);
    if (distanceCache.has(key)) {
      return jsonWithCors(req, distanceCache.get(key)!);
    }

    const apiKey =
      process.env.GOOGLE_MAPS_SERVER_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_GEOCODING_API_KEY;

    if (apiKey) {
      try {
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&mode=driving&key=${apiKey}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const data = await res.json();
          const element = data?.rows?.[0]?.elements?.[0];
          if (element?.status === "OK") {
            const distanceMeters = element.distance?.value || 0;
            const durationSec = element.duration?.value || 0;
            const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;
            const durationMinutes = Math.max(1, Math.round(durationSec / 60));

            const result = {
              distanceKm,
              durationMinutes,
              provider: "google",
            };
            distanceCache.set(key, result);
            return jsonWithCors(req, result);
          }
        }
      } catch (apiErr) {
        console.warn("Google Distance Matrix API call failed, falling back to Haversine:", apiErr);
      }
    }

    // Graceful fallback to Haversine straight-line distance with standard urban transit multiplier (1.3x road curvature)
    const straightKm = haversineDistanceKm(originLat, originLng, destLat, destLng);
    const roadKm = Math.round(straightKm * 1.3 * 10) / 10;
    // Assume average urban speed of 25 km/h in Indian cities
    const estimatedMinutes = Math.max(2, Math.round((roadKm / 25) * 60));

    const fallbackResult = {
      distanceKm: roadKm,
      durationMinutes: estimatedMinutes,
      provider: "haversine_estimate",
    };
    distanceCache.set(key, fallbackResult);

    return jsonWithCors(req, fallbackResult);
  } catch (err: unknown) {
    console.error("Distance API error:", err);
    return jsonWithCors(req, { error: "Failed to calculate distance" }, { status: 500 });
  }
}
