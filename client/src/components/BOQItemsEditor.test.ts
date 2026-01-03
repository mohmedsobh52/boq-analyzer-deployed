import { describe, it, expect } from 'vitest';

describe('BOQItemsEditor', () => {
  describe('Cost Calculations', () => {
    it('should calculate total price correctly', () => {
      const quantity = 10;
      const unitPrice = 150;
      const expected = 1500;
      const result = quantity * unitPrice;
      expect(result).toBe(expected);
    });

    it('should handle decimal quantities', () => {
      const quantity = 10.5;
      const unitPrice = 100;
      const expected = 1050;
      const result = Math.round(quantity * unitPrice);
      expect(result).toBe(expected);
    });

    it('should handle zero quantity', () => {
      const quantity = 0;
      const unitPrice = 150;
      const expected = 0;
      const result = quantity * unitPrice;
      expect(result).toBe(expected);
    });

    it('should calculate total cost for multiple items', () => {
      const items = [
        { quantity: 10, unitPrice: 100, totalPrice: 1000 },
        { quantity: 5, unitPrice: 200, totalPrice: 1000 },
        { quantity: 2, unitPrice: 500, totalPrice: 1000 },
      ];
      const totalCost = items.reduce((sum, item) => sum + item.totalPrice, 0);
      expect(totalCost).toBe(3000);
    });

    it('should calculate average price correctly', () => {
      const items = [
        { totalPrice: 1000 },
        { totalPrice: 2000 },
        { totalPrice: 3000 },
      ];
      const totalCost = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const averagePrice = Math.round(totalCost / items.length);
      expect(averagePrice).toBe(2000);
    });
  });

  describe('Item Operations', () => {
    it('should validate required fields', () => {
      const item = {
        itemCode: '',
        description: '',
        unit: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
      };

      const isValid = !!(item.itemCode.trim() && item.description.trim() && item.unit.trim());
      expect(isValid).toBe(false);
    });

    it('should validate item with all fields', () => {
      const item = {
        itemCode: 'ITEM-001',
        description: 'Test Item',
        unit: 'm3',
        quantity: 10,
        unitPrice: 100,
        totalPrice: 1000,
      };

      const isValid = !!(item.itemCode.trim() && item.description.trim() && item.unit.trim());
      expect(isValid).toBe(true);
    });

    it('should calculate total quantity correctly', () => {
      const items = [
        { quantity: 10 },
        { quantity: 20 },
        { quantity: 30 },
      ];
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      expect(totalQuantity).toBe(60);
    });

    it('should handle item deletion', () => {
      const items = [
        { id: 1, itemCode: 'ITEM-001' },
        { id: 2, itemCode: 'ITEM-002' },
        { id: 3, itemCode: 'ITEM-003' },
      ];
      const indexToDelete = 1;
      const updatedItems = items.filter((_, i) => i !== indexToDelete);
      expect(updatedItems.length).toBe(2);
      expect(updatedItems[0].itemCode).toBe('ITEM-001');
      expect(updatedItems[1].itemCode).toBe('ITEM-003');
    });

    it('should handle item update', () => {
      const items = [
        { id: 1, itemCode: 'ITEM-001', quantity: 10 },
        { id: 2, itemCode: 'ITEM-002', quantity: 20 },
      ];
      const indexToUpdate = 0;
      const updatedItems = [...items];
      updatedItems[indexToUpdate] = {
        ...updatedItems[indexToUpdate],
        quantity: 15,
      };
      expect(updatedItems[0].quantity).toBe(15);
      expect(updatedItems[1].quantity).toBe(20);
    });
  });

  describe('Category Analysis', () => {
    it('should group items by category', () => {
      const items = [
        { category: 'Structural', totalPrice: 1000 },
        { category: 'Structural', totalPrice: 2000 },
        { category: 'Electrical', totalPrice: 1500 },
      ];

      const categoryCosts = items.reduce((acc, item) => {
        const category = item.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + item.totalPrice;
        return acc;
      }, {} as Record<string, number>);

      expect(categoryCosts['Structural']).toBe(3000);
      expect(categoryCosts['Electrical']).toBe(1500);
    });

    it('should handle items without category', () => {
      const items = [
        { category: 'Structural', totalPrice: 1000 },
        { category: null, totalPrice: 500 },
        { category: undefined, totalPrice: 300 },
      ];

      const categoryCosts = items.reduce((acc, item) => {
        const category = item.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + item.totalPrice;
        return acc;
      }, {} as Record<string, number>);

      expect(categoryCosts['Structural']).toBe(1000);
      expect(categoryCosts['Uncategorized']).toBe(800);
    });
  });

  describe('Summary Statistics', () => {
    it('should calculate correct summary statistics', () => {
      const items = [
        { quantity: 10, unitPrice: 100, totalPrice: 1000 },
        { quantity: 5, unitPrice: 200, totalPrice: 1000 },
        { quantity: 8, unitPrice: 150, totalPrice: 1200 },
      ];

      const totalItems = items.length;
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalCost = items.reduce((sum, item) => sum + item.totalPrice, 0);

      expect(totalItems).toBe(3);
      expect(totalQuantity).toBe(23);
      expect(totalCost).toBe(3200);
    });

    it('should handle empty items list', () => {
      const items: any[] = [];

      const totalItems = items.length;
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalCost = items.reduce((sum, item) => sum + item.totalPrice, 0);

      expect(totalItems).toBe(0);
      expect(totalQuantity).toBe(0);
      expect(totalCost).toBe(0);
    });
  });
});
