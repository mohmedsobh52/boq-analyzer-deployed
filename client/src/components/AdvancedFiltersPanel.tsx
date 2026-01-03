import React, { useState, useMemo } from 'react';
import { ChevronDown, X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  filterByCategory,
  filterByPriceRange,
  groupByCategory,
  type BOQItem,
} from '@/lib/pdfDataMapper';

interface AdvancedFiltersPanelProps {
  items: BOQItem[];
  onFilterChange: (filtered: BOQItem[]) => void;
  language: 'ar' | 'en';
}

interface FilterState {
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  searchText: string;
}

export function AdvancedFiltersPanel({
  items,
  onFilterChange,
  language,
}: AdvancedFiltersPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    category: null,
    minPrice: null,
    maxPrice: null,
    searchText: '',
  });

  const categories = useMemo(() => {
    const groups = groupByCategory(items);
    return Object.keys(groups).filter((cat) => cat !== 'Uncategorized');
  }, [items]);

  const prices = useMemo(() => {
    if (items.length === 0) return { min: 0, max: 0 };
    const prices_list = items.map((i) => i.unitPrice);
    return {
      min: Math.min(...prices_list),
      max: Math.max(...prices_list),
    };
  }, [items]);

  // Apply filters
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Category filter
    if (filters.category) {
      result = filterByCategory(result, filters.category);
    }

    // Price range filter
    if (filters.minPrice !== null || filters.maxPrice !== null) {
      const minPrice = filters.minPrice ?? 0;
      const maxPrice = filters.maxPrice ?? Infinity;
      result = filterByPriceRange(result, minPrice, maxPrice);
    }

    // Search filter
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      result = result.filter(
        (item) =>
          item.itemCode.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower) ||
          item.unit.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [items, filters]);

  // Update parent when filters change
  React.useEffect(() => {
    onFilterChange(filteredItems);
  }, [filteredItems, onFilterChange]);

  const handleReset = () => {
    setFilters({
      category: null,
      minPrice: null,
      maxPrice: null,
      searchText: '',
    });
  };

  const activeFiltersCount = [
    filters.category ? 1 : 0,
    filters.minPrice !== null ? 1 : 0,
    filters.maxPrice !== null ? 1 : 0,
    filters.searchText ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const labels = {
    ar: {
      filters: 'التصفية المتقدمة',
      category: 'الفئة',
      priceRange: 'نطاق السعر',
      minPrice: 'الحد الأدنى',
      maxPrice: 'الحد الأقصى',
      search: 'بحث',
      reset: 'إعادة تعيين',
      results: 'النتائج',
      items: 'بند',
      allCategories: 'جميع الفئات',
    },
    en: {
      filters: 'Advanced Filters',
      category: 'Category',
      priceRange: 'Price Range',
      minPrice: 'Min Price',
      maxPrice: 'Max Price',
      search: 'Search',
      reset: 'Reset',
      results: 'Results',
      items: 'items',
      allCategories: 'All Categories',
    },
  };

  const t = labels[language];

  return (
    <div className={`space-y-3 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:bg-card/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-primary" />
          <span className="font-semibold text-foreground">{t.filters}</span>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full font-medium">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <ChevronDown
          size={18}
          className={`text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="p-4 bg-card/50 border border-border rounded-lg space-y-4">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t.search}
            </label>
            <Input
              type="text"
              placeholder={language === 'ar' ? 'ابحث عن البند أو الوصف...' : 'Search item or description...'}
              value={filters.searchText}
              onChange={(e) =>
                setFilters({ ...filters, searchText: e.target.value })
              }
              className="w-full"
            />
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t.category}
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    category: e.target.value || null,
                  })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{t.allCategories}</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Price Range Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t.priceRange}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder={t.minPrice}
                value={filters.minPrice ?? ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    minPrice: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                min={prices.min}
                max={prices.max}
                className="w-full"
              />
              <Input
                type="number"
                placeholder={t.maxPrice}
                value={filters.maxPrice ?? ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    maxPrice: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                min={prices.min}
                max={prices.max}
                className="w-full"
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {language === 'ar'
                ? `النطاق: ${prices.min.toFixed(2)} - ${prices.max.toFixed(2)}`
                : `Range: ${prices.min.toFixed(2)} - ${prices.max.toFixed(2)}`}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <X size={16} className="mr-1" />
              {t.reset}
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              size="sm"
              className="flex-1"
            >
              {language === 'ar' ? 'تطبيق' : 'Apply'}
            </Button>
          </div>

          {/* Results Summary */}
          <div className="text-xs text-muted-foreground pt-2 border-t border-border">
            {language === 'ar'
              ? `${t.results}: ${filteredItems.length} ${t.items} من ${items.length}`
              : `${t.results}: ${filteredItems.length} ${t.items} of ${items.length}`}
          </div>
        </div>
      )}
    </div>
  );
}
