import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { COLORS, RADIUS, SPACING } from "../../config/theme";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "elevated" | "outlined" | "accent";
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = "default",
}) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case "elevated":
        return styles.elevated;
      case "outlined":
        return styles.outlined;
      case "accent":
        return styles.accent;
      case "default":
      default:
        return styles.defaultCard;
    }
  };

  return <View style={[styles.base, getVariantStyle(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
  },
  defaultCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  elevated: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: COLORS.shadowMedium,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  outlined: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  accent: {
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    backgroundColor: COLORS.primaryLight,
  },
});
