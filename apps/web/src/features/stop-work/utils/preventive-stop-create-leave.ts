import type { PreventiveStopDraftInput } from "@safestop/validation";

import { hasPreventiveStopDraftContent } from "../stores/preventive-stop-draft-store";

export const PREVENTIVE_STOP_CREATE_PATH = "/stop-work/new";
export const PREVENTIVE_STOP_CREATE_LEAVE_FALLBACK_HREF = "/stop-work";

export function isInternalPreventiveStopCreateExit(
  href: string,
  origin: string,
  currentPath: string = PREVENTIVE_STOP_CREATE_PATH,
): boolean {
  try {
    const url = new URL(href, origin);

    if (url.origin !== origin) {
      return false;
    }

    const path = url.pathname.replace(/\/$/, "") || "/";
    return path !== currentPath;
  } catch {
    return false;
  }
}

export function shouldPromptPreventiveStopCreateLeave(input: {
  allowLeave: boolean;
  values: PreventiveStopDraftInput;
}): boolean {
  return !input.allowLeave && hasPreventiveStopDraftContent(input.values);
}

export type CreatePopStateAction = "ignore" | "allow" | "restore-and-prompt";

export function resolveCreatePopStateAction(input: {
  allowLeave: boolean;
  isRestoringGuard: boolean;
  hasRelevantContent: boolean;
}): CreatePopStateAction {
  if (input.allowLeave || input.isRestoringGuard) {
    return "ignore";
  }

  if (!input.hasRelevantContent) {
    return "allow";
  }

  return "restore-and-prompt";
}

export type CreateLeaveConfirmAction = { type: "history-back" } | { type: "push"; href: string };

export function resolveCreateLeaveConfirmAction(input: {
  isHistoryLeave: boolean;
  pendingHref: string | null;
  fallbackHref?: string;
}): CreateLeaveConfirmAction {
  if (input.isHistoryLeave) {
    return { type: "history-back" };
  }

  return {
    type: "push",
    href: input.pendingHref ?? input.fallbackHref ?? PREVENTIVE_STOP_CREATE_LEAVE_FALLBACK_HREF,
  };
}
