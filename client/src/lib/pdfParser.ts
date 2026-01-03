/**
 * PDF Parser for BOQ Documents
 * Extracts text and table data from PDF files using pdfjs-dist
 */

import {
  detectTableRegions,
  matchTableToBOQFields,
  extractBOQItemsFromTable,
  validateExtractedBOQItems,
  PDFTextItem,
} from './pdfTableExtractor';

let pdfjsLib: any = null;
let workerInitialized = false;
let workerInitError: Error | null = null;

// Lazy load pdfjs-dist only in browser environment
async function loadPDFJS() {
  if (typeof window === 'undefined') {
    return null; // Skip in Node.js environment
  }

  if (pdfjsLib) {
    return pdfjsLib;
  }

  try {
    pdfjsLib = await import('pdfjs-dist');
    await initializePDFWorker();
    return pdfjsLib;
  } catch (error) {
    console.error('Failed to load pdfjs-dist:', error);
    workerInitError = error instanceof Error ? error : new Error(String(error));
    return null;
  }
}

async function initializePDFWorker() {
  if (workerInitialized || !pdfjsLib) return;

  try {
    // Try multiple approaches to set the worker
    
    // Approach 1: Use the worker from node_modules via import
    try {
      const workerPath = new URL(
        '../../../node_modules/pdfjs-dist/build/pdf.worker.min.js',
        import.meta.url
      ).href;
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
      console.log('PDF worker initialized from node_modules');
      workerInitialized = true;
      return;
    } catch (e) {
      console.warn('Failed to set worker from node_modules:', e);
    }

    // Approach 2: Use relative path from package
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      console.log('PDF worker initialized from public path');
      workerInitialized = true;
      return;
    } catch (e) {
      console.warn('Failed to set worker from public path:', e);
    }

    // Approach 3: Use CDN with multiple fallbacks
    const cdnUrls = [
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
      'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js',
    ];

    for (const url of cdnUrls) {
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = url;
        console.log(`PDF worker set to CDN: ${url}`);
        workerInitialized = true;
        return;
      } catch (e) {
        console.warn(`Failed to set worker to ${url}:`, e);
        continue;
      }
    }

    // If all approaches fail, set a dummy worker
    console.warn('All PDF worker initialization approaches failed, using fallback');
    pdfjsLib.GlobalWorkerOptions.workerSrc = null;
    workerInitialized = true;
  } catch (error) {
    console.error('PDF worker initialization error:', error);
    workerInitError = error instanceof Error ? error : new Error(String(error));
    workerInitialized = true; // Mark as initialized to avoid retry loops
  }
}

export interface PDFParseResult {
  text: string;
  pages: number;
  tables: Array<{
    headers: string[];
    rows: string[][];
  }>;
  extractedBOQItems?: Array<{
    code?: string;
    description: string;
    unit?: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
    confidence: number;
  }>;
  success: boolean;
  error?: string;
}

/**
 * Extract text from PDF file using pdfjs-dist
 */
export async function parsePDFFile(file: File): Promise<PDFParseResult> {
  try {
    // Validate file type
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      return {
        text: '',
        pages: 0,
        tables: [],
        success: false,
        error: 'Invalid file type. Please upload a PDF file.',
      };
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        text: '',
        pages: 0,
        tables: [],
        success: false,
        error: 'File size exceeds 50MB limit.',
      };
    }

    // Load PDF.js library
    const pdfjs = await loadPDFJS();
    if (!pdfjs) {
      const errorMsg = workerInitError?.message || 'PDF.js library failed to load';
      return {
        text: '',
        pages: 0,
        tables: [],
        success: false,
        error: `Failed to load PDF.js: ${errorMsg}. Please try again or contact support.`,
      };
    }

    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();

    // Load PDF document with error handling
    let pdf;
    try {
      pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    } catch (loadError) {
      console.error('Failed to load PDF document:', loadError);
      return {
        text: '',
        pages: 0,
        tables: [],
        success: false,
        error: 'Failed to load PDF document. The file may be corrupted, encrypted, or in an unsupported format.',
      };
    }

    const pageCount = pdf.numPages;
    let fullText = '';
    const allTextItems: PDFTextItem[] = [];
    let successfulPages = 0;

    // Extract text from all pages with error handling
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Collect text items for table extraction
        textContent.items.forEach((item: any) => {
          if (item.str) {
            allTextItems.push({
              str: item.str,
              x0: item.x0 || 0,
              y0: item.y0 || 0,
              x1: item.x1 || 0,
              y1: item.y1 || 0,
              width: item.width || 0,
              height: item.height || 0,
              fontName: item.fontName || '',
              fontSize: item.fontSize || 0,
            });
          }
        });
        
        const pageText = textContent.items
          .filter((item: any) => item.str)
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
        successfulPages++;
      } catch (pageError) {
        console.warn(`Failed to extract text from page ${pageNum}:`, pageError);
        // Continue with next page instead of failing
        continue;
      }
    }

    // Check if we extracted any text
    if (successfulPages === 0) {
      return {
        text: '',
        pages: pageCount,
        tables: [],
        success: false,
        error: 'Failed to extract text from all pages. The PDF may be corrupted or contain only images.',
      };
    }

    // Detect and extract tables
    const detectedTables = detectTableRegions(allTextItems);
    const extractedTables = detectedTables.map(table => ({
      headers: table.headers,
      rows: table.rows,
    }));

    // Extract BOQ items from first detected table (if any)
    let extractedBOQItems = undefined;
    if (detectedTables.length > 0) {
      try {
        const firstTable = detectedTables[0];
        const mapping = matchTableToBOQFields(firstTable);
        const boqItems = extractBOQItemsFromTable(firstTable, mapping);
        const validation = validateExtractedBOQItems(boqItems);
        
        if (validation.valid) {
          extractedBOQItems = boqItems;
        }
      } catch (extractError) {
        console.warn('Failed to extract BOQ items from table:', extractError);
        // Continue without BOQ items extraction
      }
    }

    return {
      text: fullText,
      pages: pageCount,
      tables: extractedTables,
      extractedBOQItems,
      success: true,
      error: undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('PDF parsing error:', errorMessage);
    return {
      text: '',
      pages: 0,
      tables: [],
      success: false,
      error: `Failed to parse PDF: ${errorMessage}`,
    };
  }
}

/**
 * Extract BOQ data from PDF text
 * Attempts to identify and parse BOQ table structure
 */
export function extractBOQDataFromText(text: string): Array<{
  itemCode?: string;
  description: string;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
}> {
  const items: Array<{
    itemCode?: string;
    description: string;
    unit?: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
  }> = [];

  // Split text into lines
  const lines = text.split('\n').filter(line => line.trim().length > 0);

  // Simple pattern matching for BOQ items
  const itemPattern = /^([A-Z0-9-]+)\s+(.+?)\s+(\w+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)$/;

  lines.forEach((line, index) => {
    const match = line.match(itemPattern);
    if (match) {
      items.push({
        itemCode: match[1],
        description: match[2],
        unit: match[3],
        quantity: parseFloat(match[4]),
        unitPrice: parseFloat(match[5]),
        totalPrice: parseFloat(match[6]),
      });
    }
  });

  return items;
}
