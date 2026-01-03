import { useState } from 'react';
import { Home, ArrowLeft, AlertCircle, Loader2, Zap, Edit2, Trash2 } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileUpload } from '@/components/FileUpload';
import { parseFile, validateBOQData } from '@/lib/fileParser';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { BOQItem } from '@/components/BOQTable';
import { trpc } from '@/lib/trpc';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Streamdown } from 'streamdown';
import { AISuggestRateButton } from '@/components/AISuggestRateButton';

interface ItemWithAI extends BOQItem {
  aiSuggestedPrice?: number;
  calculatedPrice?: number;
}

export default function Item() {
  const { t, language } = useI18n();
  const [, setLocation] = useLocation();
  const { setCurrentPath } = useBreadcrumb();
  const [loading, setLoading] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [items, setItems] = useState<ItemWithAI[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const analyzeItemsMutation = trpc.system.analyzeItems.useMutation();

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setLoading(true);
    setParseErrors([]);
    setItems([]);

    try {
      const data = await parseFile(file);
      
      if (!data || data.length === 0) {
        setParseErrors(['No data found in file']);
        toast.error('No data found in file');
        setLoading(false);
        return;
      }

      const validation = validateBOQData(data);

      if (!validation.valid) {
        if (data.length > 0) {
          setParseErrors(validation.errors.slice(0, 5));
          console.warn('Validation warnings:', validation.errors);
        } else {
          setParseErrors(validation.errors);
          toast.error('File validation failed');
          setLoading(false);
          return;
        }
      }

      const parsedData = (data as any[]).map((item, idx) => {
        const qty = Math.max(0, item.quantity || 0);
        const unitPrice = Math.max(0, item.unitPrice || 0);
        const total = qty * unitPrice;
        return {
          id: idx,
          itemCode: item.itemCode || `ITEM-${idx + 1}`,
          description: item.description || '',
          unit: item.unit || 'LOT',
          quantity: qty,
          unitPrice: unitPrice,
          totalPrice: total,
          category: item.category,
          wbsCode: item.wbsCode,
          aiSuggestedPrice: undefined,
          calculatedPrice: undefined,
        };
      });
      
      setItems(parsedData);
      
      const successMsg = language === 'ar' 
        ? `تم تحليل الملف بنجاح - ${parsedData.length} بند` 
        : `File parsed successfully - ${parsedData.length} items`;
      toast.success(successMsg);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse file';
      console.error('File parsing error:', message, error);
      setParseErrors([message]);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAIAnalysis = async () => {
    if (items.length === 0) {
      toast.error('No items to analyze');
      return;
    }

    setLoading(true);
    try {
      const result = await analyzeItemsMutation.mutateAsync({
        items: items.map(item => ({
          code: item.itemCode,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          category: item.category,
        })),
      });

      setAnalysisResult((result as any)?.analysis || 'Analysis complete');
      setShowAnalysis(true);
      toast.success('AI analysis completed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Analysis failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportItems = () => {
    const csv = [
      ['NO', 'Code', 'Description', 'Quantity', 'Unit', 'Unit Price', 'AI Suggested Price', 'Total'].join(','),
      ...items.map((item, idx) => [
        idx + 1,
        item.itemCode,
        item.description,
        item.quantity,
        item.unit,
        item.unitPrice,
        item.aiSuggestedPrice || '-',
        item.totalPrice,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'boq-items.csv';
    a.click();
  };

  return (
    <div className="min-h-screen bg-background text-foreground" style={{
      backgroundImage: 'url(/construction-bg.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat',
    }}>
      {/* Header */}
      <header className="border-b-2 border-primary bg-black/60 backdrop-blur-md">
        <div className="container py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation('/')}
              className="p-2 hover:bg-primary/10 rounded-sm transition-colors"
              title={language === 'ar' ? 'الرئيسية' : 'Home'}
            >
              <Home className="text-primary" size={24} />
            </button>
            <button
              onClick={() => setLocation('/dashboard')}
              className="p-2 hover:bg-primary/10 rounded-sm transition-colors"
              title={language === 'ar' ? 'العودة' : 'Back'}
            >
              <ArrowLeft className="text-primary" size={24} />
            </button>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary glow-primary">BOQ Items</h1>
            <p className="text-muted-foreground mt-1">Upload and analyze BOQ items with AI pricing suggestions</p>
          </div>
          <div className="w-16" />
        </div>
      </header>

      {/* Content */}
      <main className="container py-12">
        <div className="max-w-6xl">
          {/* Upload Section */}
          <Card className="blueprint-card mb-8">
            <h2 className="text-2xl font-bold text-primary mb-6">Upload BOQ File</h2>
            <FileUpload onFileSelect={handleFileSelect} />

            {parseErrors.length > 0 && (
              <div className="mt-6 space-y-2">
                {parseErrors.map((error, idx) => (
                  <div key={idx} className="p-3 bg-destructive/10 border border-destructive rounded-sm flex items-start gap-2">
                    <AlertCircle className="text-destructive flex-shrink-0 mt-0.5" size={18} />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Items Table */}
          {items.length > 0 && (
            <Card className="blueprint-card mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary">BOQ Items ({items.length})</h2>
                <div className="flex gap-2">
                  <AISuggestRateButton items={items} />
                  <Button
                    onClick={handleAIAnalysis}
                    disabled={loading}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-sm border-2 border-accent"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={18} />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2" size={18} />
                        AI Analysis
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleExportItems}
                    variant="outline"
                    className="text-primary border-primary hover:bg-primary/10"
                  >
                    Export CSV
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="border border-border rounded-lg overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-primary/10 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-bold text-primary">Item No</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-primary">Item Code</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-primary">Description</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-primary">Unit</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-primary">Qty</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-primary">Unit Price</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-primary">Total</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-primary">AI Rate</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-primary">Calc. Price</th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-primary">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-b border-border hover:bg-primary/5 transition-colors">
                        <td className="px-4 py-3 text-sm text-foreground font-bold">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm text-foreground font-mono">{item.itemCode}</td>
                        <td className="px-4 py-3 text-sm text-foreground max-w-xs">{item.description}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{item.unit}</td>
                        <td className="px-4 py-3 text-sm text-foreground text-right font-bold">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-foreground text-right">${item.unitPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-primary font-bold text-right">${item.totalPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-accent font-bold text-right">
                          {item.aiSuggestedPrice ? `$${item.aiSuggestedPrice.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-accent font-bold text-right">
                          {item.calculatedPrice ? `$${item.calculatedPrice.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setEditingId(editingId === idx ? null : idx)}
                              className="p-1.5 hover:bg-primary/20 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={16} className="text-primary" />
                            </button>
                            <button
                              onClick={() => setItems(items.filter((_, i) => i !== idx))}
                              className="p-1.5 hover:bg-destructive/20 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} className="text-destructive" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-primary/10 border-t-2 border-primary">
                    <tr>
                      <td colSpan={6} className="px-4 py-3 text-right font-bold text-primary">Total Cost:</td>
                      <td className="px-4 py-3 text-right font-bold text-primary text-lg">
                        ${items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}
                      </td>
                      <td colSpan={3} className="px-4 py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          )}

          {/* Empty State */}
          {items.length === 0 && !loading && (
            <Card className="blueprint-card text-center py-12">
              <p className="text-muted-foreground text-lg">Upload a BOQ file to get started</p>
            </Card>
          )}
        </div>
      </main>

      {/* Analysis Dialog */}
      <Dialog open={showAnalysis} onOpenChange={setShowAnalysis}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Analysis Results</DialogTitle>
          </DialogHeader>
          <div className="prose prose-invert max-w-none">
            <Streamdown>{analysisResult}</Streamdown>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
