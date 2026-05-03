"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { verifyAdminPassword } from "./actions";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Convex mutations
  const generateData = useMutation(api.mockData.generate);
  const clearData = useMutation(api.mockData.clearBatch);
  const loadPrestored = useMutation(api.mockData.loadPrestored);
  const loadPrestored900 = useMutation(api.mockData.loadPrestored900);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isLoadingPrestored, setIsLoadingPrestored] = useState(false);
  const [isLoadingPrestored900, setIsLoadingPrestored900] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    const isValid = await verifyAdminPassword(password);
    if (isValid) {
      setIsAuthenticated(true);
    } else {
      setError("Invalid administrative credentials.");
    }
    setIsLoading(false);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setMessage("Generating seed data...");
    try {
      await generateData();
      setMessage("Seed data generated successfully.");
    } catch {
      setMessage("Error generating data.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = async () => {
    setIsClearing(true);
    setMessage("Initializing database purge...");
    try {
      let done = false;
      let totalDeleted = 0;
      while (!done) {
        const res = await clearData();
        done = res.done;
        totalDeleted += res.deleted;
        if (!done) {
          setMessage(`Purging database... (Deleted ${totalDeleted} items)`);
        }
      }
      setMessage("Database cleared successfully.");
    } catch {
      setMessage("Error clearing data.");
    } finally {
      setIsClearing(false);
    }
  };

  const handleLoadPrestored = async () => {
    setIsLoadingPrestored(true);
    setMessage("Loading 2000 realistic prestored entries...");
    try {
      await loadPrestored();
      setMessage("Realistic data loaded successfully.");
    } catch {
      setMessage("Error loading prestored data.");
    } finally {
      setIsLoadingPrestored(false);
    }
  };

  const handleLoadPrestored900 = async () => {
    setIsLoadingPrestored900(true);
    setMessage("Loading 900 realistic prestored entries...");
    try {
      await loadPrestored900();
      setMessage("900 entries loaded successfully.");
    } catch (err) {
      setMessage("Error loading prestored data.");
    } finally {
      setIsLoadingPrestored900(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-zinc-950">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600 dark:text-zinc-400">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Administrative Access</h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Enter your credentials to manage application state.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Access Token"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-zinc-500"
                autoFocus
              />
            </div>
            {error && <p className="text-center text-xs font-medium text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white disabled:opacity-50"
            >
              {isLoading ? "Verifying..." : "Authenticate"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-zinc-950">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">System Controls</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Manage global database state and mock data.</p>
          </div>
          <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            Authenticated
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Synthetic</h3>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Generate 1000 randomized entries for stress testing.</p>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || isClearing || isLoadingPrestored || isLoadingPrestored900}
              className="mt-6 w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white disabled:opacity-50"
            >
              {isGenerating ? "Processing..." : "Generate Mock Data"}
            </button>
          </div>

          <div className="rounded-xl border border-sky-100 bg-sky-50/30 p-6 dark:border-sky-900/20 dark:bg-sky-900/10">
            <h3 className="text-lg font-semibold text-sky-900 dark:text-sky-100">Realistic</h3>
            <p className="mt-2 text-xs text-sky-700/70 dark:text-sky-400/70">Load 250 researched hospital and insurance entries.</p>
            <button
              onClick={handleLoadPrestored}
              disabled={isGenerating || isClearing || isLoadingPrestored}
              className="mt-6 w-full rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-50"
            >
              {isLoadingPrestored ? "Loading..." : "Load Prestored Data"}
            </button>
          </div>

          <div className="rounded-xl border border-red-100 bg-red-50/30 p-6 dark:border-red-900/20 dark:bg-red-900/10">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">Cleanup</h3>
            <p className="mt-2 text-xs text-red-700/70 dark:text-red-400/70">Wipe all procedure and line item records from the database.</p>
            <button
              onClick={handleClear}
              disabled={isGenerating || isClearing || isLoadingPrestored || isLoadingPrestored900}
              className="mt-6 w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
            >
              {isClearing ? "Clearing..." : "Purge All Data"}
            </button>
          </div>
        </div>

        {message && (
          <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{message}</p>
          </div>
        )}

        <div className="mt-10 border-t border-zinc-100 pt-6 text-center dark:border-zinc-800">
          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            Logout session
          </button>
        </div>
      </div>
    </div>
  );
}
