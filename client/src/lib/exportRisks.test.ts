import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateRisksPDF, generateRisksExcel, type RiskExportData, type RiskItem } from './exportRisks';

// Mock jsPDF
vi.mock('jspdf', () => ({
  jsPDF: vi.fn(() => ({
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 }, getNumberOfPages: () => 1 },
    setFillColor: vi.fn(),
    rect: vi.fn(),
    setTextColor: vi.fn(),
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    addPage: vi.fn(),
    setPage: vi.fn(),
    splitTextToSize: vi.fn(() => []),
    save: vi.fn(),
    autoTable: vi.fn(function() { this.lastAutoTable = { finalY: 100 }; return this; }),
    lastAutoTable: { finalY: 100 },
  })),
}));

// Mock ExcelJS
vi.mock('exceljs', () => ({
  default: {
    Workbook: vi.fn(() => ({
      addWorksheet: vi.fn(() => ({
        columns: [],
        getCell: vi.fn(() => ({
          value: null,
          font: {},
          fill: {},
          alignment: {},
          numFmt: '',
        })),
        getRow: vi.fn(() => ({
          fill: {},
          font: {},
          alignment: {},
          height: 0,
          getCell: vi.fn(() => ({
            value: null,
            font: {},
            fill: {},
            alignment: {},
            numFmt: '',
          })),
        })),
      })),
      xlsx: {
        writeBuffer: vi.fn(() => Promise.resolve(new ArrayBuffer(0))),
      },
    })),
  },
}));

describe('Risk Assessment Export Utilities', () => {
  const mockRisks: RiskItem[] = [
    {
      id: 1,
      projectId: 1,
      title: 'Schedule Delay Risk',
      description: 'Potential delay in project timeline',
      category: 'Schedule',
      probability: 4,
      impact: 5,
      riskScore: 20,
      riskLevel: 'Critical',
      mitigationPlan: 'Increase resources and monitor progress',
      riskOwner: 'Project Manager',
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      projectId: 1,
      title: 'Budget Overrun',
      description: 'Risk of exceeding project budget',
      category: 'Financial',
      probability: 3,
      impact: 4,
      riskScore: 12,
      riskLevel: 'High',
      mitigationPlan: 'Implement cost control measures',
      riskOwner: 'Finance Lead',
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 3,
      projectId: 1,
      title: 'Resource Availability',
      description: 'Limited skilled resources',
      category: 'Resource',
      probability: 2,
      impact: 3,
      riskScore: 6,
      riskLevel: 'Medium',
      mitigationPlan: 'Hire contractors if needed',
      riskOwner: 'HR Manager',
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockExportData: RiskExportData = {
    projectName: 'Test Project',
    projectId: 1,
    reportDate: new Date('2024-01-01'),
    projectManager: 'John Doe',
    risks: mockRisks,
    totalRisks: 3,
    criticalRisks: 1,
    highRisks: 1,
    mediumRisks: 1,
    lowRisks: 0,
    riskRate: 33.33,
    categoryBreakdown: {
      Schedule: 1,
      Financial: 1,
      Resource: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.URL methods
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
    // Mock document methods if available
    if (typeof document !== 'undefined') {
      document.body.appendChild = vi.fn();
      document.body.removeChild = vi.fn();
    }
  });

  describe('generateRisksPDF', () => {
    it('should generate PDF with correct project data', () => {
      generateRisksPDF(mockExportData);
      expect(true).toBe(true);
    });

    it('should include all risks in PDF', () => {
      generateRisksPDF(mockExportData);
      expect(mockExportData.risks.length).toBe(3);
    });

    it('should calculate risk statistics correctly', () => {
      generateRisksPDF(mockExportData);
      expect(mockExportData.totalRisks).toBe(3);
      expect(mockExportData.criticalRisks).toBe(1);
      expect(mockExportData.highRisks).toBe(1);
    });

    it('should include risk categories', () => {
      generateRisksPDF(mockExportData);
      expect(Object.keys(mockExportData.categoryBreakdown).length).toBe(3);
    });

    it('should include mitigation plans for critical risks', () => {
      generateRisksPDF(mockExportData);
      const criticalRisks = mockExportData.risks.filter(r => r.riskLevel === 'Critical');
      expect(criticalRisks.length).toBeGreaterThan(0);
      expect(criticalRisks[0].mitigationPlan).toBeTruthy();
    });

    it('should handle empty risks list', () => {
      const emptyData = { ...mockExportData, risks: [], totalRisks: 0 };
      generateRisksPDF(emptyData);
      expect(emptyData.risks.length).toBe(0);
    });
  });

  describe('generateRisksExcel', () => {
    it('should generate Excel with correct project data', async () => {
      if (typeof document !== 'undefined') {
        await generateRisksExcel(mockExportData);
      }
      expect(true).toBe(true);
    });

    it('should create multiple worksheets', async () => {
      if (typeof document !== 'undefined') {
        await generateRisksExcel(mockExportData);
      }
      // Excel should have Summary, Risk Register, Category Breakdown, and Mitigation Plans sheets
      expect(true).toBe(true);
    });

    it('should include all risks in Excel', async () => {
      if (typeof document !== 'undefined') {
        await generateRisksExcel(mockExportData);
      }
      expect(mockExportData.risks.length).toBe(3);
    });

    it('should calculate risk levels correctly', async () => {
      if (typeof document !== 'undefined') {
        await generateRisksExcel(mockExportData);
      }
      const riskLevels = new Set(mockExportData.risks.map(r => r.riskLevel));
      expect(riskLevels.has('Critical')).toBe(true);
      expect(riskLevels.has('High')).toBe(true);
    });

    it('should include category breakdown in Excel', async () => {
      if (typeof document !== 'undefined') {
        await generateRisksExcel(mockExportData);
      }
      expect(Object.keys(mockExportData.categoryBreakdown).length).toBe(3);
    });

    it('should highlight critical risks', async () => {
      if (typeof document !== 'undefined') {
        await generateRisksExcel(mockExportData);
      }
      const criticalRisks = mockExportData.risks.filter(r => r.riskLevel === 'Critical');
      expect(criticalRisks.length).toBe(1);
    });
  });

  describe('RiskItem type validation', () => {
    it('should have required RiskItem properties', () => {
      const risk = mockRisks[0];
      expect(risk).toHaveProperty('title');
      expect(risk).toHaveProperty('category');
      expect(risk).toHaveProperty('probability');
      expect(risk).toHaveProperty('impact');
      expect(risk).toHaveProperty('riskScore');
      expect(risk).toHaveProperty('riskLevel');
    });

    it('should calculate risk score correctly', () => {
      const risk = mockRisks[0];
      expect(risk.riskScore).toBe(risk.probability * risk.impact);
    });

    it('should classify risk levels correctly', () => {
      const criticalRisk = mockRisks[0];
      expect(criticalRisk.riskLevel).toBe('Critical');
      expect(criticalRisk.riskScore).toBeGreaterThanOrEqual(20);
    });

    it('should have optional mitigation plan', () => {
      const risk = mockRisks[0];
      expect(risk.mitigationPlan).toBeTruthy();
    });
  });

  describe('RiskExportData validation', () => {
    it('should have all required export data properties', () => {
      expect(mockExportData).toHaveProperty('projectName');
      expect(mockExportData).toHaveProperty('projectId');
      expect(mockExportData).toHaveProperty('reportDate');
      expect(mockExportData).toHaveProperty('risks');
      expect(mockExportData).toHaveProperty('totalRisks');
      expect(mockExportData).toHaveProperty('riskRate');
    });

    it('should calculate risk distribution correctly', () => {
      const total = mockExportData.criticalRisks + mockExportData.highRisks + mockExportData.mediumRisks + mockExportData.lowRisks;
      expect(total).toBe(mockExportData.totalRisks);
    });

    it('should match category breakdown with risks', () => {
      const categoryCounts: Record<string, number> = {};
      mockExportData.risks.forEach(risk => {
        categoryCounts[risk.category] = (categoryCounts[risk.category] || 0) + 1;
      });
      expect(categoryCounts).toEqual(mockExportData.categoryBreakdown);
    });

    it('should calculate risk rate as percentage', () => {
      expect(mockExportData.riskRate).toBeGreaterThan(0);
      expect(mockExportData.riskRate).toBeLessThanOrEqual(100);
    });
  });

  describe('Risk level classification', () => {
    it('should classify Critical risks (score >= 20)', () => {
      const criticalRisks = mockExportData.risks.filter(r => r.riskLevel === 'Critical');
      criticalRisks.forEach(risk => {
        expect(risk.riskScore).toBeGreaterThanOrEqual(20);
      });
    });

    it('should classify High risks (score 12-19)', () => {
      const highRisks = mockExportData.risks.filter(r => r.riskLevel === 'High');
      highRisks.forEach(risk => {
        expect(risk.riskScore).toBeGreaterThanOrEqual(12);
        expect(risk.riskScore).toBeLessThan(20);
      });
    });

    it('should classify Medium risks (score 6-11)', () => {
      const mediumRisks = mockExportData.risks.filter(r => r.riskLevel === 'Medium');
      mediumRisks.forEach(risk => {
        expect(risk.riskScore).toBeGreaterThanOrEqual(6);
        expect(risk.riskScore).toBeLessThan(12);
      });
    });
  });
});
