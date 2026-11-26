import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../config/theme";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "cube-outline",
  title,
  subtitle,
  actionTitle,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={36} color={COLORS.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="outline"
          size="sm"
          style={styles.actionBtn}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xxl,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    textAlign: "center",
    color: COLORS.textSecondary,
    lineHeight: 18,
    maxWidth: 280,
  },
  actionBtn: {
    marginTop: SPACING.lg,
  },
});
