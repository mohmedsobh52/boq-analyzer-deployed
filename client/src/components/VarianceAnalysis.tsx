import { Card } from './ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ScatterChart,
  Scatter,
} from 'recharts';
import { AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';

export interface VarianceData {
  category: string;
  estimated: number;
  actual: number;
  variance: number;
  variancePercent: number;
  status: 'over' | 'under' | 'on-budget';
}

interface VarianceAnalysisProps {
  data: VarianceData[];
  title: string;
}

export function VarianceAnalysis({ data, title }: VarianceAnalysisProps) {
  if (data.length === 0) {
    return (
      <Card className="blueprint-card text-center py-12">
        <p className="text-muted-foreground">No variance data available</p>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Calculate totals
  const totalEstimated = data.reduce((sum, item) => sum + item.estimated, 0);
  const totalActual = data.reduce((sum, item) => sum + item.actual, 0);
  const totalVariance = totalActual - totalEstimated;
  const totalVariancePercent = (totalVariance / totalEstimated) * 100;

  // Count status
  const overBudget = data.filter((d) => d.status === 'over').length;
  const underBudget = data.filter((d) => d.status === 'under').length;
  const onBudget = data.filter((d) => d.status === 'on-budget').length;

  // Get color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over':
        return '#ff4444';
      case 'under':
        return '#44ff44';
      case 'on-budget':
        return '#ffaa00';
      default:
        return '#64c8ff';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'over':
        return <AlertTriangle size={16} className="text-red-400" />;
      case 'under':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'on-budget':
        return <TrendingDown size={16} className="text-yellow-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="blueprint-card">
          <p className="text-xs text-muted-foreground mb-2">Total Estimated</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(totalEstimated)}</p>
        </Card>

        <Card className="blueprint-card">
          <p className="text-xs text-muted-foreground mb-2">Total Actual</p>
          <p className="text-2xl font-bold text-accent">{formatCurrency(totalActual)}</p>
        </Card>

        <Card className={`blueprint-card ${totalVariance > 0 ? 'border-red-400/30' : 'border-green-400/30'}`}>
          <p className="text-xs text-muted-foreground mb-2">Total Variance</p>
          <p className={`text-2xl font-bold ${totalVariance > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {totalVariance > 0 ? '+' : ''}{formatCurrency(totalVariance)}
          </p>
          <p className={`text-xs mt-2 ${totalVariance > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {totalVariancePercent > 0 ? '+' : ''}{totalVariancePercent.toFixed(1)}%
          </p>
        </Card>

        <Card className="blueprint-card">
          <p className="text-xs text-muted-foreground mb-2">Status Distribution</p>
          <div className="flex gap-2 mt-2">
            <div className="text-center flex-1">
              <p className="text-lg font-bold text-red-400">{overBudget}</p>
              <p className="text-xs text-muted-foreground">Over</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-lg font-bold text-yellow-400">{onBudget}</p>
              <p className="text-xs text-muted-foreground">On</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-lg font-bold text-green-400">{underBudget}</p>
              <p className="text-xs text-muted-foreground">Under</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Variance Chart */}
      <Card className="blueprint-card">
        <h3 className="text-lg font-bold text-primary mb-4">{title}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 150, 200, 0.1)" />
            <XAxis dataKey="category" stroke="rgba(255, 255, 255, 0.5)" />
            <YAxis stroke="rgba(255, 255, 255, 0.5)" />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: 'rgba(20, 28, 45, 0.95)',
                border: '1px solid rgba(100, 200, 255, 0.3)',
              }}
            />
            <Legend />
            <Bar dataKey="estimated" fill="#3796d0" name="Estimated" opacity={0.7} />
            <Bar dataKey="actual" fill="#64c8ff" name="Actual" opacity={0.9} />
            <Bar dataKey="variance" name="Variance">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Detailed Variance Table */}
      <Card className="blueprint-card">
        <h3 className="text-lg font-bold text-primary mb-4">Category Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Estimated</th>
                <th>Actual</th>
                <th>Variance</th>
                <th>%</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={idx}>
                  <td className="text-primary font-bold">{item.category}</td>
                  <td className="text-right">{formatCurrency(item.estimated)}</td>
                  <td className="text-right text-accent">{formatCurrency(item.actual)}</td>
                  <td className={`text-right font-bold ${item.variance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {item.variance > 0 ? '+' : ''}{formatCurrency(item.variance)}
                  </td>
                  <td className={`text-right font-bold ${item.variancePercent > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {item.variancePercent > 0 ? '+' : ''}{item.variancePercent.toFixed(1)}%
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className={`status-badge status-${item.status}`}>
                        {item.status}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Insights */}
      <Card className="blueprint-card border-l-4 border-primary">
        <h4 className="font-bold text-primary mb-3">Variance Insights</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            • Overall variance is{' '}
            <strong className={totalVariance > 0 ? 'text-red-400' : 'text-green-400'}>
              {totalVariance > 0 ? 'over' : 'under'} budget by {formatCurrency(Math.abs(totalVariance))}
            </strong>
          </li>
          <li>
            • <strong className="text-red-400">{overBudget}</strong> categories are over budget
          </li>
          <li>
            • <strong className="text-green-400">{underBudget}</strong> categories are under budget
          </li>
          <li>
            • {totalVariancePercent > 0 ? 'Costs are increasing' : 'Costs are decreasing'} at{' '}
            <strong>{Math.abs(totalVariancePercent).toFixed(1)}%</strong> variance rate
          </li>
        </ul>
      </Card>
    </div>
  );
}
