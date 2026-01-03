import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Eye, Edit2, Trash2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/contexts/I18nContext';

export interface DetectedTable {
  headers: string[];
  rows: string[][];
  confidence: number;
}

export interface ExtractedBOQItem {
  code?: string;
  description: string;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  confidence: number;
}

export interface PDFPreviewModalProps {
  open: boolean;
  fileName: string;
  tables: DetectedTable[];
  boqItems: ExtractedBOQItem[];
  onConfirm: (items: ExtractedBOQItem[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PDFPreviewModal({
  open,
  fileName,
  tables,
  boqItems,
  onConfirm,
  onCancel,
  isLoading = false,
}: PDFPreviewModalProps) {
  const { language } = useI18n();
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set(boqItems.map((_, i) => i)));
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<ExtractedBOQItem | null>(null);

  const handleSelectAll = () => {
    if (selectedItems.size === boqItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(boqItems.map((_, i) => i)));
    }
  };

  const handleToggleItem = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const handleEditItem = (index: number) => {
    setEditingItem(index);
    setEditValues({ ...boqItems[index] });
  };

  const handleSaveEdit = () => {
    if (editingItem !== null && editValues) {
      const newItems = [...boqItems];
      newItems[editingItem] = editValues;
      // Update the items in parent component
      onConfirm(newItems);
      setEditingItem(null);
      setEditValues(null);
    }
  };

  const handleConfirmImport = () => {
    const itemsToImport = Array.from(selectedItems).map(i => boqItems[i]);
    onConfirm(itemsToImport);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'معاينة ملف PDF' : 'PDF Preview'}
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-2">
            {language === 'ar' ? `الملف: ${fileName}` : `File: ${fileName}`}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Detected Tables Section */}
          {tables.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                {language === 'ar' ? 'الجداول المكتشفة' : 'Detected Tables'}
              </h3>
              <div className="space-y-3">
                {tables.map((table, tableIdx) => (
                  <div key={tableIdx} className="border rounded p-3 bg-gray-50">
                    <p className="text-sm font-medium mb-2">
                      {language === 'ar' ? `جدول ${tableIdx + 1}` : `Table ${tableIdx + 1}`}
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-200">
                            {table.headers.map((header, idx) => (
                              <th key={idx} className="border px-2 py-1 text-left">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {table.rows.slice(0, 3).map((row, rowIdx) => (
                            <tr key={rowIdx} className="hover:bg-gray-100">
                              {row.map((cell, cellIdx) => (
                                <td key={cellIdx} className="border px-2 py-1 truncate max-w-xs">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                          {table.rows.length > 3 && (
                            <tr className="text-gray-500">
                              <td colSpan={table.headers.length} className="border px-2 py-1 text-center">
                                {language === 'ar' ? `... و ${table.rows.length - 3} صفوف أخرى` : `... and ${table.rows.length - 3} more rows`}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted BOQ Items Section */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {language === 'ar' ? 'عناصر BOQ المستخرجة' : 'Extracted BOQ Items'}
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedItems.size === boqItems.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4"
                />
                <span className="text-sm">
                  {language === 'ar' ? 'تحديد الكل' : 'Select All'}
                </span>
              </label>
            </div>

            {boqItems.length === 0 ? (
              <p className="text-gray-500 text-sm">
                {language === 'ar' ? 'لم يتم استخراج أي عناصر' : 'No items extracted'}
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {boqItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`border rounded p-3 flex items-start justify-between gap-3 ${
                      selectedItems.has(idx) ? 'bg-blue-50 border-blue-300' : 'bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.has(idx)}
                      onChange={() => handleToggleItem(idx)}
                      className="w-4 h-4 mt-1"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{item.code || 'N/A'}</span>
                        <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getConfidenceColor(item.confidence)}`}>
                          {getConfidenceIcon(item.confidence)}
                          {(item.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{item.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        {item.unit && <div>{language === 'ar' ? 'الوحدة:' : 'Unit:'} {item.unit}</div>}
                        {item.quantity && <div>{language === 'ar' ? 'الكمية:' : 'Qty:'} {item.quantity}</div>}
                        {item.unitPrice && <div>{language === 'ar' ? 'السعر:' : 'Price:'} ${item.unitPrice}</div>}
                        {item.totalPrice && <div>{language === 'ar' ? 'الإجمالي:' : 'Total:'} ${item.totalPrice}</div>}
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditItem(idx)}
                        className="p-1 hover:bg-blue-100 rounded"
                        title={language === 'ar' ? 'تعديل' : 'Edit'}
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => {
                          const newSelected = new Set(selectedItems);
                          newSelected.delete(idx);
                          setSelectedItems(newSelected);
                        }}
                        className="p-1 hover:bg-red-100 rounded"
                        title={language === 'ar' ? 'إزالة' : 'Remove'}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Edit Item Modal */}
          {editingItem !== null && editValues && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <h4 className="font-semibold mb-3">
                {language === 'ar' ? 'تعديل العنصر' : 'Edit Item'}
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">
                    {language === 'ar' ? 'الكود' : 'Code'}
                  </label>
                  <input
                    type="text"
                    value={editValues.code || ''}
                    onChange={(e) => setEditValues({ ...editValues, code: e.target.value })}
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    {language === 'ar' ? 'الوصف' : 'Description'}
                  </label>
                  <input
                    type="text"
                    value={editValues.description}
                    onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">
                      {language === 'ar' ? 'الوحدة' : 'Unit'}
                    </label>
                    <input
                      type="text"
                      value={editValues.unit || ''}
                      onChange={(e) => setEditValues({ ...editValues, unit: e.target.value })}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      {language === 'ar' ? 'الكمية' : 'Quantity'}
                    </label>
                    <input
                      type="number"
                      value={editValues.quantity || ''}
                      onChange={(e) => setEditValues({ ...editValues, quantity: parseFloat(e.target.value) || undefined })}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      {language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}
                    </label>
                    <input
                      type="number"
                      value={editValues.unitPrice || ''}
                      onChange={(e) => setEditValues({ ...editValues, unitPrice: parseFloat(e.target.value) || undefined })}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      {language === 'ar' ? 'الإجمالي' : 'Total Price'}
                    </label>
                    <input
                      type="number"
                      value={editValues.totalPrice || ''}
                      onChange={(e) => setEditValues({ ...editValues, totalPrice: parseFloat(e.target.value) || undefined })}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingItem(null);
                      setEditValues(null);
                    }}
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button onClick={handleSaveEdit}>
                    {language === 'ar' ? 'حفظ' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            onClick={handleConfirmImport}
            disabled={selectedItems.size === 0 || isLoading}
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                {language === 'ar' ? 'جاري الاستيراد...' : 'Importing...'}
              </>
            ) : (
              language === 'ar' ? `استيراد (${selectedItems.size})` : `Import (${selectedItems.size})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
