/**
 * Export PDF extracted data to Excel format
 * Supports bilingual headers (Arabic/English) and professional formatting
 */

import * as XLSX from 'xlsx';

export interface BOQItem {
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
}

export interface ExportOptions {
  language?: 'ar' | 'en';
  includeFormulas?: boolean;
  fileName?: string;
}

/**
 * Get bilingual headers for Excel columns
 */
function getBilingualHeaders(language: 'ar' | 'en' = 'en') {
  const headers = {
    en: {
      itemCode: 'Item Code',
      description: 'Description',
      unit: 'Unit',
      quantity: 'Quantity',
      unitPrice: 'Unit Price (SAR)',
      totalPrice: 'Total Price (SAR)',
      subtotal: 'Subtotal',
      total: 'Total',
      summary: 'Summary',
      date: 'Export Date',
      itemCount: 'Total Items',
    },
    ar: {
      itemCode: 'كود البند',
      description: 'الوصف',
      unit: 'الوحدة',
      quantity: 'الكمية',
      unitPrice: 'سعر الوحدة (﷼)',
      totalPrice: 'السعر الإجمالي (﷼)',
      subtotal: 'المجموع الفرعي',
      total: 'الإجمالي',
      summary: 'الملخص',
      date: 'تاريخ التصدير',
      itemCount: 'إجمالي البنود',
    },
  };

  return headers[language] || headers.en;
}

/**
 * Format currency value
 */
function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Create summary sheet with statistics
 */
function createSummarySheet(
  items: BOQItem[],
  language: 'ar' | 'en' = 'en'
): any[][] {
  const headers = getBilingualHeaders(language);
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const totalItems = items.length;

  const summaryData: any[][] = [
    [headers.summary],
    [],
    [headers.itemCount, totalItems],
    [headers.quantity, totalQuantity],
    [headers.total, formatCurrency(totalPrice)],
    [],
    [headers.date, new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')],
  ];

  return summaryData;
}

/**
 * Create items sheet with all BOQ data
 */
function createItemsSheet(
  items: BOQItem[],
  language: 'ar' | 'en' = 'en'
): any[][] {
  const headers = getBilingualHeaders(language);

  const sheetData: any[][] = [
    [
      headers.itemCode,
      headers.description,
      headers.unit,
      headers.quantity,
      headers.unitPrice,
      headers.totalPrice,
    ],
  ];

  // Add items
  items.forEach((item) => {
    sheetData.push([
      item.itemCode,
      item.description,
      item.unit,
      item.quantity,
      item.unitPrice ? formatCurrency(item.unitPrice) : '',
      item.totalPrice ? formatCurrency(item.totalPrice) : '',
    ]);
  });

  // Add totals row
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  sheetData.push([]);
  sheetData.push([
    '',
    headers.total,
    '',
    totalQuantity,
    '',
    formatCurrency(totalPrice),
  ]);

  return sheetData;
}

/**
 * Create detailed analysis sheet
 */
function createAnalysisSheet(
  items: BOQItem[],
  language: 'ar' | 'en' = 'en'
): any[][] {
  const headers = getBilingualHeaders(language);

  // Group by unit
  const unitGroups: { [key: string]: BOQItem[] } = {};
  items.forEach((item) => {
    if (!unitGroups[item.unit]) {
      unitGroups[item.unit] = [];
    }
    unitGroups[item.unit].push(item);
  });

  const analysisData: any[][] = [
    [language === 'ar' ? 'تحليل حسب الوحدة' : 'Analysis by Unit'],
    [],
    [
      headers.unit,
      language === 'ar' ? 'عدد البنود' : 'Item Count',
      headers.quantity,
      headers.total,
    ],
  ];

  // Add unit groups
  Object.entries(unitGroups).forEach(([unit, unitItems]) => {
    const unitQuantity = unitItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const unitTotal = unitItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    analysisData.push([
      unit,
      unitItems.length,
      unitQuantity,
      formatCurrency(unitTotal),
    ]);
  });

  return analysisData;
}

/**
 * Apply formatting to worksheet
 */
function applyFormatting(worksheet: XLSX.WorkSheet, language: 'ar' | 'en' = 'en') {
  // Set column widths
  const colWidths = language === 'ar'
    ? [15, 30, 12, 12, 15, 15] // Wider for Arabic text
    : [12, 25, 10, 12, 15, 15];

  worksheet['!cols'] = colWidths.map((width) => ({ wch: width }));

  // Set row heights
  if (worksheet['!rows']) {
    worksheet['!rows'][0] = { hpt: 25 }; // Header row
  }
}

/**
 * Export BOQ items to Excel file
 */
export function exportBOQToExcel(
  items: BOQItem[],
  options: ExportOptions = {}
): void {
  const { language = 'en', fileName = 'BOQ_Export' } = options;

  if (!items || items.length === 0) {
    console.warn('No items to export');
    return;
  }

  try {
    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create sheets
    const summaryData = createSummarySheet(items, language);
    const itemsData = createItemsSheet(items, language);
    const analysisData = createAnalysisSheet(items, language);

    // Add worksheets
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    const itemsSheet = XLSX.utils.aoa_to_sheet(itemsData);
    const analysisSheet = XLSX.utils.aoa_to_sheet(analysisData);

    // Apply formatting
    applyFormatting(summarySheet, language);
    applyFormatting(itemsSheet, language);
    applyFormatting(analysisSheet, language);

    // Add sheets to workbook
    XLSX.utils.book_append_sheet(workbook, summarySheet, language === 'ar' ? 'الملخص' : 'Summary');
    XLSX.utils.book_append_sheet(workbook, itemsSheet, language === 'ar' ? 'البنود' : 'Items');
    XLSX.utils.book_append_sheet(workbook, analysisSheet, language === 'ar' ? 'التحليل' : 'Analysis');

    // Generate file name with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const fullFileName = `${fileName}_${timestamp}.xlsx`;

    // Write file
    XLSX.writeFile(workbook, fullFileName);

    console.log(`Excel file exported successfully: ${fullFileName}`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error(
      `Failed to export Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Export with custom formatting and styling
 */
export function exportBOQToExcelAdvanced(
  items: BOQItem[],
  projectName: string = 'BOQ',
  options: ExportOptions = {}
): void {
  const { language = 'en', fileName = projectName } = options;

  if (!items || items.length === 0) {
    console.warn('No items to export');
    return;
  }

  try {
    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create title sheet
    const titleData: any[][] = [
      [language === 'ar' ? 'تقرير جدول الكميات والأسعار' : 'Bill of Quantities Report'],
      [language === 'ar' ? 'اسم المشروع' : 'Project Name', projectName],
      [language === 'ar' ? 'تاريخ الإنشاء' : 'Created Date', new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')],
      [language === 'ar' ? 'عدد البنود' : 'Total Items', items.length],
      [],
    ];

    const titleSheet = XLSX.utils.aoa_to_sheet(titleData);
    applyFormatting(titleSheet, language);

    // Create detailed items sheet with calculations
    const headers = getBilingualHeaders(language);
    const itemsData: any[][] = [
      [
        headers.itemCode,
        headers.description,
        headers.unit,
        headers.quantity,
        headers.unitPrice,
        headers.totalPrice,
      ],
    ];

    items.forEach((item) => {
      itemsData.push([
        item.itemCode,
        item.description,
        item.unit,
        item.quantity,
        item.unitPrice || 0,
        item.totalPrice || 0,
      ]);
    });

    // Add summary rows
    const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    itemsData.push([]);
    itemsData.push([
      '',
      language === 'ar' ? 'الإجمالي' : 'TOTAL',
      '',
      totalQuantity,
      '',
      totalPrice,
    ]);

    const itemsSheet = XLSX.utils.aoa_to_sheet(itemsData);
    applyFormatting(itemsSheet, language);

    // Add sheets to workbook
    XLSX.utils.book_append_sheet(workbook, titleSheet, language === 'ar' ? 'الغلاف' : 'Cover');
    XLSX.utils.book_append_sheet(workbook, itemsSheet, language === 'ar' ? 'البنود' : 'Items');

    // Generate file name with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const fullFileName = `${fileName}_${timestamp}.xlsx`;

    // Write file
    XLSX.writeFile(workbook, fullFileName);

    console.log(`Advanced Excel file exported successfully: ${fullFileName}`);
  } catch (error) {
    console.error('Error exporting advanced Excel file:', error);
    throw new Error(
      `Failed to export Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
