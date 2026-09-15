import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors as uiColors } from "@safestop/ui";

const colors = {
  surface: "#1F2937",
  border: "#374151",
  foreground: "#F9FAFB",
  foregroundMuted: "#9CA3AF",
  primary: uiColors.primary,
  destructive: "#F87171",
};

export function TimelineLoading() {
  return (
    <View accessibilityLabel="Carregando linha do tempo" style={styles.loading}>
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index} style={styles.skeletonRow}>
          <View style={styles.skeletonRail} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonMeta} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function TimelineEmpty() {
  return (
    <Text accessibilityRole="text" style={styles.empty}>
      Nenhum evento na linha do tempo ainda.
    </Text>
  );
}

type TimelineErrorProps = {
  onRetry: () => void;
};

export function TimelineError({ onRetry }: TimelineErrorProps) {
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorTitle}>Não foi possível carregar a linha do tempo.</Text>
      <Text style={styles.errorBody}>Verifique sua conexão e tente novamente.</Text>
      <Pressable
        accessibilityLabel="Tentar novamente"
        accessibilityRole="button"
        style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
        onPress={onRetry}
      >
        <Text style={styles.retryText}>Tentar novamente</Text>
      </Pressable>
    </View>
  );
}

type TimelineLoadMoreProps = {
  hasNextPage: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  errorMessage?: string | null;
};

export function TimelineLoadMore({
  hasNextPage,
  isLoading,
  onLoadMore,
  errorMessage,
}: TimelineLoadMoreProps) {
  if (!hasNextPage) {
    return null;
  }

  return (
    <View style={styles.loadMoreBox}>
      {errorMessage ? <Text style={styles.loadMoreError}>{errorMessage}</Text> : null}
      <Pressable
        accessibilityLabel="Carregar mais"
        accessibilityRole="button"
        accessibilityState={{ busy: isLoading, disabled: isLoading }}
        disabled={isLoading}
        style={({ pressed }) => [styles.loadMoreButton, pressed && !isLoading && styles.pressed]}
        onPress={onLoadMore}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <Text style={styles.loadMoreText}>Carregar mais</Text>
        )}
      </Pressable>
    </View>
  );
}

export function TimelineSectionTitle() {
  return <Text style={styles.sectionTitle}>Linha do tempo</Text>;
}

export function TimelineOfflineBanner() {
  return (
    <View style={styles.offlineBanner}>
      <Text style={styles.offlineTitle}>Você está offline.</Text>
      <Text style={styles.offlineBody}>A timeline pode estar desatualizada.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    color: colors.foregroundMuted,
    fontSize: 14,
    paddingVertical: 8,
  },
  errorBody: {
    color: colors.foregroundMuted,
    fontSize: 14,
  },
  errorBox: {
    gap: 8,
    paddingVertical: 8,
  },
  errorTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "600",
  },
  loadMoreBox: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  loadMoreButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 160,
    paddingHorizontal: 16,
  },
  loadMoreError: {
    color: colors.destructive,
    fontSize: 13,
    textAlign: "center",
  },
  loadMoreText: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "600",
  },
  loading: {
    gap: 12,
    paddingVertical: 8,
  },
  offlineBanner: {
    backgroundColor: "#450A0A",
    borderRadius: 12,
    gap: 4,
    marginBottom: 8,
    padding: 12,
  },
  offlineBody: {
    color: colors.foregroundMuted,
    fontSize: 13,
  },
  offlineTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.85,
  },
  retryButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  sectionTitle: {
    borderTopColor: "#1F2937",
    borderTopWidth: 1,
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8,
    paddingTop: 12,
    textTransform: "uppercase",
  },
  skeletonContent: {
    flex: 1,
    gap: 8,
  },
  skeletonMeta: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    height: 12,
    width: "40%",
  },
  skeletonRail: {
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 12,
    marginTop: 4,
    width: 12,
  },
  skeletonRow: {
    flexDirection: "row",
    gap: 12,
  },
  skeletonTitle: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    height: 16,
    width: "70%",
  },
});
