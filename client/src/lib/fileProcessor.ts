import * as XLSX from 'xlsx';
import { detectLanguage, detectLanguageAndDirection, type Language } from './languageDetector';
import { extractTextFromPDF } from './pdfExtractor';

export interface ProcessingError {
  type: 'unsupported_format' | 'corrupted_file' | 'missing_data' | 'unreadable_structure' | 'encoding_error' | 'unknown';
  message: string;
  details?: string;
  severity: 'error' | 'warning';
}

export interface FileContent {
  fileName: string;
  fileType: 'excel' | 'pdf' | 'unknown';
  language: Language;
  direction: 'rtl' | 'ltr';
  sheets?: Array<{
    name: string;
    headers: string[];
    rows: Array<Record<string, any>>;
    language: Language;
    direction: 'rtl' | 'ltr';
  }>;
  pages?: Array<{
    pageNumber: number;
    content: string;
    language: Language;
    direction: 'rtl' | 'ltr';
  }>;
  errors: ProcessingError[];
  successCount: number;
  totalCount: number;
}

/**
 * Process Excel file and extract content with language detection
 */
async function processExcelFile(file: File): Promise<FileContent> {
  const errors: ProcessingError[] = [];
  let successCount = 0;
  let totalCount = 0;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    if (!workbook || workbook.SheetNames.length === 0) {
      errors.push({
        type: 'missing_data',
        message: 'Excel file contains no sheets',
        severity: 'error',
      });
      return {
        fileName: file.name,
        fileType: 'excel',
        language: 'unknown',
        direction: 'ltr',
        sheets: [],
        errors,
        successCount: 0,
        totalCount: 0,
      };
    }

    const sheets = [];
    totalCount = workbook.SheetNames.length;

    for (const sheetName of workbook.SheetNames) {
      try {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];

        if (!jsonData || jsonData.length === 0) {
          errors.push({
            type: 'missing_data',
            message: `Sheet "${sheetName}" is empty`,
            severity: 'warning',
          });
          continue;
        }

        const headers = (jsonData[0] || []) as string[];
        const rows = jsonData.slice(1).map(row => {
          const obj: Record<string, any> = {};
          headers.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        });

        // Detect language from headers and first few rows
        const sampleText = [
          ...headers,
          ...rows.slice(0, 5).flatMap(r => Object.values(r).map(v => String(v))),
        ].join(' ');

        const language = detectLanguage(sampleText);
        const { direction } = detectLanguageAndDirection(sampleText);

        sheets.push({
          name: sheetName,
          headers,
          rows,
          language,
          direction,
        });

        successCount++;
      } catch (error) {
        errors.push({
          type: 'unreadable_structure',
          message: `Failed to read sheet "${sheetName}"`,
          details: error instanceof Error ? error.message : 'Unknown error',
          severity: 'warning',
        });
      }
    }

    // Detect overall language
    const allText = sheets
      .flatMap(s => [...s.headers, ...s.rows.flatMap(r => Object.values(r).map(v => String(v)))])
      .join(' ');
    const language = detectLanguage(allText);
    const { direction } = detectLanguageAndDirection(allText);

    return {
      fileName: file.name,
      fileType: 'excel',
      language,
      direction,
      sheets,
      errors,
      successCount,
      totalCount,
    };
  } catch (error) {
    errors.push({
      type: 'corrupted_file',
      message: 'Failed to read Excel file',
      details: error instanceof Error ? error.message : 'Unknown error',
      severity: 'error',
    });

    return {
      fileName: file.name,
      fileType: 'excel',
      language: 'unknown',
      direction: 'ltr',
      sheets: [],
      errors,
      successCount: 0,
      totalCount: 1,
    };
  }
}

/**
 * Process PDF file and extract content with language detection
 */
async function processPDFFile(file: File): Promise<FileContent> {
  const errors: ProcessingError[] = [];
  let successCount = 0;
  let totalCount = 0;

  try {
    const pdfText = await extractTextFromPDF(file);

    if (!pdfText || pdfText.trim().length === 0) {
      errors.push({
        type: 'missing_data',
        message: 'PDF file contains no readable text',
        severity: 'error',
      });
      return {
        fileName: file.name,
        fileType: 'pdf',
        language: 'unknown',
        direction: 'ltr',
        pages: [],
        errors,
        successCount: 0,
        totalCount: 1,
      };
    }

    // Split into pages (assuming page breaks are represented by multiple newlines)
    const pageTexts = pdfText.split(/\n{3,}/).filter(p => p.trim().length > 0);
    totalCount = pageTexts.length;

    const pages = pageTexts.map((pageText, index) => {
      const language = detectLanguage(pageText);
      const { direction } = detectLanguageAndDirection(pageText);

      return {
        pageNumber: index + 1,
        content: pageText.trim(),
        language,
        direction,
      };
    });

    successCount = pages.length;

    // Detect overall language
    const language = detectLanguage(pdfText);
    const { direction } = detectLanguageAndDirection(pdfText);

    return {
      fileName: file.name,
      fileType: 'pdf',
      language,
      direction,
      pages,
      errors,
      successCount,
      totalCount,
    };
  } catch (error) {
    errors.push({
      type: 'corrupted_file',
      message: 'Failed to read PDF file',
      details: error instanceof Error ? error.message : 'Unknown error',
      severity: 'error',
    });

    return {
      fileName: file.name,
      fileType: 'pdf',
      language: 'unknown',
      direction: 'ltr',
      pages: [],
      errors,
      successCount: 0,
      totalCount: 1,
    };
  }
}

/**
 * Detect file type from file name and MIME type
 */
function detectFileType(file: File): 'excel' | 'pdf' | 'unknown' {
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();

  if (
    fileName.endsWith('.xlsx') ||
    fileName.endsWith('.xls') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel')
  ) {
    return 'excel';
  }

  if (fileName.endsWith('.pdf') || mimeType.includes('pdf')) {
    return 'pdf';
  }

  return 'unknown';
}

/**
 * Process any file and extract content
 */
export async function processFile(file: File): Promise<FileContent> {
  const fileType = detectFileType(file);

  if (fileType === 'unknown') {
    return {
      fileName: file.name,
      fileType: 'unknown',
      language: 'unknown',
      direction: 'ltr',
      errors: [
        {
          type: 'unsupported_format',
          message: `Unsupported file format: ${file.type || 'unknown'}`,
          details: `Only Excel (.xlsx, .xls) and PDF (.pdf) files are supported`,
          severity: 'error',
        },
      ],
      successCount: 0,
      totalCount: 1,
    };
  }

  if (fileType === 'excel') {
    return processExcelFile(file);
  }

  if (fileType === 'pdf') {
    return processPDFFile(file);
  }

  return {
    fileName: file.name,
    fileType: 'unknown',
    language: 'unknown',
    direction: 'ltr',
    errors: [
      {
        type: 'unknown',
        message: 'Unknown error occurred',
        severity: 'error',
      },
    ],
    successCount: 0,
    totalCount: 1,
  };
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: ProcessingError): string {
  let message = error.message;
  if (error.details) {
    message += ` (${error.details})`;
  }
  return message;
}
