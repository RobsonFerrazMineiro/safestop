import { describe, expect, it } from "vitest";

import { formatDonutLegendValue } from "./format-donut-legend";

describe("formatDonutLegendValue", () => {
  it("formata quantidade e percentual inteiro", () => {
    expect(formatDonutLegendValue(4, 16)).toBe("4 · 25%");
    expect(formatDonutLegendValue(0, 16)).toBe("0 · 0%");
  });

  it("evita divisão por zero", () => {
    expect(formatDonutLegendValue(0, 0)).toBe("0 · 0%");
  });
});
