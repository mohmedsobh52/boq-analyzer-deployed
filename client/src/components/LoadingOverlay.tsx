import { useI18n } from '@/contexts/I18nContext';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export function LoadingOverlay({ isVisible, message }: LoadingOverlayProps) {
  const { language } = useI18n();
  const isRTL = language === 'ar';

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border-2 border-primary rounded-lg p-8 shadow-2xl max-w-md w-full mx-4">
        {/* Animated spinner */}
        <div className="flex justify-center mb-6">
          <div className="relative w-16 h-16">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 border-4 border-transparent border-t-accent border-r-accent rounded-full animate-spin"></div>
            
            {/* Middle rotating ring (slower) */}
            <div className="absolute inset-2 border-4 border-transparent border-b-primary rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
            
            {/* Inner pulsing circle */}
            <div className="absolute inset-4 bg-gradient-to-r from-accent to-primary rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Loading text */}
        <div className="text-center space-y-3">
          <h3 className="text-lg font-bold text-primary">
            {language === 'ar' ? 'جاري التصدير...' : 'Generating Export...'}
          </h3>
          
          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}

          {/* Progress indicator */}
          <div className="mt-4 space-y-2">
            <div className="w-full bg-card border border-primary/30 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-accent to-primary rounded-full animate-pulse" style={{ width: '66%' }}></div>
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? 'يرجى الانتظار...' : 'Please wait...'}
            </p>
          </div>
        </div>

        {/* Animated dots */}
        <div className="flex justify-center gap-2 mt-6">
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}
