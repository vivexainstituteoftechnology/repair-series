import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../config/theme";
import { getCurrentLocation } from "../../services/locationService";

interface GoogleMapPickerProps {
  latitude: number | null;
  longitude: number | null;
  addressString?: string;
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    formattedAddress?: string;
    city?: string;
    pincode?: string;
  }) => void;
}

export const GoogleMapPicker: React.FC<GoogleMapPickerProps> = ({
  latitude,
  longitude,
  addressString,
  onLocationSelect,
}) => {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const hasCoords =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    try {
      const coords = await getCurrentLocation();
      if (!coords) {
        Alert.alert(
          "Location Permission",
          "Please enable GPS / Location permissions in device settings to detect your current location.",
        );
        return;
      }

      // Reverse geocode via nominatim / geocoder
      let formatted = "";
      let city = "";
      let pincode = "";
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`;
        const res = await fetch(url, {
          headers: { "User-Agent": "RepairSeriesPartnerApp/1.0", Accept: "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          formatted = data?.display_name || "";
          city =
            data?.address?.city ||
            data?.address?.town ||
            data?.address?.suburb ||
            data?.address?.state_district ||
            "";
          pincode = data?.address?.postcode || "";
        }
      } catch {}

      onLocationSelect({
        latitude: coords.latitude,
        longitude: coords.longitude,
        formattedAddress: formatted || undefined,
        city: city || undefined,
        pincode: pincode || undefined,
      });
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not fetch current GPS location.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchAddress = async () => {
    const q = searchQuery.trim();
    if (q.length < 3) {
      Alert.alert("Search Address", "Please enter at least 3 characters to search.");
      return;
    }

    setSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&limit=1`;
      const res = await fetch(url, {
        headers: { "User-Agent": "RepairSeriesPartnerApp/1.0", Accept: "application/json" },
      });
      if (res.ok) {
        const results = await res.json();
        if (Array.isArray(results) && results.length > 0) {
          const first = results[0];
          const lat = parseFloat(first.lat);
          const lng = parseFloat(first.lon);
          onLocationSelect({
            latitude: lat,
            longitude: lng,
            formattedAddress: first.display_name,
          });
          setSearchQuery("");
        } else {
          Alert.alert("Not Found", "Could not locate this address on the map. Please try a different area or landmark.");
        }
      }
    } catch {
      Alert.alert("Error", "Address search service temporarily unavailable.");
    } finally {
      setSearching(false);
    }
  };

  const nudge = (dLat: number, dLng: number) => {
    if (!hasCoords) return;
    const nextLat = Math.round((latitude! + dLat) * 100000) / 100000;
    const nextLng = Math.round((longitude! + dLng) * 100000) / 100000;
    onLocationSelect({ latitude: nextLat, longitude: nextLng });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="map" size={18} color={COLORS.primary} />
          <Text style={styles.title}>Google Maps Location</Text>
        </View>
        <TouchableOpacity
          onPress={handleUseCurrentLocation}
          disabled={loading}
          style={styles.gpsBtn}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <Ionicons name="locate" size={15} color={COLORS.primary} />
              <Text style={styles.gpsBtnText}>Use My GPS</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Address Search Bar */}
      <View style={styles.searchRow}>
        <TextInput
          placeholder="Search area, landmark or PIN..."
          placeholderTextColor={COLORS.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchAddress}
          style={styles.searchInput}
          returnKeyType="search"
        />
        <TouchableOpacity
          onPress={handleSearchAddress}
          disabled={searching}
          style={styles.searchBtn}
        >
          {searching ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="search" size={16} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {/* Interactive Location Visualizer Card */}
      <View style={styles.mapCard}>
        <View style={styles.pinCircle}>
          <Ionicons name="location" size={36} color={COLORS.primary} />
        </View>
        {hasCoords ? (
          <View style={styles.coordsBox}>
            <Text style={styles.coordsTitle}>Location Pinned</Text>
            <Text style={styles.coordsText}>
              Lat: {latitude!.toFixed(5)}, Lng: {longitude!.toFixed(5)}
            </Text>
            {addressString ? (
              <Text style={styles.addressPreview} numberOfLines={2}>
                {addressString}
              </Text>
            ) : null}

            {/* Fine-tuning nudges */}
            <View style={styles.nudgeRow}>
              <Text style={styles.nudgeLabel}>Adjust Pin:</Text>
              <TouchableOpacity onPress={() => nudge(0.0005, 0)} style={styles.nudgeBtn}>
                <Ionicons name="chevron-up" size={14} color={COLORS.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => nudge(-0.0005, 0)} style={styles.nudgeBtn}>
                <Ionicons name="chevron-down" size={14} color={COLORS.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => nudge(0, -0.0005)} style={styles.nudgeBtn}>
                <Ionicons name="chevron-back" size={14} color={COLORS.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => nudge(0, 0.0005)} style={styles.nudgeBtn}>
                <Ionicons name="chevron-forward" size={14} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCoordsBox}>
            <Text style={styles.emptyTitle}>No Location Selected</Text>
            <Text style={styles.emptyDesc}>
              Tap "Use My GPS" above or search an address to accurately pinpoint your base location on Google Maps.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    ...TYPOGRAPHY.caption,
    fontWeight: "700",
    color: COLORS.text,
  },
  gpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.md,
    backgroundColor: `${COLORS.primary}15`,
  },
  gpsBtnText: {
    ...TYPOGRAPHY.small,
    fontWeight: "700",
    color: COLORS.primary,
  },
  searchRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    height: 42,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  searchBtn: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  mapCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
  },
  pinCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${COLORS.primary}12`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xs,
  },
  coordsBox: {
    alignItems: "center",
    width: "100%",
  },
  coordsTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: "800",
    color: COLORS.success,
  },
  coordsText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontFamily: "monospace",
    marginTop: 2,
  },
  addressPreview: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: SPACING.sm,
  },
  nudgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: SPACING.sm,
  },
  nudgeLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  nudgeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCoordsBox: {
    alignItems: "center",
    paddingHorizontal: SPACING.md,
  },
  emptyTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  emptyDesc: {
    ...TYPOGRAPHY.small,
    color: COLORS.textTertiary,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 16,
  },
});
