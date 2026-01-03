# PDF.js Worker Error Fix - Comprehensive Guide

## Root Cause Analysis

### Error Message
```
Failed to extract PDF text: Setting up fake worker failed: 
Failed to fetch dynamically imported module: 
https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.js
```

### Most Likely Root Causes

#### 1. **CDN Unreachability**
- **Issue**: unpkg.com CDN is blocked, rate-limited, or temporarily unavailable
- **Symptoms**: Network timeout, 404, 503 errors
- **Probability**: HIGH
- **Why it happens**: Corporate firewalls blocking CDN, CDN downtime, geographic restrictions, ISP blocking

#### 2. **CORS (Cross-Origin Resource Sharing) Violation**
- **Issue**: Browser blocks cross-origin fetch of worker file
- **Symptoms**: CORS policy error in console
- **Probability**: MEDIUM
- **Why it happens**: Worker file doesn't have proper CORS headers, preflight request fails

#### 3. **Content-Security-Policy (CSP) Violation**
- **Issue**: CSP headers block loading external scripts/workers
- **Symptoms**: CSP violation error in console
- **Probability**: MEDIUM
- **Why it happens**: Strict CSP policy doesn't allow unpkg.com, missing `worker-src` directive

#### 4. **ESM vs CommonJS Worker File Mismatch**
- **Issue**: pdfjs-dist v5.x uses `.mjs` worker, but code tries to load `.min.js`
- **Symptoms**: Module parsing error
- **Probability**: HIGH (for v5.x)
- **Why it happens**: pdfjs-dist v5.x changed worker format to ESM, incorrect file extension

#### 5. **Bundler Configuration Issue**
- **Issue**: Vite/Webpack doesn't properly handle worker imports
- **Symptoms**: Module not found, path resolution error
- **Probability**: HIGH
- **Why it happens**: Missing `?url` import modifier, incorrect `import.meta.url` usage

#### 6. **Mixed Content (HTTP vs HTTPS)**
- **Issue**: Loading HTTP worker from HTTPS page
- **Symptoms**: Mixed content error
- **Probability**: LOW (but critical in production)

#### 7. **Worker File Not Found**
- **Issue**: Worker file doesn't exist at specified path
- **Symptoms**: 404 error
- **Probability**: MEDIUM
- **Why it happens**: File not copied to public directory, incorrect path in configuration

---

## Recommended Production Fix: Self-Hosted Worker

### Why Self-Hosting is Better

| Aspect | CDN | Self-Hosted |
|--------|-----|-------------|
| **Reliability** | Depends on CDN uptime | 100% under your control |
| **Performance** | Variable latency | Same domain, faster |
| **Security** | External dependency | No external dependencies |
| **CSP** | Requires CSP exceptions | Works with strict CSP |
| **CORS** | May have issues | No CORS issues |
| **Cost** | Free but risky | Minimal (bundled with app) |

---

## Implementation: React + Vite (BOQ Analyzer)

### Step 1: Copy Worker File to Public Directory

```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs client/public/pdf.worker.min.mjs
ls -lh client/public/pdf.worker.min.mjs
```

### Step 2: Update pdfExtractor.ts

```typescript
import * as pdfjsLib from 'pdfjs-dist';

async function initializePDFWorker() {
  // Attempt 1: Local worker from public directory
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    console.log('✓ PDF worker configured: local /pdf.worker.min.mjs');
    return true;
  } catch (error) {
    console.warn('✗ Local worker failed:', error);
  }

  // Attempt 2: Worker from node_modules (development)
  try {
    const workerUrl = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).href;
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    console.log('✓ PDF worker configured: node_modules URL');
    return true;
  } catch (error) {
    console.warn('✗ Node modules worker failed:', error);
  }

  // Attempt 3: Fallback to unpkg CDN (last resort)
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 
      'https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs';
    console.log('✓ PDF worker configured: unpkg CDN (fallback)');
    return true;
  } catch (error) {
    console.error('✗ All worker initialization attempts failed:', error);
    return false;
  }
}

let workerInitialized = false;

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    if (!workerInitialized) {
      const success = await initializePDFWorker();
      if (!success) {
        throw new Error('Failed to initialize PDF worker');
      }
      workerInitialized = true;
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      } catch (pageError) {
        console.warn(`Failed to extract text from page ${i}:`, pageError);
      }
    }

    return fullText;
  } catch (error) {
    console.error('Failed to extract PDF text:', error);
    throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

### Step 3: Update Vite Configuration

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

---

## Alternative: Next.js Implementation

### Step 1: Place Worker in Public Directory

```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs
```

### Step 2: Update PDF Extraction Hook

```typescript
import { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

export function usePDFExtractor() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    async function initWorker() {
      try {
        const workerUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/pdf.worker.min.mjs`;
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
        setIsReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to init worker');
      }
    }

    initWorker();
  }, []);

  return { isReady, error };
}
```

### Step 3: Environment Configuration

```bash
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## Alternative: Webpack/CRA Implementation

### Step 1: Copy Worker to Public

```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs
```

### Step 2: Update PDF Extraction

```typescript
import * as pdfjsLib from 'pdfjs-dist';

export function initPDFWorker() {
  const publicUrl = process.env.PUBLIC_URL || '';
  pdfjsLib.GlobalWorkerOptions.workerSrc = 
    `${publicUrl}/pdf.worker.min.mjs`;
}

initPDFWorker();
```

---

## Content-Security-Policy (CSP) Configuration

### Required CSP Headers

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval';
  worker-src 'self' blob:;
  connect-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
```

### Express.js Implementation

```typescript
import express from 'express';

export function setupCSP(app: express.Application) {
  app.use((req, res, next) => {
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'wasm-unsafe-eval'",
        "worker-src 'self' blob:",
        "connect-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
      ].join('; ')
    );
    next();
  });
}

setupCSP(app);
```

---

## Verification Checklist

### Browser DevTools - Network Tab

- [ ] Request for `/pdf.worker.min.mjs` appears
- [ ] Status code is **200** (not 404, 403, or 0)
- [ ] MIME type is **application/javascript** or **text/javascript**
- [ ] Response size is > 100KB (typical worker size)
- [ ] No CORS errors in console
- [ ] No CSP violations in console

### Browser DevTools - Console

- [ ] No "Failed to fetch" errors
- [ ] No "CORS policy" errors
- [ ] No "CSP violation" errors
- [ ] Message shows: "✓ PDF worker configured: local /pdf.worker.min.mjs"

### Functional Testing

- [ ] Upload PDF file on /items page
- [ ] File parsing completes without errors
- [ ] Text extraction displays results
- [ ] BOQ items populate in table
- [ ] No console errors during extraction

---

## Troubleshooting

### Symptom: "Failed to fetch dynamically imported module"

**Check:**
1. Is `/pdf.worker.min.mjs` accessible? `curl http://localhost:3000/pdf.worker.min.mjs`
2. Is the file in `client/public/` directory?
3. Is Vite configured to serve public directory?

**Fix:**
```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs client/public/
pnpm dev
```

### Symptom: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Check:**
1. Is worker on same domain?
2. Are CORS headers needed? (They shouldn't be for same-origin)

**Fix:**
```typescript
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'; // ✓ Same origin
```

### Symptom: "Refused to load the worker script because it violates the Content-Security-Policy"

**Check:**
1. Is `worker-src 'self'` in CSP headers?
2. Is `script-src 'wasm-unsafe-eval'` in CSP headers?

**Fix:**
```
Content-Security-Policy:
  worker-src 'self' blob:;
  script-src 'self' 'wasm-unsafe-eval';
```

---

## Summary

| Aspect | Recommendation |
|--------|-----------------|
| **Worker Location** | Self-hosted in `client/public/` |
| **Fallback Strategy** | Local → node_modules → CDN |
| **Initialization** | Lazy load on first use |
| **CSP Headers** | `worker-src 'self' blob:` + `script-src 'wasm-unsafe-eval'` |
| **Caching** | Long cache for immutable worker |
| **Testing** | Verify Network tab shows 200 status |

This approach ensures **100% reliability** in production without external CDN dependencies.
