import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BookingDoc } from "../../types/booking";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../config/theme";
import { Button } from "../common/Button";

interface IncomingRequestBannerProps {
  request: BookingDoc;
  onAccept: (bookingId: string) => Promise<boolean>;
  onDecline: (bookingId: string) => Promise<boolean>;
  onView: (bookingId: string) => void;
}

export const IncomingRequestBanner: React.FC<IncomingRequestBannerProps> = ({
  request,
  onAccept,
  onDecline,
  onView,
}) => {
  const [loadingAccept, setLoadingAccept] = useState(false);
  const [loadingDecline, setLoadingDecline] = useState(false);

  const payout =
    Number(request.partnerPayout ?? request.technicianPayout) ||
    Math.round(Number(request.amount || request.customerTotal || 0) * 0.7);

  const handleAccept = async () => {
    setLoadingAccept(true);
    try {
      await onAccept(request.id);
    } finally {
      setLoadingAccept(false);
    }
  };

  const handleDecline = async () => {
    setLoadingDecline(true);
    try {
      await onDecline(request.id);
    } finally {
      setLoadingDecline(false);
    }
  };

  return (
    <View style={styles.banner}>
      <View style={styles.headerRow}>
        <View style={styles.pulseDot} />
        <Text style={styles.urgentLabel}>NEW JOB REQUEST</Text>
        <Text style={styles.payoutHighlight}>Earn ₹{payout}</Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onView(request.id)}
        style={styles.contentRow}
      >
        <View style={styles.iconBox}>
          <Ionicons name="flash" size={20} color={COLORS.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.serviceName} numberOfLines={1}>
            {request.serviceName || "Doorstep Service"}
          </Text>
          <Text style={styles.addressLine} numberOfLines={1}>
            {request.address?.city || request.address?.line1 || "Customer doorstep"} ·{" "}
            {request.scheduledTime || "Today"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <View style={styles.actionRow}>
        <Button
          title="Decline"
          onPress={handleDecline}
          variant="outline"
          size="sm"
          loading={loadingDecline}
          style={styles.actionBtn}
        />
        <Button
          title="Accept Now"
          onPress={handleAccept}
          variant="primary"
          size="sm"
          loading={loadingAccept}
          style={[styles.actionBtn, { flex: 1.5 }]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#FFF8F2",
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginBottom: SPACING.lg,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 6,
  },
  urgentLabel: {
    ...TYPOGRAPHY.small,
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primaryDark,
    flex: 1,
    letterSpacing: 0.5,
  },
  payoutHighlight: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.primary,
    fontSize: 16,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.xs,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
  },
  textContainer: {
    flex: 1,
  },
  serviceName: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 15,
    color: COLORS.text,
  },
  addressLine: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.xs,
  },
  actionBtn: {
    flex: 1,
  },
});
