"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

import { useHseApprovalContext } from "../hooks/use-hse-approval-context";
import { useHseApprovalQueue } from "../hooks/use-hse-approval-queue";
import { HseApprovalQueue } from "./hse-approval-queue";
import { HseApprovalQueueForbidden, HseApprovalQueueLoading } from "./hse-approval-queue-item";

const QUEUE_SHELL_CLASS = "flex w-full flex-1 flex-col gap-6 px-6 py-10";

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
      <section className={QUEUE_SHELL_CLASS}>
        <HseApprovalQueueHeader />
        <HseApprovalQueueLoading />
      </section>
    );
  }

  if (isError) {
    return (
      <section className={QUEUE_SHELL_CLASS}>
        <HseApprovalQueueHeader />
        <div className="flex flex-col items-start gap-3">
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
      </section>
    );
  }

  return (
    <section className={QUEUE_SHELL_CLASS}>
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
    </section>
  );
}

function HseApprovalQueueHeader() {
  return (
    <PageHeader
      backHref="/"
      backLabel="← Voltar"
      subtitle="Aguardando sua aprovação"
      title="Aprovação HSE"
    />
  );
}
