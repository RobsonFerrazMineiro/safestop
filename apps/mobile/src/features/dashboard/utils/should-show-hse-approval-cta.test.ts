import { describe, expect, it } from "vitest";

import { shouldShowHseApprovalCta } from "./should-show-hse-approval-cta";

describe("shouldShowHseApprovalCta", () => {
  it("sem mdho.approve (canViewHseQueue=false) oculta mesmo com count > 0", () => {
    expect(
      shouldShowHseApprovalCta({
        canViewHseQueue: false,
        mdhoPendingApproval: 3,
        operationalMetricKeys: ["scopedOpenOccurrences"],
      }),
    ).toBe(false);
  });

  it("permissão + count 0 oculta o CTA", () => {
    expect(
      shouldShowHseApprovalCta({
        canViewHseQueue: true,
        mdhoPendingApproval: 0,
        operationalMetricKeys: ["scopedOpenOccurrences", "scopedPendingAwareness"],
      }),
    ).toBe(false);
  });

  it("permissão + count > 0 e KPI fora do grid exibe o CTA", () => {
    expect(
      shouldShowHseApprovalCta({
        canViewHseQueue: true,
        mdhoPendingApproval: 1,
        operationalMetricKeys: ["scopedOpenOccurrences", "scopedPendingAwareness"],
      }),
    ).toBe(true);
  });

  it("anti-duplicação: KPI já no grid oculta o CTA", () => {
    expect(
      shouldShowHseApprovalCta({
        canViewHseQueue: true,
        mdhoPendingApproval: 2,
        operationalMetricKeys: ["mdhoPendingApproval", "scopedOpenOccurrences"],
      }),
    ).toBe(false);
  });

  it("Platform Admin (canViewHseQueue=false) oculta mesmo com count > 0", () => {
    expect(
      shouldShowHseApprovalCta({
        canViewHseQueue: false,
        mdhoPendingApproval: 5,
        operationalMetricKeys: [],
      }),
    ).toBe(false);
  });

  it("loading / KPI null não exibe CTA prematuro", () => {
    expect(
      shouldShowHseApprovalCta({
        canViewHseQueue: true,
        mdhoPendingApproval: null,
        operationalMetricKeys: [],
      }),
    ).toBe(false);

    expect(
      shouldShowHseApprovalCta({
        canViewHseQueue: true,
        mdhoPendingApproval: undefined,
        operationalMetricKeys: [],
      }),
    ).toBe(false);
  });
});
