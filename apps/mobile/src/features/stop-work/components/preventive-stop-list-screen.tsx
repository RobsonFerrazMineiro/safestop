import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Can } from "@/features/authorization/components/can";
import { useRequirePermission } from "@/features/authorization/hooks/use-require-permission";
import { IMS_REFERENCE_COPY } from "@/features/ims-reference/utils/ims-reference-copy";
import { OccurrenceError } from "@/features/occurrences/components/occurrence-error";
import { OccurrenceLoading } from "@/features/occurrences/components/occurrence-loading";
import { authRoutes, stopWorkNewRoute } from "@/lib/auth/routes";

import { ActionAttentionListView } from "./action-attention-list-view";
import { PreventiveStopCard } from "./preventive-stop-card";
import { PreventiveStopEmpty } from "./preventive-stop-empty";
import { useStopWorkListView } from "../hooks/use-stop-work-list-view";
import {
  parseDashboardAttention,
  stopWorkAttentionEmptyMessage,
  stopWorkAttentionSubtitle,
  stopWorkAttentionTitle,
} from "../utils/dashboard-list-params";

type PreventiveStopListScreenProps = {
  dashboardAttention?: string;
};

export function PreventiveStopListScreen({
  dashboardAttention: dashboardAttentionParam,
}: PreventiveStopListScreenProps = {}) {
  const router = useRouter();
  useRequirePermission("occurrence.read");

  const dashboardAttention = parseDashboardAttention(dashboardAttentionParam);
  const [imsSearchInput, setImsSearchInput] = useState("");
  const [appliedImsSearch, setAppliedImsSearch] = useState("");

  const {
    preventiveStops,
    attentionItems,
    isAttentionView,
    canViewAttention,
    isLoading,
    isFetching,
    isError,
    refetch,
    canRead,
  } = useStopWorkListView({
    dashboardAttention,
    imsReferenceCode: appliedImsSearch || undefined,
  });

  const pageTitle =
    isAttentionView && dashboardAttention
      ? stopWorkAttentionTitle(dashboardAttention)
      : "Paralisação Preventiva";

  const pageSubtitle =
    isAttentionView && dashboardAttention ? stopWorkAttentionSubtitle(dashboardAttention) : null;

  const emptyMessage = useMemo(() => {
    if (isAttentionView && dashboardAttention) {
      return stopWorkAttentionEmptyMessage(dashboardAttention);
    }

    if (appliedImsSearch) {
      return IMS_REFERENCE_COPY.searchEmpty;
    }

    return undefined;
  }, [appliedImsSearch, dashboardAttention, isAttentionView]);

  if (!canRead) {
    return null;
  }

  if (isAttentionView && !canViewAttention) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.forbidden}>
          <Text style={styles.forbiddenTitle}>Acesso negado</Text>
          <Text style={styles.forbiddenText}>
            Você não possui permissão para visualizar ações do plano de ação.
          </Text>
          <Pressable
            accessibilityLabel="Voltar ao início"
            accessibilityRole="button"
            onPress={() => {
              router.replace(authRoutes.app);
            }}
          >
            <Text style={styles.backLink}>Voltar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
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
        <OccurrenceError
          message={
            isAttentionView
              ? "Não foi possível carregar as ações."
              : "Não foi possível carregar as ocorrências."
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Voltar ao início"
          accessibilityRole="button"
          onPress={() => {
            router.replace(authRoutes.app);
          }}
        >
          <Text style={styles.backLink}>Voltar</Text>
        </Pressable>

        <Text style={styles.title}>{pageTitle}</Text>

        {pageSubtitle ? <Text style={styles.subtitle}>{pageSubtitle}</Text> : null}

        {!isAttentionView ? (
          <View style={styles.searchBlock}>
            <Text style={styles.searchLabel}>{IMS_REFERENCE_COPY.searchLabel}</Text>
            <View style={styles.searchRow}>
              <TextInput
                accessibilityLabel={IMS_REFERENCE_COPY.searchLabel}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder={IMS_REFERENCE_COPY.searchPlaceholder}
                placeholderTextColor="#6B7280"
                style={styles.searchInput}
                value={imsSearchInput}
                onChangeText={setImsSearchInput}
                onSubmitEditing={() => {
                  setAppliedImsSearch(imsSearchInput.trim());
                }}
              />
              <Pressable
                accessibilityLabel="Buscar por código IMS"
                accessibilityRole="button"
                style={({ pressed }) => [styles.searchButton, pressed && styles.buttonPressed]}
                onPress={() => {
                  setAppliedImsSearch(imsSearchInput.trim());
                }}
              >
                <Text style={styles.searchButtonText}>Buscar</Text>
              </Pressable>
            </View>
            {appliedImsSearch ? (
              <Pressable
                accessibilityLabel="Limpar filtro IMS"
                accessibilityRole="button"
                onPress={() => {
                  setImsSearchInput("");
                  setAppliedImsSearch("");
                }}
              >
                <Text style={styles.clearFilter}>Limpar filtro IMS</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      {isAttentionView ? (
        <ActionAttentionListView
          emptyMessage={emptyMessage ?? ""}
          isFetching={isFetching}
          items={attentionItems}
          onRefresh={refetch}
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={preventiveStops}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <PreventiveStopEmpty
              actionLabel={appliedImsSearch ? undefined : "Registrar Paralisação"}
              description={emptyMessage}
              onAction={
                appliedImsSearch
                  ? undefined
                  : () => {
                      router.push(stopWorkNewRoute);
                    }
              }
            />
          }
          refreshControl={
            <RefreshControl
              colors={["#F97316"]}
              refreshing={isFetching}
              tintColor="#F97316"
              onRefresh={() => {
                refetch();
              }}
            />
          }
          renderItem={({ item }) => <PreventiveStopCard preventiveStop={item} />}
        />
      )}

      {!isAttentionView ? (
        <Can permission="occurrence.create">
          <View style={styles.footer}>
            <Pressable
              accessibilityLabel="Nova Paralisação"
              accessibilityRole="button"
              style={({ pressed }) => [styles.createButton, pressed && styles.buttonPressed]}
              onPress={() => {
                router.push(stopWorkNewRoute);
              }}
            >
              <Text style={styles.createButtonText}>Nova Paralisação</Text>
            </Pressable>
          </View>
        </Can>
      ) : null}
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
  clearFilter: {
    color: "#93C5FD",
    fontSize: 13,
    fontWeight: "600",
  },
  container: {
    backgroundColor: "#0F1115",
    flex: 1,
  },
  createButton: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 48,
  },
  createButtonText: {
    color: "#0F1115",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    borderTopColor: "#1F2937",
    borderTopWidth: 1,
    padding: 16,
  },
  forbidden: {
    alignItems: "center",
    flex: 1,
    gap: 12,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  forbiddenText: {
    color: "#9CA3AF",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  forbiddenTitle: {
    color: "#F9FAFB",
    fontSize: 20,
    fontWeight: "700",
  },
  header: {
    gap: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  listContent: {
    gap: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  searchBlock: {
    gap: 8,
    marginTop: 4,
  },
  searchButton: {
    alignItems: "center",
    backgroundColor: "#374151",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 14,
  },
  searchButtonText: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "600",
  },
  searchInput: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
    borderRadius: 8,
    borderWidth: 1,
    color: "#F9FAFB",
    flex: 1,
    fontFamily: "monospace",
    fontSize: 14,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  searchLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    color: "#F9FAFB",
    fontSize: 24,
    fontWeight: "700",
  },
});
