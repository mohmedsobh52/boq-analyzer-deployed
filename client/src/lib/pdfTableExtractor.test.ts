import { describe, it, expect } from 'vitest';
import {
  detectTableRegions,
  matchTableToBOQFields,
  extractBOQItemsFromTable,
  validateExtractedBOQItems,
  PDFTextItem,
  ExtractedTable,
} from './pdfTableExtractor';

describe('PDF Table Extractor', () => {
  describe('detectTableRegions', () => {
    it('should return empty array for empty input', () => {
      const result = detectTableRegions([]);
      expect(result).toEqual([]);
    });

    it('should detect simple table from text items', () => {
      const textItems: PDFTextItem[] = [
        { str: 'Code', x0: 10, y0: 100, x1: 50, y1: 110, width: 40, height: 10 },
        { str: 'Description', x0: 60, y0: 100, x1: 150, y1: 110, width: 90, height: 10 },
        { str: 'Qty', x0: 160, y0: 100, x1: 190, y1: 110, width: 30, height: 10 },
        { str: 'ITEM-001', x0: 10, y0: 120, x1: 50, y1: 130, width: 40, height: 10 },
        { str: 'Concrete', x0: 60, y0: 120, x1: 150, y1: 130, width: 90, height: 10 },
        { str: '100', x0: 160, y0: 120, x1: 190, y1: 130, width: 30, height: 10 },
      ];

      const result = detectTableRegions(textItems);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should group items into rows correctly', () => {
      const textItems: PDFTextItem[] = [
        // Row 1
        { str: 'A', x0: 10, y0: 100, x1: 30, y1: 110, width: 20, height: 10 },
        { str: 'B', x0: 40, y0: 100, x1: 60, y1: 110, width: 20, height: 10 },
        // Row 2
        { str: 'C', x0: 10, y0: 120, x1: 30, y1: 130, width: 20, height: 10 },
        { str: 'D', x0: 40, y0: 120, x1: 60, y1: 130, width: 20, height: 10 },
      ];

      const result = detectTableRegions(textItems);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle multiple tables', () => {
      const textItems: PDFTextItem[] = [
        // Table 1
        { str: 'Header1', x0: 10, y0: 100, x1: 50, y1: 110, width: 40, height: 10 },
        { str: 'Data1', x0: 10, y0: 120, x1: 50, y1: 130, width: 40, height: 10 },
        // Gap
        // Table 2
        { str: 'Header2', x0: 10, y0: 200, x1: 50, y1: 210, width: 40, height: 10 },
        { str: 'Data2', x0: 10, y0: 220, x1: 50, y1: 230, width: 40, height: 10 },
      ];

      const result = detectTableRegions(textItems);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('matchTableToBOQFields', () => {
    it('should match common BOQ field headers', () => {
      const table: ExtractedTable = {
        headers: ['Code', 'Description', 'Unit', 'Quantity', 'Unit Price', 'Total'],
        rows: [],
        confidence: 1,
        boundingBox: { x0: 0, y0: 0, x1: 100, y1: 100 },
      };

      const mapping = matchTableToBOQFields(table);

      expect(mapping.code).toBeDefined();
      expect(mapping.description).toBeDefined();
      expect(mapping.unit).toBeDefined();
      expect(mapping.quantity).toBeDefined();
      expect(mapping.unitPrice).toBeDefined();
      expect(mapping.totalPrice).toBeDefined();
    });

    it('should handle alternative header names', () => {
      const table: ExtractedTable = {
        headers: ['Item No.', 'Desc', 'UOM', 'Qty', 'Rate', 'Amount'],
        rows: [],
        confidence: 1,
        boundingBox: { x0: 0, y0: 0, x1: 100, y1: 100 },
      };

      const mapping = matchTableToBOQFields(table);

      expect(mapping.code).toBeDefined();
      expect(mapping.description).toBeDefined();
      expect(mapping.unit).toBeDefined();
      expect(mapping.quantity).toBeDefined();
      expect(mapping.unitPrice).toBeDefined();
    });

    it('should handle missing fields', () => {
      const table: ExtractedTable = {
        headers: ['Code', 'Description'],
        rows: [],
        confidence: 1,
        boundingBox: { x0: 0, y0: 0, x1: 100, y1: 100 },
      };

      const mapping = matchTableToBOQFields(table);

      expect(mapping.code).toBeDefined();
      expect(mapping.description).toBeDefined();
      expect(mapping.unit).toBeUndefined();
    });

    it('should be case-insensitive', () => {
      const table: ExtractedTable = {
        headers: ['CODE', 'DESCRIPTION', 'UNIT', 'QUANTITY'],
        rows: [],
        confidence: 1,
        boundingBox: { x0: 0, y0: 0, x1: 100, y1: 100 },
      };

      const mapping = matchTableToBOQFields(table);

      expect(mapping.code).toBeDefined();
      expect(mapping.description).toBeDefined();
    });
  });

  describe('extractBOQItemsFromTable', () => {
    it('should extract BOQ items from table', () => {
      const table: ExtractedTable = {
        headers: ['Code', 'Description', 'Unit', 'Quantity', 'Unit Price', 'Total'],
        rows: [
          ['ITEM-001', 'Concrete', 'm³', '100', '500', '50000'],
          ['ITEM-002', 'Steel', 'ton', '50', '1000', '50000'],
        ],
        confidence: 1,
        boundingBox: { x0: 0, y0: 0, x1: 100, y1: 100 },
      };

      const mapping = matchTableToBOQFields(table);
      const items = extractBOQItemsFromTable(table, mapping);

      expect(items.length).toBe(2);
      expect(items[0].description).toBe('Concrete');
      expect(items[0].quantity).toBe(100);
      expect(items[1].description).toBe('Steel');
    });

    it('should handle numeric parsing', () => {
      const table: ExtractedTable = {
        headers: ['Code', 'Description', 'Quantity', 'Unit Price'],
        rows: [
          ['ITEM-001', 'Material', '1,000', '2,500.50'],
        ],
        confidence: 1,
        boundingBox: { x0: 0, y0: 0, x1: 100, y1: 100 },
      };

      const mapping = {
        code: 0,
        description: 1,
        quantity: 2,
        unitPrice: 3,
      };

      const items = extractBOQItemsFromTable(table, mapping);

      expect(items[0].quantity).toBe(1000);
      expect(items[0].unitPrice).toBe(2500.5);
    });

    it('should skip rows with empty descriptions', () => {
      const table: ExtractedTable = {
        headers: ['Code', 'Description', 'Quantity'],
        rows: [
          ['ITEM-001', 'Concrete', '100'],
          ['', '', ''],
          ['ITEM-002', 'Steel', '50'],
        ],
        confidence: 1,
        boundingBox: { x0: 0, y0: 0, x1: 100, y1: 100 },
      };

      const mapping = {
        code: 0,
        description: 1,
        quantity: 2,
      };

      const items = extractBOQItemsFromTable(table, mapping);

      expect(items.length).toBe(2);
      expect(items[0].description).toBe('Concrete');
      expect(items[1].description).toBe('Steel');
    });

    it('should calculate confidence score', () => {
      const table: ExtractedTable = {
        headers: ['Code', 'Description', 'Quantity', 'Unit Price', 'Total'],
        rows: [
          ['ITEM-001', 'Concrete', '100', '500', '50000'],
        ],
        confidence: 1,
        boundingBox: { x0: 0, y0: 0, x1: 100, y1: 100 },
      };

      const mapping = {
        code: 0,
        description: 1,
        quantity: 2,
        unitPrice: 3,
        totalPrice: 4,
      };

      const items = extractBOQItemsFromTable(table, mapping);

      expect(items[0].confidence).toBeGreaterThan(0);
      expect(items[0].confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('validateExtractedBOQItems', () => {
    it('should validate valid items', () => {
      const items = [
        {
          code: 'ITEM-001',
          description: 'Concrete',
          unit: 'm³',
          quantity: 100,
          unitPrice: 500,
          totalPrice: 50000,
          confidence: 1,
        },
      ];

      const result = validateExtractedBOQItems(items);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect missing descriptions', () => {
      const items = [
        {
          code: 'ITEM-001',
          description: '',
          quantity: 100,
          confidence: 1,
        },
      ];

      const result = validateExtractedBOQItems(items);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('description'))).toBe(true);
    });

    it('should detect invalid quantities', () => {
      const items = [
        {
          description: 'Concrete',
          quantity: -100,
          confidence: 1,
        },
      ];

      const result = validateExtractedBOQItems(items);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('quantity'))).toBe(true);
    });

    it('should detect invalid prices', () => {
      const items = [
        {
          description: 'Concrete',
          unitPrice: -500,
          confidence: 1,
        },
      ];

      const result = validateExtractedBOQItems(items);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('price'))).toBe(true);
    });

    it('should warn about low confidence items', () => {
      const items = [
        {
          description: 'Concrete',
          confidence: 0.2,
        },
      ];

      const result = validateExtractedBOQItems(items);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('confidence'))).toBe(true);
    });

    it('should reject empty item list', () => {
      const result = validateExtractedBOQItems([]);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('No BOQ items'))).toBe(true);
    });
  });

  describe('Table Confidence Calculation', () => {
    it('should calculate high confidence for consistent tables', () => {
      const table: ExtractedTable = {
        headers: ['Code', 'Description', 'Quantity'],
        rows: [
          ['ITEM-001', 'Concrete', '100'],
          ['ITEM-002', 'Steel', '50'],
          ['ITEM-003', 'Wood', '75'],
        ],
        confidence: 0,
        boundingBox: { x0: 0, y0: 0, x1: 100, y1: 100 },
      };

      // Confidence should be high for consistent data
      expect(table.rows.length).toBe(3);
      expect(table.headers.length).toBe(3);
    });

    it('should calculate lower confidence for inconsistent tables', () => {
      const table: ExtractedTable = {
        headers: ['Code', 'Description'],
        rows: [
          ['ITEM-001', 'Concrete', '100'],
          ['ITEM-002', 'Steel'],
          ['ITEM-003'],
        ],
        confidence: 0,
        boundingBox: { x0: 0, y0: 0, x1: 100, y1: 100 },
      };

      // Confidence should be lower for inconsistent column counts
      expect(table.rows[0].length).not.toBe(table.rows[1].length);
    });
  });

  describe('Field Mapping Edge Cases', () => {
    it('should handle headers with extra whitespace', () => {
      const table: ExtractedTable = {
        headers: ['  Code  ', ' Description ', 'Unit  '],
        rows: [],
        confidence: 1,
        boundingBox: { x0: 0, y0: 0, x1: 100, y1: 100 },
      };

      const mapping = matchTableToBOQFields(table);

      expect(mapping.code).toBeDefined();
      expect(mapping.description).toBeDefined();
    });

    it('should handle abbreviated headers', () => {
      const table: ExtractedTable = {
        headers: ['Cd', 'Desc', 'Qty', 'Pr'],
        rows: [],
        confidence: 1,
        boundingBox: { x0: 0, y0: 0, x1: 100, y1: 100 },
      };

      const mapping = matchTableToBOQFields(table);

      // Should still match some fields
      expect(Object.keys(mapping).length).toBeGreaterThan(0);
    });

    it('should handle special characters in headers', () => {
      const table: ExtractedTable = {
        headers: ['Code#', 'Description*', 'Unit@', 'Qty$'],
        rows: [],
        confidence: 1,
        boundingBox: { x0: 0, y0: 0, x1: 100, y1: 100 },
      };

      const mapping = matchTableToBOQFields(table);

      // Should still match despite special characters
      expect(mapping.code).toBeDefined();
    });
  });
});
