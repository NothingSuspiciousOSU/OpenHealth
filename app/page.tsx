"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState } from "react";

import { AddUploadProcedureButton } from "./components/AddUploadProcedureButton";
import { SearchBar } from "./components/SearchBar";
import { StatsBar } from "./components/StatsBar";

export default function Home() {
  const tasks = useQuery(api.tasks.get);
  const [query, setQuery] = useState("");

  return (
    <main className="flex min-h-screen flex-col items-center bg-zinc-50 py-20 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <div className="w-full max-w-xl px-6">

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Your medical bill might not be right.
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Nearly half of insured adults receive 
            bills for care they thought should have been covered, 
            and 43% of adults say they've seen a medical bill they believed contained 
            an error. We help patients spot questionable charges, 
            understand what they owe, and push back before they overpay.
          </p>
        </h1>

        <div className="mt-8 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          {tasks === undefined ? (
            <div className="px-5 py-4 text-sm text-zinc-500 dark:text-zinc-400">
              Loading tasks...
            </div>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {tasks.map((task) => (
                <li
                  key={task._id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <span>{task.text}</span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {task.isCompleted ? "Done" : "Open"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Ex: ACL Surgery or Specific CPT"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
            >
              Search
            </button>
          </div>
          <p className="mt-4 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Or
          </p>
          <div className="mt-4 flex justify-center">
            <AddUploadProcedureButton onClick={() => {}} />
          </div>
        </div>
      </div>
      <div className="mt-10 w-full">
        <StatsBar
          stats={[
            {
              value: "$88 Billion",
              label: "Estimated medical debt per year",
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
              value: "~76% hrs",
              label: "Those who experience financial relief after reaching out",
            },
          ]}
        />
      </div>
    </main>
  );
}
