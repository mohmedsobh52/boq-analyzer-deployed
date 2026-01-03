import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader, Download, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import * as XLSX from 'xlsx';
import * as pdf from 'pdfjs-dist';
import { detectLanguage } from '@/lib/languageDetector';
import { analyzeFileStructure, detectColumnType } from '@/lib/formatDetector';
import { suggestMapping, applyMapping, ColumnMappingConfig } from '@/lib/columnMapper';
import ColumnMappingPreview from './ColumnMappingPreview';
import { PDFPreviewModal, ExtractedBOQItem } from './PDFPreviewModal';
import { parsePDFFile } from '@/lib/pdfParser';

interface ImportedItem {
  id: string;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
  status: 'active' | 'inactive';
  createdAt: string;
  language: 'ar' | 'en';
}

interface FileImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: ImportedItem[]) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  language: 'ar' | 'en';
}

export function FileImportDialog({
  isOpen,
  onClose,
  onImport,
  fileInputRef,
  language,
}: FileImportDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mappingError, setMappingError] = useState<string | null>(null);
  const [importedData, setImportedData] = useState<ImportedItem[]>([]);
  const [fileLanguage, setFileLanguage] = useState<'ar' | 'en'>('en');
  const [showMappingPreview, setShowMappingPreview] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'mapping' | 'confirm'>('upload');
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const [mappingResult, setMappingResult] = useState<any>(null);
  const [mappingConfig, setMappingConfig] = useState<ColumnMappingConfig | null>(null);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [sampleData, setSampleData] = useState<Record<string, any>[]>([]);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfPreviewData, setPdfPreviewData] = useState<any>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setImportedData([]);
      setStep('upload');
    }
  }, [isOpen]);

  const parseExcelFile = async (file: File): Promise<ImportedItem[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet);

          const items: ImportedItem[] = rows.map((row: any, idx: number) => {
            const detectedLang = detectLanguage(
              `${row.description || ''} ${row.category || ''}`
            );

            return {
              id: Date.now().toString() + idx,
              code: row.code || row['الكود'] || `ITEM-${idx + 1}`,
              description: row.description || row['الوصف'] || '',
              unit: row.unit || row['الوحدة'] || '',
              quantity: parseFloat(row.quantity || row['الكمية'] || 0),
              unitPrice: parseFloat(row.unitPrice || row['سعر الوحدة'] || 0),
              totalPrice:
                parseFloat(row.quantity || row['الكمية'] || 0) *
                parseFloat(row.unitPrice || row['سعر الوحدة'] || 0),
              category: row.category || row['الفئة'] || 'General',
              status: 'active',
              createdAt: new Date().toISOString().split('T')[0],
              language: (detectedLang === 'ar' ? 'ar' : 'en') as 'ar' | 'en',
            };
          });

          resolve(items);
        } catch (err) {
          reject(new Error(language === 'ar' ? 'فشل تحليل ملف Excel' : 'Failed to parse Excel file'));
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const parsePdfFile = async (file: File): Promise<ImportedItem[]> => {
    return new Promise(async (resolve, reject) => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf_doc = await pdf.getDocument({ data: arrayBuffer }).promise;
        const items: ImportedItem[] = [];

        for (let pageNum = 1; pageNum <= pdf_doc.numPages; pageNum++) {
          const page = await pdf_doc.getPage(pageNum);
          const textContent = await page.getTextContent();
          const text = textContent.items.map((item: any) => item.str).join(' ');

          // Simple parsing: split by lines and extract data
          const lines = text.split('\n').filter(line => line.trim());
          
          lines.forEach((line, idx) => {
            if (line.trim().length > 0) {
              const detectedLang = detectLanguage(line);
              const parts = line.split(/\s+/);

              items.push({
                id: Date.now().toString() + idx,
                code: parts[0] || `ITEM-${idx + 1}`,
                description: line,
                unit: parts[parts.length - 2] || 'unit',
                quantity: parseFloat(parts[parts.length - 3] || '1'),
                unitPrice: parseFloat(parts[parts.length - 1] || '0'),
                totalPrice:
                  parseFloat(parts[parts.length - 3] || '1') *
                  parseFloat(parts[parts.length - 1] || '0'),
                category: 'General',
                status: 'active',
                createdAt: new Date().toISOString().split('T')[0],
                language: (detectedLang === 'ar' ? 'ar' : 'en') as 'ar' | 'en',
              });
            }
          });
        }

        resolve(items);
      } catch (err) {
        reject(new Error(language === 'ar' ? 'فشل تحليل ملف PDF' : 'Failed to parse PDF file'));
      }
    });
  };

  const handleFileSelect = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      let items: ImportedItem[] = [];

      if (file.name.endsWith('.pdf')) {
        items = await parsePdfFile(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        items = await parseExcelFile(file);
      } else {
        throw new Error(language === 'ar' ? 'صيغة ملف غير مدعومة' : 'Unsupported file format');
      }

      if (items.length === 0) {
        throw new Error(language === 'ar' ? 'لم يتم العثور على بيانات في الملف' : 'No data found in file');
      }

      // Detect overall language
      const allText = items.map(i => i.description).join(' ');
      const detectedLang = detectLanguage(allText);
      setFileLanguage((detectedLang === 'ar' ? 'ar' : 'en') as 'ar' | 'en');

      setImportedData(items);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    onImport(importedData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'استيراد البيانات من ملف' : 'Import Data from File'}
          </DialogTitle>
        </DialogHeader>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.pdf,.csv"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    {language === 'ar' ? 'جاري التحليل...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'اختر ملف' : 'Select File'}
                  </>
                )}
              </Button>
              <p className="text-sm text-gray-600 mt-4">
                {language === 'ar'
                  ? 'اختر ملف Excel أو PDF للاستيراد'
                  : 'Choose an Excel or PDF file to import'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 p-4 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">
                    {language === 'ar' ? 'خطأ' : 'Error'}
                  </h3>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && (
          <div className="space-y-4 py-4">
            {/* Language Detection */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-semibold">
                {language === 'ar' ? 'لغة الملف المكتشفة:' : 'Detected File Language:'}
              </p>
              <p className="text-lg font-bold text-blue-600">
                {fileLanguage === 'ar' ? 'العربية' : 'English'}
              </p>
            </div>

            {/* Data Summary */}
            <Card className="p-4">
              <h3 className="font-semibold mb-2">
                {language === 'ar' ? 'ملخص البيانات' : 'Data Summary'}
              </h3>
              <p className="text-sm text-gray-600">
                {language === 'ar'
                  ? `تم العثور على ${importedData.length} عنصر`
                  : `Found ${importedData.length} items`}
              </p>
            </Card>

            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">
                      {language === 'ar' ? 'الكود' : 'Code'}
                    </th>
                    <th className="border p-2 text-left">
                      {language === 'ar' ? 'الوصف' : 'Description'}
                    </th>
                    <th className="border p-2 text-left">
                      {language === 'ar' ? 'الكمية' : 'Qty'}
                    </th>
                    <th className="border p-2 text-left">
                      {language === 'ar' ? 'السعر' : 'Price'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {importedData.slice(0, 10).map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="border p-2 font-mono">{item.code}</td>
                      <td className="border p-2">{item.description.substring(0, 50)}</td>
                      <td className="border p-2 text-right">{item.quantity}</td>
                      <td className="border p-2 text-right">${item.unitPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {importedData.length > 10 && (
              <p className="text-xs text-gray-500 text-center">
                {language === 'ar'
                  ? `وغيرها... (${importedData.length - 10} عنصر إضافي)`
                  : `... and ${importedData.length - 10} more items`}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'preview' && (
            <>
              <Button
                onClick={() => {
                  setStep('upload');
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                variant="outline"
              >
                {language === 'ar' ? 'اختر ملف آخر' : 'Choose Another File'}
              </Button>
              <Button
                onClick={handleImport}
                className="bg-green-500 hover:bg-green-600 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {language === 'ar' ? 'استيراد البيانات' : 'Import Data'}
              </Button>
            </>
          )}
          {step === 'upload' && (
            <Button onClick={onClose} variant="outline">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {/* PDF Preview Modal */}
      {pdfPreviewData && (
        <PDFPreviewModal
          open={showPdfPreview}
          fileName={pdfPreviewData.fileName}
          tables={pdfPreviewData.tables}
          boqItems={pdfPreviewData.boqItems}
          onConfirm={(items) => {
            const convertedItems: ImportedItem[] = items.map((item, idx) => ({
              id: Date.now().toString() + idx,
              code: item.code || `ITEM-${idx + 1}`,
              description: item.description,
              unit: item.unit || '',
              quantity: item.quantity || 0,
              unitPrice: item.unitPrice || 0,
              totalPrice: item.totalPrice || 0,
              category: 'General',
              status: 'active',
              createdAt: new Date().toISOString().split('T')[0],
              language: detectLanguage(item.description) === 'ar' ? 'ar' : 'en',
            }));
            setImportedData(convertedItems);
            setShowPdfPreview(false);
            setPdfPreviewData(null);
            setStep('preview');
          }}
          onCancel={() => {
            setShowPdfPreview(false);
            setPdfPreviewData(null);
            setStep('upload');
          }}
        />
      )}
    </Dialog>
  );
}
