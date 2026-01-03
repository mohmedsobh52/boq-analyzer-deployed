import { describe, it, expect } from 'vitest';
import {
  linearRegression,
  forecastValues,
  analyzeCostByCategory,
  calculateVariance,
  calculateTrend,
  movingAverage,
  calculateStatistics,
  identifyOutliers,
  calculateEfficiency,
  generateInsights,
} from './analytics';

describe('Analytics Utilities', () => {
  describe('linearRegression', () => {
    it('should calculate linear regression correctly', () => {
      const data = [10, 20, 30, 40, 50];
      const result = linearRegression(data);

      expect(result.slope).toBeGreaterThan(0);
      expect(result.intercept).toBeDefined();
    });

    it('should handle single data point', () => {
      const data = [100];
      const result = linearRegression(data);

      expect(result.slope).toBe(0);
      expect(result.intercept).toBe(100);
    });

    it('should handle constant values', () => {
      const data = [50, 50, 50, 50];
      const result = linearRegression(data);

      expect(result.slope).toBe(0);
      expect(result.intercept).toBe(50);
    });
  });

  describe('forecastValues', () => {
    it('should forecast future values', () => {
      const data = [100, 120, 140, 160];
      const result = forecastValues(data, 2);

      expect(result.forecast).toHaveLength(2);
      expect(result.forecast[0]).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should identify increasing trend', () => {
      const data = [100, 120, 140, 160];
      const result = forecastValues(data);

      expect(result.trend).toBe('increasing');
    });

    it('should identify decreasing trend', () => {
      const data = [160, 140, 120, 100];
      const result = forecastValues(data);

      expect(result.trend).toBe('decreasing');
    });

    it('should identify stable trend', () => {
      const data = [100, 100, 100, 100, 100];
      const result = forecastValues(data);

      expect(result.trend).toBe('stable');
    });
  });

  describe('analyzeCostByCategory', () => {
    it('should analyze costs by category', () => {
      const items = [
        { category: 'A', totalPrice: 1000 },
        { category: 'A', totalPrice: 2000 },
        { category: 'B', totalPrice: 3000 },
      ];

      const result = analyzeCostByCategory(items);

      expect(result).toHaveLength(2);
      expect(result[0].category).toBe('A');
      expect(result[0].totalCost).toBe(3000);
      expect(result[0].percentage).toBeCloseTo(50, 0);
    });

    it('should handle uncategorized items', () => {
      const items = [
        { totalPrice: 1000 },
        { category: 'A', totalPrice: 2000 },
      ];

      const result = analyzeCostByCategory(items);

      expect(result.some((r) => r.category === 'Uncategorized')).toBe(true);
    });

    it('should calculate average unit price', () => {
      const items = [
        { category: 'A', totalPrice: 1000 },
        { category: 'A', totalPrice: 2000 },
      ];

      const result = analyzeCostByCategory(items);

      expect(result[0].averageUnitPrice).toBe(1500);
    });
  });

  describe('calculateVariance', () => {
    it('should calculate over budget variance', () => {
      const result = calculateVariance(1000, 1100);

      expect(result.variance).toBe(100);
      expect(result.variancePercent).toBe(10);
      expect(result.status).toBe('over');
    });

    it('should calculate under budget variance', () => {
      const result = calculateVariance(1000, 900);

      expect(result.variance).toBe(-100);
      expect(result.variancePercent).toBe(-10);
      expect(result.status).toBe('under');
    });

    it('should identify on-budget status', () => {
      const result = calculateVariance(1000, 1020);

      expect(result.status).toBe('on-budget');
    });
  });

  describe('calculateTrend', () => {
    it('should identify upward trend', () => {
      const result = calculateTrend(110, 100, 'Q1');

      expect(result.trend).toBe('up');
      expect(result.changePercent).toBe(10);
    });

    it('should identify downward trend', () => {
      const result = calculateTrend(90, 100, 'Q1');

      expect(result.trend).toBe('down');
      expect(result.changePercent).toBe(-10);
    });

    it('should identify stable trend', () => {
      const result = calculateTrend(101, 100, 'Q1');

      expect(result.trend).toBe('stable');
    });
  });

  describe('movingAverage', () => {
    it('should calculate moving average', () => {
      const data = [10, 20, 30, 40, 50];
      const result = movingAverage(data, 3);

      expect(result).toHaveLength(5);
      expect(result[2]).toBe(30); // Average of 10, 20, 30, 40 (centered window)
    });

    it('should handle edge cases', () => {
      const data = [100];
      const result = movingAverage(data, 3);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(100);
    });
  });

  describe('calculateStatistics', () => {
    it('should calculate statistics correctly', () => {
      const data = [10, 20, 30, 40, 50];
      const result = calculateStatistics(data);

      expect(result.min).toBe(10);
      expect(result.max).toBe(50);
      expect(result.mean).toBe(30);
      expect(result.median).toBe(30);
      expect(result.stdDev).toBeGreaterThan(0);
    });

    it('should handle empty data', () => {
      const result = calculateStatistics([]);

      expect(result.min).toBe(0);
      expect(result.max).toBe(0);
      expect(result.mean).toBe(0);
    });

    it('should calculate median for even length array', () => {
      const data = [10, 20, 30, 40];
      const result = calculateStatistics(data);

      expect(result.median).toBe(25);
    });
  });

  describe('identifyOutliers', () => {
    it('should identify outliers using IQR method', () => {
      const data = [10, 12, 14, 16, 18, 100]; // 100 is an outlier
      const result = identifyOutliers(data);

      expect(result.outliers.length).toBeGreaterThan(0);
      expect(result.outliers.includes(100)).toBe(true);
    });

    it('should handle data without outliers', () => {
      const data = [10, 12, 14, 16, 18];
      const result = identifyOutliers(data);

      expect(result.outliers).toHaveLength(0);
    });

    it('should handle insufficient data', () => {
      const data = [10, 20];
      const result = identifyOutliers(data);

      expect(result.outliers).toHaveLength(0);
    });
  });

  describe('calculateEfficiency', () => {
    it('should calculate efficiency metrics', () => {
      const items = [
        { quantity: 100, unitPrice: 10, totalPrice: 1000 },
        { quantity: 50, unitPrice: 20, totalPrice: 1000 },
      ];

      const result = calculateEfficiency(items);

      expect(result.totalItems).toBe(2);
      expect(result.totalQuantity).toBe(150);
      expect(result.totalCost).toBe(2000);
      expect(result.costPerUnit).toBeCloseTo(13.33, 1);
    });
  });

  describe('generateInsights', () => {
    it('should generate insights from BOQ data', () => {
      const items = [
        { category: 'A', quantity: 100, unitPrice: 10, totalPrice: 1000 },
        { category: 'A', quantity: 50, unitPrice: 20, totalPrice: 1000 },
        { category: 'B', quantity: 10, unitPrice: 100, totalPrice: 1000 },
      ];

      const insights = generateInsights(items);

      expect(insights).toBeInstanceOf(Array);
      expect(insights.length).toBeGreaterThan(0);
      expect(typeof insights[0]).toBe('string');
    });

    it('should handle empty data', () => {
      const insights = generateInsights([]);

      expect(insights).toHaveLength(1);
      expect(insights[0]).toContain('No data');
    });

    it('should identify high cost variance', () => {
      const items = [
        { category: 'A', quantity: 100, unitPrice: 10, totalPrice: 1000 },
        { category: 'A', quantity: 100, unitPrice: 100, totalPrice: 10000 },
      ];

      const insights = generateInsights(items);

      expect(insights.some((i) => i.includes('variance'))).toBe(true);
    });
  });
});
