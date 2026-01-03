import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileDown, FileText, Table, AlertCircle } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

export type ExportType = 'boq' | 'risks' | 'analytics';
export type ExportFormat = 'pdf' | 'excel';

interface ComprehensiveExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (type: ExportType, format: ExportFormat) => Promise<void>;
  isLoading?: boolean;
  availableTypes?: ExportType[];
}

export function ComprehensiveExportDialog({
  open,
  onOpenChange,
  onExport,
  isLoading = false,
  availableTypes = ['boq', 'risks', 'analytics'],
}: ComprehensiveExportDialogProps) {
  const { t, isRTL, language } = useI18n();
  const [selectedType, setSelectedType] = useState<ExportType>('boq');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [isExporting, setIsExporting] = useState(false);

  const exportTypeLabels: Record<ExportType, Record<string, string>> = {
    boq: {
      en: 'Bill of Quantities (BOQ)',
      ar: 'جدول الكميات والأسعار',
    },
    risks: {
      en: 'Risk Assessment Report',
      ar: 'تقرير تقييم المخاطر',
    },
    analytics: {
      en: 'Analytics Report',
      ar: 'تقرير التحليلات',
    },
  };

  const exportTypeDescriptions: Record<ExportType, Record<string, string>> = {
    boq: {
      en: 'Export detailed BOQ items, costs, and category breakdown',
      ar: 'تصدير بنود جدول الكميات والتكاليف وتفصيل الفئات',
    },
    risks: {
      en: 'Export risk register, assessments, and mitigation plans',
      ar: 'تصدير سجل المخاطر والتقييمات وخطط التخفيف',
    },
    analytics: {
      en: 'Export cost analysis, forecasts, and variance reports',
      ar: 'تصدير تحليل التكاليف والتنبؤات وتقارير الانحرافات',
    },
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(selectedType, selectedFormat);
      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const currentLanguage = language === 'ar' ? 'ar' : 'en';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-2xl ${isRTL ? 'rtl' : 'ltr'}`}>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <FileDown size={24} className="text-primary" />
            {language === 'ar' ? 'تصدير التقرير' : 'Export Project Report'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar'
              ? 'اختر نوع التقرير والصيغة للتصدير'
              : 'Select the report type and format for export'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Type Selection */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-3">
              {language === 'ar' ? 'اختر نوع التقرير' : 'Select Report Type'}
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {availableTypes.map((type) => (
                <Card
                  key={type}
                  className={`p-4 cursor-pointer transition-all border-2 ${
                    selectedType === type
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedType(type)}
                >
                  <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="p-2 bg-primary/20 rounded-lg flex-shrink-0">
                      {type === 'boq' && <Table size={20} className="text-primary" />}
                      {type === 'risks' && <AlertCircle size={20} className="text-primary" />}
                      {type === 'analytics' && <FileText size={20} className="text-primary" />}
                    </div>
                    <div className={isRTL ? 'text-right' : ''}>
                      <p className="font-semibold text-foreground">
                        {exportTypeLabels[type][currentLanguage]}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {exportTypeDescriptions[type][currentLanguage]}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-3">
              {language === 'ar' ? 'اختر صيغة التصدير' : 'Select Export Format'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Card
                className={`p-4 cursor-pointer transition-all border-2 ${
                  selectedFormat === 'pdf'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedFormat('pdf')}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <FileText size={24} className="text-red-500" />
                  </div>
                  <p className="font-semibold text-foreground">PDF</p>
                  <p className="text-xs text-muted-foreground text-center">
                    {language === 'ar' ? 'وثيقة منسقة احترافية' : 'Professional formatted document'}
                  </p>
                </div>
              </Card>

              <Card
                className={`p-4 cursor-pointer transition-all border-2 ${
                  selectedFormat === 'excel'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedFormat('excel')}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Table size={24} className="text-green-500" />
                  </div>
                  <p className="font-semibold text-foreground">Excel</p>
                  <p className="text-xs text-muted-foreground text-center">
                    {language === 'ar' ? 'جدول بيانات متعدد الأوراق' : 'Spreadsheet with multiple sheets'}
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* Export Summary */}
          <Card className="p-4 bg-primary/5 border-primary/20">
            <p className="text-sm text-foreground">
              <span className="font-semibold">
                {language === 'ar' ? 'سيتم التصدير:' : 'You will export:'}
              </span>
              {` ${exportTypeLabels[selectedType][currentLanguage]} ${language === 'ar' ? 'بصيغة' : 'as'} ${selectedFormat.toUpperCase()}`}
            </p>
          </Card>

          {/* Action Buttons */}
          <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button
              onClick={handleExport}
              disabled={isExporting || isLoading}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {isExporting || isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  {language === 'ar' ? 'جاري التصدير...' : 'Generating...'}
                </>
              ) : (
                <>
                  <FileDown size={18} className={isRTL ? 'ml-2' : 'mr-2'} />
                  {language === 'ar' ? 'تصدير التقرير' : 'Export Report'}
                </>
              )}
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1"
              disabled={isExporting}
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
