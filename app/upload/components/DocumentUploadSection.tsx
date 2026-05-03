import React, { useState, useEffect, type ChangeEvent } from 'react';
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
    handleUpload: () => void;
    isSuccess?: boolean;
    onProgressComplete?: () => void;
}

function useFakeProgress(isLoading: boolean, isSuccess: boolean, onProgressComplete?: () => void) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!isLoading && !isSuccess) {
            setProgress(0);
            return;
        }

        let animationFrame: number;

        if (isSuccess && progress < 100) {
            const start = progress;
            const end = 100;
            const duration = 1000;
            const startTime = performance.now();

            const animate = (time: number) => {
                const elapsed = time - startTime;
                const progressRatio = Math.min(elapsed / duration, 1);
                const nextProgress = start + (end - start) * progressRatio;
                setProgress(nextProgress);
                
                if (progressRatio < 1) {
                    animationFrame = requestAnimationFrame(animate);
                } else if (onProgressComplete) {
                    onProgressComplete();
                }
            };
            animationFrame = requestAnimationFrame(animate);
            return () => cancelAnimationFrame(animationFrame);
        }

        if (isLoading) {
            setProgress(0);
            const startTime = performance.now();

            const animate = (time: number) => {
                const elapsedSeconds = (time - startTime) / 1000;
                let currentProgress = 0;

                if (elapsedSeconds <= 20) {
                    currentProgress = elapsedSeconds * (85 / 20);
                } else if (elapsedSeconds <= 30) {
                    currentProgress = 85 + (elapsedSeconds - 20) * (10 / 10);
                } else if (elapsedSeconds <= 40) {
                    currentProgress = 95 + (elapsedSeconds - 30) * (4 / 10);
                } else {
                    currentProgress = 99;
                }

                setProgress(currentProgress);
                animationFrame = requestAnimationFrame(animate);
            };

            animationFrame = requestAnimationFrame(animate);
            return () => cancelAnimationFrame(animationFrame);
        }
    }, [isLoading, isSuccess]); // We purposefully omit `progress` and `onProgressComplete` to avoid re-triggering the effect

    return progress;
}

export function DocumentUploadSection({
    selectedFiles,
    isLoading,
    isSuccess = false,
    onFileSelect,
    handleUpload,
    onProgressComplete
}: DocumentUploadSectionProps) {
    const progress = useFakeProgress(isLoading, isSuccess, onProgressComplete);
    
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
                <p className={sectionDescriptionClasses + ' italic'}>All files are temporarily stored for parsing, and then immediately deleted.</p>

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
                    {isLoading ? 'Parsing in Progress...' : 'Upload Files'}
                </button>

                {(isLoading || (isSuccess && progress > 0)) && (
                    <div className="mt-4 w-full">
                        <div className="mb-1 flex justify-between text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            <span>{isSuccess && progress === 100 ? 'Complete' : 'Parsing...'}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                            <div 
                                className="h-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}