import { useState, useMemo } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Button } from './ui/button';
import { BOQItem } from './BOQTable';

export interface FilterState {
  units: string[];
  categories: string[];
  priceRange: [number, number];
}

interface AdvancedFiltersProps {
  items: BOQItem[];
  onFilterChange: (filters: FilterState) => void;
  language?: 'ar' | 'en';
}

export function AdvancedFilters({
  items,
  onFilterChange,
  language = 'en',
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    units: [],
    categories: [],
    priceRange: [0, 0],
  });

  // Extract unique units and categories
  const uniqueUnits = useMemo(() => {
    const units = new Set<string>();
    items.forEach(item => {
      if (item.unit) units.add(item.unit);
    });
    return Array.from(units).sort();
  }, [items]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    items.forEach(item => {
      if (item.category) categories.add(item.category);
    });
    return Array.from(categories).sort();
  }, [items]);

  const priceStats = useMemo(() => {
    if (items.length === 0) return { min: 0, max: 0 };
    const prices = items.map(item => item.totalPrice || 0);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [items]);

  // Initialize price range on first load
  useMemo(() => {
    if (filters.priceRange[0] === 0 && filters.priceRange[1] === 0) {
      setFilters(prev => ({
        ...prev,
        priceRange: [priceStats.min, priceStats.max],
      }));
    }
  }, [priceStats]);

  const handleUnitToggle = (unit: string) => {
    const newUnits = filters.units.includes(unit)
      ? filters.units.filter(u => u !== unit)
      : [...filters.units, unit];
    
    const newFilters = { ...filters, units: newUnits };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    const newFilters = { ...filters, categories: newCategories };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePriceRangeChange = (type: 'min' | 'max', value: number) => {
    const newRange: [number, number] = [...filters.priceRange];
    if (type === 'min') {
      newRange[0] = Math.min(value, newRange[1]);
    } else {
      newRange[1] = Math.max(value, newRange[0]);
    }
    
    const newFilters = { ...filters, priceRange: newRange };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleResetFilters = () => {
    const resetFilters: FilterState = {
      units: [],
      categories: [],
      priceRange: [priceStats.min, priceStats.max],
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const activeFilterCount =
    filters.units.length + filters.categories.length;

  const labels = {
    en: {
      filters: 'Advanced Filters',
      units: 'Units',
      categories: 'Categories',
      priceRange: 'Price Range',
      reset: 'Reset Filters',
      noUnits: 'No units available',
      noCategories: 'No categories available',
      from: 'From',
      to: 'To',
      activeFilters: 'Active Filters',
    },
    ar: {
      filters: 'فلاتر متقدمة',
      units: 'الوحدات',
      categories: 'الفئات',
      priceRange: 'نطاق السعر',
      reset: 'إعادة تعيين الفلاتر',
      noUnits: 'لا توجد وحدات متاحة',
      noCategories: 'لا توجد فئات متاحة',
      from: 'من',
      to: 'إلى',
      activeFilters: 'الفلاتر النشطة',
    },
  };

  const t = labels[language] || labels.en;

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-primary rounded-lg flex items-center justify-between hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🔍</span>
          <span className="font-bold text-cyan-400">{t.filters}</span>
          {activeFilterCount > 0 && (
            <span className="ml-2 px-2 py-1 bg-accent rounded-full text-xs font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </div>
        <ChevronDown
          size={20}
          className={`text-cyan-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="p-4 bg-card border border-border rounded-lg space-y-6">
          {/* Units Filter */}
          <div>
            <h3 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
              <span>📏</span>
              {t.units}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {uniqueUnits.length > 0 ? (
                uniqueUnits.map(unit => (
                  <label
                    key={unit}
                    className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-primary/10 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filters.units.includes(unit)}
                      onChange={() => handleUnitToggle(unit)}
                      className="w-4 h-4 rounded border-primary cursor-pointer"
                    />
                    <span className="text-sm text-foreground">{unit}</span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-muted-foreground col-span-full">
                  {t.noUnits}
                </p>
              )}
            </div>
          </div>

          {/* Categories Filter */}
          <div>
            <h3 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
              <span>🏷️</span>
              {t.categories}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {uniqueCategories.length > 0 ? (
                uniqueCategories.map(category => (
                  <label
                    key={category}
                    className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-primary/10 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                      className="w-4 h-4 rounded border-primary cursor-pointer"
                    />
                    <span className="text-sm text-foreground truncate">
                      {category}
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-muted-foreground col-span-full">
                  {t.noCategories}
                </p>
              )}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <h3 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
              <span>💰</span>
              {t.priceRange}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">
                    {t.from}
                  </label>
                  <input
                    type="number"
                    value={Math.round(filters.priceRange[0])}
                    onChange={(e) =>
                      handlePriceRangeChange('min', Number(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">
                    {t.to}
                  </label>
                  <input
                    type="number"
                    value={Math.round(filters.priceRange[1])}
                    onChange={(e) =>
                      handlePriceRangeChange('max', Number(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-foreground"
                  />
                </div>
              </div>

              {/* Price Range Sliders */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Min:</span>
                  <input
                    type="range"
                    min={priceStats.min}
                    max={priceStats.max}
                    value={filters.priceRange[0]}
                    onChange={(e) =>
                      handlePriceRangeChange('min', Number(e.target.value))
                    }
                    className="flex-1 h-2 bg-border rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Max:</span>
                  <input
                    type="range"
                    min={priceStats.min}
                    max={priceStats.max}
                    value={filters.priceRange[1]}
                    onChange={(e) =>
                      handlePriceRangeChange('max', Number(e.target.value))
                    }
                    className="flex-1 h-2 bg-border rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          {activeFilterCount > 0 && (
            <Button
              onClick={handleResetFilters}
              variant="outline"
              className="w-full text-destructive border-destructive hover:bg-destructive/10"
            >
              <X size={16} className="mr-2" />
              {t.reset}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
