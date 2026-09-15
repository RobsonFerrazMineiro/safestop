import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import { AuthProvider, QueryProvider } from "@/providers";
import { AuthorizationProvider } from "@/features/authorization";
import { OrganizationProvider } from "@/features/organization/provider/organization-provider";
import { WorkspaceProvider } from "@/features/workspace";
import { UiProviders } from "@/components/ui/ui-providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SafeStop",
  description:
    "Painel Web do SafeStop — comunicação e gestão de Paralisações Preventivas e Interdições Oficiais.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" className={`dark ${inter.variable}`}>
      <body>
        <QueryProvider>
          <AuthProvider>
            <OrganizationProvider>
              <AuthorizationProvider>
                <WorkspaceProvider>
                  <UiProviders>{children}</UiProviders>
                </WorkspaceProvider>
              </AuthorizationProvider>
            </OrganizationProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
