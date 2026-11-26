import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useWallet } from "../../context/WalletContext";
import { useAuth } from "../../context/AuthContext";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../config/theme";
import { Header } from "../../components/common/Header";
import { Button } from "../../components/common/Button";

export const RequestPayoutScreen = ({ navigation }: any) => {
  const { wallet, requestPayout } = useWallet();
  const { partnerDoc } = useAuth();

  const balance = wallet.balanceRupees || wallet.balancePaise / 100 || 0;
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numAmount = Number(amount) || 0;
  const isValid = numAmount > 0 && numAmount <= balance;

  const handleQuickAmount = (val: number) => {
    const clamped = Math.min(val, balance);
    setAmount(String(clamped));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!isValid) {
      setError(`Please enter a valid amount between ₹1 and ₹${balance.toFixed(2)}.`);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await requestPayout(numAmount);
      if (res.success) {
        Alert.alert(
          "Payout Request Submitted",
          `Your withdrawal request of ₹${numAmount} has been placed. The operations team will transfer it to your bank / UPI account shortly.`,
          [{ text: "OK", onPress: () => navigation.goBack() }],
        );
      } else {
        setError(res.error || "Could not place payout request.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <Header
        title="Request Bank Payout"
        subtitle="Withdraw Wallet Balance"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Available Balance Box */}
        <View style={styles.balanceBox}>
          <Text style={styles.balanceLabel}>Available Withdrawal Balance</Text>
          <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
        </View>

        {/* Amount Input */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Enter Withdrawal Amount</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.rupeeSymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              value={amount}
              onChangeText={(text) => {
                setError(null);
                setAmount(text.replace(/\D/g, ""));
              }}
              autoFocus
            />
          </View>

          {/* Quick Preset Buttons */}
          <View style={styles.chipsRow}>
            {[500, 1000, 2000].map((preset) => (
              <TouchableOpacity
                key={preset}
                onPress={() => handleQuickAmount(preset)}
                disabled={preset > balance}
                style={[
                  styles.chip,
                  preset > balance && styles.chipDisabled,
                  numAmount === preset && styles.chipActive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    numAmount === preset && styles.chipTextActive,
                  ]}
                >
                  ₹{preset}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => handleQuickAmount(Math.floor(balance))}
              disabled={balance <= 0}
              style={[
                styles.chip,
                numAmount === Math.floor(balance) && styles.chipActive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  numAmount === Math.floor(balance) && styles.chipTextActive,
                ]}
              >
                Full (₹{Math.floor(balance)})
              </Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>

        {/* Transfer Destination Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payout Destination</Text>
          <View style={styles.destRow}>
            <View style={styles.destIcon}>
              <Ionicons name="card" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.destText}>
              <Text style={styles.destAccountName}>{partnerDoc?.name || "Partner Account"}</Text>
              <Text style={styles.destSub}>
                Verified Mobile UPI: +91 {partnerDoc?.phone || "Registered"}
              </Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>
        </View>

        <Button
          title={`Confirm Withdrawal · ₹${numAmount || 0}`}
          onPress={handleSubmit}
          loading={loading}
          disabled={!isValid}
          size="lg"
          style={styles.submitBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  balanceBox: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  balanceLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  balanceAmount: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
    fontSize: 28,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.md,
  },
  rupeeSymbol: {
    ...TYPOGRAPHY.h1,
    fontSize: 32,
    color: COLORS.primary,
    marginRight: 6,
  },
  amountInput: {
    fontSize: 36,
    fontWeight: "800",
    color: COLORS.text,
    minWidth: 120,
    textAlign: "center",
  },
  chipsRow: {
    flexDirection: "row",
    gap: SPACING.xs,
    justifyContent: "space-between",
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  chipText: {
    ...TYPOGRAPHY.small,
    fontSize: 11,
    color: COLORS.text,
    fontWeight: "600",
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.dangerLight,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
    gap: 6,
  },
  errorText: {
    ...TYPOGRAPHY.small,
    color: COLORS.dangerDark,
    fontWeight: "600",
    flex: 1,
  },
  destRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  destIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
  },
  destText: {
    flex: 1,
  },
  destAccountName: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.text,
  },
  destSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.successLight,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
    gap: 3,
  },
  verifiedText: {
    ...TYPOGRAPHY.small,
    fontSize: 10,
    color: COLORS.successDark,
    fontWeight: "700",
  },
  submitBtn: {
    marginTop: SPACING.md,
  },
});
