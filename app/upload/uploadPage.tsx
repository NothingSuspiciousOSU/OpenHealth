'use client';

import { useState } from 'react';
import { createDocumentDataFromImages } from '@/lib/shared/DocumentData';
import { parseFilesToUploadImages, validateUploadSelection } from '@/lib/shared/documentUploadClient';
import { DocumentUploadSection } from './components/DocumentUploadSection';
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
} from './components/formStyles';
import type { CptLineItemDraft, ProcedureFormData } from './types';

type ProcedureLineItemsPayload = Array<{
    cptCode: string;
    serviceName: string | null;
    units: number;
    costPerUnit: number;
}>;

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
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isDocumentParseLoading, setIsDocumentParseLoading] = useState(false);
    const [isFormChangeLoading, setIsFormChangeLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successDocumentParse, setSuccessDocumentParse] = useState(false);
    const [successDBUpdate, setSuccessDBUpdate] = useState(false);
    const [formData, setFormData] = useState<ProcedureFormData>(createInitialFormData);
    const [lineItems, setLineItems] = useState<CptLineItemDraft[]>(createInitialLineItems);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files ? Array.from(event.target.files) : [];
        const validationError = validateUploadSelection(files);

        if (validationError) {
            setError(validationError);
            setSelectedFiles([]);
            return;
        }

        setSelectedFiles(files);
        setError(null);
        setSuccessDocumentParse(false);
        setSuccessDBUpdate(false);
    };

    const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target;

        if (name.startsWith('location.')) {
            const key = name.split('.')[1] as keyof ProcedureFormData['location'];
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
            setError(validationError);
            return;
        }

        setIsFormChangeLoading(true);
        setError(null);
        setSuccessDBUpdate(false);

        try {
            const images = await parseFilesToUploadImages(selectedFiles);

            const documentData = createDocumentDataFromImages(
                images.map((image) => ({
                    resource: image.base64,
                    filename: image.filename,
                    fileType: image.fileType,
                })),
                new Date(Date.now()),
            );

            const procedureLineItemsPayload: ProcedureLineItemsPayload = lineItems.map((lineItem) => ({
                cptCode: lineItem.cptCode.trim(),
                serviceName: lineItem.serviceName.trim() || null,
                units: Number.parseInt(lineItem.units, 10),
                costPerUnit: Number.parseInt(lineItem.costPerUnit, 10),
            }));

            const procedurePayload = {
                documentData,
                procedure: {
                    ...formData,
                    dateOfProcedure: new Date(formData.dateOfProcedure).getTime(),
                    billedAmount: Number.parseInt(formData.billedAmount, 10),
                    allowedAmount: Number.parseInt(formData.allowedAmount, 10),
                },
                procedureLineItems: procedureLineItemsPayload,
            };

            throw new Error("PROCEDURE ADD TO DB NOT YET IMPLEMENTED!");

            setSuccessDBUpdate(true);
            setSelectedFiles([]);
            setFormData(createInitialFormData());
            setLineItems(createInitialLineItems());

            const input = document.querySelector('input[type="file"]') as HTMLInputElement | null;
            if (input) {
                input.value = '';
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload procedure');
        } finally {
            setIsFormChangeLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!selectedFiles || selectedFiles.length === 0) {
            setError('Please select one or more PDF or image files');
            return;
        }

        setIsDocumentParseLoading(true);
        setError(null);
        setSuccessDocumentParse(false);

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
                throw new Error(`API error: ${response.statusText}`);
            }

            const parsed = await response.json();

            // If the API returned an error payload, surface it
            if (parsed?.error) {
                throw new Error(parsed.error as string);
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
                const mapped = parsedLineItems.map((li: any) => ({
                    cptCode: String(li.cptCode || ''),
                    serviceName: li.serviceName == null ? '' : String(li.serviceName),
                    units: li.units != null ? String(Math.round(Number(li.units))) : '',
                    costPerUnit: li.costPerUnit != null ? String(Math.round(Number(li.costPerUnit) * 100)) : '',
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
            setError(err instanceof Error ? err.message : 'Failed to upload document');
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
                        onFileSelect={handleFileSelect}
                        handleUpload={handleUpload}
                    />
                    {successDocumentParse && (
                        <div className={successPanelClasses}>
                            <p>Document parsed successfully.</p>
                        </div>
                    )}

                    <ProcedureDetailsSection
                        formData={formData}
                        isLoading={isFormChangeLoading}
                        onChange={handleFormChange}
                    />

                    <div className={sectionCardClasses}>
                        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">Location</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className={fieldLabelClasses}>City *</label>
                                <input
                                    type="text"
                                    name="location.city"
                                    value={formData.location.city}
                                    onChange={handleFormChange}
                                    disabled={isFormChangeLoading}
                                    className={inputClasses}
                                    placeholder="City"
                                />
                            </div>

                            <div>
                                <label className={fieldLabelClasses}>State *</label>
                                <input
                                    type="text"
                                    name="location.state"
                                    value={formData.location.state}
                                    onChange={handleFormChange}
                                    disabled={isFormChangeLoading}
                                    className={inputClasses}
                                    placeholder="State"
                                />
                            </div>
                        </div>
                    </div>

                    <div className={sectionCardClasses}>
                        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">Insurance</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className={fieldLabelClasses}>
                                    Provider Name *
                                </label>
                                <input
                                    type="text"
                                    name="insurance.providerName"
                                    value={formData.insurance.providerName}
                                    onChange={handleFormChange}
                                    disabled={isFormChangeLoading}
                                    className={inputClasses}
                                    placeholder="Insurance provider"
                                />
                            </div>

                            <div>
                                <label className={fieldLabelClasses}>Plan Name *</label>
                                <input
                                    type="text"
                                    name="insurance.planName"
                                    value={formData.insurance.planName}
                                    onChange={handleFormChange}
                                    disabled={isFormChangeLoading}
                                    className={inputClasses}
                                    placeholder="Plan name"
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
                    />

                    {error && (
                        <div className={errorPanelClasses}>
                            <p>{error}</p>
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
                        {isFormChangeLoading ? 'Uploading...' : 'Add Procedure'}
                    </button>
                </div>
            </div>
        </div>
    );
}
