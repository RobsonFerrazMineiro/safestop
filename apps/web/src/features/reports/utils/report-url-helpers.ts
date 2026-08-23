import type { DashboardPeriodPresetId } from "@/features/dashboard/components/utils/period-presets";
import { DASHBOARD_DEFAULT_PERIOD_PRESET } from "@/features/dashboard/components/utils/period-presets";

export function readCsvParam(searchParams: URLSearchParams, key: string): string[] {
  const raw = searchParams.get(key)?.trim();

  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function writeCsvParam(
  params: URLSearchParams,
  key: string,
  values: string[] | undefined,
): void {
  if (!values || values.length === 0) {
    params.delete(key);
    return;
  }

  params.set(key, values.join(","));
}

export function readOptionalUuid(searchParams: URLSearchParams, key: string): string | null {
  const value = searchParams.get(key)?.trim();
  return value && value.length > 0 ? value : null;
}

export function writeOptionalUuid(
  params: URLSearchParams,
  key: string,
  value: string | null | undefined,
): void {
  if (!value) {
    params.delete(key);
    return;
  }

  params.set(key, value);
}

export function readPeriodPreset(searchParams: URLSearchParams): DashboardPeriodPresetId {
  const value = searchParams.get("period")?.trim();

  if (value === "today" || value === "7d" || value === "30d" || value === "month") {
    return value;
  }

  return DASHBOARD_DEFAULT_PERIOD_PRESET;
}

export function writePeriodPreset(params: URLSearchParams, preset: DashboardPeriodPresetId): void {
  if (preset === DASHBOARD_DEFAULT_PERIOD_PRESET) {
    params.delete("period");
    return;
  }

  params.set("period", preset);
}

export function readSortDirection(
  searchParams: URLSearchParams,
  defaultDirection: "asc" | "desc",
): "asc" | "desc" {
  const value = searchParams.get("dir")?.trim();

  if (value === "asc" || value === "desc") {
    return value;
  }

  return defaultDirection;
}

export function writeSort(
  params: URLSearchParams,
  field: string,
  direction: "asc" | "desc",
  defaultField: string,
  defaultDirection: "asc" | "desc",
): void {
  if (field === defaultField) {
    params.delete("sort");
  } else {
    params.set("sort", field);
  }

  if (direction === defaultDirection) {
    params.delete("dir");
  } else {
    params.set("dir", direction);
  }
}

export function readBooleanFlag(searchParams: URLSearchParams, key: string): boolean {
  return searchParams.get(key) === "1";
}

export function writeBooleanFlag(params: URLSearchParams, key: string, value: boolean): void {
  if (value) {
    params.set(key, "1");
    return;
  }

  params.delete(key);
}

export function buildSearchParamsString(params: URLSearchParams): string {
  const value = params.toString();
  return value.length > 0 ? `?${value}` : "";
}
