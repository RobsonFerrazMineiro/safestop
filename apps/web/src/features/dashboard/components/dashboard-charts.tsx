"use client";

import type { VolumeBucket } from "./use-dashboard-volume-chart";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartBucket = VolumeBucket & {
  fill?: string;
};

type DashboardChartProps = {
  title: string;
  buckets: ChartBucket[];
  emptyMessage: string;
};

const CHART_PRIMARY = "#F97316";
const CHART_TICK = "#9CA3AF";
const CHART_GRID = "#2E3440";
const CHART_TOOLTIP_BG = "#2A303B";
const CHART_TOOLTIP_BORDER = "#2E3440";

function AccessibleChartTable({
  buckets,
  firstColumnLabel,
}: {
  buckets: ChartBucket[];
  firstColumnLabel: string;
}) {
  return (
    <details className="text-xs text-muted-foreground">
      <summary className="cursor-pointer text-primary hover:text-primary/90">
        Ver dados do gráfico
      </summary>
      <table className="mt-2 w-full border-collapse">
        <thead>
          <tr>
            <th className="border border-border px-2 py-1 text-left">{firstColumnLabel}</th>
            <th className="border border-border px-2 py-1 text-right">Quantidade</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket) => (
            <tr key={bucket.label}>
              <td className="border border-border px-2 py-1">{bucket.label}</td>
              <td className="border border-border px-2 py-1 text-right tabular-nums">
                {bucket.count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className="rounded-md border px-3 py-2 text-xs shadow-md"
      style={{
        background: CHART_TOOLTIP_BG,
        borderColor: CHART_TOOLTIP_BORDER,
        color: "#F3F4F6",
      }}
    >
      <p className="font-medium">{label}</p>
      <p className="tabular-nums text-muted-foreground">Quantidade: {payload[0]?.value ?? 0}</p>
    </div>
  );
}

export function DashboardMainChart({ title, buckets, emptyMessage }: DashboardChartProps) {
  const isEmpty = buckets.every((bucket) => bucket.count === 0);

  return (
    <Card className="hidden py-4 md:block">
      <CardContent className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>

        {isEmpty ? (
          <p className="text-sm text-muted-foreground" role="status">
            {emptyMessage}
          </p>
        ) : (
          <>
            <div aria-label={title} className="h-48" role="img">
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={buckets} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid stroke={CHART_GRID} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: CHART_TICK, fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: CHART_GRID }}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tick={{ fill: CHART_TICK, fontSize: 10 }}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "rgba(249, 115, 22, 0.12)" }}
                  />
                  <Bar dataKey="count" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <AccessibleChartTable buckets={buckets} firstColumnLabel="Período" />
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardDistributionChart({ title, buckets, emptyMessage }: DashboardChartProps) {
  const isEmpty = buckets.every((bucket) => bucket.count === 0);
  const chartHeight = Math.max(buckets.length * 36, 160);

  return (
    <Card className="hidden py-4 md:block">
      <CardContent className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>

        {isEmpty ? (
          <p className="text-sm text-muted-foreground" role="status">
            {emptyMessage}
          </p>
        ) : (
          <>
            <div aria-label={title} role="img" style={{ height: chartHeight }}>
              <ResponsiveContainer height="100%" width="100%">
                <BarChart
                  data={buckets}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid horizontal={false} stroke={CHART_GRID} />
                  <XAxis
                    allowDecimals={false}
                    axisLine={{ stroke: CHART_GRID }}
                    tick={{ fill: CHART_TICK, fontSize: 10 }}
                    tickLine={false}
                    type="number"
                  />
                  <YAxis
                    axisLine={false}
                    dataKey="label"
                    tick={{ fill: CHART_TICK, fontSize: 11 }}
                    tickLine={false}
                    type="category"
                    width={128}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "rgba(249, 115, 22, 0.12)" }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {buckets.map((bucket) => (
                      <Cell fill={bucket.fill ?? CHART_PRIMARY} key={bucket.label} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <AccessibleChartTable buckets={buckets} firstColumnLabel="Categoria" />
          </>
        )}
      </CardContent>
    </Card>
  );
}
