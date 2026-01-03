/**
 * Advanced PDF Processor Component
 * 
 * Integrates all three advanced features:
 * - Worker Performance Dashboard
 * - Incremental PDF Rendering
 * - Worker Pool Management
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePDFProcessing } from '@/hooks/usePDFProcessing';
import { PerformanceDashboard } from './PerformanceDashboard';
import { WorkerPoolMonitor } from './WorkerPoolMonitor';
import { IncrementalPDFRenderer } from './IncrementalPDFRenderer';

interface AdvancedPDFProcessorProps {
  onFilesProcessed?: (results: Map<string, string>) => void;
}

export function AdvancedPDFProcessor({ onFilesProcessed }: AdvancedPDFProcessorProps) {
  const { state, actions } = usePDFProcessing();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [priority, setPriority] = useState(5);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    }
  };

  const handleAddToQueue = () => {
    if (selectedFile) {
      actions.addPDFToQueue(selectedFile, priority);
      setSelectedFile(null);
    }
  };

  const handleExportMetrics = () => {
    const data = actions.exportMetrics();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pdf-processing-metrics-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <CardHeader>
          <CardTitle className="text-lg">🚀 Advanced PDF Processor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Select PDF File</label>
            <div className="flex gap-2">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="flex-1 px-3 py-2 border border-border rounded-md text-sm"
              />
              {selectedFile && (
                <Badge variant="default" className="self-center">
                  {selectedFile.name}
                </Badge>
              )}
            </div>
          </div>

          {/* Priority Selector */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Priority: <span className="font-bold text-blue-500">{priority}</span>
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleAddToQueue}
              disabled={!selectedFile}
              className="bg-blue-600 hover:bg-blue-700"
            >
              ➕ Add to Queue
            </Button>

            <Button
              variant="outline"
              onClick={actions.togglePerformanceDashboard}
              className={state.showPerformanceDashboard ? 'ring-2 ring-blue-500' : ''}
            >
              📊 Dashboard
            </Button>

            <Button
              variant="outline"
              onClick={actions.toggleWorkerPoolMonitor}
              className={state.showWorkerPoolMonitor ? 'ring-2 ring-purple-500' : ''}
            >
              🔄 Pool Monitor
            </Button>

            <Button
              variant="outline"
              onClick={handleExportMetrics}
              disabled={state.metrics.length === 0}
            >
              📥 Export
            </Button>
          </div>

          {/* Reset Button */}
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={actions.resetPool}
          >
            🔄 Reset All
          </Button>
        </CardContent>
      </Card>

      {/* Status Overview */}
      {state.poolStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pool Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className="bg-background/50 p-3 rounded text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {state.poolStatus.activeWorkers}/{state.poolStatus.totalWorkers}
                </div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>

              <div className="bg-background/50 p-3 rounded text-center">
                <div className="text-2xl font-bold text-cyan-500">
                  {state.poolStatus.queuedTasks}
                </div>
                <div className="text-xs text-muted-foreground">Queued</div>
              </div>

              <div className="bg-background/50 p-3 rounded text-center">
                <div className="text-2xl font-bold text-green-500">
                  {state.poolStatus.completedTasks}
                </div>
                <div className="text-xs text-muted-foreground">Done</div>
              </div>

              <div className="bg-background/50 p-3 rounded text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {(state.poolStatus.averageTaskTime / 1000).toFixed(1)}s
                </div>
                <div className="text-xs text-muted-foreground">Avg Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Summary */}
      {state.summary.totalPDFs > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">📈 Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total PDFs</div>
                <div className="text-2xl font-bold">{state.summary.totalPDFs}</div>
              </div>

              <div>
                <div className="text-muted-foreground">Success Rate</div>
                <div className="text-2xl font-bold text-green-500">
                  {state.summary.totalPDFs > 0
                    ? ((state.summary.successfulPDFs / state.summary.totalPDFs) * 100).toFixed(1)
                    : 0}
                  %
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">Avg Extraction Time</div>
                <div className="text-2xl font-bold text-blue-500">
                  {(state.summary.averageExtractionTime / 1000).toFixed(1)}s
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">Avg Speed</div>
                <div className="text-2xl font-bold text-purple-500">
                  {(state.summary.averageSpeed / 1000).toFixed(0)}k/s
                </div>
              </div>

              <div className="col-span-2">
                <div className="text-muted-foreground">Total Text Extracted</div>
                <div className="text-2xl font-bold text-cyan-500">
                  {(state.summary.totalTextExtracted / 1024 / 1024).toFixed(1)}MB
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboards */}
      <PerformanceDashboard
        isOpen={state.showPerformanceDashboard}
        onClose={actions.togglePerformanceDashboard}
      />

      <WorkerPoolMonitor
        isOpen={state.showWorkerPoolMonitor}
        onClose={actions.toggleWorkerPoolMonitor}
      />

      {/* Incremental Renderer for Selected File */}
      {selectedFile && state.showIncrementalRenderer && (
        <IncrementalPDFRenderer
          file={selectedFile}
          onComplete={(text) => {
            console.log('PDF extraction completed:', text.length, 'characters');
          }}
          onError={(error) => {
            console.error('PDF extraction error:', error);
          }}
        />
      )}
    </div>
  );
}
