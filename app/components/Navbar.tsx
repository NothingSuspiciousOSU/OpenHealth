"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/search?q=", label: "Search" },
    { href: "/upload", label: "Upload" },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/80"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          <span className="flex items-center justify-center">
            <svg
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              aria-hidden="true"
            >
              <path
                d="M40 8L12 20v18c0 17.6 11.9 34.1 28 38 16.1-3.9 28-20.4 28-38V20L40 8z"
                fill="url(#navShieldGradient)"
                fillOpacity="0.15"
                stroke="url(#navShieldStroke)"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <text
                x="40"
                y="48"
                textAnchor="middle"
                fontFamily="var(--font-sans), system-ui, sans-serif"
                fontWeight="700"
                fontSize="28"
                fill="url(#navTextGradient)"
              >
                $
              </text>
              <defs>
                <linearGradient id="navShieldGradient" x1="12" y1="8" x2="68" y2="76" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#38bdf8" />
                  <stop offset="0.5" stopColor="#818cf8" />
                  <stop offset="1" stopColor="#c084fc" />
                </linearGradient>
                <linearGradient id="navShieldStroke" x1="12" y1="8" x2="68" y2="76" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#38bdf8" />
                  <stop offset="0.5" stopColor="#818cf8" />
                  <stop offset="1" stopColor="#c084fc" />
                </linearGradient>
                <linearGradient id="navTextGradient" x1="30" y1="28" x2="50" y2="56" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#38bdf8" />
                  <stop offset="1" stopColor="#818cf8" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          OpenHealth
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 sm:flex">
          {links.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href.split("?")[0]);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 sm:hidden dark:hover:bg-zinc-800"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="4" x2="16" y2="16" />
              <line x1="16" y1="4" x2="4" y2="16" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="17" y2="6" />
              <line x1="3" y1="10" x2="17" y2="10" />
              <line x1="3" y1="14" x2="17" y2="14" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-zinc-200 px-6 py-3 sm:hidden dark:border-zinc-800">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
