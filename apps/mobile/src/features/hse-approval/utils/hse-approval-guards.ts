import {
  canApproveMdhoAssessment,
  canReturnMdhoAssessment,
  showHseApprovalQueue,
  type MdhoAssessmentStatus,
} from "@safestop/types";

export { showHseApprovalQueue };

export function canApproveHse(params: {
  canApprove: boolean;
  isPlatformAdmin: boolean;
  status: MdhoAssessmentStatus | null;
  submittedBy: string | null;
  currentUserId: string | undefined;
}): boolean {
  if (params.status !== "SUBMITTED" || !params.currentUserId) {
    return false;
  }

  return canApproveMdhoAssessment({
    assessment: {
      status: params.status,
      submittedBy: params.submittedBy,
    },
    userId: params.currentUserId,
    permissions: { mdhoApprove: params.canApprove },
    isPlatformAdmin: params.isPlatformAdmin,
  });
}

export function canReturnHse(params: {
  canReturn: boolean;
  isPlatformAdmin: boolean;
  status: MdhoAssessmentStatus | null;
}): boolean {
  if (params.status !== "SUBMITTED") {
    return false;
  }

  return canReturnMdhoAssessment({
    assessment: { status: params.status },
    permissions: { mdhoReturn: params.canReturn },
    isPlatformAdmin: params.isPlatformAdmin,
  });
}
