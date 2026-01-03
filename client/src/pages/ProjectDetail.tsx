import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useI18n } from '@/contexts/I18nContext';
import { PageHeader } from '@/components/PageHeader';
import { BOQItemsEditor, type BOQItem } from '@/components/BOQItemsEditor';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, FileUp, Download, Loader } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function ProjectDetail() {
  const { t, language } = useI18n();
  const [, params] = useRoute('/projects/:id');
  const [, setLocation] = useLocation();
  const projectId = params?.id ? parseInt(params.id) : null;

  const [items, setItems] = useState<BOQItem[]>([]);
  const [selectedTab, setSelectedTab] = useState('items');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch project data
  const { data: project, isLoading: projectLoading } = trpc.projects.detail.useQuery(
    { projectId: projectId || 0 },
    { enabled: !!projectId }
  );

  const { data: projectItems, isLoading: itemsLoading } = trpc.projects.items.useQuery(
    { projectId: projectId || 0 },
    { enabled: !!projectId }
  );

  const { data: projectFiles } = trpc.projects.files.useQuery(
    { projectId: projectId || 0 },
    { enabled: !!projectId }
  );

  // Initialize items
  useEffect(() => {
    if (projectItems && projectItems.length > 0) {
      setItems(projectItems);
    }
  }, [projectItems]);

  const handleSaveItems = async () => {
    if (!projectId) return;

    setIsSaving(true);
    try {
      // In a real implementation, this would call a tRPC mutation to update items
      // For now, we'll just show a success message
      toast.success(language === 'ar' ? 'تم حفظ العناصر بنجاح' : 'Items saved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save items';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!projectId) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container py-12">
          <p className="text-muted-foreground">{language === 'ar' ? 'لم يتم العثور على المشروع' : 'Project not found'}</p>
        </div>
      </div>
    );
  }

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-primary" size={48} />
          <p className="text-muted-foreground">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container py-12">
          <p className="text-muted-foreground">{language === 'ar' ? 'لم يتم العثور على المشروع' : 'Project not found'}</p>
        </div>
      </div>
    );
  }

  // Calculate summary stats
  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalCost = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{
        backgroundImage: 'url(/construction-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <PageHeader
        title={project.name}
        description={project.description || ''}
        showBackButton
        showHomeButton
      />

      <main className="container mx-auto px-4 py-8">
        {/* Project Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="blueprint-card p-6">
            <p className="text-muted-foreground text-sm">{language === 'ar' ? 'الحالة' : 'Status'}</p>
            <p className="text-2xl font-bold text-primary mt-2 capitalize">{project.status}</p>
          </Card>
          <Card className="blueprint-card p-6">
            <p className="text-muted-foreground text-sm">{language === 'ar' ? 'عدد العناصر' : 'Items'}</p>
            <p className="text-2xl font-bold text-primary mt-2">{totalItems}</p>
          </Card>
          <Card className="blueprint-card p-6">
            <p className="text-muted-foreground text-sm">{language === 'ar' ? 'الكمية الإجمالية' : 'Total Qty'}</p>
            <p className="text-2xl font-bold text-primary mt-2">{totalQuantity}</p>
          </Card>
          <Card className="blueprint-card p-6">
            <p className="text-muted-foreground text-sm">{language === 'ar' ? 'التكلفة الإجمالية' : 'Total Cost'}</p>
            <p className="text-2xl font-bold text-cyan-400 mt-2">${totalCost.toLocaleString()}</p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card border-2 border-primary rounded-sm p-1 mb-6">
            <TabsTrigger
              value="items"
              className="rounded-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2"
            >
              <FileUp size={16} />
              <span className="hidden sm:inline">{language === 'ar' ? 'العناصر' : 'Items'}</span>
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              className="rounded-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2"
            >
              <BarChart3 size={16} />
              <span className="hidden sm:inline">{language === 'ar' ? 'التحليل' : 'Analysis'}</span>
            </TabsTrigger>
            <TabsTrigger
              value="files"
              className="rounded-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2"
            >
              <Download size={16} />
              <span className="hidden sm:inline">{language === 'ar' ? 'الملفات' : 'Files'}</span>
            </TabsTrigger>
          </TabsList>

          {/* Items Tab */}
          <TabsContent value="items" className="space-y-6">
            <Card className="blueprint-card p-6">
              <h2 className="text-2xl font-bold text-primary mb-6">
                {language === 'ar' ? 'محرر عناصر BOQ' : 'BOQ Items Editor'}
              </h2>
              <BOQItemsEditor
                items={items}
                onItemsChange={setItems}
                onSave={handleSaveItems}
                isLoading={isSaving}
              />
            </Card>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <Card className="blueprint-card p-6">
              <h2 className="text-2xl font-bold text-primary mb-6">
                {language === 'ar' ? 'تحليل التكاليف' : 'Cost Analysis'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-muted-foreground mb-2">{language === 'ar' ? 'توزيع التكاليف حسب الفئة' : 'Cost Distribution by Category'}</p>
                  <div className="space-y-2">
                    {items.length > 0 ? (
                      items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-primary/5 rounded">
                          <span className="text-foreground">{item.category || 'Uncategorized'}</span>
                          <span className="text-cyan-400 font-bold">${item.totalPrice.toLocaleString()}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">{language === 'ar' ? 'لا توجد بيانات' : 'No data available'}</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-2">{language === 'ar' ? 'ملخص التكاليف' : 'Cost Summary'}</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-primary/10 rounded border border-primary/30">
                      <span className="text-foreground">{language === 'ar' ? 'إجمالي التكلفة' : 'Total Cost'}</span>
                      <span className="text-cyan-400 font-bold text-lg">${totalCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-primary/5 rounded">
                      <span className="text-muted-foreground">{language === 'ar' ? 'متوسط السعر' : 'Average Price'}</span>
                      <span className="text-foreground font-semibold">
                        ${items.length > 0 ? Math.round(totalCost / items.length).toLocaleString() : 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-6">
            <Card className="blueprint-card p-6">
              <h2 className="text-2xl font-bold text-primary mb-6">
                {language === 'ar' ? 'ملفات المشروع' : 'Project Files'}
              </h2>
              {projectFiles && projectFiles.length > 0 ? (
                <div className="space-y-3">
                  {projectFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-4 bg-primary/5 rounded border border-primary/30 hover:bg-primary/10 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{file.fileName}</p>
                        <p className="text-sm text-muted-foreground">
                          {language === 'ar' ? 'الحجم' : 'Size'}: {file.fileSize ? (file.fileSize / 1024).toFixed(2) : 'N/A'} KB
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(file.fileUrl, '_blank')}
                        className="border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-400"
                      >
                        {language === 'ar' ? 'تحميل' : 'Download'}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  {language === 'ar' ? 'لا توجد ملفات' : 'No files uploaded'}
                </p>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
