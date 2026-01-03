import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Plus, Trash2, TrendingDown, Shield } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { toast } from 'sonner';

export interface Risk {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'financial' | 'schedule' | 'resource' | 'external';
  probability: number; // 1-5
  impact: number; // 1-5
  mitigation: string;
  owner: string;
  status: 'open' | 'mitigated' | 'closed';
}

interface RiskAnalysisProps {
  projectId?: number;
  risks?: Risk[];
  onRisksChange?: (risks: Risk[]) => void;
}

const RISK_CATEGORIES = {
  technical: { label: 'Technical', color: 'bg-blue-500/20 border-blue-500/50 text-blue-400' },
  financial: { label: 'Financial', color: 'bg-red-500/20 border-red-500/50 text-red-400' },
  schedule: { label: 'Schedule', color: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' },
  resource: { label: 'Resource', color: 'bg-purple-500/20 border-purple-500/50 text-purple-400' },
  external: { label: 'External', color: 'bg-orange-500/20 border-orange-500/50 text-orange-400' },
};

export function RiskAnalysis({ projectId, risks: initialRisks = [], onRisksChange }: RiskAnalysisProps) {
  const { language, isRTL } = useI18n();
  const [risks, setRisks] = useState<Risk[]>(initialRisks);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    category: 'technical' | 'financial' | 'schedule' | 'resource' | 'external';
    probability: number;
    impact: number;
    mitigation: string;
    owner: string;
    status: 'open' | 'mitigated' | 'closed';
  }>({
    title: '',
    description: '',
    category: 'technical',
    probability: 3,
    impact: 3,
    mitigation: '',
    owner: '',
    status: 'open',
  });

  const calculateRiskScore = (probability: number, impact: number) => {
    return probability * impact;
  };

  const getRiskLevel = (score: number) => {
    if (score >= 20) return { level: 'Critical', color: 'text-red-500', bg: 'bg-red-500/10' };
    if (score >= 12) return { level: 'High', color: 'text-orange-500', bg: 'bg-orange-500/10' };
    if (score >= 6) return { level: 'Medium', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    return { level: 'Low', color: 'text-green-500', bg: 'bg-green-500/10' };
  };

  const handleAddRisk = () => {
    setEditingRisk(null);
    setFormData({
      title: '',
      description: '',
      category: 'technical' as const,
      probability: 3,
      impact: 3,
      mitigation: '',
      owner: '',
      status: 'open' as const,
    });
    setOpenDialog(true);
  };

  const handleEditRisk = (risk: Risk) => {
    setEditingRisk(risk);
    setFormData({
      title: risk.title,
      description: risk.description,
      category: risk.category,
      probability: risk.probability,
      impact: risk.impact,
      mitigation: risk.mitigation,
      owner: risk.owner,
      status: risk.status,
    });
    setOpenDialog(true);
  };

  const handleSaveRisk = () => {
    if (!formData.title.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال عنوان المخاطرة' : 'Please enter risk title');
      return;
    }

    let updatedRisks: Risk[];
    if (editingRisk) {
      updatedRisks = risks.map(r => r.id === editingRisk.id ? { ...formData, id: editingRisk.id } : r);
    } else {
      updatedRisks = [...risks, { ...formData, id: Date.now().toString() }];
    }

    setRisks(updatedRisks);
    onRisksChange?.(updatedRisks);
    setOpenDialog(false);
    toast.success(language === 'ar' ? 'تم حفظ المخاطرة بنجاح' : 'Risk saved successfully');
  };

  const handleDeleteRisk = (id: string) => {
    const updatedRisks = risks.filter(r => r.id !== id);
    setRisks(updatedRisks);
    onRisksChange?.(updatedRisks);
    toast.success(language === 'ar' ? 'تم حذف المخاطرة' : 'Risk deleted');
  };

  const sortedRisks = [...risks].sort((a, b) => {
    const scoreA = calculateRiskScore(a.probability, a.impact);
    const scoreB = calculateRiskScore(b.probability, b.impact);
    return scoreB - scoreA;
  });

  const criticalRisks = sortedRisks.filter(r => calculateRiskScore(r.probability, r.impact) >= 20);
  const highRisks = sortedRisks.filter(r => calculateRiskScore(r.probability, r.impact) >= 12 && calculateRiskScore(r.probability, r.impact) < 20);

  return (
    <div className="space-y-6">
      {/* Risk Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="blueprint-card p-4">
          <p className="text-muted-foreground text-sm">{language === 'ar' ? 'إجمالي المخاطر' : 'Total Risks'}</p>
          <p className="text-3xl font-bold text-primary mt-2">{risks.length}</p>
        </Card>
        <Card className="blueprint-card p-4 border-red-500/50">
          <p className="text-muted-foreground text-sm">{language === 'ar' ? 'حرجة' : 'Critical'}</p>
          <p className="text-3xl font-bold text-red-500 mt-2">{criticalRisks.length}</p>
        </Card>
        <Card className="blueprint-card p-4 border-orange-500/50">
          <p className="text-muted-foreground text-sm">{language === 'ar' ? 'عالية' : 'High'}</p>
          <p className="text-3xl font-bold text-orange-500 mt-2">{highRisks.length}</p>
        </Card>
        <Card className="blueprint-card p-4">
          <p className="text-muted-foreground text-sm">{language === 'ar' ? 'معدل الخطورة' : 'Risk Rate'}</p>
          <p className="text-3xl font-bold text-cyan-400 mt-2">
            {risks.length > 0 ? Math.round((criticalRisks.length / risks.length) * 100) : 0}%
          </p>
        </Card>
      </div>

      {/* Risk Matrix */}
      <Card className="blueprint-card p-6">
        <h3 className="text-xl font-bold text-primary mb-4">{language === 'ar' ? 'مصفوفة المخاطر' : 'Risk Matrix'}</h3>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {[1, 2, 3, 4, 5].map(impact => (
            <div key={`impact-${impact}`} className="text-center text-xs text-muted-foreground">
              {impact}
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map(probability => (
            <div key={`prob-${probability}`} className="flex gap-2 items-center">
              <div className="w-8 text-center text-xs text-muted-foreground">{probability}</div>
              {[1, 2, 3, 4, 5].map(impact => {
                const score = probability * impact;
                const riskLevel = getRiskLevel(score);
                const cellRisks = risks.filter(r => r.probability === probability && r.impact === impact);
                return (
                  <div
                    key={`${probability}-${impact}`}
                    className={`flex-1 p-2 rounded border text-center text-xs font-bold ${riskLevel.bg} ${riskLevel.color}`}
                  >
                    {cellRisks.length > 0 && cellRisks.length}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Card>

      {/* Risk List */}
      <Card className="blueprint-card p-6">
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between mb-6`}>
          <h3 className="text-xl font-bold text-primary">{language === 'ar' ? 'قائمة المخاطر' : 'Risk Register'}</h3>
          <Button
            onClick={handleAddRisk}
            className="bg-primary hover:bg-accent text-primary-foreground font-bold px-4 py-2 rounded-sm border border-primary hover:border-accent transition-all"
          >
            <Plus size={18} className={isRTL ? 'ml-2' : 'mr-2'} />
            {language === 'ar' ? 'إضافة مخاطرة' : 'Add Risk'}
          </Button>
        </div>

        <div className="space-y-3">
          {sortedRisks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'ar' ? 'لا توجد مخاطر مسجلة' : 'No risks registered'}
            </div>
          ) : (
            sortedRisks.map(risk => {
              const score = calculateRiskScore(risk.probability, risk.impact);
              const riskLevel = getRiskLevel(score);
              const categoryInfo = RISK_CATEGORIES[risk.category];
              return (
                <div
                  key={risk.id}
                  className={`p-4 border-2 rounded-lg ${riskLevel.bg} border-primary/30 hover:border-primary/50 transition-all`}
                >
                  <div className={`flex items-start ${isRTL ? 'flex-row-reverse' : ''} gap-4`}>
                    <div className={`p-2 rounded ${categoryInfo.color} flex-shrink-0`}>
                      <AlertTriangle size={20} />
                    </div>
                    <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-3 mb-2`}>
                        <h4 className="font-bold text-primary text-lg">{risk.title}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${categoryInfo.color}`}>
                          {categoryInfo.label}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${riskLevel.color}`}>
                          {riskLevel.level} ({score})
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm mb-2">{risk.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-2">
                        <div>
                          <span className="text-muted-foreground">{language === 'ar' ? 'الاحتمالية:' : 'Probability:'}</span>
                          <p className="font-bold text-primary">{risk.probability}/5</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{language === 'ar' ? 'التأثير:' : 'Impact:'}</span>
                          <p className="font-bold text-primary">{risk.impact}/5</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{language === 'ar' ? 'المالك:' : 'Owner:'}</span>
                          <p className="font-bold text-primary">{risk.owner || '-'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{language === 'ar' ? 'الحالة:' : 'Status:'}</span>
                          <p className="font-bold text-primary capitalize">{risk.status}</p>
                        </div>
                      </div>
                      {risk.mitigation && (
                        <div className="bg-primary/5 p-2 rounded mb-3">
                          <p className="text-xs text-muted-foreground mb-1">{language === 'ar' ? 'التخفيف:' : 'Mitigation:'}</p>
                          <p className="text-sm text-foreground">{risk.mitigation}</p>
                        </div>
                      )}
                      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2`}>
                        <Button
                          onClick={() => handleEditRisk(risk)}
                          variant="outline"
                          size="sm"
                          className="border-primary/50 hover:bg-primary/10"
                        >
                          {language === 'ar' ? 'تعديل' : 'Edit'}
                        </Button>
                        <Button
                          onClick={() => handleDeleteRisk(risk.id)}
                          variant="outline"
                          size="sm"
                          className="border-red-500/50 hover:bg-red-500/10 text-red-400"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Risk Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="text-primary" size={24} />
              {editingRisk ? (language === 'ar' ? 'تعديل المخاطرة' : 'Edit Risk') : (language === 'ar' ? 'إضافة مخاطرة جديدة' : 'Add New Risk')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-primary mb-2">
                {language === 'ar' ? 'العنوان' : 'Title'}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-primary/50 rounded text-foreground"
                placeholder={language === 'ar' ? 'أدخل عنوان المخاطرة' : 'Enter risk title'}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-primary mb-2">
                {language === 'ar' ? 'الوصف' : 'Description'}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-primary/50 rounded text-foreground"
                rows={3}
                placeholder={language === 'ar' ? 'أدخل وصف المخاطرة' : 'Enter risk description'}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  {language === 'ar' ? 'الفئة' : 'Category'}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-3 py-2 bg-background border border-primary/50 rounded text-foreground"
                >
                  {Object.entries(RISK_CATEGORIES).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  {language === 'ar' ? 'الحالة' : 'Status'}
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-background border border-primary/50 rounded text-foreground"
                >
                  <option value="open">{language === 'ar' ? 'مفتوحة' : 'Open'}</option>
                  <option value="mitigated">{language === 'ar' ? 'مخففة' : 'Mitigated'}</option>
                  <option value="closed">{language === 'ar' ? 'مغلقة' : 'Closed'}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  {language === 'ar' ? 'الاحتمالية (1-5)' : 'Probability (1-5)'}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.probability}
                  onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-center text-primary font-bold mt-2">{formData.probability}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  {language === 'ar' ? 'التأثير (1-5)' : 'Impact (1-5)'}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.impact}
                  onChange={(e) => setFormData({ ...formData, impact: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-center text-primary font-bold mt-2">{formData.impact}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-primary mb-2">
                {language === 'ar' ? 'خطة التخفيف' : 'Mitigation Plan'}
              </label>
              <textarea
                value={formData.mitigation}
                onChange={(e) => setFormData({ ...formData, mitigation: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-primary/50 rounded text-foreground"
                rows={3}
                placeholder={language === 'ar' ? 'أدخل خطة التخفيف' : 'Enter mitigation plan'}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-primary mb-2">
                {language === 'ar' ? 'المالك' : 'Owner'}
              </label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-primary/50 rounded text-foreground"
                placeholder={language === 'ar' ? 'أدخل اسم المالك' : 'Enter owner name'}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setOpenDialog(false)}
                variant="outline"
                className="border-primary/50 hover:bg-primary/10"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                onClick={handleSaveRisk}
                className="bg-primary hover:bg-accent text-primary-foreground font-bold"
              >
                {language === 'ar' ? 'حفظ' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
