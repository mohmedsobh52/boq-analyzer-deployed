import { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { FileText, Sheet } from 'lucide-react';
import { generateAnalyticsPDF } from '@/lib/exportPDF';
import { generateAnalyticsExcel } from '@/lib/exportExcel';
import { LoadingOverlay } from './LoadingOverlay';
import { trpc } from '@/lib/trpc';
import type { PDFReportData } from '@/lib/exportPDF';
import type { ExcelReportData } from '@/lib/exportExcel';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportData: PDFReportData & ExcelReportData;
  isLoading?: boolean;
}

export function ExportDialog({ open, onOpenChange, reportData, isLoading = false }: ExportDialogProps) {
  const { t } = useI18n();
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [isExporting, setIsExporting] = useState(false);

  const addExportHistoryMutation = trpc.exportHistory.add.useMutation();

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      generateAnalyticsPDF(reportData);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await addExportHistoryMutation.mutateAsync({
        fileName: `BOQ-Analytics-Report-${new Date().toISOString().split('T')[0]}.pdf`,
        fileFormat: 'pdf',
        exportType: 'analytics',
        status: 'success',
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('PDF export failed:', error);
      await addExportHistoryMutation.mutateAsync({
        fileName: `BOQ-Analytics-Report-${new Date().toISOString().split('T')[0]}.pdf`,
        fileFormat: 'pdf',
        exportType: 'analytics',
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      await generateAnalyticsExcel(reportData);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await addExportHistoryMutation.mutateAsync({
        fileName: `BOQ-Analytics-Report-${new Date().toISOString().split('T')[0]}.xlsx`,
        fileFormat: 'excel',
        exportType: 'analytics',
        status: 'success',
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Excel export failed:', error);
      await addExportHistoryMutation.mutateAsync({
        fileName: `BOQ-Analytics-Report-${new Date().toISOString().split('T')[0]}.xlsx`,
        fileFormat: 'excel',
        exportType: 'analytics',
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <LoadingOverlay 
        isVisible={isExporting}
        message={exportFormat === 'pdf' ? 'Generating PDF report...' : 'Generating Excel spreadsheet...'}
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-2 border-primary">
        <DialogHeader>
          <DialogTitle className="text-primary">Export Analytics Report</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose a format to export your BOQ analytics report with forecasts and variance analysis.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="pdf" onValueChange={(v) => setExportFormat(v as 'pdf' | 'excel')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card border-2 border-primary rounded-sm p-1">
            <TabsTrigger value="pdf" className="rounded-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText size={18} className="mr-2" />
              PDF
            </TabsTrigger>
            <TabsTrigger value="excel" className="rounded-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Sheet size={18} className="mr-2" />
              Excel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="space-y-4 mt-4">
            <div className="space-y-3 text-sm">
              <h4 className="font-bold text-primary">PDF Report Includes:</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">✓</span>
                  <span>Executive summary with financial overview</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">✓</span>
                  <span>Cost forecasting with confidence intervals</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">✓</span>
                  <span>Category-wise cost breakdown</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">✓</span>
                  <span>Variance analysis (estimated vs. actual)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">✓</span>
                  <span>Key insights and recommendations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">✓</span>
                  <span>Professional blueprint-themed formatting</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={handleExportPDF}
              disabled={isExporting || isLoading}
              className="w-full bg-primary hover:bg-accent text-primary-foreground font-bold py-2 rounded-sm border-2 border-primary hover:border-accent transition-all"
            >
              {isExporting ? 'Generating PDF...' : 'Export as PDF'}
            </Button>
          </TabsContent>

          <TabsContent value="excel" className="space-y-4 mt-4">
            <div className="space-y-3 text-sm">
              <h4 className="font-bold text-primary">Excel Report Includes:</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">✓</span>
                  <span>Summary sheet with project information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">✓</span>
                  <span>Category analysis with detailed breakdown</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">✓</span>
                  <span>Variance analysis by category</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">✓</span>
                  <span>Forecast data and trends</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">✓</span>
                  <span>Key insights sheet</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">✓</span>
                  <span>Formatted cells with currency and percentages</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={handleExportExcel}
              disabled={isExporting || isLoading}
              className="w-full bg-primary hover:bg-accent text-primary-foreground font-bold py-2 rounded-sm border-2 border-primary hover:border-accent transition-all"
            >
              {isExporting ? 'Generating Excel...' : 'Export as Excel'}
            </Button>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-card border-l-4 border-accent rounded-sm">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Both formats include all analytics data. Choose PDF for sharing and Excel for further analysis.
          </p>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
