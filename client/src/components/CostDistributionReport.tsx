import React, { useMemo } from 'react';
import { PieChart, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getCostDistribution, type BOQItem } from '@/lib/pdfDataMapper';

interface CostDistributionReportProps {
  items: BOQItem[];
  language: 'ar' | 'en';
}

export function CostDistributionReport({
  items,
  language,
}: CostDistributionReportProps) {
  const distribution = useMemo(() => getCostDistribution(items), [items]);

  const labels = {
    ar: {
      costDistribution: 'توزيع التكاليف',
      category: 'الفئة',
      items: 'البنود',
      totalCost: 'الإجمالي',
      percentage: 'النسبة',
      noData: 'لا توجد بيانات',
    },
    en: {
      costDistribution: 'Cost Distribution',
      category: 'Category',
      items: 'Items',
      totalCost: 'Total Cost',
      percentage: 'Percentage',
      noData: 'No data available',
    },
  };

  const t = labels[language];

  if (items.length === 0) {
    return null;
  }

  const categories = Object.entries(distribution).sort(
    (a, b) => b[1].totalCost - a[1].totalCost
  );

  // Generate colors for categories
  const colors = [
    'bg-cyan-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500',
  ];

  const totalCost = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className={`space-y-4 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <h3 className="text-lg font-bold text-primary flex items-center gap-2">
        <PieChart size={20} />
        {t.costDistribution}
      </h3>

      {categories.length === 0 ? (
        <Card className="p-4 bg-card/50 border border-border text-center text-muted-foreground">
          {t.noData}
        </Card>
      ) : (
        <>
          {/* Distribution Chart */}
          <Card className="p-4 bg-card/50 border border-border">
            <div className="space-y-3">
              {categories.map(([category, data], idx) => {
                const color = colors[idx % colors.length];
                const barWidth = (data.percentage / 100) * 100;

                return (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${color}`}></div>
                        <span className="font-medium text-foreground">
                          {category}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {data.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-6 bg-background/50 rounded-full overflow-hidden border border-border/30">
                      <div
                        className={`h-full ${color} transition-all duration-300 flex items-center justify-end pr-2`}
                        style={{ width: `${barWidth}%` }}
                      >
                        {barWidth > 15 && (
                          <span className="text-xs font-bold text-white">
                            ${data.totalCost.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Detailed Table */}
          <Card className="p-4 bg-card/50 border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-2 font-semibold text-foreground">
                    {t.category}
                  </th>
                  <th className="text-center py-2 px-2 font-semibold text-foreground">
                    {t.items}
                  </th>
                  <th className="text-right py-2 px-2 font-semibold text-foreground">
                    {t.totalCost}
                  </th>
                  <th className="text-right py-2 px-2 font-semibold text-foreground">
                    {t.percentage}
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map(([category, data], idx) => {
                  const color = colors[idx % colors.length];
                  return (
                    <tr
                      key={category}
                      className="border-b border-border/30 hover:bg-background/30 transition-colors"
                    >
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${color}`}></div>
                          <span className="text-foreground">{category}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center text-muted-foreground">
                        {data.count}
                      </td>
                      <td className="py-2 px-2 text-right font-semibold text-cyan-400">
                        ${data.totalCost.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${color} text-white`}>
                          {data.percentage.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {/* Total Row */}
                <tr className="border-t-2 border-primary bg-primary/10">
                  <td className="py-2 px-2 font-bold text-foreground">
                    {language === 'ar' ? 'الإجمالي' : 'Total'}
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-foreground">
                    {items.length}
                  </td>
                  <td className="py-2 px-2 text-right font-bold text-primary">
                    ${totalCost.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-2 px-2 text-right font-bold text-primary">
                    100%
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SummaryCard
              label={language === 'ar' ? 'الفئات' : 'Categories'}
              value={categories.length.toString()}
              icon={<BarChart3 size={18} />}
            />
            <SummaryCard
              label={language === 'ar' ? 'إجمالي البنود' : 'Total Items'}
              value={items.length.toString()}
              icon={<BarChart3 size={18} />}
            />
            <SummaryCard
              label={language === 'ar' ? 'إجمالي التكلفة' : 'Total Cost'}
              value={`$${totalCost.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              icon={<BarChart3 size={18} />}
            />
          </div>
        </>
      )}
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

function SummaryCard({ label, value, icon }: SummaryCardProps) {
  return (
    <Card className="p-3 bg-card/50 border border-border">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-lg font-bold text-primary mt-1">{value}</div>
        </div>
        <div className="text-cyan-400 opacity-50">{icon}</div>
      </div>
    </Card>
  );
}
