// Supabase-generated types (packages/types/src/database.types.ts) must never
// be edited manually — see docs/engineering.md §17.16 and
// .cursor/rules/004-supabase.mdc. Re-exported here so apps consume the
// database schema exclusively through this package.
export type { Database, Json } from "./database.types";
export { PERMISSION_CODES, isPermissionCode } from "./permission-codes";
export type { PermissionCode } from "./permission-codes";

export {
  OCCURRENCE_DECISION_TYPES,
  OCCURRENCE_SEVERITIES,
  OCCURRENCE_STATUSES,
  OCCURRENCE_SYNC_STATES,
  isOccurrenceDecisionType,
  isOccurrenceSeverity,
  isOccurrenceStatus,
} from "./occurrence-status";
export type {
  OccurrenceDecisionType,
  OccurrenceSeverity,
  OccurrenceStatus,
  OccurrenceSyncState,
} from "./occurrence-status";

export type {
  OccurrenceDetails,
  OccurrenceListFilters,
  OccurrenceStatusHistoryEntry,
  OccurrenceSummary,
} from "./occurrence";

export {
  OCCURRENCE_ATTACHMENT_BUCKET,
  OCCURRENCE_ATTACHMENT_CAPTION_MAX_LENGTH,
  OCCURRENCE_ATTACHMENT_MAX_COUNT_PER_OCCURRENCE,
  OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES,
  OCCURRENCE_ATTACHMENT_MIME_TYPES,
  OCCURRENCE_ATTACHMENT_SIGNED_URL_TTL_SECONDS,
  OCCURRENCE_ATTACHMENT_TYPES,
  OCCURRENCE_ATTACHMENT_UPLOAD_STATUSES,
  isOccurrenceAttachmentMimeType,
  isOccurrenceAttachmentType,
  isOccurrenceAttachmentUploadStatus,
} from "./occurrence-attachment";
export type {
  OccurrenceAttachmentMimeType,
  OccurrenceAttachmentSignedUrlResult,
  OccurrenceAttachmentSummary,
  OccurrenceAttachmentType,
  OccurrenceAttachmentUploadStatus,
  PrepareOccurrenceAttachmentUploadResult,
} from "./occurrence-attachment";

export {
  PREVENTIVE_STOP_DEFAULT_STATUS,
  PREVENTIVE_STOP_LIST_FILTER_STATUSES,
  PREVENTIVE_STOP_STATUSES,
  PREVENTIVE_STOP_TITLE_MAX_LENGTH,
  isPreventiveStopStatus,
} from "./preventive-stop";
export type {
  OrganizationContractOption,
  OrganizationContractorOption,
  PreventiveStopListFilters,
  PreventiveStopStatus,
} from "./preventive-stop";

export {
  OCCURRENCE_COMMENT_EDIT_WINDOW_HOURS,
  OCCURRENCE_COMMENT_MAX_LENGTH,
  OCCURRENCE_COMMENT_TYPES,
  USER_CREATABLE_COMMENT_TYPES,
  isOccurrenceCommentType,
  isUserCreatableCommentType,
} from "./occurrence-comment";
export type {
  CreateOccurrenceCommentResult,
  DeleteOccurrenceCommentResult,
  OccurrenceComment,
  OccurrenceCommentType,
  UpdateOccurrenceCommentResult,
  UserCreatableCommentType,
} from "./occurrence-comment";

export {
  OCCURRENCE_TIMELINE_DEFAULT_PAGE_SIZE,
  OCCURRENCE_TIMELINE_EVENT_KINDS,
  OCCURRENCE_TIMELINE_STALE_TIME_MS,
  OCCURRENCE_TIMELINE_TITLES,
  formatTimelineTitle,
  isOccurrenceTimelineEventKind,
} from "./occurrence-timeline";
export type {
  GetOccurrenceTimelineResult,
  OccurrenceTimelineEventKind,
  OccurrenceTimelineItem,
  TimelineCursor,
  TimelineCursorPayload,
} from "./occurrence-timeline";

export {
  OCCURRENCE_CONFLICT_ERROR_CODES,
  OCCURRENCE_DECISION_REASON_MAX_LENGTH,
  OCCURRENCE_DECISION_REASON_MIN_LENGTH,
  hasOccurrenceDecision,
  isInterdicaoDecisionBranch,
  isOccurrenceConflictErrorCode,
  isVerEAgirDecisionBranch,
} from "./occurrence-decision";
export type {
  OccurrenceConflictError,
  OccurrenceConflictErrorCode,
  OccurrenceDecision,
  OccurrenceDecisionSnapshot,
  OccurrenceTransitionResult,
  RecordInterdicaoDecisionInput,
  RecordInterdicaoDecisionResult,
  RecordOccurrenceDecisionOccurrenceSnapshot,
  RecordOccurrenceDecisionResult,
  RecordVerEAgirDecisionInput,
  RecordVerEAgirDecisionOccurrenceSnapshot,
  RecordVerEAgirDecisionResult,
  StartEvaluationResult,
} from "./occurrence-decision";

export {
  MDHO_CATEGORY_CODES,
  MDHO_DEVIATION_TYPE_CATEGORY_CODE,
  MDHO_OTHER_OPTION_CODE,
  isMdhoCategoryCode,
} from "./mdho-catalog";
export type {
  MdhoCatalog,
  MdhoCatalogCategory,
  MdhoCatalogOption,
  MdhoCategoryCode,
} from "./mdho-catalog";

export {
  MDHO_ASSESSMENT_STATUSES,
  MDHO_COMPLEMENT_MAX_LENGTH,
  MDHO_CONFLICT_ERROR_CODES,
  MDHO_OTHER_DETAIL_MIN_LENGTH,
  MDHO_RETURN_REASON_MAX_LENGTH,
  MDHO_RETURN_REASON_MIN_LENGTH,
  isMdhoAssessmentStatus,
  isMdhoConflictErrorCode,
  isMdhoEditableStatus,
  isMdhoEligible,
} from "./mdho-assessment";
export type {
  ApproveMdhoAssessmentResult,
  MdhoAssessment,
  MdhoAssessmentSnapshot,
  MdhoAssessmentStatus,
  MdhoConflictError,
  MdhoConflictErrorCode,
  MdhoEligibilityOccurrence,
  MdhoOccurrenceSnapshot,
  MdhoSelection,
  MdhoSelectionInput,
  ReturnMdhoAssessmentResult,
  ReturnMdhoInput,
  SaveMdhoDraftInput,
  SaveMdhoDraftResult,
  StartMdhoAssessmentResult,
  SubmitMdhoAssessmentResult,
  SubmitMdhoInput,
} from "./mdho-assessment";
