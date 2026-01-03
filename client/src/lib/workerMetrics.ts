/**
 * Worker Performance Metrics Module
 * 
 * Tracks and monitors PDF.js worker performance including:
 * - Worker initialization time
 * - PDF extraction speed per page
 * - Memory usage
 * - Error rates
 */

export interface PageMetrics {
  pageNumber: number;
  extractionTime: number; // milliseconds
  textLength: number; // characters
  extractionSpeed: number; // chars per second
  memoryUsed?: number; // bytes
  success: boolean;
  error?: string;
}

export interface PDFMetrics {
  fileId: string;
  fileName: string;
  fileSize: number; // bytes
  totalPages: number;
  extractedPages: number;
  startTime: number;
  endTime?: number;
  totalTime?: number; // milliseconds
  averageTimePerPage?: number;
  totalTextLength: number;
  averageSpeed?: number; // chars per second
  pages: PageMetrics[];
  workerInitTime?: number;
  peakMemory?: number;
  avgMemory?: number;
  success: boolean;
  error?: string;
}

export interface WorkerPoolMetrics {
  activeWorkers: number;
  totalWorkers: number;
  queuedTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageTaskTime: number;
  totalMemory: number;
  timestamp: number;
}

/**
 * Metrics collector class
 */
export class MetricsCollector {
  private currentMetrics: Map<string, PDFMetrics> = new Map();
  private workerPoolMetrics: WorkerPoolMetrics | null = null;
  private listeners: Set<(metrics: PDFMetrics) => void> = new Set();

  /**
   * Start tracking a new PDF extraction
   */
  startPDFTracking(fileId: string, fileName: string, fileSize: number, totalPages: number): void {
    const metrics: PDFMetrics = {
      fileId,
      fileName,
      fileSize,
      totalPages,
      extractedPages: 0,
      startTime: performance.now(),
      totalTextLength: 0,
      pages: [],
      success: false,
    };

    this.currentMetrics.set(fileId, metrics);
  }

  /**
   * Record worker initialization time
   */
  recordWorkerInit(fileId: string, initTime: number): void {
    const metrics = this.currentMetrics.get(fileId);
    if (metrics) {
      metrics.workerInitTime = initTime;
    }
  }

  /**
   * Record page extraction metrics
   */
  recordPageExtraction(
    fileId: string,
    pageNumber: number,
    extractionTime: number,
    textLength: number,
    success: boolean = true,
    error?: string,
    memoryUsed?: number
  ): void {
    const metrics = this.currentMetrics.get(fileId);
    if (!metrics) return;

    const pageMetrics: PageMetrics = {
      pageNumber,
      extractionTime,
      textLength,
      extractionSpeed: textLength / (extractionTime / 1000),
      memoryUsed,
      success,
      error,
    };

    metrics.pages.push(pageMetrics);
    metrics.extractedPages++;
    metrics.totalTextLength += textLength;

    // Update peak memory
    if (memoryUsed) {
      if (!metrics.peakMemory || memoryUsed > metrics.peakMemory) {
        metrics.peakMemory = memoryUsed;
      }
    }

    // Notify listeners of progress
    this.notifyListeners(metrics);
  }

  /**
   * Complete PDF extraction tracking
   */
  completePDFTracking(fileId: string, success: boolean = true, error?: string): PDFMetrics | null {
    const metrics = this.currentMetrics.get(fileId);
    if (!metrics) return null;

    metrics.endTime = performance.now();
    metrics.totalTime = metrics.endTime - metrics.startTime;
    metrics.success = success;
    metrics.error = error;

    // Calculate averages
    if (metrics.extractedPages > 0) {
      metrics.averageTimePerPage = metrics.totalTime / metrics.extractedPages;
      metrics.averageSpeed = metrics.totalTextLength / (metrics.totalTime / 1000);

      // Calculate average memory
      const memoryValues = metrics.pages
        .filter(p => p.memoryUsed)
        .map(p => p.memoryUsed as number);
      if (memoryValues.length > 0) {
        metrics.avgMemory = memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length;
      }
    }

    return metrics;
  }

  /**
   * Get metrics for a specific PDF
   */
  getMetrics(fileId: string): PDFMetrics | undefined {
    return this.currentMetrics.get(fileId);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PDFMetrics[] {
    return Array.from(this.currentMetrics.values());
  }

  /**
   * Update worker pool metrics
   */
  updateWorkerPoolMetrics(metrics: WorkerPoolMetrics): void {
    this.workerPoolMetrics = metrics;
  }

  /**
   * Get worker pool metrics
   */
  getWorkerPoolMetrics(): WorkerPoolMetrics | null {
    return this.workerPoolMetrics;
  }

  /**
   * Subscribe to metrics updates
   */
  subscribe(listener: (metrics: PDFMetrics) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of metrics update
   */
  private notifyListeners(metrics: PDFMetrics): void {
    this.listeners.forEach(listener => listener(metrics));
  }

  /**
   * Clear old metrics (keep last 100)
   */
  cleanup(): void {
    if (this.currentMetrics.size > 100) {
      const entries = Array.from(this.currentMetrics.entries());
      const toDelete = entries.slice(0, entries.length - 100);
      toDelete.forEach(([key]) => this.currentMetrics.delete(key));
    }
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify(
      {
        pdfs: Array.from(this.currentMetrics.values()),
        workerPool: this.workerPoolMetrics,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalPDFs: number;
    successfulPDFs: number;
    failedPDFs: number;
    averageExtractionTime: number;
    averageSpeed: number;
    totalTextExtracted: number;
  } {
    const metrics = Array.from(this.currentMetrics.values());
    const successful = metrics.filter(m => m.success);
    const failed = metrics.filter(m => !m.success);

    const avgTime = successful.length > 0
      ? successful.reduce((sum, m) => sum + (m.totalTime || 0), 0) / successful.length
      : 0;

    const avgSpeed = successful.length > 0
      ? successful.reduce((sum, m) => sum + (m.averageSpeed || 0), 0) / successful.length
      : 0;

    const totalText = metrics.reduce((sum, m) => sum + m.totalTextLength, 0);

    return {
      totalPDFs: metrics.length,
      successfulPDFs: successful.length,
      failedPDFs: failed.length,
      averageExtractionTime: avgTime,
      averageSpeed: avgSpeed,
      totalTextExtracted: totalText,
    };
  }
}

/**
 * Global metrics collector instance
 */
export const metricsCollector = new MetricsCollector();
