import { useI18n } from '@/contexts/I18nContext';
import { useLocation } from 'wouter';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Breadcrumb } from './Breadcrumb';

export interface PageHeaderProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  onBack?: () => void;
}

export function PageHeader({
  title,
  description,
  showBackButton = true,
  showHomeButton = true,
  onBack,
}: PageHeaderProps) {
  const { language } = useI18n();
  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  const handleHome = () => {
    setLocation('/');
  };

  return (
    <>
      <header className="border-b-2 border-primary bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 backdrop-blur-md sticky top-0 z-40 shadow-lg shadow-primary/20">
        <div className="container py-5">
        <div className="flex items-center justify-between gap-4">
          {/* Left side - Back button */}
          <div className="flex items-center gap-2">
            {showBackButton && (
              <Button
                onClick={handleBack}
                className="bg-primary/20 hover:bg-primary/40 text-primary font-bold px-3 py-2 rounded-sm border border-primary hover:border-accent transition-all flex items-center gap-2"
                title={language === 'ar' ? 'العودة للخلف' : 'Go Back'}
              >
                <ArrowLeft size={20} />
                <span className="hidden sm:inline">{language === 'ar' ? 'عودة' : 'Back'}</span>
              </Button>
            )}
          </div>

          {/* Center - Title and description */}
          <div className="flex-1 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-primary bg-clip-text text-transparent glow-primary">{title}</h1>
            {description && <p className="text-cyan-300/80 mt-1 text-sm font-medium">{description}</p>}
          </div>

          {/* Right side - Home button */}
          <div className="flex items-center gap-2">
            {showHomeButton && (
              <Button
                onClick={handleHome}
                className="bg-primary/20 hover:bg-primary/40 text-primary font-bold px-3 py-2 rounded-sm border border-primary hover:border-accent transition-all flex items-center gap-2"
                title={language === 'ar' ? 'الرئيسية' : 'Home'}
              >
                <Home size={20} />
                <span className="hidden sm:inline">{language === 'ar' ? 'الرئيسية' : 'Home'}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      </header>
      <Breadcrumb />
    </>
  );
}
