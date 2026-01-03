/**
 * Incremental PDF Renderer Component
 * 
 * Displays PDF extraction progress with page-by-page results
 * Allows stopping extraction at any time
 */

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { extractPDFIncremental, ExtractionProgress } from '@/lib/incrementalPdfExtractor';

interface IncrementalPDFRendererProps {
  file: File;
  onComplete?: (text: string) => void;
  onError?: (error: Error) => void;
  maxPages?: number;
}

export function IncrementalPDFRenderer({
  file,
  onComplete,
  onError,
  maxPages,
}: IncrementalPDFRendererProps) {
  const [progress, setProgress] = useState<ExtractionProgress | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    startExtraction();

    return () => {
      // Cleanup on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [file]);

  const startExtraction = async () => {
    try {
      setIsExtracting(true);
      setError(null);
      setProgress(null);

      abortControllerRef.current = new AbortController();

      const text = await extractPDFIncremental(file, {
        maxPages,
        cacheResults: true,
        signal: abortControllerRef.current.signal,
        onProgress: (p) => {
          setProgress(p);
        },
      });

      setProgress({
        currentPage: maxPages || 0,
        totalPages: maxPages || 0,
        progress: 100,
        extractedText: text,
        isComplete: true,
      });

      onComplete?.(text);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      onError?.(err instanceof Error ? err : new Error(errorMsg));
    } finally {
      setIsExtracting(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsExtracting(false);
    }
  };

  const handleRetry = () => {
    startExtraction();
  };

  if (!progress) {
    return (
      <Card className="bg-card/50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="animate-spin text-2xl">⏳</div>
            <p className="text-sm text-muted-foreground">Initializing PDF extraction...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm truncate">{file.name}</CardTitle>
          <Badge variant={progress.isComplete ? 'default' : 'secondary'}>
            {progress.currentPage}/{progress.totalPages}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Extraction Progress</span>
            <span>{progress.progress}%</span>
          </div>
          <Progress value={progress.progress} className="h-2" />
        </div>

        {/* Status Info */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-background/50 p-2 rounded">
            <div className="text-muted-foreground">Pages</div>
            <div className="font-mono font-semibold">
              {progress.currentPage}/{progress.totalPages}
            </div>
          </div>

          <div className="bg-background/50 p-2 rounded">
            <div className="text-muted-foreground">Extracted</div>
            <div className="font-mono font-semibold">
              {(progress.extractedText.length / 1024).toFixed(1)}KB
            </div>
          </div>

          <div className="bg-background/50 p-2 rounded">
            <div className="text-muted-foreground">Status</div>
            <div className="font-mono font-semibold">
              {progress.isComplete ? '✓ Done' : '⏳ Running'}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/50 rounded p-3 text-sm text-destructive">
            <div className="font-semibold mb-1">❌ Error</div>
            <div className="text-xs">{error}</div>
          </div>
        )}

        {/* Extracted Text Preview */}
        {progress.extractedText && (
          <div className="bg-background/50 rounded p-3 max-h-32 overflow-y-auto">
            <div className="text-xs text-muted-foreground mb-2">Preview:</div>
            <div className="text-xs font-mono whitespace-pre-wrap break-words line-clamp-6">
              {progress.extractedText.substring(0, 500)}
              {progress.extractedText.length > 500 && '...'}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isExtracting ? (
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={handleStop}
            >
              ⏹ Stop Extraction
            </Button>
          ) : error ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleRetry}
              >
                🔄 Retry
              </Button>
            </>
          ) : progress.isComplete ? (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                const blob = new Blob([progress.extractedText], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${file.name.replace('.pdf', '')}-extracted.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              💾 Download Text
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
