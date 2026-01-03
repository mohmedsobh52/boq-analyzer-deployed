import * as XLSX from 'xlsx';
import { extractTextFromPDF, extractBOQFromPDFText } from './pdfExtractor';
// import { extractTextWithPositions, detectTableStructure, parseBOQFromTable, mergeMergedCells, extractBOQWithMultilineSupport } from './advancedPdfTableExtractor';

export interface BOQItem {
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  wbsCode?: string;
  notes?: string;
}

export interface BOQData {
  projectName?: string;
  projectCode?: string;
  items: BOQItem[];
  totalItems: number;
  totalCost: number;
  currency?: string;
  date?: string;
}

/**
 * Parse Excel file (xlsx, xls) and extract BOQ data
 */
export async function parseExcelBOQ(file: File): Promise<BOQData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error('Failed to read file');

        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert sheet to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];

        if (jsonData.length === 0) {
          throw new Error('Excel file is empty');
        }

        // Parse headers and data
        const headers = jsonData[0] as string[];
        const items: BOQItem[] = [];
        let totalCost = 0;

        // Find column indices (case-insensitive)
        const findColumnIndex = (names: string[]) => {
          return headers.findIndex(h =>
            names.some(n => h?.toString().toLowerCase().includes(n.toLowerCase()))
          );
        };

        const itemCodeIdx = findColumnIndex(['item code', 'code', 'itemcode']);
        const descIdx = findColumnIndex(['description', 'desc', 'item description']);
        const unitIdx = findColumnIndex(['unit', 'uom', 'unit of measure']);
        const quantityIdx = findColumnIndex(['quantity', 'qty', 'quantity required']);
        const unitPriceIdx = findColumnIndex(['unit price', 'unitprice', 'price', 'rate']);
        const totalPriceIdx = findColumnIndex(['total', 'total price', 'totalprice', 'amount']);
        const categoryIdx = findColumnIndex(['category', 'cat', 'type']);
        const wbsIdx = findColumnIndex(['wbs', 'wbs code', 'wbscode']);
        const notesIdx = findColumnIndex(['notes', 'remarks', 'comment']);

        // Parse data rows (skip header and empty rows)
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];

          // Skip empty rows
          if (!row || row.every((cell: any) => !cell)) continue;

          const itemCode = row[itemCodeIdx]?.toString().trim() || `ITEM-${i}`;
          const description = row[descIdx]?.toString().trim() || '';
          const unit = row[unitIdx]?.toString().trim() || '';
          const quantity = parseFloat(row[quantityIdx]) || 0;
          const unitPrice = parseFloat(row[unitPriceIdx]) || 0;
          const totalPrice = row[totalPriceIdx] ? parseFloat(row[totalPriceIdx]) : quantity * unitPrice;

          if (description) {
            items.push({
              itemCode,
              description,
              unit,
              quantity,
              unitPrice,
              totalPrice,
              category: row[categoryIdx]?.toString().trim(),
              wbsCode: row[wbsIdx]?.toString().trim(),
              notes: row[notesIdx]?.toString().trim(),
            });

            totalCost += totalPrice;
          }
        }

        resolve({
          projectName: 'Imported Project',
          items,
          totalItems: items.length,
          totalCost,
          currency: 'USD',
          date: new Date().toISOString().split('T')[0],
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse BDF file (CSV-based format)
 */
export async function parseBDFBOQ(file: File): Promise<BOQData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) throw new Error('Failed to read file');

        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) throw new Error('BDF file is empty');

        // Parse header line
        const headerLine = lines[0];
        const headers = headerLine.split(',').map(h => h.trim());

        const items: BOQItem[] = [];
        let totalCost = 0;

        // Find column indices
        const findColumnIndex = (names: string[]) => {
          return headers.findIndex(h =>
            names.some(n => h.toLowerCase().includes(n.toLowerCase()))
          );
        };

        const itemCodeIdx = findColumnIndex(['item code', 'code', 'itemcode']);
        const descIdx = findColumnIndex(['description', 'desc']);
        const unitIdx = findColumnIndex(['unit', 'uom']);
        const quantityIdx = findColumnIndex(['quantity', 'qty']);
        const unitPriceIdx = findColumnIndex(['unit price', 'unitprice', 'price']);
        const totalPriceIdx = findColumnIndex(['total', 'total price']);
        const categoryIdx = findColumnIndex(['category', 'cat']);
        const wbsIdx = findColumnIndex(['wbs', 'wbs code']);
        const notesIdx = findColumnIndex(['notes', 'remarks']);

        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split(',').map(v => v.trim());

          const itemCode = values[itemCodeIdx]?.trim() || `ITEM-${i}`;
          const description = values[descIdx]?.trim() || '';
          const unit = values[unitIdx]?.trim() || '';
          const quantity = parseFloat(values[quantityIdx]) || 0;
          const unitPrice = parseFloat(values[unitPriceIdx]) || 0;
          const totalPrice = values[totalPriceIdx] ? parseFloat(values[totalPriceIdx]) : quantity * unitPrice;

          if (description) {
            items.push({
              itemCode,
              description,
              unit,
              quantity,
              unitPrice,
              totalPrice,
              category: values[categoryIdx]?.trim(),
              wbsCode: values[wbsIdx]?.trim(),
              notes: values[notesIdx]?.trim(),
            });

            totalCost += totalPrice;
          }
        }

        resolve({
          projectName: 'Imported Project',
          items,
          totalItems: items.length,
          totalCost,
          currency: 'USD',
          date: new Date().toISOString().split('T')[0],
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Parse PDF file and extract BOQ data with advanced table detection
 */
export async function parsePDFBOQ(file: File): Promise<BOQData> {
  try {
    let items: BOQItem[] = [];

    // Advanced table detection disabled

    // Try text-based extraction
    const pdfText = await extractTextFromPDF(file);
    if (!pdfText || pdfText.trim().length === 0) {
      throw new Error('No text found in PDF file');
    }
    items = extractBOQFromPDFText(pdfText);

    if (!items || items.length === 0) {
      throw new Error('No BOQ data found in PDF. Please ensure the PDF contains a table with Item Code, Description, Unit, Quantity, Unit Price, and Total columns.');
    }

    const totalCost = items.reduce((sum, item) => sum + item.totalPrice, 0);

    return {
      projectName: 'Imported from PDF',
      items,
      totalItems: items.length,
      totalCost,
      currency: 'USD',
      date: new Date().toISOString().split('T')[0],
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Detect file type and parse accordingly
 */
export async function parseBOQFile(file: File): Promise<BOQData> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return parseExcelBOQ(file);
  } else if (fileName.endsWith('.bdf') || fileName.endsWith('.csv')) {
    return parseBDFBOQ(file);
  } else if (fileName.endsWith('.pdf')) {
    return parsePDFBOQ(file);
  } else {
    throw new Error('Unsupported file format. Please use Excel (.xlsx, .xls), BDF (.bdf, .csv), or PDF (.pdf) files.');
  }
}
