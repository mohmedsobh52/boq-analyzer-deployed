import { jsPDF } from 'jspdf';
import ExcelJS from 'exceljs';

// Type definition for Risk Assessments
export interface RiskItem {
  id: number;
  projectId: number;
  title: string;
  description?: string | null;
  category: string;
  probability: number;
  impact: number;
  riskScore: number;
  riskLevel: string;
  mitigationPlan?: string | null;
  riskOwner?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Import jspdf-autotable plugin dynamically
try {
  require('jspdf-autotable');
} catch (e) {
  console.warn('jspdf-autotable not available, PDF export may have limited table support');
}

type jsPDFWithAutoTable = jsPDF & {
  autoTable: (options: any) => jsPDF;
  lastAutoTable: { finalY: number };
};

export interface RiskExportData {
  projectName: string;
  projectId: number;
  reportDate: Date;
  projectManager?: string;
  risks: RiskItem[];
  totalRisks: number;
  criticalRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  riskRate: number;
  categoryBreakdown: Record<string, number>;
}

export function generateRisksPDF(data: RiskExportData): void {
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
  const criticalColor = [220, 38, 38]; // red
  const warningColor = [245, 158, 11]; // amber

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Header
  doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('RISK ASSESSMENT REPORT', margin, 15);

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Project Risk Analysis & Mitigation Plan', margin, 25);

  // Report metadata
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(9);
  doc.text(`Project: ${data.projectName}`, pageWidth - margin - 50, 15);
  doc.text(`Date: ${data.reportDate.toLocaleDateString()}`, pageWidth - margin - 50, 22);
  if (data.projectManager) {
    doc.text(`Manager: ${data.projectManager}`, pageWidth - margin - 50, 29);
  }

  yPosition = 50;

  // Risk Summary Section
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Risk Summary', margin, yPosition);
  yPosition += 8;

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const summaryData = [
    ['Metric', 'Count', 'Status'],
    ['Total Risks', data.totalRisks.toString(), 'All'],
    ['Critical Risks', data.criticalRisks.toString(), 'High Priority'],
    ['High Risks', data.highRisks.toString(), 'Monitor'],
    ['Medium Risks', data.mediumRisks.toString(), 'Track'],
    ['Low Risks', data.lowRisks.toString(), 'Accept'],
    ['Overall Risk Rate', `${data.riskRate.toFixed(1)}%`, 'Project Health'],
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

  // Risk Register Section
  checkPageBreak(50);

  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Risk Register', margin, yPosition);
  yPosition += 8;

  const riskTableData = [
    ['ID', 'Title', 'Category', 'Prob', 'Impact', 'Score', 'Level', 'Status'],
    ...data.risks.map((risk, idx) => [
      (idx + 1).toString(),
      risk.title.substring(0, 20),
      risk.category.substring(0, 12),
      risk.probability.toString(),
      risk.impact.toString(),
      risk.riskScore.toString(),
      risk.riskLevel,
      risk.status.charAt(0).toUpperCase() + risk.status.slice(1),
    ]),
  ];

  (doc as any).autoTable({
    startY: yPosition,
    head: [riskTableData[0]],
    body: riskTableData.slice(1),
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
      textColor: [textColor[0], textColor[1], textColor[2]],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      textColor: [textColor[0], textColor[1], textColor[2]],
      fontSize: 7,
    },
    alternateRowStyles: {
      fillColor: [30, 40, 60],
    },
    columnStyles: {
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center' },
      7: { halign: 'center' },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Category Breakdown Section
  checkPageBreak(30);

  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Risk Distribution by Category', margin, yPosition);
  yPosition += 8;

  const categoryData = [
    ['Risk Category', 'Count'],
    ...Object.entries(data.categoryBreakdown).map(([category, count]) => [
      category,
      count.toString(),
    ]),
  ];

  (doc as any).autoTable({
    startY: yPosition,
    head: [categoryData[0]],
    body: categoryData.slice(1),
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
    columnStyles: {
      1: { halign: 'right' },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Mitigation Plans Section
  checkPageBreak(40);

  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Mitigation Plans', margin, yPosition);
  yPosition += 8;

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const criticalAndHighRisks = data.risks.filter(r => r.riskLevel === 'Critical' || r.riskLevel === 'High');
  
  if (criticalAndHighRisks.length > 0) {
    criticalAndHighRisks.forEach((risk) => {
      if (yPosition + 20 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setTextColor(warningColor[0], warningColor[1], warningColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`${risk.title} (${risk.riskLevel})`, margin, yPosition);
      yPosition += 5;

      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont('helvetica', 'normal');
      doc.text(`Owner: ${risk.riskOwner || 'Not assigned'}`, margin + 5, yPosition);
      yPosition += 4;

      if (risk.mitigationPlan) {
        const lines = doc.splitTextToSize(`Plan: ${risk.mitigationPlan}`, pageWidth - 2 * margin - 5);
        doc.text(lines, margin + 5, yPosition);
        yPosition += lines.length * 4 + 2;
      }

      yPosition += 3;
    });
  } else {
    doc.text('No critical or high-risk items require immediate mitigation.', margin, yPosition);
    yPosition += 8;
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
  doc.save(`Risk-Assessment-${data.projectName}-${new Date().toISOString().split('T')[0]}.pdf`);
}

export async function generateRisksExcel(data: RiskExportData): Promise<void> {
  const workbook = new ExcelJS.Workbook();

  // Define colors
  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3796d0' } } as any;
  const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  const accentFont = { bold: true, color: { argb: 'FF141c2d' }, size: 10 };
  const alternateRowFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e283c' } } as any;
  const alternateRowFont = { color: { argb: 'FFFFFFFF' }, size: 10 };
  const criticalFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } } as any;

  // Sheet 1: Summary
  const summarySheet = workbook.addWorksheet('Summary', {
    pageSetup: { paperSize: 9, orientation: 'portrait' },
  });

  summarySheet.columns = [
    { header: 'Risk Assessment Report', width: 40 },
    { header: '', width: 20 },
  ];

  let row = 1;
  summarySheet.getCell(row, 1).value = 'Risk Assessment Report';
  summarySheet.getCell(row, 1).font = { bold: true, size: 14, color: { argb: 'FF64c8ff' } };
  row += 2;

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

  summarySheet.getCell(row, 1).value = 'Risk Summary';
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
    ['Total Risks', data.totalRisks, 'All'],
    ['Critical Risks', data.criticalRisks, 'High Priority'],
    ['High Risks', data.highRisks, 'Monitor'],
    ['Medium Risks', data.mediumRisks, 'Track'],
    ['Low Risks', data.lowRisks, 'Accept'],
    ['Overall Risk Rate', `${data.riskRate.toFixed(1)}%`, 'Project Health'],
  ];

  summaryRows.forEach((rowData, idx) => {
    rowData.forEach((value, colIdx) => {
      const cell = summarySheet.getCell(row, colIdx + 1);
      cell.value = value;
      if (idx % 2 === 1) {
        cell.fill = alternateRowFill;
        cell.font = alternateRowFont;
      }
    });
    row++;
  });

  // Sheet 2: Risk Register
  const riskSheet = workbook.addWorksheet('Risk Register');

  riskSheet.columns = [
    { header: 'ID', width: 8 },
    { header: 'Title', width: 25 },
    { header: 'Category', width: 15 },
    { header: 'Description', width: 30 },
    { header: 'Probability', width: 12 },
    { header: 'Impact', width: 10 },
    { header: 'Risk Score', width: 12 },
    { header: 'Risk Level', width: 12 },
    { header: 'Status', width: 12 },
    { header: 'Owner', width: 15 },
  ];

  // Headers
  riskSheet.getRow(1).fill = headerFill;
  riskSheet.getRow(1).font = headerFont;
  riskSheet.getRow(1).alignment = { horizontal: 'center' as any, vertical: 'middle' as any };

  // Data
  data.risks.forEach((risk, idx) => {
    const rowNum = idx + 2;
    const riskRow = riskSheet.getRow(rowNum);

    riskRow.getCell(1).value = idx + 1;
    riskRow.getCell(2).value = risk.title;
    riskRow.getCell(3).value = risk.category;
    riskRow.getCell(4).value = risk.description || '';
    riskRow.getCell(5).value = risk.probability;
    riskRow.getCell(6).value = risk.impact;
    riskRow.getCell(7).value = risk.riskScore;
    riskRow.getCell(8).value = risk.riskLevel;
    riskRow.getCell(9).value = risk.status.charAt(0).toUpperCase() + risk.status.slice(1);
    riskRow.getCell(10).value = risk.riskOwner || '';

    // Highlight critical risks
    if (risk.riskLevel === 'Critical') {
      riskRow.fill = criticalFill;
    } else if (idx % 2 === 1) {
      riskRow.fill = alternateRowFill;
      riskRow.font = alternateRowFont;
    }

    riskRow.alignment = { horizontal: 'left' as any, vertical: 'middle' as any };
    riskRow.getCell(1).alignment = { horizontal: 'center' as any, vertical: 'middle' as any };
    riskRow.getCell(5).alignment = { horizontal: 'center' as any, vertical: 'middle' as any };
    riskRow.getCell(6).alignment = { horizontal: 'center' as any, vertical: 'middle' as any };
    riskRow.getCell(7).alignment = { horizontal: 'center' as any, vertical: 'middle' as any };
    riskRow.getCell(8).alignment = { horizontal: 'center' as any, vertical: 'middle' as any };
    riskRow.getCell(9).alignment = { horizontal: 'center' as any, vertical: 'middle' as any };
  });

  // Sheet 3: Category Breakdown
  const categorySheet = workbook.addWorksheet('Category Breakdown');

  categorySheet.columns = [
    { header: 'Risk Category', width: 25 },
    { header: 'Count', width: 12 },
  ];

  // Headers
  categorySheet.getRow(1).fill = headerFill;
  categorySheet.getRow(1).font = headerFont;
  categorySheet.getRow(1).alignment = { horizontal: 'center' as any, vertical: 'middle' as any };

  // Data
  let catRowNum = 2;
  Object.entries(data.categoryBreakdown).forEach(([category, count], idx) => {
    const categoryRow = categorySheet.getRow(catRowNum);

    categoryRow.getCell(1).value = category;
    categoryRow.getCell(2).value = count;

    if (idx % 2 === 1) {
      categoryRow.fill = alternateRowFill;
      categoryRow.font = alternateRowFont;
    }

    categoryRow.alignment = { horizontal: 'left' as any, vertical: 'middle' as any };
    categoryRow.getCell(2).alignment = { horizontal: 'right' as any, vertical: 'middle' as any };

    catRowNum++;
  });

  // Sheet 4: Mitigation Plans
  const mitigationSheet = workbook.addWorksheet('Mitigation Plans');

  mitigationSheet.columns = [
    { header: 'Risk Title', width: 25 },
    { header: 'Risk Level', width: 12 },
    { header: 'Owner', width: 15 },
    { header: 'Mitigation Plan', width: 50 },
    { header: 'Status', width: 12 },
  ];

  // Headers
  mitigationSheet.getRow(1).fill = headerFill;
  mitigationSheet.getRow(1).font = headerFont;
  mitigationSheet.getRow(1).alignment = { horizontal: 'center' as any, vertical: 'middle' as any };

  // Data - only critical and high risks
  const criticalAndHighRisks = data.risks.filter(r => r.riskLevel === 'Critical' || r.riskLevel === 'High');
  
  criticalAndHighRisks.forEach((risk, idx) => {
    const rowNum = idx + 2;
    const mitRow = mitigationSheet.getRow(rowNum);

    mitRow.getCell(1).value = risk.title;
    mitRow.getCell(2).value = risk.riskLevel;
    mitRow.getCell(3).value = risk.riskOwner || 'Not assigned';
    mitRow.getCell(4).value = risk.mitigationPlan || 'No plan defined';
    mitRow.getCell(5).value = risk.status.charAt(0).toUpperCase() + risk.status.slice(1);

    if (risk.riskLevel === 'Critical') {
      mitRow.fill = criticalFill;
    } else if (idx % 2 === 1) {
      mitRow.fill = alternateRowFill;
      mitRow.font = alternateRowFont;
    }

    mitRow.alignment = { horizontal: 'left' as any, vertical: 'top', wrapText: true };
    mitRow.height = 30;
  });

  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Risk-Assessment-${data.projectName}-${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
