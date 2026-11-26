import { NextRequest } from "next/server";
import { apiOptions, jsonWithCors } from "@/lib/server/http";

export const runtime = "nodejs";

export function OPTIONS(req: NextRequest) {
  return apiOptions(req);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") || "").trim();

  if (!q || q.length < 2) {
    return jsonWithCors(req, { predictions: [] });
  }

  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_GEOCODING_API_KEY;

  if (apiKey) {
    try {
      const googleUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        q,
      )}&components=country:in&key=${apiKey}`;
      const res = await fetch(googleUrl);
      const data = await res.json();

      if (data.status === "OK" && Array.isArray(data.predictions)) {
        const predictions = data.predictions.map((p: any) => ({
          placeId: p.place_id,
          description: p.description,
          mainText: p.structured_formatting?.main_text || p.description,
          secondaryText: p.structured_formatting?.secondary_text || "",
        }));
        return jsonWithCors(req, { predictions });
      }
    } catch (err) {
      console.warn("Google Places Autocomplete failed, falling back to OpenStreetMap:", err);
    }
  }

  // Fallback to OpenStreetMap / Nominatim
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=in&q=${encodeURIComponent(
      q,
    )}`;
    const res = await fetch(osmUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "RepairSeries-App/1.0",
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const predictions = data.map((item: any) => {
          const addr = item.address || {};
          const city = addr.city || addr.town || addr.village || addr.county || "";
          const state = addr.state || "";
          return {
            placeId: String(item.place_id || item.osm_id),
            description: item.display_name,
            mainText: item.name || item.display_name.split(",")[0],
            secondaryText: [city, state].filter(Boolean).join(", "),
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            details: {
              street: [addr.house_number, addr.road].filter(Boolean).join(" "),
              area: addr.suburb || addr.neighbourhood || addr.quarter || "",
              city,
              state,
              pincode: addr.postcode || "",
            },
          };
        });
        return jsonWithCors(req, { predictions });
      }
    }
  } catch (err) {
    console.error("Nominatim Autocomplete error:", err);
  }

  return jsonWithCors(req, { predictions: [] });
}
