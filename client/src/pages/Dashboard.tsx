import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/contexts/I18nContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Plus, FileUp, BarChart3, Users, TrendingUp, AlertTriangle, Package } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Dashboard() {
  const { user } = useAuth();
  const { t, language, setLanguage, isRTL } = useI18n();
  const [, navigate] = useLocation();
  
  // Fetch real data from database
  const { data: projects } = trpc.projects.list.useQuery();

  const totalProjects = projects?.length || 0;
  const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
  const totalCost = projects?.reduce((sum, p) => sum + (p.totalCost || 0), 0) || 0;

  return (
    <div 
      className={`min-h-screen bg-background text-foreground ${isRTL ? 'rtl' : 'ltr'}`}
      style={{
        backgroundImage: 'url(/construction-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        direction: isRTL ? 'rtl' : 'ltr',
      }}
    >
      <PageHeader
        title="BOQ Analyzer"
        description={t('dashboard.welcome')}
        showBackButton={false}
        showHomeButton={false}
      />
      
      {/* Language and User Info */}
      <div className="border-b border-primary/20 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="px-4 py-2 border border-primary text-primary hover:bg-primary/10 rounded-sm transition-colors font-bold"
            >
              {language === 'en' ? 'العربية' : 'English'}
            </button>
            <div className={`${isRTL ? 'text-left' : 'text-right'}`}>
              <p className="text-sm text-muted-foreground">{t('common.welcome')}</p>
              <p className="font-bold text-primary">{user?.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Quick Stats - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="blueprint-card p-6 hover:shadow-lg hover:shadow-primary/50 transition-all">
            <div className={`flex items-start ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
              <div className={isRTL ? 'text-right' : ''}>
                <p className="text-muted-foreground text-sm font-semibold">{t('dashboard.totalProjects')}</p>
                <p className="text-4xl font-bold text-primary mt-3">{totalProjects}</p>
                <p className="text-xs text-muted-foreground mt-2">{language === 'ar' ? 'إجمالي المشاريع المنشأة' : 'Total created projects'}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <BarChart3 className="text-primary" size={28} />
              </div>
            </div>
          </Card>

          <Card className="blueprint-card p-6 hover:shadow-lg hover:shadow-accent/50 transition-all">
            <div className={`flex items-start ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
              <div className={isRTL ? 'text-right' : ''}>
                <p className="text-muted-foreground text-sm font-semibold">{t('dashboard.activeProjects')}</p>
                <p className="text-4xl font-bold text-accent mt-3">{activeProjects}</p>
                <p className="text-xs text-muted-foreground mt-2">{language === 'ar' ? 'المشاريع قيد التنفيذ' : 'Projects in progress'}</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-lg">
                <TrendingUp className="text-accent" size={28} />
              </div>
            </div>
          </Card>

          <Card className="blueprint-card p-6 hover:shadow-lg hover:shadow-cyan-400/50 transition-all">
            <div className={`flex items-start ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
              <div className={isRTL ? 'text-right' : ''}>
                <p className="text-muted-foreground text-sm font-semibold">{t('dashboard.totalCost')}</p>
                <p className="text-4xl font-bold text-cyan-400 mt-3">${totalCost.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-2">{language === 'ar' ? 'إجمالي التكاليف' : 'Total project costs'}</p>
              </div>
              <div className="p-3 bg-cyan-400/10 rounded-lg">
                <FileUp className="text-cyan-400" size={28} />
              </div>
            </div>
          </Card>

          <Card className="blueprint-card p-6 hover:shadow-lg hover:shadow-purple-500/50 transition-all">
            <div className={`flex items-start ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
              <div className={isRTL ? 'text-right' : ''}>
                <p className="text-muted-foreground text-sm font-semibold">{t('supplier.title')}</p>
                <p className="text-4xl font-bold text-purple-400 mt-3">0</p>
                <p className="text-xs text-muted-foreground mt-2">{language === 'ar' ? 'الموردون المسجلون' : 'Registered suppliers'}</p>
              </div>
              <div className="p-3 bg-purple-400/10 rounded-lg">
                <Users className="text-purple-400" size={28} />
              </div>
            </div>
          </Card>
        </div>

        {/* Action Buttons - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Button onClick={() => navigate('/projects/new')} className="w-full h-28 bg-gradient-to-br from-primary to-accent hover:from-accent hover:to-primary text-primary-foreground font-bold text-lg rounded-lg border-2 border-primary hover:border-accent transition-all shadow-lg hover:shadow-xl">
            <Plus className={`${isRTL ? 'ml-2' : 'mr-2'}`} size={28} />
            {t('projects.new')}
          </Button>



          <Button onClick={() => navigate('/analytics')} className="w-full h-28 bg-gradient-to-br from-cyan-500 to-primary hover:from-primary hover:to-cyan-500 text-primary-foreground font-bold text-lg rounded-lg border-2 border-cyan-500 hover:border-primary transition-all shadow-lg hover:shadow-xl">
            <TrendingUp className={`${isRTL ? 'ml-2' : 'mr-2'}`} size={28} />
            {language === 'ar' ? 'التحليلات' : 'Analytics'}
          </Button>

          <Button onClick={() => navigate('/items')} className="w-full h-28 bg-gradient-to-br from-purple-500 to-primary hover:from-primary hover:to-purple-500 text-primary-foreground font-bold text-lg rounded-lg border-2 border-purple-500 hover:border-primary transition-all shadow-lg hover:shadow-xl">
            <Package className={`${isRTL ? 'ml-2' : 'mr-2'}`} size={28} />
            {language === 'ar' ? 'العناصر' : 'Items'}
          </Button>
        </div>

        {/* Recent Projects Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <div className="lg:col-span-2">
            <Card className="blueprint-card bg-black/40 backdrop-blur-sm p-6">
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between mb-6`}>
                <h2 className="text-2xl font-bold text-primary">{t('dashboard.recentProjects')}</h2>
                <Button onClick={() => navigate('/projects')} variant="outline" className="text-primary hover:bg-primary/10 border-primary">
                  {isRTL ? '← ' : ''}{t('common.next')}{!isRTL ? ' →' : ''}
                </Button>
              </div>

              <div className="space-y-3">
                {projects && projects.length > 0 ? (
                  projects.slice(0, 5).map((project) => (
                    <div 
                      key={project.id} 
                      className="p-4 bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
                        <div className={isRTL ? 'text-right' : ''}>
                          <p className="font-semibold text-primary">{project.name}</p>
                          <p className="text-sm text-muted-foreground">{project.description || 'No description'}</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {language === 'ar' ? 'آخر تحديث: ' : 'Last updated: '}
                            {new Date(project.updatedAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded text-xs font-bold whitespace-nowrap ${
                          project.status === 'active' ? 'bg-accent/20 text-accent' : 
                          project.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          project.status === 'archived' ? 'bg-muted/20 text-muted' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">{language === 'ar' ? 'لا توجد مشاريع حالياً' : 'No projects yet'}</p>
                    <p className="text-sm text-muted-foreground/50 mt-2">
                      {language === 'ar' ? 'انقر على "مشروع جديد" لإنشاء مشروعك الأول' : 'Click "New Project" to create your first project'}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Quick Links */}
          <Card className="blueprint-card bg-black/40 backdrop-blur-sm p-6">
            <h3 className="text-xl font-bold text-primary mb-4">{language === 'ar' ? 'روابط سريعة' : 'Quick Links'}</h3>
            <div className="space-y-3">
              <Button onClick={() => navigate('/projects/new')} variant="outline" className="w-full justify-start text-primary border-primary hover:bg-primary/10">
                <Plus size={18} className={isRTL ? 'ml-2' : 'mr-2'} />
                {t('projects.new')}
              </Button>
              <Button onClick={() => navigate('/analytics')} variant="outline" className="w-full justify-start text-primary border-primary hover:bg-primary/10">
                <BarChart3 size={18} className={isRTL ? 'ml-2' : 'mr-2'} />
                {language === 'ar' ? 'التحليلات' : 'Analytics'}
              </Button>

              <Button onClick={() => navigate('/suppliers')} variant="outline" className="w-full justify-start text-primary border-primary hover:bg-primary/10">
                <Users size={18} className={isRTL ? 'ml-2' : 'mr-2'} />
                {t('supplier.title')}
              </Button>
              <Button onClick={() => navigate('/items')} variant="outline" className="w-full justify-start text-primary border-primary hover:bg-primary/10">
                <Package size={18} className={isRTL ? 'ml-2' : 'mr-2'} />
                {language === 'ar' ? 'العناصر' : 'Items'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Risk Alert Section */}
        <Card className="blueprint-card bg-gradient-to-r from-red-900/20 to-orange-900/20 border-2 border-orange-500/30 p-6">
          <div className={`flex items-start ${isRTL ? 'flex-row-reverse' : ''} gap-4`}>
            <AlertTriangle className="text-orange-400 flex-shrink-0 mt-1" size={24} />
            <div className={isRTL ? 'text-right' : ''}>
              <h3 className="text-lg font-bold text-orange-400 mb-2">{language === 'ar' ? 'تنبيهات المخاطر' : 'Risk Alerts'}</h3>
              <p className="text-muted-foreground text-sm">
                {language === 'ar' 
                  ? 'لا توجد تنبيهات مخاطر حالياً. راقب المشاريع للتحديثات.'
                  : 'No risk alerts at this time. Monitor your projects for updates.'
                }
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
