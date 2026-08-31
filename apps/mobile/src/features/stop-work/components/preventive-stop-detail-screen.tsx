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
import { MapPin, OctagonAlert } from "lucide-react-native";
import type { OccurrenceTimelineItem, OccurrenceDetails } from "@safestop/types";
import { shouldShowActionPlanSection } from "@safestop/types";
import { colors, controlHeight, radius, spacing, typography } from "@safestop/ui";

import { ScreenBackLink, StatusBadge } from "@/components/ui";
import { useRequirePermission } from "@/features/authorization/hooks/use-require-permission";
import { EvidencePreviewModal, EvidenceSection, type EvidenceListItem } from "@/features/evidence";
import { HseActionsFooter, type HseActionsFooterState } from "@/features/hse-approval";
import { OccurrenceError } from "@/features/occurrences/components/occurrence-error";
import { OccurrenceLoading } from "@/features/occurrences/components/occurrence-loading";
import { formatOccurrenceDate } from "@/features/occurrences/utils/occurrence-labels";
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
import {
  NotificationAwarenessBanner,
  usePendingAwarenessForOccurrence,
} from "@/features/notifications";
import { OccurrenceParticipantsSection } from "@/features/occurrence-participants";
import { stopWorkRoute } from "@/lib/auth/routes";

import { FlowDeadEndBanner } from "./flow-dead-end-banner";
import { PreventiveStopEmpty } from "./preventive-stop-empty";
import { usePreventiveStop } from "../hooks/use-preventive-stop";

const HEADER_ICON_SIZE = 22;
const META_ICON_SIZE = 12;

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

type RegistrationDetailsSectionProps = {
  createdByName: string | null | undefined;
  occurredAt: string;
  stoppedAt: string | null | undefined;
};

function RegistrationDetailsSection({
  createdByName,
  occurredAt,
  stoppedAt,
}: RegistrationDetailsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={styles.registrationSection}>
      <Pressable
        accessibilityLabel="Ver detalhes de registro"
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        style={({ pressed }) => [styles.registrationToggleHit, pressed && styles.pressed]}
        onPress={() => {
          setIsExpanded((current) => !current);
        }}
      >
        <Text style={styles.registrationToggle}>
          {isExpanded ? "Ocultar detalhes de registro" : "Ver detalhes de registro"}
        </Text>
      </Pressable>

      {isExpanded ? (
        <View style={styles.registrationContent}>
          {createdByName ? <DetailField label="Registrado por" value={createdByName} /> : null}
          <DetailField label="Ocorrido em" value={formatOccurrenceDate(occurredAt)} />
          {stoppedAt ? (
            <DetailField label="Paralisado em" value={formatOccurrenceDate(stoppedAt)} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

type LeadershipDecisionSectionProps = {
  isOnline: boolean;
  isRefreshing: boolean;
  occurrence: OccurrenceDetails;
  onRefresh: () => Promise<unknown>;
};

function LeadershipDecisionSection({
  isOnline,
  isRefreshing,
  occurrence,
  onRefresh,
}: LeadershipDecisionSectionProps) {
  return (
    <View style={styles.sectionCard}>
      <Text accessibilityRole="header" style={styles.sectionCardTitle}>
        Decisão da Liderança
      </Text>
      <View style={styles.leadershipCards}>
        <EvaluationSection
          isOnline={isOnline}
          isRefreshing={isRefreshing}
          occurrence={occurrence}
          onRefresh={onRefresh}
        />
        <InterdicaoSection
          isOnline={isOnline}
          isRefreshing={isRefreshing}
          occurrence={occurrence}
          onRefresh={onRefresh}
        />
      </View>
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
  const { notification: pendingAwarenessNotification, refetch: refetchPendingAwareness } =
    usePendingAwarenessForOccurrence(occurrenceId);

  const listRef = useRef<FlatList<OccurrenceTimelineItem>>(null);
  const reviewSectionRef = useRef<View>(null);
  const hasScrolledToReview = useRef(false);

  const focusMdhoReview = focusSection === "mdho-review";
  const bottomPadding =
    spacing[16] +
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
        <ScreenBackLink
          accessibilityLabel="Voltar para listagem"
          onPress={() => {
            router.replace(stopWorkRoute);
          }}
        />

        <View style={styles.titleRow}>
          <OctagonAlert
            accessible={false}
            color={colors.primary}
            size={HEADER_ICON_SIZE}
            strokeWidth={2}
          />
          <Text accessibilityRole="header" style={styles.pageTitle}>
            Paralisação Preventiva
          </Text>
        </View>

        <Text style={styles.code}>{preventiveStop.publicCode}</Text>
        <Text style={styles.title}>{preventiveStop.title}</Text>

        <View style={styles.badgeRow}>
          <StatusBadge status={preventiveStop.status} />
          <StatusBadge severity={preventiveStop.severity} />
        </View>

        {shouldShowInterdicaoBanner(preventiveStop.status) ? <InterdicaoBanner /> : null}

        {pendingAwarenessNotification ? (
          <NotificationAwarenessBanner
            isOnline={isOnline}
            notificationId={pendingAwarenessNotification.id}
            onConfirmed={() => {
              void refetchPendingAwareness();
            }}
          />
        ) : null}

        <FlowDeadEndBanner hideTratativa={showActionPlanSection} status={preventiveStop.status} />

        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>Onde e quem</Text>
          <DetailField label="Área" value={preventiveStop.areaName ?? "—"} />
          <DetailField label="Local" value={preventiveStop.locationDescription} />
          {preventiveStop.contractorOrganizationName ? (
            <DetailField label="Contratada" value={preventiveStop.contractorOrganizationName} />
          ) : null}
          {coordinates ? (
            <View style={styles.geoRow}>
              <MapPin
                accessible={false}
                color={colors.foregroundMuted}
                size={META_ICON_SIZE}
                strokeWidth={2}
              />
              <Text style={styles.geoText}>{coordinates}</Text>
            </View>
          ) : null}
          <RegistrationDetailsSection
            createdByName={preventiveStop.createdByName}
            occurredAt={preventiveStop.occurredAt}
            stoppedAt={preventiveStop.stoppedAt}
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>O que aconteceu</Text>
          <DetailField label="Atividade" value={preventiveStop.taskDescription} />
          <DetailField label="Condição insegura" value={preventiveStop.conditionDescription} />
          {preventiveStop.immediateActionDescription ? (
            <DetailField
              label="Medida imediata"
              value={preventiveStop.immediateActionDescription}
            />
          ) : null}
        </View>

        <OccurrenceParticipantsSection occurrenceId={occurrenceId} />

        <EvidenceSection occurrenceId={occurrenceId} />

        <LeadershipDecisionSection
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
  }, [
    isFetching,
    isOnline,
    occurrenceId,
    pendingAwarenessNotification,
    preventiveStop,
    refetch,
    refetchPendingAwareness,
    router,
  ]);

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
        <OccurrenceError
          message="Não foi possível carregar a ocorrência."
          onRetry={() => {
            void refetch();
          }}
        />
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
          footerComponent={
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
          }
          headerComponent={headerComponent}
          isOnline={isOnline}
          occurrenceId={occurrenceId}
          occurrenceStatus={preventiveStop.status}
          onPreviewEvidence={handlePreviewEvidence}
        />

        {hseFooter?.visible ? (
          <View style={[styles.stickyFooterHost, styles.stickyFooterAtBottom]}>
            <HseActionsFooter {...hseFooter} />
          </View>
        ) : null}

        {imsRegisterFooter?.visible ? (
          <View style={[styles.stickyFooterHost, styles.stickyFooterAtBottom]}>
            <ImsRegisterFooter
              isOnline={imsRegisterFooter.isOnline}
              isRegistering={imsRegisterFooter.isRegistering}
              onRegister={imsRegisterFooter.onRegister}
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <EvidencePreviewModal
        evidence={previewEvidence}
        occurrenceId={occurrenceId}
        visible={previewEvidence !== null}
        onClose={() => {
          setPreviewEvidence(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  code: {
    color: colors.primary,
    fontFamily: "monospace",
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  field: {
    gap: spacing[1] / 2,
  },
  fieldLabel: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
  },
  fieldValue: {
    color: colors.foreground,
    fontSize: typography.helper.fontSize,
    lineHeight: 18,
  },
  flex: {
    flex: 1,
  },
  geoRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[1],
  },
  geoText: {
    color: colors.foregroundMuted,
    flex: 1,
    fontFamily: "monospace",
    fontSize: typography.caption.fontSize,
  },
  headerContent: {
    gap: spacing[3],
    paddingTop: spacing[2],
  },
  leadershipCards: {
    gap: spacing[3],
  },
  pageTitle: {
    color: colors.foreground,
    flex: 1,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
  },
  pressed: {
    opacity: 0.85,
  },
  registrationContent: {
    gap: spacing[2],
  },
  registrationSection: {
    gap: spacing[2],
    marginTop: spacing[1],
  },
  registrationToggle: {
    color: colors.primary,
    fontSize: typography.helper.fontSize,
    fontWeight: "600",
  },
  registrationToggleHit: {
    justifyContent: "center",
    minHeight: controlHeight.mobile,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing[2],
    padding: spacing[3],
  },
  sectionCardTitle: {
    color: colors.foreground,
    fontSize: typography.label.fontSize,
    fontWeight: "700",
  },
  stickyFooterAtBottom: {
    bottom: 0,
  },
  stickyFooterHost: {
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 3,
  },
  title: {
    color: colors.foreground,
    fontSize: typography.label.fontSize,
    fontWeight: "600",
    lineHeight: 20,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
  },
});
