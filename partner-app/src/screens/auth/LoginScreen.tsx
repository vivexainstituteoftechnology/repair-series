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
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../config/theme";
import { Button } from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import { APP_INFO } from "../../config/env";

export const LoginScreen = ({ navigation }: any) => {
  const { devLoginWithPhone, authError } = useAuth();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanPhone = phone.replace(/\D/g, "");
  const isValid = cleanPhone.length === 10;

  const handleContinue = async () => {
    if (!isValid) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Fast partner sign in / lookup
      const success = await devLoginWithPhone(cleanPhone);
      if (!success) {
        // If no existing record found, suggest registration
        Alert.alert(
          "Partner Not Found",
          `No partner account exists for +91 ${cleanPhone}. Would you like to register as a new Repair Series partner?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Register Now",
              onPress: () =>
                navigation.navigate("Register", { initialPhone: cleanPhone }),
            },
          ],
        );
      }
    } catch (err: any) {
      setError(err?.message || "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Brand Banner */}
        <View style={styles.brandContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="construct" size={36} color={COLORS.primary} />
          </View>
          <Text style={styles.brandTitle}>
            Repair<Text style={{ color: COLORS.primary }}>Series</Text>
          </Text>
          <View style={styles.partnerBadge}>
            <Text style={styles.partnerBadgeText}>PARTNER APP</Text>
          </View>
          <Text style={styles.brandSubtitle}>
            Doorstep appliance repair & home service partner portal
          </Text>
        </View>

        {/* Login Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Partner Sign In</Text>
          <Text style={styles.cardSubtext}>
            Enter your registered 10-digit mobile number to access your jobs,
            earnings, and dashboard.
          </Text>

          {/* Mobile Input Field */}
          <View style={styles.inputWrapper}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="98765 43210"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={(text) => {
                setError(null);
                setPhone(text.replace(/\D/g, ""));
              }}
              autoFocus
            />
          </View>

          {error || authError ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
              <Text style={styles.errorText}>{error || authError}</Text>
            </View>
          ) : null}

          <Button
            title="Continue to Partner Portal"
            onPress={handleContinue}
            loading={loading}
            disabled={!isValid}
            size="lg"
            style={styles.submitBtn}
          />

          <View style={styles.registerPrompt}>
            <Text style={styles.registerPromptText}>
              Want to join Repair Series as a service professional?
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate("Register")}
              style={styles.registerLink}
            >
              <Text style={styles.registerLinkText}>
                Register as a New Partner →
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Service coverage: {APP_INFO.operatingCities.join(" · ")}
          </Text>
          <Text style={styles.versionText}>Version {APP_INFO.version}</Text>
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
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
    justifyContent: "center",
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: SPACING.xxl,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  brandTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 28,
    color: COLORS.text,
  },
  partnerBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  partnerBadgeText: {
    ...TYPOGRAPHY.small,
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primaryDark,
    letterSpacing: 1,
  },
  brandSubtitle: {
    ...TYPOGRAPHY.caption,
    textAlign: "center",
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    maxWidth: 280,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeading: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: 4,
  },
  cardSubtext: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.backgroundSecondary,
    overflow: "hidden",
    marginBottom: SPACING.md,
  },
  countryCode: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  countryCodeText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.text,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: 1.5,
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
    marginTop: SPACING.xs,
  },
  registerPrompt: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    alignItems: "center",
  },
  registerPromptText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 6,
  },
  registerLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  registerLinkText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.primary,
    fontSize: 13,
  },
  footer: {
    marginTop: SPACING.xxl,
    alignItems: "center",
  },
  footerText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
  },
  versionText: {
    ...TYPOGRAPHY.small,
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
