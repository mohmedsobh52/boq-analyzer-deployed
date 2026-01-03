import { useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import type { CategoryData } from '@/components/CategoryAnalysis';
import type { VarianceData } from '@/components/VarianceAnalysis';

export interface AnalyticsDataResult {
  isLoading: boolean;
  error: unknown | null;
  categoryData: CategoryData[];
  varianceData: VarianceData[];
  totalEstimated: number;
  totalActual: number;
  totalVariance: number;
  variancePercent: number;
  itemCount: number;
}

export function useAnalyticsData(projectId: number | null): AnalyticsDataResult {
  const { data: projectData, isLoading: projectLoading, error: projectError } = trpc.analytics.projectData.useQuery(
    projectId !== null ? { projectId } : (undefined as any)
  ) as any;

  const { data: costData, isLoading: costLoading, error: costError } = trpc.analytics.costs.useQuery(
    projectId !== null ? { projectId } : (undefined as any)
  ) as any;

  const { data: categoryData, isLoading: categoryLoading, error: categoryError } = trpc.analytics.costByCategory.useQuery(
    projectId !== null ? { projectId } : (undefined as any)
  ) as any;

  const isLoading = projectLoading || costLoading || categoryLoading;
  const error = projectError || costError || categoryError;

  const result = useMemo(() => {
    if (!projectData || !costData || !categoryData) {
      return {
        isLoading,
        error,
        categoryData: [],
        varianceData: [],
        totalEstimated: 0,
        totalActual: 0,
        totalVariance: 0,
        variancePercent: 0,
        itemCount: 0,
      };
    }

    const items = (projectData as any)?.items || [];
    const totalEstimated = (costData as any)?.totalCost || 0;
    const totalActual = totalEstimated * 1.02; // Simulate 2% variance
    const totalVariance = totalActual - totalEstimated;
    const variancePercent = totalEstimated > 0 ? (totalVariance / totalEstimated) * 100 : 0;

    // Transform category data
    const transformedCategoryData: CategoryData[] = (categoryData || []).map((cat: any) => ({
      category: cat.category,
      totalCost: cat.totalCost,
      percentage: cat.percentage,
      itemCount: cat.itemCount,
      averageUnitPrice: cat.averageUnitPrice,
    }));

    // Create variance data from category data
    const transformedVarianceData: VarianceData[] = (categoryData || []).map((cat: any) => {
      const estimated = cat.totalCost / 1.02; // Reverse the 2% variance
      const actual = cat.totalCost;
      const variance = actual - estimated;
      const variancePercent = estimated > 0 ? (variance / estimated) * 100 : 0;

      return {
        category: cat.category,
        estimated,
        actual,
        variance,
        variancePercent,
        status: variancePercent > 5 ? 'over' : variancePercent < -5 ? 'under' : 'on-budget',
      };
    });

    return {
      isLoading,
      error,
      categoryData: transformedCategoryData,
      varianceData: transformedVarianceData,
      totalEstimated,
      totalActual,
      totalVariance,
      variancePercent,
      itemCount: items.length,
    };
  }, [projectData, costData, categoryData, isLoading, error]);

  return result;
}
