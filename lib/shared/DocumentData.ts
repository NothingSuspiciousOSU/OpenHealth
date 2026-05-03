export type ImageType = "png" | "jpeg" | "jpg";
export type FileType = ImageType;

export interface DocumentData {
    resources: string[];  // base64 encoded images
    filenames: string[];
    uploadTime: string;  // ISO 8601
    fileTypes: FileType[];
}

const MAX_IMAGES = 8;

/**
 * DocumentData must contain:
 * - At least 2 base64 encoded images of types: png, jpeg, jpg, heic
 * 
 * All resources must be base64 encoded images. PDFs should be converted
 * to images on the frontend before creating DocumentData.
 */

/**
 * Create a DocumentData object with multiple images.
 */
export function createDocumentDataFromImages(
    files: Array<{ resource: string; filename: string; fileType: ImageType }>,
    uploadTime: string | Date
): DocumentData {

    if (files.length > MAX_IMAGES) {
        throw new Error('The maximum number of images/pages is 8.')
    }

    for (const file of files) {
        if (!file.resource?.trim()) {
            throw new Error('Each image must have a non-empty resource');
        }
        if (!file.filename?.trim()) {
            throw new Error('Each image must have a non-empty filename');
        }
        const validImageTypes: ImageType[] = ["png", "jpeg", "jpg"];
        if (!validImageTypes.includes(file.fileType)) {
            throw new Error(`Invalid image type: ${file.fileType}. Must be one of: ${validImageTypes.join(', ')}`);
        }
    }

    const time = new Date(uploadTime);
    if (Number.isNaN(time.getTime())) {
        throw new Error('uploadTime must be a valid date or ISO string');
    }

    return {
        resources: files.map(f => f.resource.trim()),
        filenames: files.map(f => f.filename.trim()),
        uploadTime: time.toISOString(),
        fileTypes: files.map(f => f.fileType),
    };
}



export function isDocumentData(obj: any): obj is DocumentData {
    if (
        obj == null ||
        !Array.isArray(obj.resources) ||
        !Array.isArray(obj.filenames) ||
        !Array.isArray(obj.fileTypes) ||
        typeof obj.uploadTime !== 'string' ||
        Number.isNaN(new Date(obj.uploadTime).getTime())
    ) {
        return false;
    }

    // All arrays must have the same length
    if (
        obj.resources.length !== obj.filenames.length ||
        obj.resources.length !== obj.fileTypes.length
    ) {
        return false;
    }

    // Must not be empty
    if (obj.resources.length === 0) {
        return false;
    }

    // Validate each file
    for (let i = 0; i < obj.resources.length; i++) {
        if (
            typeof obj.resources[i] !== 'string' ||
            typeof obj.filenames[i] !== 'string' ||
            typeof obj.fileTypes[i] !== 'string'
        ) {
            return false;
        }
    }

    // Check constraint: all resources must be images (at least 2)
    const isImage = (fileType: string): boolean => ['png', 'jpeg', 'jpg'].includes(fileType);

    const fileTypes = obj.fileTypes as string[];
    const isValidImages = fileTypes.every(isImage);

    return isValidImages;
}

export default {
    createDocumentDataFromImages,
    isDocumentData,
} as const;
