"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

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
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
        <HseApprovalQueueHeader />
        <HseApprovalQueueLoading />
      </section>
    );
  }

  if (isError) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
        <HseApprovalQueueHeader />
        <main className="flex flex-col items-center gap-4 text-center">
          <p className="max-w-md text-base text-red-200" role="alert">
            {error instanceof Error
              ? error.message
              : "Não foi possível carregar a fila de aprovação HSE."}
          </p>
          <button
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-gray-500"
            onClick={() => {
              void refetch();
            }}
            type="button"
          >
            Tentar novamente
          </button>
        </main>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
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
    <header className="flex flex-col gap-2">
      <Link className="text-sm text-orange-400 hover:text-orange-300" href="/">
        ← Voltar
      </Link>
      <h1 className="text-3xl font-bold text-gray-100">Aprovação HSE</h1>
      <p className="text-sm text-amber-200/80">Aguardando sua aprovação</p>
    </header>
  );
}
