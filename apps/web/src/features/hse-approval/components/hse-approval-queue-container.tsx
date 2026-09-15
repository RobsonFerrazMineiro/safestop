"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { ClipboardCheck } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";

import { useHseApprovalContext } from "../hooks/use-hse-approval-context";
import { useHseApprovalQueue } from "../hooks/use-hse-approval-queue";
import { HseApprovalQueue } from "./hse-approval-queue";
import { HseApprovalQueueForbidden, HseApprovalQueueLoading } from "./hse-approval-queue-item";

export function HseApprovalQueueContainer() {
  const router = useRouter();
  const { showQueue, isReady } = useHseApprovalContext();
  const {
    items,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    enabled,
  } = useHseApprovalQueue();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!showQueue) {
      router.replace("/forbidden");
    }
  }, [isReady, router, showQueue]);

  if (!isReady || !showQueue) {
    return <HseApprovalQueueForbidden />;
  }

  if (isLoading) {
    return (
      <PageShell className="gap-6" width="wide">
        <HseApprovalQueueHeader />
        <HseApprovalQueueLoading />
      </PageShell>
    );
  }

  if (isError) {
    return (
      <PageShell className="gap-6" width="wide">
        <HseApprovalQueueHeader />
        <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-destructive" role="alert">
            {error instanceof Error
              ? error.message
              : "Não foi possível carregar a fila de aprovação HSE."}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void refetch();
            }}
          >
            Tentar novamente
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="gap-6" width="wide">
      <HseApprovalQueueHeader />
      {enabled ? (
        <HseApprovalQueue
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          items={items}
          onLoadMore={() => {
            void fetchNextPage();
          }}
        />
      ) : null}
    </PageShell>
  );
}

function HseApprovalQueueHeader() {
  return (
    <PageHeader
      backHref="/"
      backLabel="Dashboard"
      eyebrow="GOVERNANÇA E SEGURANÇA"
      icon={ClipboardCheck}
      subtitle="Aguardando sua aprovação"
      title="Aprovação HSE"
    />
  );
}
