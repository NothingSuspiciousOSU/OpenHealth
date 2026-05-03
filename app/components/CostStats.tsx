import React, { useMemo } from "react";

type Procedure = {
  _id: string;
  allowedAmount: bigint;
  insurance: { providerName: string };
};

export function CostStats({ results, loading }: { results: Procedure[], loading?: boolean }) {
  const { barData, scatterData, maxCost } = useMemo(() => {
    if (!results || results.length === 0) return { barData: [], scatterData: {}, maxCost: 0 };

    const providerMap: Record<string, { total: number; count: number; costs: number[] }> = {};
    let globalMaxCost = 0;

    results.forEach((r) => {
      const provider = r.insurance.providerName || "Unknown";
      const cost = Number(r.allowedAmount);
      if (cost > globalMaxCost) globalMaxCost = cost;

      if (!providerMap[provider]) {
        providerMap[provider] = { total: 0, count: 0, costs: [] };
      }
      providerMap[provider].total += cost;
      providerMap[provider].count += 1;
      providerMap[provider].costs.push(cost);
    });

    const bars = Object.keys(providerMap).map((provider) => ({
      provider,
      avgCost: Math.round(providerMap[provider].total / providerMap[provider].count),
    }));

    return { barData: bars, scatterData: providerMap, maxCost: globalMaxCost };
  }, [results]);

  if (loading) {
    return (
      <div className="mb-8 grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4 h-5 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-3 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
                <div className="h-6 flex-1 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4 h-5 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="space-y-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-3 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
                <div className="h-4 flex-1 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-900" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (results.length === 0) return null;

  const maxAvgCost = Math.max(...barData.map((b) => b.avgCost));

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="mb-8 grid gap-8 lg:grid-cols-2">
      {/* Average Cost Bar Chart */}
      <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Average Cost by Provider
        </h3>
        <div className="flex w-full flex-col gap-4 overflow-y-auto pr-2 max-h-[350px]">
          {barData.map((bar) => {
            const widthPercent = maxAvgCost > 0 ? (bar.avgCost / maxAvgCost) * 100 : 0;
            return (
              <div key={bar.provider} className="flex items-center gap-4">
                <div className="w-24 shrink-0 truncate text-right text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {bar.provider === "Unknown" ? "Other" : bar.provider}
                </div>
                <div className="group relative flex h-6 flex-1 items-center">
                  <div 
                    className="h-full rounded-sm bg-blue-500 transition-all duration-300 group-hover:bg-blue-400 dark:bg-blue-600 dark:group-hover:bg-blue-500"
                    style={{ width: `${Math.max(widthPercent, 1)}%` }}
                  />
                  <span className="ml-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {formatCurrency(bar.avgCost)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cost Range Scatter Plot */}
      <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Cost Range Distribution
        </h3>
        {/* Axis marker */}
          <div className="ml-[112px] pb-2 mb-4 flex justify-between border-b border-zinc-200 pt-2 text-[10px] font-medium text-zinc-400 dark:border-zinc-800">
            <span>$0</span>
            <span>{formatCurrency(maxCost / 2)}</span>
            <span>{formatCurrency(maxCost)}</span>
          </div>
        <div className="flex flex-col gap-5 overflow-y-auto pr-2 max-h-[350px]">
          {Object.entries(scatterData).map(([provider, data]) => (
            <div key={provider} className="flex items-center gap-4">
              <div className="w-24 shrink-0 truncate text-right text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {provider === "Unknown" ? "Other" : provider}
              </div>
              <div className="relative h-4 flex-1 rounded-full bg-zinc-100 dark:bg-zinc-900/50">
                {data.costs.map((cost, idx) => {
                  let leftPercent = maxCost > 0 ? (cost / maxCost) * 100 : 0;
                  leftPercent = Math.max(1, Math.min(99, leftPercent));
                  
                  return (
                    <div
                      key={idx}
                      className="group absolute top-1/2 -ml-1.5 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-red-500/50 ring-2 ring-white hover:z-50 hover:bg-red-500 hover:ring-white dark:bg-red-500/60 dark:ring-zinc-950 dark:hover:ring-zinc-950"
                      style={{ left: `${leftPercent}%` }}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 mb-2 z-50 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white shadow-md group-hover:block dark:bg-zinc-100 dark:text-zinc-900">
                        {formatCurrency(cost)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
