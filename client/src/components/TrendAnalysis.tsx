import { Card } from './ui/card';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from 'recharts';
import { TrendingDown, TrendingUp, Activity } from 'lucide-react';

export interface TrendData {
  period: string;
  estimated: number;
  actual?: number;
  forecast?: number;
}

interface TrendAnalysisProps {
  data: TrendData[];
  title: string;
  subtitle?: string;
}

export function TrendAnalysis({ data, title, subtitle }: TrendAnalysisProps) {
  if (data.length === 0) {
    return (
      <Card className="blueprint-card text-center py-12">
        <p className="text-muted-foreground">No trend data available</p>
      </Card>
    );
  }

  // Calculate trend direction
  const firstValue = data[0].actual || data[0].estimated;
  const lastValue = data[data.length - 1].actual || data[data.length - 1].estimated;
  const trendDirection = lastValue > firstValue ? 'up' : lastValue < firstValue ? 'down' : 'stable';
  const trendPercent = ((lastValue - firstValue) / firstValue) * 100;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-4">
      <Card className="blueprint-card">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-primary">{title}</h3>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {trendDirection === 'up' && (
              <>
                <TrendingUp className="text-green-400" size={24} />
                <span className="text-green-400 font-bold">{trendPercent.toFixed(1)}%</span>
              </>
            )}
            {trendDirection === 'down' && (
              <>
                <TrendingDown className="text-red-400" size={24} />
                <span className="text-red-400 font-bold">{trendPercent.toFixed(1)}%</span>
              </>
            )}
            {trendDirection === 'stable' && (
              <>
                <Activity className="text-yellow-400" size={24} />
                <span className="text-yellow-400 font-bold">Stable</span>
              </>
            )}
          </div>
        </div>

        {/* Composed Chart with Estimated, Actual, and Forecast */}
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 150, 200, 0.1)" />
            <XAxis dataKey="period" stroke="rgba(255, 255, 255, 0.5)" />
            <YAxis stroke="rgba(255, 255, 255, 0.5)" />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ backgroundColor: 'rgba(20, 28, 45, 0.95)', border: '1px solid rgba(100, 200, 255, 0.3)' }}
            />
            <Legend />
            <Bar dataKey="estimated" fill="#3796d0" name="Estimated" opacity={0.7} />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#64c8ff"
              strokeWidth={2}
              name="Actual"
              dot={{ fill: '#64c8ff', r: 4 }}
            />
            {data.some((d) => d.forecast !== undefined) && (
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#ffa500"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Forecast"
                dot={{ fill: '#ffa500', r: 4 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* Variance Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="blueprint-card">
          <p className="text-xs text-muted-foreground mb-2">Current Period</p>
          <p className="text-2xl font-bold text-accent">{formatCurrency(lastValue)}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {trendDirection === 'up' && <span className="text-green-400">↑ Increasing</span>}
            {trendDirection === 'down' && <span className="text-red-400">↓ Decreasing</span>}
            {trendDirection === 'stable' && <span className="text-yellow-400">→ Stable</span>}
          </p>
        </Card>

        <Card className="blueprint-card">
          <p className="text-xs text-muted-foreground mb-2">Previous Period</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(firstValue)}</p>
          <p className="text-xs text-muted-foreground mt-2">Reference point</p>
        </Card>

        <Card className="blueprint-card">
          <p className="text-xs text-muted-foreground mb-2">Change</p>
          <p className={`text-2xl font-bold ${trendDirection === 'up' ? 'text-green-400' : trendDirection === 'down' ? 'text-red-400' : 'text-yellow-400'}`}>
            {trendPercent > 0 ? '+' : ''}{trendPercent.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground mt-2">Period over period</p>
        </Card>
      </div>
    </div>
  );
}
