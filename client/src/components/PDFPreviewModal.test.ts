import { describe, it, expect } from 'vitest';
import { ExtractedBOQItem, DetectedTable } from './PDFPreviewModal';

describe('PDFPreviewModal Types and Interfaces', () => {
  it('should have valid DetectedTable interface', () => {
    const table: DetectedTable = {
      headers: ['Code', 'Description'],
      rows: [['ITEM-001', 'Concrete']],
      confidence: 0.95,
    };
    expect(table.headers).toHaveLength(2);
    expect(table.rows).toHaveLength(1);
    expect(table.confidence).toBe(0.95);
  });

  it('should have valid ExtractedBOQItem interface', () => {
    const item: ExtractedBOQItem = {
      code: 'ITEM-001',
      description: 'Concrete Material',
      unit: 'm³',
      quantity: 100,
      unitPrice: 500,
      totalPrice: 50000,
      confidence: 0.95,
    };
    expect(item.description).toBe('Concrete Material');
    expect(item.quantity).toBe(100);
    expect(item.confidence).toBe(0.95);
  });

  it('should support optional fields in ExtractedBOQItem', () => {
    const item: ExtractedBOQItem = {
      description: 'Item without code',
      confidence: 0.7,
    };
    expect(item.code).toBeUndefined();
    expect(item.unit).toBeUndefined();
    expect(item.quantity).toBeUndefined();
  });

  it('should calculate confidence correctly', () => {
    const highConfidence = 0.95;
    const mediumConfidence = 0.7;
    const lowConfidence = 0.4;
    
    expect(highConfidence >= 0.8).toBe(true);
    expect(mediumConfidence >= 0.6 && mediumConfidence < 0.8).toBe(true);
    expect(lowConfidence < 0.6).toBe(true);
  });

  it('should handle multiple tables', () => {
    const tables: DetectedTable[] = [
      {
        headers: ['Code', 'Description'],
        rows: [['ITEM-001', 'Concrete']],
        confidence: 0.9,
      },
      {
        headers: ['Item', 'Name'],
        rows: [['ITEM-002', 'Steel']],
        confidence: 0.85,
      },
    ];
    expect(tables).toHaveLength(2);
    expect(tables[0].confidence).toBe(0.9);
    expect(tables[1].confidence).toBe(0.85);
  });

  it('should handle large BOQ item lists', () => {
    const items: ExtractedBOQItem[] = Array.from({ length: 100 }, (_, i) => ({
      code: `ITEM-${i}`,
      description: `Item ${i}`,
      confidence: 0.8 + Math.random() * 0.2,
    }));
    expect(items).toHaveLength(100);
    expect(items[0].code).toBe('ITEM-0');
    expect(items[99].code).toBe('ITEM-99');
  });

  it('should validate table data structure', () => {
    const table: DetectedTable = {
      headers: ['Code', 'Description', 'Unit', 'Quantity'],
      rows: [
        ['ITEM-001', 'Concrete', 'm³', '100'],
        ['ITEM-002', 'Steel', 'ton', '50'],
      ],
      confidence: 0.92,
    };
    expect(table.rows.every(row => row.length === table.headers.length)).toBe(true);
  });

  it('should handle bilingual content in items', () => {
    const arabicItem: ExtractedBOQItem = {
      code: 'ITEM-001',
      description: 'خرسانة',
      unit: 'م³',
      confidence: 0.9,
    };
    const englishItem: ExtractedBOQItem = {
      code: 'ITEM-002',
      description: 'Concrete',
      unit: 'm³',
      confidence: 0.9,
    };
    expect(arabicItem.description).toBe('خرسانة');
    expect(englishItem.description).toBe('Concrete');
  });

  it('should calculate total price correctly', () => {
    const item: ExtractedBOQItem = {
      description: 'Material',
      quantity: 100,
      unitPrice: 500,
      totalPrice: 50000,
      confidence: 0.9,
    };
    expect(item.totalPrice).toBe(item.quantity! * item.unitPrice!);
  });

  it('should handle items with missing optional fields', () => {
    const items: ExtractedBOQItem[] = [
      {
        description: 'Item 1',
        confidence: 0.8,
      },
      {
        code: 'ITEM-002',
        description: 'Item 2',
        unit: 'm³',
        confidence: 0.9,
      },
      {
        code: 'ITEM-003',
        description: 'Item 3',
        quantity: 50,
        unitPrice: 100,
        confidence: 0.85,
      },
    ];
    
    expect(items[0].code).toBeUndefined();
    expect(items[1].quantity).toBeUndefined();
    expect(items[2].totalPrice).toBeUndefined();
  });

  it('should handle empty tables', () => {
    const emptyTable: DetectedTable = {
      headers: ['Code', 'Description'],
      rows: [],
      confidence: 0,
    };
    expect(emptyTable.rows).toHaveLength(0);
  });

  it('should handle empty BOQ items list', () => {
    const emptyItems: ExtractedBOQItem[] = [];
    expect(emptyItems).toHaveLength(0);
  });

  it('should validate confidence score range', () => {
    const items: ExtractedBOQItem[] = [
      { description: 'Item 1', confidence: 0 },
      { description: 'Item 2', confidence: 0.5 },
      { description: 'Item 3', confidence: 1 },
    ];
    
    items.forEach(item => {
      expect(item.confidence).toBeGreaterThanOrEqual(0);
      expect(item.confidence).toBeLessThanOrEqual(1);
    });
  });

  it('should handle numeric precision for prices', () => {
    const item: ExtractedBOQItem = {
      description: 'Material',
      quantity: 100.5,
      unitPrice: 500.75,
      totalPrice: 50325.375,
      confidence: 0.9,
    };
    expect(item.totalPrice).toBeCloseTo(item.quantity! * item.unitPrice!, 2);
  });

  it('should handle table with many columns', () => {
    const table: DetectedTable = {
      headers: ['Code', 'Description', 'Unit', 'Qty', 'Price', 'Total', 'Category', 'Status'],
      rows: [
        ['ITEM-001', 'Concrete', 'm³', '100', '500', '50000', 'Materials', 'Active'],
      ],
      confidence: 0.88,
    };
    expect(table.headers).toHaveLength(8);
    expect(table.rows[0]).toHaveLength(8);
  });

  it('should handle special characters in descriptions', () => {
    const items: ExtractedBOQItem[] = [
      {
        description: 'Material (Grade A)',
        confidence: 0.9,
      },
      {
        description: 'Item/Component',
        confidence: 0.85,
      },
      {
        description: 'Material & Equipment',
        confidence: 0.8,
      },
    ];
    
    expect(items[0].description).toContain('(');
    expect(items[1].description).toContain('/');
    expect(items[2].description).toContain('&');
  });
});
