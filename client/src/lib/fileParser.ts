/**
 * File parser utility for BOQ data
 * Handles Excel, CSV, and PDF file parsing with robust PDF coordinate-based extraction
 */

import {
  deduplicateItems as deduplicateMapperItems,
  sortItems as sortMapperItems,
  calculateStatistics,
  identifyOutliers,
  getCostDistribution,
} from './pdfDataMapper';

export interface BOQRow {
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  wbsCode?: string;
  notes?: string;
  serviceCode?: string;
}

/**
 * Convert Arabic-Indic and Eastern Arabic digits to Western digits
 */
function normalizeArabicNumbers(str: string): string {
  // Arabic-Indic digits: ٠١٢٣٤٥٦٧٨٩
  const arabicIndic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  // Eastern Arabic digits: ۰۱۲۳۴۵۶۷۸۹
  const easternArabic = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  let result = str;
  
  // Replace Arabic-Indic
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(arabicIndic[i], 'g'), String(i));
  }
  
  // Replace Eastern Arabic
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(easternArabic[i], 'g'), String(i));
  }
  
  return result;
}

/**
 * Parse number safely, handling Arabic digits and separators
 */
function parseNumberSafe(str: string): number {
  if (!str || typeof str !== 'string') return 0;
  
  // Normalize Arabic digits
  let normalized = normalizeArabicNumbers(str);
  
  // Remove thousand separators (comma and Arabic comma)
  normalized = normalized.replace(/,/g, '').replace(/٬/g, '');
  
  // Convert Arabic decimal to dot
  normalized = normalized.replace(/٫/g, '.');
  
  // Strip non-numeric chars except dot and minus
  normalized = normalized.replace(/[^\d.\-]/g, '');
  
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

/**
 * Reconstruct lines from PDF text items using (x,y) coordinates
 */
function reconstructLinesFromTextItems(textItems: any[]): string[] {
  if (!textItems || textItems.length === 0) return [];
  
  // Group items by Y coordinate (with tolerance)
  const tolerance = 2;
  const lineMap = new Map<number, any[]>();
  
  for (const item of textItems) {
    if (!item.str || !item.transform) continue;
    
    const y = item.transform[5]; // Y coordinate
    const roundedY = Math.round(y / tolerance) * tolerance;
    
    if (!lineMap.has(roundedY)) {
      lineMap.set(roundedY, []);
    }
    lineMap.get(roundedY)!.push(item);
  }
  
  // Sort lines by Y descending, then sort items in each line by X ascending
  const lines: string[] = [];
  const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);
  
  for (const y of sortedYs) {
    const items = lineMap.get(y)!;
    items.sort((a, b) => a.transform[4] - b.transform[4]); // Sort by X
    
    const lineText = items.map(item => item.str).join(' ').trim();
    if (lineText.length > 0) {
      lines.push(lineText);
    }
  }
  
  return lines;
}

/**
 * Check if a line is a header or footer
 */
function isHeaderOrFooter(line: string): boolean {
  const lowerLine = line.toLowerCase();
  const skipPatterns = [
    'item',
    'description',
    'quantity',
    'price sar',
    'total price',
    'pr service',
    'subtotal',
    'summary',
    'unit',
    'code',
    '- 1 /',
    '/ 6 -',
    'page',
  ];
  
  return skipPatterns.some(pattern => lowerLine.includes(pattern));
}

/**
 * Check if a line is a valid item code (e.g., 31.2.3.1)
 */
function isValidItemCode(code: string): boolean {
  return /^\d{2}(\.\d+)+/.test(code.trim());
}

/**
 * Parse a BOQ item line with coordinate-based reconstruction
 */
function parseBOQItemLine(line: string, nextLine?: string): BOQRow | null {
  const trimmed = line.trim();
  
  // Skip empty or header lines
  if (!trimmed || isHeaderOrFooter(trimmed)) {
    return null;
  }
  
  // Split by whitespace
  const tokens = trimmed.split(/\s+/).filter(t => t.length > 0);
  
  if (tokens.length < 2) {
    return null;
  }
  
  // First token should be item code
  const itemCode = tokens[0];
  if (!isValidItemCode(itemCode)) {
    return null;
  }
  
  // Known units (case-insensitive)
  const unitPatterns = [
    'm2', 'm²', '2m', 'م2',
    'm3', 'm³', 'م³',
    'l.m', 'm.l', 'lm',
    'nr', 'ea', 'pcs', 'piece',
    'طن', 'متر', 'كيس', 'حقيبة'
  ];
  
  // Find unit token
  let unitIndex = -1;
  let unit = 'EA';
  
  for (let i = 1; i < tokens.length; i++) {
    const lowerToken = tokens[i].toLowerCase();
    if (unitPatterns.some(p => lowerToken.includes(p))) {
      unitIndex = i;
      unit = tokens[i];
      break;
    }
  }
  
  if (unitIndex === -1) {
    // No unit found, try to infer from position
    unitIndex = Math.min(2, tokens.length - 1);
    unit = tokens[unitIndex];
  }
  
  // Description is between itemCode and unit
  const descriptionTokens = tokens.slice(1, unitIndex);
  let description = descriptionTokens.join(' ');
  
  if (!description || description.trim().length === 0) {
    description = `Item ${itemCode}`;
  }
  
  // Collect all numeric tokens after unit
  const numericTokens: number[] = [];
  let serviceCode = '';
  
  for (let i = unitIndex + 1; i < tokens.length; i++) {
    const token = tokens[i];
    
    // Check for service code (7-digit number starting with 9)
    if (/^9\d{6}$/.test(token)) {
      serviceCode = token;
      continue;
    }
    
    // Skip known comment words
    if (['official', 'estimated', 'boq', 'western'].includes(token.toLowerCase())) {
      continue;
    }
    
    const num = parseNumberSafe(token);
    if (num > 0 || token.includes('.')) {
      numericTokens.push(num);
    }
  }
  
  // Handle continuation line (service code on next line)
  if (nextLine && /^9\d{6}$/.test(nextLine.trim())) {
    serviceCode = nextLine.trim();
  }
  
  // Extract quantity and prices
  let quantity = 0;
  let unitPrice = 0;
  let totalPrice = 0;
  
  if (numericTokens.length >= 1) {
    quantity = numericTokens[0];
  }
  
  if (numericTokens.length >= 2) {
    unitPrice = numericTokens[1];
    totalPrice = numericTokens[2] || quantity * unitPrice;
  } else if (numericTokens.length === 1 && quantity > 0) {
    // Single number: treat as quantity, unitPrice = 0
    unitPrice = 0;
    totalPrice = 0;
  }
  
  // Validate: quantity must be > 0
  if (quantity <= 0) {
    return null;
  }
  
  return {
    itemCode,
    description,
    unit,
    quantity,
    unitPrice,
    totalPrice,
    notes: serviceCode ? `Service Code: ${serviceCode}` : undefined,
    serviceCode: serviceCode || undefined,
  };
}

export async function parseCSVFile(file: File): Promise<BOQRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const rows: BOQRow[] = [];

        // Skip header row
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = parseCSVLine(line);
          if (values.length >= 5) {
            rows.push({
              itemCode: values[0] || '',
              description: values[1] || '',
              unit: values[2] || '',
              quantity: parseNumberSafe(values[3]) || 0,
              unitPrice: parseNumberSafe(values[4]) || 0,
              totalPrice: (parseNumberSafe(values[3]) || 0) * (parseNumberSafe(values[4]) || 0),
              category: values[5],
              wbsCode: values[6],
              notes: values[7],
            });
          }
        }

        console.log(`CSV parsing successful: ${rows.length} items found`);
        resolve(rows);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to parse CSV file';
        console.error('CSV parsing error:', errorMsg);
        reject(new Error(errorMsg));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

export async function parseExcelFile(file: File): Promise<BOQRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const { read, utils } = await import('xlsx');
        const data = e.target?.result;
        
        if (!data) {
          throw new Error('Failed to read Excel file');
        }
        
        const workbook = read(data, { type: 'array' });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('Excel file has no sheets');
        }
        
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = utils.sheet_to_json(worksheet);
        
        if (!jsonData || jsonData.length === 0) {
          throw new Error('Excel sheet is empty');
        }

        const rows: BOQRow[] = jsonData.map((row: any) => {
          const itemCode = row['Item Code'] || row['itemCode'] || row['Code'] || row['code'] || '';
          const description = row['Description'] || row['description'] || row['Desc'] || row['desc'] || '';
          const unit = row['Unit'] || row['unit'] || row['UOM'] || row['uom'] || '';
          const quantity = parseNumberSafe(row['Quantity'] || row['quantity'] || row['Qty'] || row['qty'] || '0') || 0;
          const unitPrice = parseNumberSafe(row['Unit Price'] || row['unitPrice'] || row['Price'] || row['price'] || '0') || 0;
          
          return {
            itemCode,
            description,
            unit,
            quantity,
            unitPrice,
            totalPrice: quantity * unitPrice,
            category: row['Category'] || row['category'] || row['Cat'] || row['cat'],
            wbsCode: row['WBS Code'] || row['wbsCode'] || row['WBS'] || row['wbs'],
            notes: row['Notes'] || row['notes'] || row['Note'] || row['note'],
          };
        });

        console.log(`Excel parsing successful: ${rows.length} items found`);
        resolve(rows);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to parse Excel file';
        console.error('Excel parsing error:', errorMsg, error);
        reject(new Error(errorMsg));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

export async function parseFile(file: File): Promise<BOQRow[]> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.csv')) {
    return parseCSVFile(file);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return parseExcelFile(file);
  } else if (fileName.endsWith('.pdf')) {
    return parsePDFFile(file);
  } else {
    throw new Error('Unsupported file format');
  }
}

/**
 * Enhanced PDF parsing with deduplication and sorting
 */
export async function parsePDFFile(file: File): Promise<BOQRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        
        // Set worker source using local ESM worker for Vite
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();

        const arrayBuffer = reader.result as ArrayBuffer;
        if (!arrayBuffer) {
          throw new Error('Failed to read PDF file');
        }
        
        const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        let fullText = '';

        // Extract text from all pages
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          try {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            if (!textContent || !textContent.items) {
              console.warn(`Page ${pageNum}: No text content found`);
              continue;
            }
            
            // Reconstruct lines using coordinate information
            const lines = reconstructLinesFromTextItems(textContent.items);
            fullText += lines.join('\n') + '\n';
            
            console.log(`Page ${pageNum}: Reconstructed ${lines.length} lines`);
          } catch (pageError) {
            console.warn(`Error processing page ${pageNum}:`, pageError);
            // Continue with next page
          }
        }

        // Use robust extraction from robustTableExtractor
        const robustExtractor = await import('./robustTableExtractor');
        const extractedItems = robustExtractor.extractBOQItemsAdvanced(fullText);

        console.log(`PDF parsing successful: ${extractedItems.length} items found`);
        
        if (extractedItems.length === 0) {
          console.error('No valid BOQ items found in PDF');
        }
        
        // Convert to BOQRow format
        let rows: BOQRow[] = extractedItems.map((item: any) => ({
          itemCode: item.itemCode || 'UNKNOWN',
          description: item.description || '',
          unit: item.unit || 'LOT',
          quantity: item.quantity || 0,
          unitPrice: item.unitPrice || 0,
          totalPrice: item.totalPrice || (item.quantity || 0) * (item.unitPrice || 0),
          category: item.category,
          wbsCode: item.wbsCode,
          notes: item.notes,
          serviceCode: item.serviceCode,
        }));
        
        // Apply deduplication and sorting using pdfDataMapper
        const dedupedItems = deduplicateMapperItems(rows.map(r => ({
          id: 0,
          itemCode: r.itemCode,
          description: r.description,
          unit: r.unit,
          quantity: r.quantity,
          unitPrice: r.unitPrice,
          totalPrice: r.totalPrice,
          category: r.category,
          notes: r.notes,
        })));
        
        const sortedItems = sortMapperItems(dedupedItems);
        
        // Convert back to BOQRow format
        rows = sortedItems.map(item => ({
          itemCode: item.itemCode,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          category: item.category,
          wbsCode: (item as any).wbsCode,
          notes: item.notes,
          serviceCode: '',
        }));
        
        console.log(`After deduplication and sorting: ${rows.length} items`);
        resolve(rows);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to parse PDF file';
        console.error('PDF parsing error:', errorMsg);
        if (error instanceof Error) {
          console.error('Stack:', error.stack);
        }
        reject(new Error(errorMsg));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

export function validateBOQData(data: BOQRow[]): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || data.length === 0) {
    errors.push('No data found in file');
    return { valid: false, errors, warnings };
  }

  // Check for required fields
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    // Description can be auto-filled, so just warn if missing
    if (!row.description || row.description.trim() === '') {
      warnings.push(`Row ${i + 1}: Missing description (will be auto-filled)`);
    }
    
    // Quantity MUST be > 0
    if (row.quantity <= 0) {
      errors.push(`Row ${i + 1}: Invalid quantity (must be > 0)`);
    }
    
    // Unit price can be 0, just warn
    if (row.unitPrice < 0) {
      errors.push(`Row ${i + 1}: Invalid unit price (cannot be negative)`);
    }
    
    if (row.unitPrice === 0) {
      warnings.push(`Row ${i + 1}: Unit price is 0`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}
