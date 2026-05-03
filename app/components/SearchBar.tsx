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
  const [selectedIndex, setSelectedIndex] = useState(-1);
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
    setSelectedIndex(-1);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      onKeyDown?.(e);
      return;
    }

    const flatSuggestions = [
      ...suggestions.procedures,
      ...suggestions.cptCodes.map((c) => c.code),
    ];

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flatSuggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0) {
        e.preventDefault();
        handleSelect(flatSuggestions[selectedIndex]);
      } else {
        onKeyDown?.(e);
      }
    } else if (e.key === "Escape") {
      setIsFocused(false);
    }
  };

  // Reset selection when focus or suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [isFocused, debouncedQ]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative flex items-center">
        <input
          id="procedure-search"
          aria-label="Search procedures or CPT codes"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          className="w-full rounded-xl border border-zinc-200 bg-white px-5 py-3.5 pr-12 text-sm text-zinc-950 shadow-sm outline-none transition-colors focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
          placeholder={placeholder ?? 'Ex: "ACL Surgery" or Enter a Specific CPT'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setSelectedIndex(-1);
            }}
            className="absolute right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            aria-label="Clear search"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

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
              {suggestions.procedures.map((desc, idx) => (
                <button
                  key={desc}
                  role="option"
                  type="button"
                  aria-selected={selectedIndex === idx}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                    selectedIndex === idx 
                      ? "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100" 
                      : "text-zinc-700 hover:bg-sky-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                  onClick={() => handleSelect(desc)}
                >
                  <span className={selectedIndex === idx ? "text-sky-500" : "text-zinc-400"}>🔍</span>
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
              {suggestions.cptCodes.map((cpt, idx) => {
                const globalIdx = idx + suggestions.procedures.length;
                return (
                  <button
                    key={cpt.code}
                    role="option"
                    type="button"
                    aria-selected={selectedIndex === globalIdx}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                      selectedIndex === globalIdx
                        ? "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100"
                        : "hover:bg-sky-50 dark:hover:bg-zinc-800"
                    }`}
                    onClick={() => handleSelect(cpt.code)}
                  >
                    <span className="font-mono text-xs font-bold text-sky-500">
                      {cpt.code}
                    </span>
                    <span className={selectedIndex === globalIdx ? "text-sky-800 dark:text-sky-200" : "text-zinc-600 dark:text-zinc-300"}>
                      {cpt.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}