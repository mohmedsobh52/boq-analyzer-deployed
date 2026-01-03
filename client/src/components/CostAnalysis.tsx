import { Card } from './ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export interface CostData {
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  contingency: number;
  profitMargin: number;
}

interface CostAnalysisProps {
  data: CostData;
  totalCost: number;
}

export function CostAnalysis({ data, totalCost }: CostAnalysisProps) {
  const chartData = [
    { name: 'Material', value: data.materialCost, fill: '#64c8ff' },
    { name: 'Labor', value: data.laborCost, fill: '#3796d0' },
    { name: 'Equipment', value: data.equipmentCost, fill: '#2d6fa0' },
    { name: 'Contingency', value: data.contingency, fill: '#ffa500' },
    { name: 'Profit Margin', value: data.profitMargin, fill: '#00d084' },
  ];

  const barData = [
    {
      category: 'Costs',
      Material: data.materialCost,
      Labor: data.laborCost,
      Equipment: data.equipmentCost,
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return ((value / totalCost) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Cost Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="blueprint-card">
          <p className="text-muted-foreground text-sm mb-2">Material Cost</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(data.materialCost)}</p>
          <p className="text-xs text-muted-foreground mt-2">{formatPercent(data.materialCost)}% of total</p>
        </Card>

        <Card className="blueprint-card">
          <p className="text-muted-foreground text-sm mb-2">Labor Cost</p>
          <p className="text-2xl font-bold text-accent">{formatCurrency(data.laborCost)}</p>
          <p className="text-xs text-muted-foreground mt-2">{formatPercent(data.laborCost)}% of total</p>
        </Card>

        <Card className="blueprint-card">
          <p className="text-muted-foreground text-sm mb-2">Equipment Cost</p>
          <p className="text-2xl font-bold text-secondary">{formatCurrency(data.equipmentCost)}</p>
          <p className="text-xs text-muted-foreground mt-2">{formatPercent(data.equipmentCost)}% of total</p>
        </Card>

        <Card className="blueprint-card">
          <p className="text-muted-foreground text-sm mb-2">Contingency</p>
          <p className="text-2xl font-bold text-yellow-400">{formatCurrency(data.contingency)}</p>
          <p className="text-xs text-muted-foreground mt-2">{formatPercent(data.contingency)}% of total</p>
        </Card>

        <Card className="blueprint-card">
          <p className="text-muted-foreground text-sm mb-2">Profit Margin</p>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(data.profitMargin)}</p>
          <p className="text-xs text-muted-foreground mt-2">{formatPercent(data.profitMargin)}% of total</p>
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
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Bar Chart */}
        <Card className="blueprint-card">
          <h3 className="text-lg font-bold text-primary mb-4">Cost Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 150, 200, 0.1)" />
              <XAxis dataKey="category" stroke="rgba(255, 255, 255, 0.5)" />
              <YAxis stroke="rgba(255, 255, 255, 0.5)" />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ backgroundColor: 'rgba(20, 28, 45, 0.95)', border: '1px solid rgba(100, 200, 255, 0.3)' }}
              />
              <Legend />
              <Bar dataKey="Material" fill="#64c8ff" />
              <Bar dataKey="Labor" fill="#3796d0" />
              <Bar dataKey="Equipment" fill="#2d6fa0" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Summary */}
      <Card className="blueprint-card border-2 border-primary">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-muted-foreground text-sm mb-2">Subtotal (Material + Labor + Equipment)</p>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(data.materialCost + data.laborCost + data.equipmentCost)}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground text-sm mb-2">Total Project Cost</p>
            <p className="text-3xl font-bold text-accent glow-primary">
              {formatCurrency(totalCost)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
