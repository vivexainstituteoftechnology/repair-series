import React, { useState } from "react";
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../config/theme";

export const AvailabilityToggle: React.FC = () => {
  const { isOnline, toggleOnlineStatus, verificationStatus } = useAuth();
  const [switching, setSwitching] = useState(false);

  const isApproved = verificationStatus === "active";

  const handleToggle = async () => {
    if (!isApproved || switching) return;
    setSwitching(true);
    try {
      await toggleOnlineStatus();
    } finally {
      setSwitching(false);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handleToggle}
      disabled={!isApproved || switching}
      style={[
        styles.container,
        isOnline ? styles.onlineContainer : styles.offlineContainer,
      ]}
    >
      <View style={styles.statusInfo}>
        <View style={styles.indicatorRow}>
          <View
            style={[
              styles.dot,
              isOnline ? styles.onlineDot : styles.offlineDot,
            ]}
          />
          <Text style={styles.statusLabel}>
            {isOnline ? "YOU ARE ONLINE" : "YOU ARE OFFLINE"}
          </Text>
        </View>
        <Text style={styles.subtext}>
          {!isApproved
            ? "Account verification required to go online"
            : isOnline
              ? "Available to receive nearby doorstep bookings"
              : "Tap switch to go online and receive jobs"}
        </Text>
      </View>

      <View style={styles.switchWrapper}>
        {switching ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Switch
            value={isOnline}
            onValueChange={handleToggle}
            disabled={!isApproved}
            trackColor={{ false: COLORS.border, true: COLORS.success }}
            thumbColor={COLORS.textInverse}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    marginVertical: SPACING.sm,
  },
  onlineContainer: {
    backgroundColor: COLORS.successLight,
    borderColor: "#A7F3D0",
  },
  offlineContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    borderColor: COLORS.border,
  },
  statusInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  indicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineDot: {
    backgroundColor: COLORS.success,
  },
  offlineDot: {
    backgroundColor: COLORS.textMuted,
  },
  statusLabel: {
    ...TYPOGRAPHY.small,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: COLORS.text,
  },
  subtext: {
    ...TYPOGRAPHY.small,
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  switchWrapper: {
    paddingLeft: SPACING.xs,
  },
});
