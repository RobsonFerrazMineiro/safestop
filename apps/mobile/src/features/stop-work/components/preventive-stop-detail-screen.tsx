import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRequirePermission } from "@/features/authorization/hooks/use-require-permission";
import { OccurrenceError } from "@/features/occurrences/components/occurrence-error";
import { OccurrenceLoading } from "@/features/occurrences/components/occurrence-loading";
import { authRoutes, stopWorkRoute } from "@/lib/auth/routes";

import { PreventiveStopEmpty } from "./preventive-stop-empty";
import { usePreventiveStop } from "../hooks/use-preventive-stop";
import {
  formatOccurrenceDate,
  getOccurrenceSeverityLabel,
  getOccurrenceStatusLabel,
} from "@/features/occurrences/utils/occurrence-labels";

type PreventiveStopDetailScreenProps = {
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

export function PreventiveStopDetailScreen({ occurrenceId }: PreventiveStopDetailScreenProps) {
  const router = useRouter();
  useRequirePermission("occurrence.read");

  const { preventiveStop, isLoading, isError, isNotFound, canRead } =
    usePreventiveStop(occurrenceId);

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

  if (isNotFound || !preventiveStop) {
    return (
      <SafeAreaView style={styles.container}>
        <PreventiveStopEmpty
          description="A ocorrência não existe ou você não possui acesso na organização ativa."
          title="Ocorrência não encontrada"
        />
      </SafeAreaView>
    );
  }

  const coordinates =
    preventiveStop.latitude !== null && preventiveStop.longitude !== null
      ? `${preventiveStop.latitude.toFixed(5)}, ${preventiveStop.longitude.toFixed(5)}`
      : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityLabel="Voltar para listagem"
          accessibilityRole="button"
          onPress={() => {
            router.replace(stopWorkRoute);
          }}
        >
          <Text style={styles.backLink}>Voltar</Text>
        </Pressable>

        <Text style={styles.code}>{preventiveStop.publicCode}</Text>
        <Text style={styles.title}>{preventiveStop.title}</Text>

        <Text style={styles.meta}>
          {getOccurrenceStatusLabel(preventiveStop.status)} ·{" "}
          {getOccurrenceSeverityLabel(preventiveStop.severity)}
        </Text>

        <Text style={styles.sectionTitle}>Localização</Text>
        <DetailField label="Área" value={preventiveStop.areaName ?? "—"} />
        <DetailField label="Local" value={preventiveStop.locationDescription} />
        {preventiveStop.contractorOrganizationName ? (
          <DetailField label="Contratada" value={preventiveStop.contractorOrganizationName} />
        ) : null}
        {coordinates ? <DetailField label="Coordenadas" value={coordinates} /> : null}

        <Text style={styles.sectionTitle}>Descrição</Text>
        <DetailField label="Atividade" value={preventiveStop.taskDescription} />
        <DetailField label="Condição" value={preventiveStop.conditionDescription} />
        {preventiveStop.immediateActionDescription ? (
          <DetailField label="Medida imediata" value={preventiveStop.immediateActionDescription} />
        ) : null}

        <Text style={styles.sectionTitle}>Histórico</Text>
        <DetailField
          label="Evento"
          value={`${getOccurrenceStatusLabel("PARALISACAO_PREVENTIVA")} registrada${
            preventiveStop.createdByName ? ` por ${preventiveStop.createdByName}` : ""
          } · ${formatOccurrenceDate(preventiveStop.createdAt)}`}
        />

        <Text style={styles.sectionTitle}>Registro</Text>
        {preventiveStop.createdByName ? (
          <DetailField label="Registrado por" value={preventiveStop.createdByName} />
        ) : null}
        <DetailField label="Ocorrido em" value={formatOccurrenceDate(preventiveStop.occurredAt)} />
        {preventiveStop.stoppedAt ? (
          <DetailField
            label="Paralisado em"
            value={formatOccurrenceDate(preventiveStop.stoppedAt)}
          />
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
  title: {
    color: "#F9FAFB",
    fontSize: 22,
    fontWeight: "700",
  },
});
