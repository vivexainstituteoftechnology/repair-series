import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useBookings } from "../../context/BookingContext";
import { useAuth } from "../../context/AuthContext";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../config/theme";
import { Header } from "../../components/common/Header";
import { BookingCard } from "../../components/booking/BookingCard";
import { EmptyState } from "../../components/common/EmptyState";

type TabType = "active" | "requests" | "upcoming" | "history";

export const JobsScreen = ({ navigation }: any) => {
  const {
    activeJobs,
    newRequests,
    upcomingJobs,
    completedJobs,
    acceptBooking,
    declineBooking,
    isLoading,
  } = useBookings();
  const { isOnline } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>(
    newRequests.length > 0 ? "requests" : "active",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const getTabList = () => {
    switch (activeTab) {
      case "requests":
        return newRequests;
      case "upcoming":
        return upcomingJobs;
      case "history":
        return completedJobs;
      case "active":
      default:
        return activeJobs;
    }
  };

  const currentList = getTabList().filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (b.serviceName && b.serviceName.toLowerCase().includes(q)) ||
      (b.customerName && b.customerName.toLowerCase().includes(q)) ||
      (b.id && b.id.toLowerCase().includes(q)) ||
      (b.address?.city && b.address.city.toLowerCase().includes(q))
    );
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <View style={styles.container}>
      <Header title="My Bookings & Jobs" subtitle="Manage Doorstep Assignments" />

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={18}
          color={COLORS.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by customer, service or ID..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Segmented Filter Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveTab("active")}
          style={[styles.tab, activeTab === "active" && styles.tabActive]}
        >
          <Text
            style={[styles.tabText, activeTab === "active" && styles.tabTextActive]}
          >
            Active ({activeJobs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveTab("requests")}
          style={[styles.tab, activeTab === "requests" && styles.tabActive]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "requests" && styles.tabTextActive,
            ]}
          >
            Requests ({newRequests.length})
          </Text>
          {newRequests.length > 0 && <View style={styles.tabBadgeDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveTab("upcoming")}
          style={[styles.tab, activeTab === "upcoming" && styles.tabActive]}
        >
          <Text
            style={[styles.tabText, activeTab === "upcoming" && styles.tabTextActive]}
          >
            Upcoming ({upcomingJobs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveTab("history")}
          style={[styles.tab, activeTab === "history" && styles.tabActive]}
        >
          <Text
            style={[styles.tabText, activeTab === "history" && styles.tabTextActive]}
          >
            History ({completedJobs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      <FlatList
        data={currentList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            onPress={() =>
              navigation.navigate("JobDetail", { bookingId: item.id })
            }
            onAccept={() => acceptBooking(item.id)}
            onDecline={() => declineBooking(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon={
              activeTab === "requests"
                ? "notifications-off-outline"
                : activeTab === "active"
                  ? "briefcase-outline"
                  : activeTab === "upcoming"
                    ? "calendar-outline"
                    : "checkmark-done-circle-outline"
            }
            title={
              activeTab === "requests"
                ? "No New Booking Requests"
                : activeTab === "active"
                  ? "No Active Jobs Right Now"
                  : activeTab === "upcoming"
                    ? "No Upcoming Scheduled Bookings"
                    : "No Completed Jobs Yet"
            }
            subtitle={
              activeTab === "requests"
                ? isOnline
                  ? "You're online. When a customer nearby books your service, the offer will appear here."
                  : "Turn your availability Online on the dashboard to receive new job alerts."
                : activeTab === "active"
                  ? "You don't have any ongoing repair jobs in progress."
                  : "Bookings scheduled for future dates will be listed here."
            }
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    position: "relative",
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    ...TYPOGRAPHY.small,
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "700",
  },
  tabTextActive: {
    color: COLORS.textInverse,
  },
  tabBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FBBF24",
    marginLeft: 4,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
});
