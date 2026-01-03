import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Download, Printer, ZoomIn, ZoomOut } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import type { BOQData, BOQItem as ParsedBOQItem } from '@/lib/boqParser';

export interface BOQItem {
  id: number;
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  wbsCode?: string;
}

interface BOQPreviewProps {
  items?: BOQItem[];
  projectName?: string;
  projectDescription?: string;
  onClose?: () => void;
  isFullScreen?: boolean;
  boqData?: BOQData;
  onImport?: (data: BOQData) => void;
}

export function BOQPreview({
  items,
  projectName,
  projectDescription,
  onClose,
  isFullScreen = false,
  boqData,
  onImport,
}: BOQPreviewProps) {
  const { language, isRTL } = useI18n();
  const [zoomLevel, setZoomLevel] = useState(100);

  // Use boqData if provided, otherwise use items
  const displayItems = boqData?.items || items || [];
  const displayProjectName = boqData?.projectName || projectName || 'BOQ';
  const displayDescription = projectDescription;
  const totalQuantity = displayItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalCost = displayItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const totalItems = displayItems.length;

  const handlePrint = () => {
    window.print();
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 10, 50));
  };

  const containerClass = isFullScreen
    ? 'fixed inset-0 bg-background z-50 overflow-auto'
    : 'relative';

  const contentStyle = {
    transform: `scale(${zoomLevel / 100})`,
    transformOrigin: 'top center',
    transition: 'transform 0.2s ease-out',
  };

  return (
    <div className={containerClass}>
      {/* Header */}
      {isFullScreen && (
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-primary">
            {language === 'ar' ? 'معاينة المقايسة' : 'BOQ Preview'}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              title={language === 'ar' ? 'تصغير' : 'Zoom Out'}
            >
              <ZoomOut size={18} />
            </Button>
            <span className="text-sm font-bold min-w-12 text-center">{zoomLevel}%</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              title={language === 'ar' ? 'تكبير' : 'Zoom In'}
            >
              <ZoomIn size={18} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              title={language === 'ar' ? 'طباعة' : 'Print'}
            >
              <Printer size={18} />
            </Button>
            {isFullScreen && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                title={language === 'ar' ? 'إغلاق' : 'Close'}
              >
                <X size={18} />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className={isFullScreen ? 'p-8' : 'p-0'}>
        <div style={contentStyle}>
          <Card className="blueprint-card bg-white text-black">
            {/* Title Section */}
            <div className={`text-center mb-8 pb-6 border-b-2 border-primary`}>
              <h1 className="text-3xl font-bold text-primary mb-2">{displayProjectName}</h1>
              {displayDescription && (
                <p className="text-muted-foreground text-lg">{displayDescription}</p>
              )}
              <p className="text-sm text-muted-foreground mt-3">
                {language === 'ar' ? 'قائمة الكميات والأسعار' : 'Bill of Quantities'}
              </p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8 pb-6 border-b border-border">
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <p className="text-sm text-muted-foreground font-semibold">
                  {language === 'ar' ? 'عدد البنود' : 'Total Items'}
                </p>
                <p className="text-2xl font-bold text-primary mt-2">{totalItems}</p>
              </div>
              <div className="text-center p-4 bg-accent/5 rounded-lg">
                <p className="text-sm text-muted-foreground font-semibold">
                  {language === 'ar' ? 'الكمية الإجمالية' : 'Total Quantity'}
                </p>
                <p className="text-2xl font-bold text-accent mt-2">{totalQuantity.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-green-500/5 rounded-lg">
                <p className="text-sm text-muted-foreground font-semibold">
                  {language === 'ar' ? 'التكلفة الإجمالية' : 'Total Cost'}
                </p>
                <p className="text-2xl font-bold text-green-500 mt-2">${totalCost.toLocaleString()}</p>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto mb-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-primary/10 border-b-2 border-primary">
                    <th className="border border-border p-3 text-left font-bold text-primary">
                      {language === 'ar' ? 'الكود' : 'Code'}
                    </th>
                    <th className="border border-border p-3 text-left font-bold text-primary">
                      {language === 'ar' ? 'الوصف' : 'Description'}
                    </th>
                    <th className="border border-border p-3 text-center font-bold text-primary">
                      {language === 'ar' ? 'الفئة' : 'Category'}
                    </th>
                    <th className="border border-border p-3 text-center font-bold text-primary">
                      {language === 'ar' ? 'الوحدة' : 'Unit'}
                    </th>
                    <th className="border border-border p-3 text-right font-bold text-primary">
                      {language === 'ar' ? 'الكمية' : 'Qty'}
                    </th>
                    <th className="border border-border p-3 text-right font-bold text-primary">
                      {language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}
                    </th>
                    <th className="border border-border p-3 text-right font-bold text-primary">
                      {language === 'ar' ? 'الإجمالي' : 'Total'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems.map((item, idx) => (
                    <tr key={`item-${idx}-${item.itemCode}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-border p-3 text-sm font-semibold">{item.itemCode}</td>
                      <td className="border border-border p-3 text-sm">{item.description}</td>
                      <td className="border border-border p-3 text-sm text-center">{item.category || '-'}</td>
                      <td className="border border-border p-3 text-sm text-center">{item.unit}</td>
                      <td className="border border-border p-3 text-sm text-right font-semibold">
                        {item.quantity.toLocaleString()}
                      </td>
                      <td className="border border-border p-3 text-sm text-right font-semibold">
                        ${item.unitPrice.toLocaleString()}
                      </td>
                      <td className="border border-border p-3 text-sm text-right font-bold text-primary">
                        ${item.totalPrice.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="border-t-2 border-primary pt-6">
              <div className="flex justify-end mb-4">
                <div className="w-full max-w-xs space-y-3">
                  <div className="flex justify-between p-3 bg-primary/5 rounded">
                    <span className="font-semibold">{language === 'ar' ? 'عدد البنود:' : 'Total Items:'}</span>
                    <span className="font-bold text-primary">{totalItems}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-accent/5 rounded">
                    <span className="font-semibold">{language === 'ar' ? 'الكمية الإجمالية:' : 'Total Quantity:'}</span>
                    <span className="font-bold text-accent">{totalQuantity.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-green-500/10 rounded border-2 border-green-500">
                    <span className="font-bold text-lg">{language === 'ar' ? 'التكلفة الإجمالية:' : 'TOTAL COST:'}</span>
                    <span className="font-bold text-2xl text-green-500">${totalCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Date */}
            <div className="mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground">
              <p>
                {language === 'ar' ? 'تم إنشاء هذه المقايسة في: ' : 'Generated on: '}
                {new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
              </p>
            </div>
          </Card>
        </div>

        {/* Import Button */}
        {boqData && onImport && (
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => onImport(boqData)}
              className="bg-accent hover:bg-accent/80 text-accent-foreground font-bold py-2 px-6 rounded-sm border-2 border-accent transition-all"
            >
              <Download size={18} className="mr-2" />
              {language === 'ar' ? 'استيراد البيانات' : 'Import Data'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
