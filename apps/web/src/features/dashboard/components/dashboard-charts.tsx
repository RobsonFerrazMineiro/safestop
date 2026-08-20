"use client";

import type { VolumeBucket } from "./use-dashboard-volume-chart";

type BarChartProps = {
  title: string;
  buckets: VolumeBucket[];
  emptyMessage: string;
  vertical?: boolean;
};

function BarChart({ title, buckets, emptyMessage, vertical = true }: BarChartProps) {
  const max = Math.max(...buckets.map((bucket) => bucket.count), 1);
  const isEmpty = buckets.every((bucket) => bucket.count === 0);

  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="text-sm font-semibold text-gray-200">{title}</figcaption>

      {isEmpty ? (
        <p className="text-sm text-gray-500" role="status">
          {emptyMessage}
        </p>
      ) : (
        <>
          <div
            aria-label={title}
            className={
              vertical
                ? "flex h-48 items-end gap-2 border-b border-gray-800 pb-2"
                : "flex flex-col gap-2"
            }
            role="img"
          >
            {buckets.map((bucket) => {
              const heightPercent = vertical ? Math.round((bucket.count / max) * 100) : undefined;
              const widthPercent = !vertical ? Math.round((bucket.count / max) * 100) : undefined;

              return (
                <div
                  key={bucket.label}
                  className={
                    vertical ? "flex flex-1 flex-col items-center gap-1" : "flex items-center gap-2"
                  }
                  title={`${bucket.label}: ${bucket.count}`}
                >
                  {vertical ? (
                    <>
                      <div
                        className="w-full rounded-t bg-orange-500/80"
                        style={{ height: `${Math.max(heightPercent ?? 0, 4)}%` }}
                      />
                      <span className="max-w-full truncate text-[10px] text-gray-500">
                        {bucket.label}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="w-32 shrink-0 truncate text-xs text-gray-400">
                        {bucket.label}
                      </span>
                      <div className="h-3 flex-1 rounded bg-gray-900">
                        <div
                          className="h-full rounded bg-orange-500/80"
                          style={{ width: `${Math.max(widthPercent ?? 0, 2)}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-xs tabular-nums text-gray-300">
                        {bucket.count}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <details className="text-xs text-gray-400">
            <summary className="cursor-pointer text-orange-400 hover:text-orange-300">
              Ver dados do gráfico
            </summary>
            <table className="mt-2 w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-800 px-2 py-1 text-left">Período</th>
                  <th className="border border-gray-800 px-2 py-1 text-right">Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {buckets.map((bucket) => (
                  <tr key={bucket.label}>
                    <td className="border border-gray-800 px-2 py-1">{bucket.label}</td>
                    <td className="border border-gray-800 px-2 py-1 text-right tabular-nums">
                      {bucket.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </figure>
  );
}

export function DashboardMainChart(props: Omit<BarChartProps, "vertical">) {
  return (
    <section className="hidden rounded-lg border border-gray-800 bg-gray-900/40 p-4 lg:block">
      <BarChart {...props} vertical />
    </section>
  );
}

export function DashboardDistributionChart(props: Omit<BarChartProps, "vertical">) {
  return (
    <section className="hidden rounded-lg border border-gray-800 bg-gray-900/40 p-4 lg:block">
      <BarChart {...props} vertical={false} />
    </section>
  );
}
