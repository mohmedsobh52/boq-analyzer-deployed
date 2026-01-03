/**
 * Advanced Table Extractor for PDF.js
 * 
 * Extracts structured table data from PDF pages by analyzing text layout
 * Handles complex BOQ documents with multiple sections and hierarchical data
 */

import * as pdfjsLib from 'pdfjs-dist';

export interface TableRow {
  cells: string[];
  isHeader?: boolean;
  isSection?: boolean;
  level?: number;
}

export interface ExtractedTable {
  headers: string[];
  rows: TableRow[];
  confidence: number;
}

/**
 * Analyze text layout to detect table structure
 */
function analyzeLayout(items: any[]): Map<number, any[]> {
  const rows = new Map<number, any[]>();

  // Group items by Y coordinate (with tolerance for line spacing)
  const tolerance = 2;
  items.forEach(item => {
    const y = Math.round(item.y / tolerance) * tolerance;
    if (!rows.has(y)) {
      rows.set(y, []);
    }
    rows.get(y)!.push(item);
  });

  return rows;
}

/**
 * Sort items in a row by X coordinate (left to right)
 */
function sortRowByX(items: any[]): any[] {
  return items.sort((a, b) => a.x - b.x);
}

/**
 * Detect column boundaries based on item positions
 */
function detectColumnBoundaries(rows: Map<number, any[]>): number[] {
  const xPositions = new Set<number>();

  rows.forEach(items => {
    items.forEach(item => {
      xPositions.add(Math.round(item.x));
    });
  });

  return Array.from(xPositions).sort((a, b) => a - b);
}

/**
 * Assign items to columns based on X position
 */
function assignToColumns(items: any[], columnBoundaries: number[]): string[] {
  const columns: string[] = [];
  const sortedItems = sortRowByX(items);

  let currentColumn = 0;
  let currentText = '';

  sortedItems.forEach(item => {
    const x = Math.round(item.x);

    // Find which column this item belongs to
    let columnIndex = 0;
    for (let i = 0; i < columnBoundaries.length - 1; i++) {
      if (x >= columnBoundaries[i] && x < columnBoundaries[i + 1]) {
        columnIndex = i;
        break;
      }
    }

    // If we've moved to a new column, save the previous one
    if (columnIndex > currentColumn) {
      columns[currentColumn] = currentText.trim();
      currentColumn = columnIndex;
      currentText = item.str;
    } else {
      currentText += ' ' + item.str;
    }
  });

  // Add the last column
  columns[currentColumn] = currentText.trim();

  return columns.filter(col => col.length > 0);
}

/**
 * Detect if a row is a header based on content
 */
function isHeaderRow(cells: string[]): boolean {
  const headerKeywords = [
    'item',
    'description',
    'unit',
    'quantity',
    'price',
    'total',
    'code',
    'بند',
    'وصف',
    'الوحدة',
    'الكمية',
    'السعر',
    'الإجمالي',
  ];

  const cellText = cells.join(' ').toLowerCase();
  return headerKeywords.some(keyword => cellText.includes(keyword));
}

/**
 * Detect if a row is a section header
 */
function isSectionRow(cells: string[]): boolean {
  const text = cells.join(' ').trim();

  // Check for patterns like "DIVISION 31", "31.1", "31.1.1"
  if (/^(DIVISION|SECTION)\s+\d+/i.test(text)) return true;
  if (/^\d+(\.\d+)*\s*[-–]/.test(text)) return true;
  if (/^(31|32|33|34|35|36|37|38|39|40|41|42|43|44|45)(\.\d+)*\s*[-–]/i.test(text))
    return true;

  return false;
}

/**
 * Extract tables from a PDF page
 */
export async function extractTablesFromPage(
  page: any,
  pageNumber: number
): Promise<ExtractedTable[]> {
  try {
    const textContent = await page.getTextContent();
    const items = textContent.items.filter((item: any) => item.str && item.str.trim());

    if (items.length === 0) {
      return [];
    }

    // Analyze layout
    const rows = analyzeLayout(items);
    const columnBoundaries = detectColumnBoundaries(rows);

    if (columnBoundaries.length < 2) {
      return [];
    }

    // Convert rows to table format
    const tableRows: TableRow[] = [];
    let headers: string[] = [];
    let headerFound = false;

    // Sort rows by Y coordinate (top to bottom)
    const sortedYs = Array.from(rows.keys()).sort((a, b) => b - a);

    for (const y of sortedYs) {
      const items = rows.get(y)!;
      const cells = assignToColumns(items, columnBoundaries);

      if (cells.length === 0) continue;

      // Detect row type
      const isHeader = isHeaderRow(cells);
      const isSection = isSectionRow(cells);

      if (isHeader && !headerFound) {
        headers = cells;
        headerFound = true;
        tableRows.push({
          cells,
          isHeader: true,
        });
      } else {
        tableRows.push({
          cells,
          isHeader: false,
          isSection,
          level: isSection ? detectSectionLevel(cells[0]) : 0,
        });
      }
    }

    // Calculate confidence based on structure
    const confidence = calculateConfidence(tableRows, headers);

    return [
      {
        headers: headers.length > 0 ? headers : tableRows[0]?.cells || [],
        rows: tableRows.slice(headers.length > 0 ? 1 : 0),
        confidence,
      },
    ];
  } catch (error) {
    console.error(`Error extracting tables from page ${pageNumber}:`, error);
    return [];
  }
}

/**
 * Detect section level from text (e.g., "31.1.1" = level 3)
 */
function detectSectionLevel(text: string): number {
  const match = text.match(/^(\d+)(\.\d+)*/);
  if (!match) return 0;
  return (match[0].match(/\./g) || []).length + 1;
}

/**
 * Calculate confidence score for extracted table
 */
function calculateConfidence(rows: TableRow[], headers: string[]): number {
  let score = 0;

  // Check if headers are present
  if (headers.length > 0) score += 30;

  // Check if rows have consistent column count
  if (rows.length > 0) {
    const columnCounts = rows.map(r => r.cells.length);
    const avgColumns = columnCounts.reduce((a, b) => a + b, 0) / columnCounts.length;
    const consistency = 1 - columnCounts.filter(c => c !== Math.round(avgColumns)).length / columnCounts.length;
    score += consistency * 40;
  }

  // Check for data rows
  const dataRows = rows.filter(r => !r.isHeader && !r.isSection);
  if (dataRows.length > 0) score += 30;

  return Math.min(100, score);
}

/**
 * Extract all tables from PDF document
 */
export async function extractAllTables(
  pdf: any,
  maxPages?: number
): Promise<Array<{ page: number; tables: ExtractedTable[] }>> {
  const results: Array<{ page: number; tables: ExtractedTable[] }> = [];
  const pagesToProcess = Math.min(maxPages || pdf.numPages, pdf.numPages);

  for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
    try {
      const page = await pdf.getPage(pageNum);
      const tables = await extractTablesFromPage(page, pageNum);

      if (tables.length > 0) {
        results.push({
          page: pageNum,
          tables,
        });
      }
    } catch (error) {
      console.warn(`Failed to extract tables from page ${pageNum}:`, error);
    }
  }

  return results;
}

/**
 * Convert extracted table to BOQ items
 */
export function convertTableToItems(table: ExtractedTable): any[] {
  const items: any[] = [];
  const headers = table.headers.map(h => h.toLowerCase());

  // Find column indices
  const findColumn = (keywords: string[]): number => {
    for (let i = 0; i < headers.length; i++) {
      if (keywords.some(kw => headers[i].includes(kw))) {
        return i;
      }
    }
    return -1;
  };

  const itemCodeCol = findColumn(['item', 'code', 'no', 'number']);
  const descCol = findColumn(['description', 'desc', 'name']);
  const unitCol = findColumn(['unit', 'uom']);
  const qtyCol = findColumn(['quantity', 'qty', 'amount']);
  const priceCol = findColumn(['price', 'rate', 'unit']);
  const totalCol = findColumn(['total', 'amount']);

  // Extract data rows
  for (const row of table.rows) {
    if (row.isHeader || row.isSection) continue;

    const item: any = {
      itemCode: itemCodeCol >= 0 ? row.cells[itemCodeCol] || 'UNKNOWN' : 'UNKNOWN',
      description: descCol >= 0 ? row.cells[descCol] || '' : '',
      unit: unitCol >= 0 ? row.cells[unitCol] || 'EA' : 'EA',
      quantity: qtyCol >= 0 ? parseFloat(row.cells[qtyCol] || '0') : 0,
      unitPrice: priceCol >= 0 ? parseFloat(row.cells[priceCol] || '0') : 0,
      totalPrice: totalCol >= 0 ? parseFloat(row.cells[totalCol] || '0') : 0,
    };

    // Skip empty rows
    if (item.quantity > 0 || item.unitPrice > 0 || item.totalPrice > 0) {
      items.push(item);
    }
  }

  return items;
}
