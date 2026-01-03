/**
 * PDF Data Preview Component
 * 
 * Displays extracted PDF data with mapping options and validation
 * Allows users to verify data before importing
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  mapPDFDataToItems,
  detectColumnMapping,
  validateItems,
  getItemsSummary,
  BOQItem,
} from '@/lib/pdfDataMapper';

interface PDFDataPreviewProps {
  rawData: Record<string, any>[];
  fileName: string;
  onImport: (items: BOQItem[]) => void;
  onCancel: () => void;
}

export function PDFDataPreview({
  rawData,
  fileName,
  onImport,
  onCancel,
}: PDFDataPreviewProps) {
  const [selectedTab, setSelectedTab] = useState<'raw' | 'mapped' | 'validation'>('mapped');

  // Detect and map columns
  const { mappedItems, columnMapping } = useMemo(() => {
    const mapping = detectColumnMapping(rawData);
    const items = mapPDFDataToItems(rawData, mapping || undefined);
    console.log('rawData sample', rawData.slice(0, 3));
    console.log('mappedItems sample', items.slice(0, 5));
    console.log('columnMapping', mapping);
    return { mappedItems: items, columnMapping: mapping };
  }, [rawData]);

  // Validate items
  const { valid: validItems, invalid: invalidItems } = useMemo(() => {
    const result = validateItems(mappedItems);
    console.log('invalid reasons', result.invalid.slice(0, 5));
    console.log('Valid items count:', result.valid.length);
    console.log('Invalid items count:', result.invalid.length);
    return result;
  }, [mappedItems]);

  // Get summary
  const summary = useMemo(() => {
    return getItemsSummary(validItems);
  }, [validItems]);

  const successRate = mappedItems.length > 0
    ? ((validItems.length / mappedItems.length) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
        <CardHeader>
          <CardTitle className="text-lg">📋 PDF Data Preview</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">{fileName}</p>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="p-3">
          <div className="text-2xl font-bold text-blue-600">{mappedItems.length}</div>
          <div className="text-xs text-muted-foreground">Total Items</div>
        </Card>

        <Card className="p-3">
          <div className="text-2xl font-bold text-green-600">{validItems.length}</div>
          <div className="text-xs text-muted-foreground">Valid</div>
        </Card>

        <Card className="p-3">
          <div className="text-2xl font-bold text-orange-600">{invalidItems.length}</div>
          <div className="text-xs text-muted-foreground">Issues</div>
        </Card>

        <Card className="p-3">
          <div className="text-2xl font-bold text-purple-600">{successRate}%</div>
          <div className="text-xs text-muted-foreground">Success Rate</div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setSelectedTab('mapped')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            selectedTab === 'mapped'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          📊 Mapped Data
        </button>

        <button
          onClick={() => setSelectedTab('validation')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            selectedTab === 'validation'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          ✓ Validation ({invalidItems.length})
        </button>

        <button
          onClick={() => setSelectedTab('raw')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            selectedTab === 'raw'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          📄 Raw Data
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-64">
        {/* Mapped Data Tab */}
        {selectedTab === 'mapped' && (
          <Card className="p-4">
            <div className="space-y-4">
              {/* Column Mapping Info */}
              {columnMapping && (
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-2">Detected Columns:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(columnMapping).map(([field, column]) => (
                      <div key={field} className="flex justify-between">
                        <span className="font-mono text-blue-700">{field}:</span>
                        <span className="text-blue-600">{column}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mapped Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-2 px-2 font-semibold">Code</th>
                      <th className="text-left py-2 px-2 font-semibold">Description</th>
                      <th className="text-left py-2 px-2 font-semibold">Unit</th>
                      <th className="text-right py-2 px-2 font-semibold">Qty</th>
                      <th className="text-right py-2 px-2 font-semibold">Unit Price</th>
                      <th className="text-right py-2 px-2 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validItems.slice(0, 5).map((item, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2 font-mono text-xs">{item.itemCode}</td>
                        <td className="py-2 px-2 truncate max-w-xs">{item.description}</td>
                        <td className="py-2 px-2">{item.unit}</td>
                        <td className="py-2 px-2 text-right">{item.quantity.toFixed(2)}</td>
                        <td className="py-2 px-2 text-right">{item.unitPrice.toFixed(2)}</td>
                        <td className="py-2 px-2 text-right font-semibold">
                          {item.totalPrice.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {validItems.length > 5 && (
                <p className="text-center text-sm text-muted-foreground">
                  +{validItems.length - 5} more items
                </p>
              )}

              {/* Summary */}
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <p className="text-sm font-medium text-green-900 mb-2">Summary:</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                  <div>Total Items: {summary.totalItems}</div>
                  <div>Total Quantity: {summary.totalQuantity.toFixed(2)}</div>
                  <div>Total Cost: ${summary.totalCost.toFixed(2)}</div>
                  <div>Avg Unit Price: ${summary.averageUnitPrice.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Validation Tab */}
        {selectedTab === 'validation' && (
          <Card className="p-4">
            {invalidItems.length === 0 ? (
              <div className="flex items-center gap-3 text-green-600">
                <CheckCircle2 className="w-6 h-6" />
                <p className="font-medium">All items passed validation!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invalidItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="border border-orange-200 bg-orange-50 p-3 rounded"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-orange-900">
                          {item.item.itemCode} - {item.item.description}
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-1 text-sm text-orange-700">
                      {item.errors.map((error, errIdx) => (
                        <li key={errIdx} className="flex items-start gap-2">
                          <span className="text-orange-500 mt-1">•</span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Raw Data Tab */}
        {selectedTab === 'raw' && (
          <Card className="p-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {rawData.slice(0, 3).map((row, idx) => (
                <div key={idx} className="border rounded p-2 bg-gray-50">
                  <p className="text-xs font-mono text-gray-600 mb-1">Row {idx + 1}:</p>
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(row, null, 2)}
                  </pre>
                </div>
              ))}
              {rawData.length > 3 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{rawData.length - 3} more rows
                </p>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>

        <Button
          onClick={() => onImport(validItems)}
          disabled={validItems.length === 0}
          className="bg-green-600 hover:bg-green-700"
        >
          ✓ Import {validItems.length} Items
        </Button>
      </div>
    </div>
  );
}
