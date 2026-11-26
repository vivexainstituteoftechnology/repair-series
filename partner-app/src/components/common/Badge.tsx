import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { COLORS, RADIUS } from "../../config/theme";

interface BadgeProps {
  label: string;
  tone?: "primary" | "success" | "warning" | "danger" | "info" | "neutral";
  size?: "sm" | "md";
  dot?: boolean;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  tone = "neutral",
  size = "md",
  dot = false,
  style,
}) => {
  const getToneStyles = (): { bg: string; text: string; dot: string } => {
    switch (tone) {
      case "primary":
        return {
          bg: COLORS.primaryLight,
          text: COLORS.primary,
          dot: COLORS.primary,
        };
      case "success":
        return {
          bg: COLORS.successLight,
          text: COLORS.successDark,
          dot: COLORS.success,
        };
      case "warning":
        return {
          bg: COLORS.warningLight,
          text: COLORS.warningDark,
          dot: COLORS.warning,
        };
      case "danger":
        return {
          bg: COLORS.dangerLight,
          text: COLORS.dangerDark,
          dot: COLORS.danger,
        };
      case "info":
        return {
          bg: COLORS.infoLight,
          text: COLORS.info,
          dot: COLORS.info,
        };
      case "neutral":
      default:
        return {
          bg: COLORS.backgroundSecondary,
          text: COLORS.textSecondary,
          dot: COLORS.textMuted,
        };
    }
  };

  const tones = getToneStyles();
  const isSm = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: tones.bg },
        isSm ? styles.smBadge : styles.mdBadge,
        style,
      ]}
    >
      {dot && (
        <View
          style={[
            styles.dot,
            { backgroundColor: tones.dot },
            isSm ? { width: 5, height: 5 } : null,
          ]}
        />
      )}
      <Text
        style={[
          styles.text,
          { color: tones.text },
          isSm ? styles.smText : styles.mdText,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.full,
    alignSelf: "flex-start",
  },
  smBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  mdBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  text: {
    fontWeight: "700",
  },
  smText: {
    fontSize: 10,
  },
  mdText: {
    fontSize: 12,
  },
});
