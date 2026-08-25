"use client";

import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

type UiProvidersProps = {
  children: ReactNode;
};

export function UiProviders({ children }: UiProvidersProps) {
  return (
    <TooltipProvider>
      {children}
      <Toaster />
    </TooltipProvider>
  );
}
