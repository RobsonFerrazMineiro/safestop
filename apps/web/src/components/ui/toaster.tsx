"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Infra Sonner — Sprint 3.4. Tema dark alinhado ao fundo grafite SafeStop.
 * Nenhum fluxo dispara toast nesta entrega; apenas montagem no root layout.
 */
export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-popover group-[.toaster]:text-popover-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
