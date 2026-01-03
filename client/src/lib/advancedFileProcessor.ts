import * as XLSX from 'xlsx';
import { detectLanguage, detectLanguageAndDirection, type Language } from './languageDetector';
import { extractTextFromPDF } from './pdfExtractor';
// import { extractBOQWithMultilineSupport } from './advancedPdfTableExtractor';

export interface DataQualityReport {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  missingValues: number;
  dataTypeIssues: number;
  suggestions: string[];
}

export interface ProcessingError {
  type: 'unsupported_format' | 'corrupted_file' | 'missing_data' | 'unreadable_structure' | 'encoding_error' | 'unknown';
  message: string;
  details?: string;
  severity: 'error' | 'warning';
  recoveryAttempted?: boolean;
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
    qualityReport?: DataQualityReport;
  }>;
  pages?: Array<{
    pageNumber: number;
    content: string;
    language: Language;
    direction: 'rtl' | 'ltr';
    extractedStructuredData?: Array<Record<string, any>>;
  }>;
  errors: ProcessingError[];
  successCount: number;
  totalCount: number;
  processingMethod: 'primary' | 'fallback' | 'hybrid';
}

/**
 * Advanced Excel processing with multiple fallback strategies
 */
async function processExcelFileAdvanced(file: File): Promise<FileContent> {
  const errors: ProcessingError[] = [];
  let successCount = 0;
  let totalCount = 0;
  let processingMethod: 'primary' | 'fallback' | 'hybrid' = 'primary';

  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Try primary method: standard XLSX parsing
    let workbook = null;
    try {
      workbook = XLSX.read(arrayBuffer, { type: 'array', raw: false });
    } catch (error) {
      errors.push({
        type: 'corrupted_file',
        message: 'Primary XLSX parsing failed, attempting fallback method',
        severity: 'warning',
        recoveryAttempted: true,
      });
      processingMethod = 'fallback';
      
      // Fallback: Try with different options
      try {
        workbook = XLSX.read(arrayBuffer, { type: 'array' });
      } catch (fallbackError) {
        errors.push({
          type: 'corrupted_file',
          message: 'All XLSX parsing methods failed',
          details: fallbackError instanceof Error ? fallbackError.message : 'Unknown error',
          severity: 'error',
        });
        return createEmptyFileContent(file, errors, 'primary');
      }
    }

    if (!workbook || workbook.SheetNames.length === 0) {
      errors.push({
        type: 'missing_data',
        message: 'Excel file contains no sheets',
        severity: 'error',
      });
      return createEmptyFileContent(file, errors, processingMethod);
    }

    const sheets = [];
    totalCount = workbook.SheetNames.length;

    for (const sheetName of workbook.SheetNames) {
      try {
        const worksheet = workbook.Sheets[sheetName];
        
        // Try multiple parsing strategies
        let jsonData: any[] = [];
        
        // Strategy 1: Standard JSON conversion
        try {
          jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false }) as any[];
        } catch (error) {
          // Strategy 2: Try with different header option
          try {
            jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
            if (Array.isArray(jsonData) && jsonData.length > 0) {
              // Convert object array back to array format
              const firstRow = jsonData[0];
              const headers = Object.keys(firstRow);
              jsonData = [headers, ...jsonData.map(row => headers.map(h => row[h]))];
            }
          } catch (error2) {
            // Strategy 3: Raw cell parsing
            try {
              jsonData = parseSheetRaw(worksheet);
            } catch (error3) {
              errors.push({
                type: 'unreadable_structure',
                message: `Failed to parse sheet "${sheetName}" with all strategies`,
                severity: 'warning',
              });
              continue;
            }
          }
        }

        if (!jsonData || jsonData.length === 0) {
          errors.push({
            type: 'missing_data',
            message: `Sheet "${sheetName}" is empty or contains no readable data`,
            severity: 'warning',
          });
          continue;
        }

        // Clean and validate data
        const { headers, rows, qualityReport } = cleanAndValidateData(jsonData);

        if (rows.length === 0) {
          errors.push({
            type: 'missing_data',
            message: `Sheet "${sheetName}" has no valid data rows after cleaning`,
            severity: 'warning',
          });
          continue;
        }

        // Detect language
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
          qualityReport,
        });

        successCount++;
      } catch (error) {
        errors.push({
          type: 'unreadable_structure',
          message: `Failed to process sheet "${sheetName}"`,
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
      processingMethod,
    };
  } catch (error) {
    errors.push({
      type: 'corrupted_file',
      message: 'Critical error during Excel processing',
      details: error instanceof Error ? error.message : 'Unknown error',
      severity: 'error',
    });

    return createEmptyFileContent(file, errors, processingMethod);
  }
}

/**
 * Parse Excel sheet by raw cell access (fallback strategy)
 */
function parseSheetRaw(worksheet: XLSX.WorkSheet): any[] {
  const result: any[] = [];
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

  for (let row = range.s.r; row <= range.e.r; row++) {
    const rowData: any[] = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      rowData.push(cell ? cell.v : '');
    }
    if (rowData.some(cell => cell !== '')) {
      result.push(rowData);
    }
  }

  return result;
}

/**
 * Clean and validate extracted data
 */
function cleanAndValidateData(jsonData: any[]): {
  headers: string[];
  rows: Array<Record<string, any>>;
  qualityReport: DataQualityReport;
} {
  const headers = (jsonData[0] || []) as string[];
  const rawRows = jsonData.slice(1);

  const rows: Array<Record<string, any>> = [];
  let invalidRows = 0;
  let missingValues = 0;
  let dataTypeIssues = 0;

  for (const rawRow of rawRows) {
    // Skip completely empty rows
    if (!Array.isArray(rawRow) || rawRow.every(cell => !cell || cell === '')) {
      invalidRows++;
      continue;
    }

    const row: Record<string, any> = {};
    let rowHasData = false;

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      let value = rawRow[i];

      // Clean value
      if (value === null || value === undefined || value === '') {
        missingValues++;
        value = '';
      } else if (typeof value === 'string') {
        value = value.trim();
      }

      // Try to convert numeric strings to numbers
      if (typeof value === 'string' && value.match(/^-?\d+(\.\d+)?$/)) {
        value = parseFloat(value);
      }

      row[header] = value;
      if (value !== '') {
        rowHasData = true;
      }
    }

    if (rowHasData) {
      rows.push(row);
    } else {
      invalidRows++;
    }
  }

  const qualityReport: DataQualityReport = {
    totalRows: rawRows.length,
    validRows: rows.length,
    invalidRows,
    missingValues,
    dataTypeIssues,
    suggestions: generateSuggestions(rows, missingValues, invalidRows),
  };

  return { headers, rows, qualityReport };
}

/**
 * Generate data quality suggestions
 */
function generateSuggestions(rows: Array<Record<string, any>>, missingValues: number, invalidRows: number): string[] {
  const suggestions: string[] = [];

  if (missingValues > rows.length * 0.2) {
    suggestions.push('⚠️ High number of missing values detected. Consider verifying the source data.');
  }

  if (invalidRows > rows.length * 0.1) {
    suggestions.push('⚠️ Many invalid rows were skipped. Check the file format and data structure.');
  }

  // Check for inconsistent column counts
  if (rows.length > 0) {
    const firstRowKeys = Object.keys(rows[0]);
    const inconsistentRows = rows.filter(r => Object.keys(r).length !== firstRowKeys.length);
    if (inconsistentRows.length > 0) {
      suggestions.push(`⚠️ ${inconsistentRows.length} rows have inconsistent column counts.`);
    }
  }

  if (suggestions.length === 0) {
    suggestions.push('✅ Data quality looks good!');
  }

  return suggestions;
}

/**
 * Advanced PDF processing with structured data extraction
 */
async function processPDFFileAdvanced(file: File): Promise<FileContent> {
  const errors: ProcessingError[] = [];
  let successCount = 0;
  let totalCount = 1;
  let processingMethod: 'primary' | 'fallback' | 'hybrid' = 'primary';

  try {
    const pdfText = await extractTextFromPDF(file);

    if (!pdfText || pdfText.trim().length === 0) {
      errors.push({
        type: 'missing_data',
        message: 'PDF file contains no readable text',
        severity: 'error',
      });
      return createEmptyFileContent(file, errors, processingMethod);
    }

    // Try to extract structured BOQ data
    let structuredData: Array<Record<string, any>> = [];
    // Advanced extraction disabled
    // try {
    //   structuredData = extractBOQWithMultilineSupport(pdfText);
    //   if (structuredData.length > 0) {
    //     processingMethod = 'hybrid';
    //   }
    // } catch (error) {
    //   console.warn('Failed to extract structured data from PDF');
    // }

    // Split into pages
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
        extractedStructuredData: structuredData.length > 0 ? structuredData : undefined,
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
      processingMethod,
    };
  } catch (error) {
    errors.push({
      type: 'corrupted_file',
      message: 'Failed to read PDF file',
      details: error instanceof Error ? error.message : 'Unknown error',
      severity: 'error',
    });

    return createEmptyFileContent(file, errors, processingMethod);
  }
}

/**
 * Helper function to create empty file content
 */
function createEmptyFileContent(
  file: File,
  errors: ProcessingError[],
  processingMethod: 'primary' | 'fallback' | 'hybrid'
): FileContent {
  return {
    fileName: file.name,
    fileType: 'unknown',
    language: 'unknown',
    direction: 'ltr',
    sheets: [],
    pages: [],
    errors,
    successCount: 0,
    totalCount: 1,
    processingMethod,
  };
}

/**
 * Detect file type with enhanced detection
 */
function detectFileType(file: File): 'excel' | 'pdf' | 'unknown' {
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();
  const fileSize = file.size;

  // Check file signature (magic bytes)
  if (fileSize > 4) {
    // PDF signature: %PDF
    if (mimeType.includes('pdf') || fileName.endsWith('.pdf')) {
      return 'pdf';
    }

    // Excel signatures
    if (
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls') ||
      mimeType.includes('spreadsheet') ||
      mimeType.includes('excel') ||
      mimeType.includes('sheet')
    ) {
      return 'excel';
    }
  }

  return 'unknown';
}

/**
 * Main file processing function with advanced error handling
 */
export async function processFileAdvanced(file: File): Promise<FileContent> {
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
      processingMethod: 'primary',
    };
  }

  if (fileType === 'excel') {
    return processExcelFileAdvanced(file);
  }

  if (fileType === 'pdf') {
    return processPDFFileAdvanced(file);
  }

  return createEmptyFileContent(file, [], 'primary');
}

/**
 * Validate and repair extracted data
 */
export function validateAndRepairData(
  rows: Array<Record<string, any>>,
  headers: string[]
): {
  repairedRows: Array<Record<string, any>>;
  repairLog: string[];
} {
  const repairLog: string[] = [];
  const repairedRows: Array<Record<string, any>> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = { ...rows[i] };
    let rowRepaired = false;

    // Ensure all headers exist
    for (const header of headers) {
      if (!(header in row)) {
        row[header] = '';
        rowRepaired = true;
      }
    }

    // Remove extra columns
    for (const key of Object.keys(row)) {
      if (!headers.includes(key)) {
        delete row[key];
        rowRepaired = true;
      }
    }

    if (rowRepaired) {
      repairLog.push(`Row ${i + 1}: Fixed missing or extra columns`);
    }

    repairedRows.push(row);
  }

  return { repairedRows, repairLog };
}
