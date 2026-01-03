import { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Streamdown } from 'streamdown';
import { trpc } from '@/lib/trpc';

interface BOQItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  category: string;
}

interface AIItemAnalysisProps {
  items: BOQItem[];
  projectName: string;
}

export function AIItemAnalysis({ items, projectName }: AIItemAnalysisProps) {
  const { t, language } = useI18n();
  const [open, setOpen] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const analyzeItemsMutation = trpc.system.analyzeItems.useMutation();

  const handleAnalyze = async () => {
    if (items.length === 0) {
      toast.error(language === 'ar' ? 'لا توجد بنود للتحليل' : 'No items to analyze');
      return;
    }

    try {
      const response = await analyzeItemsMutation.mutateAsync({
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          category: item.category,
        })),
      });

      const content = typeof response === 'string' ? response : '';
      if (content) {
        setAnalysis(content);
        setOpen(true);
      } else {
        toast.error(language === 'ar' ? 'لم يتم الحصول على تحليل' : 'No analysis received');
      }
      toast.success(language === 'ar' ? 'تم التحليل بنجاح' : 'Analysis completed successfully');
    } catch (error) {
      const msg = language === 'ar' ? 'فشل التحليل' : 'Analysis failed';
      toast.error(msg);
      console.error('Analysis error:', error);
    }
  };

  return (
    <>
      <Button
        onClick={handleAnalyze}
        disabled={analyzeItemsMutation.isPending || items.length === 0}
        className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      >
        {analyzeItemsMutation.isPending ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            {language === 'ar' ? 'جاري التحليل...' : 'Analyzing...'}
          </>
        ) : (
          <>
            <Sparkles size={18} />
            {language === 'ar' ? 'تحليل ذكي للبنود' : 'Smart Item Analysis'}
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="text-purple-500" />
              {language === 'ar' ? 'تحليل الذكاء الاصطناعي' : 'AI Analysis Results'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {analysis ? (
              <Card className="p-4 bg-background/50 border-primary/30">
                <Streamdown>{analysis}</Streamdown>
              </Card>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle size={18} />
                {language === 'ar' ? 'لا توجد نتائج تحليل' : 'No analysis results'}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
            <Button
              onClick={() => {
                const text = analysis;
                navigator.clipboard.writeText(text);
                toast.success(language === 'ar' ? 'تم النسخ' : 'Copied to clipboard');
              }}
            >
              {language === 'ar' ? 'نسخ' : 'Copy'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
