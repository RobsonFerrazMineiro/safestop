import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import type { OccurrenceTimelineItem } from "@safestop/types";
import { shouldShowActionPlanSection } from "@safestop/types";

import { useRequirePermission } from "@/features/authorization/hooks/use-require-permission";
import { EvidencePreviewModal, EvidenceSection, type EvidenceListItem } from "@/features/evidence";
import { HseActionsFooter, type HseActionsFooterState } from "@/features/hse-approval";
import { OccurrenceError } from "@/features/occurrences/components/occurrence-error";
import { OccurrenceLoading } from "@/features/occurrences/components/occurrence-loading";
import {
  formatOccurrenceDate,
  getOccurrenceSeverityLabel,
  getOccurrenceStatusLabel,
} from "@/features/occurrences/utils/occurrence-labels";
import { CommentComposerBar, OccurrenceTimelineList, useCreateComment } from "@/features/timeline";
import { EvaluationSection } from "@/features/ver-e-agir";
import {
  InterdicaoBanner,
  InterdicaoSection,
  shouldShowInterdicaoBanner,
} from "@/features/interdicao-oficial";
import {
  ImsReferenceSection,
  ImsRegisterFooter,
  shouldShowImsReferenceSection,
  type ImsRegisterFooterState,
} from "@/features/ims-reference";
import { ActionPlanSection } from "@/features/action-plan";
import { MdhoSection } from "@/features/mdho";
import { authRoutes, stopWorkRoute } from "@/lib/auth/routes";

import { FlowDeadEndBanner } from "./flow-dead-end-banner";
import { PreventiveStopEmpty } from "./preventive-stop-empty";
import { usePreventiveStop } from "../hooks/use-preventive-stop";

type PreventiveStopDetailScreenProps = {
  occurrenceId: string;
  focusSection?: string;
};

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(() => {
    const browserGlobal = globalThis as typeof globalThis & {
      navigator?: { onLine?: boolean };
    };

    return browserGlobal.navigator?.onLine !== false;
  });

  useEffect(() => {
    const browserGlobal = globalThis as typeof globalThis & {
      addEventListener?: (type: string, listener: () => void) => void;
      removeEventListener?: (type: string, listener: () => void) => void;
    };

    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    browserGlobal.addEventListener?.("online", handleOnline);
    browserGlobal.addEventListener?.("offline", handleOffline);

    return () => {
      browserGlobal.removeEventListener?.("online", handleOnline);
      browserGlobal.removeEventListener?.("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

const HSE_FOOTER_HEIGHT = 72;
const IMS_REGISTER_FOOTER_HEIGHT = 72;
const COMPOSER_HEIGHT = 72;

export function PreventiveStopDetailScreen({
  occurrenceId,
  focusSection,
}: PreventiveStopDetailScreenProps) {
  const router = useRouter();
  useRequirePermission("occurrence.read");

  const { preventiveStop, isLoading, isError, isNotFound, canRead, refetch, isFetching } =
    usePreventiveStop(occurrenceId);

  const { createComment, isCreating } = useCreateComment(occurrenceId);
  const [previewEvidence, setPreviewEvidence] = useState<EvidenceListItem | null>(null);
  const [hseFooter, setHseFooter] = useState<HseActionsFooterState | null>(null);
  const [imsRegisterFooter, setImsRegisterFooter] = useState<ImsRegisterFooterState | null>(null);
  const isOnline = useIsOnline();

  const listRef = useRef<FlatList<OccurrenceTimelineItem>>(null);
  const reviewSectionRef = useRef<View>(null);
  const hasScrolledToReview = useRef(false);

  const focusMdhoReview = focusSection === "mdho-review";
  const bottomPadding =
    140 +
    (hseFooter?.visible ? HSE_FOOTER_HEIGHT : 0) +
    (imsRegisterFooter?.visible ? IMS_REGISTER_FOOTER_HEIGHT : 0);

  useEffect(() => {
    if (!focusMdhoReview || hasScrolledToReview.current || isLoading || !preventiveStop) {
      return;
    }

    const timer = setTimeout(() => {
      reviewSectionRef.current?.measureInWindow((_x, y) => {
        listRef.current?.scrollToOffset({
          animated: true,
          offset: Math.max(0, y - 80),
        });
        hasScrolledToReview.current = true;
      });
    }, 350);

    return () => {
      clearTimeout(timer);
    };
  }, [focusMdhoReview, isLoading, preventiveStop]);

  const headerComponent = useMemo(() => {
    if (!preventiveStop) {
      return <View />;
    }

    const coordinates =
      preventiveStop.latitude !== null && preventiveStop.longitude !== null
        ? `${preventiveStop.latitude.toFixed(5)}, ${preventiveStop.longitude.toFixed(5)}`
        : null;

    const showImsSection = shouldShowImsReferenceSection(preventiveStop);
    const showActionPlanSection = shouldShowActionPlanSection(preventiveStop);

    return (
      <View style={styles.headerContent}>
        <Pressable
          accessibilityLabel="Voltar para listagem"
          accessibilityRole="button"
          onPress={() => {
            router.replace(stopWorkRoute);
          }}
        >
          <Text style={styles.backLink}>Voltar</Text>
        </Pressable>

        <Text style={styles.code}>{preventiveStop.publicCode}</Text>
        <Text style={styles.title}>{preventiveStop.title}</Text>

        <Text style={styles.meta}>
          {getOccurrenceStatusLabel(preventiveStop.status)} ·{" "}
          {getOccurrenceSeverityLabel(preventiveStop.severity)}
        </Text>

        {shouldShowInterdicaoBanner(preventiveStop.status) ? <InterdicaoBanner /> : null}

        <FlowDeadEndBanner hideTratativa={showActionPlanSection} status={preventiveStop.status} />

        <Text style={styles.sectionTitle}>Localização</Text>
        <DetailField label="Área" value={preventiveStop.areaName ?? "—"} />
        <DetailField label="Local" value={preventiveStop.locationDescription} />
        {preventiveStop.contractorOrganizationName ? (
          <DetailField label="Contratada" value={preventiveStop.contractorOrganizationName} />
        ) : null}
        {coordinates ? <DetailField label="Coordenadas" value={coordinates} /> : null}

        <Text style={styles.sectionTitle}>Descrição</Text>
        <DetailField label="Atividade" value={preventiveStop.taskDescription} />
        <DetailField label="Condição" value={preventiveStop.conditionDescription} />
        {preventiveStop.immediateActionDescription ? (
          <DetailField label="Medida imediata" value={preventiveStop.immediateActionDescription} />
        ) : null}

        <Text style={styles.sectionTitle}>Registro</Text>
        {preventiveStop.createdByName ? (
          <DetailField label="Registrado por" value={preventiveStop.createdByName} />
        ) : null}
        <DetailField label="Ocorrido em" value={formatOccurrenceDate(preventiveStop.occurredAt)} />
        {preventiveStop.stoppedAt ? (
          <DetailField
            label="Paralisado em"
            value={formatOccurrenceDate(preventiveStop.stoppedAt)}
          />
        ) : null}

        <EvidenceSection occurrenceId={occurrenceId} />

        <EvaluationSection
          isOnline={isOnline}
          isRefreshing={isFetching}
          occurrence={preventiveStop}
          onRefresh={refetch}
        />

        <InterdicaoSection
          isOnline={isOnline}
          isRefreshing={isFetching}
          occurrence={preventiveStop}
          onRefresh={refetch}
        />

        <MdhoSection
          hideImsHint={showImsSection}
          isOnline={isOnline}
          isRefreshing={isFetching}
          occurrence={preventiveStop}
          reviewSectionRef={reviewSectionRef}
          onHseFooterChange={setHseFooter}
          onRefresh={refetch}
        />

        <ImsReferenceSection
          isOnline={isOnline}
          isRefreshing={isFetching}
          occurrence={preventiveStop}
          onRegisterFooterChange={setImsRegisterFooter}
          onRefresh={refetch}
        />

        <ActionPlanSection
          isOnline={isOnline}
          isRefreshing={isFetching}
          occurrence={preventiveStop}
          onRefresh={refetch}
        />
      </View>
    );
  }, [isFetching, isOnline, occurrenceId, preventiveStop, refetch, router]);

  function handlePreviewEvidence(attachmentId: string, item: OccurrenceTimelineItem) {
    const fileName =
      typeof item.metadata.originalFileName === "string"
        ? item.metadata.originalFileName
        : item.title;

    setPreviewEvidence({
      id: attachmentId,
      occurrenceId,
      organizationId: preventiveStop?.organizationId ?? "",
      attachmentType: "INITIAL_EVIDENCE",
      originalFileName: fileName,
      mimeType: "image/jpeg",
      fileSize: 0,
      caption: item.body,
      uploadStatus: "COMPLETED",
      createdAt: item.occurredAt,
      uploadedByName: item.actorName,
    });
  }

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
        <OccurrenceError message="Não foi possível carregar a ocorrência." />
      </SafeAreaView>
    );
  }

  if (isNotFound || !preventiveStop) {
    return (
      <SafeAreaView style={styles.container}>
        <PreventiveStopEmpty
          description="A ocorrência não existe ou você não possui acesso na organização ativa."
          title="Ocorrência não encontrada"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        style={styles.flex}
      >
        <OccurrenceTimelineList
          ref={listRef}
          contentPaddingBottom={bottomPadding}
          headerComponent={headerComponent}
          isOnline={isOnline}
          occurrenceId={occurrenceId}
          occurrenceStatus={preventiveStop.status}
          onPreviewEvidence={handlePreviewEvidence}
        />

        {hseFooter?.visible ? (
          <View style={[styles.stickyFooterHost, { bottom: COMPOSER_HEIGHT }]}>
            <HseActionsFooter {...hseFooter} />
          </View>
        ) : null}

        {imsRegisterFooter?.visible ? (
          <View style={[styles.stickyFooterHost, { bottom: COMPOSER_HEIGHT }]}>
            <ImsRegisterFooter
              isOnline={imsRegisterFooter.isOnline}
              isRegistering={imsRegisterFooter.isRegistering}
              onRegister={imsRegisterFooter.onRegister}
            />
          </View>
        ) : null}

        <CommentComposerBar
          key={occurrenceId}
          isOnline={isOnline}
          isSubmitting={isCreating}
          occurrenceId={occurrenceId}
          occurrenceStatus={preventiveStop.status}
          onSubmit={async (content) => {
            await createComment(content);
          }}
        />
      </KeyboardAvoidingView>

      <EvidencePreviewModal
        evidence={previewEvidence}
        occurrenceId={occurrenceId}
        visible={previewEvidence !== null}
        onClose={() => {
          setPreviewEvidence(null);
        }}
      />

      <Pressable
        accessibilityLabel="Voltar ao início"
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.homeButtonFloating,
          hseFooter?.visible || imsRegisterFooter?.visible
            ? styles.homeButtonWithStickyFooter
            : null,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => {
          router.replace(authRoutes.app);
        }}
      >
        <Text style={styles.homeButtonText}>Voltar ao início</Text>
      </Pressable>
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
  code: {
    color: "#F97316",
    fontFamily: "monospace",
    fontSize: 14,
    fontWeight: "700",
  },
  container: {
    backgroundColor: "#0F1115",
    flex: 1,
  },
  field: {
    gap: 4,
  },
  fieldLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  fieldValue: {
    color: "#F9FAFB",
    fontSize: 15,
  },
  flex: {
    flex: 1,
  },
  headerContent: {
    gap: 12,
  },
  homeButtonFloating: {
    alignItems: "center",
    backgroundColor: "#374151",
    borderRadius: 8,
    bottom: 96,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 12,
    position: "absolute",
    right: 16,
    zIndex: 2,
  },
  homeButtonText: {
    color: "#F9FAFB",
    fontSize: 13,
    fontWeight: "600",
  },
  homeButtonWithStickyFooter: {
    bottom: 168,
  },
  stickyFooterHost: {
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 3,
  },
  meta: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  sectionTitle: {
    borderTopColor: "#1F2937",
    borderTopWidth: 1,
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8,
    paddingTop: 12,
    textTransform: "uppercase",
  },
  title: {
    color: "#F9FAFB",
    fontSize: 22,
    fontWeight: "700",
  },
});
