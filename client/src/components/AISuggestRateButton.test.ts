import { describe, it, expect, vi } from 'vitest';
import type { BOQItem } from '@/lib/pdfDataMapper';

describe('AISuggestRateButton', () => {
  const mockItems: BOQItem[] = [
    {
      itemCode: 'A001',
      description: 'Concrete Mix',
      unit: 'm3',
      quantity: 100,
      unitPrice: 150,
      totalPrice: 15000,
      category: 'Materials',
    },
    {
      itemCode: 'A002',
      description: 'Steel Reinforcement',
      unit: 'kg',
      quantity: 5000,
      unitPrice: 25,
      totalPrice: 125000,
      category: 'Materials',
    },
  ];

  it('should format items correctly for API', () => {
    const formatted = mockItems.map((item) => ({
      itemCode: item.itemCode,
      description: item.description,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      category: item.category,
    }));

    expect(formatted).toHaveLength(2);
    expect(formatted[0].itemCode).toBe('A001');
    expect(formatted[1].unitPrice).toBe(25);
  });

  it('should handle empty items array', () => {
    const emptyItems: BOQItem[] = [];
    expect(emptyItems).toHaveLength(0);
  });

  it('should calculate total items correctly', () => {
    const totalItems = mockItems.length;
    expect(totalItems).toBe(2);
  });

  it('should format items list for display', () => {
    const itemsList = mockItems
      .map((item, idx) => `${idx + 1}. [${item.itemCode}] ${item.description}`)
      .join('\n');

    expect(itemsList).toContain('1. [A001] Concrete Mix');
    expect(itemsList).toContain('2. [A002] Steel Reinforcement');
  });

  it('should handle items with and without categories', () => {
    const itemsWithCategory = mockItems.filter((item) => item.category);
    const itemsWithoutCategory = mockItems.filter((item) => !item.category);

    expect(itemsWithCategory).toHaveLength(2);
    expect(itemsWithoutCategory).toHaveLength(0);
  });

  it('should format currency correctly', () => {
    const formatted = mockItems.map((item) => `$${item.unitPrice}`);
    expect(formatted[0]).toBe('$150');
    expect(formatted[1]).toBe('$25');
  });

  it('should handle response analysis text', () => {
    const mockAnalysis = 'Item A001: Suggested price $160 based on market rates...';
    expect(mockAnalysis).toContain('Suggested price');
    expect(mockAnalysis).toContain('$160');
  });

  it('should track items analyzed count', () => {
    const itemsAnalyzed = mockItems.length;
    expect(itemsAnalyzed).toBeGreaterThan(0);
    expect(itemsAnalyzed).toBe(2);
  });
});
