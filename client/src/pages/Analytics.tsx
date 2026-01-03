import { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { TrendAnalysis } from '@/components/TrendAnalysis';
import { ForecastingChart } from '@/components/ForecastingChart';
import { VarianceAnalysis } from '@/components/VarianceAnalysis';
import { CategoryAnalysis } from '@/components/CategoryAnalysis';
import { ExportHistory } from '@/components/ExportHistory';
import { Download, Filter, Calendar, Loader } from 'lucide-react';
import { forecastValues, analyzeCostByCategory, generateInsights } from '@/lib/analytics';
import { ExportDialog } from '@/components/ExportDialog';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { trpc } from '@/lib/trpc';

export default function Analytics() {
  const { t, language } = useI18n();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [dateRange, setDateRange] = useState('all');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Fetch user projects
  const { data: projects, isLoading: projectsLoading } = trpc.projects.list.useQuery();

  // Set first project as default
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Fetch analytics data for selected project
  const analyticsData = useAnalyticsData(selectedProjectId);

  // Generate forecast
  const historicalCosts = [48000, 57000, 62000, 68000];
  const forecastResult = forecastValues(historicalCosts, 2);

  // Generate insights
  const insights = analyticsData.categoryData.length > 0
    ? generateInsights(
        analyticsData.categoryData.map((cat) => ({
          category: cat.category,
          quantity: cat.itemCount,
          unitPrice: cat.averageUnitPrice,
          totalPrice: cat.totalCost,
        }))
      )
    : ['No data available for analysis'];

  // Mock trend data for demonstration
  const mockTrendData = [
    { period: 'Q1', estimated: 50000, actual: 48000, forecast: 48000 },
    { period: 'Q2', estimated: 57000, actual: 57000, forecast: 57000 },
    { period: 'Q3', estimated: 62000, actual: 65000, forecast: 65000 },
    { period: 'Q4', estimated: 68000, actual: 68000, forecast: 72000 },
  ];

  const mockForecastData = forecastResult.forecast.map((value, idx) => ({
    period: `Month ${idx + 1}`,
    forecast: value,
    confidence: 0.9 - idx * 0.05,
    isHistorical: false,
  }));

  if (projectsLoading || analyticsData.isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader className="animate-spin mx-auto mb-4 text-primary" size={48} />
            <p className="text-muted-foreground">{language === 'ar' ? 'جاري تحميل البيانات...' : 'Loading analytics data...'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={{
      backgroundImage: 'url(/blueprint-bg.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat',
    }}>
      <PageHeader
        title={language === 'ar' ? 'لوحة التحليلات' : 'Analytics Dashboard'}
        description={language === 'ar' ? 'رؤى متقدمة والتنبؤات لمشاريعك' : 'Advanced insights and forecasting for your BOQ'}
        showBackButton
        showHomeButton
      />

      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex gap-4 items-center mb-8">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-primary" />
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(parseInt(e.target.value))}
              className="bg-card border-2 border-primary text-foreground px-4 py-2 rounded-sm"
            >
              <option value="">{language === 'ar' ? 'اختر المشروع' : 'Select Project'}</option>
              {projects?.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-primary" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-card border-2 border-primary text-foreground px-4 py-2 rounded-sm"
            >
              <option value="all">{language === 'ar' ? 'جميع الفترات' : 'All Periods'}</option>
              <option value="month">{language === 'ar' ? 'هذا الشهر' : 'This Month'}</option>
              <option value="quarter">{language === 'ar' ? 'هذا الربع' : 'This Quarter'}</option>
              <option value="year">{language === 'ar' ? 'هذه السنة' : 'This Year'}</option>
            </select>
          </div>

          <Button
            onClick={() => setExportDialogOpen(true)}
            className="bg-primary hover:bg-accent text-primary-foreground font-bold px-6 py-2 rounded-sm border-2 border-primary hover:border-accent transition-all"
          >
            <Download size={20} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
            {language === 'ar' ? 'تصدير التقرير' : 'Export Report'}
          </Button>
        </div>

        {/* Analytics Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend Analysis */}
          <Card className="blueprint-card p-6">
            <h2 className="text-xl font-bold text-primary mb-4">{language === 'ar' ? 'تحليل الاتجاهات' : 'Trend Analysis'}</h2>
            <TrendAnalysis data={mockTrendData} title="Cost Trends" />
          </Card>

          {/* Variance Analysis */}
          <Card className="blueprint-card p-6">
            <h2 className="text-xl font-bold text-primary mb-4">{language === 'ar' ? 'تحليل التباين' : 'Variance Analysis'}</h2>
            <VarianceAnalysis 
              data={mockTrendData.map(d => ({
                category: d.period,
                estimated: d.estimated,
                actual: d.actual,
                variance: (d.actual || 0) - d.estimated,
                variancePercent: ((((d.actual || 0) - d.estimated) / d.estimated) * 100),
                status: ((d.actual || 0) > d.estimated) ? 'over' : 'under'
              }))} 
              title="Cost Variance"
            />
          </Card>

          {/* Forecasting */}
          <Card className="blueprint-card p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-primary mb-4">{language === 'ar' ? 'التنبؤات' : 'Forecasting'}</h2>
            <ForecastingChart data={mockForecastData} title="Future Forecasts" confidence={0.85} trend="increasing" nextValue={72000} />
          </Card>

          {/* Category Analysis */}
          <Card className="blueprint-card p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-primary mb-4">{language === 'ar' ? 'تحليل الفئات' : 'Category Analysis'}</h2>
            <CategoryAnalysis data={analyticsData.categoryData} title="Cost Analysis by Category" />
          </Card>

          {/* Insights */}
          <Card className="blueprint-card p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-primary mb-4">{language === 'ar' ? 'الرؤى والتوصيات' : 'Insights & Recommendations'}</h2>
            <div className="space-y-3">
              {insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-primary/10 rounded-sm border-l-2 border-primary">
                  <span className="text-primary font-bold">•</span>
                  <p className="text-muted-foreground">{insight}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>

      {/* Export History */}
      <div className="mt-8 mb-8">
        <ExportHistory />
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        reportData={{
          projectName: projects?.find(p => p.id === selectedProjectId)?.name || 'Project',
          categoryData: analyticsData.categoryData,
          insights: insights,
          reportDate: new Date(),
          summary: {
            totalEstimated: mockTrendData.reduce((sum, d) => sum + d.estimated, 0),
            totalActual: mockTrendData.reduce((sum, d) => sum + (d.actual || 0), 0),
            totalVariance: mockTrendData.reduce((sum, d) => sum + ((d.actual || 0) - d.estimated), 0),
            variancePercent: 2.5
          },
          varianceData: mockTrendData.map(d => ({
            category: d.period,
            estimated: d.estimated,
            actual: d.actual,
            variance: (d.actual || 0) - d.estimated,
            variancePercent: ((((d.actual || 0) - d.estimated) / d.estimated) * 100),
            status: ((d.actual || 0) > d.estimated) ? 'over' : 'under'
          }))
        }}
      />
    </div>
  );
}
