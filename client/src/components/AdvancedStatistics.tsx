import React, { useMemo } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  calculateStatistics,
  identifyOutliers,
  type BOQItem,
} from '@/lib/pdfDataMapper';

interface AdvancedStatisticsProps {
  items: BOQItem[];
  language: 'ar' | 'en';
}

export function AdvancedStatistics({
  items,
  language,
}: AdvancedStatisticsProps) {
  const stats = useMemo(() => calculateStatistics(items), [items]);
  const outliers = useMemo(() => identifyOutliers(items, 2), [items]);

  const labels = {
    ar: {
      statistics: 'الإحصائيات المتقدمة',
      prices: 'الأسعار',
      quantities: 'الكميات',
      minPrice: 'الحد الأدنى',
      maxPrice: 'الحد الأقصى',
      avgPrice: 'المتوسط',
      medianPrice: 'الوسيط',
      stdDev: 'الانحراف المعياري',
      minQty: 'الحد الأدنى',
      maxQty: 'الحد الأقصى',
      avgQty: 'المتوسط',
      outliers: 'البنود الشاذة',
      priceOutlier: 'سعر شاذ',
      qtyOutlier: 'كمية شاذة',
      noOutliers: 'لا توجد بنود شاذة',
      warning: 'تحذير',
    },
    en: {
      statistics: 'Advanced Statistics',
      prices: 'Prices',
      quantities: 'Quantities',
      minPrice: 'Min Price',
      maxPrice: 'Max Price',
      avgPrice: 'Average',
      medianPrice: 'Median',
      stdDev: 'Std Dev',
      minQty: 'Min Qty',
      maxQty: 'Max Qty',
      avgQty: 'Average',
      outliers: 'Outliers',
      priceOutlier: 'Price Outlier',
      qtyOutlier: 'Qty Outlier',
      noOutliers: 'No outliers detected',
      warning: 'Warning',
    },
  };

  const t = labels[language];

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <h3 className="text-lg font-bold text-primary flex items-center gap-2">
        <BarChart3 size={20} />
        {t.statistics}
      </h3>

      {/* Price Statistics */}
      <Card className="p-4 bg-card/50 border border-border">
        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-cyan-400" />
          {t.prices}
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatItem
            label={t.minPrice}
            value={`$${stats.minPrice.toFixed(2)}`}
            color="text-green-400"
          />
          <StatItem
            label={t.maxPrice}
            value={`$${stats.maxPrice.toFixed(2)}`}
            color="text-red-400"
          />
          <StatItem
            label={t.avgPrice}
            value={`$${stats.avgPrice.toFixed(2)}`}
            color="text-blue-400"
          />
          <StatItem
            label={t.medianPrice}
            value={`$${stats.medianPrice.toFixed(2)}`}
            color="text-purple-400"
          />
          <StatItem
            label={t.stdDev}
            value={`$${stats.stdDevPrice.toFixed(2)}`}
            color="text-yellow-400"
          />
          <StatItem
            label={language === 'ar' ? 'النطاق' : 'Range'}
            value={`$${(stats.maxPrice - stats.minPrice).toFixed(2)}`}
            color="text-orange-400"
          />
        </div>
      </Card>

      {/* Quantity Statistics */}
      <Card className="p-4 bg-card/50 border border-border">
        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <TrendingDown size={16} className="text-cyan-400" />
          {t.quantities}
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatItem
            label={t.minQty}
            value={stats.minQty.toFixed(2)}
            color="text-green-400"
          />
          <StatItem
            label={t.maxQty}
            value={stats.maxQty.toFixed(2)}
            color="text-red-400"
          />
          <StatItem
            label={t.avgQty}
            value={stats.avgQty.toFixed(2)}
            color="text-blue-400"
          />
          <StatItem
            label={language === 'ar' ? 'الوسيط' : 'Median'}
            value={(stats.minQty + stats.maxQty) / 2}
            color="text-purple-400"
          />
          <StatItem
            label={t.stdDev}
            value={stats.stdDevQty.toFixed(2)}
            color="text-yellow-400"
          />
          <StatItem
            label={language === 'ar' ? 'النطاق' : 'Range'}
            value={`${(stats.maxQty - stats.minQty).toFixed(2)}`}
            color="text-orange-400"
          />
        </div>
      </Card>

      {/* Outliers */}
      {outliers.length > 0 && (
        <Card className="p-4 bg-red-950/20 border border-red-500/30 rounded-lg">
          <h4 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} />
            {t.outliers} ({outliers.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {outliers.map((outlier, idx) => (
              <div
                key={idx}
                className="p-2 bg-background/50 border border-red-500/20 rounded text-sm"
              >
                <div className="font-medium text-foreground">
                  {outlier.item.itemCode} - {outlier.item.description}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {outlier.type === 'price'
                    ? `${t.priceOutlier}: $${outlier.item.unitPrice.toFixed(2)} (${outlier.deviation.toFixed(1)}σ)`
                    : `${t.qtyOutlier}: ${outlier.item.quantity} (${outlier.deviation.toFixed(1)}σ)`}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* No Outliers Message */}
      {outliers.length === 0 && items.length > 0 && (
        <Card className="p-4 bg-green-950/20 border border-green-500/30">
          <div className="text-sm text-green-400">✓ {t.noOutliers}</div>
        </Card>
      )}
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: string | number;
  color: string;
}

function StatItem({ label, value, color }: StatItemProps) {
  return (
    <div className="p-2 bg-background/50 rounded border border-border/50">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-sm font-bold ${color}`}>
        {typeof value === 'number' ? value.toFixed(2) : value}
      </div>
    </div>
  );
}
