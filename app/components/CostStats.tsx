import React, { useMemo } from "react";

type Procedure = {
  _id: string;
  allowedAmountCents: bigint;
  insurance: { providerName: string };
};

export function CostStats({ results }: { results: Procedure[] }) {
  const { barData, scatterData, maxCost } = useMemo(() => {
    if (!results || results.length === 0) return { barData: [], scatterData: {}, maxCost: 0 };

    const providerMap: Record<string, { total: number; count: number; costs: number[] }> = {};
    let globalMaxCost = 0;

    results.forEach((r) => {
      const provider = r.insurance.providerName || "Unknown";
      const cost = Number(r.allowedAmountCents) / 100;
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

  if (results.length === 0) return null;

  const maxAvgCost = Math.max(...barData.map((b) => b.avgCost));

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="mb-8 grid gap-8 lg:grid-cols-2">
      {/* Average Cost Bar Chart */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Average Cost by Provider
        </h3>
        <div className="flex h-64 w-full">
          {/* Y-Axis */}
          <div className="flex flex-col justify-between py-10 pr-2 text-xs text-zinc-400">
            <span>{formatCurrency(maxAvgCost)}</span>
            <span>{formatCurrency(maxAvgCost / 2)}</span>
            <span>$0</span>
          </div>
          
          {/* Bars */}
          <div className="flex flex-1 flex-col justify-end gap-2 border-l border-b border-zinc-200 pb-2 pl-2 dark:border-zinc-800">
            <div className="flex h-full items-end gap-4 overflow-x-auto pt-10">
              {barData.map((bar) => {
                const heightPercent = maxAvgCost > 0 ? (bar.avgCost / maxAvgCost) * 100 : 0;
                
                return (
                  <div key={bar.provider} className="group relative flex h-full w-16 shrink-0 flex-col items-center justify-end">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 z-50 hidden whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs text-white shadow-md group-hover:block dark:bg-zinc-100 dark:text-zinc-900">
                      {formatCurrency(bar.avgCost)}
                    </div>
                    {/* Bar */}
                    <div 
                      className="w-12 rounded-t-sm bg-blue-500 transition-all duration-300 hover:bg-blue-400"
                      style={{ height: `${Math.max(heightPercent, 2)}%` }}
                    />
                    {/* Label */}
                    <div className="mt-2 w-full truncate text-center text-xs text-zinc-500">
                      {bar.provider === "Unknown" ? "Other" : bar.provider}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Cost Range Scatter Plot */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Cost Range Distribution
        </h3>
        <div className="flex flex-col justify-between px-2 pt-8">
          {Object.entries(scatterData).map(([provider, data]) => (
            <div key={provider} className="mb-4">
              <div className="mb-2 text-xs font-medium text-zinc-500">{provider === "Unknown" ? "Other" : provider}</div>
              <div className="relative h-4 w-full rounded-full bg-zinc-100 dark:bg-zinc-900">
                {data.costs.map((cost, idx) => {
                  let leftPercent = maxCost > 0 ? (cost / maxCost) * 100 : 0;
                  leftPercent = Math.max(1, Math.min(99, leftPercent));
                  
                  return (
                    <div
                      key={idx}
                      className="group absolute top-1/2 -ml-1.5 h-3 w-3 -translate-y-1/2 rounded-full bg-red-500/40 ring-1 ring-white/50 hover:z-50 hover:bg-red-500 hover:ring-white dark:ring-zinc-950/50 dark:hover:ring-zinc-950"
                      style={{ left: `${leftPercent}%` }}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 mb-2 z-50 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs text-white shadow-md group-hover:block dark:bg-zinc-100 dark:text-zinc-900">
                        {formatCurrency(cost)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {/* Axis marker */}
          <div className="mt-2 flex justify-between border-t border-zinc-200 pt-2 text-xs text-zinc-400 dark:border-zinc-800">
            <span>$0</span>
            <span>{formatCurrency(maxCost / 2)}</span>
            <span>{formatCurrency(maxCost)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
