import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Gate 10 — Convergência Enterprise de governança, administração e contas", () => {
  const hseSource = readFileSync(
    resolve(__dirname, "../hse-approval/components/hse-approval-queue-container.tsx"),
    "utf8",
  );
  const contactsSource = readFileSync(
    resolve(__dirname, "../organization-contacts/components/organization-contacts-container.tsx"),
    "utf8",
  );
  const createSource = readFileSync(
    resolve(__dirname, "../stop-work/components/stop-work-create-container.tsx"),
    "utf8",
  );
  const notificationsSource = readFileSync(
    resolve(__dirname, "../notifications/components/notification-center-container.tsx"),
    "utf8",
  );
  const profileSource = readFileSync(
    resolve(__dirname, "../profile/components/profile-page.tsx"),
    "utf8",
  );
  const organizationsSource = readFileSync(
    resolve(__dirname, "../organization/components/organization-selector.tsx"),
    "utf8",
  );

  it("adota PageShell nas seis rotas do Gate 10", () => {
    expect(hseSource).toContain('<PageShell className="gap-6" width="wide">');
    expect(contactsSource).toContain('<PageShell className="gap-6" width="wide">');
    expect(createSource).toContain('<PageShell className="gap-6" width="default">');
    expect(notificationsSource).toContain('<PageShell className="gap-6" width="default">');
    expect(profileSource).toContain('<PageShell className="gap-6" width="default">');
    expect(organizationsSource).toContain('<PageShell className="gap-6" width="default">');

    expect(hseSource).not.toContain("QUEUE_SHELL_CLASS");
    expect(contactsSource).not.toContain("CONTACTS_SHELL_CLASS");
  });

  it("aplica os eyebrows oficiais de cada rota", () => {
    expect(hseSource).toContain('eyebrow="GOVERNANÇA E SEGURANÇA"');
    expect(contactsSource).toContain('eyebrow="ADMINISTRAÇÃO DA COMUNICAÇÃO"');
    expect(createSource).toContain('eyebrow="REGISTRO OPERACIONAL"');
    expect(notificationsSource).toContain('eyebrow="CENTRAL DE ALERTAS"');
    expect(profileSource).toContain('eyebrow="CONTA DO USUÁRIO"');
    expect(organizationsSource).toContain('eyebrow="ACESSO ORGANIZACIONAL"');
  });

  it("usa FilterShell em organization-contacts e preserva selects nativos", () => {
    expect(contactsSource).toContain(
      'import { FilterField, FilterShell } from "@/components/filter-shell";',
    );
    expect(contactsSource).toContain('title="Filtros"');
    expect(contactsSource).toContain("<select");
    expect(contactsSource).not.toContain("SelectTrigger");
  });

  it("não introduz FilterShell em notifications nem em stop-work/new", () => {
    expect(notificationsSource).not.toContain("FilterShell");
    expect(createSource).not.toContain("FilterShell");
  });

  it("preserva máquina crítica de Nova Paralisação e distinção leitura ≠ ciência", () => {
    expect(createSource).toContain("usePreventiveStopDraft");
    expect(createSource).toContain("flushDraft");
    expect(createSource).toContain("beforeunload");
    expect(createSource).toContain("onPopState");
    expect(createSource).toContain("createPreventiveStopSchema");
    expect(createSource).toContain("createPreventiveStop");

    expect(notificationsSource).toContain("useMarkNotificationRead");
    expect(notificationsSource).toContain("useConfirmNotificationAwareness");
    expect(notificationsSource).toContain("pendingAwarenessCount");
    expect(notificationsSource).toContain("handleConfirmAwareness");
  });

  it("preserva Organization e multi-tenant no seletor", () => {
    expect(organizationsSource).toContain("setActiveOrganization");
    expect(organizationsSource).toContain("useOrganizations");
    expect(organizationsSource).not.toContain("Workspace");
    expect(organizationsSource).toContain('router.push("/")');
  });
});
