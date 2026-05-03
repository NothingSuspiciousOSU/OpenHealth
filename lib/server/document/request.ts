import 'server-only'
import nim from '@api/nim';
import { DocumentData } from '../../shared/DocumentData';
import { UTApi } from 'uploadthing/server';

const utApi = new UTApi({
    token: process.env.UPLOADTHING_TOKEN,
});

type ParsedDocumentJson = {
    procedures: unknown[];
    procedureLineItems: unknown[];
};

export async function parseDocumentStructure(data: DocumentData): Promise<ParsedDocumentJson> {
    const nimSecret = process.env.NIM_SECRET;
    if (!nimSecret) throw new Error('NIM_SECRET environment variable is required');
    
    if (!process.env.UPLOADTHING_TOKEN) {
        throw new Error('UPLOADTHING_TOKEN environment variable is required');
    }

    const images = await fetchImagesFromDocument(data);

    nim.auth(nimSecret);

    // Upload each base64 image to uploadthing and collect URLs
    const uploadedFiles: string[] = [];
    await Promise.all(images.map(async (img, i) => {
        const fileType = (data.fileTypes?.[i] || 'jpeg')
            .toLowerCase()
            .replace('jpg', 'jpeg');

        // Convert base64 to Buffer
        const buffer = Buffer.from(img, 'base64');
        
        // Create a File-like object for uploadthing
        const ext = fileType === 'jpeg' ? 'jpg' : fileType;
        const filename = `document-${Date.now()}-${i}.${ext}`;
        
        // Use FormData to simulate file upload for uploadthing
        const formData = new FormData();
        const blob = new Blob([buffer], { type: `image/${fileType}` });
        formData.append('file', blob, filename);

        // Upload to uploadthing using their API
        try {
            // Create a File-like object for uploadthing
            const file = new File([buffer], filename, { type: `image/${fileType}` });
            
            const response = await utApi.uploadFiles([file]);

            if (!response || response.length === 0) {
                throw new Error('No response from uploadthing');
            }

            const uploadResult = response[0];
            if (uploadResult.error) {
                throw new Error(`Upload failed: ${uploadResult.error}`);
            }

            const fileUrl = uploadResult.data?.ufsUrl;
            
            if (!fileUrl) {
                throw new Error('No URL returned from uploadthing');
            }

            uploadedFiles.push(fileUrl);
        } catch (err) {
            console.error(`Failed to upload image ${i}:`, err);
            throw err;
        }
    }));
    
    try {
        // Build content string with text and embedded image tags
        const objects = uploadedFiles.map(ufsUrl => ({
            type: 'image_url' as const,
            image_url: {
                url: ufsUrl
            }
        }))
        const contentString = [
            'Parse this medical billing document and return JSON only.',
            'Use this exact top-level shape:',
            '{',
            '  "procedures": [',
            '    {',
            '      "procedureDescription": string,',
            '      "dateOfProcedure": number,',
            '      "hospitalName": string,',
            '      "location": { "city": string, "state": string },',
            '      "insurance": { "providerName": string, "planName": string },',
            '      "billedAmountCents": number,',
            '      "allowedAmountCents": number,',
            '      "procedureRef": string',
            '    }',
            '  ],',
            '  "procedureLineItems": [',
            '    {',
            '      "procedureRef": string,',
            '      "cptCode": string,',
            '      "serviceName": string | null,',
            '      "units": number,',
            '      "costPerUnitCents": number,',
            '      "hospitalName": string,',
            '      "city": string,',
            '      "state": string,',
            '      "insuranceProviderName": string,',
            '      "insurancePlanName": string,',
            '      "dateOfProcedure": number',
            '    }',
            '  ],',
            '}',
            'Rules:',
            '- Return valid JSON only. No markdown, no code fences, no explanation text.',
            '- dateOfProcedure must be a Unix timestamp in milliseconds.',
            '- Monetary fields must be float.',
            '- Use procedureRef to link procedures to line items (do not use Convex IDs).',
            '- If a value is missing, use an empty string, 0, or null for serviceName.',
        ].join('\n');

        return new Promise((resolve, reject) => {
            nim.invokeFunction({
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: contentString
                        },
                        ...objects
                    ]
                }],
                model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
                max_tokens: 65536,
                reasoning_budget: 16384,
                seed: 42,
                stream: false,
                temperature: 0.6,
            })
            .then(async ({ data }) => {
                // Clean up uploaded files after model responds
                try {
                    const keysToDelete = uploadedFiles
                        .map(fileUrl => {
                            const urlObj = new URL(fileUrl);
                            return urlObj.pathname.split('/').pop();
                        })
                        .filter((key): key is string => !!key);
                    
                    if (keysToDelete.length > 0) {
                        await utApi.deleteFiles(keysToDelete);
                        console.log(`Deleted uploadthing files: ${keysToDelete.join(', ')}`);
                    }
                } catch (err) {
                    console.error('Failed to delete uploadthing files:', err);
                    // Don't reject - we still got the result
                }
                resolve(parseNimJsonResponse(data));
            })
            .catch(err => {
                console.error('Nemotron API error:', err);
                reject(err);
            });
        });
    } catch (err) {
        // If model call fails, still attempt cleanup
        try {
            const keysToDelete = uploadedFiles
                .map(fileUrl => {
                    const urlObj = new URL(fileUrl);
                    return urlObj.pathname.split('/').pop();
                })
                .filter((key): key is string => !!key);
            
            if (keysToDelete.length > 0) {
                await utApi.deleteFiles(keysToDelete);
            }
        } catch (cleanupErr) {
            console.error('Cleanup error:', cleanupErr);
        }
        throw err;
    }
}

/**
 * Extract base64 images from DocumentData.
 * All resources in DocumentData are already base64 encoded images.
 */
async function fetchImagesFromDocument(data: DocumentData): Promise<string[]> {
    return data.resources;
}

function parseNimJsonResponse(data: unknown): ParsedDocumentJson {
    const rawContent = extractModelContent(data);

    const parsedDirect = tryParseJson(rawContent);
    if (parsedDirect) {
        return normalizeParsedOutput(parsedDirect);
    }

    const jsonCandidate = extractFirstJsonObject(rawContent);
    const parsedExtracted = tryParseJson(jsonCandidate);
    if (parsedExtracted) {
        return normalizeParsedOutput(parsedExtracted);
    }

    throw new Error('Model did not return valid JSON output');
}

function extractModelContent(data: unknown): string {
    if (typeof data === 'string') {
        return data;
    }

    if (!data || typeof data !== 'object') {
        return String(data);
    }

    const asAny = data as Record<string, unknown>;
    const choiceContent = (asAny.choices as Array<Record<string, unknown>> | undefined)?.[0]?.message as
        | Record<string, unknown>
        | undefined;
    const content = choiceContent?.content ?? asAny.content ?? asAny.output;

    if (typeof content === 'string') {
        return content;
    }

    if (Array.isArray(content)) {
        const textParts = content
            .map((part) => {
                if (typeof part === 'string') return part;
                if (part && typeof part === 'object' && 'text' in part) {
                    const text = (part as Record<string, unknown>).text;
                    return typeof text === 'string' ? text : '';
                }
                return '';
            })
            .filter(Boolean)
            .join('\n');

        if (textParts) {
            return textParts;
        }
    }

    return JSON.stringify(data);
}

function tryParseJson(content: string): unknown | null {
    try {
        return JSON.parse(content);
    } catch {
        return null;
    }
}

function extractFirstJsonObject(content: string): string {
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
        return content;
    }
    return content.slice(start, end + 1);
}

function normalizeParsedOutput(parsed: unknown): ParsedDocumentJson {
    if (!parsed || typeof parsed !== 'object') {
        throw new Error('Parsed model response is not a JSON object');
    }

    const output = parsed as Record<string, unknown>;

    return {
        procedures: Array.isArray(output.procedures) ? output.procedures : [],
        procedureLineItems: Array.isArray(output.procedureLineItems) ? output.procedureLineItems : [],
    };
}
