import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import type { DashboardActionItemAttentionItem } from "@safestop/types";

import { ActionAttentionItemCard } from "./action-attention-item-card";

type ActionAttentionListViewProps = {
  items: DashboardActionItemAttentionItem[];
  emptyMessage: string;
  isFetching?: boolean;
  onRefresh?: () => void;
};

export function ActionAttentionListView({
  items,
  emptyMessage,
  isFetching = false,
  onRefresh,
}: ActionAttentionListViewProps) {
  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View accessibilityRole="text" style={styles.empty}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.listContent}
      data={items}
      keyExtractor={(item) => item.id}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            colors={["#F97316"]}
            refreshing={isFetching}
            tintColor="#F97316"
            onRefresh={onRefresh}
          />
        ) : undefined
      }
      renderItem={({ item }) => <ActionAttentionItemCard item={item} />}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderColor: "#374151",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyText: {
    color: "#D1D5DB",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
});
