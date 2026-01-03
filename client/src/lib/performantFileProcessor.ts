/**
 * Performant File Processing Module
 * 
 * Handles Excel, CSV, and PDF file parsing with optimization.
 * Uses centralized PDF.js worker configuration from pdfjs.ts
 */

import * as XLSX from 'xlsx';
import { ensureWorkerReady, pdfjsLib } from './pdfjs';
import { extractTablesFromPDFAdvanced } from './pdfExtractor';

export interface ProcessingProgress {
  stage: 'detecting' | 'parsing' | 'mapping' | 'complete';
  progress: number;
  message: string;
}

export interface PerformantResult {
  data: any[];
  fileName: string;
  format: string;
  confidence: number;
  processingTime: number;
  rowCount: number;
  columnCount: number;
  language: 'ar' | 'en';
}

/**
 * Optimized Excel parser with streaming
 */
async function parseExcelOptimized(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        // Parse with optimization
        const rows = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          blankrows: false,
        });

        // Clean and normalize data
        const cleanedRows = rows.map((row: any) =>
          Object.entries(row as Record<string, any>).reduce(
            (acc, [key, value]) => {
              const cleanKey = String(key).trim();
              const cleanValue = String(value || '').trim();
              if (cleanValue) {
                acc[cleanKey] = cleanValue;
              }
              return acc;
            },
            {} as Record<string, string>
          )
        );

        resolve(cleanedRows);
      } catch (err) {
        reject(new Error(`Failed to parse Excel: ${err instanceof Error ? err.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Optimized CSV parser
 */
async function parseCSVOptimized(text: string): Promise<any[]> {
  const lines = text.split('\n').filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    return headers.reduce(
      (acc, header, idx) => {
        if (values[idx]) {
          acc[header] = values[idx];
        }
        return acc;
      },
      {} as Record<string, string>
    );
  });

  return rows;
}

/**
 * Optimized PDF text extraction with centralized worker initialization
 * 
 * Uses the pdfjs.ts module for worker setup, ensuring:
 * - Single initialization point
 * - Browser-only execution
 * - Proper error handling
 */
async function extractPDFTextOptimized(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Ensure worker is ready before attempting extraction
    try {
      ensureWorkerReady();
    } catch (error) {
      reject(new Error(`PDF worker initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = e.target?.result as ArrayBuffer;
        const pdf = await pdfjsLib.getDocument({ data }).promise;

        let fullText = '';
        const pageCount = Math.min(pdf.numPages, 10); // Limit to first 10 pages for performance

        for (let i = 1; i <= pageCount; i++) {
          try {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
          } catch (pageError) {
            // Log warning but continue with next page instead of failing entire extraction
            console.warn(`Failed to extract text from page ${i}:`, pageError);
            fullText += `[Page ${i} extraction failed]\n`;
          }
        }

        resolve(fullText);
      } catch (err) {
        reject(new Error(`Failed to extract PDF text: ${err instanceof Error ? err.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Extract table data from text with performance optimization
 */
function extractTableFromText(text: string): any[] {
  const lines = text.split('\n').filter((line) => line.trim());
  if (lines.length < 2) return [];

  // Try to detect table structure
  const rows: any[] = [];
  let currentRow: Record<string, string> = {};
  let columnCount = 0;

  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;

    // Try to split by multiple spaces or tabs
    const parts = line.split(/\s{2,}|\t+/).filter((p) => p.trim());

    if (parts.length > 0) {
      if (columnCount === 0) {
        columnCount = parts.length;
        // Use generic column names
        parts.forEach((part, idx) => {
          currentRow[`Column ${idx + 1}`] = part;
        });
      } else if (parts.length === columnCount) {
        if (Object.keys(currentRow).length > 0) {
          rows.push(currentRow);
        }
        currentRow = {};
        parts.forEach((part, idx) => {
          currentRow[`Column ${idx + 1}`] = part;
        });
      }
    }
  }

  if (Object.keys(currentRow).length > 0) {
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Main performant file processor
 * 
 * Handles Excel, CSV, and PDF files with progress tracking
 */
export async function performantFileProcessor(
  file: File,
  language: 'ar' | 'en' = 'en',
  onProgress?: (progress: ProcessingProgress) => void
): Promise<PerformantResult> {
  const startTime = performance.now();
  let data: any[] = [];
  let format = 'unknown';
  let confidence = 0;

  try {
    // Detect format
    onProgress?.({
      stage: 'detecting',
      progress: 10,
      message: 'Detecting file format...',
    });

    const fileName = file.name.toLowerCase();
    const fileSize = file.size;

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      format = 'excel';
      onProgress?.({
        stage: 'parsing',
        progress: 30,
        message: 'Parsing Excel file...',
      });
      data = await parseExcelOptimized(file);
      confidence = 0.95;
    } else if (fileName.endsWith('.csv')) {
      format = 'csv';
      onProgress?.({
        stage: 'parsing',
        progress: 30,
        message: 'Parsing CSV file...',
      });
      const text = await file.text();
      data = await parseCSVOptimized(text);
      confidence = 0.9;
    } else if (fileName.endsWith('.pdf')) {
      format = 'pdf';
      onProgress?.({
        stage: 'parsing',
        progress: 30,
        message: 'Extracting tables from PDF...',
      });
      try {
        // Try advanced table extraction first
        data = await extractTablesFromPDFAdvanced(file);
        confidence = data.length > 0 ? 0.85 : 0.5;
      } catch (tableError) {
        console.warn('Advanced table extraction failed, falling back to text extraction:', tableError);
        // Fallback to text extraction
        const text = await extractPDFTextOptimized(file);
        data = extractTableFromText(text);
        confidence = 0.6;
      }
    } else {
      throw new Error('Unsupported file format');
    }

    // Map columns
    onProgress?.({
      stage: 'mapping',
      progress: 70,
      message: 'Mapping columns...',
    });

    // Data is already cleaned, no additional mapping needed

    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Processing complete',
    });

    const processingTime = performance.now() - startTime;

    return {
      data,
      fileName: file.name,
      format,
      confidence,
      processingTime,
      rowCount: data.length,
      columnCount: data.length > 0 ? Object.keys(data[0]).length : 0,
      language,
    };
  } catch (error) {
    throw new Error(`File processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default performantFileProcessor;
