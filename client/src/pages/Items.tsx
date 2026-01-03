import React, { useState, useMemo, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, Download, Upload, Filter, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useI18n } from '@/contexts/I18nContext';
import { Input } from '@/components/ui/input';
import { FileImportDialog } from '@/components/FileImportDialog';
import { InlineFileUpload } from '@/components/InlineFileUpload';
import { ItemAnalysisPanel } from '@/components/ItemAnalysisPanel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Item {
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
}

export function Items() {
  const { t, language } = useI18n();
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([
    {
      id: '1',
      code: 'ITEM-001',
      description: 'الخرسانة العادية',
      unit: 'م³',
      quantity: 100,
      unitPrice: 500,
      totalPrice: 50000,
      category: 'مواد البناء',
      status: 'active',
      createdAt: '2026-01-01',
    },
    {
      id: '2',
      code: 'ITEM-002',
      description: 'الحديد التسليح',
      unit: 'طن',
      quantity: 50,
      unitPrice: 2000,
      totalPrice: 100000,
      category: 'مواد البناء',
      status: 'active',
      createdAt: '2026-01-01',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState<Partial<Item>>({});
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showInlineUpload, setShowInlineUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = new Set(items.map(item => item.category));
    return Array.from(uniqueCategories);
  }, [items]);

  // Filter and search items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = 
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !filterCategory || item.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, searchTerm, filterCategory, filterStatus]);

  const handleAddItem = () => {
    setEditingItem(null);
    setFormData({
      code: '',
      description: '',
      unit: '',
      quantity: 0,
      unitPrice: 0,
      totalPrice: 0,
      category: '',
      status: 'active',
    });
    setIsDialogOpen(true);
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setFormData(item);
    setIsDialogOpen(true);
  };

  const handleSaveItem = () => {
    if (!formData.code || !formData.description) {
      alert(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    const totalPrice = (formData.quantity || 0) * (formData.unitPrice || 0);

    if (editingItem) {
      // Update existing item
      setItems(items.map(item =>
        item.id === editingItem.id
          ? {
              ...item,
              ...formData,
              totalPrice,
              id: item.id,
            }
          : item
      ));
    } else {
      // Add new item
      const newItem: Item = {
        id: Date.now().toString(),
        code: formData.code || '',
        description: formData.description || '',
        unit: formData.unit || '',
        quantity: formData.quantity || 0,
        unitPrice: formData.unitPrice || 0,
        totalPrice,
        category: formData.category || '',
        status: formData.status as 'active' | 'inactive' || 'active',
        createdAt: new Date().toISOString().split('T')[0],
      };
      setItems([...items, newItem]);
    }

    setIsDialogOpen(false);
    setFormData({});
  };

  const handleDeleteItem = (id: string) => {
    if (confirm(language === 'ar' ? 'هل تريد حذف هذا العنصر؟' : 'Are you sure you want to delete this item?')) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleExportCSV = () => {
    const headers = ['Code', 'Description', 'Unit', 'Quantity', 'Unit Price', 'Total Price', 'Category', 'Status'];
    const rows = filteredItems.map(item => [
      item.code,
      item.description,
      item.unit,
      item.quantity,
      item.unitPrice,
      item.totalPrice,
      item.category,
      item.status,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `items-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const totalQuantity = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = filteredItems.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {language === 'ar' ? 'العناصر' : 'Items'}
          </h1>
          <p className="text-gray-600 mt-1">
            {language === 'ar'
              ? `إجمالي ${items.length} عنصر`
              : `Total ${items.length} items`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileUp className="w-4 h-4" />
            {language === 'ar' ? 'استيراد ملف' : 'Import File'}
          </Button>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {language === 'ar' ? 'تصدير' : 'Export'}
          </Button>
          <Button
            onClick={() => setShowInlineUpload(!showInlineUpload)}
            className="bg-green-500 hover:bg-green-600 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {language === 'ar' ? 'تحميل ملف' : 'Upload File'}
          </Button>
          <Button
            onClick={handleAddItem}
            className="bg-blue-500 hover:bg-blue-600 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {language === 'ar' ? 'إضافة عنصر' : 'Add Item'}
          </Button>
        </div>
        <input
          ref={fileInputRef as React.RefObject<HTMLInputElement>}
          type="file"
          accept=".xlsx,.xls,.pdf,.csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setShowImportDialog(true);
            }
          }}
        />
      </div>

      {/* Inline File Upload */}
      {showInlineUpload && (
        <Card className="p-4 mb-4 border-blue-200 bg-blue-50">
          <InlineFileUpload
            onDataExtracted={(data) => {
              console.log('Data extracted from file:', data.length, 'items');
              if (data.length === 0) {
                console.error('No data extracted from file');
                return;
              }
              const newItems = data.map((row, idx) => ({
                id: `imported-${Date.now()}-${idx}`,
                code: row.itemCode || `ITEM-${idx + 1}`,
                description: row.description || `Item ${row.itemCode}`,
                unit: row.unit || 'piece',
                quantity: row.quantity || 0,
                unitPrice: row.unitPrice || 0,
                totalPrice: row.totalPrice || (row.quantity * row.unitPrice),
                category: row.category || 'General',
                status: 'active' as const,
                createdAt: new Date().toISOString().split('T')[0],
              }));
              setItems(newItems);
              setShowInlineUpload(false);
            }}
            language={language as 'ar' | 'en'}
          />
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">
            {language === 'ar' ? 'إجمالي العناصر' : 'Total Items'}
          </p>
          <p className="text-2xl font-bold text-blue-600">{filteredItems.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">
            {language === 'ar' ? 'إجمالي الكمية' : 'Total Quantity'}
          </p>
          <p className="text-2xl font-bold text-green-600">{totalQuantity}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">
            {language === 'ar' ? 'إجمالي القيمة' : 'Total Value'}
          </p>
          <p className="text-2xl font-bold text-purple-600">
            ${totalValue.toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder={language === 'ar' ? 'ابحث عن عنصر...' : 'Search items...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">
              {language === 'ar' ? 'جميع الفئات' : 'All Categories'}
            </option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">
              {language === 'ar' ? 'جميع الحالات' : 'All Status'}
            </option>
            <option value="active">
              {language === 'ar' ? 'نشط' : 'Active'}
            </option>
            <option value="inactive">
              {language === 'ar' ? 'غير نشط' : 'Inactive'}
            </option>
          </select>

          {/* Clear Filters */}
          <Button
            onClick={() => {
              setSearchTerm('');
              setFilterCategory('');
              setFilterStatus('all');
            }}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {language === 'ar' ? 'مسح' : 'Clear'}
          </Button>
        </div>
      </Card>

      {/* Items Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">
                  {language === 'ar' ? 'الكود' : 'Code'}
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  {language === 'ar' ? 'الوصف' : 'Description'}
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  {language === 'ar' ? 'الوحدة' : 'Unit'}
                </th>
                <th className="px-4 py-3 text-right font-semibold">
                  {language === 'ar' ? 'الكمية' : 'Quantity'}
                </th>
                <th className="px-4 py-3 text-right font-semibold">
                  {language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}
                </th>
                <th className="px-4 py-3 text-right font-semibold">
                  {language === 'ar' ? 'الإجمالي' : 'Total'}
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  {language === 'ar' ? 'الفئة' : 'Category'}
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  {language === 'ar' ? 'الحالة' : 'Status'}
                </th>
                <th className="px-4 py-3 text-center font-semibold">
                  {language === 'ar' ? 'الإجراءات' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    {language === 'ar' ? 'لا توجد عناصر' : 'No items found'}
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <React.Fragment key={item.id}>
                    <tr className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}>
                    <td className="px-4 py-3 font-mono text-blue-600">{item.code}</td>
                    <td className="px-4 py-3">{item.description}</td>
                    <td className="px-4 py-3">{item.unit}</td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">${item.unitPrice.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      ${item.totalPrice.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{item.category}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          item.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.status === 'active'
                          ? language === 'ar'
                            ? 'نشط'
                            : 'Active'
                          : language === 'ar'
                            ? 'غير نشط'
                            : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEditItem(item)}
                          className="p-1 hover:bg-blue-100 rounded"
                          title={language === 'ar' ? 'تعديل' : 'Edit'}
                        >
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 hover:bg-red-100 rounded"
                          title={language === 'ar' ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                    {expandedItemId === item.id && (
                      <tr className="bg-gray-50 border-b">
                        <td colSpan={9} className="px-4 py-4">
                          <ItemAnalysisPanel
                            code={item.code}
                            description={item.description}
                            unit={item.unit}
                            quantity={item.quantity}
                            unitPrice={item.unitPrice}
                            category={item.category}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* File Import Dialog */}
      {showImportDialog && (
        <FileImportDialog
          isOpen={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          onImport={(importedItems: any[]) => {
            setItems([...items, ...importedItems]);
            setShowImportDialog(false);
          }}
          fileInputRef={fileInputRef}
          language={language}
        />
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem
                ? language === 'ar'
                  ? 'تعديل العنصر'
                  : 'Edit Item'
                : language === 'ar'
                  ? 'إضافة عنصر جديد'
                  : 'Add New Item'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                {language === 'ar' ? 'الكود' : 'Code'} *
              </label>
              <Input
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="ITEM-001"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                {language === 'ar' ? 'الفئة' : 'Category'} *
              </label>
              <Input
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder={language === 'ar' ? 'مواد البناء' : 'Building Materials'}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold mb-2">
                {language === 'ar' ? 'الوصف' : 'Description'} *
              </label>
              <Input
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={language === 'ar' ? 'وصف العنصر' : 'Item description'}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                {language === 'ar' ? 'الوحدة' : 'Unit'} *
              </label>
              <Input
                value={formData.unit || ''}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="م³"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                {language === 'ar' ? 'الكمية' : 'Quantity'} *
              </label>
              <Input
                type="number"
                value={formData.quantity || 0}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                {language === 'ar' ? 'سعر الوحدة' : 'Unit Price'} *
              </label>
              <Input
                type="number"
                value={formData.unitPrice || 0}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                {language === 'ar' ? 'الحالة' : 'Status'}
              </label>
              <select
                value={formData.status || 'active'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                className="border rounded-lg px-3 py-2 w-full"
              >
                <option value="active">
                  {language === 'ar' ? 'نشط' : 'Active'}
                </option>
                <option value="inactive">
                  {language === 'ar' ? 'غير نشط' : 'Inactive'}
                </option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsDialogOpen(false)}
              variant="outline"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleSaveItem}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {language === 'ar' ? 'حفظ' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
