import { useState, useRef } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { Upload, FileUp, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from 'sonner';
import { parseBOQFile, type BOQData } from '@/lib/boqParser';
import { FileProcessingDialog } from './FileProcessingDialog';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  onBOQLoaded?: (data: BOQData) => void;
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  parseBOQ?: boolean;
  showContentViewer?: boolean;
}

export function FileUpload({
  onFileSelect,
  onBOQLoaded,
  accept = '.xlsx,.csv,.pdf,.bdf',
  maxSize = 50 * 1024 * 1024,
  multiple = true,
  parseBOQ = false,
  showContentViewer = false,
}: FileUploadProps) {
  const { t, language } = useI18n();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processingFile, setProcessingFile] = useState<File | null>(null);
  const [showProcessingDialog, setShowProcessingDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateFile = (file: File): boolean => {
    setError(null);

    if (file.size > maxSize) {
      const sizeMB = (maxSize / 1024 / 1024).toFixed(0);
      const errorMsg = language === 'ar'
        ? `حجم الملف يتجاوز ${sizeMB}MB`
        : `File size exceeds ${sizeMB}MB limit`;
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    }

    const validExtensions = accept.split(',').map((ext) => ext.trim().toLowerCase());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      const supportedFormats = 'Excel (.xlsx, .xls), CSV (.csv), PDF (.pdf)';
      const errorMsg = language === 'ar'
        ? `صيغة الملف "${fileExtension}" غير مدعومة. الصيغ المدعومة: ${supportedFormats}`
        : `File format "${fileExtension}" is not supported. Supported formats: ${supportedFormats}`;
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    }

    return true;
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter((file) => validateFile(file));

    if (validFiles.length > 0) {
      const newFiles = multiple ? [...selectedFiles, ...validFiles] : validFiles;
      setSelectedFiles(newFiles);
      onFileSelect(newFiles);

      // Parse BOQ file if enabled
      if (parseBOQ && onBOQLoaded && validFiles.length > 0) {
        try {
          const boqData = await parseBOQFile(validFiles[0]);
          onBOQLoaded(boqData);
          const successMsg = language === 'ar'
            ? `تم تحميل ${boqData.totalItems} عنصر بنجاح`
            : `Successfully loaded ${boqData.totalItems} items`;
          toast.success(successMsg);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Failed to parse file';
          setError(errorMsg);
          toast.error(errorMsg);
        }
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.currentTarget.files || []);
    const validFiles = files.filter((file) => validateFile(file));

    if (validFiles.length > 0) {
      const newFiles = multiple ? [...selectedFiles, ...validFiles] : validFiles;
      setSelectedFiles(newFiles);
      onFileSelect(newFiles);

      // Parse BOQ file if enabled
      if (parseBOQ && onBOQLoaded && validFiles.length > 0) {
        try {
          const boqData = await parseBOQFile(validFiles[0]);
          onBOQLoaded(boqData);
          const successMsg = language === 'ar'
            ? `تم تحميل ${boqData.totalItems} عنصر بنجاح`
            : `Successfully loaded ${boqData.totalItems} items`;
          toast.success(successMsg);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Failed to parse file';
          setError(errorMsg);
          toast.error(errorMsg);
        }
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFileSelect(newFiles);
  };

  const handleClear = () => {
    setSelectedFiles([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <Card
        className={`blueprint-card cursor-pointer transition-all ${
          isDragging ? 'border-accent bg-accent/10' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            {isDragging ? (
              <FileUp className="text-accent animate-bounce" size={48} />
            ) : (
              <Upload className="text-primary" size={48} />
            )}
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            {isDragging
              ? language === 'ar'
                ? 'أفلت الملف هنا'
                : 'Drop your file here'
              : language === 'ar'
              ? 'اسحب الملف هنا'
              : 'Drag and drop your file'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {language === 'ar' ? 'أو انقر للاختيار' : 'or click to select'}
          </p>
          <p className="text-sm text-muted-foreground">
            {language === 'ar'
              ? 'الصيغ المدعومة: Excel (.xlsx, .xls), CSV (.csv), PDF (.pdf), BDF (.bdf)'
              : 'Supported formats: Excel (.xlsx, .xls), CSV (.csv), PDF (.pdf), BDF (.bdf)'}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {language === 'ar'
              ? `الحد الأقصى لحجم الملف: ${(maxSize / 1024 / 1024).toFixed(0)}MB`
              : `Maximum file size: ${(maxSize / 1024 / 1024).toFixed(0)}MB`}
          </p>
        </div>
      </Card>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-sm flex items-start gap-3">
          <AlertCircle className="text-destructive flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-bold text-destructive">
              {language === 'ar' ? 'خطأ' : 'Error'}
            </p>
            <p className="text-sm text-destructive/80">{error}</p>
          </div>
        </div>
      )}

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <Card className="blueprint-card p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-primary">
              {language === 'ar' ? 'الملفات المختارة' : 'Selected Files'} ({selectedFiles.length})
            </h4>
            <button
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-card p-3 rounded-sm border border-primary"
              >
                <div className="flex items-center gap-2 flex-1">
                  <CheckCircle className="text-green-400 flex-shrink-0" size={20} />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-sm truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                  className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        multiple={multiple}
        className="hidden"
      />
    </div>
  );
}
