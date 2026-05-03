import type { ImageType } from '@/lib/shared/DocumentData';

export type ParsedUploadImage = {
    base64: string;
    filename: string;
    fileType: ImageType;
};

const DEFAULT_MAX_WIDTH = 1024;
const DEFAULT_MAX_HEIGHT = 1024;

type ResizeOptions = {
    maxWidth?: number;
    maxHeight?: number;
};

export function validateUploadSelection(files: File[]): string | null {
    if (files.length === 0) {
        return 'Please select one or more files';
    }

    const hasInvalidType = files.some(
        (file) => !file.type || (!file.type.startsWith('image/') && file.type !== 'application/pdf')
    );
    if (hasInvalidType) {
        return 'Only PDF, PNG, or JPEG files are allowed';
    }

    return null;
}

export async function parseFilesToUploadImages(
    files: File[],
    options: ResizeOptions = {}
): Promise<ParsedUploadImage[]> {
    const pdfFiles = files.filter((file) => file.type === 'application/pdf');
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));

    if (pdfFiles.length > 0 && imageFiles.length > 0) {
        throw new Error('Mixing PDFs and images in the same upload is not supported');
    }

    if (pdfFiles.length > 0) {
        const pdfResults = await Promise.all(
            pdfFiles.map((file) => convertPdfToBase64Images(file, options))
        );

        return pdfResults.flat();
    }

    return Promise.all(imageFiles.map((file) => convertImageToBase64(file, options)));
}

export async function convertPdfToBase64Images(
    pdfFile: File,
    options: ResizeOptions = {}
): Promise<ParsedUploadImage[]> {
    const { maxWidth = DEFAULT_MAX_WIDTH, maxHeight = DEFAULT_MAX_HEIGHT } = options;

    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/js/pdf.worker.min.mjs';

    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const images: ParsedUploadImage[] = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to get canvas context');
    }

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2 });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
            canvasContext: ctx,
            viewport,
            canvas,
        }).promise;

        const base64 = scaleCanvasToPngBase64(canvas, maxWidth, maxHeight);
        const filename = `${pdfFile.name.replace(/\.pdf$/i, '')}_page_${pageNum}.png`;

        images.push({ base64, filename, fileType: 'png' });
    }

    return images;
}

export async function convertImageToBase64(
    file: File,
    options: ResizeOptions = {}
): Promise<ParsedUploadImage> {
    const { maxWidth = DEFAULT_MAX_WIDTH, maxHeight = DEFAULT_MAX_HEIGHT } = options;
    const dataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(dataUrl);

    const canvas = document.createElement('canvas');
    const ratio = Math.min(1, Math.min(maxWidth / image.width, maxHeight / image.height));
    canvas.width = Math.round(image.width * ratio);
    canvas.height = Math.round(image.height * ratio);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to get canvas context');
    }

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    return {
        base64: canvas.toDataURL('image/png').split(',')[1] || '',
        filename: file.name,
        fileType: 'png',
    };
}

function scaleCanvasToPngBase64(
    sourceCanvas: HTMLCanvasElement,
    maxWidth: number,
    maxHeight: number
): string {
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;
    const scale = Math.min(1, Math.min(maxWidth / width, maxHeight / height));

    if (scale === 1) {
        return sourceCanvas.toDataURL('image/png').split(',')[1] || '';
    }

    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = Math.round(width * scale);
    tmpCanvas.height = Math.round(height * scale);

    const tmpCtx = tmpCanvas.getContext('2d');
    if (!tmpCtx) {
        throw new Error('Failed to get canvas context');
    }

    tmpCtx.drawImage(sourceCanvas, 0, 0, tmpCanvas.width, tmpCanvas.height);
    return tmpCanvas.toDataURL('image/png').split(',')[1] || '';
}

function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Failed to load image'));
        image.src = dataUrl;
    });
}