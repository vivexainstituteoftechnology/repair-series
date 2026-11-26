import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native";
import { COLORS, RADIUS, SPACING } from "../../config/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger" | "success" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const getVariantStyles = (): { button: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case "secondary":
        return {
          button: { backgroundColor: COLORS.secondary },
          text: { color: COLORS.textInverse },
        };
      case "outline":
        return {
          button: {
            backgroundColor: "transparent",
            borderWidth: 1.5,
            borderColor: COLORS.primary,
          },
          text: { color: COLORS.primary },
        };
      case "danger":
        return {
          button: { backgroundColor: COLORS.danger },
          text: { color: COLORS.textInverse },
        };
      case "success":
        return {
          button: { backgroundColor: COLORS.success },
          text: { color: COLORS.textInverse },
        };
      case "ghost":
        return {
          button: { backgroundColor: "transparent" },
          text: { color: COLORS.primary },
        };
      case "primary":
      default:
        return {
          button: { backgroundColor: COLORS.primary },
          text: { color: COLORS.textInverse },
        };
    }
  };

  const getSizeStyles = (): { button: ViewStyle; text: TextStyle } => {
    switch (size) {
      case "sm":
        return {
          button: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: RADIUS.md },
          text: { fontSize: 13, fontWeight: "600" },
        };
      case "lg":
        return {
          button: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: RADIUS.lg },
          text: { fontSize: 16, fontWeight: "700" },
        };
      case "md":
      default:
        return {
          button: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: RADIUS.md },
          text: { fontSize: 14, fontWeight: "600" },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        variantStyles.button,
        sizeStyles.button,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" ? COLORS.primary : COLORS.textInverse}
        />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text
            style={[
              styles.textBase,
              variantStyles.text,
              sizeStyles.text,
              icon ? { marginLeft: 8 } : null,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  textBase: {
    textAlign: "center",
  },
  disabled: {
    opacity: 0.55,
  },
});
