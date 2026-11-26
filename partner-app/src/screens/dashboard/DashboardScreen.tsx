import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useBookings } from "../../context/BookingContext";
import { useWallet } from "../../context/WalletContext";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../config/theme";
import { AvailabilityToggle } from "../../components/dashboard/AvailabilityToggle";
import { IncomingRequestBanner } from "../../components/dashboard/IncomingRequestBanner";
import { StatCard } from "../../components/common/StatCard";
import { BookingCard } from "../../components/booking/BookingCard";
import { EmptyState } from "../../components/common/EmptyState";

export const DashboardScreen = ({ navigation }: any) => {
  const { partnerDoc, isOnline } = useAuth();
  const {
    activeJobs,
    newRequests,
    completedJobs,
    acceptBooking,
    declineBooking,
    isLoading: loadingBookings,
  } = useBookings();
  const { todayEarnings, refreshWallet, isLoading: loadingWallet } = useWallet();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshWallet();
    setRefreshing(false);
  };

  const currentOngoingJob = activeJobs[0] || null;
  const latestOffer = newRequests[0] || null;

  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.appBar}>
        <View style={styles.partnerInfo}>
          <View style={styles.avatarCircle}>
            {partnerDoc?.profileImage || partnerDoc?.avatar ? (
              <Image
                source={{ uri: partnerDoc.profileImage || partnerDoc.avatar }}
                style={styles.avatarImg}
              />
            ) : (
              <Ionicons name="person" size={20} color={COLORS.primary} />
            )}
          </View>
          <View style={styles.partnerText}>
            <Text style={styles.greeting} numberOfLines={1}>
              {partnerDoc?.name || "Service Partner"}
            </Text>
            <View style={styles.badgeRow}>
              <View style={styles.activeDot} />
              <Text style={styles.subCategory} numberOfLines={1}>
                {partnerDoc?.skills || partnerDoc?.categoryId || "Certified Partner"} ·{" "}
                {partnerDoc?.city || "Gurugram"}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate("Alerts")}
          style={styles.iconBtn}
        >
          <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
          {newRequests.length > 0 && <View style={styles.notifBadge} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Availability Toggle */}
        <AvailabilityToggle />

        {/* Incoming Urgent Job Offer Banner */}
        {latestOffer && (
          <IncomingRequestBanner
            request={latestOffer}
            onAccept={acceptBooking}
            onDecline={declineBooking}
            onView={(id) => navigation.navigate("JobDetail", { bookingId: id })}
          />
        )}

        {/* Today's Key Metrics */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Today's Earnings"
            value={`₹${todayEarnings}`}
            subtitle="Guaranteed payout"
            icon={<Ionicons name="wallet-outline" size={20} color={COLORS.primary} />}
            iconBg={COLORS.primaryLight}
          />
          <StatCard
            title="Jobs Done"
            value={completedJobs.length}
            subtitle="All time verified"
            icon={<Ionicons name="checkmark-done" size={20} color={COLORS.success} />}
            iconBg={COLORS.successLight}
          />
        </View>

        <View style={[styles.statsGrid, { marginTop: SPACING.sm }]}>
          <StatCard
            title="Active / Pending"
            value={activeJobs.length + newRequests.length}
            subtitle={activeJobs.length > 0 ? "1 in progress" : "Ready for jobs"}
            icon={<Ionicons name="briefcase-outline" size={20} color={COLORS.info} />}
            iconBg={COLORS.infoLight}
          />
          <StatCard
            title="Customer Rating"
            value={`★ ${Number(partnerDoc?.rating || 4.9).toFixed(1)}`}
            subtitle={`${partnerDoc?.ratingCount || 18} verified reviews`}
            icon={<Ionicons name="star" size={20} color="#F59E0B" />}
            iconBg="#FEF3C7"
          />
        </View>

        {/* Ongoing Active Job Hero */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Current Ongoing Job</Text>
          {activeJobs.length > 1 && (
            <TouchableOpacity onPress={() => navigation.navigate("Jobs")}>
              <Text style={styles.sectionLink}>View All ({activeJobs.length})</Text>
            </TouchableOpacity>
          )}
        </View>

        {currentOngoingJob ? (
          <BookingCard
            booking={currentOngoingJob}
            onPress={() =>
              navigation.navigate("JobDetail", { bookingId: currentOngoingJob.id })
            }
          />
        ) : (
          <EmptyState
            icon={isOnline ? "briefcase-outline" : "moon-outline"}
            title={isOnline ? "Waiting for Next Booking" : "You Are Currently Offline"}
            subtitle={
              isOnline
                ? "You are online and eligible for instant dispatch. New doorstep requests near your area will alert here automatically."
                : "Toggle your switch to Online above whenever you're ready to start receiving repair jobs."
            }
          />
        )}

        {/* Quick Action Cards */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Management</Text>
        </View>

        <View style={styles.quickGrid}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate("Jobs")}
            style={styles.quickCard}
          >
            <View style={[styles.quickIcon, { backgroundColor: "#EFF6FF" }]}>
              <Ionicons name="list" size={22} color={COLORS.info} />
            </View>
            <Text style={styles.quickTitle}>All Bookings</Text>
            <Text style={styles.quickSubtitle}>View job queue & history</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate("Earnings")}
            style={styles.quickCard}
          >
            <View style={[styles.quickIcon, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="cash-outline" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.quickTitle}>Wallet & Payouts</Text>
            <Text style={styles.quickSubtitle}>Balance & bank transfer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  partnerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  partnerText: {
    flex: 1,
  },
  greeting: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    color: COLORS.text,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 1,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 4,
  },
  subCategory: {
    ...TYPOGRAPHY.small,
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notifBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  statsGrid: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    color: COLORS.text,
  },
  sectionLink: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
    fontWeight: "700",
  },
  quickGrid: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  quickCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  quickTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.text,
    fontSize: 14,
  },
  quickSubtitle: {
    ...TYPOGRAPHY.small,
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
