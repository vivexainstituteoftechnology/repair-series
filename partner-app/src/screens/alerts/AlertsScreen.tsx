import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useBookings } from "../../context/BookingContext";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../config/theme";
import { Header } from "../../components/common/Header";
import { EmptyState } from "../../components/common/EmptyState";

interface AlertItem {
  id: string;
  type: "booking" | "payment" | "system" | "announcement";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  bookingId?: string;
}

export const AlertsScreen = ({ navigation }: any) => {
  const { newRequests, completedJobs } = useBookings();
  const [filter, setFilter] = useState<"all" | "booking" | "payment">("all");

  // Derive active alert items from bookings
  const alerts: AlertItem[] = [
    ...newRequests.map((req) => ({
      id: `offer_${req.id}`,
      type: "booking" as const,
      title: "New Job Request Assigned",
      message: `You have been offered a doorstep ${req.serviceName || "repair"} job. Tap to review & accept.`,
      timestamp: req.scheduledDate || "Just now",
      read: false,
      bookingId: req.id,
    })),
    ...completedJobs.slice(0, 5).map((job) => ({
      id: `done_${job.id}`,
      type: "payment" as const,
      title: "Job Payout Credited",
      message: `Earning of ₹${Number(job.partnerPayout ?? job.technicianPayout ?? 0)} has been credited for Job #${job.id.slice(-6).toUpperCase()}.`,
      timestamp: job.scheduledDate || "Recent",
      read: true,
      bookingId: job.id,
    })),
    {
      id: "welcome_notice",
      type: "system" as const,
      title: "Repair Series Partner Network",
      message: "Keep your availability switch Online on the dashboard to receive highest-priority job allocations.",
      timestamp: "Today",
      read: true,
    },
  ];

  const filtered = alerts.filter((a) => {
    if (filter === "all") return true;
    return a.type === filter;
  });

  const handleAlertPress = (item: AlertItem) => {
    if (item.bookingId) {
      navigation.navigate("JobDetail", { bookingId: item.bookingId });
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Notification Alerts" subtitle="Job Updates & Broadcasts" />

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          onPress={() => setFilter("all")}
          style={[styles.chip, filter === "all" && styles.chipActive]}
        >
          <Text style={[styles.chipText, filter === "all" && styles.chipTextActive]}>
            All ({alerts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter("booking")}
          style={[styles.chip, filter === "booking" && styles.chipActive]}
        >
          <Text
            style={[styles.chipText, filter === "booking" && styles.chipTextActive]}
          >
            Jobs ({alerts.filter((a) => a.type === "booking").length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter("payment")}
          style={[styles.chip, filter === "payment" && styles.chipActive]}
        >
          <Text
            style={[styles.chipText, filter === "payment" && styles.chipTextActive]}
          >
            Payments
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isBooking = item.type === "booking";
          const isPayment = item.type === "payment";

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleAlertPress(item)}
              style={[
                styles.alertCard,
                !item.read && styles.unreadAlertCard,
              ]}
            >
              <View
                style={[
                  styles.iconBox,
                  isBooking
                    ? { backgroundColor: COLORS.primaryLight }
                    : isPayment
                      ? { backgroundColor: COLORS.successLight }
                      : { backgroundColor: COLORS.backgroundSecondary },
                ]}
              >
                <Ionicons
                  name={
                    isBooking
                      ? "briefcase"
                      : isPayment
                        ? "cash"
                        : "information-circle"
                  }
                  size={20}
                  color={
                    isBooking
                      ? COLORS.primary
                      : isPayment
                        ? COLORS.success
                        : COLORS.textSecondary
                  }
                />
              </View>

              <View style={styles.alertContent}>
                <View style={styles.alertTopRow}>
                  <Text style={styles.alertTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.alertTime}>{item.timestamp}</Text>
                </View>
                <Text style={styles.alertMessage}>{item.message}</Text>
              </View>

              {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title="No Notifications"
            subtitle="You're all caught up! New job assignments, customer updates and earnings will alert here."
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    ...TYPOGRAPHY.small,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "700",
  },
  chipTextActive: {
    color: COLORS.textInverse,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  unreadAlertCard: {
    borderColor: COLORS.primary,
    backgroundColor: "#FFFDFB",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  alertContent: {
    flex: 1,
  },
  alertTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  alertTitle: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 13,
    color: COLORS.text,
    flex: 1,
  },
  alertTime: {
    ...TYPOGRAPHY.small,
    fontSize: 10,
    color: COLORS.textMuted,
    marginLeft: 6,
  },
  alertMessage: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.xs,
  },
});
