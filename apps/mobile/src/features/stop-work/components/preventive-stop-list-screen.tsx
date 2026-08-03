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

import { PreventiveStopCard } from "./preventive-stop-card";
import { PreventiveStopEmpty } from "./preventive-stop-empty";
import { usePreventiveStops } from "../hooks/use-preventive-stops";

export function PreventiveStopListScreen() {
  const router = useRouter();
  useRequirePermission("occurrence.read");

  const [imsSearchInput, setImsSearchInput] = useState("");
  const [appliedImsSearch, setAppliedImsSearch] = useState("");

  const { preventiveStops, isLoading, isFetching, isError, refetch, canRead } = usePreventiveStops({
    imsReferenceCode: appliedImsSearch || undefined,
  });

  const emptyMessage = useMemo(() => {
    if (appliedImsSearch) {
      return IMS_REFERENCE_COPY.searchEmpty;
    }

    return undefined;
  }, [appliedImsSearch]);

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
        <OccurrenceError message="Não foi possível carregar as ocorrências." />
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

        <Text style={styles.title}>Paralisação Preventiva</Text>

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
      </View>

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
              void refetch();
            }}
          />
        }
        renderItem={({ item }) => <PreventiveStopCard preventiveStop={item} />}
      />

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
  title: {
    color: "#F9FAFB",
    fontSize: 24,
    fontWeight: "700",
  },
});
