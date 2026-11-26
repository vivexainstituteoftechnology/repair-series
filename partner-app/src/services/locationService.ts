import * as Location from "expo-location";
import { Linking, Platform } from "react-native";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export async function requestLocationPermissions(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  } catch (err) {
    console.warn("Location permission error:", err);
    return false;
  }
}

export async function getCurrentLocation(): Promise<Coordinates | null> {
  try {
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) return null;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (err) {
    console.warn("Failed to get current location:", err);
    return null;
  }
}

export async function updatePartnerLocationInDb(
  partnerId: string,
  coords: Coordinates,
): Promise<void> {
  if (!partnerId || !coords) return;
  try {
    const ref = doc(db, "technicians", partnerId);
    await updateDoc(ref, {
      latitude: coords.latitude,
      longitude: coords.longitude,
      lastLocationUpdatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Could not sync partner location to Firestore:", err);
  }
}

/**
 * Calculates straight line distance in kilometers between two coordinates.
 */
export function calculateDistanceKm(
  lat1?: number,
  lon1?: number,
  lat2?: number,
  lon2?: number,
): number | null {
  if (
    lat1 == null ||
    lon1 == null ||
    lat2 == null ||
    lon2 == null ||
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2)
  ) {
    return null;
  }

  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Opens Google Maps (Android/iOS) or Apple Maps (iOS) with navigation route.
 */
export async function openMapsNavigation(
  addressString?: string,
  lat?: number,
  lng?: number,
): Promise<void> {
  let url = "";

  if (lat && lng && Number.isFinite(lat) && Number.isFinite(lng)) {
    if (Platform.OS === "ios") {
      url = `maps://?daddr=${lat},${lng}&dirflg=d`;
    } else {
      url = `google.navigation:q=${lat},${lng}`;
    }
  } else if (addressString && addressString.trim()) {
    const encoded = encodeURIComponent(addressString.trim());
    if (Platform.OS === "ios") {
      url = `maps://?daddr=${encoded}&dirflg=d`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
    }
  } else {
    throw new Error("No address or coordinates available for navigation.");
  }

  const supported = await Linking.canOpenURL(url).catch(() => false);
  if (supported) {
    await Linking.openURL(url);
  } else {
    // Fallback to web Google Maps
    const query =
      lat && lng ? `${lat},${lng}` : encodeURIComponent(addressString || "");
    await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${query}`);
  }
}
