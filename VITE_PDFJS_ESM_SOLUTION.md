# Vite + pdfjs-dist v5 ESM Worker Solution

## Problem
```
Setting up fake worker failed: Failed to fetch dynamically imported module:
https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.js
```

The issue: pdfjs-dist v5 requires the ESM worker (`pdf.worker.min.mjs`), not the CommonJS version. Using CDN is unreliable and introduces external dependencies.

---

## Solution: Vite `?url` Import

### Key Concepts

**Vite's `?url` Query Parameter:**
- Tells Vite to treat a file as an asset instead of a module
- Returns the **URL string** of the bundled file (e.g., `/assets/pdf.worker.min-abc123.mjs`)
- Perfect for Web Workers that need a URL, not a module import

**Why This Works:**
- ✅ Self-hosted: Worker bundled with your app
- ✅ No CDN dependency: Works offline, no CORS/CSP issues
- ✅ ESM compatible: Works with pdfjs-dist v5.x
- ✅ Type-safe: Full TypeScript support
- ✅ Browser-only: Guards against SSR/Node.js

---

## Implementation

### Step 1: Create Centralized PDF.js Module (`src/lib/pdfjs.ts`)

```typescript
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
```

---

### Step 2: Update PDF Extraction Module (`src/lib/pdfExtractor.ts`)

```typescript
/**
 * PDF Text Extraction Module
 * 
 * Uses the centralized PDF.js worker configuration from pdfjs.ts
 * Provides high-level functions for extracting text from PDF files
 */

import { ensureWorkerReady, pdfjsLib } from './pdfjs';

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
```

---

### Step 3: Update File Processor (`src/lib/performantFileProcessor.ts`)

```typescript
import { ensureWorkerReady, pdfjsLib } from './pdfjs';

/**
 * Optimized PDF text extraction with centralized worker initialization
 * 
 * Uses the pdfjs.ts module for worker setup, ensuring:
 * - Single initialization point
 * - Browser-only execution
 * - Proper error handling
 */
async function extractPDFTextOptimized(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Ensure worker is ready before attempting extraction
    try {
      ensureWorkerReady();
    } catch (error) {
      reject(new Error(`PDF worker initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = e.target?.result as ArrayBuffer;
        const pdf = await pdfjsLib.getDocument({ data }).promise;

        let fullText = '';
        const pageCount = Math.min(pdf.numPages, 10);

        for (let i = 1; i <= pageCount; i++) {
          try {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
          } catch (pageError) {
            console.warn(`Failed to extract text from page ${i}:`, pageError);
            fullText += `[Page ${i} extraction failed]\n`;
          }
        }

        resolve(fullText);
      } catch (err) {
        reject(new Error(`Failed to extract PDF text: ${err instanceof Error ? err.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}
```

---

## Vite Configuration (No Changes Required)

Vite handles `?url` imports automatically. Your existing `vite.config.ts` should work:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
    },
  },
  publicDir: 'client/public',
  build: {
    copyPublicDir: true,
  },
});
```

**No additional configuration needed!** Vite automatically:
- Bundles the worker file
- Generates a versioned URL (e.g., `/assets/pdf.worker.min-abc123.mjs`)
- Handles asset caching and optimization

---

## How It Works

### Import Resolution

```typescript
// This line:
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Vite resolves to something like:
// workerUrl = "/assets/pdf.worker.min-abc123.mjs"
```

### Worker Initialization

```typescript
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
// Sets worker to: "/assets/pdf.worker.min-abc123.mjs"
// Browser loads from same domain, no CORS issues
```

### Browser Execution

```
1. User uploads PDF
2. extractTextFromPDF() called
3. ensureWorkerReady() initializes worker
4. Browser fetches /assets/pdf.worker.min-abc123.mjs (200 OK)
5. PDF.js creates Web Worker from local file
6. Text extraction succeeds
```

---

## Verification in DevTools

### Step 1: Open Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Filter by "worker" or "pdf.worker"

### Step 2: Upload a PDF

1. Go to Items page
2. Upload a PDF file
3. Watch the Network tab

### Step 3: Verify Request

You should see a request like:

```
Request URL: https://your-domain.com/assets/pdf.worker.min-abc123.mjs
Status: 200 OK
Type: fetch (or script)
Size: ~1.1 MB
MIME Type: application/javascript
```

### Step 4: Check Console

You should see:

```
✓ PDF.js worker initialized successfully
  Worker URL: /assets/pdf.worker.min-abc123.mjs
```

### Step 5: Verify No Errors

- ❌ No "CORS policy" errors
- ❌ No "CSP violation" errors
- ❌ No "Failed to fetch" errors
- ✅ PDF extraction completes successfully

---

## Debugging Tips

### If Worker URL Shows as Absolute Path

```typescript
// During development, you might see:
// /assets/pdf.worker.min-abc123.mjs  ← Correct (relative to domain)

// In console, verify it's correct:
import { getWorkerUrl } from './lib/pdfjs';
console.log(getWorkerUrl());
// Output: /assets/pdf.worker.min-abc123.mjs
```

### If Worker Doesn't Load

**Check 1: File exists in build output**
```bash
# After building:
ls -la dist/assets/ | grep pdf.worker
# Should show: pdf.worker.min-abc123.mjs
```

**Check 2: Vite config has correct publicDir**
```typescript
publicDir: 'client/public',  // Correct
// NOT: publicDir: 'public',  // Wrong for this project
```

**Check 3: No import errors**
```bash
# Run TypeScript check
pnpm tsc --noEmit

# Should show 0 errors
```

---

## Production Deployment

### Build Output

```bash
pnpm build
```

Vite automatically:
- ✅ Bundles worker file
- ✅ Generates versioned URL
- ✅ Optimizes with gzip/brotli
- ✅ Sets long cache headers

### Deployment Checklist

- [ ] `dist/assets/pdf.worker.min-*.mjs` exists
- [ ] Worker file size is ~1.1 MB
- [ ] No 404 errors for worker in production
- [ ] PDF extraction works in production
- [ ] Network tab shows 200 status for worker

---

## Comparison: Before vs After

| Aspect | Before (CDN) | After (Vite ?url) |
|--------|-------------|-------------------|
| **Reliability** | Depends on unpkg.com | 100% self-hosted |
| **Performance** | Variable latency | Same domain, fast |
| **CORS Issues** | Possible | None |
| **CSP Compatibility** | Requires exceptions | Works with strict CSP |
| **Offline Support** | No | Yes (bundled) |
| **Build Size** | Smaller (no worker) | +1.1 MB (includes worker) |
| **Initialization** | Every page load | Lazy on first use |

---

## Summary

**The Solution:**
1. Create `src/lib/pdfjs.ts` with centralized worker initialization
2. Use `import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'`
3. Set `pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl`
4. Call `ensureWorkerReady()` before PDF operations
5. Vite handles the rest automatically

**Benefits:**
- ✅ No CDN dependency
- ✅ 100% reliable
- ✅ Better performance
- ✅ Strict CSP compatible
- ✅ Type-safe
- ✅ Browser-only (SSR safe)

**Verification:**
- Network tab shows `/assets/pdf.worker.min-*.mjs` with 200 status
- Console shows "✓ PDF.js worker initialized successfully"
- PDF extraction works without errors
