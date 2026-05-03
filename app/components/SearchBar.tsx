// SearchBar.tsx
type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
};

export function SearchBar({ value, onChange, onKeyDown, placeholder }: SearchBarProps) {
  return (
    <div className="w-full">
      <input
        id="procedure-search"
        className="w-full rounded-xl border border-zinc-200 bg-white px-5 py-3.5 text-sm text-zinc-950 shadow-sm outline-none transition-colors focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
        placeholder={placeholder ?? 'Ex: "ACL Surgery" or Enter a Specific CPT'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}