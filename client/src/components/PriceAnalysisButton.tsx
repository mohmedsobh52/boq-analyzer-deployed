import { useState } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from './ui/dialog';
import { useI18n } from '@/contexts/I18nContext';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Streamdown } from 'streamdown';
import { BOQItem } from './BOQTable';

interface PriceAnalysisButtonProps {
  items: BOQItem[];
  projectName?: string;
}

export function PriceAnalysisButton({ items, projectName }: PriceAnalysisButtonProps) {
  const { t, language } = useI18n();
  const [open, setOpen] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const analyzeItemsMutation = trpc.items.analyzeItems.useMutation();

  const handleAnalyze = async () => {
    if (items.length === 0) {
      toast.error(language === 'ar' ? 'لا توجد بنود للتحليل' : 'No items to analyze');
      return;
    }

    setLoading(true);
    try {
      // Prepare items data for analysis
      const itemsData = items.map(item => ({
        itemCode: item.itemCode,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        category: item.category,
      }));

      // Call tRPC mutation to analyze items with LLM
      const result = await analyzeItemsMutation.mutateAsync({
        items: itemsData,
        projectName: projectName || 'BOQ Analysis',
        language: language,
      });

      setAnalysis(typeof result.analysis === 'string' ? result.analysis : JSON.stringify(result.analysis));
      setOpen(true);
      toast.success(language === 'ar' ? 'تم التحليل بنجاح' : 'Analysis completed successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to analyze items';
      toast.error(message);
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleAnalyze}
        disabled={loading || items.length === 0}
        className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {language === 'ar' ? 'جاري التحليل...' : 'Analyzing...'}
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            {language === 'ar' ? 'تحليل الأسعار بـ AI' : 'AI Price Analysis'}
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              {language === 'ar' ? 'تحليل أسعار البنود' : 'Price Analysis Results'}
            </DialogTitle>
            <DialogClose />
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-cyan-500/20">
                <p className="text-sm text-slate-400">
                  {language === 'ar' ? 'عدد البنود' : 'Total Items'}
                </p>
                <p className="text-2xl font-bold text-cyan-400">{items.length}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-cyan-500/20">
                <p className="text-sm text-slate-400">
                  {language === 'ar' ? 'إجمالي التكلفة' : 'Total Cost'}
                </p>
                <p className="text-2xl font-bold text-cyan-400">
                  {items.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-cyan-500/20">
                <p className="text-sm text-slate-400">
                  {language === 'ar' ? 'متوسط السعر' : 'Avg Price'}
                </p>
                <p className="text-2xl font-bold text-cyan-400">
                  {(items.reduce((sum, item) => sum + item.unitPrice, 0) / items.length).toLocaleString()}
                </p>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="bg-slate-900/30 rounded-lg p-4 border border-cyan-500/20">
              <h3 className="font-bold text-cyan-300 mb-3">
                {language === 'ar' ? 'تحليل AI' : 'AI Analysis'}
              </h3>
              <div className="prose prose-invert max-w-none text-sm">
                <Streamdown>{analysis}</Streamdown>
              </div>
            </div>

            {/* Top Items by Cost */}
            <div className="bg-slate-900/30 rounded-lg p-4 border border-cyan-500/20">
              <h3 className="font-bold text-cyan-300 mb-3">
                {language === 'ar' ? 'أعلى 5 بنود من حيث التكلفة' : 'Top 5 Items by Cost'}
              </h3>
              <div className="space-y-2">
                {items
                  .sort((a, b) => b.totalPrice - a.totalPrice)
                  .slice(0, 5)
                  .map((item, idx) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-200">{item.itemCode}</p>
                        <p className="text-xs text-slate-400">{item.description}</p>
                      </div>
                      <p className="text-cyan-400 font-bold">
                        {item.totalPrice.toLocaleString()}
                      </p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Price Distribution */}
            <div className="bg-slate-900/30 rounded-lg p-4 border border-cyan-500/20">
              <h3 className="font-bold text-cyan-300 mb-3">
                {language === 'ar' ? 'توزيع الأسعار' : 'Price Distribution'}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">
                    {language === 'ar' ? 'أعلى سعر' : 'Highest Price'}
                  </span>
                  <span className="text-cyan-400 font-bold">
                    {Math.max(...items.map(i => i.unitPrice)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">
                    {language === 'ar' ? 'أقل سعر' : 'Lowest Price'}
                  </span>
                  <span className="text-cyan-400 font-bold">
                    {Math.min(...items.map(i => i.unitPrice)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">
                    {language === 'ar' ? 'متوسط السعر' : 'Average Price'}
                  </span>
                  <span className="text-cyan-400 font-bold">
                    {(items.reduce((sum, item) => sum + item.unitPrice, 0) / items.length).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
