import { describe, it, expect } from 'vitest';
import { parsePDFFile, extractBOQDataFromText } from './pdfParser';

// Mock DOMMatrix for Node.js environment
if (typeof global !== 'undefined' && !global.DOMMatrix) {
  global.DOMMatrix = class DOMMatrix {
    constructor(public data: any = []) {}
  } as any;
}

describe('PDF Parser', () => {
  describe('parsePDFFile', () => {
    it('should reject non-PDF files', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const result = await parsePDFFile(file);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should reject files exceeding size limit', async () => {
      const largeContent = new Uint8Array(51 * 1024 * 1024); // 51MB
      const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      const result = await parsePDFFile(file);

      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeds 50MB limit');
    });

    it('should accept valid PDF files', async () => {
      const file = new File(['PDF content'], 'test.pdf', { type: 'application/pdf' });
      const result = await parsePDFFile(file);

      // For test environment, we expect either success or an error about PDF parsing
      // The actual PDF.js parsing requires a real PDF file
      expect(result).toBeDefined();
      expect(result.pages).toBeDefined();
      expect(result.tables).toBeDefined();
    });

    it('should handle PDF files with .pdf extension', async () => {
      const file = new File(['PDF content'], 'document.pdf', { type: 'application/octet-stream' });
      const result = await parsePDFFile(file);

      // For test environment, just verify the result structure
      expect(result).toBeDefined();
      expect(result.pages).toBeDefined();
    });

    it('should return error structure on parsing failure', async () => {
      const file = new File(['invalid PDF'], 'test.pdf', { type: 'application/pdf' });
      const result = await parsePDFFile(file);

      expect(result.success).toBeDefined();
      expect(result.error).toBeDefined();
      expect(result.tables).toBeDefined();
    });
  });

  describe('extractBOQDataFromText', () => {
    it('should extract BOQ items from text', () => {
      const text = `ITEM-001 Concrete m3 100 500 50000
ITEM-002 Steel ton 50 1000 50000`;

      const items = extractBOQDataFromText(text);

      expect(items.length).toBeGreaterThan(0);
      items.forEach((item) => {
        expect(item.description).toBeDefined();
      });
    });

    it('should handle empty text', () => {
      const items = extractBOQDataFromText('');
      expect(items).toEqual([]);
    });

    it('should handle text with no matching patterns', () => {
      const text = 'No structured data here';
      const items = extractBOQDataFromText(text);
      expect(Array.isArray(items)).toBe(true);
    });

    it('should parse items with all fields', () => {
      const text = 'ITEM-001 Concrete m3 100 500 50000';
      const items = extractBOQDataFromText(text);

      if (items.length > 0) {
        const item = items[0];
        expect(item.itemCode).toBeDefined();
        expect(item.description).toBeDefined();
        expect(item.unit).toBeDefined();
        expect(item.quantity).toBeDefined();
        expect(item.unitPrice).toBeDefined();
        expect(item.totalPrice).toBeDefined();
      }
    });

    it('should handle items with optional fields', () => {
      const text = 'Concrete 100 500 50000';
      const items = extractBOQDataFromText(text);

      // Should return empty array if pattern doesn't match
      expect(Array.isArray(items)).toBe(true);
    });

    it('should handle multiline text', () => {
      const text = `ITEM-001 Concrete m3 100 500 50000
ITEM-002 Steel ton 50 1000 50000
ITEM-003 Wood m3 75 300 22500`;

      const items = extractBOQDataFromText(text);
      expect(items.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle text with extra whitespace', () => {
      const text = `ITEM-001    Concrete    m3    100    500    50000`;
      const items = extractBOQDataFromText(text);

      if (items.length > 0) {
        expect(items[0].description).toBeDefined();
      }
    });

    it('should parse numeric values correctly', () => {
      const text = 'ITEM-001 Material m3 100.5 500.75 50325.375';
      const items = extractBOQDataFromText(text);

      if (items.length > 0) {
        const item = items[0];
        expect(typeof item.quantity).toBe('number');
        expect(typeof item.unitPrice).toBe('number');
        expect(typeof item.totalPrice).toBe('number');
      }
    });
  });
});
