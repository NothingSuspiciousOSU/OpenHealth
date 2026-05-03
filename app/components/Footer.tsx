export function Footer() {
  return (
    <footer
      role="contentinfo"
      className="mt-auto border-t border-zinc-200 bg-white px-6 py-8 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500"
    >
      <div className="mx-auto max-w-6xl space-y-2">
        <p className="font-medium text-zinc-500 dark:text-zinc-400">
          Built for BeaverHacks 2026
        </p>
        <p>
          OpenHealth is a transparency tool. Costs shown are community-reported
          and may not reflect your actual charges. Always verify with your
          provider and insurance.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <a
            href="https://github.com/sarveshta/OpenHealth"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300"
            aria-label="View source on GitHub"
          >
            GitHub
          </a>
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          <span>© {new Date().getFullYear()} OpenHealth by NothingSuspicious</span>
        </div>
      </div>
    </footer>
  );
}
