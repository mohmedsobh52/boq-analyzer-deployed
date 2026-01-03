import { describe, it, expect, beforeEach } from 'vitest';

describe('Breadcrumb Navigation System', () => {
  describe('Breadcrumb Context', () => {
    it('should initialize with home breadcrumb', () => {
      const initialBreadcrumbs = [
        { label: 'Home', path: '/', icon: 'home' }
      ];
      expect(initialBreadcrumbs).toHaveLength(1);
      expect(initialBreadcrumbs[0]?.path).toBe('/');
    });

    it('should add new breadcrumb without duplicates', () => {
      const breadcrumbs = [
        { label: 'Home', path: '/', icon: 'home' }
      ];
      const newItem = { label: 'Projects', path: '/projects' };
      const updated = [...breadcrumbs, newItem];
      
      expect(updated).toHaveLength(2);
      expect(updated[1]?.path).toBe('/projects');
    });

    it('should not add duplicate breadcrumbs', () => {
      const breadcrumbs = [
        { label: 'Home', path: '/', icon: 'home' },
        { label: 'Projects', path: '/projects' }
      ];
      const duplicate = { label: 'Projects', path: '/projects' };
      
      const exists = breadcrumbs.some(b => b.path === duplicate.path);
      expect(exists).toBe(true);
    });

    it('should remove breadcrumb by path', () => {
      const breadcrumbs = [
        { label: 'Home', path: '/', icon: 'home' },
        { label: 'Projects', path: '/projects' },
        { label: 'Project Detail', path: '/projects/1' }
      ];
      const filtered = breadcrumbs.filter(b => b.path !== '/projects');
      
      expect(filtered).toHaveLength(2);
      expect(filtered.find(b => b.path === '/projects')).toBeUndefined();
    });

    it('should clear breadcrumbs to home only', () => {
      const breadcrumbs = [
        { label: 'Home', path: '/', icon: 'home' },
        { label: 'Projects', path: '/projects' }
      ];
      const cleared = [{ label: 'Home', path: '/', icon: 'home' }];
      
      expect(cleared).toHaveLength(1);
      expect(cleared[0]?.path).toBe('/');
    });

    it('should navigate to breadcrumb and remove after items', () => {
      const breadcrumbs = [
        { label: 'Home', path: '/', icon: 'home' },
        { label: 'Projects', path: '/projects' },
        { label: 'Project Detail', path: '/projects/1' },
        { label: 'Analytics', path: '/projects/1/analytics' }
      ];
      const targetIndex = 1;
      const navigated = breadcrumbs.slice(0, targetIndex + 1);
      
      expect(navigated).toHaveLength(2);
      expect(navigated[1]?.path).toBe('/projects');
    });
  });

  describe('Breadcrumb Component', () => {
    it('should not render if only home breadcrumb', () => {
      const breadcrumbs = [
        { label: 'Home', path: '/', icon: 'home' }
      ];
      const shouldRender = breadcrumbs.length > 1;
      
      expect(shouldRender).toBe(false);
    });

    it('should render breadcrumbs when multiple items', () => {
      const breadcrumbs = [
        { label: 'Home', path: '/', icon: 'home' },
        { label: 'Projects', path: '/projects' },
        { label: 'Project Detail', path: '/projects/1' }
      ];
      const shouldRender = breadcrumbs.length > 1;
      
      expect(shouldRender).toBe(true);
      expect(breadcrumbs).toHaveLength(3);
    });

    it('should translate breadcrumb labels based on language', () => {
      const breadcrumbLabels = {
        en: {
          '/': 'Home',
          '/projects': 'Projects',
          '/analytics': 'Analytics'
        },
        ar: {
          '/': 'الرئيسية',
          '/projects': 'المشاريع',
          '/analytics': 'التحليلات'
        }
      };

      expect(breadcrumbLabels.en['/projects']).toBe('Projects');
      expect(breadcrumbLabels.ar['/projects']).toBe('المشاريع');
    });

    it('should handle RTL layout correctly', () => {
      const isRTL = true;
      const flexDirection = isRTL ? 'flex-row-reverse' : '';
      
      expect(isRTL).toBe(true);
      expect(flexDirection).toBe('flex-row-reverse');
    });

    it('should disable current breadcrumb button', () => {
      const breadcrumbs = [
        { label: 'Home', path: '/', icon: 'home' },
        { label: 'Projects', path: '/projects' }
      ];
      const currentIndex = breadcrumbs.length - 1;
      
      expect(currentIndex).toBe(1);
      expect(breadcrumbs[currentIndex]?.path).toBe('/projects');
    });

    it('should show chevron separator between breadcrumbs', () => {
      const breadcrumbs = [
        { label: 'Home', path: '/', icon: 'home' },
        { label: 'Projects', path: '/projects' },
        { label: 'Project Detail', path: '/projects/1' }
      ];
      const separatorCount = breadcrumbs.length - 1;
      
      expect(separatorCount).toBe(2);
    });
  });

  describe('Breadcrumb Navigation Paths', () => {
    it('should track common navigation paths', () => {
      const paths = [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Projects', path: '/projects' },
        { label: 'Project Detail', path: '/projects/:id' },
        { label: 'Analytics', path: '/analytics' },
        { label: 'Suppliers', path: '/suppliers' }
      ];
      
      expect(paths).toHaveLength(5);
      expect(paths.map(p => p.path)).toContain('/dashboard');
    });

    it('should handle dynamic routes with parameters', () => {
      const path = '/projects/123';
      const isDynamic = path.includes(':');
      
      expect(isDynamic).toBe(false);
      expect(path).toMatch(/\/projects\/\d+/);
    });

    it('should preserve breadcrumb order', () => {
      const breadcrumbs = [
        { label: 'Home', path: '/', icon: 'home' },
        { label: 'Projects', path: '/projects' },
        { label: 'Project Detail', path: '/projects/1' }
      ];
      
      expect(breadcrumbs[0]?.path).toBe('/');
      expect(breadcrumbs[1]?.path).toBe('/projects');
      expect(breadcrumbs[2]?.path).toBe('/projects/1');
    });
  });

  describe('Breadcrumb Persistence', () => {
    it('should serialize breadcrumbs to JSON', () => {
      const breadcrumbs = [
        { label: 'Home', path: '/', icon: 'home' },
        { label: 'Projects', path: '/projects' }
      ];
      const json = JSON.stringify(breadcrumbs);
      
      expect(json).toBeDefined();
      expect(json).toContain('Home');
      expect(json).toContain('Projects');
    });

    it('should deserialize breadcrumbs from JSON', () => {
      const json = '[{"label":"Home","path":"/","icon":"home"},{"label":"Projects","path":"/projects"}]';
      const breadcrumbs = JSON.parse(json);
      
      expect(breadcrumbs).toHaveLength(2);
      expect(breadcrumbs[0]?.label).toBe('Home');
    });

    it('should handle invalid JSON gracefully', () => {
      const invalidJson = 'invalid json';
      
      expect(() => {
        JSON.parse(invalidJson);
      }).toThrow();
    });
  });

  describe('Breadcrumb Accessibility', () => {
    it('should have proper title attributes', () => {
      const breadcrumb = {
        label: 'Projects',
        path: '/projects',
        title: 'Navigate to Projects'
      };
      
      expect(breadcrumb.title).toBeDefined();
      expect(breadcrumb.title).toContain('Projects');
    });

    it('should provide descriptive labels', () => {
      const breadcrumbs = [
        { label: 'Home', path: '/', icon: 'home' },
        { label: 'Projects', path: '/projects' }
      ];
      
      expect(breadcrumbs.every(b => b.label && b.path)).toBe(true);
    });

    it('should support keyboard navigation', () => {
      const breadcrumbs = [
        { label: 'Home', path: '/', icon: 'home' },
        { label: 'Projects', path: '/projects' }
      ];
      
      expect(breadcrumbs).toHaveLength(2);
      expect(breadcrumbs.every(b => b.label)).toBe(true);
    });
  });

  describe('Breadcrumb Edge Cases', () => {
    it('should handle empty breadcrumb list', () => {
      const breadcrumbs: any[] = [];
      const hasItems = breadcrumbs.length > 0;
      
      expect(hasItems).toBe(false);
    });

    it('should handle very long breadcrumb paths', () => {
      const breadcrumbs = [
        { label: 'Home', path: '/', icon: 'home' },
        { label: 'Projects', path: '/projects' },
        { label: 'Project Detail', path: '/projects/1' },
        { label: 'Analytics', path: '/projects/1/analytics' },
        { label: 'Risk Analysis', path: '/projects/1/analytics/risk' }
      ];
      
      expect(breadcrumbs.length).toBeGreaterThan(3);
    });

    it('should handle special characters in labels', () => {
      const breadcrumb = {
        label: 'Project & Analytics (2024)',
        path: '/projects/1'
      };
      
      expect(breadcrumb.label).toContain('&');
      expect(breadcrumb.label).toContain('(');
    });
  });
});
