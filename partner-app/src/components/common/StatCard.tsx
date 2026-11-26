import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../config/theme";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBg = COLORS.primaryLight,
  style,
}) => {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
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
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  content: {
    flexDirection: "column",
  },
  title: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginBottom: 2,
    fontWeight: "600",
  },
  value: {
    ...TYPOGRAPHY.h2,
    fontSize: 19,
    color: COLORS.text,
  },
  subtitle: {
    ...TYPOGRAPHY.small,
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
