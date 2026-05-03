'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { createDocumentDataFromImages } from '@/lib/shared/DocumentData';
import { parseFilesToUploadImages, validateUploadSelection } from '@/lib/shared/documentUploadClient';
import { DocumentUploadSection } from './components/DocumentUploadSection';
import { AutocompleteInput } from './components/AutocompleteInput';
import { ProcedureDetailsSection } from './components/ProcedureDetailsSection';
import {
    ProcedureLineItemsSection,
    createEmptyCptLineItem,
} from './components/ProcedureLineItemsSection';
import {
    errorPanelClasses,
    pageCardClasses,
    pageDescriptionClasses,
    pageHeaderClasses,
    pageShellClasses,
    pageTitleClasses,
    primaryButtonClasses,
    sectionCardClasses,
    successPanelClasses,
    fieldLabelClasses,
    inputClasses,
    dropdownContainerClasses,
    dropdownMenuClasses,
    dropdownOptionClasses,
    dropdownEmptyClasses,
} from './components/formStyles';
import type { CptLineItemDraft, ProcedureFormData } from './types';

const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    'DC'
];

type ProcedureLineItemsPayload = Array<{
    cptCode: string;
    serviceName: string | null;
    units: bigint;
    costPerUnit: bigint;
    providerName: string | null;
}>;

type ParsedLineItem = {
    cptCode?: unknown;
    serviceName?: unknown;
    units?: unknown;
    costPerUnit?: unknown;
    providerName?: unknown;
};

function createInitialFormData(): ProcedureFormData {
    return {
        procedureDescription: '',
        dateOfProcedure: '',
        hospitalName: '',
        location: {
            city: '',
            state: '',
        },
        insurance: {
            providerName: '',
            planName: '',
        },
        billedAmount: '',
        allowedAmount: '',
    };
}

function createInitialLineItems(): CptLineItemDraft[] {
    return [createEmptyCptLineItem()];
}

export function UploadPage() {
    const filterOptions = useQuery(api.search.getFilterOptions);


    const createProcedure = useMutation(api.procedures.create);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isDocumentParseLoading, setIsDocumentParseLoading] = useState(false);
    const [isFormChangeLoading, setIsFormChangeLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [successDocumentParse, setSuccessDocumentParse] = useState(false);
    const [showSuccessPanel, setShowSuccessPanel] = useState(false);
    const [successDBUpdate, setSuccessDBUpdate] = useState(false);
    const [formData, setFormData] = useState<ProcedureFormData>(createInitialFormData);
    // Derived suggestions
    const hospitalSuggestions = useMemo(() => {
        if (!filterOptions || !formData.location.state || !formData.location.city) return [];
        return filterOptions.locations[formData.location.state]?.[formData.location.city] || [];
    }, [filterOptions, formData.location.state, formData.location.city]);

    const citySuggestions = useMemo(() => {
        if (!filterOptions || !formData.location.state) return [];
        return Object.keys(filterOptions.locations[formData.location.state] || {});
    }, [filterOptions, formData.location.state]);

    const providerSuggestions = useMemo(() => {
        if (!filterOptions) return [];
        return Object.keys(filterOptions.insurances || {});
    }, [filterOptions]);

    const planSuggestions = useMemo(() => {
        if (!filterOptions || !formData.insurance.providerName) return [];
        return filterOptions.insurances[formData.insurance.providerName] || [];
    }, [filterOptions, formData.insurance.providerName]);
    
    const lineItemProviderSuggestions = filterOptions?.providers || [];

    const [lineItems, setLineItems] = useState<CptLineItemDraft[]>(createInitialLineItems);
    const [stateSearchOpen, setStateSearchOpen] = useState(false);
    const [stateSearchValue, setStateSearchValue] = useState('');

    const filteredStates = stateSearchValue.trim() === ''
        ? US_STATES
        : US_STATES.filter(state =>
            state.toLowerCase().includes(stateSearchValue.toLowerCase())
        );

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files ? Array.from(event.target.files) : [];
        const validationError = validateUploadSelection(files);

        if (validationError) {
            setFormError(validationError);
            setSelectedFiles([]);
            return;
        }

        setSelectedFiles(files);
        setFormError(null);
        setParseError(null);
        setSuccessDocumentParse(false);
        setShowSuccessPanel(false);
        setSuccessDBUpdate(false);
    };

    const handleStateSelect = (state: string) => {
        setFormData((previous) => ({
            ...previous,
            location: {
                ...previous.location,
                state: state,
            },
        }));
        setStateSearchOpen(false);
        setStateSearchValue('');
    };

    const handleStateSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        setStateSearchValue(value);
        setStateSearchOpen(true);
    };

    const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target;

        if (name.startsWith('location.')) {
            const key = name.split('.')[1] as keyof ProcedureFormData['location'];
            if (key === 'state') {
                setStateSearchValue(value);
                setStateSearchOpen(true);
                return;
            }
            setFormData((previous) => ({
                ...previous,
                location: {
                    ...previous.location,
                    [key]: value,
                },
            }));
            return;
        }

        if (name.startsWith('insurance.')) {
            const key = name.split('.')[1] as keyof ProcedureFormData['insurance'];
            setFormData((previous) => ({
                ...previous,
                insurance: {
                    ...previous.insurance,
                    [key]: value,
                },
            }));
            return;
        }

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleLineItemChange = (
        index: number,
        field: keyof CptLineItemDraft,
        value: string,
    ) => {
        setLineItems((previous) =>
            previous.map((lineItem, currentIndex) =>
                currentIndex === index ? { ...lineItem, [field]: value } : lineItem,
            ),
        );
        setSuccessDBUpdate(false);
    };

    const addLineItem = () => {
        setLineItems((previous) => [...previous, createEmptyCptLineItem()]);
        setSuccessDBUpdate(false);
    };

    const removeLineItem = (index: number) => {
        setLineItems((previous) => {
            if (previous.length === 1) {
                return previous;
            }

            return previous.filter((_, currentIndex) => currentIndex !== index);
        });
        setSuccessDBUpdate(false);
    };

    const validateLineItems = (): string | null => {
        for (let index = 0; index < lineItems.length; index += 1) {
            const lineItem = lineItems[index];

            if (!lineItem.cptCode.trim()) {
                return `CPT code is required for line item ${index + 1}`;
            }

            if (!lineItem.units || Number.isNaN(Number(lineItem.units)) || Number(lineItem.units) <= 0) {
                return `Units must be greater than 0 for line item ${index + 1}`;
            }

            if (
                !lineItem.costPerUnit ||
                Number.isNaN(Number(lineItem.costPerUnit)) ||
                Number(lineItem.costPerUnit) < 0
            ) {
                return `Cost per unit is required for line item ${index + 1}`;
            }
        }

        return null;
    };

    const validateForm = (): string | null => {
        if (!formData.procedureDescription.trim()) {
            return 'Procedure description is required';
        }

        if (!formData.dateOfProcedure) {
            return 'Date of procedure is required';
        }

        if (!formData.hospitalName.trim()) {
            return 'Hospital name is required';
        }

        if (!formData.location.city.trim()) {
            return 'City is required';
        }

        if (!formData.location.state.trim()) {
            return 'State is required';
        }

        if (!formData.insurance.providerName.trim()) {
            return 'Insurance provider name is required';
        }

        if (!formData.insurance.planName.trim()) {
            return 'Insurance plan name is required';
        }

        if (!formData.billedAmount) {
            return 'Billed amount is required';
        }

        if (!formData.allowedAmount) {
            return 'Allowed amount is required';
        }

        return validateLineItems();
    };

    const addProcedureToDB = async () => {
        const validationError = validateForm();

        if (validationError) {
            setFormError(validationError);
            return;
        }

        setIsFormChangeLoading(true);
        setFormError(null);
        setSuccessDBUpdate(false);

        try {
            const procedureLineItemsPayload: ProcedureLineItemsPayload = lineItems.map((lineItem) => ({
                cptCode: lineItem.cptCode.trim(),
                serviceName: lineItem.serviceName.trim() || null,
                units: BigInt(Number.parseInt(lineItem.units, 10)),
                costPerUnit: BigInt(Number.parseInt(lineItem.costPerUnit, 10)),
                providerName: lineItem.providerName.trim() || null
            }));

            await createProcedure({
                procedure: {
                    procedureDescription: formData.procedureDescription.trim(),
                    dateOfProcedure: BigInt(new Date(formData.dateOfProcedure).getTime()),
                    hospitalName: formData.hospitalName.trim(),
                    location: {
                        city: formData.location.city.trim(),
                        state: formData.location.state.trim(),
                    },
                    insurance: {
                        providerName: formData.insurance.providerName.trim(),
                        planName: formData.insurance.planName.trim(),
                    },
                    billedAmount: BigInt(Number.parseInt(formData.billedAmount, 10)),
                    allowedAmount: BigInt(Number.parseInt(formData.allowedAmount, 10)),
                },
                procedureLineItems: procedureLineItemsPayload,
            });

            setSuccessDBUpdate(true);
            setSelectedFiles([]);
            setFormData(createInitialFormData());
            setLineItems(createInitialLineItems());

            const input = document.querySelector('input[type="file"]') as HTMLInputElement | null;
            if (input) {
                input.value = '';
            }
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to upload procedure');
        } finally {
            setIsFormChangeLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!selectedFiles || selectedFiles.length === 0) {
            setParseError('Please select one or more PDF or image files');
            return;
        }

        setIsDocumentParseLoading(true);
        setParseError(null);
        setSuccessDocumentParse(false);
        setShowSuccessPanel(false);

        try {
            const images = await parseFilesToUploadImages(selectedFiles);


            // Create DocumentData with the converted/loaded images
            const documentData = createDocumentDataFromImages(
            images.map(img => (
                {
                    resource: img.base64,
                    filename: img.filename,
                    fileType: img.fileType,
                })),
                new Date(Date.now())
            );

            // Send to API
            const response = await fetch('/api/parse-document', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(documentData),
            });

            if (!response.ok) {
                throw new Error(`Failed to parse documents: ${response.statusText}`);
            }

            const parsed = await response.json();

            // If the API returned an error payload, surface it
            if (parsed?.error) {
                throw new Error(parsed.error as string);
            }
            if (parsed.procedures.length === 0) {
                throw new Error("There was an error parsing the document, please try again or input manually.");
            }

            // Auto-fill the form with parsed data when available
            const firstProcedure = Array.isArray(parsed?.procedures) && parsed.procedures.length > 0 ? parsed.procedures[0] : null;
            const parsedLineItems = Array.isArray(parsed?.procedureLineItems) ? parsed.procedureLineItems : [];

            if (firstProcedure) {
                setFormData((previous) => ({
                    ...previous,
                    procedureDescription: String(firstProcedure.procedureDescription || ''),
                    dateOfProcedure: typeof firstProcedure.dateOfProcedure === 'string'
                        ? (firstProcedure.dateOfProcedure as string).slice(0, 10)
                        : firstProcedure.dateOfProcedure
                            ? new Date(firstProcedure.dateOfProcedure as number).toISOString().slice(0, 10)
                            : '',
                    hospitalName: String(firstProcedure.hospitalName || ''),
                    location: {
                        city: String((firstProcedure.location && firstProcedure.location.city) || ''),
                        state: String((firstProcedure.location && firstProcedure.location.state) || ''),
                    },
                    insurance: {
                        providerName: String((firstProcedure.insurance && firstProcedure.insurance.providerName) || ''),
                        planName: String((firstProcedure.insurance && firstProcedure.insurance.planName) || ''),
                    },
                    billedAmount: firstProcedure.billedAmount != null ? String(Math.round(Number(firstProcedure.billedAmount))) : '',
                    allowedAmount: firstProcedure.allowedAmount != null ? String(Math.round(Number(firstProcedure.allowedAmount))) : '',
                }));
            }

            if (parsedLineItems.length > 0) {
                const mapped = parsedLineItems.map((li: ParsedLineItem) => ({
                    cptCode: String(li.cptCode || ''),
                    serviceName: li.serviceName == null ? '' : String(li.serviceName),
                    units: li.units != null ? String(Math.round(Number(li.units))) : '',
                    costPerUnit: li.costPerUnit != null ? String(Number(li.costPerUnit)) : '',
                    providerName: li.providerName == null ? '' : String(li.providerName)
                }));

                setLineItems(mapped.length > 0 ? mapped : createInitialLineItems());
            } else {
                setLineItems(createInitialLineItems());
            }

            setSuccessDocumentParse(true);
            setSelectedFiles([]);
            const input = document.querySelector('input[type="file"]') as HTMLInputElement | null;
            if (input) input.value = '';
        } catch (err) {
            setParseError(err instanceof Error ? err.message : 'Failed to upload document. Please try again or input data manually.');
        } finally {
            setIsDocumentParseLoading(false);
        }
    };

    return (
        <div className={pageShellClasses}>
            <div className={pageCardClasses}>
                <div className={pageHeaderClasses}>
                    <h1 className={pageTitleClasses}>Add Procedure</h1>
                    <p className={pageDescriptionClasses}>
                        Upload records, confirm the procedure details, and add the bill in one flow.
                    </p>
                </div>

                <div className="space-y-5 p-6">
                    <DocumentUploadSection
                        selectedFiles={selectedFiles}
                        isLoading={isDocumentParseLoading}
                        isSuccess={successDocumentParse}
                        onFileSelect={handleFileSelect}
                        handleUpload={handleUpload}
                        onProgressComplete={() => setShowSuccessPanel(true)}
                    />
                    {showSuccessPanel && (
                        <div className={successPanelClasses}>
                            <p>Document parsed successfully.</p>
                        </div>
                    )}
                    {parseError && (
                        <div className={errorPanelClasses}>
                            <p>{parseError}</p>
                        </div>
                    )}

                    <div className={sectionCardClasses}>
                        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">Location</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className={dropdownContainerClasses}>
                                <label className={fieldLabelClasses}>State *</label>
                                <input
                                    type="text"
                                    name="location.state"
                                    value={stateSearchOpen ? stateSearchValue : formData.location.state}
                                    onChange={handleStateSearchChange}
                                    onFocus={() => setStateSearchOpen(true)}
                                    onBlur={() => setTimeout(() => setStateSearchOpen(false), 200)}
                                    disabled={isFormChangeLoading}
                                    className={inputClasses}
                                    placeholder="Type or select state"
                                    autoComplete="off"
                                />
                                {stateSearchOpen && (
                                    <div className={dropdownMenuClasses}>
                                        {filteredStates.length > 0 ? (
                                            filteredStates.map((state) => (
                                                <button
                                                    key={state}
                                                    type="button"
                                                    onClick={() => handleStateSelect(state)}
                                                    className={dropdownOptionClasses}
                                                >
                                                    {state}
                                                </button>
                                            ))
                                        ) : (
                                            <div className={dropdownEmptyClasses}>
                                                No states found
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className={fieldLabelClasses}>City *</label>
                                <AutocompleteInput
                                    name="location.city"
                                    value={formData.location.city}
                                    onChange={handleFormChange}
                                    disabled={isFormChangeLoading}
                                    placeholder="City"
                                    suggestions={citySuggestions}
                                />
                            </div>
                        </div>
                    </div>

                    <ProcedureDetailsSection
                        formData={formData}
                        isLoading={isFormChangeLoading}
                        onChange={handleFormChange}
                        hospitalSuggestions={hospitalSuggestions}
                    />


                    <div className={sectionCardClasses}>
                        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">Insurance</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className={fieldLabelClasses}>
                                    Insurance Provider Name *
                                </label>
                                <AutocompleteInput
                                    name="insurance.providerName"
                                    value={formData.insurance.providerName}
                                    onChange={handleFormChange}
                                    disabled={isFormChangeLoading}
                                    placeholder="Insurance provider name"
                                    suggestions={providerSuggestions}
                                />
                            </div>

                            <div>
                                <label className={fieldLabelClasses}>Plan Name *</label>
                                <AutocompleteInput
                                    name="insurance.planName"
                                    value={formData.insurance.planName}
                                    onChange={handleFormChange}
                                    disabled={isFormChangeLoading}
                                    placeholder="Plan name (optional)"
                                    suggestions={planSuggestions}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={sectionCardClasses}>
                        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">Cost Information</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className={fieldLabelClasses}>Billed Amount *</label>
                                <input
                                    type="number"
                                    name="billedAmount"
                                    value={formData.billedAmount}
                                    onChange={handleFormChange}
                                    disabled={isFormChangeLoading}
                                    className={inputClasses}
                                    placeholder="0"
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className={fieldLabelClasses}>
                                    Allowed Amount *
                                </label>
                                <input
                                    type="number"
                                    name="allowedAmount"
                                    value={formData.allowedAmount}
                                    onChange={handleFormChange}
                                    disabled={isFormChangeLoading}
                                    className={inputClasses}
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    <ProcedureLineItemsSection
                        lineItems={lineItems}
                        isLoading={isFormChangeLoading}
                        onAddLineItem={addLineItem}
                        onRemoveLineItem={removeLineItem}
                        onLineItemChange={handleLineItemChange}
                        providerSuggestions={lineItemProviderSuggestions}
                    />

                    {formError && (
                        <div className={errorPanelClasses}>
                            <p>{formError}</p>
                        </div>
                    )}

                    {successDBUpdate && (
                        <div className={successPanelClasses}>
                            <p>Procedure added successfully.</p>
                        </div>
                    )}

                    <button
                        onClick={addProcedureToDB}
                        disabled={isFormChangeLoading}
                        className={primaryButtonClasses + ' w-full py-3'}
                    >
                        {isFormChangeLoading ? 'Loading...' : 'Add Procedure'}
                    </button>
                </div>
            </div>
        </div>
    );
}
