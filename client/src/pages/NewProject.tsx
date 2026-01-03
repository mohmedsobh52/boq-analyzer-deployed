import { useState } from 'react';
import { Home, ArrowLeft, AlertCircle, CheckCircle, Loader2, Download } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/FileUpload';
import { parseFile, validateBOQData } from '@/lib/fileParser';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { AIItemAnalysis } from '@/components/AIItemAnalysis';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { trpc } from '@/lib/trpc';
import { BOQTable, BOQItem } from '@/components/BOQTable';
import { PriceAnalysisButton } from '@/components/PriceAnalysisButton';
import { BOQPreview } from '@/components/BOQPreview';
import { TemplateSelector } from '@/components/TemplateSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { exportBOQToExcelAdvanced } from '@/lib/exportPDFToExcel';
import { AdvancedFilters, FilterState } from '@/components/AdvancedFilters';

export default function NewProject() {
  const { t, language } = useI18n();
  const [, setLocation] = useLocation();
  const { setCurrentPath } = useBreadcrumb();
  const createProjectMutation = trpc.projects.create.useMutation();
  const [step, setStep] = useState<'details' | 'upload' | 'review'>('details');
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parsedItems, setParsedItems] = useState<BOQItem[]>([]);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    units: [],
    categories: [],
    priceRange: [0, 0],
  });

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setLoading(true);
    setParseErrors([]);
    setParsedItems([]);

    try {
      const data = await parseFile(file);
      
      if (!data || data.length === 0) {
        setParseErrors(['No data found in file']);
        toast.error('No data found in file');
        setLoading(false);
        return;
      }

      const validation = validateBOQData(data);

      if (!validation.valid) {
        if (data.length > 0) {
          setParseErrors(validation.errors.slice(0, 5));
          console.warn('Validation warnings:', validation.errors);
        } else {
          setParseErrors(validation.errors);
          toast.error('File validation failed');
          setLoading(false);
          return;
        }
      }

      setUploadedFile(file);
      const parsedData = (data as any[]).map((item, idx) => ({
        id: idx,
        itemCode: item.itemCode || `ITEM-${idx + 1}`,
        description: item.description || '',
        unit: item.unit || 'LOT',
        quantity: Math.max(0, item.quantity || 0),
        unitPrice: Math.max(0, item.unitPrice || 0),
        totalPrice: Math.max(0, item.quantity || 0) * Math.max(0, item.unitPrice || 0),
        category: item.category,
        wbsCode: item.wbsCode,
      }));
      
      setParsedItems(parsedData);
      setStep('review');
      
      const successMsg = language === 'ar' 
        ? `تم تحليل الملف بنجاح - ${parsedData.length} بند` 
        : `File parsed successfully - ${parsedData.length} items`;
      toast.success(successMsg);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse file';
      setParseErrors([message]);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  const handleExportToExcel = async () => {
    if (parsedItems.length === 0) {
      const msg = language === 'ar' ? 'لا توجد بيانات للتصدير' : 'No data to export';
      toast.error(msg);
      return;
    }

    try {
      setExporting(true);
      const exportItems = parsedItems.map(item => ({
        itemCode: item.itemCode,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      }));

      exportBOQToExcelAdvanced(
        exportItems,
        projectName || 'BOQ_Export',
        { language: language as 'ar' | 'en' }
      );

      const successMsg = language === 'ar'
        ? 'تم تصدير البيانات بنجاح'
        : 'Data exported successfully';
      toast.success(successMsg);
    } catch (error) {
      const errMsg = language === 'ar'
        ? 'فشل التصدير'
        : 'Export failed';
      toast.error(errMsg);
    } finally {
      setExporting(false);
    }
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      const msg = language === 'ar' ? 'اسم المشروع مطلوب' : 'Project name is required';
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      const result = await createProjectMutation.mutateAsync({
        name: projectName,
        description: projectDescription,
      });
      const projectId = (result as any)?.insertId || (result as any)?.id || 1;
      setCurrentPath(`/projects/${projectId}`, projectName);
      const successMsg = language === 'ar' ? 'تم إنشاء المشروع بنجاح' : 'Project created successfully';
      toast.success(successMsg);
      setTimeout(() => {
        setLocation(`/projects/${projectId}`);
      }, 1500);
    } catch (error) {
      const errMsg = language === 'ar' ? 'فشل في إنشاء المشروع' : 'Failed to create project';
      toast.error(errMsg);
      setLoading(false);
    }
  };

  // Full preview modal
  if (showFullPreview) {
    return (
      <BOQPreview
        items={parsedItems}
        projectName={projectName}
        projectDescription={projectDescription}
        onClose={() => setShowFullPreview(false)}
        isFullScreen={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={{
      backgroundImage: 'url(/construction-bg.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat',
    }}>
      {/* Header */}
      <header className="border-b-2 border-primary bg-black/60 backdrop-blur-md">
        <div className="container py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation('/')}
              className="p-2 hover:bg-primary/10 rounded-sm transition-colors"
              title={language === 'ar' ? 'الرئيسية' : 'Home'}
            >
              <Home className="text-primary" size={24} />
            </button>
            <button
              onClick={() => setLocation('/projects')}
              className="p-2 hover:bg-primary/10 rounded-sm transition-colors"
              title={language === 'ar' ? 'العودة' : 'Back'}
            >
              <ArrowLeft className="text-primary" size={24} />
            </button>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary glow-primary">{t('projects.new')}</h1>
            <p className="text-muted-foreground mt-1">Create a new BOQ project</p>
          </div>
          <div className="w-16" />
        </div>
      </header>

      {/* Progress Steps */}
      <div className="border-b border-border">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${step === 'details' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${step === 'details' ? 'border-primary bg-primary/20' : 'border-border'}`}>
                1
              </div>
              <span className="font-bold">Project Details</span>
            </div>

            <div className="flex-1 h-1 mx-4 bg-border" />

            <div className={`flex items-center gap-3 ${step === 'upload' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${step === 'upload' ? 'border-primary bg-primary/20' : 'border-border'}`}>
                2
              </div>
              <span className="font-bold">Upload Data</span>
            </div>

            <div className="flex-1 h-1 mx-4 bg-border" />

            <div className={`flex items-center gap-3 ${step === 'review' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${step === 'review' ? 'border-primary bg-primary/20' : 'border-border'}`}>
                3
              </div>
              <span className="font-bold">Review</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container py-12">
        {step === 'details' && (
          <Card className="blueprint-card max-w-2xl">
            <h2 className="text-2xl font-bold text-primary mb-6">{t('projects.name')}</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  {t('projects.name')} *
                </label>
                <Input
                  type="text"
                  placeholder="Enter project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="blueprint-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  {t('projects.description')}
                </label>
                <Textarea
                  placeholder="Enter project description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="blueprint-input w-full min-h-24"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setLocation('/projects')}
                  variant="outline"
                  className="flex-1"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={() => setStep('upload')}
                  disabled={!projectName.trim()}
                  className="flex-1 bg-primary hover:bg-accent text-primary-foreground font-bold rounded-sm border-2 border-primary hover:border-accent transition-all"
                >
                  {t('common.next')} →
                </Button>
              </div>
            </div>
          </Card>
        )}

        {step === 'upload' && (
          <div className="max-w-2xl">
            <Card className="blueprint-card mb-6">
              <h2 className="text-2xl font-bold text-primary mb-6">{t('boq.importFile')}</h2>
              <FileUpload onFileSelect={handleFileSelect} />

              {parseErrors.length > 0 && (
                <div className="mt-6 space-y-2">
                  {parseErrors.map((error, idx) => (
                    <div key={idx} className="p-3 bg-destructive/10 border border-destructive rounded-sm flex items-start gap-2">
                      <AlertCircle className="text-destructive flex-shrink-0 mt-0.5" size={18} />
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <div className="flex gap-4">
              <Button
                onClick={() => setStep('details')}
                variant="outline"
                className="flex-1"
              >
                ← {t('common.back')}
              </Button>
              <Button
                onClick={() => setStep('review')}
                disabled={!uploadedFile || parseErrors.length > 0}
                className="flex-1 bg-primary hover:bg-accent text-primary-foreground font-bold rounded-sm border-2 border-primary hover:border-accent transition-all"
              >
                {t('common.next')} →
              </Button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="max-w-6xl">
            <Card className="blueprint-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary">Review Project</h2>
                <div className="flex gap-2">
                  {uploadedFile && <AIItemAnalysis items={parsedItems as any} projectName={projectName} />}
                  {parsedItems.length > 0 && (
                    <Button
                      onClick={handleExportToExcel}
                      disabled={exporting}
                      variant="outline"
                      className="text-cyan-400 border-cyan-400 hover:bg-cyan-400/10 flex items-center gap-2"
                      title={language === 'ar' ? 'تصدير إلى Excel' : 'Export to Excel'}
                    >
                      {exporting ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Download size={18} />
                      )}
                      {language === 'ar' ? 'تصدير Excel' : 'Export Excel'}
                    </Button>
                  )}
                  {parsedItems.length > 0 && (
                    <Button
                      onClick={() => setShowFullPreview(true)}
                      variant="outline"
                      className="text-primary border-primary hover:bg-primary/10"
                    >
                      {language === 'ar' ? 'عرض كامل' : 'Full Preview'}
                    </Button>
                  )}
                </div>
              </div>

              {parsedItems.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-primary">BOQ Items ({parsedItems.length})</h3>
                    <span className="text-sm text-muted-foreground">
                      Total: ${parsedItems.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString()}
                    </span>
                  </div>
                  
                  {/* Advanced Filters */}
                  <div className="mb-6">
                    <AdvancedFilters
                      items={parsedItems}
                      onFilterChange={setFilters}
                      language={language as 'ar' | 'en'}
                    />
                  </div>
                  
                  <div className="border border-border rounded-lg overflow-hidden">
                    <BOQTable items={parsedItems} filters={filters} />
                  </div>
                  
                  {/* Price Analysis Button */}
                  <div className="mt-6 flex justify-end">
                    <PriceAnalysisButton items={parsedItems} projectName={projectName} />
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3 p-4 bg-card/50 rounded-sm border border-border">
                  <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-bold text-foreground">{projectName}</p>
                    <p className="text-sm text-muted-foreground">{projectDescription}</p>
                  </div>
                </div>

                {uploadedFile && (
                  <div className="flex items-start gap-3 p-4 bg-card/50 rounded-sm border border-border">
                    <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-bold text-foreground">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setStep('upload')}
                  variant="outline"
                  className="flex-1"
                >
                  ← {t('common.back')}
                </Button>
                <Button
                  onClick={handleCreateProject}
                  disabled={loading}
                  className="flex-1 bg-primary hover:bg-accent text-primary-foreground font-bold rounded-sm border-2 border-primary hover:border-accent transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={18} />
                      Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
