/**
 * Performance Dashboard Component
 * 
 * Displays real-time metrics for PDF.js worker performance
 * Shows worker initialization time, extraction speed, memory usage
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { metricsCollector, PDFMetrics, WorkerPoolMetrics } from '@/lib/workerMetrics';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PerformanceDashboardProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function PerformanceDashboard({ isOpen = true, onClose }: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PDFMetrics[]>([]);
  const [workerPoolMetrics, setWorkerPoolMetrics] = useState<WorkerPoolMetrics | null>(null);
  const [selectedPDF, setSelectedPDF] = useState<PDFMetrics | null>(null);

  useEffect(() => {
    // Subscribe to metrics updates
    const unsubscribe = metricsCollector.subscribe((updatedMetrics) => {
      setMetrics(prev => {
        const existing = prev.findIndex(m => m.fileId === updatedMetrics.fileId);
        if (existing >= 0) {
          const newMetrics = [...prev];
          newMetrics[existing] = updatedMetrics;
          return newMetrics;
        }
        return [...prev, updatedMetrics];
      });

      // Auto-select first PDF
      if (!selectedPDF && updatedMetrics.fileId) {
        setSelectedPDF(updatedMetrics);
      }
    });

    // Update worker pool metrics periodically
    const interval = setInterval(() => {
      const poolMetrics = metricsCollector.getWorkerPoolMetrics();
      if (poolMetrics) {
        setWorkerPoolMetrics(poolMetrics);
      }
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [selectedPDF]);

  if (!isOpen) return null;

  const summary = metricsCollector.getSummary();

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 flex justify-between items-center">
        <h3 className="text-white font-semibold">📊 Performance Dashboard</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          ✕
        </Button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto max-h-80 p-4 space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-2">
          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-500">{summary.totalPDFs}</div>
              <div className="text-xs text-muted-foreground">Total PDFs</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-500">{summary.successfulPDFs}</div>
              <div className="text-xs text-muted-foreground">Successful</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-500">
                {(summary.averageExtractionTime / 1000).toFixed(1)}s
              </div>
              <div className="text-xs text-muted-foreground">Avg Time</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-purple-500">
                {(summary.averageSpeed / 1000).toFixed(0)}k
              </div>
              <div className="text-xs text-muted-foreground">Chars/sec</div>
            </CardContent>
          </Card>
        </div>

        {/* Worker Pool Status */}
        {workerPoolMetrics && (
          <Card className="bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Worker Pool</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Workers:</span>
                <Badge variant="outline">
                  {workerPoolMetrics.activeWorkers}/{workerPoolMetrics.totalWorkers}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Queued Tasks:</span>
                <Badge variant="outline">{workerPoolMetrics.queuedTasks}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Completed:</span>
                <Badge variant="outline" className="bg-green-500/20">
                  {workerPoolMetrics.completedTasks}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current PDF Details */}
        {selectedPDF && (
          <Card className="bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm truncate">{selectedPDF.fileName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Pages:</span>
                <span className="font-mono">
                  {selectedPDF.extractedPages}/{selectedPDF.totalPages}
                </span>
              </div>
              {selectedPDF.workerInitTime && (
                <div className="flex justify-between">
                  <span>Worker Init:</span>
                  <span className="font-mono">{selectedPDF.workerInitTime.toFixed(0)}ms</span>
                </div>
              )}
              {selectedPDF.averageTimePerPage && (
                <div className="flex justify-between">
                  <span>Avg/Page:</span>
                  <span className="font-mono">{selectedPDF.averageTimePerPage.toFixed(0)}ms</span>
                </div>
              )}
              {selectedPDF.averageSpeed && (
                <div className="flex justify-between">
                  <span>Speed:</span>
                  <span className="font-mono">{(selectedPDF.averageSpeed / 1000).toFixed(1)}k chars/s</span>
                </div>
              )}
              {selectedPDF.peakMemory && (
                <div className="flex justify-between">
                  <span>Peak Memory:</span>
                  <span className="font-mono">{(selectedPDF.peakMemory / 1024 / 1024).toFixed(1)}MB</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge variant={selectedPDF.success ? 'default' : 'destructive'}>
                  {selectedPDF.success ? '✓ Done' : '✗ Failed'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PDF List */}
        {metrics.length > 1 && (
          <Card className="bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recent PDFs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 max-h-32 overflow-y-auto">
              {metrics.map(pdf => (
                <button
                  key={pdf.fileId}
                  onClick={() => setSelectedPDF(pdf)}
                  className={`w-full text-left p-2 rounded text-xs transition-colors ${
                    selectedPDF?.fileId === pdf.fileId
                      ? 'bg-blue-500/20 border border-blue-500'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="truncate">{pdf.fileName}</span>
                    <Badge variant="outline" className="text-xs">
                      {pdf.extractedPages}/{pdf.totalPages}
                    </Badge>
                  </div>
                  {pdf.totalTime && (
                    <div className="text-xs text-muted-foreground">
                      {(pdf.totalTime / 1000).toFixed(1)}s
                    </div>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Export Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => {
            const data = metricsCollector.exportMetrics();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pdf-metrics-${new Date().toISOString()}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          📥 Export Metrics
        </Button>
      </div>
    </div>
  );
}
