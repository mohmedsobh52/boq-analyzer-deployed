/**
 * Intelligent file format detector
 * Analyzes file structure and detects BOQ format patterns
 */

export interface ColumnMapping {
  originalName: string;
  detectedType: 'itemCode' | 'description' | 'unit' | 'quantity' | 'unitPrice' | 'totalPrice' | 'category' | 'wbsCode' | 'notes' | 'unknown';
  confidence: number;
  alternativeNames: string[];
}

export interface FormatDetectionResult {
  format: 'standard' | 'construction' | 'procurement' | 'engineering' | 'custom';
  columnMappings: ColumnMapping[];
  confidence: number;
  hasHeaders: boolean;
  estimatedDataRows: number;
  recommendations: string[];
}

export interface DataTypeDetection {
  columnIndex: number;
  columnName: string;
  detectedType: 'string' | 'number' | 'currency' | 'percentage' | 'date' | 'mixed';
  confidence: number;
  sampleValues: any[];
}

// Common column name patterns for different BOQ formats
const COLUMN_PATTERNS = {
  itemCode: [
    /^(item\s*code|code|item\s*no|item\s*number|no\.|#|sl\s*no|serial|ref|reference)$/i,
    /^(رمز|كود|رقم|رقم\s*البند|بند)$/,
  ],
  description: [
    /^(description|desc|item|item\s*description|name|title|details)$/i,
    /^(الوصف|البيان|الاسم|التفاصيل|البند)$/,
  ],
  unit: [
    /^(unit|uom|unit\s*of\s*measure|measurement|measure)$/i,
    /^(الوحدة|وحدة|قياس)$/,
  ],
  quantity: [
    /^(quantity|qty|qnt|amount|count|num)$/i,
    /^(الكمية|كمية|عدد|الكم)$/,
  ],
  unitPrice: [
    /^(unit\s*price|price|unit\s*cost|cost|rate|unit\s*rate)$/i,
    /^(سعر\s*الوحدة|سعر|تكلفة|معدل)$/,
  ],
  totalPrice: [
    /^(total|total\s*price|total\s*cost|amount|subtotal|extended\s*price)$/i,
    /^(الإجمالي|المجموع|الكلي|السعر\s*الإجمالي)$/,
  ],
  category: [
    /^(category|cat|type|class|group|section)$/i,
    /^(الفئة|النوع|الصنف|المجموعة|القسم)$/,
  ],
  wbsCode: [
    /^(wbs|wbs\s*code|work\s*breakdown|structure|level)$/i,
    /^(هيكل\s*التفصيل|wbs|المستوى)$/,
  ],
  notes: [
    /^(notes|remarks|comments|note|comment|remark)$/i,
    /^(ملاحظات|تعليقات|ملاحظة|تعليق)$/,
  ],
};

/**
 * Detect column type based on header name
 */
export function detectColumnType(
  columnName: string
): { type: ColumnMapping['detectedType']; confidence: number; alternatives: string[] } {
  const name = columnName.trim().toLowerCase();
  let bestMatch: { type: ColumnMapping['detectedType']; confidence: number } = {
    type: 'unknown',
    confidence: 0,
  };

  for (const [type, patterns] of Object.entries(COLUMN_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(name)) {
        const confidence = pattern.test(columnName) ? 0.95 : 0.8;
        if (confidence > bestMatch.confidence) {
          bestMatch = { type: type as ColumnMapping['detectedType'], confidence };
        }
      }
    }
  }

  // Get alternative names for this type
  const alternatives = COLUMN_PATTERNS[bestMatch.type as keyof typeof COLUMN_PATTERNS]
    ?.map((p) => p.source)
    .slice(0, 3) || [];

  return {
    type: bestMatch.type,
    confidence: bestMatch.confidence,
    alternatives,
  };
}

/**
 * Detect data type of a column based on sample values
 */
export function detectDataType(values: any[]): DataTypeDetection['detectedType'] {
  if (!values || values.length === 0) return 'mixed';

  const sampleSize = Math.min(10, values.length);
  const samples = values.slice(0, sampleSize);

  let numberCount = 0;
  let currencyCount = 0;
  let dateCount = 0;
  let stringCount = 0;

  for (const value of samples) {
    const str = String(value).trim();
    if (!str) continue;

    // Check for currency (contains $ or numbers with decimals)
    if (/^\$?\s*[\d,]+\.?\d*$/.test(str) || /^[\d,]+\.?\d*\s*$/.test(str)) {
      const num = parseFloat(str.replace(/[$,]/g, ''));
      if (!isNaN(num)) {
        if (num > 1000 || str.includes('$')) {
          currencyCount++;
        } else {
          numberCount++;
        }
        continue;
      }
    }

    // Check for date
    if (/^\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}$/.test(str)) {
      dateCount++;
      continue;
    }

    // Check for percentage
    if (/^\d+\.?\d*\s*%$/.test(str)) {
      numberCount++;
      continue;
    }

    stringCount++;
  }

  if (currencyCount > sampleSize * 0.7) return 'currency';
  if (numberCount > sampleSize * 0.7) return 'number';
  if (dateCount > sampleSize * 0.5) return 'date';
  if (stringCount > sampleSize * 0.7) return 'string';

  return 'mixed';
}

/**
 * Detect BOQ format based on structure
 */
export function detectBOQFormat(
  headers: string[],
  sampleData: any[][]
): { format: FormatDetectionResult['format']; confidence: number } {
  const headerLower = headers.map((h) => h.toLowerCase()).join(' ');

  // Construction format indicators
  if (
    /material|labor|equipment|overhead|contingency/.test(headerLower) ||
    /مواد|عمالة|معدات|نفقات|احتياطي/.test(headerLower)
  ) {
    return { format: 'construction', confidence: 0.9 };
  }

  // Procurement format indicators
  if (
    /supplier|vendor|po|purchase|delivery|specification/.test(headerLower) ||
    /مورد|بائع|طلب|شراء|توصيل|مواصفات/.test(headerLower)
  ) {
    return { format: 'procurement', confidence: 0.85 };
  }

  // Engineering format indicators
  if (
    /drawing|specification|tolerance|dimension|weight|volume/.test(headerLower) ||
    /رسم|مواصفات|تفاوت|أبعاد|وزن|حجم/.test(headerLower)
  ) {
    return { format: 'engineering', confidence: 0.8 };
  }

  // Default to standard
  return { format: 'standard', confidence: 0.7 };
}

/**
 * Analyze file structure and detect format
 */
export function analyzeFileStructure(
  headers: string[],
  sampleData: any[][],
  totalRows: number
): FormatDetectionResult {
  // Detect column mappings
  const columnMappings: ColumnMapping[] = headers.map((header) => {
    const { type, confidence, alternatives } = detectColumnType(header);
    return {
      originalName: header,
      detectedType: type,
      confidence,
      alternativeNames: alternatives,
    };
  });

  // Detect format
  const { format, confidence: formatConfidence } = detectBOQFormat(headers, sampleData);

  // Generate recommendations
  const recommendations: string[] = [];

  // Check for missing critical columns
  const requiredTypes = ['itemCode', 'description', 'quantity', 'unitPrice'];
  const missingTypes = requiredTypes.filter(
    (type) => !columnMappings.some((m) => m.detectedType === type && m.confidence > 0.5)
  );

  if (missingTypes.length > 0) {
    recommendations.push(`Missing critical columns: ${missingTypes.join(', ')}`);
  }

  // Check for low confidence mappings
  const lowConfidenceColumns = columnMappings.filter((m) => m.confidence < 0.6 && m.detectedType !== 'unknown');
  if (lowConfidenceColumns.length > 0) {
    recommendations.push(`Review column mappings for: ${lowConfidenceColumns.map((c) => c.originalName).join(', ')}`);
  }

  // Check data quality
  if (totalRows < 2) {
    recommendations.push('File contains very few data rows');
  }

  const overallConfidence =
    (columnMappings.reduce((sum, m) => sum + m.confidence, 0) / columnMappings.length + formatConfidence) / 2;

  return {
    format,
    columnMappings,
    confidence: Math.min(overallConfidence, 1),
    hasHeaders: true,
    estimatedDataRows: totalRows,
    recommendations,
  };
}

/**
 * Auto-map columns based on detection results
 */
export function autoMapColumns(
  detectionResult: FormatDetectionResult
): Record<string, string | null> {
  const mapping: Record<string, string | null> = {};

  for (const col of detectionResult.columnMappings) {
    if (col.detectedType !== 'unknown' && col.confidence > 0.6) {
      mapping[col.detectedType] = col.originalName;
    }
  }

  return mapping;
}

/**
 * Validate and suggest corrections for column mapping
 */
export function validateColumnMapping(
  mapping: Record<string, string | null>,
  headers: string[]
): { valid: boolean; errors: string[]; suggestions: string[] } {
  const errors: string[] = [];
  const suggestions: string[] = [];

  // Check for required columns
  const requiredColumns = ['itemCode', 'description', 'quantity', 'unitPrice'];
  for (const col of requiredColumns) {
    if (!mapping[col]) {
      errors.push(`Missing required column: ${col}`);
    }
  }

  // Check for unmapped headers
  const mappedHeaders = Object.values(mapping).filter((v) => v !== null);
  const unmappedHeaders = headers.filter((h) => !mappedHeaders.includes(h));
  if (unmappedHeaders.length > 0) {
    suggestions.push(`Unused columns: ${unmappedHeaders.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    suggestions,
  };
}
