import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BookingDoc } from "../../types/booking";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../config/theme";
import { StatusBadge } from "./StatusBadge";
import { Button } from "../common/Button";
import { calculateDistanceKm, openMapsNavigation } from "../../services/locationService";

interface BookingCardProps {
  booking: BookingDoc;
  onPress: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  partnerCoords?: { latitude: number; longitude: number } | null;
  loadingAccept?: boolean;
  loadingDecline?: boolean;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onPress,
  onAccept,
  onDecline,
  partnerCoords,
  loadingAccept = false,
  loadingDecline = false,
}) => {
  const isNewRequest =
    String(booking.assignmentStatus || "").toUpperCase() === "OFFERED" ||
    String(booking.assignmentStatus || "").toUpperCase() === "SEARCHING";

  const payout =
    Number(booking.partnerPayout ?? booking.technicianPayout) ||
    Math.round((Number(booking.amount || booking.customerTotal || 0) * 0.7));

  const distanceKm = calculateDistanceKm(
    partnerCoords?.latitude,
    partnerCoords?.longitude,
    booking.address?.lat,
    booking.address?.lng,
  );

  const addressLine = [
    booking.address?.line1,
    booking.address?.city,
    booking.address?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  const handleNavigate = () => {
    openMapsNavigation(
      addressLine,
      booking.address?.lat,
      booking.address?.lng,
    ).catch(() => {});
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[
        styles.card,
        isNewRequest && styles.newRequestCard,
      ]}
    >
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <StatusBadge
          status={booking.status}
          lifecycleStatus={booking.lifecycleStatus}
          assignmentStatus={booking.assignmentStatus}
          size="sm"
        />
        <View style={styles.payoutBadge}>
          <Text style={styles.payoutLabel}>Earn</Text>
          <Text style={styles.payoutValue}>₹{payout}</Text>
        </View>
      </View>

      {/* Main Service Info */}
      <View style={styles.serviceRow}>
        {booking.serviceImage ? (
          <Image
            source={{ uri: booking.serviceImage }}
            style={styles.serviceImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.servicePlaceholder}>
            <Ionicons name="build" size={20} color={COLORS.primary} />
          </View>
        )}
        <View style={styles.serviceDetails}>
          <Text style={styles.serviceTitle} numberOfLines={1}>
            {booking.serviceName || "Doorstep Service"}
          </Text>
          <Text style={styles.customerName} numberOfLines={1}>
            Customer: {booking.customerName || "Customer"}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Meta Info (Schedule & Location) */}
      <View style={styles.metaContainer}>
        <View style={styles.metaRow}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={COLORS.textSecondary}
            style={styles.metaIcon}
          />
          <Text style={styles.metaText} numberOfLines={1}>
            {booking.scheduledDate || "Today"} ·{" "}
            {booking.scheduledTime || booking.scheduledSlot || booking.timeSlot || "Standard slot"}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons
            name="location-outline"
            size={14}
            color={COLORS.textSecondary}
            style={styles.metaIcon}
          />
          <Text style={styles.metaText} numberOfLines={1}>
            {addressLine || "Customer Address"}
          </Text>
          {distanceKm != null ? (
            <Text style={styles.distanceText}>({distanceKm} km)</Text>
          ) : null}
        </View>
      </View>

      {/* Action Footer */}
      {isNewRequest ? (
        <View style={styles.requestActions}>
          <Button
            title="Decline"
            onPress={onDecline || (() => {})}
            variant="outline"
            size="sm"
            loading={loadingDecline}
            style={styles.actionBtn}
          />
          <Button
            title="Accept Booking"
            onPress={onAccept || (() => {})}
            variant="primary"
            size="sm"
            loading={loadingAccept}
            style={[styles.actionBtn, { flex: 1.4 }]}
          />
        </View>
      ) : (
        <View style={styles.activeActions}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleNavigate}
            style={styles.navButton}
          >
            <Ionicons name="navigate-outline" size={16} color={COLORS.primary} />
            <Text style={styles.navButtonText}>Directions</Text>
          </TouchableOpacity>
          <View style={styles.viewDetailRow}>
            <Text style={styles.viewDetailText}>View Details</Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  newRequestCard: {
    borderColor: COLORS.primary,
    backgroundColor: "#FFFDFB",
    borderWidth: 1.5,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  payoutBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
  },
  payoutLabel: {
    ...TYPOGRAPHY.small,
    fontSize: 10,
    color: COLORS.primaryDark,
    marginRight: 4,
    fontWeight: "700",
  },
  payoutValue: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 14,
    color: COLORS.primary,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  serviceImage: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary,
  },
  servicePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceDetails: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  serviceTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
    color: COLORS.text,
  },
  customerName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.sm,
  },
  metaContainer: {
    gap: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaIcon: {
    marginRight: 6,
    width: 16,
  },
  metaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    flex: 1,
  },
  distanceText: {
    ...TYPOGRAPHY.small,
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "700",
    marginLeft: 4,
  },
  requestActions: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  actionBtn: {
    flex: 1,
  },
  activeActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryLight,
  },
  navButtonText: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
    fontWeight: "700",
    marginLeft: 4,
  },
  viewDetailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewDetailText: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
    fontWeight: "700",
    marginRight: 2,
  },
});
