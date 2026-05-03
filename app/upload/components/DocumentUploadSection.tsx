import type { ChangeEvent } from 'react';
import {
    addPanelClasses,
    fieldLabelClasses,
    fileInputClasses,
    primaryButtonClasses,
    sectionCardClasses,
    sectionDescriptionClasses,
    sectionTitleClasses,
} from './formStyles';

type DocumentUploadSectionProps = {
    selectedFiles: File[];
    isLoading: boolean;
    onFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
    handleUpload: () => void
}

export function DocumentUploadSection({
    selectedFiles,
    isLoading,
    onFileSelect,
    handleUpload
}: DocumentUploadSectionProps) {
    
    return (
        <div className={sectionCardClasses}>
            <div className="mb-4">
                <h2 className={sectionTitleClasses}>Upload Documents</h2>
                <p className={sectionDescriptionClasses}>Select PDF or image files to parse the procedure record. Parsing may take a while. </p>
            </div>

            <div className="space-y-4">
                <label className={fieldLabelClasses}>
                    Select PDF/image Files
                </label>
                <input
                    type="file"
                    multiple
                    accept=".pdf,application/pdf,.png,.jpg,.jpeg"
                    onChange={onFileSelect}
                    disabled={isLoading}
                    className={fileInputClasses}
                />

                {selectedFiles.length > 0 && (
                    <div className={addPanelClasses}>
                        <p>
                            <span className="font-semibold">Selected files</span>
                        </p>
                        <ul className="mt-2 list-inside list-disc text-xs leading-5 text-blue-900/80 dark:text-blue-100/80">
                            {selectedFiles.map((file, index) => (
                                <li key={`${file.name}-${index}`}>
                                    {file.name} — {(file.size / 1024 / 1024).toFixed(2)} MB
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleUpload}
                    disabled={selectedFiles.length === 0 || isLoading}
                    className={primaryButtonClasses + ' w-full'}
                >
                    {isLoading ? 'Uploading...' : 'Upload Files'}
                </button>
            </div>
        </div>
    );
}