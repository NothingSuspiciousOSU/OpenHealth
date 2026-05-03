// AddProcedureButton.tsx
type AddProcedureButtonProps = {
  onClick?: () => void;
  label?: string;
};

export function AddProcedureButton({
  onClick,
  label = "Add Procedure",
}: AddProcedureButtonProps) {
  return (
    <button
      type="button"
      id="add=procedure"
      onClick={onClick}
      className="inline-flex items-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    >
      {label}
    </button>
  );
}