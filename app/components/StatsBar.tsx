type StatItem = {
  value: string;
  label: string;
};

type StatsBarProps = {
  stats: StatItem[];
};

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <section className="w-full bg-white py-6 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-5xl px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={`${stat.label}-${index}`} className="text-center">
              <div className="text-2xl font-semibold text-sky-400">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-black dark:text-zinc-100">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
