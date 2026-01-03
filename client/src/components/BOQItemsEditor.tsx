import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Save, X, Sparkles } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { toast } from 'sonner';
import { AIItemAnalysis } from './AIItemAnalysis';

export interface BOQItem {
  id?: number;
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string | null;
  wbsCode?: string | null;
}

interface BOQItemsEditorProps {
  items: BOQItem[];
  onItemsChange: (items: BOQItem[]) => void;
  onSave?: (items: BOQItem[]) => Promise<void>;
  isLoading?: boolean;
}

export function BOQItemsEditor({
  items,
  onItemsChange,
  onSave,
  isLoading = false,
}: BOQItemsEditorProps) {
  const { t, language } = useI18n();
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newItem, setNewItem] = useState<BOQItem | null>(null);

  const calculateTotalPrice = (quantity: number, unitPrice: number) => {
    return Math.round(quantity * unitPrice);
  };

  const handleAddItem = () => {
    setNewItem({
      itemCode: '',
      description: '',
      unit: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      category: '',
      wbsCode: '',
    });
    setEditingId('new');
  };

  const handleUpdateItem = (index: number, field: keyof BOQItem, value: any) => {
    const updatedItems = [...items];
    const item = updatedItems[index];

    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? Number(value) : item.quantity;
      const unitPrice = field === 'unitPrice' ? Number(value) : item.unitPrice;
      item.totalPrice = calculateTotalPrice(quantity, unitPrice);
    }

    (item as any)[field] = value;
    onItemsChange(updatedItems);
  };

  const handleSaveNewItem = () => {
    if (!newItem) return;

    if (!newItem.itemCode.trim() || !newItem.description.trim() || !newItem.unit.trim()) {
      toast.error(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    const itemToAdd: BOQItem = {
      ...newItem,
      id: Date.now(),
      totalPrice: calculateTotalPrice(newItem.quantity, newItem.unitPrice),
    };

    onItemsChange([...items, itemToAdd]);
    setNewItem(null);
    setEditingId(null);
    toast.success(language === 'ar' ? 'تم إضافة العنصر بنجاح' : 'Item added successfully');
  };

  const handleDeleteItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onItemsChange(updatedItems);
    toast.success(language === 'ar' ? 'تم حذف العنصر' : 'Item deleted');
  };

  const handleSaveAll = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave(items);
      toast.success(language === 'ar' ? 'تم حفظ جميع التغييرات' : 'All changes saved');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const totalCost = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="blueprint-card p-4">
          <p className="text-muted-foreground text-sm">{language === 'ar' ? 'إجمالي العناصر' : 'Total Items'}</p>
          <p className="text-2xl font-bold text-primary mt-2">{items.length}</p>
        </Card>
        <Card className="blueprint-card p-4">
          <p className="text-muted-foreground text-sm">{language === 'ar' ? 'إجمالي الكمية' : 'Total Quantity'}</p>
          <p className="text-2xl font-bold text-primary mt-2">{totalQuantity}</p>
        </Card>
        <Card className="blueprint-card p-4">
          <p className="text-muted-foreground text-sm">{language === 'ar' ? 'التكلفة الإجمالية' : 'Total Cost'}</p>
          <p className="text-2xl font-bold text-cyan-400 mt-2">${totalCost.toLocaleString()}</p>
        </Card>
      </div>

      {/* Items Table */}
      <Card className="blueprint-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary/30 bg-primary/10">
                <th className="px-4 py-3 text-left text-primary font-bold">{language === 'ar' ? 'الكود' : 'Code'}</th>
                <th className="px-4 py-3 text-left text-primary font-bold">{language === 'ar' ? 'الوصف' : 'Description'}</th>
                <th className="px-4 py-3 text-left text-primary font-bold">{language === 'ar' ? 'الوحدة' : 'Unit'}</th>
                <th className="px-4 py-3 text-right text-primary font-bold">{language === 'ar' ? 'الكمية' : 'Qty'}</th>
                <th className="px-4 py-3 text-right text-primary font-bold">{language === 'ar' ? 'السعر' : 'Unit Price'}</th>
                <th className="px-4 py-3 text-right text-primary font-bold">{language === 'ar' ? 'الإجمالي' : 'Total'}</th>
                <th className="px-4 py-3 text-center text-primary font-bold">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id || index} className="border-b border-primary/20 hover:bg-primary/5 transition-colors">
                  <td className="px-4 py-3">
                    {editingId === index ? (
                      <Input
                        value={item.itemCode}
                        onChange={(e) => handleUpdateItem(index, 'itemCode', e.target.value)}
                        className="bg-background border-primary/50"
                        placeholder="Code"
                      />
                    ) : (
                      <span className="text-foreground">{item.itemCode}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === index ? (
                      <Input
                        value={item.description}
                        onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                        className="bg-background border-primary/50"
                        placeholder="Description"
                      />
                    ) : (
                      <span className="text-foreground">{item.description}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === index ? (
                      <Input
                        value={item.unit}
                        onChange={(e) => handleUpdateItem(index, 'unit', e.target.value)}
                        className="bg-background border-primary/50"
                        placeholder="Unit"
                      />
                    ) : (
                      <span className="text-foreground">{item.unit}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === index ? (
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(index, 'quantity', e.target.value)}
                        className="bg-background border-primary/50 text-right"
                        placeholder="0"
                      />
                    ) : (
                      <span className="text-foreground font-semibold">{item.quantity}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === index ? (
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateItem(index, 'unitPrice', e.target.value)}
                        className="bg-background border-primary/50 text-right"
                        placeholder="0"
                      />
                    ) : (
                      <span className="text-foreground font-semibold">${item.unitPrice.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-cyan-400 font-bold">${item.totalPrice.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {editingId === index ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                            className="border-primary/50 hover:bg-primary/10"
                          >
                            <X size={16} />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(index)}
                            className="border-primary/50 hover:bg-primary/10"
                          >
                            {language === 'ar' ? 'تحرير' : 'Edit'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteItem(index)}
                            className="border-red-500/50 hover:bg-red-500/10 text-red-400"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {/* New Item Row */}
              {newItem && editingId === 'new' && (
                <tr className="border-b border-primary/20 bg-primary/5">
                  <td className="px-4 py-3">
                    <Input
                      value={newItem.itemCode}
                      onChange={(e) => setNewItem({ ...newItem, itemCode: e.target.value })}
                      className="bg-background border-primary/50"
                      placeholder="Code"
                      autoFocus
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      className="bg-background border-primary/50"
                      placeholder="Description"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      value={newItem.unit}
                      onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                      className="bg-background border-primary/50"
                      placeholder="Unit"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Input
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                      className="bg-background border-primary/50 text-right"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Input
                      type="number"
                      value={newItem.unitPrice}
                      onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
                      className="bg-background border-primary/50 text-right"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-cyan-400 font-bold">
                      ${calculateTotalPrice(newItem.quantity, newItem.unitPrice).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSaveNewItem}
                        className="border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-400"
                      >
                        <Save size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setNewItem(null);
                          setEditingId(null);
                        }}
                        className="border-primary/50 hover:bg-primary/10"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-between flex-wrap">
        <div className="flex gap-4">
          <Button
            onClick={handleAddItem}
            disabled={editingId !== null}
            className="bg-primary hover:bg-accent text-primary-foreground font-bold px-6 py-2 rounded-sm border-2 border-primary hover:border-accent transition-all"
          >
            <Plus size={20} className="mr-2" />
            {language === 'ar' ? 'إضافة عنصر' : 'Add Item'}
          </Button>

          {items.length > 0 && (
            <AIItemAnalysis 
              items={items.map(item => ({
                id: String(item.id || Math.random()),
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.unitPrice,
                category: item.category || 'General',
              }))}
              projectName="BOQ Analysis"
            />
          )}
        </div>

        {onSave && (
          <Button
            onClick={handleSaveAll}
            disabled={isSaving || isLoading || items.length === 0}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold px-6 py-2 rounded-sm border-2 border-cyan-500 hover:border-cyan-600 transition-all"
          >
            <Save size={20} className="mr-2" />
            {isSaving ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ الكل' : 'Save All')}
          </Button>
        )}
      </div>
    </div>
  );
}
