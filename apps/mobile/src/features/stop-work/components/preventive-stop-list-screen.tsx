import { useRouter } from "expo-router";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Can } from "@/features/authorization/components/can";
import { useRequirePermission } from "@/features/authorization/hooks/use-require-permission";
import { OccurrenceError } from "@/features/occurrences/components/occurrence-error";
import { OccurrenceLoading } from "@/features/occurrences/components/occurrence-loading";
import { authRoutes, stopWorkNewRoute } from "@/lib/auth/routes";

import { PreventiveStopCard } from "./preventive-stop-card";
import { PreventiveStopEmpty } from "./preventive-stop-empty";
import { usePreventiveStops } from "../hooks/use-preventive-stops";

export function PreventiveStopListScreen() {
  const router = useRouter();
  useRequirePermission("occurrence.read");

  const { preventiveStops, isLoading, isFetching, isError, refetch, canRead } =
    usePreventiveStops();

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
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={preventiveStops}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <PreventiveStopEmpty
            actionLabel="Registrar Paralisação"
            onAction={() => {
              router.push(stopWorkNewRoute);
            }}
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
    gap: 4,
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  listContent: {
    gap: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    color: "#F9FAFB",
    fontSize: 24,
    fontWeight: "700",
  },
});
