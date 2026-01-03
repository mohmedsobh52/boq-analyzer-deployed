import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileContentViewer } from './FileContentViewer';
import { processFile, type FileContent } from '@/lib/fileProcessor';

interface FileProcessingDialogProps {
  file: File | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (content: FileContent) => void;
}

type ProcessingState = 'idle' | 'processing' | 'success' | 'error';

export function FileProcessingDialog({
  file,
  isOpen,
  onClose,
  onSuccess,
}: FileProcessingDialogProps) {
  const [state, setState] = useState<ProcessingState>('idle');
  const [content, setContent] = useState<FileContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !file) {
      setState('idle');
      setContent(null);
      setError(null);
      return;
    }

    const processFileAsync = async () => {
      setState('processing');
      setError(null);

      try {
        const result = await processFile(file);
        setContent(result);

        // Check if there are critical errors
        const hasErrors = result.errors.some(e => e.severity === 'error');
        if (hasErrors && result.successCount === 0) {
          setState('error');
          setError(result.errors[0]?.message || 'Failed to process file');
        } else {
          setState('success');
          onSuccess?.(result);
        }
      } catch (err) {
        setState('error');
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      }
    };

    processFileAsync();
  }, [file, isOpen, onSuccess]);

  const handleClose = () => {
    setState('idle');
    setContent(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>File Processing</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Processing State */}
          {state === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <div className="text-center">
                <h3 className="font-semibold text-lg">Processing File</h3>
                <p className="text-sm text-gray-600">
                  {file?.name}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Detecting language, parsing content, and extracting data...
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {state === 'error' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <div className="text-center">
                <h3 className="font-semibold text-lg text-red-600">Processing Failed</h3>
                <p className="text-sm text-gray-600 mt-2">
                  {error}
                </p>
                {file && (
                  <p className="text-xs text-gray-500 mt-2">
                    File: {file.name}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Success State - Show Content */}
          {state === 'success' && content && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">File processed successfully</span>
              </div>
              <FileContentViewer content={content} onClose={handleClose} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
