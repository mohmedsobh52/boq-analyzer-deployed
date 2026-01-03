/**
 * PDF.js Worker Configuration Module
 * 
 * Handles PDF.js worker initialization with Vite ESM support.
 * Uses ?url import to get the worker file as a URL string.
 * 
 * Only runs in browser environment (guards against SSR/Node.js).
 */

import * as pdfjsLib from 'pdfjs-dist';

// Import worker as URL using Vite's ?url query parameter
// This tells Vite to treat the file as an asset and return its URL
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

/**
 * Flag to track if worker has been initialized
 */
let workerInitialized = false;

/**
 * Initialize PDF.js worker with the self-hosted ESM worker file
 * 
 * This function:
 * 1. Checks if we're in a browser environment (not SSR/Node.js)
 * 2. Sets the worker URL to the locally bundled ESM worker
 * 3. Prevents multiple initialization attempts
 * 
 * @throws Error if called in non-browser environment or if initialization fails
 */
export function initializePDFWorker(): void {
  // Guard: Only run in browser environment
  if (typeof window === 'undefined') {
    console.warn('PDF.js worker initialization skipped: not in browser environment');
    return;
  }

  // Guard: Prevent duplicate initialization
  if (workerInitialized) {
    return;
  }

  try {
    // Set the worker source to the locally bundled ESM worker
    // Vite's ?url import resolves to the absolute URL of the worker file
    // Example: /assets/pdf.worker.min-abc123.mjs
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    
    console.log('✓ PDF.js worker initialized successfully');
    console.log(`  Worker URL: ${workerUrl}`);
    
    workerInitialized = true;
  } catch (error) {
    console.error('✗ Failed to initialize PDF.js worker:', error);
    throw new Error(
      `PDF.js worker initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Ensure PDF worker is ready before PDF operations
 * 
 * Call this before any PDF extraction or manipulation.
 * Safe to call multiple times (idempotent).
 */
export function ensureWorkerReady(): void {
  if (!workerInitialized) {
    initializePDFWorker();
  }
}

/**
 * Get the current worker URL (useful for debugging)
 * 
 * @returns The URL of the PDF.js worker, or undefined if not initialized
 */
export function getWorkerUrl(): string | undefined {
  return pdfjsLib.GlobalWorkerOptions.workerSrc as string | undefined;
}

/**
 * Export pdfjsLib for use in other modules
 * Ensures all modules use the same initialized instance
 */
export { pdfjsLib };
