// HeroIcon.tsx — Large animated shield icon with a dollar sign to represent healthcare cost protection
export function HeroIcon() {
  return (
    <div className="relative mx-auto flex h-44 w-44 items-center justify-center animate-pulse-glow rounded-3xl">
      {/* Soft gradient backdrop */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-sky-400/10 via-indigo-400/10 to-violet-400/10 dark:from-sky-400/15 dark:via-indigo-400/15 dark:to-violet-400/15" />
      <svg
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 h-24 w-24"
        aria-hidden="true"
      >
        {/* Shield body */}
        <path
          d="M40 8L12 20v18c0 17.6 11.9 34.1 28 38 16.1-3.9 28-20.4 28-38V20L40 8z"
          fill="url(#shieldGradient)"
          fillOpacity="0.15"
          stroke="url(#shieldStroke)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Dollar sign */}
        <text
          x="40"
          y="48"
          textAnchor="middle"
          fontFamily="var(--font-sans), system-ui, sans-serif"
          fontWeight="700"
          fontSize="28"
          fill="url(#textGradient)"
        >
          $
        </text>
        <defs>
          <linearGradient id="shieldGradient" x1="12" y1="8" x2="68" y2="76" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38bdf8" />
            <stop offset="0.5" stopColor="#818cf8" />
            <stop offset="1" stopColor="#c084fc" />
          </linearGradient>
          <linearGradient id="shieldStroke" x1="12" y1="8" x2="68" y2="76" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38bdf8" />
            <stop offset="0.5" stopColor="#818cf8" />
            <stop offset="1" stopColor="#c084fc" />
          </linearGradient>
          <linearGradient id="textGradient" x1="30" y1="28" x2="50" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38bdf8" />
            <stop offset="1" stopColor="#818cf8" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
