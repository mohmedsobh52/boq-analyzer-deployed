/**
 * PDF Text Extraction Module
 * 
 * Uses the centralized PDF.js worker configuration from pdfjs.ts
 * Provides high-level functions for extracting text from PDF files
 */

import { ensureWorkerReady, pdfjsLib } from './pdfjs';
import { extractBOQFromPDFRobust } from './robustTableExtractor';

/**
 * Extract text from a PDF file
 * 
 * Handles multi-page PDFs gracefully:
 * - Initializes worker on first call
 * - Continues extraction even if individual pages fail
 * - Returns all successfully extracted text
 * 
 * @param file - The PDF file to extract text from
 * @returns Promise resolving to the extracted text
 * @throws Error if PDF is invalid or extraction fails completely
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Ensure worker is initialized before attempting extraction
    ensureWorkerReady();

    const arrayBuffer = await file.arrayBuffer();
    if (!arrayBuffer) {
      throw new Error('Failed to read file');
    }

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      } catch (pageError) {
        // Log warning but continue with next page instead of failing entire extraction
        console.warn(`Failed to extract text from page ${i}:`, pageError);
        fullText += `[Page ${i} extraction failed]\n`;
      }
    }

    return fullText;
  } catch (error) {
    console.error('Failed to extract PDF text:', error);
    throw new Error(
      `PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Parse table data from extracted PDF text
 * Looks for patterns like:
 * Item Code | Description | Unit | Qty | Unit Price | Total
 */
export function parseTableFromText(text: string): Array<{
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}> {
  const items = [];

  // Split text into lines
  const lines = text.split('\n').filter(line => line.trim());

  // Try to find table rows (heuristic: lines with numbers and text)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip header lines and empty lines
    if (
      !line ||
      line.toLowerCase().includes('item') ||
      line.toLowerCase().includes('description') ||
      line.toLowerCase().includes('total')
    ) {
      continue;
    }

    // Try to parse as a table row
    // Look for patterns: code | description | unit | qty | price | total
    const parts = line.split(/[\s|,\t]+/).filter(p => p.trim());

    if (parts.length >= 5) {
      try {
        // Try to extract numeric values
        const numbers = parts.map(p => parseFloat(p)).filter(n => !isNaN(n));

        if (numbers.length >= 3) {
          // Assume: quantity, unitPrice, totalPrice are numeric
          const quantity = numbers[0] || 0;
          const unitPrice = numbers[1] || 0;
          const totalPrice = numbers[2] || quantity * unitPrice;

          // Extract text parts for code and description
          const textParts = parts.filter(p => isNaN(parseFloat(p)));

          if (textParts.length >= 2) {
            items.push({
              itemCode: textParts[0] || `ITEM-${items.length + 1}`,
              description: textParts.slice(1).join(' ') || 'No description',
              unit: 'EA',
              quantity,
              unitPrice,
              totalPrice,
            });
          }
        }
      } catch (error) {
        // Skip lines that can't be parsed
        continue;
      }
    }
  }

  return items;
}

/**
 * Extract structured BOQ data from PDF text using regex patterns
 */
export function extractBOQFromPDFText(text: string): Array<{
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}> {
  const items = [];
  const lines = text.split('\n');

  // Pattern to match BOQ rows (flexible matching)
  // Looks for: CODE | Description | Unit | Qty | Price | Total
  const patterns = [
    // Pattern 1: Tab or pipe separated
    /^([A-Z0-9\-\.]+)\s*[\|\t]\s*(.+?)\s*[\|\t]\s*([A-Z]{2,3})\s*[\|\t]\s*([\d,\.]+)\s*[\|\t]\s*([\d,\.]+)\s*[\|\t]\s*([\d,\.]+)/i,
    // Pattern 2: Multiple spaces separated
    /^([A-Z0-9\-\.]+)\s{2,}(.+?)\s{2,}([A-Z]{2,3})\s{2,}([\d,\.]+)\s{2,}([\d,\.]+)\s{2,}([\d,\.]+)/i,
  ];

  for (const line of lines) {
    if (!line.trim()) continue;

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        try {
          const itemCode = match[1].trim();
          const description = match[2].trim();
          const unit = match[3].trim();
          const quantity = parseFloat(match[4].replace(/,/g, ''));
          const unitPrice = parseFloat(match[5].replace(/,/g, ''));
          const totalPrice = parseFloat(match[6].replace(/,/g, ''));

          if (!isNaN(quantity) && !isNaN(unitPrice)) {
            items.push({
              itemCode,
              description,
              unit,
              quantity,
              unitPrice,
              totalPrice: !isNaN(totalPrice) ? totalPrice : quantity * unitPrice,
            });
            break; // Move to next line if pattern matched
          }
        } catch (error) {
          continue;
        }
      }
    }
  }

  return items;
}

/**
 * Extract tables from PDF using advanced layout analysis
 */
export async function extractTablesFromPDFAdvanced(file: File): Promise<any[]> {
  try {
    ensureWorkerReady();

    const arrayBuffer = await file.arrayBuffer();
    if (!arrayBuffer) {
      throw new Error('Failed to read file');
    }

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    // Use robust extraction with multiple strategies
    const items = await extractBOQFromPDFRobust(pdf);
    
    if (items.length === 0) {
      throw new Error('No data could be extracted from PDF');
    }

    return items;
  } catch (error) {
    console.error('Error extracting tables from PDF:', error);
    throw error;
  }
}
