/**
 * Incremental PDF Extractor
 * 
 * Extracts PDF text page-by-page with caching and progress tracking
 * Allows stopping extraction at any time
 * Optimized for large PDFs
 */

import { ensureWorkerReady, pdfjsLib } from './pdfjs';
import { metricsCollector } from './workerMetrics';

export interface ExtractionProgress {
  currentPage: number;
  totalPages: number;
  progress: number; // 0-100
  extractedText: string;
  isComplete: boolean;
  error?: string;
}

export interface ExtractionOptions {
  maxPages?: number; // Limit extraction to first N pages
  cacheResults?: boolean; // Cache extracted pages
  onProgress?: (progress: ExtractionProgress) => void;
  signal?: AbortSignal; // Support cancellation
}

/**
 * Cache for extracted pages
 */
class PageCache {
  private cache: Map<string, Map<number, string>> = new Map();

  set(fileId: string, pageNumber: number, text: string): void {
    if (!this.cache.has(fileId)) {
      this.cache.set(fileId, new Map());
    }
    this.cache.get(fileId)!.set(pageNumber, text);
  }

  get(fileId: string, pageNumber: number): string | undefined {
    return this.cache.get(fileId)?.get(pageNumber);
  }

  has(fileId: string, pageNumber: number): boolean {
    return this.cache.get(fileId)?.has(pageNumber) ?? false;
  }

  clear(fileId: string): void {
    this.cache.delete(fileId);
  }

  clearAll(): void {
    this.cache.clear();
  }

  getSize(): number {
    let size = 0;
    this.cache.forEach(pages => {
      size += pages.size;
    });
    return size;
  }
}

const pageCache = new PageCache();

/**
 * Extract text from a single PDF page
 */
async function extractPageText(pdf: any, pageNumber: number): Promise<string> {
  try {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    return pageText;
  } catch (error) {
    console.warn(`Failed to extract text from page ${pageNumber}:`, error);
    return `[Page ${pageNumber} extraction failed]`;
  }
}

/**
 * Extract PDF text incrementally (page by page)
 * 
 * @param file - PDF file to extract from
 * @param options - Extraction options
 * @returns Promise resolving to complete extracted text
 */
export async function extractPDFIncremental(
  file: File,
  options: ExtractionOptions = {}
): Promise<string> {
  const {
    maxPages,
    cacheResults = true,
    onProgress,
    signal,
  } = options;

  // Generate file ID for caching
  const fileId = `${file.name}-${file.size}-${file.lastModified}`;

  try {
    // Ensure worker is initialized
    ensureWorkerReady();

    // Check if already cached
    if (cacheResults && pageCache.getSize() > 0) {
      let cachedText = '';
      let allCached = true;
      
      // Try to get from cache (we don't know page count yet)
      for (let i = 1; i <= 1000; i++) {
        if (pageCache.has(fileId, i)) {
          cachedText += pageCache.get(fileId, i) + '\n';
        } else {
          allCached = false;
          break;
        }
      }

      if (allCached && cachedText) {
        onProgress?.({
          currentPage: 1,
          totalPages: 1,
          progress: 100,
          extractedText: cachedText,
          isComplete: true,
        });
        return cachedText;
      }
    }

    // Start metrics tracking
    const startTime = performance.now();
    metricsCollector.startPDFTracking(fileId, file.name, file.size, maxPages || 0);

    const arrayBuffer = await file.arrayBuffer();
    if (!arrayBuffer) {
      throw new Error('Failed to read file');
    }

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const workerInitTime = performance.now() - startTime;
    metricsCollector.recordWorkerInit(fileId, workerInitTime);

    const totalPages = Math.min(pdf.numPages, maxPages || pdf.numPages);
    let fullText = '';
    let successCount = 0;

    // Extract pages incrementally
    for (let i = 1; i <= totalPages; i++) {
      // Check for cancellation
      if (signal?.aborted) {
        console.log('PDF extraction cancelled');
        metricsCollector.completePDFTracking(fileId, false, 'Cancelled by user');
        throw new Error('PDF extraction cancelled');
      }

      const pageStartTime = performance.now();

      try {
        // Try to get from cache first
        let pageText: string;
        if (cacheResults && pageCache.has(fileId, i)) {
          pageText = pageCache.get(fileId, i)!;
        } else {
          pageText = await extractPageText(pdf, i);
          if (cacheResults) {
            pageCache.set(fileId, i, pageText);
          }
        }

        const extractionTime = performance.now() - pageStartTime;
        metricsCollector.recordPageExtraction(
          fileId,
          i,
          extractionTime,
          pageText.length,
          true,
          undefined,
          (performance as any).memory?.usedJSHeapSize
        );

        fullText += pageText + '\n';
        successCount++;

        // Report progress
        const progress = Math.round((i / totalPages) * 100);
        onProgress?.({
          currentPage: i,
          totalPages,
          progress,
          extractedText: fullText,
          isComplete: false,
        });
      } catch (pageError) {
        console.warn(`Failed to extract page ${i}:`, pageError);
        const extractionTime = performance.now() - pageStartTime;
        metricsCollector.recordPageExtraction(
          fileId,
          i,
          extractionTime,
          0,
          false,
          pageError instanceof Error ? pageError.message : 'Unknown error'
        );

        fullText += `[Page ${i} extraction failed]\n`;

        // Still report progress
        const progress = Math.round((i / totalPages) * 100);
        onProgress?.({
          currentPage: i,
          totalPages,
          progress,
          extractedText: fullText,
          isComplete: false,
        });
      }
    }

    // Complete metrics tracking
    metricsCollector.completePDFTracking(fileId, successCount > 0);

    // Final progress report
    onProgress?.({
      currentPage: totalPages,
      totalPages,
      progress: 100,
      extractedText: fullText,
      isComplete: true,
    });

    return fullText;
  } catch (error) {
    console.error('Failed to extract PDF incrementally:', error);
    metricsCollector.completePDFTracking(
      fileId,
      false,
      error instanceof Error ? error.message : 'Unknown error'
    );
    throw new Error(
      `PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Extract specific pages from a PDF
 */
export async function extractPDFPages(
  file: File,
  pageNumbers: number[],
  options: ExtractionOptions = {}
): Promise<Map<number, string>> {
  const { signal } = options;
  const fileId = `${file.name}-${file.size}-${file.lastModified}`;

  try {
    ensureWorkerReady();

    const arrayBuffer = await file.arrayBuffer();
    if (!arrayBuffer) {
      throw new Error('Failed to read file');
    }

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const results = new Map<number, string>();

    for (const pageNumber of pageNumbers) {
      if (signal?.aborted) {
        throw new Error('Extraction cancelled');
      }

      if (pageNumber < 1 || pageNumber > pdf.numPages) {
        console.warn(`Page ${pageNumber} is out of range`);
        continue;
      }

      try {
        const pageText = await extractPageText(pdf, pageNumber);
        results.set(pageNumber, pageText);
      } catch (error) {
        console.warn(`Failed to extract page ${pageNumber}:`, error);
        results.set(pageNumber, `[Page ${pageNumber} extraction failed]`);
      }
    }

    return results;
  } catch (error) {
    console.error('Failed to extract specific pages:', error);
    throw new Error(
      `Page extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Clear cache for a specific file
 */
export function clearCache(fileId?: string): void {
  if (fileId) {
    pageCache.clear(fileId);
  } else {
    pageCache.clearAll();
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  cachedPages: number;
  estimatedSize: string;
} {
  const size = pageCache.getSize();
  const sizeInMB = (size / 1024 / 1024).toFixed(2);

  return {
    cachedPages: size,
    estimatedSize: `${sizeInMB}MB`,
  };
}
