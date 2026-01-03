import { useState } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { Input } from './ui/input';
import { AdvancedFiltersPanel } from './AdvancedFiltersPanel';
import { AdvancedStatistics } from './AdvancedStatistics';
import { CostDistributionReport } from './CostDistributionReport';

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

interface BOQTableProps {
  items: BOQItem[];
  onItemSelect?: (item: BOQItem) => void;
  loading?: boolean;
  filters?: {
    units: string[];
    categories: string[];
    priceRange: [number, number];
  };
}

type SortField = keyof BOQItem;
type SortDirection = 'asc' | 'desc';

export function BOQTable({ items, onItemSelect, loading, filters }: BOQTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('itemCode');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const filteredItems = items.filter(item => {
    // Search filter
    const matchesSearch = 
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Unit filter
    if (filters?.units.length && filters.units.length > 0) {
      if (!filters.units.includes(item.unit)) return false;
    }

    // Category filter
    if (filters?.categories.length && filters.categories.length > 0) {
      if (!item.category || !filters.categories.includes(item.category)) return false;
    }

    // Price range filter
    if (filters?.priceRange) {
      const [minPrice, maxPrice] = filters.priceRange;
      if (item.totalPrice < minPrice || item.totalPrice > maxPrice) return false;
    }

    return true;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <div className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading BOQ data...</p>
      </div>
    );
  }

  const [displayedItems, setDisplayedItems] = useState(items);
  const [showStats, setShowStats] = useState(false);
  const [showDistribution, setShowDistribution] = useState(false);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          type="text"
          placeholder="Search by item code, description, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="blueprint-input w-full pl-10"
        />
      </div>

      {/* Advanced Filters Panel */}
      <AdvancedFiltersPanel
        items={items.map(item => ({
          itemCode: item.itemCode,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          category: item.category,
          notes: '',
        }))}
        onFilterChange={(filtered) => setDisplayedItems(filtered.map((f, idx) => ({
          id: idx,
          ...f,
          wbsCode: '',
        })))}
        language="en"
      />

      {/* Toggle Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowStats(!showStats)}
          className="px-3 py-2 bg-primary/20 text-primary rounded-md text-sm font-medium hover:bg-primary/30 transition-colors"
        >
          {showStats ? '▼' : '▶'} Advanced Statistics
        </button>
        <button
          onClick={() => setShowDistribution(!showDistribution)}
          className="px-3 py-2 bg-primary/20 text-primary rounded-md text-sm font-medium hover:bg-primary/30 transition-colors"
        >
          {showDistribution ? '▼' : '▶'} Cost Distribution
        </button>
      </div>

      {/* Advanced Statistics */}
      {showStats && <AdvancedStatistics items={displayedItems} language="en" />}

      {/* Cost Distribution Report */}
      {showDistribution && <CostDistributionReport items={displayedItems} language="en" />}

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {sortedItems.length} of {items.length} items
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border-2 border-cyan-500/30 shadow-lg shadow-cyan-500/10">
        <table className="data-table w-full">
          <thead>
            <tr className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b-2 border-cyan-500">
              <th
                className="cursor-pointer hover:bg-cyan-500/20 transition-all px-4 py-4 text-left font-bold text-cyan-300 uppercase tracking-wider text-sm"
                onClick={() => handleSort('itemCode')}
                title="Click to sort"
              >
                <div className="flex items-center gap-2">
                  <span>📋</span>
                  Item Code
                  <SortIcon field="itemCode" />
                </div>
              </th>
              <th
                className="cursor-pointer hover:bg-cyan-500/20 transition-all px-4 py-4 text-left font-bold text-cyan-300 uppercase tracking-wider text-sm"
                onClick={() => handleSort('description')}
                title="Click to sort"
              >
                <div className="flex items-center gap-2">
                  <span>📝</span>
                  Description
                  <SortIcon field="description" />
                </div>
              </th>
              <th
                className="cursor-pointer hover:bg-cyan-500/20 transition-all px-4 py-4 text-left font-bold text-cyan-300 uppercase tracking-wider text-sm"
                onClick={() => handleSort('unit')}
                title="Click to sort"
              >
                <div className="flex items-center gap-2">
                  <span>📏</span>
                  Unit
                  <SortIcon field="unit" />
                </div>
              </th>
              <th
                className="cursor-pointer hover:bg-cyan-500/20 transition-all px-4 py-4 text-right font-bold text-cyan-300 uppercase tracking-wider text-sm"
                onClick={() => handleSort('quantity')}
                title="Click to sort"
              >
                <div className="flex items-center justify-end gap-2">
                  <span>🔢</span>
                  Qty
                  <SortIcon field="quantity" />
                </div>
              </th>
              <th
                className="cursor-pointer hover:bg-cyan-500/20 transition-all px-4 py-4 text-right font-bold text-cyan-300 uppercase tracking-wider text-sm"
                onClick={() => handleSort('unitPrice')}
                title="Click to sort"
              >
                <div className="flex items-center justify-end gap-2">
                  <span>💰</span>
                  Unit Price
                  <SortIcon field="unitPrice" />
                </div>
              </th>
              <th
                className="cursor-pointer hover:bg-cyan-500/20 transition-all px-4 py-4 text-right font-bold text-cyan-300 uppercase tracking-wider text-sm"
                onClick={() => handleSort('totalPrice')}
                title="Click to sort"
              >
                <div className="flex items-center justify-end gap-2">
                  <span>💵</span>
                  Total Price
                  <SortIcon field="totalPrice" />
                </div>
              </th>
              <th className="px-4 py-4 text-left font-bold text-cyan-300 uppercase tracking-wider text-sm">
                <div className="flex items-center gap-2">
                  <span>🏷️</span>
                  Category
                </div>
              </th>
              <th className="px-4 py-4 text-left font-bold text-cyan-300 uppercase tracking-wider text-sm">
                <div className="flex items-center gap-2">
                  <span>🔗</span>
                  WBS Code
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-muted-foreground">
                  No items found
                </td>
              </tr>
            ) : (
              sortedItems.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`cursor-pointer transition-all border-b border-slate-700/50 ${
                    idx % 2 === 0 ? 'bg-slate-900/30 hover:bg-slate-800/50' : 'bg-slate-950/20 hover:bg-slate-800/30'
                  }`}
                  onClick={() => onItemSelect?.(item)}
                >
                  <td className="px-4 py-3 text-cyan-400 font-bold">{item.itemCode}</td>
                  <td className="px-4 py-3 max-w-xs truncate text-slate-200">{item.description}</td>
                  <td className="px-4 py-3 text-slate-300">{item.unit}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{item.quantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-4 py-3 text-right text-cyan-400 font-bold">{formatCurrency(item.totalPrice)}</td>
                  <td className="px-4 py-3 text-slate-400">{item.category || '-'}</td>
                  <td className="px-4 py-3 text-slate-400">{item.wbsCode || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      {sortedItems.length > 0 && (
        <div className="border-t-2 border-primary pt-4 flex justify-end">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Cost</p>
            <p className="text-2xl font-bold text-accent">
              {formatCurrency(sortedItems.reduce((sum, item) => sum + item.totalPrice, 0))}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
