import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OperationalOccurrenceListRpcError } from "@safestop/types";
import { colors, spacing, typography } from "@safestop/ui";

import { Button, TextField } from "@/components/ui";
import { Can } from "@/features/authorization/components/can";
import { useRequirePermission } from "@/features/authorization/hooks/use-require-permission";
import { IMS_REFERENCE_COPY } from "@/features/ims-reference/utils/ims-reference-copy";
import { OccurrenceError } from "@/features/occurrences/components/occurrence-error";
import { OccurrenceLoading } from "@/features/occurrences/components/occurrence-loading";
import { authRoutes, stopWorkNewRoute } from "@/lib/auth/routes";

import { ActionAttentionListView } from "./action-attention-list-view";
import { PreventiveStopCard } from "./preventive-stop-card";
import { PreventiveStopEmpty } from "./preventive-stop-empty";
import { PreventiveStopOperationalFiltersModal } from "./preventive-stop-operational-filters-modal";
import { useStopWorkListView } from "../hooks/use-stop-work-list-view";
import {
  parseDashboardAttention,
  stopWorkAttentionEmptyMessage,
  stopWorkAttentionSubtitle,
  stopWorkAttentionTitle,
} from "../utils/dashboard-list-params";
import {
  EMPTY_OPERATIONAL_FUNNEL,
  OPERATIONAL_LIST_SEARCH_DEBOUNCE_MS,
  OPERATIONAL_LIST_SEARCH_PLACEHOLDER,
  hasActiveOperationalDiscovery,
  toOperationalOccurrenceListFilters,
  type OperationalListFunnelState,
} from "../utils/operational-list-filters";

type PreventiveStopListScreenProps = {
  dashboardAttention?: string;
};

export function PreventiveStopListScreen({
  dashboardAttention: dashboardAttentionParam,
}: PreventiveStopListScreenProps = {}) {
  const router = useRouter();
  useRequirePermission("occurrence.read");

  const dashboardAttention = parseDashboardAttention(dashboardAttentionParam);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [funnel, setFunnel] = useState<OperationalListFunnelState>(EMPTY_OPERATIONAL_FUNNEL);
  const [imsSearchInput, setImsSearchInput] = useState("");
  const [appliedImsSearch, setAppliedImsSearch] = useState("");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, OPERATIONAL_LIST_SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchInput]);

  const operationalUi = useMemo(
    () => ({ ...funnel, search: debouncedSearch }),
    [debouncedSearch, funnel],
  );
  const operationalFilters = useMemo(
    () =>
      toOperationalOccurrenceListFilters(operationalUi, {
        imsReferenceCode: appliedImsSearch || undefined,
      }),
    [appliedImsSearch, operationalUi],
  );
  const hasDiscovery = hasActiveOperationalDiscovery(operationalUi, appliedImsSearch);

  const {
    preventiveStops,
    attentionItems,
    isAttentionView,
    canViewAttention,
    hasNext,
    isFetchingNextPage,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    canRead,
    fetchNextPage,
  } = useStopWorkListView({
    dashboardAttention,
    operationalFilters,
  });

  const pageTitle =
    isAttentionView && dashboardAttention
      ? stopWorkAttentionTitle(dashboardAttention)
      : "Paralisação Preventiva";

  const pageSubtitle =
    isAttentionView && dashboardAttention ? stopWorkAttentionSubtitle(dashboardAttention) : null;

  const errorMessage =
    error instanceof OperationalOccurrenceListRpcError
      ? error.message
      : error instanceof Error
        ? error.message
        : "Não foi possível carregar as Paralisações Preventivas.";

  const emptyMessage = useMemo(() => {
    if (isAttentionView && dashboardAttention) {
      return stopWorkAttentionEmptyMessage(dashboardAttention);
    }

    if (hasDiscovery) {
      return "Nenhuma Paralisação Preventiva encontrada para esta busca/filtros.";
    }

    if (appliedImsSearch) {
      return IMS_REFERENCE_COPY.searchEmpty;
    }

    return undefined;
  }, [appliedImsSearch, dashboardAttention, hasDiscovery, isAttentionView]);

  function clearSearchAndFunnel() {
    setSearchInput("");
    setDebouncedSearch("");
    setFunnel(EMPTY_OPERATIONAL_FUNNEL);
    setImsSearchInput("");
    setAppliedImsSearch("");
  }

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

  if (isAttentionView && isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <OccurrenceLoading />
      </SafeAreaView>
    );
  }

  if (isAttentionView && isError) {
    return (
      <SafeAreaView style={styles.container}>
        <OccurrenceError
          message="Não foi possível carregar as ações."
          onRetry={() => {
            void refetch();
          }}
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
          <>
            <View style={styles.searchRow}>
              <View style={styles.generalSearch}>
                <TextField
                  accessibilityLabel="Buscar Paralisações Preventivas"
                  autoCapitalize="none"
                  autoCorrect={false}
                  label="Busca geral"
                  placeholder={OPERATIONAL_LIST_SEARCH_PLACEHOLDER}
                  value={searchInput}
                  onChangeText={setSearchInput}
                />
              </View>
              <PreventiveStopOperationalFiltersModal funnel={funnel} onApply={setFunnel} />
            </View>

            <View style={styles.searchBlock}>
              <TextField
                accessibilityLabel={IMS_REFERENCE_COPY.searchLabel}
                autoCapitalize="characters"
                autoCorrect={false}
                inputStyle={styles.searchInput}
                label={IMS_REFERENCE_COPY.searchLabel}
                placeholder={IMS_REFERENCE_COPY.searchPlaceholder}
                value={imsSearchInput}
                onChangeText={setImsSearchInput}
                onSubmitEditing={() => {
                  setAppliedImsSearch(imsSearchInput.trim());
                }}
              />
              <View style={styles.searchActions}>
                <Button
                  accessibilityLabel="Buscar por código IMS"
                  style={styles.searchButton}
                  variant="secondary"
                  onPress={() => {
                    setAppliedImsSearch(imsSearchInput.trim());
                  }}
                >
                  Buscar
                </Button>
                {appliedImsSearch ? (
                  <Button
                    accessibilityLabel="Limpar filtro IMS"
                    variant="ghost"
                    onPress={() => {
                      setImsSearchInput("");
                      setAppliedImsSearch("");
                    }}
                  >
                    Limpar filtro IMS
                  </Button>
                ) : null}
              </View>
            </View>
          </>
        ) : null}
      </View>

      {isAttentionView ? (
        <ActionAttentionListView
          emptyMessage={emptyMessage ?? ""}
          isFetching={isFetching}
          items={attentionItems}
          onRefresh={refetch}
        />
      ) : isLoading && preventiveStops.length === 0 ? (
        <OccurrenceLoading />
      ) : isError ? (
        <OccurrenceError
          message={errorMessage}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={preventiveStops}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            hasDiscovery ? (
              <View style={styles.discoveryEmpty}>
                <Text style={styles.discoveryEmptyText}>{emptyMessage}</Text>
                <Button
                  accessibilityLabel="Limpar busca e filtros"
                  variant="secondary"
                  onPress={clearSearchAndFunnel}
                >
                  Limpar busca e filtros
                </Button>
              </View>
            ) : (
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
            )
          }
          ListFooterComponent={
            hasNext ? (
              <View style={styles.loadMore}>
                <Button
                  accessibilityLabel="Carregar mais Paralisações Preventivas"
                  loading={isFetchingNextPage}
                  variant="secondary"
                  onPress={() => {
                    fetchNextPage();
                  }}
                >
                  {isFetchingNextPage ? "Carregando…" : "Carregar mais"}
                </Button>
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              colors={[colors.primary]}
              refreshing={isFetching && !isFetchingNextPage}
              tintColor={colors.primary}
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
            <Button
              accessibilityLabel="Nova Paralisação"
              onPress={() => {
                router.push(stopWorkNewRoute);
              }}
            >
              Nova Paralisação
            </Button>
          </View>
        </Can>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backLink: {
    color: colors.primary,
    fontSize: typography.label.fontSize,
    fontWeight: "600",
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  discoveryEmpty: {
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[8],
  },
  discoveryEmptyText: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    textAlign: "center",
  },
  footer: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    padding: spacing[4],
  },
  forbidden: {
    alignItems: "center",
    flex: 1,
    gap: spacing[3],
    justifyContent: "center",
    paddingHorizontal: spacing[6],
  },
  forbiddenText: {
    color: colors.foregroundMuted,
    fontSize: typography.label.fontSize,
    lineHeight: 20,
    textAlign: "center",
  },
  forbiddenTitle: {
    color: colors.foreground,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
  },
  generalSearch: {
    flex: 1,
  },
  header: {
    gap: spacing[2],
    paddingBottom: spacing[3],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
  },
  listContent: {
    gap: spacing[3],
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[4],
  },
  loadMore: {
    marginTop: spacing[2],
  },
  searchActions: {
    gap: spacing[2],
  },
  searchBlock: {
    gap: spacing[2],
    marginTop: spacing[1],
  },
  searchButton: {
    alignSelf: "flex-start",
  },
  searchInput: {
    fontFamily: "monospace",
    fontSize: typography.label.fontSize,
  },
  searchRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: spacing[2],
    marginTop: spacing[1],
  },
  subtitle: {
    color: colors.foregroundMuted,
    fontSize: typography.helper.fontSize,
    lineHeight: 18,
  },
  title: {
    color: colors.foreground,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
  },
});
