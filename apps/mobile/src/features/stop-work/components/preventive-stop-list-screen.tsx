import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { OctagonAlert, Search } from "lucide-react-native";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OperationalOccurrenceListRpcError } from "@safestop/types";
import { colors, controlHeight, spacing, typography } from "@safestop/ui";

import { Button, ScreenBackLink, TextField } from "@/components/ui";
import { useRequirePermission } from "@/features/authorization/hooks/use-require-permission";
import { OccurrenceError } from "@/features/occurrences/components/occurrence-error";
import { OccurrenceLoading } from "@/features/occurrences/components/occurrence-loading";
import { WorkspaceOperationalGate, WorkspaceSwitcher } from "@/features/workspace";
import { authRoutes, stopWorkNewRoute } from "@/lib/auth/routes";

import { ActionAttentionListView } from "./action-attention-list-view";
import { PreventiveStopCard } from "./preventive-stop-card";
import { PreventiveStopEmpty } from "./preventive-stop-empty";
import { PreventiveStopOperationalFiltersModal } from "./preventive-stop-operational-filters-modal";
import { useStopWorkListView } from "../hooks/use-stop-work-list-view";
import {
  parseDashboardAttention,
  parseDashboardAttentionScope,
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

const SEARCH_ICON_SIZE = 16;
const HEADER_ICON_SIZE = 22;

type PreventiveStopListScreenProps = {
  dashboardAttention?: string;
  dashboardAttentionScope?: string;
};

type SearchInputProps = {
  accessibilityLabel: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
};

function SearchInput({ accessibilityLabel, placeholder, value, onChangeText }: SearchInputProps) {
  return (
    <View style={styles.searchInputWrap}>
      <Search
        accessible={false}
        color={colors.foregroundMuted}
        size={SEARCH_ICON_SIZE}
        strokeWidth={2}
        style={styles.searchInputIcon}
      />
      <TextField
        accessibilityLabel={accessibilityLabel}
        autoCapitalize="none"
        autoCorrect={false}
        inputStyle={styles.searchInputField}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

export function PreventiveStopListScreen({
  dashboardAttention: dashboardAttentionParam,
  dashboardAttentionScope: dashboardAttentionScopeParam,
}: PreventiveStopListScreenProps = {}) {
  const router = useRouter();
  useRequirePermission("occurrence.read");

  const dashboardAttention = parseDashboardAttention(dashboardAttentionParam);
  const dashboardAttentionScope = parseDashboardAttentionScope(dashboardAttentionScopeParam);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [funnel, setFunnel] = useState<OperationalListFunnelState>(EMPTY_OPERATIONAL_FUNNEL);

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
    () => toOperationalOccurrenceListFilters(operationalUi),
    [operationalUi],
  );
  const hasDiscovery = hasActiveOperationalDiscovery(operationalUi);

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
    dashboardAttentionScope,
    operationalFilters,
  });

  const pageTitle =
    isAttentionView && dashboardAttention
      ? stopWorkAttentionTitle(dashboardAttention, dashboardAttentionScope)
      : "Paralisações";

  const pageSubtitle =
    isAttentionView && dashboardAttention
      ? stopWorkAttentionSubtitle(dashboardAttention, dashboardAttentionScope)
      : "Paralisações Preventivas do Ambiente ativo.";

  const errorMessage =
    error instanceof OperationalOccurrenceListRpcError
      ? error.message
      : error instanceof Error
        ? error.message
        : "Não foi possível carregar as Paralisações Preventivas.";

  const emptyMessage = useMemo(() => {
    if (isAttentionView && dashboardAttention) {
      return stopWorkAttentionEmptyMessage(dashboardAttention, dashboardAttentionScope);
    }

    if (hasDiscovery) {
      return "Nenhuma Paralisação Preventiva encontrada para esta busca/filtros.";
    }

    return undefined;
  }, [dashboardAttention, dashboardAttentionScope, hasDiscovery, isAttentionView]);

  function clearSearchAndFunnel() {
    setSearchInput("");
    setDebouncedSearch("");
    setFunnel(EMPTY_OPERATIONAL_FUNNEL);
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
          <ScreenBackLink
            accessibilityLabel="Voltar ao início"
            onPress={() => {
              router.replace(authRoutes.app);
            }}
          />
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

  const listHeader = (
    <View style={styles.header}>
      <ScreenBackLink
        accessibilityLabel="Voltar ao início"
        onPress={() => {
          router.replace(authRoutes.app);
        }}
      />

      <View style={styles.titleRow}>
        {!isAttentionView ? (
          <OctagonAlert
            accessible={false}
            color={colors.primary}
            size={HEADER_ICON_SIZE}
            strokeWidth={2}
          />
        ) : null}
        <Text accessibilityRole="header" style={styles.title}>
          {pageTitle}
        </Text>
      </View>

      <Text style={styles.subtitle}>{pageSubtitle}</Text>

      {!isAttentionView ? <WorkspaceSwitcher /> : null}

      {!isAttentionView ? (
        <View style={styles.searchRow}>
          <SearchInput
            accessibilityLabel="Buscar Paralisações Preventivas"
            placeholder={OPERATIONAL_LIST_SEARCH_PLACEHOLDER}
            value={searchInput}
            onChangeText={setSearchInput}
          />
          <PreventiveStopOperationalFiltersModal funnel={funnel} onApply={setFunnel} />
        </View>
      ) : null}
    </View>
  );

  if (isAttentionView) {
    return (
      <SafeAreaView style={styles.container}>
        {listHeader}
        <ActionAttentionListView
          emptyMessage={emptyMessage ?? ""}
          isFetching={isFetching}
          items={attentionItems}
          onRefresh={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <WorkspaceOperationalGate>
        {listHeader}

        {isLoading && preventiveStops.length === 0 ? (
          <View style={styles.listBody}>
            <OccurrenceLoading />
          </View>
        ) : isError ? (
          <View style={styles.listBody}>
            <OccurrenceError
              message={errorMessage}
              onRetry={() => {
                void refetch();
              }}
            />
          </View>
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
                  actionLabel="Registrar Paralisação"
                  description={emptyMessage}
                  onAction={() => {
                    router.push(stopWorkNewRoute);
                  }}
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
            style={styles.list}
          />
        )}
      </WorkspaceOperationalGate>
    </SafeAreaView>
  );
}

const SEARCH_ICON_INSET = spacing[8];

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  discoveryEmpty: {
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[6],
  },
  discoveryEmptyText: {
    color: colors.foreground,
    fontSize: typography.label.fontSize,
    textAlign: "center",
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
  header: {
    flexGrow: 0,
    flexShrink: 0,
    gap: spacing[2],
    paddingBottom: spacing[2],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
  },
  list: {
    flex: 1,
  },
  listBody: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    gap: spacing[2],
    paddingBottom: spacing[8],
    paddingHorizontal: spacing[4],
  },
  loadMore: {
    marginTop: spacing[1],
  },
  searchInputField: {
    paddingLeft: SEARCH_ICON_INSET,
  },
  searchInputIcon: {
    left: spacing[3],
    position: "absolute",
    top: (controlHeight.mobile - SEARCH_ICON_SIZE) / 2,
    zIndex: 1,
  },
  searchInputWrap: {
    flex: 1,
    minWidth: 0,
    position: "relative",
  },
  searchRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: spacing[2],
  },
  subtitle: {
    color: colors.foregroundMuted,
    fontSize: typography.helper.fontSize,
    lineHeight: 16,
  },
  title: {
    color: colors.foreground,
    flex: 1,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
  },
});
