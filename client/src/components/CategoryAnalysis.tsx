import { Card } from './ui/card';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface CategoryData {
  category: string;
  totalCost: number;
  percentage: number;
  itemCount: number;
  averageUnitPrice: number;
}

interface CategoryAnalysisProps {
  data: CategoryData[];
  title: string;
}

export function CategoryAnalysis({ data, title }: CategoryAnalysisProps) {
  if (data.length === 0) {
    return (
      <Card className="blueprint-card text-center py-12">
        <p className="text-muted-foreground">No category data available</p>
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

  const COLORS = [
    '#64c8ff',
    '#3796d0',
    '#2d6fa0',
    '#ffa500',
    '#ff6b6b',
    '#00d084',
    '#a78bfa',
    '#f472b6',
  ];

  const totalCost = data.reduce((sum, item) => sum + item.totalCost, 0);
  const topCategory = data.reduce((max, cat) => (cat.totalCost > max.totalCost ? cat : max));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="blueprint-card">
          <p className="text-xs text-muted-foreground mb-2">Total Categories</p>
          <p className="text-3xl font-bold text-primary">{data.length}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {data.reduce((sum, item) => sum + item.itemCount, 0)} items total
          </p>
        </Card>

        <Card className="blueprint-card">
          <p className="text-xs text-muted-foreground mb-2">Total Cost</p>
          <p className="text-3xl font-bold text-accent">{formatCurrency(totalCost)}</p>
          <p className="text-xs text-muted-foreground mt-2">Across all categories</p>
        </Card>

        <Card className="blueprint-card">
          <p className="text-xs text-muted-foreground mb-2">Top Category</p>
          <p className="text-lg font-bold text-primary">{topCategory.category}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {topCategory.percentage.toFixed(1)}% of total cost
          </p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card className="blueprint-card">
          <h3 className="text-lg font-bold text-primary mb-4">Cost Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percentage }) => `${category}: ${percentage.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="totalCost"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Bar Chart */}
        <Card className="blueprint-card">
          <h3 className="text-lg font-bold text-primary mb-4">Cost by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 150, 200, 0.1)" />
              <XAxis dataKey="category" stroke="rgba(255, 255, 255, 0.5)" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="rgba(255, 255, 255, 0.5)" />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'rgba(20, 28, 45, 0.95)',
                  border: '1px solid rgba(100, 200, 255, 0.3)',
                }}
              />
              <Bar dataKey="totalCost" fill="#64c8ff" name="Total Cost">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="blueprint-card">
        <h3 className="text-lg font-bold text-primary mb-4">{title}</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Total Cost</th>
                <th>% of Total</th>
                <th>Item Count</th>
                <th>Avg Unit Price</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={idx}>
                  <td className="text-primary font-bold">{item.category}</td>
                  <td className="text-right text-accent font-bold">{formatCurrency(item.totalCost)}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-card rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-primary">{item.percentage.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="text-right">{item.itemCount}</td>
                  <td className="text-right">{formatCurrency(item.averageUnitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Insights */}
      <Card className="blueprint-card border-l-4 border-primary">
        <h4 className="font-bold text-primary mb-3">Category Insights</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            • <strong>{topCategory.category}</strong> is the largest cost driver at{' '}
            <strong className="text-accent">{topCategory.percentage.toFixed(1)}%</strong>
          </li>
          <li>
            • Average cost per category is{' '}
            <strong>{formatCurrency(totalCost / data.length)}</strong>
          </li>
          <li>
            • {data.filter((d) => d.percentage > 20).length} categories represent more than 20% of costs
          </li>
          <li>
            • Consider consolidating or negotiating with suppliers for high-cost categories
          </li>
        </ul>
      </Card>
    </div>
  );
}
