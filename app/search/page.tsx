"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SearchBar } from "../components/SearchBar";
import { SearchResultItem } from "../components/SearchResultItem";
import { CostStats } from "../components/CostStats";
import { InsuranceProfileModal } from "../components/InsuranceProfileModal";
import { useInsuranceProfile } from "../hooks/useInsuranceProfile";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [shareTooltip, setShareTooltip] = useState(false);
  const { profile } = useInsuranceProfile();
  const [sortBy, setSortBy] = useState("relevant"); // "relevant", "price_asc", "price_desc"
  
  // Filter States — initialize from URL params for shareable links
  const [insuranceProv, setInsuranceProv] = useState(searchParams.get("provider") || "");
  const [insurancePlan, setInsurancePlan] = useState(searchParams.get("plan") || "");
  const [state, setState] = useState(searchParams.get("state") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [hospital, setHospital] = useState(searchParams.get("hospital") || "");
  const [date, setDate] = useState(searchParams.get("after") || "");
  
  const filterOptions = useQuery(api.search.getFilterOptions);
  
  const results = useQuery(api.search.searchProcedures, {
    q: activeQuery,
    insuranceProvider: insuranceProv,
    insurancePlan: insurancePlan,
    state: state,
    city: city,
    hospitalName: hospital,
    afterDate: date ? BigInt(new Date(date).getTime()) : undefined,
  });

  /** Build a URLSearchParams with all current filters */
  const buildParams = (q?: string) => {
    const params = new URLSearchParams();
    const searchQ = q ?? query;
    if (searchQ) params.set("q", searchQ);
    if (insuranceProv) params.set("provider", insuranceProv);
    if (insurancePlan) params.set("plan", insurancePlan);
    if (state) params.set("state", state);
    if (city) params.set("city", city);
    if (hospital) params.set("hospital", hospital);
    if (date) params.set("after", date);
    return params;
  };

  const handleSearch = () => {
    setActiveQuery(query);
    router.replace(`/search?${buildParams().toString()}`);
  };

  const handleShareResults = async () => {
    const url = `${window.location.origin}/search?${buildParams(activeQuery).toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareTooltip(true);
      setTimeout(() => setShareTooltip(false), 2000);
    } catch {
      // Fallback
      window.prompt("Copy this link:", url);
    }
  };

  const handleResetFilters = () => {
    setInsuranceProv("");
    setInsurancePlan("");
    setState("");
    setCity("");
    setHospital("");
    setDate("");
  };

  // Derive cascade options
  const insuranceProviders = filterOptions ? Object.keys(filterOptions.insurances).sort() : [];
  const insurancePlans = filterOptions && insuranceProv && filterOptions.insurances[insuranceProv] 
    ? filterOptions.insurances[insuranceProv].sort() : [];
    
  const states = filterOptions ? Object.keys(filterOptions.locations).sort() : [];
  const cities = filterOptions && state && filterOptions.locations[state] 
    ? Object.keys(filterOptions.locations[state]).sort() : [];
  const hospitals = filterOptions && state && city && filterOptions.locations[state][city] 
    ? filterOptions.locations[state][city].sort() : [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-10 text-zinc-950 dark:text-zinc-50">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchBar
              value={query}
              onChange={setQuery}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by procedure or CPT code..."
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
            >
              {profile.providerName ? "Edit Insurance Profile" : "Set Insurance Profile"}
            </button>
            <button
              onClick={handleSearch}
              className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Search
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Filters Sidebar */}
          <div className="w-full shrink-0 lg:w-64">
            <div className="sticky top-24 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Filters</h2>
                <button onClick={handleResetFilters} className="text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400">
                  Reset All
                </button>
              </div>

              <div className="space-y-6">
                {/* Insurance Filter */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Insurance</h3>
                  <select 
                    value={insuranceProv} 
                    onChange={(e) => { setInsuranceProv(e.target.value); setInsurancePlan(""); }}
                    className="w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-800"
                  >
                    <option value="">Any Provider</option>
                    {insuranceProviders.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {insuranceProv && insurancePlans.length > 0 && (
                    <select 
                      value={insurancePlan} 
                      onChange={(e) => setInsurancePlan(e.target.value)}
                      className="w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-800"
                    >
                      <option value="">Any Plan</option>
                      {insurancePlans.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  )}
                </div>

                {/* Location Filter */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Location</h3>
                  <select 
                    value={state} 
                    onChange={(e) => { setState(e.target.value); setCity(""); setHospital(""); }}
                    className="w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-800"
                  >
                    <option value="">Any State</option>
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {state && cities.length > 0 && (
                    <select 
                      value={city} 
                      onChange={(e) => { setCity(e.target.value); setHospital(""); }}
                      className="w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-800"
                    >
                      <option value="">Any City</option>
                      {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )}
                  {city && hospitals.length > 0 && (
                    <select 
                      value={hospital} 
                      onChange={(e) => setHospital(e.target.value)}
                      className="w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-800"
                    >
                      <option value="">Any Hospital</option>
                      {hospitals.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  )}
                </div>

                {/* Date Filter */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">After Date</h3>
                  <div className="relative">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-800 [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Area */}
          <div className="flex-1">
            <div className="mb-4 flex flex-col items-start justify-between sm:flex-row sm:items-center">
              <h2 className="text-xl font-semibold">
                {results === undefined 
                  ? "Searching..." 
                  : `${results.length} result${results.length === 1 ? '' : 's'} found`}
              </h2>
              {results !== undefined && results.length > 0 && (
                <div className="mt-2 flex items-center gap-2 sm:mt-0">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={handleShareResults}
                      aria-label="Share search results"
                      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm font-medium text-zinc-600 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                        <polyline points="16 6 12 2 8 6"/>
                        <line x1="12" y1="2" x2="12" y2="15"/>
                      </svg>
                      Share
                    </button>
                    {shareTooltip && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white shadow-md dark:bg-zinc-100 dark:text-zinc-900">
                        Link copied!
                      </div>
                    )}
                  </div>
                  <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-md border border-zinc-200 bg-transparent px-2 py-1 text-sm outline-none focus:border-blue-500 dark:border-zinc-800"
                  >
                    <option value="relevant">Relevant</option>
                    <option value="price_asc">Lowest Price</option>
                    <option value="price_desc">Highest Price</option>
                  </select>
                </div>
              )}
            </div>

            {results === undefined ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-200 border-dashed py-24 text-center dark:border-zinc-800">
                <div className="mb-4 text-6xl">😢</div>
                <h3 className="mb-2 text-lg font-medium">No results found</h3>
                <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
                  We couldn't find any procedures matching your search criteria. 
                  You can add your bill after your procedure to help others save on their bills!
                </p>
                <button
                  className="mt-6 inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                  onClick={() => {}}
                >
                  Add a procedure bill
                </button>
              </div>
            ) : (
              <div className="flex flex-col">
                <CostStats results={results} />
                
                <div className="mb-4 mt-8 grid grid-cols-1 gap-4 px-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:grid-cols-12 sm:gap-6">
                  <div className="sm:col-span-4">Hospital (Location | Date)</div>
                  <div className="sm:col-span-3">Procedure</div>
                  <div className="sm:col-span-2">Insurance</div>
                  <div className="flex flex-col items-start sm:col-span-3 sm:items-end">Total Amount</div>
                </div>
                
                <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  {results
                    .sort((a, b) => {
                      if (sortBy === "price_asc") {
                        return Number(a.allowedAmount) - Number(b.allowedAmount);
                      }
                      if (sortBy === "price_desc") {
                        return Number(b.allowedAmount) - Number(a.allowedAmount);
                      }
                      // Default "relevant" sort: match profile first
                      const aMatches = a.insurance.providerName === profile.providerName && a.insurance.planName === profile.planName;
                      const bMatches = b.insurance.providerName === profile.providerName && b.insurance.planName === profile.planName;
                      if (aMatches && !bMatches) return -1;
                      if (!aMatches && bMatches) return 1;
                      return 0;
                    })
                    .map((proc) => (
                      <SearchResultItem key={proc._id} procedure={proc} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <InsuranceProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
