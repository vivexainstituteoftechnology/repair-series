import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, TYPOGRAPHY } from "../../config/theme";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.leftContainer}>
        {showBack && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {rightAction ? (
        <View style={styles.rightContainer}>{rightAction}</View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  leftContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
    borderRadius: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.h2,
    fontSize: 18,
    color: COLORS.text,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
    color: COLORS.textSecondary,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: SPACING.sm,
  },
});
