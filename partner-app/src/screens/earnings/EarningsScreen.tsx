import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useWallet } from "../../context/WalletContext";
import { useBookings } from "../../context/BookingContext";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../config/theme";
import { Header } from "../../components/common/Header";
import { StatCard } from "../../components/common/StatCard";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { EmptyState } from "../../components/common/EmptyState";

export const EarningsScreen = ({ navigation }: any) => {
  const {
    wallet,
    todayEarnings,
    thisWeekEarnings,
    thisMonthEarnings,
    refreshWallet,
    isLoading,
  } = useWallet();
  const { completedJobs } = useBookings();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"ledger" | "payouts">("ledger");

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshWallet();
    setRefreshing(false);
  };

  const balance = wallet.balanceRupees || wallet.balancePaise / 100 || 0;

  return (
    <View style={styles.container}>
      <Header title="Earnings & Partner Wallet" subtitle="Direct Payouts & Statements" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Wallet Balance Hero Card */}
        <View style={styles.walletHeroCard}>
          <View style={styles.walletHeader}>
            <View>
              <Text style={styles.walletLabel}>CURRENT WALLET BALANCE</Text>
              <Text style={styles.walletBalance}>₹{balance.toFixed(2)}</Text>
            </View>
            <View style={styles.walletIconCircle}>
              <Ionicons name="wallet" size={24} color={COLORS.textInverse} />
            </View>
          </View>

          <Text style={styles.walletHint}>
            {balance > 0
              ? "Available to withdraw directly to your registered bank / UPI account."
              : "Complete more doorstep jobs to increase your balance."}
          </Text>

          <View style={styles.walletActions}>
            <Button
              title="Request Bank Payout"
              onPress={() => navigation.navigate("RequestPayout")}
              variant="outline"
              size="md"
              disabled={balance <= 0}
              style={styles.withdrawBtn}
              textStyle={{ color: COLORS.textInverse, fontWeight: "700" }}
            />
            <Button
              title="Cash Settlement"
              onPress={() => navigation.navigate("CashSettlement")}
              variant="secondary"
              size="md"
              style={styles.settleBtn}
            />
          </View>
        </View>

        {/* Breakdown Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Today's Earnings"
            value={`₹${todayEarnings}`}
            subtitle="Credited jobs"
            icon={<Ionicons name="today-outline" size={18} color={COLORS.primary} />}
            iconBg={COLORS.primaryLight}
          />
          <StatCard
            title="This Week"
            value={`₹${thisWeekEarnings}`}
            subtitle="Completed total"
            icon={<Ionicons name="bar-chart-outline" size={18} color={COLORS.success} />}
            iconBg={COLORS.successLight}
          />
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveTab("ledger")}
            style={[styles.tab, activeTab === "ledger" && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "ledger" && styles.tabTextActive,
              ]}
            >
              Statement Ledger ({wallet.ledger.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveTab("payouts")}
            style={[styles.tab, activeTab === "payouts" && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "payouts" && styles.tabTextActive,
              ]}
            >
              Payout Requests ({wallet.payoutRequests.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === "ledger" ? (
          wallet.ledger.length > 0 ? (
            <View style={styles.ledgerList}>
              {wallet.ledger.map((entry, idx) => {
                const isCredit = entry.type === "credit";
                const amount = entry.amountRupees ?? entry.amountPaise / 100;
                return (
                  <View key={entry.id || idx} style={styles.ledgerItem}>
                    <View
                      style={[
                        styles.ledgerIconCircle,
                        isCredit
                          ? { backgroundColor: COLORS.successLight }
                          : { backgroundColor: COLORS.dangerLight },
                      ]}
                    >
                      <Ionicons
                        name={isCredit ? "arrow-down" : "arrow-up"}
                        size={16}
                        color={isCredit ? COLORS.success : COLORS.danger}
                      />
                    </View>
                    <View style={styles.ledgerTextWrapper}>
                      <Text style={styles.ledgerReason} numberOfLines={1}>
                        {entry.reason || (isCredit ? "Service Job Payout" : "Commission / Cash Remittance")}
                      </Text>
                      {entry.bookingId ? (
                        <Text style={styles.ledgerSub}>Job #{entry.bookingId.slice(-6).toUpperCase()}</Text>
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.ledgerAmount,
                        { color: isCredit ? COLORS.successDark : COLORS.dangerDark },
                      ]}
                    >
                      {isCredit ? "+" : "-"}₹{Math.abs(amount).toFixed(2)}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <EmptyState
              icon="receipt-outline"
              title="No Ledger Transactions Yet"
              subtitle="Completed booking payouts, adjustments, and remittances will be listed here automatically."
            />
          )
        ) : wallet.payoutRequests.length > 0 ? (
          <View style={styles.ledgerList}>
            {wallet.payoutRequests.map((req, idx) => (
              <View key={req.id || idx} style={styles.ledgerItem}>
                <View style={[styles.ledgerIconCircle, { backgroundColor: COLORS.primaryLight }]}>
                  <Ionicons name="cash-outline" size={16} color={COLORS.primary} />
                </View>
                <View style={styles.ledgerTextWrapper}>
                  <Text style={styles.ledgerReason}>Payout Request #{req.id.slice(-6).toUpperCase()}</Text>
                  <Text style={styles.ledgerSub}>Direct Bank Transfer</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.ledgerAmount, { color: COLORS.text }]}>₹{req.amount}</Text>
                  <Badge
                    label={req.status}
                    tone={
                      req.status === "PAID"
                        ? "success"
                        : req.status === "REJECTED"
                          ? "danger"
                          : "warning"
                    }
                    size="sm"
                    style={{ marginTop: 2 }}
                  />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState
            icon="cash-outline"
            title="No Payout Requests"
            subtitle="You haven't requested any bank withdrawals yet. Tap Request Bank Payout above to withdraw your balance."
          />
        )}
      </ScrollView>
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
  walletHeroCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  walletHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  walletLabel: {
    ...TYPOGRAPHY.small,
    fontSize: 10,
    color: "#FED7AA",
    fontWeight: "800",
    letterSpacing: 1,
  },
  walletBalance: {
    ...TYPOGRAPHY.h1,
    fontSize: 32,
    color: COLORS.textInverse,
    marginTop: 2,
  },
  walletIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  walletHint: {
    ...TYPOGRAPHY.caption,
    color: "#FFEDD5",
    marginTop: SPACING.sm,
    lineHeight: 18,
  },
  walletActions: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  withdrawBtn: {
    flex: 1.2,
    borderColor: COLORS.textInverse,
    borderWidth: 1.5,
  },
  settleBtn: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.lg,
    padding: 3,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: RADIUS.md,
  },
  tabActive: {
    backgroundColor: COLORS.card,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  tabText: {
    ...TYPOGRAPHY.small,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  ledgerList: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  ledgerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  ledgerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
  },
  ledgerTextWrapper: {
    flex: 1,
  },
  ledgerReason: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 13,
    color: COLORS.text,
  },
  ledgerSub: {
    ...TYPOGRAPHY.small,
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ledgerAmount: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 14,
  },
});
