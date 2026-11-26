import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useBookings } from "../../context/BookingContext";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../config/theme";
import { Header } from "../../components/common/Header";
import { StatusBadge } from "../../components/booking/StatusBadge";
import { Button } from "../../components/common/Button";
import { OtpInputModal } from "../../components/booking/OtpInputModal";
import { openMapsNavigation } from "../../services/locationService";
import { BookingLifecycleStatus } from "../../types/booking";

export const JobDetailScreen = ({ route, navigation }: any) => {
  const { bookingId } = route.params;
  const {
    getBookingById,
    acceptBooking,
    declineBooking,
    updateLifecycle,
    startJobWithOtp,
    collectCashPayment,
  } = useBookings();

  const booking = getBookingById(bookingId);

  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  if (!booking) {
    return (
      <View style={styles.container}>
        <Header title="Booking Details" showBack onBack={() => navigation.goBack()} />
        <View style={styles.notFoundCenter}>
          <Text style={styles.notFoundText}>Booking record not found or expired.</Text>
          <Button
            title="Go Back to Bookings"
            onPress={() => navigation.goBack()}
            style={{ marginTop: SPACING.md }}
          />
        </View>
      </View>
    );
  }

  const isOffered =
    String(booking.assignmentStatus || "").toUpperCase() === "OFFERED" ||
    String(booking.assignmentStatus || "").toUpperCase() === "SEARCHING";

  const isCompleted = String(booking.status || "").toLowerCase() === "completed";
  const isCancelled = String(booking.status || "").toLowerCase() === "cancelled";

  const lifeSt = String(booking.lifecycleStatus || "PARTNER_ACCEPTED").toUpperCase();

  const payout =
    Number(booking.partnerPayout ?? booking.technicianPayout) ||
    Math.round(Number(booking.amount || booking.customerTotal || 0) * 0.7);

  const customerTotal = Number(booking.customerTotal || booking.amount || 0);

  const fullAddress = [
    booking.address?.line1,
    booking.address?.line2,
    booking.address?.landmark && `Near ${booking.address.landmark}`,
    booking.address?.city,
    booking.address?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  const handleCall = () => {
    if (booking.customerPhone) {
      Linking.openURL(`tel:${booking.customerPhone}`);
    } else {
      Alert.alert("Contact Unavailable", "Customer phone number is not available.");
    }
  };

  const handleWhatsApp = () => {
    const rawPhone = String(booking.customerPhone || "").replace(/\D/g, "");
    if (rawPhone) {
      const e164 = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
      const text = encodeURIComponent(
        `Hello ${booking.customerName || "Customer"}, I am your assigned Repair Series Partner for your ${booking.serviceName || "repair"} service booking.`,
      );
      Linking.openURL(`https://wa.me/${e164}?text=${text}`);
    }
  };

  const handleOpenMaps = () => {
    openMapsNavigation(
      fullAddress,
      booking.address?.lat,
      booking.address?.lng,
    ).catch(() => {
      Alert.alert("Maps Navigation", "Could not open maps application.");
    });
  };

  // Step Action Handler
  const handleWorkflowStep = async (nextStep: BookingLifecycleStatus) => {
    setLoadingAction(true);
    try {
      await updateLifecycle(booking.id, nextStep);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleVerifyOtp = async (otpInput: string) => {
    setLoadingAction(true);
    setOtpError(null);
    try {
      const result = await startJobWithOtp(booking.id, otpInput);
      if (result.success) {
        setOtpModalVisible(false);
      } else {
        setOtpError(result.error || "Invalid OTP code.");
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCollectCash = async () => {
    Alert.alert(
      "Confirm Cash Collection",
      `Have you collected ₹${customerTotal} in cash from the customer? This will mark the booking completed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm & Complete",
          onPress: async () => {
            setLoadingAction(true);
            try {
              await collectCashPayment(booking.id);
            } finally {
              setLoadingAction(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title={`Job #${booking.id.slice(-6).toUpperCase()}`}
        subtitle={booking.serviceName}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <StatusBadge
            status={booking.status}
            lifecycleStatus={booking.lifecycleStatus}
            assignmentStatus={booking.assignmentStatus}
            size="sm"
          />
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Earnings Card */}
        <View style={styles.payoutCard}>
          <View>
            <Text style={styles.payoutTitle}>Your Guaranteed Earning</Text>
            <Text style={styles.payoutSub}>Credited directly upon completion</Text>
          </View>
          <Text style={styles.payoutAmount}>₹{payout}</Text>
        </View>

        {/* Customer Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Customer Contact</Text>
            <View style={styles.contactButtonsRow}>
              <TouchableOpacity
                onPress={handleCall}
                style={[styles.contactCircle, { backgroundColor: "#EFF6FF" }]}
              >
                <Ionicons name="call" size={18} color={COLORS.info} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleWhatsApp}
                style={[styles.contactCircle, { backgroundColor: "#ECFDF5" }]}
              >
                <Ionicons name="logo-whatsapp" size={18} color={COLORS.success} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.customerName}>{booking.customerName || "Customer"}</Text>
          <Text style={styles.customerPhone}>{booking.customerPhone || "Mobile provided"}</Text>

          {booking.customerNotes ? (
            <View style={styles.notesBox}>
              <Ionicons name="chatbox-ellipses-outline" size={14} color={COLORS.primary} />
              <Text style={styles.notesText}>{booking.customerNotes}</Text>
            </View>
          ) : null}
        </View>

        {/* Service Address & Google Maps Navigation */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="location" size={18} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Customer Destination</Text>
            </View>
            <TouchableOpacity onPress={handleOpenMaps} style={styles.mapsButton}>
              <Ionicons name="navigate" size={14} color={COLORS.textInverse} />
              <Text style={styles.mapsButtonText}>Turn-by-Turn</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.addressText}>{fullAddress || "Address provided"}</Text>

          {/* Real-time distance and ETA badge */}
          {booking.distanceKm != null || (booking.address?.lat && booking.address?.lng) ? (
            <View style={styles.routeMetricsRow}>
              <View style={styles.routeMetricItem}>
                <Ionicons name="speedometer-outline" size={16} color={COLORS.primary} />
                <Text style={styles.routeMetricText}>
                  Distance: <Text style={{ fontWeight: "800", color: COLORS.text }}>{booking.distanceKm ?? "~4.2"} km</Text>
                </Text>
              </View>
              <View style={styles.routeMetricItem}>
                <Ionicons name="time-outline" size={16} color={COLORS.info} />
                <Text style={styles.routeMetricText}>
                  Est. Travel: <Text style={{ fontWeight: "800", color: COLORS.text }}>~{Math.max(5, Math.round(((booking.distanceKm || 4.2) / 25) * 60))} mins</Text>
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.scheduleRow}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
            <Text style={styles.scheduleText}>
              Scheduled: <Text style={{ fontWeight: "700" }}>{booking.scheduledDate}</Text> (
              {booking.scheduledTime || booking.scheduledSlot || booking.timeSlot || "Standard window"})
            </Text>
          </View>
        </View>

        {/* Service Items & Variations */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Service Scope</Text>
          <View style={styles.serviceItemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{booking.serviceName}</Text>
              {booking.items && booking.items.length > 0 ? (
                booking.items.map((it, idx) => (
                  <Text key={idx} style={styles.itemVariant}>
                    • {it.variantName || it.serviceName || "Standard variation"} (Qty: {it.quantity || 1})
                  </Text>
                ))
              ) : (
                <Text style={styles.itemVariant}>Standard Doorstep Repair & Inspection</Text>
              )}
            </View>
            <Text style={styles.itemPrice}>₹{customerTotal}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.priceBreakdownRow}>
            <Text style={styles.priceKey}>Customer Billable Total</Text>
            <Text style={styles.priceVal}>₹{customerTotal}</Text>
          </View>
          <View style={styles.priceBreakdownRow}>
            <Text style={styles.priceKey}>Payment Method</Text>
            <Text style={styles.priceVal}>
              {String(booking.paymentMethod || "CASH / COD").toUpperCase()}
            </Text>
          </View>
          <View style={styles.priceBreakdownRow}>
            <Text style={styles.priceKey}>Payment Status</Text>
            <Text
              style={[
                styles.priceVal,
                { color: booking.paymentStatus === "paid" ? COLORS.success : COLORS.warningDark },
              ]}
            >
              {String(booking.paymentStatus || "Pending").toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Workflow Action Engine */}
        <View style={styles.workflowContainer}>
          {isOffered ? (
            <View style={styles.actionButtonGroup}>
              <Button
                title="Decline"
                onPress={() => declineBooking(booking.id)}
                variant="outline"
                size="lg"
                style={{ flex: 1 }}
              />
              <Button
                title="Accept Booking"
                onPress={() => acceptBooking(booking.id)}
                variant="primary"
                size="lg"
                style={{ flex: 1.5 }}
              />
            </View>
          ) : isCompleted ? (
            <View style={styles.completedBanner}>
              <Ionicons name="checkmark-circle" size={28} color={COLORS.success} />
              <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                <Text style={styles.completedTitle}>Job Completed Successfully</Text>
                <Text style={styles.completedSubtitle}>
                  ₹{payout} has been credited to your Repair Series partner wallet.
                </Text>
              </View>
            </View>
          ) : isCancelled ? (
            <View style={[styles.completedBanner, { backgroundColor: COLORS.dangerLight }]}>
              <Ionicons name="close-circle" size={28} color={COLORS.danger} />
              <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                <Text style={[styles.completedTitle, { color: COLORS.dangerDark }]}>
                  Booking Cancelled
                </Text>
                <Text style={styles.completedSubtitle}>This job was cancelled by the customer or admin.</Text>
              </View>
            </View>
          ) : (
            <View style={styles.stepControls}>
              {lifeSt === "PARTNER_ACCEPTED" && (
                <Button
                  title="I'm On The Way (Start Driving)"
                  onPress={() => handleWorkflowStep("PARTNER_ON_THE_WAY")}
                  loading={loadingAction}
                  size="lg"
                  icon={<Ionicons name="car-outline" size={20} color={COLORS.textInverse} />}
                />
              )}

              {lifeSt === "PARTNER_ON_THE_WAY" && (
                <Button
                  title="Reached Customer Location"
                  onPress={() => handleWorkflowStep("PARTNER_ARRIVED")}
                  loading={loadingAction}
                  size="lg"
                  variant="primary"
                  icon={<Ionicons name="location-outline" size={20} color={COLORS.textInverse} />}
                />
              )}

              {lifeSt === "PARTNER_ARRIVED" && (
                <Button
                  title="Start Service (Verify 4-Digit OTP)"
                  onPress={() => setOtpModalVisible(true)}
                  loading={loadingAction}
                  size="lg"
                  variant="primary"
                  icon={<Ionicons name="key-outline" size={20} color={COLORS.textInverse} />}
                />
              )}

              {(lifeSt === "JOB_STARTED" || lifeSt === "WORK_IN_PROGRESS") && (
                <Button
                  title="Mark Work Completed"
                  onPress={() => handleWorkflowStep("WORK_COMPLETED")}
                  loading={loadingAction}
                  size="lg"
                  variant="primary"
                  icon={<Ionicons name="checkmark-done" size={20} color={COLORS.textInverse} />}
                />
              )}

              {lifeSt === "WORK_COMPLETED" && (
                <Button
                  title={`Collect Cash Payment (₹${customerTotal})`}
                  onPress={handleCollectCash}
                  loading={loadingAction}
                  size="lg"
                  variant="success"
                  icon={<Ionicons name="cash" size={20} color={COLORS.textInverse} />}
                />
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 4-digit OTP modal */}
      <OtpInputModal
        visible={otpModalVisible}
        onClose={() => setOtpModalVisible(false)}
        onSubmit={handleVerifyOtp}
        loading={loadingAction}
        serviceTitle={booking.serviceName}
        errorMessage={otpError}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  payoutCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: "#FED7AA",
    marginBottom: SPACING.md,
  },
  payoutTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.primaryDark,
    fontSize: 15,
  },
  payoutSub: {
    ...TYPOGRAPHY.small,
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  payoutAmount: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
    fontSize: 26,
  },
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
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
    color: COLORS.text,
  },
  contactButtonsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  contactCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  customerName: {
    ...TYPOGRAPHY.h2,
    fontSize: 18,
    color: COLORS.text,
  },
  customerPhone: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  notesBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
    gap: 6,
  },
  notesText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    flex: 1,
  },
  mapsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  mapsButtonText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textInverse,
    fontWeight: "700",
  },
  addressText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  scheduleText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
  },
  serviceItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.xs,
  },
  itemTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.text,
  },
  itemVariant: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  itemPrice: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.sm,
  },
  priceBreakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  priceKey: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  priceVal: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 13,
    color: COLORS.text,
  },
  workflowContainer: {
    marginTop: SPACING.md,
  },
  actionButtonGroup: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  stepControls: {
    gap: SPACING.sm,
  },
  completedBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.successLight,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  completedTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
    color: COLORS.successDark,
  },
  completedSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  notFoundCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  notFoundText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  routeMetricsRow: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginVertical: SPACING.xs,
  },
  routeMetricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  routeMetricText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
});
