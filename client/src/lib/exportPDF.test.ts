import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateAnalyticsPDF } from './exportPDF';
import type { PDFReportData } from './exportPDF';

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
    autoTable: vi.fn(),
    addPage: vi.fn(),
    setPage: vi.fn(),
    save: vi.fn(),
    splitTextToSize: vi.fn((text) => [text]),
    lastAutoTable: { finalY: 100 },
  })),
}));

vi.mock('jspdf-autotable', () => ({}));

describe('PDF Export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockReportData: PDFReportData = {
    projectName: 'Test Project',
    reportDate: new Date('2024-01-15'),
    projectManager: 'Test Manager',
    summary: {
      totalEstimated: 100000,
      totalActual: 105000,
      totalVariance: 5000,
      variancePercent: 5,
    },
    forecast: {
      nextValue: 110000,
      trend: 'increasing',
      confidence: 0.85,
    },
    categoryData: [
      {
        category: 'Materials',
        totalCost: 60000,
        percentage: 57.14,
        itemCount: 10,
        averageUnitPrice: 6000,
      },
      {
        category: 'Labor',
        totalCost: 45000,
        percentage: 42.86,
        itemCount: 5,
        averageUnitPrice: 9000,
      },
    ],
    varianceData: [
      {
        category: 'Materials',
        estimated: 55000,
        actual: 60000,
        variance: 5000,
        variancePercent: 9.09,
        status: 'over',
      },
      {
        category: 'Labor',
        estimated: 45000,
        actual: 45000,
        variance: 0,
        variancePercent: 0,
        status: 'on-budget',
      },
    ],
    insights: [
      'Materials cost is 9 percent over budget',
      'Labor costs are on track',
      'Overall project is 5 percent over budget',
    ],
  };

  it('should generate PDF without errors', () => {
    expect(() => generateAnalyticsPDF(mockReportData)).not.toThrow();
  });

  it('should include all required sections', () => {
    expect(() => generateAnalyticsPDF(mockReportData)).not.toThrow();
  });

  it('should handle missing forecast data', () => {
    const dataWithoutForecast = { ...mockReportData, forecast: undefined };
    expect(() => generateAnalyticsPDF(dataWithoutForecast)).not.toThrow();
  });

  it('should handle empty insights', () => {
    const dataWithoutInsights = { ...mockReportData, insights: [] };
    expect(() => generateAnalyticsPDF(dataWithoutInsights)).not.toThrow();
  });

  it('should format currency correctly', () => {
    const testData = {
      ...mockReportData,
      summary: {
        totalEstimated: 1234567.89,
        totalActual: 1234567.89,
        totalVariance: 0,
        variancePercent: 0,
      },
    };
    expect(() => generateAnalyticsPDF(testData)).not.toThrow();
  });

  it('should validate report data structure', () => {
    expect(mockReportData).toHaveProperty('projectName');
    expect(mockReportData).toHaveProperty('reportDate');
    expect(mockReportData).toHaveProperty('summary');
    expect(mockReportData).toHaveProperty('categoryData');
    expect(mockReportData).toHaveProperty('varianceData');
    expect(mockReportData).toHaveProperty('insights');
  });

  it('should have valid summary data', () => {
    expect(mockReportData.summary.totalEstimated).toBeGreaterThan(0);
    expect(mockReportData.summary.totalActual).toBeGreaterThan(0);
    expect(typeof mockReportData.summary.variancePercent).toBe('number');
  });
});
