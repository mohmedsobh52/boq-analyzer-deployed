import React, { useState } from 'react';
import { Sparkles, Loader, X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { Streamdown } from 'streamdown';
import type { BOQItem } from '@/lib/pdfDataMapper';

interface AISuggestRateButtonProps {
  items: BOQItem[];
  projectName?: string;
  onClose?: () => void;
}

export function AISuggestRateButton({
  items,
  projectName,
  onClose,
}: AISuggestRateButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const suggestRateMutation = trpc.items.suggestRate.useMutation();

  const handleAnalyze = async () => {
    try {
      await suggestRateMutation.mutateAsync({
        items: items.map(item => ({
          itemCode: item.itemCode,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          category: item.category,
        })),
        projectContext: projectName ? `Project: ${projectName}` : undefined,
      });
    } catch (error) {
      console.error('Error analyzing rates:', error);
    }
  };

  const handleCopy = () => {
    if (suggestRateMutation.data?.analysis) {
      const text = typeof suggestRateMutation.data.analysis === 'string' 
        ? suggestRateMutation.data.analysis 
        : JSON.stringify(suggestRateMutation.data.analysis);
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    suggestRateMutation.reset();
    onClose?.();
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      >
        <Sparkles size={18} />
        AI Suggest Rate
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles size={20} className="text-purple-400" />
              AI Price Analysis & Recommendations
            </DialogTitle>
            <DialogDescription>
              Analyzing {items.length} items for optimal pricing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Items Summary */}
            <div className="p-3 bg-card/50 border border-border rounded-lg">
              <div className="text-sm font-medium text-foreground mb-2">
                Items to Analyze:
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {items.map((item) => (
                  <div key={item.itemCode} className="text-xs text-muted-foreground">
                    • [{item.itemCode}] {item.description} - {item.quantity} {item.unit} @ ${item.unitPrice}
                  </div>
                ))}
              </div>
            </div>

            {/* Analysis Button */}
            {!suggestRateMutation.data && (
              <Button
                onClick={handleAnalyze}
                disabled={suggestRateMutation.isPending}
                className="w-full"
                size="lg"
              >
                {suggestRateMutation.isPending ? (
                  <>
                    <Loader size={18} className="animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} className="mr-2" />
                    Generate AI Analysis
                  </>
                )}
              </Button>
            )}

            {/* Analysis Results */}
            {suggestRateMutation.data && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-foreground">
                    Analysis Results
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="flex items-center gap-1"
                  >
                    {copied ? (
                      <>
                        <Check size={16} />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy
                      </>
                    )}
                  </Button>
                </div>

                <div className="p-4 bg-card/50 border border-border rounded-lg max-h-96 overflow-y-auto">
                  <Streamdown>
                    {typeof suggestRateMutation.data.analysis === 'string' 
                      ? suggestRateMutation.data.analysis 
                      : JSON.stringify(suggestRateMutation.data.analysis)}
                  </Streamdown>
                </div>

                <div className="text-xs text-muted-foreground">
                  Analysis completed at {new Date(suggestRateMutation.data.timestamp).toLocaleTimeString()}
                </div>

                <Button
                  onClick={() => {
                    suggestRateMutation.reset();
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Analyze Again
                </Button>
              </div>
            )}

            {/* Error State */}
            {suggestRateMutation.isError && (
              <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-lg text-sm text-red-400">
                Error analyzing rates. Please try again.
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4 border-t border-border">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
