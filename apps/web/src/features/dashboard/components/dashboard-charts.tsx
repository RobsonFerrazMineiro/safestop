"use client";

import type { ComponentType } from "react";
import type { VolumeBucket } from "./use-dashboard-volume-chart";
import { Card, CardContent } from "@/components/ui/card";
import { SurfaceIcon } from "@/components/surface-icon";
import { formatDonutLegendValue } from "../utils/format-donut-legend";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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
  titleIcon: ComponentType<{ className?: string }>;
  buckets: ChartBucket[];
  emptyMessage: string;
};

type ChartTooltipEntry = {
  value?: number;
  name?: string;
  payload?: ChartBucket;
};

const CHART_PRIMARY = "#F97316";
const CHART_TICK = "#9CA3AF";
const CHART_GRID = "#2E3440";
const CHART_TOOLTIP_BG = "#2A303B";
const CHART_TOOLTIP_BORDER = "#2E3440";
const DONUT_GAP = "#171a21";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ChartTooltipEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const title = payload[0]?.payload?.label ?? payload[0]?.name ?? label ?? "";

  return (
    <div
      className="rounded-md border px-3 py-2 text-xs shadow-md"
      style={{
        background: CHART_TOOLTIP_BG,
        borderColor: CHART_TOOLTIP_BORDER,
        color: "#F3F4F6",
      }}
    >
      <p className="font-medium">{title}</p>
      <p className="tabular-nums text-muted-foreground">Quantidade: {payload[0]?.value ?? 0}</p>
    </div>
  );
}

function ChartTitle({
  title,
  icon: Icon,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold">
      <SurfaceIcon className="text-muted-foreground" icon={Icon} variant="chart" />
      {title}
    </h2>
  );
}

export function DashboardMainChart({
  title,
  titleIcon,
  buckets,
  emptyMessage,
}: DashboardChartProps) {
  const isEmpty = buckets.every((bucket) => bucket.count === 0);

  return (
    <Card className="h-full py-4">
      <CardContent className="flex flex-col gap-3">
        <ChartTitle icon={titleIcon} title={title} />

        {isEmpty ? (
          <p className="text-sm text-muted-foreground" role="status">
            {emptyMessage}
          </p>
        ) : (
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
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(249, 115, 22, 0.12)" }} />
                <Bar dataKey="count" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardDistributionChart({
  title,
  titleIcon,
  buckets,
  emptyMessage,
}: DashboardChartProps) {
  const isEmpty = buckets.every((bucket) => bucket.count === 0);
  const chartHeight = Math.max(buckets.length * 36, 160);

  return (
    <Card className="h-full py-4">
      <CardContent className="flex flex-col gap-3">
        <ChartTitle icon={titleIcon} title={title} />

        {isEmpty ? (
          <p className="text-sm text-muted-foreground" role="status">
            {emptyMessage}
          </p>
        ) : (
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
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(249, 115, 22, 0.12)" }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {buckets.map((bucket) => (
                    <Cell fill={bucket.fill ?? CHART_PRIMARY} key={bucket.label} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardStatusDonutChart({
  title,
  titleIcon,
  buckets,
  emptyMessage,
}: DashboardChartProps) {
  const isEmpty = buckets.every((bucket) => bucket.count === 0);
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const slices = buckets.filter((bucket) => bucket.count > 0);

  return (
    <Card className="h-full py-4">
      <CardContent className="flex flex-col gap-4">
        <ChartTitle icon={titleIcon} title={title} />

        {isEmpty ? (
          <p className="text-sm text-muted-foreground" role="status">
            {emptyMessage}
          </p>
        ) : (
          <div className="flex items-center gap-3">
            <div aria-label={title} className="h-36 w-36 shrink-0" role="img">
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie
                    cx="50%"
                    cy="50%"
                    data={slices}
                    dataKey="count"
                    innerRadius="58%"
                    nameKey="label"
                    outerRadius="82%"
                    paddingAngle={2}
                    stroke={DONUT_GAP}
                    strokeWidth={3}
                  >
                    {slices.map((bucket) => (
                      <Cell fill={bucket.fill ?? CHART_PRIMARY} key={bucket.label} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <ul className="flex min-w-0 flex-1 flex-col gap-2">
              {buckets.map((bucket) => (
                <li className="flex items-center justify-between gap-3 text-sm" key={bucket.label}>
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ background: bucket.fill ?? CHART_PRIMARY }}
                    />
                    <span className="truncate">{bucket.label}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatDonutLegendValue(bucket.count, total)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
