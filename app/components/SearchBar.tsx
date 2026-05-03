// SearchBar.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
};

export function SearchBar({ value, onChange, onKeyDown, placeholder }: SearchBarProps) {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);
  const [debouncedQ, setDebouncedQ] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounce the query by 250ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(value.trim()), 250);
    return () => clearTimeout(timer);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const suggestions = useQuery(
    api.search.getSuggestions,
    debouncedQ.length >= 2 ? { q: debouncedQ } : "skip",
  );

  const hasSuggestions =
    suggestions &&
    (suggestions.procedures.length > 0 || suggestions.cptCodes.length > 0);

  const showDropdown = isFocused && hasSuggestions;

  const handleSelect = (query: string) => {
    onChange(query);
    setIsFocused(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        id="procedure-search"
        aria-label="Search procedures or CPT codes"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        className="w-full rounded-xl border border-zinc-200 bg-white px-5 py-3.5 text-sm text-zinc-950 shadow-sm outline-none transition-colors focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
        placeholder={placeholder ?? 'Ex: "ACL Surgery" or Enter a Specific CPT'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => setIsFocused(true)}
      />

      {showDropdown && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
        >
          {suggestions.procedures.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Procedures
              </div>
              {suggestions.procedures.map((desc) => (
                <button
                  key={desc}
                  role="option"
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-zinc-700 hover:bg-sky-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  onClick={() => handleSelect(desc)}
                >
                  <span className="text-zinc-400">🔍</span>
                  {desc}
                </button>
              ))}
            </div>
          )}

          {suggestions.cptCodes.length > 0 && (
            <div>
              <div className="border-t border-zinc-100 px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800">
                CPT Codes
              </div>
              {suggestions.cptCodes.map((cpt) => (
                <button
                  key={cpt.code}
                  role="option"
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-sky-50 dark:hover:bg-zinc-800"
                  onClick={() => handleSelect(cpt.code)}
                >
                  <span className="font-mono text-xs font-bold text-sky-500">
                    {cpt.code}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-300">
                    {cpt.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}