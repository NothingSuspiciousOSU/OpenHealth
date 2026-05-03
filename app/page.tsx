"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState } from "react";

import { AddUploadProcedureButton } from "./components/AddUploadProcedureButton";
import { SearchBar } from "./components/SearchBar";

export default function Home() {
  const tasks = useQuery(api.tasks.get);
  const [query, setQuery] = useState("");

  return (
    <main className="flex min-h-screen flex-col items-center bg-zinc-50 px-6 py-20 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <div className="w-full max-w-xl">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Convex + Next.js
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Task list
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
            <AddUploadProcedureButton onClick={() => {}} />
          </div>
        </div>
      </div>
      </main>
  );
}
