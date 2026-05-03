"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "../convex/_generated/api";

import { HeroIcon } from "./components/HeroIcon";
import { SearchBar } from "./components/SearchBar";
import { StatsBar } from "./components/StatsBar";
import { AddProcedureButton } from "./components/AddProcedureButton";
import { TrendingProcedures } from "./components/TrendingProcedures";

export default function Home() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  
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
            Nearly half of insured adults receive medical bills for procedures they expected their insurance 
            would cover. We help people estimate costs, spot questionable
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
              placeholder='Ex: "MRI Brain" or Enter a Specific CPT'
            />
            <div className="mt-4 flex w-full items-center justify-between gap-4 px-2 sm:px-4">
              <button
                type="button"
                onClick={handleSearch}
                className="flex flex-1 items-center justify-center rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 dark:focus:ring-offset-zinc-950"
              >
                Search
              </button>
              <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                or
              </span>
              <AddProcedureButton className="flex-1" onClick={() => router.push('/upload')} />
            </div>
          </div>

        </div>
      </section>

      <div>

        {/* ─── Stats ─── */}
        <StatsBar
            stats={[
            {
                value: "$160B-$530B",
                label:
                "Estimated loss every year to healthcare fraud, overpayments, and billing mistakes [1][2]",
            },
            {
                value: "80%",
                label: "Medical bills with errors [3][4]",
            },
            {
                value: "40%",
                label: "US adults who identify a billing issue and do NOT try to fix it [5]",
            },
            {
                value: "~76%",
                label:
                "Those who experience financial relief after disputing their bill [6]",
            },
            ]}
        />
        <div className="w-full py-8 mx-auto w-full max-w-5xl px-6">
        <p>Sources:</p>
        <a href="https://jamanetwork.com/journals/jama-health-forum/fullarticle/2822788" target="_blank" rel="noopener noreferrer">[1] Jamma Health Forum (2024)  </a>
        <a href="https://orbdoc.com/blog/medical-bill-errors-80-percent-problem/" target="_blank" rel="noopener noreferrer">[2] Orbdoc (2025)  </a>
        <a href="https://akasa.com/blog/inaccurate-medical-bills" target="_blank" rel="noopener noreferrer">[3] Akasa (2024)   </a>
        <a href="https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet" target="_blank" rel="noopener noreferrer">[4] CMS (2024)  </a>
        <a href="https://www.nhcaa.org/tools-insights/about-health-care-fraud/the-challenge-of-health-care-fraud/" target="_blank" rel="noopener noreferrer">[5] NHCAA (2024)  </a>
        </div> 
      </div>

      {/* ─── Trending ─── */}
        <TrendingProcedures />
      
    </div>
  );
}
