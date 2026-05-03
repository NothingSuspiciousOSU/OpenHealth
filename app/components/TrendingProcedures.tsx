"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";

export function TrendingProcedures() {
  const router = useRouter();
  const trending = useQuery(api.search.getTrendingProcedures);

  if (!trending || trending.length === 0) return null;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <section className="w-full px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-2 text-center text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Most Reported Procedures
        </h2>
        <p className="mb-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          See the most common procedures reported by the community.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trending.map((item) => (
            <button
              key={item.description}
              type="button"
              onClick={() =>
                router.push(
                  `/search?q=${encodeURIComponent(item.description)}`,
                )
              }
              className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
            >
              <h3 className="text-sm font-semibold capitalize text-zinc-900 group-hover:text-sky-600 dark:text-zinc-100 dark:group-hover:text-sky-400">
                {item.description}
              </h3>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                    {formatCurrency(item.avgCost)}
                  </div>
                  <div className="text-xs text-zinc-400">avg. allowed</div>
                </div>
                <div className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
                  {item.count} reports
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
