import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../config/theme";

interface DocumentUploaderProps {
  label: string;
  description?: string;
  value?: string;
  required?: boolean;
  onUpload: (uri: string) => void;
  onRemove?: () => void;
  aspect?: [number, number];
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  label,
  description,
  value,
  required = true,
  onUpload,
  onRemove,
  aspect = [4, 3],
}) => {
  const [loading, setLoading] = useState(false);

  const pickImage = async (useCamera = false) => {
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Camera permission is required to capture documents.");
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Gallery permission is required to upload documents.");
          return;
        }
      }

      setLoading(true);
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect,
            quality: 0.7,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect,
            quality: 0.7,
            base64: true,
          });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // If base64 is available, build data URL for instant cross-device storage and preview
        const uri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        onUpload(uri);
      }
    } catch (err: any) {
      Alert.alert("Upload Error", err?.message || "Could not select document.");
    } finally {
      setLoading(false);
    }
  };

  const handlePress = () => {
    Alert.alert("Upload Document", `Choose source for ${label}:`, [
      { text: "Take Photo", onPress: () => pickImage(true) },
      { text: "Choose from Gallery", onPress: () => pickImage(false) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>
          {label} {required ? <Text style={styles.required}>*</Text> : null}
        </Text>
        {value ? (
          <View style={styles.badgeSuccess}>
            <Ionicons name="checkmark-circle" size={13} color={COLORS.success} />
            <Text style={styles.badgeText}>Uploaded</Text>
          </View>
        ) : required ? (
          <View style={styles.badgePending}>
            <Text style={styles.badgePendingText}>Required</Text>
          </View>
        ) : null}
      </View>

      {description ? <Text style={styles.desc}>{description}</Text> : null}

      {value ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: value }} style={styles.previewImage} resizeMode="contain" />
          <View style={styles.previewActions}>
            <TouchableOpacity onPress={handlePress} style={styles.actionBtn}>
              <Ionicons name="camera-reverse-outline" size={15} color={COLORS.primary} />
              <Text style={styles.actionBtnText}>Change</Text>
            </TouchableOpacity>
            {onRemove ? (
              <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
                <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={handlePress}
          disabled={loading}
          style={styles.uploadBox}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <View style={styles.uploadIconCircle}>
                <Ionicons name="cloud-upload-outline" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.uploadPrompt}>Tap to capture or upload</Text>
              <Text style={styles.uploadSubPrompt}>JPEG, PNG up to 10MB</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xs,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    ...TYPOGRAPHY.caption,
    fontWeight: "700",
    color: COLORS.text,
  },
  required: {
    color: COLORS.danger,
    fontWeight: "800",
  },
  badgeSuccess: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: `${COLORS.success}15`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    ...TYPOGRAPHY.small,
    fontWeight: "700",
    color: COLORS.success,
  },
  badgePending: {
    backgroundColor: `${COLORS.warning}15`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  badgePendingText: {
    ...TYPOGRAPHY.small,
    fontWeight: "700",
    color: COLORS.warning,
  },
  desc: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: SPACING.xs,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
    marginTop: 4,
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${COLORS.primary}12`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  uploadPrompt: {
    ...TYPOGRAPHY.body,
    fontWeight: "700",
    color: COLORS.primary,
  },
  uploadSubPrompt: {
    ...TYPOGRAPHY.small,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  previewContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.card,
    overflow: "hidden",
    marginTop: 4,
  },
  previewImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#111",
  },
  previewActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    padding: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionBtnText: {
    ...TYPOGRAPHY.small,
    fontWeight: "700",
    color: COLORS.primary,
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  removeBtnText: {
    ...TYPOGRAPHY.small,
    fontWeight: "700",
    color: COLORS.danger,
  },
});
