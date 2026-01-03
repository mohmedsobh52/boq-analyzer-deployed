/**
 * Detect language and text direction from content
 */

export type Language = 'ar' | 'en' | 'unknown';
export type TextDirection = 'rtl' | 'ltr';

// Arabic Unicode ranges
const ARABIC_RANGES = [
  [0x0600, 0x06ff], // Arabic
  [0x0750, 0x077f], // Arabic Supplement
  [0x08a0, 0x08ff], // Arabic Extended-A
  [0xfb50, 0xfdff], // Arabic Presentation Forms-A
  [0xfe70, 0xfeff], // Arabic Presentation Forms-B
];

// English/Latin ranges
const LATIN_RANGES = [
  [0x0041, 0x005a], // A-Z
  [0x0061, 0x007a], // a-z
  [0x00c0, 0x00ff], // Latin Extended
];

/**
 * Check if character is Arabic
 */
function isArabicChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return ARABIC_RANGES.some(([start, end]) => code >= start && code <= end);
}

/**
 * Check if character is Latin/English
 */
function isLatinChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return LATIN_RANGES.some(([start, end]) => code >= start && code <= end);
}

/**
 * Detect language from text content
 */
export function detectLanguage(text: string): Language {
  if (!text || text.trim().length === 0) {
    return 'unknown';
  }

  let arabicCount = 0;
  let latinCount = 0;

  // Count characters by language
  for (const char of text) {
    if (isArabicChar(char)) {
      arabicCount++;
    } else if (isLatinChar(char)) {
      latinCount++;
    }
  }

  // Determine language based on character count
  const total = arabicCount + latinCount;
  if (total === 0) {
    return 'unknown';
  }

  const arabicPercentage = (arabicCount / total) * 100;
  const latinPercentage = (latinCount / total) * 100;

  // If more than 70% of characters are Arabic, consider it Arabic
  if (arabicPercentage > 70) {
    return 'ar';
  }

  // If more than 70% of characters are Latin, consider it English
  if (latinPercentage > 70) {
    return 'en';
  }

  // If mixed, prefer the dominant language
  if (arabicCount > latinCount) {
    return 'ar';
  } else if (latinCount > arabicCount) {
    return 'en';
  }

  return 'unknown';
}

/**
 * Get text direction based on language
 */
export function getTextDirection(language: Language): TextDirection {
  return language === 'ar' ? 'rtl' : 'ltr';
}

/**
 * Detect language and direction from content
 */
export function detectLanguageAndDirection(
  text: string
): { language: Language; direction: TextDirection } {
  const language = detectLanguage(text);
  const direction = getTextDirection(language);
  return { language, direction };
}

/**
 * Check if text contains mixed languages
 */
export function hasMixedLanguages(text: string): boolean {
  let hasArabic = false;
  let hasLatin = false;

  for (const char of text) {
    if (isArabicChar(char)) {
      hasArabic = true;
    } else if (isLatinChar(char)) {
      hasLatin = true;
    }

    if (hasArabic && hasLatin) {
      return true;
    }
  }

  return false;
}

/**
 * Detect encoding from byte array (basic detection)
 */
export function detectEncoding(bytes: Uint8Array): string {
  // Check for BOM (Byte Order Mark)
  if (bytes.length >= 3) {
    // UTF-8 BOM
    if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
      return 'UTF-8';
    }
  }

  if (bytes.length >= 2) {
    // UTF-16 LE BOM
    if (bytes[0] === 0xff && bytes[1] === 0xfe) {
      return 'UTF-16 LE';
    }
    // UTF-16 BE BOM
    if (bytes[0] === 0xfe && bytes[1] === 0xff) {
      return 'UTF-16 BE';
    }
  }

  // Default to UTF-8 (most common)
  return 'UTF-8';
}

/**
 * Normalize text for display (handle RTL/LTR marks)
 */
export function normalizeText(text: string, language: Language): string {
  if (!text) return '';

  let normalized = text;

  // Remove excessive whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // Add RTL/LTR marks for proper display
  if (language === 'ar') {
    // Add RTL mark at the beginning
    normalized = '\u202b' + normalized + '\u202c';
  } else if (language === 'en') {
    // Add LTR mark at the beginning
    normalized = '\u202a' + normalized + '\u202c';
  }

  return normalized;
}

/**
 * Split text into paragraphs while preserving language
 */
export function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}
