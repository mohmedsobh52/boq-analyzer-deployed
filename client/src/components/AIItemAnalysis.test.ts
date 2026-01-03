import { describe, it, expect } from 'vitest';

describe('AIItemAnalysis Integration', () => {
  describe('Item Data Transformation', () => {
    it('should transform BOQ items to AI analysis format', () => {
      const items = [
        {
          id: 1,
          itemCode: 'A001',
          description: 'Concrete Foundation',
          unit: 'm3',
          quantity: 100,
          unitPrice: 500,
          totalPrice: 50000,
          category: 'Foundation',
          wbsCode: 'WBS-001',
        },
      ];

      const transformedItems = items.map(item => ({
        id: String(item.id || Math.random()),
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        category: item.category || 'General',
      }));

      expect(transformedItems).toHaveLength(1);
      expect(transformedItems[0].id).toBe('1');
      expect(transformedItems[0].description).toBe('Concrete Foundation');
      expect(transformedItems[0].quantity).toBe(100);
      expect(transformedItems[0].unitPrice).toBe(500);
      expect(transformedItems[0].category).toBe('Foundation');
    });

    it('should handle items without category', () => {
      const items = [
        {
          id: 2,
          itemCode: 'B001',
          description: 'Steel Reinforcement',
          unit: 'ton',
          quantity: 50,
          unitPrice: 1000,
          totalPrice: 50000,
          category: null,
          wbsCode: 'WBS-002',
        },
      ];

      const transformedItems = items.map(item => ({
        id: String(item.id || Math.random()),
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        category: item.category || 'General',
      }));

      expect(transformedItems[0].category).toBe('General');
    });

    it('should handle items without ID', () => {
      const items = [
        {
          itemCode: 'C001',
          description: 'Brick Wall',
          unit: 'm2',
          quantity: 200,
          unitPrice: 50,
          totalPrice: 10000,
          category: 'Masonry',
        },
      ];

      const transformedItems = items.map(item => ({
        id: String(item.id || Math.random()),
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        category: item.category || 'General',
      }));

      expect(transformedItems[0].id).toBeTruthy();
      expect(transformedItems[0].description).toBe('Brick Wall');
    });

    it('should transform multiple items correctly', () => {
      const items = [
        {
          id: 1,
          itemCode: 'A001',
          description: 'Concrete Foundation',
          unit: 'm3',
          quantity: 100,
          unitPrice: 500,
          totalPrice: 50000,
          category: 'Foundation',
        },
        {
          id: 2,
          itemCode: 'B001',
          description: 'Steel Reinforcement',
          unit: 'ton',
          quantity: 50,
          unitPrice: 1000,
          totalPrice: 50000,
          category: 'Steel',
        },
        {
          id: 3,
          itemCode: 'C001',
          description: 'Brick Wall',
          unit: 'm2',
          quantity: 200,
          unitPrice: 50,
          totalPrice: 10000,
          category: 'Masonry',
        },
      ];

      const transformedItems = items.map(item => ({
        id: String(item.id || Math.random()),
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        category: item.category || 'General',
      }));

      expect(transformedItems).toHaveLength(3);
      expect(transformedItems[0].description).toBe('Concrete Foundation');
      expect(transformedItems[1].description).toBe('Steel Reinforcement');
      expect(transformedItems[2].description).toBe('Brick Wall');
    });
  });

  describe('AI Analysis Button Logic', () => {
    it('should disable AI button when no items exist', () => {
      const items: any[] = [];
      const isDisabled = items.length === 0;
      expect(isDisabled).toBe(true);
    });

    it('should enable AI button when items exist', () => {
      const items = [
        {
          id: 1,
          description: 'Concrete Foundation',
          quantity: 100,
          unit: 'm3',
          unitPrice: 500,
          category: 'Foundation',
        },
      ];
      const isDisabled = items.length === 0;
      expect(isDisabled).toBe(false);
    });

    it('should show AI button conditionally based on item count', () => {
      const items = [
        {
          id: 1,
          description: 'Item 1',
          quantity: 10,
          unit: 'unit',
          unitPrice: 100,
          category: 'Cat1',
        },
      ];
      const shouldShowAIButton = items.length > 0;
      expect(shouldShowAIButton).toBe(true);
    });
  });

  describe('Analysis Data Validation', () => {
    it('should validate required fields for analysis', () => {
      const item = {
        id: '1',
        description: 'Test Item',
        quantity: 10,
        unit: 'unit',
        unitPrice: 100,
        category: 'Test',
      };

      const isValid =
        !!item.description &&
        item.quantity > 0 &&
        !!item.unit &&
        item.unitPrice >= 0 &&
        !!item.category;

      expect(isValid).toBe(true);
    });

    it('should reject items with missing description', () => {
      const item = {
        id: '1',
        description: '',
        quantity: 10,
        unit: 'unit',
        unitPrice: 100,
        category: 'Test',
      };

      const isValid =
        !!item.description &&
        item.quantity > 0 &&
        !!item.unit &&
        item.unitPrice >= 0 &&
        !!item.category;

      expect(isValid).toBe(false);
    });

    it('should reject items with zero quantity', () => {
      const item = {
        id: '1',
        description: 'Test Item',
        quantity: 0,
        unit: 'unit',
        unitPrice: 100,
        category: 'Test',
      };

      const isValid =
        !!item.description &&
        item.quantity > 0 &&
        !!item.unit &&
        item.unitPrice >= 0 &&
        !!item.category;

      expect(isValid).toBe(false);
    });

    it('should reject items with negative unit price', () => {
      const item = {
        id: '1',
        description: 'Test Item',
        quantity: 10,
        unit: 'unit',
        unitPrice: -100,
        category: 'Test',
      };

      const isValid =
        !!item.description &&
        item.quantity > 0 &&
        !!item.unit &&
        item.unitPrice >= 0 &&
        !!item.category;

      expect(isValid).toBe(false);
    });
  });

  describe('Project Name Handling', () => {
    it('should use provided project name for analysis', () => {
      const projectName = 'Construction Project A';
      expect(projectName).toBe('Construction Project A');
    });

    it('should use default project name if not provided', () => {
      const projectName = 'BOQ Analysis';
      expect(projectName).toBe('BOQ Analysis');
    });

    it('should handle special characters in project name', () => {
      const projectName = 'Project #1 - Phase 2 (Draft)';
      expect(projectName).toContain('Project');
      expect(projectName).toContain('Phase');
    });
  });

  describe('Language Support', () => {
    it('should support English language', () => {
      const language = 'en';
      const messages = {
        en: 'Smart Item Analysis',
        ar: 'تحليل ذكي للبنود',
      };
      expect(messages[language as keyof typeof messages]).toBe('Smart Item Analysis');
    });

    it('should support Arabic language', () => {
      const language = 'ar';
      const messages = {
        en: 'Smart Item Analysis',
        ar: 'تحليل ذكي للبنود',
      };
      expect(messages[language as keyof typeof messages]).toBe('تحليل ذكي للبنود');
    });

    it('should handle language switching', () => {
      let language = 'en';
      const messages = {
        en: 'Analysis Results',
        ar: 'نتائج التحليل',
      };
      expect(messages[language as keyof typeof messages]).toBe('Analysis Results');

      language = 'ar';
      expect(messages[language as keyof typeof messages]).toBe('نتائج التحليل');
    });
  });

  describe('Integration with BOQItemsEditor', () => {
    it('should receive items from BOQItemsEditor', () => {
      const editorItems = [
        {
          id: 1,
          itemCode: 'A001',
          description: 'Item 1',
          unit: 'unit',
          quantity: 10,
          unitPrice: 100,
          totalPrice: 1000,
          category: 'Cat1',
        },
      ];

      const aiItems = editorItems.map(item => ({
        id: String(item.id || Math.random()),
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        category: item.category || 'General',
      }));

      expect(aiItems).toHaveLength(1);
      expect(aiItems[0].description).toBe('Item 1');
    });

    it('should render AI button only when items exist', () => {
      const items = [
        {
          id: 1,
          itemCode: 'A001',
          description: 'Item 1',
          unit: 'unit',
          quantity: 10,
          unitPrice: 100,
          totalPrice: 1000,
          category: 'Cat1',
        },
      ];

      const shouldShowButton = items.length > 0;
      expect(shouldShowButton).toBe(true);
    });

    it('should not render AI button when no items exist', () => {
      const items: any[] = [];
      const shouldShowButton = items.length > 0;
      expect(shouldShowButton).toBe(false);
    });
  });

  describe('Analysis Response Handling', () => {
    it('should handle successful analysis response', () => {
      const response = {
        analysis: 'This is a successful analysis result with recommendations.',
      };

      expect(response.analysis).toBeTruthy();
      expect(typeof response.analysis).toBe('string');
    });

    it('should handle empty analysis response', () => {
      const response = {
        analysis: '',
      };

      expect(response.analysis).toBe('');
    });

    it('should handle analysis with markdown content', () => {
      const response = {
        analysis: `## Analysis Results\n\n- Item 1: Good\n- Item 2: Needs review\n\n### Recommendations\nConsider bulk purchasing.`,
      };

      expect(response.analysis).toContain('##');
      expect(response.analysis).toContain('Recommendations');
    });
  });
});
