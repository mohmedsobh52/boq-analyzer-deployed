import ExcelJS from 'exceljs';
import type { VarianceData } from '@/components/VarianceAnalysis';
import type { CategoryData } from '@/components/CategoryAnalysis';

export interface ExcelReportData {
  projectName: string;
  reportDate: Date;
  projectManager?: string;
  summary: {
    totalEstimated: number;
    totalActual: number;
    totalVariance: number;
    variancePercent: number;
  };
  forecast?: {
    nextValue: number;
    trend: string;
    confidence: number;
  };
  categoryData: CategoryData[];
  varianceData: VarianceData[];
  insights: string[];
}

export async function generateAnalyticsExcel(data: ExcelReportData): Promise<void> {
  const workbook = new ExcelJS.Workbook();

  // Define colors
  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3796d0' } } as any;
  const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  const accentFont = { bold: true, color: { argb: 'FF141c2d' }, size: 10 };
  const alternateRowFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e283c' } } as any;
  const alternateRowFont = { color: { argb: 'FFFFFFFF' }, size: 10 };

  // Sheet 1: Summary
  const summarySheet = workbook.addWorksheet('Summary', {
    pageSetup: { paperSize: 9, orientation: 'portrait' },
  });

  summarySheet.columns = [
    { header: 'BOQ ANALYZER - Analytics Report', width: 40 },
    { header: '', width: 20 },
  ];

  // Title
  let row = 1;
  summarySheet.getCell(row, 1).value = 'BOQ ANALYZER - Analytics Report';
  summarySheet.getCell(row, 1).font = { bold: true, size: 14, color: { argb: 'FF64c8ff' } };
  row += 2;

  // Project Info
  summarySheet.getCell(row, 1).value = 'Project Name:';
  summarySheet.getCell(row, 1).font = accentFont;
  summarySheet.getCell(row, 2).value = data.projectName;
  row++;

  summarySheet.getCell(row, 1).value = 'Report Date:';
  summarySheet.getCell(row, 1).font = accentFont;
  summarySheet.getCell(row, 2).value = data.reportDate.toLocaleDateString();
  row++;

  if (data.projectManager) {
    summarySheet.getCell(row, 1).value = 'Project Manager:';
    summarySheet.getCell(row, 1).font = accentFont;
    summarySheet.getCell(row, 2).value = data.projectManager;
    row++;
  }

  row += 2;

  // Summary Table
  summarySheet.getCell(row, 1).value = 'Financial Summary';
  summarySheet.getCell(row, 1).font = { bold: true, size: 12, color: { argb: 'FF64c8ff' } };
  row++;

  const summaryHeaders = ['Metric', 'Value', 'Status'];
  summaryHeaders.forEach((header, idx) => {
    const cell = summarySheet.getCell(row, idx + 1);
    cell.value = header;
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { horizontal: 'center' as any, vertical: 'middle' as any };
  });
  row++;

  const summaryRows = [
    [
      'Total Estimated Cost',
      data.summary.totalEstimated,
      'Baseline',
    ],
    [
      'Total Actual Cost',
      data.summary.totalActual,
      'Current',
    ],
    [
      'Total Variance',
      data.summary.totalVariance,
      data.summary.variancePercent > 0 ? 'Over Budget' : 'Under Budget',
    ],
    [
      'Variance %',
      `${data.summary.variancePercent.toFixed(1)}%`,
      Math.abs(data.summary.variancePercent) > 5 ? 'Alert' : 'Normal',
    ],
  ];

  summaryRows.forEach((rowData, idx) => {
    rowData.forEach((value, colIdx) => {
      const cell = summarySheet.getCell(row, colIdx + 1);
      cell.value = value;
      if (idx % 2 === 1) {
        cell.fill = alternateRowFill;
        cell.font = alternateRowFont;
      }
      if (colIdx === 1 && typeof value === 'number') {
        cell.numFmt = '$#,##0.00';
      }
    });
    row++;
  });

  // Sheet 2: Category Analysis
  const categorySheet = workbook.addWorksheet('Category Analysis');

  categorySheet.columns = [
    { header: 'Category', width: 20 },
    { header: 'Total Cost', width: 15 },
    { header: '% of Total', width: 12 },
    { header: 'Item Count', width: 12 },
    { header: 'Avg Unit Price', width: 15 },
  ];

  // Headers
  categorySheet.getRow(1).fill = headerFill;
  categorySheet.getRow(1).font = headerFont;
  categorySheet.getRow(1).alignment = { horizontal: 'center' as any, vertical: 'middle' as any };

  // Data
  data.categoryData.forEach((cat, idx) => {
    const rowNum = idx + 2;
    const categoryRow = categorySheet.getRow(rowNum);

    categoryRow.getCell(1).value = cat.category;
    categoryRow.getCell(2).value = cat.totalCost;
    categoryRow.getCell(2).numFmt = '$#,##0.00';
    categoryRow.getCell(3).value = cat.percentage / 100;
    categoryRow.getCell(3).numFmt = '0.0%';
    categoryRow.getCell(4).value = cat.itemCount;
    categoryRow.getCell(5).value = cat.averageUnitPrice;
    categoryRow.getCell(5).numFmt = '$#,##0.00';

    if (idx % 2 === 1) {
      categoryRow.fill = alternateRowFill;
      categoryRow.font = alternateRowFont;
    }

    categoryRow.alignment = { horizontal: 'right' as any, vertical: 'middle' as any };
    categoryRow.getCell(1).alignment = { horizontal: 'left' as any, vertical: 'middle' as any };
  });

  // Sheet 3: Variance Analysis
  const varianceSheet = workbook.addWorksheet('Variance Analysis');

  varianceSheet.columns = [
    { header: 'Category', width: 20 },
    { header: 'Estimated', width: 15 },
    { header: 'Actual', width: 15 },
    { header: 'Variance', width: 15 },
    { header: 'Variance %', width: 12 },
    { header: 'Status', width: 12 },
  ];

  // Headers
  varianceSheet.getRow(1).fill = headerFill;
  varianceSheet.getRow(1).font = headerFont;
  varianceSheet.getRow(1).alignment = { horizontal: 'center' as any, vertical: 'middle' as any };

  // Data
  data.varianceData.forEach((variance, idx) => {
    const rowNum = idx + 2;
    const varianceRow = varianceSheet.getRow(rowNum);

    varianceRow.getCell(1).value = variance.category;
    varianceRow.getCell(2).value = variance.estimated;
    varianceRow.getCell(2).numFmt = '$#,##0.00';
    varianceRow.getCell(3).value = variance.actual;
    varianceRow.getCell(3).numFmt = '$#,##0.00';
    varianceRow.getCell(4).value = variance.variance;
    varianceRow.getCell(4).numFmt = '$#,##0.00';
    varianceRow.getCell(5).value = variance.variancePercent / 100;
    varianceRow.getCell(5).numFmt = '0.0%';
    varianceRow.getCell(6).value = variance.status;

    if (idx % 2 === 1) {
      varianceRow.fill = alternateRowFill;
      varianceRow.font = alternateRowFont;
    }

    varianceRow.alignment = { horizontal: 'right' as any, vertical: 'middle' as any };
    varianceRow.getCell(1).alignment = { horizontal: 'left' as any, vertical: 'middle' as any };
    varianceRow.getCell(6).alignment = { horizontal: 'center' as any, vertical: 'middle' as any };
  });

  // Sheet 4: Forecast (if available)
  if (data.forecast) {
    const forecastSheet = workbook.addWorksheet('Forecast');

    forecastSheet.columns = [
      { header: 'Forecast Metric', width: 25 },
      { header: 'Value', width: 20 },
    ];

    // Headers
    forecastSheet.getRow(1).fill = headerFill;
    forecastSheet.getRow(1).font = headerFont;

    const forecastData = [
      ['Next Period Estimate', data.forecast.nextValue],
      ['Trend Direction', data.forecast.trend.charAt(0).toUpperCase() + data.forecast.trend.slice(1)],
      ['Model Confidence', `${(data.forecast.confidence * 100).toFixed(1)}%`],
    ];

    forecastData.forEach((rowData, idx) => {
      const rowNum = idx + 2;
      const forecastRow = forecastSheet.getRow(rowNum);

      forecastRow.getCell(1).value = rowData[0];
      forecastRow.getCell(2).value = rowData[1];

      if (typeof rowData[1] === 'number') {
        forecastRow.getCell(2).numFmt = '$#,##0.00';
      }

      if (idx % 2 === 1) {
        forecastRow.fill = alternateRowFill;
        forecastRow.font = alternateRowFont;
      }

      forecastRow.alignment = { horizontal: 'left' as any, vertical: 'middle' as any };
      forecastRow.getCell(2).alignment = { horizontal: 'right' as any, vertical: 'middle' as any };
    });
  }

  // Sheet 5: Insights
  if (data.insights.length > 0) {
    const insightsSheet = workbook.addWorksheet('Insights');

    insightsSheet.columns = [{ header: 'Key Insights', width: 80 }];

    // Header
    insightsSheet.getRow(1).fill = headerFill;
    insightsSheet.getRow(1).font = headerFont;

    // Insights
    data.insights.forEach((insight, idx) => {
      const rowNum = idx + 2;
      const insightRow = insightsSheet.getRow(rowNum);
      insightRow.getCell(1).value = insight;
      insightRow.getCell(1).alignment = { horizontal: 'left' as any, vertical: 'top', wrapText: true };

      if (idx % 2 === 1) {
        insightRow.fill = alternateRowFill;
        insightRow.font = alternateRowFont;
      }

      insightRow.height = 30;
    });
  }

  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `BOQ-Analytics-Report-${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
