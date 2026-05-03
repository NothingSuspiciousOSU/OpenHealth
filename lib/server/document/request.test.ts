import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { parseDocumentStructure } from './request';
import { createDocumentDataFromImages } from '../../shared/DocumentData';

describe('parseDocumentStructure', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const testImage1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2F5f8AAAAASUVORK5CYII=';
    const testImage2 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/58AAwMCAO2F5f8AAAAASUVORK5CYII=';
    const defaultUploadTime = new Date('2025-01-15T10:30:00Z');

    it('should parse document structure from multiple images', async () => {
        // Create document data from test images
        const documentData = createDocumentDataFromImages([
            {
                resource: testImage1,
                filename: 'test1.png',
                fileType: 'png'
            },
            {
                resource: testImage2,
                filename: 'test2.png',
                fileType: 'png'
            }
        ], defaultUploadTime);

        expect(documentData.resources).toHaveLength(2);
        expect(documentData.filenames).toEqual(['test1.png', 'test2.png']);
        expect(documentData.fileTypes).toEqual(['png', 'png']);
        expect(documentData.uploadTime).toBeDefined();
    });

    it('should create valid DocumentData from test images', () => {
        const documentData = createDocumentDataFromImages([
            {
                resource: testImage1,
                filename: 'test1.png',
                fileType: 'png'
            },
            {
                resource: testImage2,
                filename: 'test2.png',
                fileType: 'png'
            }
        ], defaultUploadTime);

        // Verify the structure matches expectations
        expect(documentData.resources).toHaveLength(2);
        expect(documentData.filenames).toHaveLength(2);
        expect(documentData.fileTypes).toHaveLength(2);
        
        // Verify all elements are strings
        expect(typeof documentData.uploadTime).toBe('string');
        expect(documentData.resources.every(resource => typeof resource === 'string')).toBe(true);
        expect(documentData.filenames.every(name => typeof name === 'string')).toBe(true);
        expect(documentData.fileTypes.every(type => typeof type === 'string')).toBe(true);
    });

    it('should validate image file types', () => {
        expect(() => {
            createDocumentDataFromImages([
                {
                    resource: testImage1,
                    filename: 'test1.png',
                    fileType: 'png'
                },
                {
                    resource: testImage2,
                    filename: 'test2.pdf',
                    fileType: 'pdf' as any
                }
            ], defaultUploadTime);
        }).toThrow('Invalid image type: pdf');
    });

    it('should keep base64 image resources intact', async () => {
        const documentData = createDocumentDataFromImages([
            {
                resource: testImage1,
                filename: 'test1.png',
                fileType: 'png'
            },
            {
                resource: testImage2,
                filename: 'test2.png',
                fileType: 'png'
            }
        ], defaultUploadTime);

        expect(documentData.resources).toEqual([testImage1, testImage2]);
    });

    it('should reject empty resource', () => {
        expect(() => {
            createDocumentDataFromImages([
                {
                    resource: '',
                    filename: 'test1.png',
                    fileType: 'png'
                },
                {
                    resource: testImage2,
                    filename: 'test2.png',
                    fileType: 'png'
                }
            ], defaultUploadTime);
        }).toThrow('Each image must have a non-empty resource');
    });

    it('should reject empty filename', () => {
        const customTime = '2025-01-15T10:30:00Z';
        expect(() => {
            createDocumentDataFromImages(
                [
                    {
                        resource: testImage1,
                        filename: '',
                        fileType: 'png'
                    },
                    {
                        resource: testImage2,
                        filename: 'test2.png',
                        fileType: 'png'
                    }
                ],
                customTime
            );
        }).toThrow('Each image must have a non-empty filename');
    });

    it('should handle custom upload time', () => {
        const customTime = '2025-01-15T10:30:00Z';
        const documentData = createDocumentDataFromImages(
            [
                {
                    resource: testImage1,
                    filename: 'test1.png',
                    fileType: 'png'
                },
                {
                    resource: testImage2,
                    filename: 'test2.png',
                    fileType: 'png'
                }
            ],
            customTime
        );

        // Verify the timestamp is correct (allowing for milliseconds normalization)
        expect(new Date(documentData.uploadTime).getTime()).toBe(new Date(customTime).getTime());
    });

    it('should handle Date object as upload time', () => {
        const customDate = new Date('2025-01-15T10:30:00Z');
        const documentData = createDocumentDataFromImages(
            [
                {
                    resource: testImage1,
                    filename: 'test1.png',
                    fileType: 'png'
                },
                {
                    resource: testImage2,
                    filename: 'test2.png',
                    fileType: 'png'
                }
            ],
            customDate
        );

        // Verify the timestamp matches the custom date
        expect(new Date(documentData.uploadTime).getTime()).toBe(customDate.getTime());
    });
});
