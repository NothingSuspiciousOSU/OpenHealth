// AddUploadProcedureButton.tsx
type AddUploadProcedureButtonProps = {
  onClick?: () => void;
  label?: string;
};

export function AddUploadProcedureButton({
  onClick,
  label = "Add/Upload Procedure",
}: AddUploadProcedureButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
    >
      {label}
    </button>
  );
}