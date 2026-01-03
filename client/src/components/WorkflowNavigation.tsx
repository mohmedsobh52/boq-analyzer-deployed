import { useI18n } from '@/contexts/I18nContext';
import { useLocation } from 'wouter';
import { Button } from './ui/button';
import { ArrowRight, BarChart3, AlertTriangle, FileText } from 'lucide-react';

interface WorkflowNavigationProps {
  projectId?: string;
  currentStep: 'details' | 'analysis' | 'risks' | 'complete';
  onAnalyze?: () => void;
  onRiskAssess?: () => void;
  onViewReport?: () => void;
}

export function WorkflowNavigation({
  projectId,
  currentStep,
  onAnalyze,
  onRiskAssess,
  onViewReport,
}: WorkflowNavigationProps) {
  const { language, isRTL } = useI18n();
  const [, setLocation] = useLocation();

  const steps = [
    { id: 'details', label: language === 'ar' ? 'التفاصيل' : 'Details', icon: FileText },
    { id: 'analysis', label: language === 'ar' ? 'التحليل' : 'Analysis', icon: BarChart3 },
    { id: 'risks', label: language === 'ar' ? 'المخاطر' : 'Risks', icon: AlertTriangle },
    { id: 'complete', label: language === 'ar' ? 'مكتمل' : 'Complete', icon: ArrowRight },
  ];

  const handleStepClick = (stepId: string) => {
    if (stepId === 'analysis' && onAnalyze) onAnalyze();
    if (stepId === 'risks' && onRiskAssess) onRiskAssess();
    if (stepId === 'complete' && onViewReport) onViewReport();
  };

  return (
    <div className={`flex items-center gap-2 p-4 bg-card/50 border border-primary/20 rounded-sm overflow-x-auto ${isRTL ? 'flex-row-reverse' : ''}`}>
      {steps.map((step, index) => {
        const StepIcon = step.icon;
        const isActive = currentStep === step.id;
        const isCompleted = steps.findIndex(s => s.id === currentStep) >= index;

        return (
          <div key={step.id} className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button
              onClick={() => handleStepClick(step.id)}
              disabled={!isCompleted}
              className={`flex items-center gap-2 px-3 py-2 rounded-sm transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground border-2 border-primary'
                  : isCompleted
                  ? 'bg-primary/20 text-primary border border-primary hover:bg-primary/30'
                  : 'bg-muted text-muted-foreground border border-border cursor-not-allowed'
              }`}
            >
              <StepIcon size={16} />
              <span className="text-sm font-bold">{step.label}</span>
            </Button>

            {index < steps.length - 1 && (
              <div className={`w-8 h-0.5 ${isCompleted ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
