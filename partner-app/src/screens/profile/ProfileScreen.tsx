import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../config/theme";
import { Header } from "../../components/common/Header";
import { Badge } from "../../components/common/Badge";
import { APP_INFO } from "../../config/env";

export const ProfileScreen = ({ navigation }: any) => {
  const { partnerDoc, verificationStatus, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Confirm Sign Out",
      "Are you sure you want to sign out of your Repair Series Partner account? You will be switched to Offline.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await logout();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Partner Profile" subtitle="Account & Verification" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            {partnerDoc?.profileImage || partnerDoc?.avatar ? (
              <Image
                source={{ uri: partnerDoc.profileImage || partnerDoc.avatar }}
                style={styles.avatarImg}
              />
            ) : (
              <Ionicons name="person" size={32} color={COLORS.primary} />
            )}
          </View>

          <Text style={styles.partnerName}>{partnerDoc?.name || "Service Partner"}</Text>
          <Text style={styles.partnerPhone}>+91 {partnerDoc?.phone || "Registered"}</Text>

          <View style={styles.badgeRow}>
            <Badge
              label={String(verificationStatus).toUpperCase()}
              tone={
                verificationStatus === "active"
                  ? "success"
                  : verificationStatus === "pending"
                    ? "warning"
                    : "danger"
              }
              dot
            />
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.ratingText}>
                {Number(partnerDoc?.rating || 4.9).toFixed(1)} ({partnerDoc?.ratingCount || 18} jobs)
              </Text>
            </View>
          </View>
        </View>

        {/* Trade & Skills Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Trade & Qualifications</Text>

          <View style={styles.infoRow}>
            <Ionicons name="construct-outline" size={18} color={COLORS.primary} />
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoKey}>Primary Category</Text>
              <Text style={styles.infoVal}>
                {partnerDoc?.skills || partnerDoc?.categoryId || "Appliance & Home Repair"}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={COLORS.primary} />
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoKey}>Operating City & Base Zone</Text>
              <Text style={styles.infoVal}>
                {partnerDoc?.city || "Gurugram"} ({partnerDoc?.areaAddress || "Base Area"})
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="navigate-circle-outline" size={18} color={COLORS.primary} />
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoKey}>Service Radius</Text>
              <Text style={styles.infoVal}>
                {partnerDoc?.serviceRadius || 10} km from base location
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Navigation */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Support & Policies</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate("PartnerSupport")}
            style={styles.menuItem}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="headset-outline" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.menuText}>Help & Operations Support</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Earnings")}
            style={styles.menuItem}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: COLORS.successLight }]}>
              <Ionicons name="wallet-outline" size={18} color={COLORS.success} />
            </View>
            <Text style={styles.menuText}>Wallet & Payout Settings</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <View style={[styles.menuIconCircle, { backgroundColor: COLORS.backgroundSecondary }]}>
              <Ionicons name="document-text-outline" size={18} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.menuText}>Partner Code of Conduct</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Sign Out Account</Text>
        </TouchableOpacity>

        {/* App Version Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>
            Repair Series Partner App · Version {APP_INFO.version}
          </Text>
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
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  partnerName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  partnerPhone: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
    gap: 3,
  },
  ratingText: {
    ...TYPOGRAPHY.small,
    fontSize: 11,
    color: "#B45309",
    fontWeight: "700",
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.md,
  },
  infoTextWrapper: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  infoKey: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  infoVal: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.text,
    fontSize: 13,
    marginTop: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  menuText: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.dangerLight,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: "#FECDD3",
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  logoutText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.danger,
    fontSize: 14,
  },
  appInfo: {
    marginTop: SPACING.xl,
    alignItems: "center",
  },
  appInfoText: {
    ...TYPOGRAPHY.small,
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
