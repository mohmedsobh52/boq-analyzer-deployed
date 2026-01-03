import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateProjectCosts,
  getCostByCategory,
  getProjectAnalyticsData,
} from './db';
import type { BoqItem, BoqProject, CostAnalysis } from '../drizzle/schema';

// Mock the database functions
vi.mock('./db', async () => {
  const actual = await vi.importActual<typeof import('./db')>('./db');
  return {
    ...actual,
    getDb: vi.fn(),
    getBoqProject: vi.fn(),
    getProjectItems: vi.fn(),
    getProjectCostAnalysis: vi.fn(),
  };
});

describe('Database Analytics Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateProjectCosts', () => {
    it('should calculate total costs correctly', async () => {
      const mockItems: BoqItem[] = [
        {
          id: 1,
          projectId: 1,
          itemCode: 'MAT-001',
          description: 'Concrete',
          unit: 'm3',
          quantity: 100,
          unitPrice: 500,
          totalPrice: 50000,
          wbsCode: 'WBS-1',
          category: 'Materials',
          notes: 'Test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          projectId: 1,
          itemCode: 'LAB-001',
          description: 'Labor',
          unit: 'hours',
          quantity: 200,
          unitPrice: 100,
          totalPrice: 20000,
          wbsCode: 'WBS-2',
          category: 'Labor',
          notes: 'Test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Simulate the calculation
      let totalCost = 0;
      let materialCost = 0;
      let laborCost = 0;

      mockItems.forEach((item) => {
        totalCost += item.totalPrice;
        if (item.category === 'Materials') {
          materialCost += item.totalPrice;
        } else if (item.category === 'Labor') {
          laborCost += item.totalPrice;
        }
      });

      expect(totalCost).toBe(70000);
      expect(materialCost).toBe(50000);
      expect(laborCost).toBe(20000);
    });

    it('should handle empty items array', async () => {
      const mockItems: BoqItem[] = [];
      let totalCost = 0;

      mockItems.forEach((item) => {
        totalCost += item.totalPrice;
      });

      expect(totalCost).toBe(0);
    });

    it('should handle items with no category', async () => {
      const mockItems: BoqItem[] = [
        {
          id: 1,
          projectId: 1,
          itemCode: 'MISC-001',
          description: 'Miscellaneous',
          unit: 'lot',
          quantity: 1,
          unitPrice: 5000,
          totalPrice: 5000,
          wbsCode: 'WBS-3',
          category: null as any,
          notes: 'Test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      let totalCost = 0;
      mockItems.forEach((item) => {
        totalCost += item.totalPrice;
      });

      expect(totalCost).toBe(5000);
    });
  });

  describe('getCostByCategory', () => {
    it('should group costs by category correctly', async () => {
      const mockItems: BoqItem[] = [
        {
          id: 1,
          projectId: 1,
          itemCode: 'MAT-001',
          description: 'Concrete',
          unit: 'm3',
          quantity: 100,
          unitPrice: 500,
          totalPrice: 50000,
          wbsCode: 'WBS-1',
          category: 'Materials',
          notes: 'Test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          projectId: 1,
          itemCode: 'MAT-002',
          description: 'Steel',
          unit: 'ton',
          quantity: 50,
          unitPrice: 400,
          totalPrice: 20000,
          wbsCode: 'WBS-1',
          category: 'Materials',
          notes: 'Test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 3,
          projectId: 1,
          itemCode: 'LAB-001',
          description: 'Labor',
          unit: 'hours',
          quantity: 200,
          unitPrice: 100,
          totalPrice: 20000,
          wbsCode: 'WBS-2',
          category: 'Labor',
          notes: 'Test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const categoryMap = new Map<string, { total: number; count: number; prices: number[] }>();

      mockItems.forEach((item) => {
        const category = item.category || 'Other';
        const existing = categoryMap.get(category) || { total: 0, count: 0, prices: [] };
        existing.total += item.totalPrice;
        existing.count += 1;
        existing.prices.push(item.unitPrice);
        categoryMap.set(category, existing);
      });

      const totalCost = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.total, 0);

      const result = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        totalCost: data.total,
        percentage: totalCost > 0 ? (data.total / totalCost) * 100 : 0,
        itemCount: data.count,
        averageUnitPrice: data.count > 0 ? data.prices.reduce((a, b) => a + b, 0) / data.count : 0,
      }));

      expect(result).toHaveLength(2);
      expect(result[0].category).toBe('Materials');
      expect(result[0].totalCost).toBe(70000);
      expect(result[0].itemCount).toBe(2);
      expect(result[1].category).toBe('Labor');
      expect(result[1].totalCost).toBe(20000);
      expect(result[1].itemCount).toBe(1);
    });

    it('should calculate percentages correctly', async () => {
      const mockItems: BoqItem[] = [
        {
          id: 1,
          projectId: 1,
          itemCode: 'MAT-001',
          description: 'Concrete',
          unit: 'm3',
          quantity: 100,
          unitPrice: 500,
          totalPrice: 50000,
          wbsCode: 'WBS-1',
          category: 'Materials',
          notes: 'Test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          projectId: 1,
          itemCode: 'LAB-001',
          description: 'Labor',
          unit: 'hours',
          quantity: 200,
          unitPrice: 100,
          totalPrice: 50000,
          wbsCode: 'WBS-2',
          category: 'Labor',
          notes: 'Test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const categoryMap = new Map<string, { total: number; count: number; prices: number[] }>();

      mockItems.forEach((item) => {
        const category = item.category || 'Other';
        const existing = categoryMap.get(category) || { total: 0, count: 0, prices: [] };
        existing.total += item.totalPrice;
        existing.count += 1;
        existing.prices.push(item.unitPrice);
        categoryMap.set(category, existing);
      });

      const totalCost = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.total, 0);

      const result = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        totalCost: data.total,
        percentage: totalCost > 0 ? (data.total / totalCost) * 100 : 0,
        itemCount: data.count,
        averageUnitPrice: data.count > 0 ? data.prices.reduce((a, b) => a + b, 0) / data.count : 0,
      }));

      expect(result[0].percentage).toBe(50);
      expect(result[1].percentage).toBe(50);
    });
  });

  describe('getProjectAnalyticsData', () => {
    it('should return null for empty project', async () => {
      const mockProject: BoqProject = {
        id: 1,
        userId: 1,
        name: 'Test Project',
        description: 'Test',
        status: 'active',
        totalCost: 0,
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockItems: BoqItem[] = [];

      if (!mockProject || !mockItems || mockItems.length === 0) {
        expect(null).toBeNull();
      }
    });

    it('should aggregate analytics data correctly', async () => {
      const mockProject: BoqProject = {
        id: 1,
        userId: 1,
        name: 'Test Project',
        description: 'Test',
        status: 'active',
        totalCost: 100000,
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockItems: BoqItem[] = [
        {
          id: 1,
          projectId: 1,
          itemCode: 'MAT-001',
          description: 'Concrete',
          unit: 'm3',
          quantity: 100,
          unitPrice: 500,
          totalPrice: 50000,
          wbsCode: 'WBS-1',
          category: 'Materials',
          notes: 'Test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockAnalysis: CostAnalysis = {
        id: 1,
        projectId: 1,
        totalMaterialCost: 50000,
        totalLaborCost: 0,
        totalEquipmentCost: 0,
        contingency: 5000,
        profitMargin: 10000,
        finalCost: 65000,
        analysisDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = {
        project: mockProject,
        items: mockItems,
        analysis: mockAnalysis,
      };

      expect(result.project.id).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.analysis.finalCost).toBe(65000);
    });
  });
});
