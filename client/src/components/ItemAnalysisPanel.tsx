import React, { useState } from 'react';
import { Loader2, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Streamdown } from 'streamdown';
import { useI18n } from '@/contexts/I18nContext';

export interface ItemAnalysisPanelProps {
  itemId?: string;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  category?: string;
}

export function ItemAnalysisPanel({
  code,
  description,
  unit,
  quantity,
  unitPrice,
  category,
}: ItemAnalysisPanelProps) {
  const { t, language } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null) as any;
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeItemMutation = trpc.system.analyzeItem.useMutation();

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeItemMutation.mutateAsync({
        code,
        description,
        unit,
        quantity,
        unitPrice,
        category,
      });

      setAnalysis(typeof result === 'string' ? result : '');
      setIsExpanded(true);
      toast.success(language === 'ar' ? 'تم التحليل بنجاح' : 'Analysis completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(language === 'ar' ? 'فشل التحليل' : 'Analysis failed');
      console.error('Analysis error:', errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const totalPrice = quantity * unitPrice;

  return (
    <div className="space-y-2">
      <Button
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        variant="outline"
        size="sm"
        className="w-full flex items-center justify-center gap-2 text-xs"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            {language === 'ar' ? 'جاري التحليل...' : 'Analyzing...'}
          </>
        ) : (
          <>
            <Zap className="w-3 h-3" />
            {language === 'ar' ? 'تحليل ذكي' : 'AI Analysis'}
          </>
        )}
      </Button>

      {analysis && (
        <Card
          className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start justify-between cursor-pointer">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                  {language === 'ar' ? 'التحليل الذكي' : 'AI Analysis'}
                </h4>
              </div>

              {isExpanded && (
                <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <Streamdown>{analysis}</Streamdown>
                </div>
              )}

              {!isExpanded && (
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {analysis.substring(0, 100)}...
                </p>
              )}
            </div>

            <button className="ml-2 flex-shrink-0">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              )}
            </button>
          </div>

          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800 text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>{language === 'ar' ? 'الكود' : 'Code'}:</span>
                <span className="font-mono">{code}</span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'ar' ? 'الكمية' : 'Quantity'}:</span>
                <span>{quantity} {unit}</span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'ar' ? 'السعر الإجمالي' : 'Total Price'}:</span>
                <span className="font-semibold">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
