import { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: string;
}

interface BreadcrumbContextType {
  breadcrumbs: BreadcrumbItem[];
  addBreadcrumb: (item: BreadcrumbItem) => void;
  removeBreadcrumb: (path: string) => void;
  clearBreadcrumbs: () => void;
  navigateToBreadcrumb: (path: string) => void;
  setCurrentPath: (path: string, label: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { label: 'Home', path: '/', icon: 'home' }
  ]);

  // Initialize breadcrumbs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('breadcrumbs');
    if (saved) {
      try {
        setBreadcrumbs(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load breadcrumbs:', e);
      }
    }
  }, []);

  // Save breadcrumbs to localStorage
  useEffect(() => {
    localStorage.setItem('breadcrumbs', JSON.stringify(breadcrumbs));
  }, [breadcrumbs]);

  const addBreadcrumb = useCallback((item: BreadcrumbItem) => {
    setBreadcrumbs(prev => {
      // Check if breadcrumb already exists
      const exists = prev.some(b => b.path === item.path);
      if (exists) return prev;
      
      return [...prev, item];
    });
  }, []);

  const removeBreadcrumb = useCallback((path: string) => {
    setBreadcrumbs(prev => prev.filter(b => b.path !== path));
  }, []);

  const clearBreadcrumbs = useCallback(() => {
    setBreadcrumbs([{ label: 'Home', path: '/', icon: 'home' }]);
  }, []);

  const navigateToBreadcrumb = useCallback((path: string) => {
    // Find the breadcrumb and remove everything after it
    const index = breadcrumbs.findIndex(b => b.path === path);
    if (index !== -1) {
      setBreadcrumbs(prev => prev.slice(0, index + 1));
      window.location.href = path;
    }
  }, [breadcrumbs]);

  const setCurrentPath = useCallback((path: string, label: string) => {
    setBreadcrumbs(prev => {
      // Check if path already exists
      const exists = prev.findIndex(b => b.path === path);
      if (exists !== -1) {
        // Remove all breadcrumbs after this one
        return prev.slice(0, exists + 1);
      }
      
      // Add new breadcrumb
      return [...prev, { label, path }];
    });
  }, []);

  return (
    <BreadcrumbContext.Provider value={{
      breadcrumbs,
      addBreadcrumb,
      removeBreadcrumb,
      clearBreadcrumbs,
      navigateToBreadcrumb,
      setCurrentPath
    }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumb must be used within BreadcrumbProvider');
  }
  return context;
}
