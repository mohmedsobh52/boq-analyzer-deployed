import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useLocation } from "wouter";
import { useI18n } from "@/contexts/I18nContext";

interface BackButtonProps {
  showHome?: boolean;
  homeHref?: string;
  backHref?: string;
  className?: string;
}

export function BackButton({ 
  showHome = true, 
  homeHref = "/", 
  backHref,
  className = "" 
}: BackButtonProps) {
  const { language } = useI18n();
  const isRTL = language === "ar";
  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (backHref) {
      window.location.href = backHref;
    } else {
      window.history.back();
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Back Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleBack}
        className="border-primary/50 hover:border-primary hover:bg-primary/10 text-primary"
        title={isRTL ? "رجوع (ESC)" : "Back (ESC)"}
      >
        <ArrowLeft size={18} className={isRTL ? "ml-2" : "mr-2"} />
        {isRTL ? "رجوع" : "Back"}
      </Button>

      {/* Home Button */}
      {showHome && (
        <Button
          variant="ghost"
          size="sm"
          className="text-primary hover:text-accent hover:bg-primary/10"
          title={isRTL ? "الرئيسية" : "Home"}
          onClick={() => setLocation(homeHref)}
        >
          <Home size={18} />
        </Button>
      )}
    </div>
  );
}
