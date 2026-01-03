/**
 * Advanced PDF Table Extraction Module
 * Detects and extracts tables from PDF documents
 */

export interface PDFTextItem {
  str: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  width: number;
  height: number;
  fontName?: string;
  fontSize?: number;
}

export interface TableCell {
  text: string;
  row: number;
  col: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface ExtractedTable {
  headers: string[];
  rows: string[][];
  confidence: number;
  boundingBox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

/**
 * Detect table regions in PDF text items
 * Tables are identified by aligned text in columns and rows
 */
export function detectTableRegions(textItems: PDFTextItem[]): ExtractedTable[] {
  if (textItems.length === 0) {
    return [];
  }

  // Sort items by Y position (top to bottom), then X position (left to right)
  const sortedItems = [...textItems].sort((a, b) => {
    const yDiff = Math.abs(a.y0 - b.y0);
    if (yDiff > 5) return b.y0 - a.y0; // Different rows
    return a.x0 - b.x0; // Same row, sort by X
  });

  // Group items into potential table rows
  const rowGroups = groupItemsIntoRows(sortedItems);

  // Analyze row groups to find tables
  const tables: ExtractedTable[] = [];
  let currentTableRows: string[][] = [];
  let currentTableHeaders: string[] = [];
  let tableStartY = 0;
  let tableEndY = 0;

  for (let i = 0; i < rowGroups.length; i++) {
    const row = rowGroups[i];
    const rowData = extractRowData(row);

    // Check if this row looks like a table header (often bold or larger text)
    if (isLikelyHeader(row)) {
      if (currentTableRows.length > 0) {
        // Save previous table
        tables.push({
          headers: currentTableHeaders,
          rows: currentTableRows,
          confidence: calculateTableConfidence(currentTableRows),
          boundingBox: {
            x0: Math.min(...rowGroups.slice(0, i).flat().map(item => item.x0)),
            y0: tableStartY,
            x1: Math.max(...rowGroups.slice(0, i).flat().map(item => item.x1)),
            y1: tableEndY,
          },
        });
        currentTableRows = [];
      }
      currentTableHeaders = rowData;
      tableStartY = Math.max(...row.map(item => item.y0));
    } else if (currentTableHeaders.length > 0) {
      // Add to current table
      currentTableRows.push(rowData);
      tableEndY = Math.min(...row.map(item => item.y1));
    }
  }

  // Add last table if exists
  if (currentTableRows.length > 0) {
    tables.push({
      headers: currentTableHeaders,
      rows: currentTableRows,
      confidence: calculateTableConfidence(currentTableRows),
      boundingBox: {
        x0: Math.min(...sortedItems.map(item => item.x0)),
        y0: tableStartY,
        x1: Math.max(...sortedItems.map(item => item.x1)),
        y1: tableEndY,
      },
    });
  }

  return tables.filter(table => table.rows.length > 0);
}

/**
 * Group text items into rows based on Y position
 */
function groupItemsIntoRows(items: PDFTextItem[]): PDFTextItem[][] {
  const rows: PDFTextItem[][] = [];
  let currentRow: PDFTextItem[] = [];
  let currentY = items[0]?.y0 ?? 0;

  for (const item of items) {
    // If Y position changed significantly, start new row
    if (Math.abs(item.y0 - currentY) > 5) {
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }
      currentRow = [item];
      currentY = item.y0;
    } else {
      currentRow.push(item);
    }
  }

  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Extract row data by sorting items horizontally and extracting text
 */
function extractRowData(rowItems: PDFTextItem[]): string[] {
  // Sort by X position
  const sorted = [...rowItems].sort((a, b) => a.x0 - b.x0);

  // Group items into columns based on X position gaps
  const columns: PDFTextItem[][] = [];
  let currentColumn: PDFTextItem[] = [];
  let lastX = sorted[0]?.x1 ?? 0;

  for (const item of sorted) {
    const gap = item.x0 - lastX;

    // If gap is large, start new column
    if (gap > 10 && currentColumn.length > 0) {
      columns.push(currentColumn);
      currentColumn = [item];
    } else {
      currentColumn.push(item);
    }

    lastX = item.x1;
  }

  if (currentColumn.length > 0) {
    columns.push(currentColumn);
  }

  // Extract text from each column
  return columns.map(col => col.map(item => item.str).join(' ').trim());
}

/**
 * Check if a row is likely a table header
 * Headers typically have fewer items, are bold, or are at the top
 */
function isLikelyHeader(rowItems: PDFTextItem[]): boolean {
  if (rowItems.length === 0) return false;

  // Check if items are bold or larger
  const avgFontSize = rowItems.reduce((sum, item) => sum + (item.fontSize ?? 12), 0) / rowItems.length;
  const isBold = rowItems.some(item => item.fontName?.includes('Bold'));

  // Headers often have consistent formatting and moderate number of columns
  return isBold || rowItems.length >= 3;
}

/**
 * Calculate confidence score for a table
 * Based on consistency of column counts and data quality
 */
function calculateTableConfidence(rows: string[][]): number {
  if (rows.length === 0) return 0;

  // Check column consistency
  const columnCounts = rows.map(row => row.length);
  const avgColumns = columnCounts.reduce((a, b) => a + b, 0) / columnCounts.length;
  const columnVariance = columnCounts.reduce((sum, count) => sum + Math.pow(count - avgColumns, 2), 0) / columnCounts.length;

  // Check data density (non-empty cells)
  const totalCells = rows.reduce((sum, row) => sum + row.length, 0);
  const filledCells = rows.reduce((sum, row) => sum + row.filter(cell => cell.trim().length > 0).length, 0);
  const dataFill = filledCells / totalCells;

  // Confidence = consistency (0-1) * data fill (0-1)
  const consistency = Math.max(0, 1 - columnVariance / avgColumns);
  return consistency * dataFill;
}

/**
 * Match extracted table to BOQ fields
 */
export interface BOQFieldMapping {
  code?: number;
  description?: number;
  unit?: number;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
}

export function matchTableToBOQFields(table: ExtractedTable): BOQFieldMapping {
  const mapping: BOQFieldMapping = {};
  const headers = table.headers.map(h => h.toLowerCase());

  // Common BOQ field patterns
  const patterns = {
    code: ['code', 'item', 'no.', 'number', 'ref', 'reference'],
    description: ['description', 'desc', 'item name', 'name', 'details'],
    unit: ['unit', 'uom', 'measure'],
    quantity: ['qty', 'quantity', 'qnt', 'amount'],
    unitPrice: ['unit price', 'rate', 'price', 'unit cost', 'cost'],
    totalPrice: ['total', 'total price', 'amount', 'total cost', 'value'],
  };

  // Match headers to BOQ fields
  for (const [field, keywords] of Object.entries(patterns)) {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      if (keywords.some(keyword => header.includes(keyword))) {
        mapping[field as keyof BOQFieldMapping] = i;
        break;
      }
    }
  }

  return mapping;
}

/**
 * Extract BOQ items from table using field mapping
 */
export interface ExtractedBOQItem {
  code?: string;
  description: string;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  confidence: number;
}

export function extractBOQItemsFromTable(table: ExtractedTable, mapping: BOQFieldMapping): ExtractedBOQItem[] {
  const items: ExtractedBOQItem[] = [];

  for (const row of table.rows) {
    const item: ExtractedBOQItem = {
      description: '',
      confidence: 0,
    };

    // Extract fields based on mapping
    if (mapping.code !== undefined && row[mapping.code]) {
      item.code = row[mapping.code].trim();
    }

    if (mapping.description !== undefined && row[mapping.description]) {
      item.description = row[mapping.description].trim();
    } else if (row.length > 0) {
      // Fallback: use first non-empty cell
      item.description = row.find(cell => cell.trim().length > 0) || '';
    }

    if (mapping.unit !== undefined && row[mapping.unit]) {
      item.unit = row[mapping.unit].trim();
    }

    if (mapping.quantity !== undefined && row[mapping.quantity]) {
      const qty = parseFloat(row[mapping.quantity].replace(/,/g, ''));
      item.quantity = isNaN(qty) ? undefined : qty;
    }

    if (mapping.unitPrice !== undefined && row[mapping.unitPrice]) {
      const price = parseFloat(row[mapping.unitPrice].replace(/[^0-9.]/g, ''));
      item.unitPrice = isNaN(price) ? undefined : price;
    }

    if (mapping.totalPrice !== undefined && row[mapping.totalPrice]) {
      const total = parseFloat(row[mapping.totalPrice].replace(/[^0-9.]/g, ''));
      item.totalPrice = isNaN(total) ? undefined : total;
    }

    // Calculate confidence based on filled fields
    const filledFields = [
      item.code,
      item.description,
      item.unit,
      item.quantity,
      item.unitPrice,
      item.totalPrice,
    ].filter(field => field !== undefined && field !== '').length;

    item.confidence = filledFields / 6;

    // Only add items with description
    if (item.description.length > 0) {
      items.push(item);
    }
  }

  return items;
}

/**
 * Validate extracted BOQ items
 */
export function validateExtractedBOQItems(items: ExtractedBOQItem[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (items.length === 0) {
    errors.push('No BOQ items extracted from table');
    return { valid: false, errors, warnings };
  }

  items.forEach((item, index) => {
    if (!item.description || item.description.trim().length === 0) {
      errors.push(`Item ${index + 1}: Missing description`);
    }

    if (item.quantity !== undefined && item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Invalid quantity (${item.quantity})`);
    }

    if (item.unitPrice !== undefined && item.unitPrice < 0) {
      errors.push(`Item ${index + 1}: Invalid unit price (${item.unitPrice})`);
    }

    if (item.confidence < 0.3) {
      warnings.push(`Item ${index + 1}: Low extraction confidence (${(item.confidence * 100).toFixed(0)}%)`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
