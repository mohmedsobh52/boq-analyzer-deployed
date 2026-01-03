import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { VarianceData } from '@/components/VarianceAnalysis';
import type { CategoryData } from '@/components/CategoryAnalysis';

type jsPDFWithAutoTable = jsPDF & {
  autoTable: (options: any) => jsPDF;
  lastAutoTable: { finalY: number };
};

export interface PDFReportData {
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

export function generateAnalyticsPDF(data: PDFReportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  }) as jsPDFWithAutoTable;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Color scheme matching blueprint aesthetic
  const primaryColor = [55, 150, 208]; // #3796d0
  const accentColor = [100, 200, 255]; // #64c8ff
  const darkBg = [20, 28, 45]; // #141c2d
  const textColor = [255, 255, 255]; // white

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Header with blueprint aesthetic
  doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('BOQ ANALYZER', margin, 15);

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Analytics Report', margin, 25);

  // Report metadata
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(9);
  doc.text(`Project: ${data.projectName}`, pageWidth - margin - 50, 15);
  doc.text(`Date: ${data.reportDate.toLocaleDateString()}`, pageWidth - margin - 50, 22);
  if (data.projectManager) {
    doc.text(`Manager: ${data.projectManager}`, pageWidth - margin - 50, 29);
  }

  yPosition = 50;

  // Executive Summary Section
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', margin, yPosition);
  yPosition += 8;

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const summaryData = [
    ['Metric', 'Value', 'Status'],
    [
      'Total Estimated Cost',
      `$${data.summary.totalEstimated.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      'Baseline',
    ],
    [
      'Total Actual Cost',
      `$${data.summary.totalActual.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      'Current',
    ],
    [
      'Total Variance',
      `$${data.summary.totalVariance.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      data.summary.variancePercent > 0 ? 'Over Budget' : 'Under Budget',
    ],
    [
      'Variance %',
      `${data.summary.variancePercent.toFixed(1)}%`,
      Math.abs(data.summary.variancePercent) > 5 ? 'Alert' : 'Normal',
    ],
  ];

  (doc as any).autoTable({
    startY: yPosition,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
      textColor: [textColor[0], textColor[1], textColor[2]],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      textColor: [textColor[0], textColor[1], textColor[2]],
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [30, 40, 60],
    },
    rowPageBreak: 'avoid',
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Forecast Section
  if (data.forecast) {
    checkPageBreak(40);

    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Cost Forecast', margin, yPosition);
    yPosition += 8;

    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const forecastData = [
      ['Forecast Metric', 'Value'],
      [
        'Next Period Estimate',
        `$${data.forecast.nextValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      ],
      ['Trend Direction', data.forecast.trend.charAt(0).toUpperCase() + data.forecast.trend.slice(1)],
      ['Model Confidence', `${(data.forecast.confidence * 100).toFixed(1)}%`],
    ];

    (doc as any).autoTable({
      startY: yPosition,
      head: [forecastData[0]],
      body: forecastData.slice(1),
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
        textColor: [textColor[0], textColor[1], textColor[2]],
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        textColor: [textColor[0], textColor[1], textColor[2]],
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [30, 40, 60],
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Category Analysis Section
  checkPageBreak(50);

  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Cost by Category', margin, yPosition);
  yPosition += 8;

  const categoryTableData = [
    ['Category', 'Total Cost', '% of Total', 'Item Count', 'Avg Unit Price'],
    ...data.categoryData.map((cat) => [
      cat.category,
      `$${cat.totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      `${cat.percentage.toFixed(1)}%`,
      cat.itemCount.toString(),
      `$${cat.averageUnitPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
    ]),
  ];

  (doc as any).autoTable({
    startY: yPosition,
    head: [categoryTableData[0]],
    body: categoryTableData.slice(1),
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
      textColor: [textColor[0], textColor[1], textColor[2]],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      textColor: [textColor[0], textColor[1], textColor[2]],
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [30, 40, 60],
    },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'center' },
      4: { halign: 'right' },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Variance Analysis Section
  checkPageBreak(50);

  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Variance Analysis', margin, yPosition);
  yPosition += 8;

  const varianceTableData = [
    ['Category', 'Estimated', 'Actual', 'Variance', 'Variance %', 'Status'],
    ...data.varianceData.map((var_item) => [
      var_item.category,
      `$${var_item.estimated.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      `$${var_item.actual.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      `$${var_item.variance.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      `${var_item.variancePercent.toFixed(1)}%`,
      var_item.status.charAt(0).toUpperCase() + var_item.status.slice(1),
    ]),
  ];

  (doc as any).autoTable({
    startY: yPosition,
    head: [varianceTableData[0]],
    body: varianceTableData.slice(1),
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
      textColor: [textColor[0], textColor[1], textColor[2]],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      textColor: [textColor[0], textColor[1], textColor[2]],
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [30, 40, 60],
    },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'center' },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Insights Section
  if (data.insights.length > 0) {
    checkPageBreak(40);

    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Insights', margin, yPosition);
    yPosition += 8;

    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    data.insights.forEach((insight) => {
      const lines = doc.splitTextToSize(insight, pageWidth - 2 * margin);
      if (yPosition + lines.length * 5 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * 5 + 3;
    });
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      `Generated on ${new Date().toLocaleString()}`,
      margin,
      pageHeight - 10
    );
  }

  // Save the PDF
  doc.save(`BOQ-Analytics-Report-${new Date().toISOString().split('T')[0]}.pdf`);
}
