import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRequirePermission } from "@/features/authorization/hooks/use-require-permission";
import { authRoutes } from "@/lib/auth/routes";

import { OccurrenceEmpty } from "./occurrence-empty";
import { OccurrenceError } from "./occurrence-error";
import { OccurrenceLoading } from "./occurrence-loading";
import { OccurrenceSyncStatusBadge } from "./occurrence-sync-status-badge";
import { useOccurrence } from "../hooks/use-occurrence";
import {
  formatOccurrenceDate,
  getOccurrenceSeverityLabel,
  getOccurrenceStatusLabel,
} from "../utils/occurrence-labels";

type OccurrenceDetailsScreenProps = {
  occurrenceId: string;
};

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

export function OccurrenceDetailsScreen({ occurrenceId }: OccurrenceDetailsScreenProps) {
  const router = useRouter();
  useRequirePermission("occurrence.read");

  const { occurrence, isLoading, isError, isNotFound, canRead } = useOccurrence(occurrenceId);

  if (!canRead) {
    return null;
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <OccurrenceLoading />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.container}>
        <OccurrenceError message="Não foi possível carregar a ocorrência." />
      </SafeAreaView>
    );
  }

  if (isNotFound || !occurrence) {
    return (
      <SafeAreaView style={styles.container}>
        <OccurrenceEmpty
          description="A ocorrência não existe ou você não possui acesso na organização ativa."
          title="Ocorrência não encontrada"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityLabel="Voltar para ocorrências"
          accessibilityRole="button"
          onPress={() => {
            router.replace(authRoutes.occurrences);
          }}
        >
          <Text style={styles.backLink}>Voltar</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.code}>{occurrence.publicCode}</Text>
          <OccurrenceSyncStatusBadge status="registered_on_server" />
        </View>

        <Text style={styles.title}>{occurrence.title}</Text>

        <Text style={styles.meta}>
          {getOccurrenceStatusLabel(occurrence.status)} ·{" "}
          {getOccurrenceSeverityLabel(occurrence.severity)}
        </Text>

        <DetailField label="Atividade" value={occurrence.taskDescription} />
        <DetailField label="Local" value={occurrence.locationDescription} />
        <DetailField label="Condição insegura" value={occurrence.conditionDescription} />

        {occurrence.immediateActionDescription ? (
          <DetailField label="Ação imediata" value={occurrence.immediateActionDescription} />
        ) : null}

        <DetailField label="Área" value={occurrence.areaName ?? "—"} />
        <DetailField label="Registrado em" value={formatOccurrenceDate(occurrence.createdAt)} />
        <DetailField label="Ocorrido em" value={formatOccurrenceDate(occurrence.occurredAt)} />

        {occurrence.createdByName ? (
          <DetailField label="Registrado por" value={occurrence.createdByName} />
        ) : null}

        <Pressable
          accessibilityLabel="Voltar ao início"
          accessibilityRole="button"
          style={({ pressed }) => [styles.homeButton, pressed && styles.buttonPressed]}
          onPress={() => {
            router.replace(authRoutes.app);
          }}
        >
          <Text style={styles.homeButtonText}>Voltar ao início</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backLink: {
    color: "#F97316",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  code: {
    color: "#F97316",
    fontFamily: "monospace",
    fontSize: 14,
    fontWeight: "700",
  },
  container: {
    backgroundColor: "#0F1115",
    flex: 1,
  },
  content: {
    gap: 12,
    padding: 16,
  },
  field: {
    gap: 4,
  },
  fieldLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  fieldValue: {
    color: "#F9FAFB",
    fontSize: 15,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  homeButton: {
    alignItems: "center",
    backgroundColor: "#374151",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 44,
  },
  homeButtonText: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "600",
  },
  meta: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  title: {
    color: "#F9FAFB",
    fontSize: 22,
    fontWeight: "700",
  },
});
