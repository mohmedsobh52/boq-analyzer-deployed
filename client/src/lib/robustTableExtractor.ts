/**
 * Robust Table Extractor for Complex BOQ PDFs
 * 
 * Handles Arabic/English mixed content, complex layouts, and hierarchical structures
 * Uses text content analysis instead of layout to ensure reliability
 * Optimized for multi-page BOQ documents with service codes
 */

import * as pdfjsLib from 'pdfjs-dist';

export interface BOQItem {
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
}

/**
 * Extract all text from PDF with position information
 */
export async function extractTextWithPositions(pdf: any): Promise<Array<{ text: string; page: number; x: number; y: number }>> {
  const allText: Array<{ text: string; page: number; x: number; y: number }> = [];

  for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 20); pageNum++) {
    try {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      textContent.items.forEach((item: any) => {
        if (item.str && item.str.trim()) {
          allText.push({
            text: item.str.trim(),
            page: pageNum,
            x: item.x,
            y: item.y,
          });
        }
      });
    } catch (error) {
      console.warn(`Failed to extract text from page ${pageNum}:`, error);
    }
  }

  return allText;
}

/**
 * Parse BOQ items from extracted text using pattern matching
 */
export function parseBOQItems(textItems: Array<{ text: string; page: number; x: number; y: number }>): BOQItem[] {
  const items: BOQItem[] = [];
  const lines = textItems.map(t => t.text);
  const fullText = lines.join('\n');

  // Patterns to match BOQ items
  // Pattern: Item Code | Description | Unit | Quantity | [Price] | [Total]
  
  // Split by common delimiters
  const rows = fullText.split(/\n|Item\s+Description|Unit\s+Quantity/i);

  for (const row of rows) {
    if (!row.trim() || row.length < 10) continue;

    // Try to extract item information
    const item = parseRowToItem(row);
    if (item && (item.quantity > 0 || item.description.length > 5)) {
      items.push(item);
    }
  }

  return items;
}

/**
 * Parse a single row to extract item data
 */
function parseRowToItem(row: string): BOQItem | null {
  try {
    // Remove extra whitespace
    const cleanRow = row.replace(/\s+/g, ' ').trim();

    // Extract numbers (quantity, prices)
    const numbers = cleanRow.match(/[\d,]+\.?\d*/g) || [];
    const cleanNumbers = numbers.map(n => parseFloat(n.replace(/,/g, '')));

    // Extract text parts
    const textParts = cleanRow.split(/[\d,]+\.?\d*/g).filter(p => p.trim().length > 0);

    if (textParts.length < 2 || cleanNumbers.length < 1) {
      return null;
    }

    // Try to identify item code (usually first part)
    const itemCode = textParts[0]?.trim().substring(0, 20) || 'UNKNOWN';

    // Description is usually the longest text part
    const description = textParts.slice(1).join(' ').trim().substring(0, 200);

    // Unit detection
    let unit = 'EA';
    const unitPatterns = ['m2', 'm³', 'l.m', 'nr', 'kg', 'ton', 'day', 'hour'];
    for (const pattern of unitPatterns) {
      if (description.toLowerCase().includes(pattern)) {
        unit = pattern.toUpperCase();
        break;
      }
    }

    // Quantity is usually the first number
    const quantity = cleanNumbers[0] || 0;
    const unitPrice = cleanNumbers[1] || 0;
    const totalPrice = cleanNumbers[2] || quantity * unitPrice;

    // Skip invalid items
    if (quantity === 0 && unitPrice === 0 && totalPrice === 0) {
      return null;
    }

    return {
      itemCode,
      description,
      unit,
      quantity,
      unitPrice,
      totalPrice,
    };
  } catch (error) {
    console.warn('Failed to parse row:', error);
    return null;
  }
}

/**
 * Extract BOQ items using regex patterns specifically for BOQ format
 * Optimized for Arabic/English mixed content and service codes
 */
export function extractBOQItemsWithPatterns(text: string): BOQItem[] {
  const items: BOQItem[] = [];

  // Split text into potential item rows
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and headers
    if (!line || line.toLowerCase().includes('item') || line.toLowerCase().includes('description')) {
      continue;
    }

    // Try multiple patterns - optimized for service codes and Arabic text
    const patterns = [
      // Pattern 1: Service Code (7 digits) | Description | Unit | Qty | Price | Total
      /^(\d{7})\s+(.+?)\s+(m2|m³|L\.M|NR|EA|KG|TON|DAY|HOUR|m|لتر|كيس|طن|ساعة|يوم)\s+([\d,\.]+)\s+([\d,\.]+)?\s+([\d,\.]+)?/i,
      // Pattern 2: Code | Description | Unit | Qty
      /^([A-Z0-9\-\.]+)\s+(.+?)\s+(m2|m³|L\.M|NR|EA|KG|TON|DAY|HOUR|m|لتر|كيس|طن|ساعة|يوم)\s+([\d,\.]+)/i,
      // Pattern 3: Code Description Unit Qty (with Arabic units)
      /^([A-Z0-9\-\.]+)\s+(.+?)\s+(م2|م³|م|لتر|كيس|طن|ساعة|يوم|EA|NR)\s+([\d,\.]+)/i,
      // Pattern 4: Just code and description with numbers
      /^([A-Z0-9\-\.]+)\s+(.+?)\s+([\d,\.]+)\s+([\d,\.]+)?\s+([\d,\.]+)?/,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        try {
          const itemCode = String(match[1]).trim();
          const description = String(match[2]).trim();
          const unit = String(match[3] || 'EA').trim().toUpperCase();
          const quantity = parseFloat(String(match[4] || '0').replace(/,/g, ''));
          const unitPrice = parseFloat(String(match[5] || '0').replace(/,/g, ''));
          const totalPrice = parseFloat(String(match[6] || quantity * unitPrice).replace(/,/g, ''));

          if (quantity > 0 || unitPrice > 0 || description.length > 5) {
            items.push({
              itemCode: itemCode || 'UNKNOWN',
              description,
              unit,
              quantity: isNaN(quantity) ? 0 : quantity,
              unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
              totalPrice: isNaN(totalPrice) ? 0 : totalPrice,
            });
          }
        } catch (error) {
          console.warn('Failed to parse pattern match:', error);
        }
        break; // Move to next line if pattern matched
      }
    }
  }

  return items;
}

/**
 * Extract items by analyzing text structure and grouping related lines
 * Better for complex multi-line descriptions
 */
export function extractBOQItemsAdvanced(text: string): BOQItem[] {
  const items: BOQItem[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  let currentItem: Partial<BOQItem> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip headers and metadata
    if (line.toLowerCase().includes('item') || 
        line.toLowerCase().includes('description') ||
        line.toLowerCase().includes('unit') ||
        line.toLowerCase().includes('quantity') ||
        line.toLowerCase().includes('price') ||
        line.toLowerCase().includes('project') ||
        line.toLowerCase().includes('division')) {
      continue;
    }

    // Check if line starts with a service code (7 digits) or item code
    const codeMatch = line.match(/^(\d{7}|[A-Z0-9\-\.]+)\s+/);
    
    if (codeMatch) {
      // Save previous item if exists
      if (currentItem && currentItem.description && currentItem.description.length > 3) {
        items.push({
          itemCode: currentItem.itemCode || 'UNKNOWN',
          description: currentItem.description,
          unit: currentItem.unit || 'EA',
          quantity: currentItem.quantity || 0,
          unitPrice: currentItem.unitPrice || 0,
          totalPrice: currentItem.totalPrice || 0,
        });
      }

      // Start new item
      const itemCode = codeMatch[1];
      const restOfLine = line.substring(codeMatch[0].length);
      
      // Extract numbers from the rest of the line
      const numbers = restOfLine.match(/[\d,\.]+/g) || [];
      const cleanNumbers = numbers.map(n => parseFloat(n.replace(/,/g, '')));

      // Extract unit (look for common units)
      let unit = 'EA';
      const unitMatch = restOfLine.match(/(m2|m³|L\.M|NR|EA|KG|TON|DAY|HOUR|م2|م³|م|لتر|كيس|طن|ساعة|يوم)/i);
      if (unitMatch) {
        unit = unitMatch[1];
      }

      // Extract description (text without numbers)
      let description = restOfLine.replace(/[\d,\.]+/g, '').trim();
      
      // Remove unit from description
      if (unitMatch) {
        description = description.replace(unitMatch[1], '').trim();
      }

      currentItem = {
        itemCode,
        description,
        unit,
        quantity: cleanNumbers[0] || 0,
        unitPrice: cleanNumbers[1] || 0,
        totalPrice: cleanNumbers[2] || (cleanNumbers[0] || 0) * (cleanNumbers[1] || 0),
      };
    } else if (currentItem) {
      // Append to current item's description if it's a continuation
      if (line.length > 5 && !line.match(/^[\d,\.]+/)) {
        currentItem.description = (currentItem.description || '') + ' ' + line;
      }
    }
  }

  // Add last item
  if (currentItem && currentItem.description && currentItem.description.length > 3) {
    items.push({
      itemCode: currentItem.itemCode || 'UNKNOWN',
      description: currentItem.description,
      unit: currentItem.unit || 'EA',
      quantity: currentItem.quantity || 0,
      unitPrice: currentItem.unitPrice || 0,
      totalPrice: currentItem.totalPrice || 0,
    });
  }

  return items;
}

/**
 * Main extraction function - tries multiple strategies
 * Optimized for multi-page BOQ documents
 */
export async function extractBOQFromPDFRobust(pdf: any): Promise<BOQItem[]> {
  try {
    let allItems: BOQItem[] = [];

    // Strategy 1: Extract full text from all pages and use advanced parsing
    console.log('Attempting Strategy 1: Advanced text analysis...');
    let fullText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
      } catch (error) {
        console.warn(`Failed to extract from page ${pageNum}:`, error);
      }
    }

    if (fullText.length > 0) {
      const items1 = extractBOQItemsAdvanced(fullText);
      if (items1.length > 0) {
        console.log(`Strategy 1 found ${items1.length} items`);
        allItems = items1;
      }
    }

    // Strategy 2: Use regex patterns if advanced parsing didn't work well
    if (allItems.length < 10) {
      console.log('Attempting Strategy 2: Pattern matching...');
      const items2 = extractBOQItemsWithPatterns(fullText);
      if (items2.length > allItems.length) {
        console.log(`Strategy 2 found ${items2.length} items`);
        allItems = items2;
      }
    }

    // Strategy 3: Extract text with positions for layout analysis
    if (allItems.length < 10) {
      console.log('Attempting Strategy 3: Position-based analysis...');
      const textItems = await extractTextWithPositions(pdf);
      if (textItems.length > 0) {
        const items3 = parseBOQItems(textItems);
        if (items3.length > allItems.length) {
          console.log(`Strategy 3 found ${items3.length} items`);
          allItems = items3;
        }
      }
    }

    // Remove duplicates and invalid items
    // Use a combination of itemCode and first 20 chars of description as key
    const uniqueItems = Array.from(
      new Map(allItems.map(item => [
        item.itemCode + '|' + item.description.substring(0, 20),
        item
      ])).values()
    ).filter(item => 
      item.description && 
      item.description.length > 2 && 
      item.itemCode !== 'UNKNOWN' &&
      item.quantity > 0 // Only include items with quantity
    ).sort((a, b) => a.itemCode.localeCompare(b.itemCode)); // Sort by item code

    console.log(`Total unique items extracted: ${uniqueItems.length}`);
    return uniqueItems;
  } catch (error) {
    console.error('Error in robust extraction:', error);
    return [];
  }
}
