import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../config/theme";
import { Button } from "../common/Button";

interface OtpInputModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (otp: string) => Promise<void>;
  loading?: boolean;
  serviceTitle?: string;
  errorMessage?: string | null;
}

export const OtpInputModal: React.FC<OtpInputModalProps> = ({
  visible,
  onClose,
  onSubmit,
  loading = false,
  serviceTitle = "Service",
  errorMessage,
}) => {
  const [otp, setOtp] = useState("");

  const handleVerify = () => {
    if (otp.length < 4) return;
    onSubmit(otp);
  };

  const handleClose = () => {
    setOtp("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="key-outline" size={24} color={COLORS.primary} />
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Customer Service OTP</Text>
          <Text style={styles.subtitle}>
            Ask the customer for the 4-digit verification OTP shown on their screen for{" "}
            <Text style={{ fontWeight: "700", color: COLORS.text }}>{serviceTitle}</Text>.
          </Text>

          {/* OTP Input Box */}
          <View style={styles.inputContainer}>
            <TextInput
              value={otp}
              onChangeText={(text) => setOtp(text.replace(/\D/g, "").slice(0, 4))}
              keyboardType="number-pad"
              placeholder="••••"
              placeholderTextColor={COLORS.textMuted}
              maxLength={4}
              style={styles.textInput}
              autoFocus
            />
          </View>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            <Button
              title="Cancel"
              onPress={handleClose}
              variant="outline"
              size="md"
              style={{ flex: 1 }}
            />
            <Button
              title="Verify & Start"
              onPress={handleVerify}
              variant="primary"
              size="md"
              loading={loading}
              disabled={otp.length < 4}
              style={{ flex: 1.5 }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.lg,
  },
  container: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  inputContainer: {
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  textInput: {
    width: 200,
    height: 56,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.backgroundSecondary,
    textAlign: "center",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 12,
    color: COLORS.text,
  },
  errorBanner: {
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
    flex: 1,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: SPACING.md,
  },
});
