import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useWallet } from "../../context/WalletContext";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../config/theme";
import { Header } from "../../components/common/Header";
import { Button } from "../../components/common/Button";

export const CashSettlementScreen = ({ navigation }: any) => {
  const { wallet, submitSettlementProof } = useWallet();
  const settlement = wallet.todaySettlement;

  const duePaise = Number(settlement?.netRemittanceDuePaise || settlement?.companySharePaise || 0);
  const dueRupees = duePaise / 100;

  const [paymentRef, setPaymentRef] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!paymentRef.trim()) {
      setError("Please enter the UPI transaction ID or Bank Reference number.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await submitSettlementProof({
        amountPaise: duePaise > 0 ? duePaise : 10000,
        paymentReference: paymentRef.trim(),
        proofUrl: proofUrl.trim() || undefined,
      });

      if (res.success) {
        Alert.alert(
          "Remittance Submitted",
          "Your cash settlement proof has been submitted. The accounts team will verify and clear your obligations.",
          [{ text: "OK", onPress: () => navigation.goBack() }],
        );
      } else {
        setError(res.error || "Could not submit remittance proof.");
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
        title="Cash Remittance Settlement"
        subtitle="Settle Collected Customer Cash"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>TODAY'S COMPANY REMITTANCE DUE</Text>
          <Text style={styles.summaryAmount}>₹{dueRupees.toFixed(2)}</Text>
          <Text style={styles.summarySub}>
            Includes company platform fee & commission from collected cash jobs.
          </Text>
        </View>

        {/* Company Bank UPI Transfer Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Company Bank & UPI QR</Text>
          <View style={styles.bankDetailRow}>
            <Text style={styles.bankKey}>UPI ID:</Text>
            <Text style={styles.bankVal}>repairseries@icici</Text>
          </View>
          <View style={styles.bankDetailRow}>
            <Text style={styles.bankKey}>Account Name:</Text>
            <Text style={styles.bankVal}>Repair Series Private Limited</Text>
          </View>
          <View style={styles.bankDetailRow}>
            <Text style={styles.bankKey}>Bank Name:</Text>
            <Text style={styles.bankVal}>ICICI Bank, Cyber City Gurugram</Text>
          </View>
        </View>

        {/* Submission Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Submit Remittance Details</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>
              UPI UTR / Bank Reference Number <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 421389028192"
              placeholderTextColor={COLORS.textMuted}
              value={paymentRef}
              onChangeText={(text) => {
                setError(null);
                setPaymentRef(text);
              }}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Receipt Screenshot URL (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              value={proofUrl}
              onChangeText={setProofUrl}
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button
            title="Submit Remittance Proof"
            onPress={handleSubmit}
            loading={loading}
            size="lg"
            style={styles.submitBtn}
          />
        </View>
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
  summaryCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
  },
  summaryLabel: {
    ...TYPOGRAPHY.small,
    fontSize: 10,
    color: "#FECDD3",
    fontWeight: "800",
    letterSpacing: 1,
  },
  summaryAmount: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textInverse,
    fontSize: 32,
    marginTop: 4,
  },
  summarySub: {
    ...TYPOGRAPHY.caption,
    color: "#FFE4E6",
    marginTop: 4,
    lineHeight: 18,
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
  bankDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  bankKey: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  bankVal: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 13,
    color: COLORS.text,
  },
  fieldGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    ...TYPOGRAPHY.small,
    fontSize: 12,
    color: COLORS.text,
    fontWeight: "700",
    marginBottom: 6,
  },
  required: {
    color: COLORS.danger,
  },
  input: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.dangerLight,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    gap: 6,
  },
  errorText: {
    ...TYPOGRAPHY.small,
    color: COLORS.dangerDark,
    fontWeight: "600",
    flex: 1,
  },
  submitBtn: {
    marginTop: SPACING.sm,
  },
});
