import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../config/theme";
import { Button } from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import { APP_INFO } from "../../config/env";

export const PendingApprovalScreen = ({ navigation }: any) => {
  const { partnerDoc, verificationStatus, refreshPartnerDoc, logout } = useAuth();
  const [checking, setChecking] = useState(false);

  const kycStatus = String(partnerDoc?.kyc?.status || verificationStatus || "pending").toLowerCase();
  const isRejected = kycStatus === "rejected" || verificationStatus === "rejected";
  const isSuspended = verificationStatus === "suspended" || partnerDoc?.suspended === true;
  const isIncomplete = kycStatus === "incomplete";
  const isUnderReview = kycStatus === "under_review";
  const isPending = !isRejected && !isSuspended && !isIncomplete;

  const handleRefresh = async () => {
    setChecking(true);
    refreshPartnerDoc();
    setTimeout(() => setChecking(false), 800);
  };

  const handleSupport = () => {
    const text = encodeURIComponent(
      `Hello Repair Series Support, I am checking my Partner account status. Partner ID: ${partnerDoc?.id || ""} Mobile: ${partnerDoc?.phone || ""}`,
    );
    Linking.openURL(`https://wa.me/${APP_INFO.supportWhatsApp}?text=${text}`);
  };

  const handleCorrectKyc = () => {
    if (navigation && navigation.navigate) {
      navigation.navigate("Register");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View
          style={[
            styles.iconCircle,
            isPending && { backgroundColor: `${COLORS.warning}18` },
            isUnderReview && { backgroundColor: `${COLORS.primary}18` },
            (isSuspended || isRejected) && { backgroundColor: `${COLORS.danger}18` },
            isIncomplete && { backgroundColor: `${COLORS.warning}18` },
          ]}
        >
          <Ionicons
            name={
              isPending
                ? "time-outline"
                : isUnderReview
                  ? "search-outline"
                  : isSuspended
                    ? "pause-circle-outline"
                    : isRejected
                      ? "close-circle-outline"
                      : "document-text-outline"
            }
            size={48}
            color={
              isPending
                ? COLORS.warning
                : isUnderReview
                  ? COLORS.primary
                  : isSuspended || isRejected
                    ? COLORS.danger
                    : COLORS.warning
            }
          />
        </View>

        <Text style={styles.title}>
          {isRejected
            ? "KYC Verification Rejected"
            : isSuspended
              ? "Account Temporarily Suspended"
              : isIncomplete
                ? "Mandatory KYC Incomplete"
                : isUnderReview
                  ? "KYC Documents Under Review"
                  : "Application Pending Verification"}
        </Text>

        <Text style={styles.subtitle}>
          {isRejected
            ? "Your KYC documents were reviewed by our operations team and require correction before approval."
            : isSuspended
              ? "Your partner account has been temporarily suspended. Please connect with operations support."
              : isIncomplete
                ? "Please submit all mandatory personal, identity, address and bank documents to complete your onboarding."
                : isUnderReview
                  ? "An operations executive is actively auditing your identity and trade credentials."
                  : "Your KYC onboarding application has been submitted and queued for verification."}
        </Text>

        {/* Rejection Remarks Banner */}
        {isRejected && (partnerDoc?.rejectionReason || partnerDoc?.kyc?.rejectionReason) ? (
          <View style={styles.rejectionBox}>
            <View style={styles.rejectionHeader}>
              <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
              <Text style={styles.rejectionTitle}>Admin Review Remarks:</Text>
            </View>
            <Text style={styles.rejectionReason}>
              {partnerDoc?.rejectionReason || partnerDoc?.kyc?.rejectionReason}
            </Text>
          </View>
        ) : null}

        {/* Verification Progress Steps */}
        <View style={styles.timelineBox}>
          <View style={styles.timelineRow}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            <Text style={styles.timelineTextDone}>Mobile Verified & Profile Created</Text>
          </View>
          <View style={styles.timelineDivider} />
          <View style={styles.timelineRow}>
            <Ionicons
              name={
                isRejected
                  ? "close-circle"
                  : isIncomplete
                    ? "ellipse-outline"
                    : "checkmark-circle"
              }
              size={18}
              color={
                isRejected
                  ? COLORS.danger
                  : isIncomplete
                    ? COLORS.textTertiary
                    : COLORS.success
              }
            />
            <Text
              style={[
                styles.timelineText,
                isRejected && { color: COLORS.danger },
                !isIncomplete && { fontWeight: "700" },
              ]}
            >
              {isRejected
                ? "KYC Documents Need Correction"
                : isIncomplete
                  ? "Mandatory KYC Submission"
                  : "KYC Documents Submitted"}
            </Text>
          </View>
          <View style={styles.timelineDivider} />
          <View style={styles.timelineRow}>
            <Ionicons
              name="time-outline"
              size={18}
              color={isUnderReview ? COLORS.primary : COLORS.textTertiary}
            />
            <Text
              style={[
                styles.timelineText,
                isUnderReview && { color: COLORS.primary, fontWeight: "700" },
              ]}
            >
              Admin Audit & Background Verification
            </Text>
          </View>
        </View>

        {/* Profile Snapshot Box */}
        {partnerDoc && (
          <View style={styles.snapshotBox}>
            <View style={styles.snapshotRow}>
              <Text style={styles.snapshotKey}>Partner Name:</Text>
              <Text style={styles.snapshotVal}>{partnerDoc.name}</Text>
            </View>
            <View style={styles.snapshotRow}>
              <Text style={styles.snapshotKey}>Mobile Number:</Text>
              <Text style={styles.snapshotVal}>{partnerDoc.phone}</Text>
            </View>
            <View style={styles.snapshotRow}>
              <Text style={styles.snapshotKey}>City & Zone:</Text>
              <Text style={styles.snapshotVal}>{partnerDoc.city || "Gurugram"}</Text>
            </View>
            <View style={styles.snapshotRow}>
              <Text style={styles.snapshotKey}>KYC Status:</Text>
              <Text
                style={[
                  styles.snapshotVal,
                  {
                    color: isRejected
                      ? COLORS.danger
                      : isUnderReview
                        ? COLORS.primary
                        : COLORS.warning,
                    fontWeight: "800",
                  },
                ]}
              >
                {kycStatus.replace(/_/g, " ").toUpperCase()}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.actionContainer}>
          {isRejected || isIncomplete ? (
            <Button
              title="Correct & Resubmit KYC"
              onPress={handleCorrectKyc}
              variant="primary"
              size="lg"
              icon={<Ionicons name="create-outline" size={18} color="#fff" />}
              style={styles.btn}
            />
          ) : null}

          <Button
            title="Check Approval Status"
            onPress={handleRefresh}
            loading={checking}
            variant={isRejected || isIncomplete ? "outline" : "primary"}
            size="md"
            style={styles.btn}
          />

          <Button
            title="Chat with Support on WhatsApp"
            onPress={handleSupport}
            variant="outline"
            size="md"
            icon={<Ionicons name="logo-whatsapp" size={18} color={COLORS.primary} />}
            style={styles.btn}
          />

          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sign Out & Switch Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    textAlign: "center",
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  rejectionBox: {
    width: "100%",
    backgroundColor: `${COLORS.danger}10`,
    borderWidth: 1,
    borderColor: `${COLORS.danger}35`,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  rejectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  rejectionTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: "800",
    color: COLORS.danger,
  },
  rejectionReason: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
    lineHeight: 18,
  },
  timelineBox: {
    width: "100%",
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timelineDivider: {
    width: 2,
    height: 14,
    backgroundColor: COLORS.border,
    marginLeft: 8,
    marginVertical: 2,
  },
  timelineTextDone: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
    fontWeight: "600",
  },
  timelineText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  snapshotBox: {
    width: "100%",
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: 6,
  },
  snapshotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  snapshotKey: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  snapshotVal: {
    ...TYPOGRAPHY.small,
    fontWeight: "700",
    color: COLORS.text,
  },
  actionContainer: {
    width: "100%",
    gap: 10,
  },
  btn: {
    width: "100%",
  },
  logoutBtn: {
    paddingVertical: SPACING.sm,
    alignItems: "center",
  },
  logoutText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textTertiary,
    fontWeight: "600",
  },
});
