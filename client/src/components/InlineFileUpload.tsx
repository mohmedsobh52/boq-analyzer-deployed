import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { performantFileProcessor, PerformantResult } from '@/lib/performantFileProcessor';
import { PDFDataPreview } from './PDFDataPreview';
import { BOQItem } from '@/lib/pdfDataMapper';
type EnhancedProcessingResult = PerformantResult;

interface InlineFileUploadProps {
  onDataExtracted: (data: BOQItem[], fileName: string) => void;
  language?: 'ar' | 'en';
  maxFileSize?: number; // in MB
}

const translations = {
  en: {
    dragDrop: 'Drag & drop files here or click to upload',
    supportedFormats: 'Supported: Excel, PDF, CSV',
    uploading: 'Processing file...',
    success: 'File processed successfully',
    error: 'Error processing file',
    import: 'Import Data',
    cancel: 'Cancel',
    fileName: 'File Name',
    rows: 'Rows',
    columns: 'Columns',
    preview: 'Preview',
    noData: 'No data extracted',
  },
  ar: {
    dragDrop: 'اسحب الملفات هنا أو انقر للتحميل',
    supportedFormats: 'الصيغ المدعومة: Excel و PDF و CSV',
    uploading: 'جاري معالجة الملف...',
    success: 'تمت معالجة الملف بنجاح',
    error: 'خطأ في معالجة الملف',
    import: 'استيراد البيانات',
    cancel: 'إلغاء',
    fileName: 'اسم الملف',
    rows: 'صفوف',
    columns: 'أعمدة',
    preview: 'معاينة',
    noData: 'لم يتم استخراج أي بيانات',
  },
};

export const InlineFileUpload: React.FC<InlineFileUploadProps> = ({
  onDataExtracted,
  language = 'en',
  maxFileSize = 50,
}) => {
  const t = translations[language];
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<EnhancedProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (file.size > maxFileSize * 1024 * 1024) {
      setError(`File size exceeds ${maxFileSize}MB limit`);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const result = await performantFileProcessor(file, language);
      setResult(result);
      setFileName(file.name);

      if (result.data.length > 0) {
        setShowPreview(true);
      } else {
        setError(t.noData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
      setResult(null);
    } finally {
      setIsProcessing(false);
    }
  }, [language, maxFileSize, onDataExtracted, t.noData, t.error]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleClear = () => {
    setResult(null);
    setError(null);
    setFileName('');
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Upload Area */}
      {!result && !isProcessing && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="font-medium text-gray-700">{t.dragDrop}</p>
          <p className="text-sm text-gray-500 mt-1">{t.supportedFormats}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.pdf,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <Card className="p-8 text-center">
          <Loader className="w-8 h-8 mx-auto mb-2 text-blue-500 animate-spin" />
          <p className="font-medium text-gray-700">{t.uploading}</p>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-900">{t.error}</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button onClick={handleClear} className="text-red-500 hover:text-red-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </Card>
      )}

      {/* Preview State */}
      {showPreview && result && (
        <PDFDataPreview
          rawData={result.data}
          fileName={fileName}
          onImport={(items) => {
            onDataExtracted(items, fileName);
            handleClear();
          }}
          onCancel={() => {
            setShowPreview(false);
            setResult(null);
          }}
        />
      )}

      {/* Result State (Legacy) */}
      {result && !showPreview && (
        <div className="space-y-4">
          {/* Success Message */}
          <Card className="p-4 border-green-200 bg-green-50">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-green-900">{t.success}</p>
                <p className="text-sm text-green-700 mt-1">{fileName}</p>
              </div>
            </div>
          </Card>

          {/* File Info */}
          <Card className="p-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">{t.fileName}</p>
                <p className="font-semibold text-gray-900 truncate">{fileName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t.rows}</p>
                <p className="font-semibold text-gray-900">{result.data.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t.columns}</p>
                <p className="font-semibold text-gray-900">
                  {result.data.length > 0 ? Object.keys(result.data[0]).length : 0}
                </p>
              </div>
            </div>
          </Card>

          {/* Data Preview */}
          {result.data.length > 0 && (
            <Card className="p-4 overflow-x-auto">
              <p className="text-sm font-medium text-gray-700 mb-3">{t.preview}</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    {Object.keys(result.data[0])
                      .slice(0, 6)
                      .map((key) => (
                        <th key={key} className="text-left py-2 px-2 font-semibold text-gray-700">
                          {key}
                        </th>
                      ))}
                    {Object.keys(result.data[0]).length > 6 && (
                      <th className="text-left py-2 px-2 font-semibold text-gray-700">
                        +{Object.keys(result.data[0]).length - 6}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {result.data.slice(0, 3).map((row, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      {Object.keys(row)
                        .slice(0, 6)
                        .map((key) => (
                          <td key={key} className="py-2 px-2 text-gray-700 max-w-xs truncate">
                            {String(row[key]).substring(0, 50)}
                          </td>
                        ))}
                      {Object.keys(row).length > 6 && <td className="py-2 px-2 text-gray-500">...</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.data.length > 3 && (
                <p className="text-center text-sm text-gray-500 mt-2">
                  +{result.data.length - 3} more rows
                </p>
              )}
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClear}>
              {t.cancel}
            </Button>
            <Button onClick={() => result.data.length > 0 && onDataExtracted(result.data, fileName)}>
              {t.import}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InlineFileUpload;
