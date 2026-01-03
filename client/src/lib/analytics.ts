/**
 * Analytics utilities for BOQ data analysis
 * Includes forecasting, trend analysis, and statistical calculations
 */

export interface TrendDataPoint {
  date: Date;
  value: number;
  label: string;
}

export interface ForecastResult {
  actual: number[];
  forecast: number[];
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  nextValue: number;
}

export interface CategoryAnalysis {
  category: string;
  totalCost: number;
  percentage: number;
  itemCount: number;
  averageUnitPrice: number;
}

export interface VarianceAnalysis {
  category: string;
  estimated: number;
  actual: number;
  variance: number;
  variancePercent: number;
  status: 'over' | 'under' | 'on-budget';
}

export interface TrendAnalysis {
  period: string;
  value: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

/**
 * Simple Linear Regression for forecasting
 * y = mx + b
 */
export function linearRegression(data: number[]): { slope: number; intercept: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0] || 0 };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/**
 * Forecast future values using linear regression
 */
export function forecastValues(
  data: number[],
  periods: number = 3
): ForecastResult {
  if (data.length < 2) {
    return {
      actual: data,
      forecast: data,
      confidence: 0,
      trend: 'stable',
      nextValue: data[0] || 0,
    };
  }

  const { slope, intercept } = linearRegression(data);

  // Generate forecast
  const forecast: number[] = [];
  for (let i = 0; i < periods; i++) {
    const x = data.length + i;
    const y = slope * x + intercept;
    forecast.push(Math.max(0, y)); // Ensure non-negative values
  }

  // Calculate confidence (R-squared)
  const meanY = data.reduce((a, b) => a + b, 0) / data.length;
  let ssRes = 0;
  let ssTot = 0;

  for (let i = 0; i < data.length; i++) {
    const predicted = slope * i + intercept;
    ssRes += Math.pow(data[i] - predicted, 2);
    ssTot += Math.pow(data[i] - meanY, 2);
  }

  const confidence = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  // Determine trend
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (slope > 0.01) trend = 'increasing';
  else if (slope < -0.01) trend = 'decreasing';

  return {
    actual: data,
    forecast,
    confidence: Math.max(0, Math.min(1, confidence)),
    trend,
    nextValue: forecast[0] || data[data.length - 1],
  };
}

/**
 * Calculate category-wise cost analysis
 */
export function analyzeCostByCategory(
  items: Array<{ category?: string; totalPrice: number }>
): CategoryAnalysis[] {
  const categoryMap = new Map<string, { total: number; count: number; prices: number[] }>();

  items.forEach((item) => {
    const category = item.category || 'Uncategorized';
    const existing = categoryMap.get(category) || { total: 0, count: 0, prices: [] };
    existing.total += item.totalPrice;
    existing.count += 1;
    existing.prices.push(item.totalPrice);
    categoryMap.set(category, existing);
  });

  const totalCost = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    totalCost: data.total,
    percentage: totalCost > 0 ? (data.total / totalCost) * 100 : 0,
    itemCount: data.count,
    averageUnitPrice: data.total / data.count,
  }));
}

/**
 * Calculate variance between estimated and actual costs
 */
export function calculateVariance(
  estimated: number,
  actual: number
): VarianceAnalysis {
  const variance = actual - estimated;
  const variancePercent = estimated > 0 ? (variance / estimated) * 100 : 0;

  let status: 'over' | 'under' | 'on-budget' = 'on-budget';
  if (variancePercent > 5) status = 'over';
  else if (variancePercent < -5) status = 'under';

  return {
    category: 'Overall',
    estimated,
    actual,
    variance,
    variancePercent,
    status,
  };
}

/**
 * Calculate trend analysis for time series data
 */
export function calculateTrend(
  current: number,
  previous: number,
  period: string
): TrendAnalysis {
  const change = current - previous;
  const changePercent = previous > 0 ? (change / previous) * 100 : 0;

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (changePercent > 2) trend = 'up';
  else if (changePercent < -2) trend = 'down';

  return {
    period,
    value: current,
    change,
    changePercent,
    trend,
  };
}

/**
 * Calculate moving average for smoothing trends
 */
export function movingAverage(data: number[], windowSize: number = 3): number[] {
  const result: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(data.length, i + Math.ceil(windowSize / 2));
    const window = data.slice(start, end);
    const avg = window.reduce((a, b) => a + b, 0) / window.length;
    result.push(avg);
  }

  return result;
}

/**
 * Calculate statistical summary
 */
export function calculateStatistics(data: number[]) {
  if (data.length === 0) {
    return {
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      variance: 0,
    };
  }

  const sorted = [...data].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mean = data.reduce((a, b) => a + b, 0) / data.length;

  const median =
    data.length % 2 === 0
      ? (sorted[data.length / 2 - 1] + sorted[data.length / 2]) / 2
      : sorted[Math.floor(data.length / 2)];

  const variance =
    data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);

  return { min, max, mean, median, stdDev, variance };
}

/**
 * Identify outliers using IQR method
 */
export function identifyOutliers(data: number[]): { outliers: number[]; indices: number[] } {
  if (data.length < 4) return { outliers: [], indices: [] };

  const sorted = [...data].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outliers: number[] = [];
  const indices: number[] = [];

  data.forEach((value, index) => {
    if (value < lowerBound || value > upperBound) {
      outliers.push(value);
      indices.push(index);
    }
  });

  return { outliers, indices };
}

/**
 * Calculate cost efficiency metrics
 */
export function calculateEfficiency(
  items: Array<{ quantity: number; unitPrice: number; totalPrice: number }>
) {
  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalCost = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const averageCostPerItem = totalCost / totalItems;
  const costPerUnit = totalCost / totalQuantity;

  return {
    totalItems,
    totalQuantity,
    totalCost,
    averageCostPerItem,
    costPerUnit,
  };
}

/**
 * Generate insights from BOQ data
 */
export function generateInsights(
  items: Array<{
    category?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>
) {
  const insights: string[] = [];

  if (items.length === 0) {
    insights.push('No data available for analysis');
    return insights;
  }

  // Cost analysis
  const totalCost = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const avgCost = totalCost / items.length;
  const stats = calculateStatistics(items.map((i) => i.totalPrice));

  if (stats.stdDev > avgCost * 0.5) {
    insights.push('High cost variance detected. Consider reviewing high-cost items.');
  }

  // Category analysis
  const categories = analyzeCostByCategory(items);
  const topCategory = categories.reduce((max, cat) =>
    cat.totalCost > max.totalCost ? cat : max
  );

  if (topCategory.percentage > 40) {
    insights.push(
      `${topCategory.category} represents ${topCategory.percentage.toFixed(1)}% of total cost. Consider negotiating bulk discounts.`
    );
  }

  // Outlier detection
  const { outliers } = identifyOutliers(items.map((i) => i.totalPrice));
  if (outliers.length > 0) {
    insights.push(
      `${outliers.length} high-value items identified. Review specifications and pricing.`
    );
  }

  // Unit price analysis
  const unitPrices = items.map((i) => i.unitPrice);
  const priceStats = calculateStatistics(unitPrices);
  if (priceStats.stdDev > priceStats.mean * 0.3) {
    insights.push('Significant variation in unit prices. Consider standardization.');
  }

  return insights;
}
