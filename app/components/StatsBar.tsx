type StatItem = {
  value: string;
  label: string;
};

type StatsBarProps = {
  stats: StatItem[];
};

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <section className="w-full py-8">
      <div className="mx-auto w-full max-w-5xl px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={`${stat.label}-${index}`}
              className={`stat-card rounded-xl border border-zinc-100 bg-white px-5 py-5 text-center dark:border-zinc-800/60 dark:bg-zinc-900/50 animate-fade-in-up-delay-${index + 1}`}
            >
              <div className="text-2xl font-bold tracking-tight text-sky-500 dark:text-sky-400">
                {stat.value}
              </div>
              <div className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
