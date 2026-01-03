import { describe, it, expect } from 'vitest';
import {
  mapPDFDataToItems,
  detectColumnMapping,
  validateItems,
  getItemsSummary,
  deduplicateItems,
  sortItems,
  filterByCategory,
  filterByPriceRange,
  calculateStatistics,
  identifyOutliers,
  groupByCategory,
  getCostDistribution,
  type BOQItem,
  type ColumnMapping,
} from './pdfDataMapper';

describe('pdfDataMapper', () => {
  const sampleItems: BOQItem[] = [
    {
      itemCode: '001',
      description: 'Concrete Foundation',
      unit: 'm3',
      quantity: 50,
      unitPrice: 150,
      totalPrice: 7500,
      category: 'Concrete',
    },
    {
      itemCode: '002',
      description: 'Steel Reinforcement',
      unit: 'ton',
      quantity: 10,
      unitPrice: 800,
      totalPrice: 8000,
      category: 'Steel',
    },
    {
      itemCode: '003',
      description: 'Brick Work',
      unit: 'm2',
      quantity: 200,
      unitPrice: 50,
      totalPrice: 10000,
      category: 'Masonry',
    },
  ];

  describe('detectColumnMapping', () => {
    it('should detect column mapping from header row', () => {
      const headers = ['Item Code', 'Description', 'Unit', 'Quantity', 'Unit Price', 'Total'];
      const mapping = detectColumnMapping(headers);

      expect(mapping).toBeDefined();
      expect(mapping?.itemCode).toBe(0);
      expect(mapping?.description).toBe(1);
      expect(mapping?.unit).toBe(2);
      expect(mapping?.quantity).toBe(3);
      expect(mapping?.unitPrice).toBe(4);
      expect(mapping?.totalPrice).toBe(5);
    });

    it('should handle Arabic headers', () => {
      const headers = ['رمز البند', 'الوصف', 'الوحدة', 'الكمية', 'سعر الوحدة', 'الإجمالي'];
      const mapping = detectColumnMapping(headers);

      expect(mapping).toBeDefined();
      expect(mapping?.itemCode).toBeDefined();
      expect(mapping?.description).toBeDefined();
    });

    it('should return null for invalid headers', () => {
      const headers = ['Random', 'Headers', 'Without', 'Meaning'];
      const mapping = detectColumnMapping(headers);

      expect(mapping).toBeNull();
    });
  });

  describe('mapPDFDataToItems', () => {
    it('should map raw data to BOQItem objects', () => {
      const rows = [
        ['001', 'Concrete Foundation', 'm3', '50', '150', '7500'],
        ['002', 'Steel Reinforcement', 'ton', '10', '800', '8000'],
      ];

      const mapping: ColumnMapping = {
        itemCode: 0,
        description: 1,
        unit: 2,
        quantity: 3,
        unitPrice: 4,
        totalPrice: 5,
      };

      const items = mapPDFDataToItems(rows, mapping);

      expect(items).toHaveLength(2);
      expect(items[0].itemCode).toBe('001');
      expect(items[0].quantity).toBe(50);
      expect(items[0].unitPrice).toBe(150);
    });

    it('should handle Arabic numbers', () => {
      const rows = [
        ['٠٠١', 'أساس خرساني', 'm3', '٥٠', '١٥٠', '٧٥٠٠'],
      ];

      const mapping: ColumnMapping = {
        itemCode: 0,
        description: 1,
        unit: 2,
        quantity: 3,
        unitPrice: 4,
        totalPrice: 5,
      };

      const items = mapPDFDataToItems(rows, mapping);

      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(50);
      expect(items[0].unitPrice).toBe(150);
    });

    it('should calculate total price if not provided', () => {
      const rows = [
        ['001', 'Item', 'EA', '100', '25', ''],
      ];

      const mapping: ColumnMapping = {
        itemCode: 0,
        description: 1,
        unit: 2,
        quantity: 3,
        unitPrice: 4,
      };

      const items = mapPDFDataToItems(rows, mapping);

      expect(items[0].totalPrice).toBe(2500);
    });
  });

  describe('validateItems', () => {
    it('should validate valid items', () => {
      const result = validateItems(sampleItems);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.itemsProcessed).toBe(3);
    });

    it('should detect invalid items', () => {
      const invalidItems: BOQItem[] = [
        {
          itemCode: '001',
          description: '',
          unit: 'm3',
          quantity: 50,
          unitPrice: 150,
          totalPrice: 7500,
        },
        {
          itemCode: '002',
          description: 'Valid Item',
          unit: 'ton',
          quantity: -10,
          unitPrice: 800,
          totalPrice: 8000,
        },
      ];

      const result = validateItems(invalidItems);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should warn about duplicates', () => {
      const duplicateItems: BOQItem[] = [
        ...sampleItems,
        {
          itemCode: '001',
          description: 'Concrete Foundation',
          unit: 'm3',
          quantity: 50,
          unitPrice: 150,
          totalPrice: 7500,
        },
      ];

      const result = validateItems(duplicateItems);

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('getItemsSummary', () => {
    it('should calculate correct summary', () => {
      const summary = getItemsSummary(sampleItems);

      expect(summary.totalItems).toBe(3);
      expect(summary.totalQuantity).toBe(260);
      expect(summary.totalCost).toBe(25500);
      expect(summary.averageUnitPrice).toBeCloseTo(333.33, 1);
    });

    it('should handle empty items', () => {
      const summary = getItemsSummary([]);

      expect(summary.totalItems).toBe(0);
      expect(summary.totalCost).toBe(0);
    });
  });

  describe('deduplicateItems', () => {
    it('should remove duplicate items', () => {
      const duplicateItems: BOQItem[] = [
        ...sampleItems,
        {
          itemCode: '001',
          description: 'Concrete Foundation',
          unit: 'm3',
          quantity: 50,
          unitPrice: 150,
          totalPrice: 7500,
        },
      ];

      const deduped = deduplicateItems(duplicateItems);

      expect(deduped).toHaveLength(3);
    });
  });

  describe('sortItems', () => {
    it('should sort items by numeric code', () => {
      const unsorted = [...sampleItems].reverse();
      const sorted = sortItems(unsorted);

      expect(sorted[0].itemCode).toBe('001');
      expect(sorted[1].itemCode).toBe('002');
      expect(sorted[2].itemCode).toBe('003');
    });

    it('should handle non-numeric codes', () => {
      const items: BOQItem[] = [
        { ...sampleItems[0], itemCode: 'C' },
        { ...sampleItems[1], itemCode: 'A' },
        { ...sampleItems[2], itemCode: 'B' },
      ];

      const sorted = sortItems(items);

      expect(sorted[0].itemCode).toBe('A');
      expect(sorted[1].itemCode).toBe('B');
      expect(sorted[2].itemCode).toBe('C');
    });
  });

  describe('filterByCategory', () => {
    it('should filter items by category', () => {
      const filtered = filterByCategory(sampleItems, 'Concrete');

      expect(filtered).toHaveLength(1);
      expect(filtered[0].itemCode).toBe('001');
    });

    it('should return empty array for non-existent category', () => {
      const filtered = filterByCategory(sampleItems, 'NonExistent');

      expect(filtered).toHaveLength(0);
    });
  });

  describe('filterByPriceRange', () => {
    it('should filter items by price range', () => {
      const filtered = filterByPriceRange(sampleItems, 100, 500);

      expect(filtered).toHaveLength(2);
    });

    it('should handle empty range', () => {
      const filtered = filterByPriceRange(sampleItems, 1000, 2000);

      expect(filtered).toHaveLength(0);
    });
  });

  describe('calculateStatistics', () => {
    it('should calculate correct statistics', () => {
      const stats = calculateStatistics(sampleItems);

      expect(stats.minPrice).toBe(50);
      expect(stats.maxPrice).toBe(800);
      expect(stats.minQty).toBe(10);
      expect(stats.maxQty).toBe(200);
    });

    it('should handle single item', () => {
      const stats = calculateStatistics([sampleItems[0]]);

      expect(stats.minPrice).toBe(150);
      expect(stats.maxPrice).toBe(150);
      expect(stats.avgPrice).toBe(150);
    });
  });

  describe('identifyOutliers', () => {
    it('should identify price outliers', () => {
      const items: BOQItem[] = [
        { ...sampleItems[0], unitPrice: 150 },
        { ...sampleItems[1], unitPrice: 800 },
        { ...sampleItems[2], unitPrice: 50 },
        { itemCode: '004', description: 'Outlier', unit: 'EA', quantity: 1, unitPrice: 10000, totalPrice: 10000 },
      ];

      const outliers = identifyOutliers(items, 2);

      expect(outliers.length).toBeGreaterThan(0);
    });
  });

  describe('groupByCategory', () => {
    it('should group items by category', () => {
      const groups = groupByCategory(sampleItems);

      expect(Object.keys(groups)).toHaveLength(3);
      expect(groups['Concrete']).toHaveLength(1);
      expect(groups['Steel']).toHaveLength(1);
      expect(groups['Masonry']).toHaveLength(1);
    });
  });

  describe('getCostDistribution', () => {
    it('should calculate cost distribution', () => {
      const distribution = getCostDistribution(sampleItems);

      expect(Object.keys(distribution)).toHaveLength(3);
      expect(distribution['Concrete'].count).toBe(1);
      expect(distribution['Concrete'].totalCost).toBe(7500);
      expect(distribution['Concrete'].percentage).toBeCloseTo(29.41, 1);
    });
  });
});
