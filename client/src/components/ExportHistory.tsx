import { useI18n } from '@/contexts/I18nContext';
import { trpc } from '@/lib/trpc';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Trash2, Download, FileText, Sheet, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export function ExportHistory() {
  const { language } = useI18n();
  const isRTL = language === 'ar';
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: exports = [], isLoading, refetch } = trpc.exportHistory.list.useQuery({ limit: 20 });
  const deleteExportMutation = trpc.exportHistory.delete.useMutation();
  const clearHistoryMutation = trpc.exportHistory.clear.useMutation();

  const handleDelete = async (id: number) => {
    if (confirm(language === 'ar' ? 'هل تريد حذف هذا السجل؟' : 'Are you sure you want to delete this record?')) {
      await deleteExportMutation.mutateAsync({ id });
      refetch();
    }
  };

  const handleClearAll = async () => {
    if (confirm(language === 'ar' ? 'هل تريد حذف جميع السجلات؟' : 'Are you sure you want to clear all history?')) {
      await clearHistoryMutation.mutateAsync();
      refetch();
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US');
  };

  const getFormatIcon = (format: string) => {
    return format === 'pdf' ? <FileText size={16} /> : <Sheet size={16} />;
  };

  const getStatusColor = (status: string) => {
    return status === 'success' ? 'text-green-400' : 'text-red-400';
  };

  if (isLoading) {
    return (
      <Card className="blueprint-card bg-card border-2 border-primary p-6">
        <div className="text-center text-muted-foreground">
          {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </div>
      </Card>
    );
  }

  return (
    <Card className="blueprint-card bg-card border-2 border-primary p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-primary">
          {language === 'ar' ? 'سجل التصديرات' : 'Export History'}
        </h3>
        {exports.length > 0 && (
          <Button
            onClick={handleClearAll}
            variant="outline"
            size="sm"
            className="text-destructive border-destructive hover:bg-destructive/10"
          >
            {language === 'ar' ? 'مسح الكل' : 'Clear All'}
          </Button>
        )}
      </div>

      {exports.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {language === 'ar' ? 'لا توجد تصديرات بعد' : 'No exports yet'}
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {exports.map((exp: any) => (
            <div
              key={exp.id}
              className="bg-card border border-primary/20 rounded-lg p-4 hover:border-primary/40 transition-all"
            >
              <div className="flex items-start justify-between gap-4" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="mt-1 text-accent">
                    {getFormatIcon(exp.fileFormat)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground truncate">{exp.fileName}</p>
                      <span className={`text-xs font-bold ${getStatusColor(exp.status)}`}>
                        {exp.status === 'success' ? '✓' : '✗'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(exp.createdAt)}
                    </p>
                    {exp.status === 'failed' && exp.errorMessage && (
                      <div
                        className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded text-xs text-red-300 flex items-start gap-2"
                      >
                        <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                        <span>{exp.errorMessage}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    onClick={() => setExpandedId(expandedId === exp.id ? null : exp.id)}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {language === 'ar' ? 'التفاصيل' : 'Details'}
                  </Button>
                  <Button
                    onClick={() => handleDelete(exp.id)}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>

              {expandedId === exp.id && (
                <div className="mt-4 pt-4 border-t border-primary/20 space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>{language === 'ar' ? 'النوع:' : 'Type:'}</span>
                    <span className="text-foreground">{exp.exportType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'ar' ? 'الصيغة:' : 'Format:'}</span>
                    <span className="text-foreground uppercase">{exp.fileFormat}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'ar' ? 'الحالة:' : 'Status:'}</span>
                    <span className={getStatusColor(exp.status)}>
                      {exp.status === 'success'
                        ? language === 'ar'
                          ? 'نجح'
                          : 'Success'
                        : language === 'ar'
                        ? 'فشل'
                        : 'Failed'}
                    </span>
                  </div>
                  {exp.fileSize > 0 && (
                    <div className="flex justify-between">
                      <span>{language === 'ar' ? 'الحجم:' : 'Size:'}</span>
                      <span className="text-foreground">
                        {(exp.fileSize / 1024).toFixed(2)} KB
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
