"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

import { HeroIcon } from "./components/HeroIcon";
import { SearchBar } from "./components/SearchBar";
import { StatsBar } from "./components/StatsBar";
import { AddProcedureButton } from "./components/AddProcedureButton";
import { TrendingProcedures } from "./components/TrendingProcedures";

export default function Home() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  
  const generateData = useMutation(api.mockData.generate);
  const clearData = useMutation(api.mockData.clearBatch);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">

      {/* ─── Hero ─── */}
      <section className="flex w-full flex-col items-center px-6 pt-24 pb-12">
        <div className="w-full max-w-2xl text-center">

          {/* Shield icon */}
          <div className="animate-fade-in-up">
            <HeroIcon />
          </div>

          {/* Headline */}
          <h1 className="mt-10 animate-fade-in-up-delay-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Medical billing is purposefully confusing.
          </h1>
          <p className="mx-auto mt-4 max-w-lg animate-fade-in-up-delay-2 text-md leading-relaxed text-zinc-500 dark:text-zinc-400">
            Nearly half of insured adults receive bills for care they thought
            should have been covered. We help people estimate costs, spot questionable
            charges, understand what they owe, and push back before they
            overpay.
          </p>

          {/* Search + upload */}
          <div className="mx-auto mt-10 w-full max-w-md animate-fade-in-up-delay-3">
            <SearchBar
              value={query}
              onChange={setQuery}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder='Ex: "ACL Surgery" or Enter a Specific CPT'
            />
            <div className="mt-3 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleSearch}
                className="inline-flex items-center rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 dark:focus:ring-offset-zinc-950"
              >
                Search
              </button>
              <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                or
              </span>
              <AddProcedureButton onClick={() => router.push('/upload')} />
            </div>
          </div>

          {/* Dev Tools - Hidden in production */}
          <div className="mt-12 flex items-center justify-center gap-6 animate-fade-in-up-delay-4">
            <button
              type="button"
              onClick={async () => {
                setIsGenerating(true);
                await generateData();
                setIsGenerating(false);
              }}
              disabled={isGenerating || isClearing}
              className="text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 disabled:opacity-50"
            >
              {isGenerating ? "Generating..." : "Seed Mock Data"}
            </button>
            <button
              type="button"
              onClick={async () => {
                setIsClearing(true);
                let remaining = -1;
                while (remaining !== 0) {
                  const res = await clearData();
                  remaining = res.remaining;
                }
                setIsClearing(false);
              }}
              disabled={isGenerating || isClearing}
              className="text-xs font-medium text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 disabled:opacity-50"
            >
              {isClearing ? "Clearing..." : "Clear Data"}
            </button>
          </div>
        </div>
      </section>

      {/* ─── Trending ─── */}
      <TrendingProcedures />

      {/* ─── Stats ─── */}
      <StatsBar
        stats={[
          {
            value: "$160B-$530B",
            label:
              "Estimated loss every year to healthcare fraud, overpayments, and billing mistakes",
          },
          {
            value: "80%",
            label: "Medical bills with errors",
          },
          {
            value: "1.5x",
            label: "Higher odds of errors after emergency care",
          },
          {
            value: "~76%",
            label:
              "Those who experience financial relief after disputing their bill",
          },
        ]}
      />
    </div>
  );
}
