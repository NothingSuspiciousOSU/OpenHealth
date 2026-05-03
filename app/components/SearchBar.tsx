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
        className="w-full rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 shadow-sm outline-none ring-0 focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
        placeholder={placeholder ?? 'Ex: "ACL Surgery" or "Specific CPT"'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}