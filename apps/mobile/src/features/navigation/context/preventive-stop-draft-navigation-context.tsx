import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from "react";

import { confirmPreventiveStopDraftLeave } from "../utils/confirm-preventive-stop-draft-leave";

export type PreventiveStopDraftLeaveGuard = {
  shouldConfirmLeave: () => boolean;
  persistBeforeLeave: () => Promise<void>;
};

type PreventiveStopDraftNavigationContextValue = {
  registerDraftLeaveGuard: (guard: PreventiveStopDraftLeaveGuard | null) => void;
  requestNavigation: (action: () => void) => void;
};

const PreventiveStopDraftNavigationContext =
  createContext<PreventiveStopDraftNavigationContextValue | null>(null);

type PreventiveStopDraftNavigationProviderProps = {
  children: ReactNode;
};

export function PreventiveStopDraftNavigationProvider({
  children,
}: PreventiveStopDraftNavigationProviderProps) {
  const draftLeaveGuardRef = useRef<PreventiveStopDraftLeaveGuard | null>(null);

  const registerDraftLeaveGuard = useCallback((guard: PreventiveStopDraftLeaveGuard | null) => {
    draftLeaveGuardRef.current = guard;
  }, []);

  const requestNavigation = useCallback((action: () => void) => {
    const guard = draftLeaveGuardRef.current;
    const shouldConfirm = guard?.shouldConfirmLeave() ?? false;

    if (!shouldConfirm) {
      action();
      return;
    }

    confirmPreventiveStopDraftLeave(async () => {
      await guard?.persistBeforeLeave();
      action();
    });
  }, []);

  const value = useMemo(
    () => ({
      registerDraftLeaveGuard,
      requestNavigation,
    }),
    [registerDraftLeaveGuard, requestNavigation],
  );

  return (
    <PreventiveStopDraftNavigationContext.Provider value={value}>
      {children}
    </PreventiveStopDraftNavigationContext.Provider>
  );
}

export function usePreventiveStopDraftNavigation(): PreventiveStopDraftNavigationContextValue {
  const context = useContext(PreventiveStopDraftNavigationContext);

  if (!context) {
    throw new Error(
      "usePreventiveStopDraftNavigation must be used within PreventiveStopDraftNavigationProvider",
    );
  }

  return context;
}
