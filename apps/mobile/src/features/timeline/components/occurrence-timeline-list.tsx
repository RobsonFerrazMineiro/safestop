import { forwardRef, useCallback, useState, type ReactElement } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import type { OccurrenceStatus, OccurrenceTimelineItem } from "@safestop/types";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useAuth } from "@/hooks/use-auth";

import { CommentEditSheet } from "./comment-edit-sheet";
import { TimelineItem } from "./timeline-item";
import {
  TimelineEmpty,
  TimelineError,
  TimelineLoadMore,
  TimelineLoading,
  TimelineOfflineBanner,
  TimelineSectionTitle,
} from "./timeline-states";
import { useDeleteComment } from "../hooks/use-delete-comment";
import { useOccurrenceTimeline } from "../hooks/use-occurrence-timeline";
import { useUpdateComment } from "../hooks/use-update-comment";
import { getCommentId } from "../utils/timeline-permissions";

type OccurrenceTimelineListProps = {
  occurrenceId: string;
  occurrenceStatus: OccurrenceStatus;
  headerComponent: ReactElement;
  contentPaddingBottom?: number;
  isOnline: boolean;
  onPreviewEvidence?: (attachmentId: string, item: OccurrenceTimelineItem) => void;
};

function readIsOnline(): boolean {
  const browserGlobal = globalThis as typeof globalThis & {
    navigator?: { onLine?: boolean };
  };

  return browserGlobal.navigator?.onLine !== false;
}

export const OccurrenceTimelineList = forwardRef<
  FlatList<OccurrenceTimelineItem>,
  OccurrenceTimelineListProps
>(function OccurrenceTimelineList(
  {
    occurrenceId,
    occurrenceStatus,
    headerComponent,
    contentPaddingBottom = 120,
    isOnline,
    onPreviewEvidence,
  },
  ref,
) {
  const { user } = useAuth();
  const { can } = useAuthorization();
  const canCancelOccurrence = can("occurrence.cancel");

  const {
    items,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    canRead,
  } = useOccurrenceTimeline(occurrenceId);

  const { updateComment, isUpdating } = useUpdateComment(occurrenceId);
  const { deleteComment, isDeleting } = useDeleteComment(occurrenceId);

  const [editingItem, setEditingItem] = useState<OccurrenceTimelineItem | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleLoadMore = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    setLoadMoreError(null);

    try {
      await fetchNextPage();
    } catch {
      setLoadMoreError("Não foi possível carregar mais eventos.");
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  function confirmDelete(item: OccurrenceTimelineItem) {
    const commentId = getCommentId(item);

    if (!commentId) {
      return;
    }

    Alert.alert(
      "Remover comentário?",
      'O texto deixará de ser exibido. A timeline mostrará "Comentário removido" para manter a rastreabilidade.',
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => {
            void deleteComment(commentId);
          },
        },
      ],
    );
  }

  if (!canRead) {
    return null;
  }

  const listHeader = (
    <View>
      {headerComponent}
      <TimelineSectionTitle />
      {!readIsOnline() || !isOnline ? <TimelineOfflineBanner /> : null}
      {isLoading ? <TimelineLoading /> : null}
      {isError ? (
        <TimelineError
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}
      {!isLoading && !isError && items.length === 0 ? <TimelineEmpty /> : null}
    </View>
  );

  const listFooter = (
    <TimelineLoadMore
      errorMessage={loadMoreError}
      hasNextPage={hasNextPage}
      isLoading={isFetchingNextPage}
      onLoadMore={() => {
        void handleLoadMore();
      }}
    />
  );

  return (
    <>
      <FlatList
        ref={ref}
        contentContainerStyle={[styles.content, { paddingBottom: contentPaddingBottom }]}
        data={isLoading ? [] : items}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        ListFooterComponent={listFooter}
        ListHeaderComponent={listHeader}
        refreshControl={
          <RefreshControl
            colors={["#F97316"]}
            refreshing={refreshing}
            tintColor="#F97316"
            onRefresh={() => {
              void handleRefresh();
            }}
          />
        }
        renderItem={({ item }) => (
          <TimelineItem
            canCancelOccurrence={canCancelOccurrence}
            currentUserId={user?.id}
            item={item}
            occurrenceStatus={occurrenceStatus}
            onDeleteComment={confirmDelete}
            onEditComment={setEditingItem}
            onPreviewEvidence={onPreviewEvidence}
          />
        )}
        style={styles.list}
      />

      <CommentEditSheet
        initialContent={editingItem?.body ?? ""}
        isSaving={isUpdating || isDeleting}
        visible={editingItem !== null}
        onClose={() => {
          setEditingItem(null);
        }}
        onSave={async (content) => {
          const commentId = editingItem ? getCommentId(editingItem) : null;

          if (!commentId) {
            return;
          }

          await updateComment({ commentId, content });
        }}
      />
    </>
  );
});

const styles = StyleSheet.create({
  content: {
    gap: 0,
    paddingHorizontal: 16,
  },
  list: {
    flex: 1,
  },
});
