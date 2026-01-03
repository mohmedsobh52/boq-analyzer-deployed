import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ColumnMappingConfig, MappingResult, validateMapping } from '@/lib/columnMapper';
import { FormatDetectionResult } from '@/lib/formatDetector';

interface ColumnMappingPreviewProps {
  detectionResult: FormatDetectionResult;
  mappingResult: MappingResult;
  sampleData: Record<string, any>[];
  availableColumns: string[];
  onMappingChange: (config: ColumnMappingConfig) => void;
  onConfirm: (config: ColumnMappingConfig) => void;
  language?: 'ar' | 'en';
}

const translations = {
  en: {
    title: 'Column Mapping',
    description: 'Review and adjust the automatic column detection',
    format: 'Detected Format',
    confidence: 'Confidence',
    requiredFields: 'Required Fields',
    optionalFields: 'Optional Fields',
    preview: 'Data Preview',
    reviewItems: 'Items for Review',
    selectColumn: 'Select Column',
    noSelection: 'Not Mapped',
    confirm: 'Confirm Mapping',
    cancel: 'Cancel',
    success: 'Mapping is valid',
    warning: 'Review recommended',
    error: 'Mapping has errors',
  },
  ar: {
    title: 'تعيين الأعمدة',
    description: 'راجع وعدّل الكشف التلقائي للأعمدة',
    format: 'التنسيق المكتشف',
    confidence: 'مستوى الثقة',
    requiredFields: 'الحقول المطلوبة',
    optionalFields: 'الحقول الاختيارية',
    preview: 'معاينة البيانات',
    reviewItems: 'العناصر للمراجعة',
    selectColumn: 'اختر عمود',
    noSelection: 'غير معيّن',
    confirm: 'تأكيد التعيين',
    cancel: 'إلغاء',
    success: 'التعيين صحيح',
    warning: 'يُنصح بالمراجعة',
    error: 'يوجد أخطاء في التعيين',
  },
};

export const ColumnMappingPreview: React.FC<ColumnMappingPreviewProps> = ({
  detectionResult,
  mappingResult,
  sampleData,
  availableColumns,
  onMappingChange,
  onConfirm,
  language = 'en',
}) => {
  const t = translations[language];
  const [localConfig, setLocalConfig] = useState<ColumnMappingConfig>(mappingResult.config);

  const validation = useMemo(() => validateMapping(localConfig), [localConfig]);

  const handleColumnChange = (field: keyof ColumnMappingConfig, value: string | null) => {
    const newConfig = { ...localConfig, [field]: value || null };
    setLocalConfig(newConfig);
    onMappingChange(newConfig);
  };

  const getStatusIcon = () => {
    if (!validation.valid) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    if (mappingResult.requiresReview) {
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
    return <CheckCircle2 className="w-5 h-5 text-green-500" />;
  };

  const getStatusText = () => {
    if (!validation.valid) return t.error;
    if (mappingResult.requiresReview) return t.warning;
    return t.success;
  };

  const requiredFields: (keyof ColumnMappingConfig)[] = ['itemCode', 'description', 'quantity', 'unitPrice'];
  const optionalFields: (keyof ColumnMappingConfig)[] = ['totalPrice', 'category', 'wbsCode', 'notes'];

  return (
    <div className={`space-y-4 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">{t.format}</p>
              <p className="text-lg font-semibold capitalize">{detectionResult.format}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{t.confidence}</p>
              <p className="text-lg font-semibold">{(mappingResult.confidence * 100).toFixed(0)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Required Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.requiredFields}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {requiredFields.map((field) => (
            <div key={field} className="space-y-1">
              <label className="text-sm font-medium capitalize">{field}</label>
              <Select value={localConfig[field] || ''} onValueChange={(value) => handleColumnChange(field, value || null)}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectColumn} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t.noSelection}</SelectItem>
                  {availableColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Optional Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.optionalFields}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {optionalFields.map((field) => (
            <div key={field} className="space-y-1">
              <label className="text-sm font-medium capitalize">{field}</label>
              <Select value={localConfig[field] || ''} onValueChange={(value) => handleColumnChange(field, value || null)}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectColumn} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t.noSelection}</SelectItem>
                  {availableColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Review Items */}
      {mappingResult.reviewItems.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-base text-yellow-900">{t.reviewItems}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {mappingResult.reviewItems.map((item, idx) => (
                <li key={idx} className="text-sm text-yellow-800 flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-base text-red-900">Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {validation.errors.map((error, idx) => (
                <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  {error}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      {sampleData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.preview}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {requiredFields.map((field) => (
                      <th key={field} className="text-left py-2 px-2 font-semibold capitalize">
                        {field}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sampleData.slice(0, 3).map((row, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      {requiredFields.map((field) => (
                        <td key={field} className="py-2 px-2 text-gray-700">
                          {localConfig[field] && row[localConfig[field]] ? String(row[localConfig[field]]).substring(0, 30) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => onMappingChange(mappingResult.config)}>
          {t.cancel}
        </Button>
        <Button onClick={() => onConfirm(localConfig)} disabled={!validation.valid}>
          {t.confirm}
        </Button>
      </div>
    </div>
  );
};

export default ColumnMappingPreview;
