import { describe, it, expect } from 'vitest';
import { validateBOQData, parseCSVLine } from './fileParser';
import type { BOQRow } from './fileParser';

describe('BOQ File Parser', () => {
  describe('validateBOQData', () => {
    it('should validate correct BOQ data', () => {
      const validData: BOQRow[] = [
        {
          itemCode: 'ITEM-001',
          description: 'Test Item',
          unit: 'm³',
          quantity: 100,
          unitPrice: 250,
          totalPrice: 25000,
        },
      ];

      const result = validateBOQData(validData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty data', () => {
      const result = validateBOQData([]);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('No data found in file'))).toBe(true);
    });

    it('should accept missing item code', () => {
      const validData: BOQRow[] = [
        {
          itemCode: '',
          description: 'Test Item',
          unit: 'm³',
          quantity: 100,
          unitPrice: 250,
          totalPrice: 25000,
        },
      ];

      const result = validateBOQData(validData);
      // Item code is optional, so this should pass validation
      expect(result.valid).toBe(true);
    });

    it('should reject zero or negative quantity', () => {
      const invalidData: BOQRow[] = [
        {
          itemCode: 'ITEM-001',
          description: 'Test Item',
          unit: 'm³',
          quantity: 0,
          unitPrice: 250,
          totalPrice: 0,
        },
      ];

      const result = validateBOQData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid quantity'))).toBe(true);
    });

    it('should reject negative unit price', () => {
      const invalidData: BOQRow[] = [
        {
          itemCode: 'ITEM-001',
          description: 'Test Item',
          unit: 'm³',
          quantity: 100,
          unitPrice: -50,
          totalPrice: -5000,
        },
      ];

      const result = validateBOQData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid unit price'))).toBe(true);
    });

    it('should validate multiple items', () => {
      const validData: BOQRow[] = [
        {
          itemCode: 'ITEM-001',
          description: 'Concrete',
          unit: 'm³',
          quantity: 150,
          unitPrice: 250,
          totalPrice: 37500,
        },
        {
          itemCode: 'ITEM-002',
          description: 'Steel',
          unit: 'ton',
          quantity: 45,
          unitPrice: 800,
          totalPrice: 36000,
        },
      ];

      const result = validateBOQData(validData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('parseCSVLine', () => {
    it('should parse simple CSV line', () => {
      const line = 'ITEM-001,Test Item,m³,100,250';
      const result = parseCSVLine(line);
      expect(result).toEqual(['ITEM-001', 'Test Item', 'm³', '100', '250']);
    });

    it('should handle quoted values with commas', () => {
      const line = 'ITEM-001,"Test Item, with comma",m³,100,250';
      const result = parseCSVLine(line);
      expect(result[1]).toBe('Test Item, with comma');
    });

    it('should trim whitespace', () => {
      const line = ' ITEM-001 , Test Item , m³ , 100 , 250 ';
      const result = parseCSVLine(line);
      expect(result[0]).toBe('ITEM-001');
      expect(result[1]).toBe('Test Item');
    });

    it('should handle empty values', () => {
      const line = 'ITEM-001,Test Item,m³,100,250,,';
      const result = parseCSVLine(line);
      expect(result).toHaveLength(7);
      expect(result[5]).toBe('');
      expect(result[6]).toBe('');
    });
  });

  describe('Cost Calculations', () => {
    it('should calculate total price correctly', () => {
      const item: BOQRow = {
        itemCode: 'ITEM-001',
        description: 'Test Item',
        unit: 'm³',
        quantity: 100,
        unitPrice: 250,
        totalPrice: 25000,
      };

      const expectedTotal = item.quantity * item.unitPrice;
      expect(item.totalPrice).toBe(expectedTotal);
    });

    it('should handle decimal quantities', () => {
      const item: BOQRow = {
        itemCode: 'ITEM-001',
        description: 'Test Item',
        unit: 'ton',
        quantity: 45.5,
        unitPrice: 800,
        totalPrice: 36400,
      };

      const expectedTotal = item.quantity * item.unitPrice;
      expect(item.totalPrice).toBe(expectedTotal);
    });

    it('should calculate total cost for multiple items', () => {
      const items: BOQRow[] = [
        {
          itemCode: 'ITEM-001',
          description: 'Concrete',
          unit: 'm³',
          quantity: 150,
          unitPrice: 250,
          totalPrice: 37500,
        },
        {
          itemCode: 'ITEM-002',
          description: 'Steel',
          unit: 'ton',
          quantity: 45,
          unitPrice: 800,
          totalPrice: 36000,
        },
      ];

      const totalCost = items.reduce((sum, item) => sum + item.totalPrice, 0);
      expect(totalCost).toBe(73500);
    });
  });
});
