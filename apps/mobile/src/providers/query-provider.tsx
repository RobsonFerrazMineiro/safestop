import { AppState, type AppStateStatus } from "react-native";
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";

type QueryProviderProps = {
  children: ReactNode;
};

function configureReactNativeFocusManager(): void {
  focusManager.setEventListener((handleFocus) => {
    const onAppStateChange = (status: AppStateStatus) => {
      if (status === "active") {
        handleFocus();
      }
    };

    const subscription = AppState.addEventListener("change", onAppStateChange);

    return () => {
      subscription.remove();
    };
  });
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  useEffect(() => {
    configureReactNativeFocusManager();
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
