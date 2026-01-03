/**
 * PDF Data Mapper
 * 
 * Intelligently maps extracted PDF data to BOQ item structure
 * Handles various column naming conventions, Arabic numbers, and flexible validation
 */

export interface BOQItem {
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  notes?: string;
}

/**
 * Normalize column names to standard format
 */
function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w_]/g, '');
}

/**
 * Convert Arabic-Indic and Eastern Arabic digits to Western digits
 */
function normalizeArabicNumbers(str: string): string {
  if (typeof str !== 'string') return str;
  
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
 * Parse numeric value safely with Arabic number support
 */
function parseNumberSafe(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Normalize Arabic digits first
    let normalized = normalizeArabicNumbers(value);
    
    // Remove thousand separators (comma and Arabic comma)
    normalized = normalized.replace(/,/g, '').replace(/٬/g, '');
    
    // Convert Arabic decimal to dot
    normalized = normalized.replace(/٫/g, '.');
    
    // Strip non-numeric chars except dot and minus
    normalized = normalized.replace(/[^\d.\-]/g, '');
    
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Check if a value looks like a PR SERVICE CODE (7-digit starting with 9)
 */
function isPRServiceCode(value: any): boolean {
  if (typeof value !== 'string') return false;
  return /^9\d{6}$/.test(value.trim());
}

/**
 * Find matching column for a specific field
 */
function findColumn(
  row: Record<string, any>,
  patterns: string[]
): string | undefined {
  const normalizedRow = Object.keys(row).reduce(
    (acc, key) => {
      acc[normalizeColumnName(key)] = row[key];
      return acc;
    },
    {} as Record<string, any>
  );

  for (const pattern of patterns) {
    const normalized = normalizeColumnName(pattern);
    if (normalized in normalizedRow) {
      return normalized;
    }
  }

  return undefined;
}

/**
 * Map extracted PDF data to BOQ items with flexible validation
 */
export function mapPDFDataToItems(
  data: Record<string, any>[],
  columnMapping?: Record<string, string>
): BOQItem[] {
  if (!data || data.length === 0) {
    return [];
  }

  const items: BOQItem[] = [];
  let itemCounter = 1;

  for (const row of data) {
    // Skip empty rows
    if (!row || Object.keys(row).length === 0) {
      continue;
    }

    try {
      // Find columns using patterns
      const itemCodeCol =
        columnMapping?.itemCode ||
        findColumn(row, [
          'item code',
          'code',
          'item_code',
          'item#',
          'no',
          'number',
          'id',
        ]);

      const descriptionCol =
        columnMapping?.description ||
        findColumn(row, [
          'description',
          'desc',
          'name',
          'item name',
          'item_name',
          'title',
          'وصف',
          'بند',
        ]);

      const unitCol =
        columnMapping?.unit ||
        findColumn(row, [
          'unit',
          'uom',
          'unit of measure',
          'unit_of_measure',
          'measure',
          'unit_type',
          'وحدة',
        ]);

      const quantityCol =
        columnMapping?.quantity ||
        findColumn(row, [
          'quantity',
          'qty',
          'amount',
          'count',
          'quantity_required',
          'qty_required',
          'كمية',
        ]);

      const unitPriceCol =
        columnMapping?.unitPrice ||
        findColumn(row, [
          'unit price',
          'unitprice',
          'unit_price',
          'price',
          'rate',
          'unit rate',
          'unit_rate',
          'سعر الوحدة',
        ]);

      const totalPriceCol =
        columnMapping?.totalPrice ||
        findColumn(row, [
          'total price',
          'totalprice',
          'total_price',
          'total',
          'amount',
          'total amount',
          'total_amount',
          'الإجمالي',
        ]);

      // Extract and normalize values
      let itemCode = String(row[itemCodeCol || ''] || '').trim();
      const description = String(row[descriptionCol || ''] || '').trim();
      let unit = String(row[unitCol || ''] || '').trim();
      
      // Parse numeric values with safe number parsing
      const quantity = parseNumberSafe(row[quantityCol || '']);
      const unitPrice = parseNumberSafe(row[unitPriceCol || '']);
      const totalPrice = parseNumberSafe(row[totalPriceCol || '']) || quantity * unitPrice;

      // Auto-generate itemCode if missing
      if (!itemCode) {
        itemCode = `PDF-${String(itemCounter).padStart(3, '0')}`;
      }
      itemCounter++;

      // Default unit if missing
      if (!unit) {
        unit = 'LOT';
      }

      // Skip rows with no meaningful data
      if (quantity === 0 && !description) {
        continue;
      }

      // Check for PR SERVICE CODE in any field and store in notes
      let notes = '';
      for (const key in row) {
        const value = String(row[key] || '');
        if (isPRServiceCode(value)) {
          notes = `Service Code: ${value}`;
          break;
        }
      }

      items.push({
        itemCode,
        description: description || `Item ${itemCode}`,
        unit,
        quantity,
        unitPrice,
        totalPrice,
        category: 'Imported',
        notes: notes || undefined,
      });
    } catch (error) {
      console.warn('Failed to map row:', row, error);
      continue;
    }
  }

  return items;
}

/**
 * Detect column mapping from data
 */
export function detectColumnMapping(
  data: Record<string, any>[]
): Record<string, string> | null {
  if (!data || data.length === 0) {
    return null;
  }

  const firstRow = data[0];
  const columns = Object.keys(firstRow);

  const mapping: Record<string, string> = {};

  for (const col of columns) {
    const normalized = normalizeColumnName(col);

    if (
      ['item_code', 'code', 'item', 'no', 'number', 'id'].includes(normalized)
    ) {
      mapping.itemCode = col;
    } else if (
      ['description', 'desc', 'name', 'item_name', 'title', 'وصف', 'بند'].includes(normalized)
    ) {
      mapping.description = col;
    } else if (
      ['unit', 'uom', 'unit_of_measure', 'measure', 'وحدة'].includes(normalized)
    ) {
      mapping.unit = col;
    } else if (
      ['quantity', 'qty', 'amount', 'count', 'كمية'].includes(normalized)
    ) {
      mapping.quantity = col;
    } else if (
      ['unit_price', 'unitprice', 'price', 'rate', 'unit_rate', 'سعر_الوحدة'].includes(
        normalized
      )
    ) {
      mapping.unitPrice = col;
    } else if (
      ['total_price', 'totalprice', 'total', 'total_amount', 'الإجمالي'].includes(
        normalized
      )
    ) {
      mapping.totalPrice = col;
    }
  }

  return Object.keys(mapping).length > 0 ? mapping : null;
}

/**
 * Validate mapped items with flexible rules
 * 
 * Valid item rules:
 * - description is required (non-empty)
 * - quantity > 0 is required
 * - unitPrice can be 0 (allowed)
 * - totalPrice can be 0 (allowed)
 * - itemCode can be missing (auto-generated)
 */
export function validateItems(items: BOQItem[]): {
  valid: BOQItem[];
  invalid: Array<{ item: BOQItem; errors: string[] }>;
} {
  const valid: BOQItem[] = [];
  const invalid: Array<{ item: BOQItem; errors: string[] }> = [];

  for (const item of items) {
    const errors: string[] = [];

    // REQUIRED: description must exist
    if (!item.description || item.description.trim() === '' || item.description === 'No description') {
      errors.push('Missing description');
    }

    // REQUIRED: quantity must be > 0
    if (item.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }

    // ALLOWED: unitPrice can be 0 (no error)
    if (item.unitPrice < 0) {
      errors.push('Unit price cannot be negative');
    }

    // ALLOWED: totalPrice can be 0 (no error)
    if (item.totalPrice < 0) {
      errors.push('Total price cannot be negative');
    }

    if (errors.length > 0) {
      invalid.push({ item, errors });
    } else {
      valid.push(item);
    }
  }

  return { valid, invalid };
}

/**
 * Get summary statistics for items
 */
export function getItemsSummary(items: BOQItem[]) {
  return {
    totalItems: items.length,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    totalCost: items.reduce((sum, item) => sum + item.totalPrice, 0),
    averageUnitPrice:
      items.length > 0
        ? items.reduce((sum, item) => sum + item.unitPrice, 0) / items.length
        : 0,
    categories: Array.from(new Set(items.map(item => item.category || 'Unknown'))).filter((c): c is string => !!c),
  };
}


/**
 * Remove duplicate items based on item code and description
 */
export function deduplicateItems(items: BOQItem[]): BOQItem[] {
  const seen = new Map<string, BOQItem>();

  for (const item of items) {
    const key = `${item.itemCode}|${item.description.substring(0, 30)}`;
    if (!seen.has(key)) {
      seen.set(key, item);
    }
  }

  return Array.from(seen.values());
}

/**
 * Sort items by item code (numeric or alphabetic)
 */
export function sortItems(items: BOQItem[]): BOQItem[] {
  return [...items].sort((a, b) => {
    const aNum = parseInt(a.itemCode);
    const bNum = parseInt(b.itemCode);

    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }

    return a.itemCode.localeCompare(b.itemCode);
  });
}

/**
 * Filter items by category
 */
export function filterByCategory(items: BOQItem[], category: string): BOQItem[] {
  return items.filter(item => item.category === category);
}

/**
 * Filter items by price range
 */
export function filterByPriceRange(
  items: BOQItem[],
  minPrice: number,
  maxPrice: number
): BOQItem[] {
  return items.filter(item => item.unitPrice >= minPrice && item.unitPrice <= maxPrice);
}

/**
 * Calculate advanced statistics for items
 */
export function calculateStatistics(items: BOQItem[]) {
  if (items.length === 0) {
    return {
      minPrice: 0,
      maxPrice: 0,
      avgPrice: 0,
      medianPrice: 0,
      minQty: 0,
      maxQty: 0,
      avgQty: 0,
      stdDevPrice: 0,
      stdDevQty: 0,
    };
  }

  const prices = items.map(i => i.unitPrice).sort((a, b) => a - b);
  const quantities = items.map(i => i.quantity).sort((a, b) => a - b);

  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const avgQty = quantities.reduce((a, b) => a + b, 0) / quantities.length;

  const stdDevPrice = Math.sqrt(
    prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length
  );
  const stdDevQty = Math.sqrt(
    quantities.reduce((sum, q) => sum + Math.pow(q - avgQty, 2), 0) / quantities.length
  );

  const medianPrice = prices[Math.floor(prices.length / 2)];
  const medianQty = quantities[Math.floor(quantities.length / 2)];

  return {
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    avgPrice,
    medianPrice,
    minQty: Math.min(...quantities),
    maxQty: Math.max(...quantities),
    avgQty,
    stdDevPrice,
    stdDevQty,
  };
}

/**
 * Identify outlier items
 */
export function identifyOutliers(items: BOQItem[], stdDevThreshold: number = 2) {
  const stats = calculateStatistics(items);
  const outliers: Array<{ item: BOQItem; type: string; deviation: number }> = [];

  for (const item of items) {
    if (stats.stdDevPrice > 0) {
      const priceDeviation = Math.abs(item.unitPrice - stats.avgPrice) / stats.stdDevPrice;
      if (priceDeviation > stdDevThreshold) {
        outliers.push({ item, type: 'price', deviation: priceDeviation });
      }
    }

    if (stats.stdDevQty > 0) {
      const qtyDeviation = Math.abs(item.quantity - stats.avgQty) / stats.stdDevQty;
      if (qtyDeviation > stdDevThreshold) {
        outliers.push({ item, type: 'quantity', deviation: qtyDeviation });
      }
    }
  }

  return outliers;
}

/**
 * Group items by category
 */
export function groupByCategory(items: BOQItem[]): Record<string, BOQItem[]> {
  const groups: Record<string, BOQItem[]> = {};

  for (const item of items) {
    const category = item.category || 'Uncategorized';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
  }

  return groups;
}

/**
 * Calculate cost distribution by category
 */
export function getCostDistribution(items: BOQItem[]) {
  const groups = groupByCategory(items);
  const distribution: Record<string, { count: number; totalCost: number; percentage: number }> = {};
  const totalCost = items.reduce((sum, item) => sum + item.totalPrice, 0);

  for (const [category, categoryItems] of Object.entries(groups)) {
    const categoryTotal = categoryItems.reduce((sum, item) => sum + item.totalPrice, 0);
    distribution[category] = {
      count: categoryItems.length,
      totalCost: categoryTotal,
      percentage: totalCost > 0 ? (categoryTotal / totalCost) * 100 : 0,
    };
  }

  return distribution;
}
