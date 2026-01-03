import { jsPDF } from 'jspdf';
import ExcelJS from 'exceljs';

// Type definition for BOQ Items
export interface BOQItem {
  id: number;
  projectId: number;
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  wbsCode?: string | null;
  category?: string | null;
  notes?: string | null;
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

export interface BOQExportData {
  projectName: string;
  projectId: number;
  description?: string;
  reportDate: Date;
  projectManager?: string;
  items: BOQItem[];
  totalItems: number;
  totalQuantity: number;
  totalCost: number;
  currency: string;
  categoryBreakdown: Record<string, { count: number; cost: number; percentage: number }>;
}

export function generateBOQPDF(data: BOQExportData): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  }) as jsPDFWithAutoTable;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
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

  // Header
  doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL OF QUANTITIES (BOQ)', margin, 14);

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Detailed Project Cost Breakdown', margin, 22);

  // Report metadata
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(8);
  doc.text(`Project: ${data.projectName}`, pageWidth - margin - 70, 14);
  doc.text(`Date: ${data.reportDate.toLocaleDateString()}`, pageWidth - margin - 70, 19);
  if (data.projectManager) {
    doc.text(`Manager: ${data.projectManager}`, pageWidth - margin - 70, 24);
  }
  doc.text(`Currency: ${data.currency}`, pageWidth - margin - 70, 29);

  yPosition = 42;

  // Summary Section
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Project Summary', margin, yPosition);
  yPosition += 7;

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const summaryData = [
    ['Total Items', data.totalItems.toString()],
    ['Total Quantity', data.totalQuantity.toString()],
    ['Total Project Cost', `${data.currency} ${data.totalCost.toLocaleString('en-US', { maximumFractionDigits: 2 })}`],
  ];

  (doc as any).autoTable({
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: summaryData,
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
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 8;

  // BOQ Items Table
  checkPageBreak(50);

  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill of Quantities Details', margin, yPosition);
  yPosition += 7;

  const boqTableData = [
    ['Item Code', 'Description', 'Category', 'Unit', 'Qty', 'Unit Price', 'Total Price'],
    ...data.items.map((item: BOQItem) => [
      item.itemCode,
      item.description.substring(0, 25),
      item.category || 'N/A',
      item.unit,
      item.quantity.toString(),
      `${data.currency} ${item.unitPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
      `${data.currency} ${item.totalPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
    ]),
  ];

  (doc as any).autoTable({
    startY: yPosition,
    head: [boqTableData[0]],
    body: boqTableData.slice(1),
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
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 8;

  // Category Breakdown Section
  checkPageBreak(40);

  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Cost Breakdown by Category', margin, yPosition);
  yPosition += 7;

  const categoryData = [
    ['Category', 'Item Count', 'Total Cost', '% of Total'],
    ...Object.entries(data.categoryBreakdown).map(([category, breakdown]) => [
      category,
      breakdown.count.toString(),
      `${data.currency} ${breakdown.cost.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
      `${breakdown.percentage.toFixed(1)}%`,
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
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(7);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
    doc.text(
      `Generated on ${new Date().toLocaleString()}`,
      margin,
      pageHeight - 8
    );
  }

  // Save the PDF
  doc.save(`BOQ-${data.projectName}-${new Date().toISOString().split('T')[0]}.pdf`);
}

export async function generateBOQExcel(data: BOQExportData): Promise<void> {
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
    { header: 'BOQ - Bill of Quantities', width: 40 },
    { header: '', width: 20 },
  ];

  let row = 1;
  summarySheet.getCell(row, 1).value = 'BOQ - Bill of Quantities';
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

  summarySheet.getCell(row, 1).value = 'Currency:';
  summarySheet.getCell(row, 1).font = accentFont;
  summarySheet.getCell(row, 2).value = data.currency;
  row += 2;

  summarySheet.getCell(row, 1).value = 'Project Summary';
  summarySheet.getCell(row, 1).font = { bold: true, size: 12, color: { argb: 'FF64c8ff' } };
  row++;

  const summaryHeaders = ['Metric', 'Value'];
  summaryHeaders.forEach((header, idx) => {
    const cell = summarySheet.getCell(row, idx + 1);
    cell.value = header;
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { horizontal: 'center' as any, vertical: 'middle' as any };
  });
  row++;

  const summaryRows = [
    ['Total Items', data.totalItems],
    ['Total Quantity', data.totalQuantity],
    ['Total Project Cost', data.totalCost],
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

  // Sheet 2: BOQ Items
  const itemsSheet = workbook.addWorksheet('BOQ Items');

  itemsSheet.columns = [
    { header: 'Item Code', width: 15 },
    { header: 'Description', width: 35 },
    { header: 'Category', width: 15 },
    { header: 'Unit', width: 10 },
    { header: 'Quantity', width: 12 },
    { header: 'Unit Price', width: 15 },
    { header: 'Total Price', width: 15 },
    { header: 'Notes', width: 25 },
  ];

  // Headers
  itemsSheet.getRow(1).fill = headerFill;
  itemsSheet.getRow(1).font = headerFont;
  itemsSheet.getRow(1).alignment = { horizontal: 'center' as any, vertical: 'middle' as any };

  // Data
  data.items.forEach((item, idx) => {
    const rowNum = idx + 2;
    const itemRow = itemsSheet.getRow(rowNum);

    itemRow.getCell(1).value = item.itemCode;
    itemRow.getCell(2).value = item.description;
    itemRow.getCell(3).value = item.category || '';
    itemRow.getCell(4).value = item.unit;
    itemRow.getCell(5).value = item.quantity;
    itemRow.getCell(6).value = item.unitPrice;
    itemRow.getCell(6).numFmt = '$#,##0.00';
    itemRow.getCell(7).value = item.totalPrice;
    itemRow.getCell(7).numFmt = '$#,##0.00';
    itemRow.getCell(8).value = item.notes || '';

    if (idx % 2 === 1) {
      itemRow.fill = alternateRowFill;
      itemRow.font = alternateRowFont;
    }

    itemRow.alignment = { horizontal: 'left' as any, vertical: 'middle' as any };
    itemRow.getCell(5).alignment = { horizontal: 'right' as any, vertical: 'middle' as any };
    itemRow.getCell(6).alignment = { horizontal: 'right' as any, vertical: 'middle' as any };
    itemRow.getCell(7).alignment = { horizontal: 'right' as any, vertical: 'middle' as any };
  });

  // Sheet 3: Category Breakdown
  const categorySheet = workbook.addWorksheet('Category Breakdown');

  categorySheet.columns = [
    { header: 'Category', width: 25 },
    { header: 'Item Count', width: 15 },
    { header: 'Total Cost', width: 15 },
    { header: '% of Total', width: 12 },
  ];

  // Headers
  categorySheet.getRow(1).fill = headerFill;
  categorySheet.getRow(1).font = headerFont;
  categorySheet.getRow(1).alignment = { horizontal: 'center' as any, vertical: 'middle' as any };

  // Data
  let catRowNum = 2;
  Object.entries(data.categoryBreakdown).forEach(([category, breakdown], idx) => {
    const categoryRow = categorySheet.getRow(catRowNum);

    categoryRow.getCell(1).value = category;
    categoryRow.getCell(2).value = breakdown.count;
    categoryRow.getCell(3).value = breakdown.cost;
    categoryRow.getCell(3).numFmt = '$#,##0.00';
    categoryRow.getCell(4).value = breakdown.percentage / 100;
    categoryRow.getCell(4).numFmt = '0.0%';

    if (idx % 2 === 1) {
      categoryRow.fill = alternateRowFill;
      categoryRow.font = alternateRowFont;
    }

    categoryRow.alignment = { horizontal: 'left' as any, vertical: 'middle' as any };
    categoryRow.getCell(2).alignment = { horizontal: 'right' as any, vertical: 'middle' as any };
    categoryRow.getCell(3).alignment = { horizontal: 'right' as any, vertical: 'middle' as any };
    categoryRow.getCell(4).alignment = { horizontal: 'right' as any, vertical: 'middle' as any };

    catRowNum++;
  });

  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `BOQ-${data.projectName}-${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
