import { Camera } from "lucide-react-native";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from "react-native";
import { colors, overlay, radius, typography } from "@safestop/ui";

import { EVIDENCE_TILE_SIZE } from "../constants";
import { getQueueStatusLabel } from "../utils/evidence-labels";
import type { EvidenceUploadQueueItem } from "../types";

const ADD_ICON_SIZE = 20;

type EvidenceAddTileProps = {
  onPress: () => void;
  disabled?: boolean;
};

export function EvidenceAddTile({ onPress, disabled }: EvidenceAddTileProps) {
  return (
    <Pressable
      accessibilityLabel="Adicionar evidência"
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled ?? false }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.tile,
        styles.addTile,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
      onPress={onPress}
    >
      <Camera
        accessible={false}
        color={colors.foregroundMuted}
        size={ADD_ICON_SIZE}
        strokeWidth={2}
      />
      <Text style={styles.addLabel}>Adicionar</Text>
    </Pressable>
  );
}

type EvidenceQueueTileProps = {
  item: EvidenceUploadQueueItem;
  index: number;
  onPress?: () => void;
  onRetry?: () => void;
};

export function EvidenceQueueTile({ item, index, onPress, onRetry }: EvidenceQueueTileProps) {
  const isFailed = item.status === "failed";
  const isProcessing = !isFailed && item.status !== "queued";
  const statusLabel = getQueueStatusLabel(item.status, item.progress);

  return (
    <Pressable
      accessibilityLabel={`Evidência ${index + 1}, ${statusLabel}`}
      accessibilityRole="button"
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
      onPress={() => {
        if (isFailed && onRetry) {
          onRetry();
          return;
        }

        onPress?.();
      }}
    >
      <Image source={{ uri: item.previewUri }} style={styles.image} />

      {isProcessing ? (
        <View style={styles.overlay}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={styles.overlayText}>{statusLabel}</Text>
        </View>
      ) : null}

      {isFailed ? (
        <View style={styles.overlay}>
          <Text style={styles.failedIcon}>✕</Text>
          <Text style={styles.failedText}>Falha no envio</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

type EvidenceSyncedTileProps = {
  index: number;
  imageSource: ImageSourcePropType;
  isLoading?: boolean;
  hasError?: boolean;
  onPress: () => void;
  onRetry?: () => void;
};

export function EvidenceSyncedTile({
  index,
  imageSource,
  isLoading,
  hasError,
  onPress,
  onRetry,
}: EvidenceSyncedTileProps) {
  const label = hasError ? "Erro ao carregar" : `Evidência ${index + 1}, sincronizada`;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
      onPress={() => {
        if (hasError && onRetry) {
          onRetry();
          return;
        }

        onPress();
      }}
    >
      {isLoading ? (
        <View style={styles.placeholder}>
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      ) : hasError ? (
        <View style={styles.placeholder}>
          <Text style={styles.failedIcon}>!</Text>
          <Text style={styles.placeholderText}>Erro</Text>
        </View>
      ) : (
        <Image source={imageSource} style={styles.image} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  addLabel: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    marginTop: 4,
  },
  addTile: {
    alignItems: "center",
    borderColor: colors.border,
    borderStyle: "dashed",
    borderWidth: 1,
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  failedIcon: {
    color: colors.destructive,
    fontSize: 18,
    fontWeight: "700",
  },
  failedText: {
    color: colors.destructive,
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    backgroundColor: overlay.scrim,
    justifyContent: "center",
    padding: 4,
  },
  overlayText: {
    color: colors.foreground,
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  placeholder: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    flex: 1,
    justifyContent: "center",
  },
  placeholderText: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    marginTop: 4,
  },
  pressed: {
    opacity: 0.85,
  },
  tile: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    height: EVIDENCE_TILE_SIZE,
    overflow: "hidden",
    width: EVIDENCE_TILE_SIZE,
  },
});
