import { expect, test } from "@playwright/test";

import {
  QA_ALPHA_ORG,
  QA_USERS,
  REPORT_ROUTES,
  exportFromMenu,
  fetchLatestExportAudit,
  loadSupabaseEnv,
  loginThroughUi,
  signInWithPassword,
} from "./helpers/reports-qa";

test.describe("Reports Sprint 3.3 — Web E2E", () => {
  test("REP-WEB-01: login gestor acessa hub e 3 relatórios", async ({ page }) => {
    await loginThroughUi(page, QA_USERS.gestor);

    await page.goto("/reports");
    await expect(page.getByTestId("reports-hub")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Relatórios" })).toBeVisible();

    await page.goto("/reports/occurrences");
    await expect(page.getByTestId("report-occurrences-page")).toBeVisible();
    await expect(page.getByTestId("report-forbidden")).toHaveCount(0);

    await page.goto("/reports/action-items");
    await expect(page.getByTestId("report-action-items-page")).toBeVisible();
    await expect(page.getByTestId("report-forbidden")).toHaveCount(0);

    await page.goto("/reports/awareness");
    await expect(page.getByTestId("report-awareness-page")).toBeVisible();
    await expect(page.getByTestId("report-forbidden")).toHaveCount(0);
  });

  test("REP-WEB-02: no-results com filtro ativo", async ({ page }) => {
    await loginThroughUi(page, QA_USERS.gestor);

    await page.goto("/reports/occurrences?search=ZZZ-REP-NO-MATCH-999");
    await expect(page.getByTestId("report-no-results")).toBeVisible();
    await expect(
      page.getByText("Nenhum registro corresponde aos filtros selecionados."),
    ).toBeVisible();
  });

  test("REP-WEB-03: export CSV/XLSX com filtros e auditoria", async ({ page }) => {
    const { apiUrl, anonKey } = loadSupabaseEnv();
    const token = await signInWithPassword(apiUrl, anonKey, QA_USERS.gestor);
    const filterMarker = "ZZZ-REP-FILTER-MARKER";
    const auditBefore = await fetchLatestExportAudit(apiUrl, anonKey, token, QA_ALPHA_ORG);

    await loginThroughUi(page, QA_USERS.gestor);
    await page.goto(`/reports/occurrences?search=${encodeURIComponent(filterMarker)}`);

    const csvDownload = await exportFromMenu(page, "csv");
    expect(csvDownload.suggestedFilename.toLowerCase()).toContain(".csv");

    await page.waitForTimeout(1_500);

    const auditAfterCsv = await fetchLatestExportAudit(apiUrl, anonKey, token, QA_ALPHA_ORG);
    expect(auditAfterCsv).not.toBeNull();
    expect(auditAfterCsv?.report_type).toBe("OCCURRENCES");
    expect(auditAfterCsv?.export_format).toBe("CSV");
    expect(auditAfterCsv?.row_count).toBeGreaterThanOrEqual(0);
    expect(auditAfterCsv?.filters).toMatchObject({ search: filterMarker });

    if (auditBefore?.id) {
      expect(auditAfterCsv?.id).not.toBe(auditBefore.id);
    }

    const xlsxDownload = await exportFromMenu(page, "xlsx");
    expect(xlsxDownload.suggestedFilename.toLowerCase()).toContain(".xlsx");

    await page.waitForTimeout(1_500);

    const auditAfterXlsx = await fetchLatestExportAudit(apiUrl, anonKey, token, QA_ALPHA_ORG);
    expect(auditAfterXlsx?.export_format).toBe("XLSX");
    expect(auditAfterXlsx?.report_type).toBe("OCCURRENCES");
    expect(auditAfterXlsx?.filters).toMatchObject({ search: filterMarker });
  });

  test("REP-WEB-06: export error exibe banner retry", async ({ page }) => {
    await loginThroughUi(page, QA_USERS.gestor);
    await page.goto("/reports/occurrences");

    await page.route("**/rest/v1/rpc/list_occurrences_report", (route) => {
      void route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "VALIDATION_ERROR: simulated" }),
      });
    });

    await page.getByTestId("report-export-trigger").click();
    await page.getByTestId("report-export-csv").click();
    await expect(page.getByTestId("report-export-error")).toBeVisible({ timeout: 15_000 });
  });

  test("REP-WEB-04: usuário sem report.read — URL direta bloqueada", async ({ page }) => {
    await loginThroughUi(page, QA_USERS.field);

    for (const route of REPORT_ROUTES) {
      await page.goto(route);
      await expect(page.getByTestId("report-forbidden")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Acesso negado" })).toBeVisible();
      await expect(
        page.getByText("Você não tem permissão para visualizar relatórios."),
      ).toBeVisible();
    }
  });

  test("REP-WEB-05: login não exibe hydration mismatch", async ({ page }) => {
    const hydrationErrors: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error" && /hydration/i.test(message.text())) {
        hydrationErrors.push(message.text());
      }
    });

    await page.goto("/login");
    await page.getByTestId("login-email").waitFor({ state: "visible", timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "SafeStop" })).toBeVisible();
    await page.waitForTimeout(500);

    expect(hydrationErrors).toEqual([]);
  });
});
