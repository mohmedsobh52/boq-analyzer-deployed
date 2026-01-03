import { useState } from 'react';
import { Search, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface TemplateSelectorProps {
  onSelect: (templateId: number, items: any[]) => void;
  onClose?: () => void;
}

export function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: templates, isLoading } = trpc.templates.list.useQuery();
  const { data: selectedTemplate, isLoading: isLoadingTemplate } = trpc.templates.getWithItems.useQuery(
    { templateId: selectedCategory ? parseInt(selectedCategory) : 0 },
    { enabled: !!selectedCategory }
  );

  const filteredTemplates = templates?.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSelectTemplate = async (templateId: number) => {
    try {
      const result = await (trpc.templates.getWithItems as any)({ templateId });
      if (result?.items) {
        onSelect(templateId, result.items);
        toast.success('Template loaded successfully');
        onClose?.();
      }
    } catch (error) {
      toast.error('Failed to load template');
    }
  };

  const categories = Array.from(new Set(templates?.map(t => t.category) || []));

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="blueprint-input w-full pl-10"
        />
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setSelectedCategory(null)}
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            className={selectedCategory === null ? 'bg-primary text-primary-foreground' : ''}
          >
            All
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              className={selectedCategory === cat ? 'bg-primary text-primary-foreground' : ''}
            >
              {cat}
            </Button>
          ))}
        </div>
      )}

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No templates found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map(template => (
            <Card
              key={template.id}
              className="blueprint-card p-4 cursor-pointer hover:border-primary transition-colors group"
              onClick={() => handleSelectTemplate(template.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-primary group-hover:text-accent transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {template.category}
                    </span>
                  </div>
                </div>
                <ChevronRight className="text-primary group-hover:translate-x-1 transition-transform" size={20} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Template Preview */}
      {selectedTemplate && selectedTemplate.items && (
        <Card className="blueprint-card p-4 bg-card/50">
          <h4 className="font-bold text-primary mb-3">Preview: {selectedTemplate.template?.name}</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedTemplate.items.slice(0, 5).map((item: any, idx: number) => (
              <div key={idx} className="text-sm text-muted-foreground border-b border-border pb-2">
                <p className="font-bold text-foreground">{item.itemCode}: {item.description}</p>
                <p className="text-xs">{item.quantity} {item.unit} @ ${item.unitPrice.toLocaleString()}</p>
              </div>
            ))}
            {selectedTemplate.items.length > 5 && (
              <p className="text-xs text-muted-foreground italic">
                +{selectedTemplate.items.length - 5} more items
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={onClose}
          variant="outline"
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={() => selectedTemplate?.template?.id && handleSelectTemplate(selectedTemplate.template.id)}
          disabled={!selectedTemplate || !selectedTemplate.template?.id || isLoadingTemplate}
          className="flex-1 bg-primary hover:bg-accent text-primary-foreground font-bold rounded-sm border-2 border-primary hover:border-accent transition-all"
        >
          {isLoadingTemplate ? (
            <>
              <Loader2 className="animate-spin mr-2" size={16} />
              Loading...
            </>
          ) : (
            'Use This Template'
          )}
        </Button>
      </div>
    </div>
  );
}
