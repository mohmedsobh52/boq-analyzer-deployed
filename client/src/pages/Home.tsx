import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated && user) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, user, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-primary mx-auto mb-4" size={48} />
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-5xl font-bold text-primary glow-primary mb-4">BOQ Analyzer</h1>
          <p className="text-xl text-muted-foreground mb-8">Professional Bill of Quantities Management</p>
          <p className="text-muted-foreground mb-8">Engineering-focused tool for construction cost analysis</p>
          <Button
            onClick={() => window.location.href = getLoginUrl()}
            className="bg-primary hover:bg-accent text-primary-foreground font-bold px-8 py-3 rounded-sm border-2 border-primary hover:border-accent transition-all"
          >
            Sign In with Manus
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
