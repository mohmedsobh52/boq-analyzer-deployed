import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { useI18n } from '@/contexts/I18nContext';
import { ChevronRight, Home } from 'lucide-react';
import { useLocation } from 'wouter';

export function Breadcrumb() {
  const { breadcrumbs, navigateToBreadcrumb } = useBreadcrumb();
  const { language, isRTL } = useI18n();
  const [, setLocation] = useLocation();

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumb if only home
  }

  const breadcrumbLabels: Record<string, Record<string, string>> = {
    en: {
      '/': 'Home',
      '/dashboard': 'Dashboard',
      '/projects': 'Projects',
      '/project': 'Project Detail',
      '/analytics': 'Analytics',
      '/suppliers': 'Suppliers',
      '/settings': 'Settings',
    },
    ar: {
      '/': 'الرئيسية',
      '/dashboard': 'لوحة التحكم',
      '/projects': 'المشاريع',
      '/project': 'تفاصيل المشروع',
      '/analytics': 'التحليلات',
      '/suppliers': 'الموردون',
      '/settings': 'الإعدادات',
    }
  };

  const getLabel = (path: string): string => {
    const labels = breadcrumbLabels[language] || breadcrumbLabels.en;
    return labels[path] || path;
  };

  return (
    <nav className={`flex items-center gap-2 px-4 py-3 bg-card/50 border-b border-primary/20 overflow-x-auto ${isRTL ? 'flex-row-reverse' : ''}`}>
      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {breadcrumbs.map((crumb, index) => (
          <div
            key={crumb.path}
            className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            {index > 0 && (
              <ChevronRight
                size={16}
                className="text-primary/50 flex-shrink-0"
                style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }}
              />
            )}
            
            {crumb.path === '/' ? (
              <button
                onClick={() => setLocation('/')}
                className="flex items-center gap-1 px-2 py-1 rounded-sm hover:bg-primary/10 transition-colors text-primary hover:text-accent font-medium text-sm cursor-pointer"
              >
                <Home size={16} />
                <span>{getLabel(crumb.path)}</span>
              </button>
            ) : (
              <button
                onClick={() => navigateToBreadcrumb(crumb.path)}
                className={`px-2 py-1 rounded-sm hover:bg-primary/10 transition-colors text-primary hover:text-accent font-medium text-sm whitespace-nowrap ${
                  index === breadcrumbs.length - 1
                    ? 'bg-primary/10 cursor-default'
                    : 'cursor-pointer'
                }`}
                disabled={index === breadcrumbs.length - 1}
              >
                {crumb.label || getLabel(crumb.path)}
              </button>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}
