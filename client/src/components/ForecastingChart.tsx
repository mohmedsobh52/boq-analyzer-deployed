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
  ReferenceLine,
} from 'recharts';
import { AlertCircle, CheckCircle, Zap } from 'lucide-react';

export interface ForecastData {
  period: string;
  actual?: number;
  forecast: number;
  upper?: number;
  lower?: number;
  isHistorical: boolean;
}

interface ForecastingChartProps {
  data: ForecastData[];
  title: string;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  nextValue: number;
}

export function ForecastingChart({
  data,
  title,
  confidence,
  trend,
  nextValue,
}: ForecastingChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const confidencePercent = (confidence * 100).toFixed(1);
  const confidenceColor =
    confidence > 0.8 ? 'text-green-400' : confidence > 0.6 ? 'text-yellow-400' : 'text-red-400';
  const confidenceIcon =
    confidence > 0.8 ? (
      <CheckCircle size={20} />
    ) : confidence > 0.6 ? (
      <AlertCircle size={20} />
    ) : (
      <Zap size={20} />
    );

  return (
    <div className="space-y-4">
      <Card className="blueprint-card">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-primary">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Forecast with {confidencePercent}% confidence
            </p>
          </div>
          <div className={`flex items-center gap-2 ${confidenceColor}`}>
            {confidenceIcon}
            <span className="font-bold">{confidencePercent}%</span>
          </div>
        </div>

        {/* Area Chart with Confidence Intervals */}
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#64c8ff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#64c8ff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffa500" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ffa500" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 150, 200, 0.1)" />
            <XAxis dataKey="period" stroke="rgba(255, 255, 255, 0.5)" />
            <YAxis stroke="rgba(255, 255, 255, 0.5)" />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: 'rgba(20, 28, 45, 0.95)',
                border: '1px solid rgba(100, 200, 255, 0.3)',
              }}
            />
            <Legend />

            {/* Confidence Interval Area */}
            {data.some((d) => d.upper !== undefined) && (
              <Area
                type="monotone"
                dataKey="upper"
                fill="url(#colorConfidence)"
                stroke="none"
                name="Upper Bound"
              />
            )}

            {/* Actual Data */}
            <Area
              type="monotone"
              dataKey="actual"
              fill="url(#colorForecast)"
              stroke="#64c8ff"
              strokeWidth={2}
              name="Actual"
            />

            {/* Forecast Line */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#ffa500"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Forecast"
              dot={{ fill: '#ffa500', r: 4 }}
            />

            {/* Lower Bound */}
            {data.some((d) => d.lower !== undefined) && (
              <Line
                type="monotone"
                dataKey="lower"
                stroke="rgba(255, 165, 0, 0.3)"
                strokeWidth={1}
                strokeDasharray="3 3"
                name="Lower Bound"
              />
            )}

            {/* Divider between historical and forecast */}
            <ReferenceLine
              x={data.findIndex((d) => !d.isHistorical) - 0.5}
              stroke="rgba(100, 200, 255, 0.3)"
              strokeDasharray="5 5"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Forecast Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="blueprint-card">
          <p className="text-xs text-muted-foreground mb-2">Next Period Forecast</p>
          <p className="text-2xl font-bold text-accent">{formatCurrency(nextValue)}</p>
          <p className={`text-xs mt-2 ${trend === 'increasing' ? 'text-green-400' : trend === 'decreasing' ? 'text-red-400' : 'text-yellow-400'}`}>
            {trend === 'increasing' && '📈 Increasing trend'}
            {trend === 'decreasing' && '📉 Decreasing trend'}
            {trend === 'stable' && '➡️ Stable trend'}
          </p>
        </Card>

        <Card className="blueprint-card">
          <p className="text-xs text-muted-foreground mb-2">Confidence Level</p>
          <p className={`text-2xl font-bold ${confidenceColor}`}>{confidencePercent}%</p>
          <p className="text-xs text-muted-foreground mt-2">
            {confidence > 0.8 && 'High confidence'}
            {confidence > 0.6 && confidence <= 0.8 && 'Medium confidence'}
            {confidence <= 0.6 && 'Low confidence'}
          </p>
        </Card>

        <Card className="blueprint-card">
          <p className="text-xs text-muted-foreground mb-2">Forecast Range</p>
          <p className="text-2xl font-bold text-primary">
            ±{((nextValue * (1 - confidence)) / 100).toFixed(0)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Expected variance</p>
        </Card>
      </div>

      {/* Insights */}
      <Card className="blueprint-card border-l-4 border-primary">
        <h4 className="font-bold text-primary mb-3">Forecast Insights</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            • The forecast shows a <strong>{trend}</strong> trend based on historical data
          </li>
          <li>
            • Confidence level is <strong>{confidencePercent}%</strong>, indicating{' '}
            {confidence > 0.8 ? 'strong' : confidence > 0.6 ? 'moderate' : 'weak'} prediction accuracy
          </li>
          <li>
            • The shaded area represents the confidence interval around the forecast
          </li>
          <li>• Monitor actual values against forecast to validate model accuracy</li>
        </ul>
      </Card>
    </div>
  );
}
