import type { CptLineItemDraft } from '../types';
import {
    fieldLabelClasses,
    inputClasses,
    secondaryButtonClasses,
    sectionCardClasses,
    sectionDescriptionClasses,
    sectionTitleClasses,
} from './formStyles';

type ProcedureLineItemsSectionProps = {
    lineItems: CptLineItemDraft[];
    isLoading: boolean;
    onAddLineItem: () => void;
    onRemoveLineItem: (index: number) => void;
    onLineItemChange: (
        index: number,
        field: keyof CptLineItemDraft,
        value: string,
    ) => void;
};

type LineItemField = {
    key: keyof CptLineItemDraft;
    label: string;
    placeholder: string;
    type?: 'number';
};

const lineItemFields: LineItemField[] = [
    { key: 'cptCode', label: 'CPT Code *', placeholder: '99213' },
    { key: 'providerName', label: 'Provider Name *', placeholder: 'Dr. Jenkins'},
    { key: 'serviceName', label: 'Service Name', placeholder: 'Office visit' },
    { key: 'units', label: 'Units *', placeholder: '1', type: 'number' },
    { key: 'costPerUnit', label: 'Cost Per Unit *', placeholder: '400.00', type: 'number' },
] as const;

export function ProcedureLineItemsSection({
    lineItems,
    isLoading,
    onAddLineItem,
    onRemoveLineItem,
    onLineItemChange,
}: ProcedureLineItemsSectionProps) {
    return (
        <div className={sectionCardClasses}>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className={sectionTitleClasses}>CPT Line Items</h2>
                    <p className={sectionDescriptionClasses}>Add one or more billable CPT entries.</p>
                </div>
                <button
                    type="button"
                    onClick={onAddLineItem}
                    disabled={isLoading}
                    className={secondaryButtonClasses}
                >
                    Add CPT Line Item
                </button>
            </div>

            <div className="space-y-4">
                {lineItems.map((lineItem, index) => (
                    <div key={index} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                                Line Item {index + 1}
                            </h3>
                            {lineItems.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => onRemoveLineItem(index)}
                                    disabled={isLoading}
                                    className="text-sm font-medium text-rose-600 transition hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-400 dark:hover:text-rose-300"
                                >
                                    Remove
                                </button>
                            )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {lineItemFields.map((field) => (
                                <div key={field.key} className={field.key === 'serviceName' ? 'md:col-span-2' : ''}>
                                    <label className={fieldLabelClasses}>{field.label}</label>
                                    <input
                                        type={field.type ?? 'text'}
                                        value={lineItem[field.key]}
                                        onChange={(event) => onLineItemChange(index, field.key, event.target.value)}
                                        disabled={isLoading}
                                        className={inputClasses}
                                        placeholder={field.placeholder}
                                        min={field.type === 'number' ? '0' : undefined}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {lineItems.length === 0 && (
                <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
                    No CPT line items yet. Use the button above to add one.
                </div>
            )}
        </div>
    );
}

export { createEmptyCptLineItem } from '../types';