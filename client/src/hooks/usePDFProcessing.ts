/**
 * usePDFProcessing Hook
 * 
 * Integrates all three advanced PDF.js features:
 * - Worker Performance Dashboard
 * - Incremental PDF Rendering
 * - Worker Pool Management
 */

import { useCallback, useEffect, useState } from 'react';
import { getWorkerPool, WorkerPoolStatus, Task } from '@/lib/workerPool';
import { metricsCollector, PDFMetrics } from '@/lib/workerMetrics';

export interface PDFProcessingState {
  // Pool status
  poolStatus: WorkerPoolStatus | null;
  
  // Metrics
  metrics: PDFMetrics[];
  summary: {
    totalPDFs: number;
    successfulPDFs: number;
    failedPDFs: number;
    averageExtractionTime: number;
    averageSpeed: number;
    totalTextExtracted: number;
  };
  
  // Tasks
  tasks: Task[];
  
  // UI state
  showPerformanceDashboard: boolean;
  showWorkerPoolMonitor: boolean;
  showIncrementalRenderer: boolean;
}

export interface PDFProcessingActions {
  // Pool operations
  addPDFToQueue: (file: File, priority?: number) => string;
  cancelTask: (taskId: string) => boolean;
  
  // Dashboard operations
  togglePerformanceDashboard: () => void;
  toggleWorkerPoolMonitor: () => void;
  toggleIncrementalRenderer: () => void;
  
  // Data operations
  exportMetrics: () => string;
  clearMetrics: () => void;
  resetPool: () => void;
}

/**
 * Hook for integrated PDF processing
 */
export function usePDFProcessing() {
  const [poolStatus, setPoolStatus] = useState<WorkerPoolStatus | null>(null);
  const [metrics, setMetrics] = useState<PDFMetrics[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);
  const [showWorkerPoolMonitor, setShowWorkerPoolMonitor] = useState(false);
  const [showIncrementalRenderer, setShowIncrementalRenderer] = useState(false);

  const pool = getWorkerPool();

  // Subscribe to pool updates
  useEffect(() => {
    const unsubscribe = pool.subscribe((status) => {
      setPoolStatus(status);
      setTasks(pool.getAllTasks());
    });

    // Initial state
    setPoolStatus(pool.getStatus());
    setTasks(pool.getAllTasks());

    return () => unsubscribe();
  }, [pool]);

  // Subscribe to metrics updates
  useEffect(() => {
    const unsubscribe = metricsCollector.subscribe(() => {
      setMetrics(metricsCollector.getAllMetrics());
    });

    // Initial state
    setMetrics(metricsCollector.getAllMetrics());

    return () => unsubscribe();
  }, []);

  // Actions
  const addPDFToQueue = useCallback(
    (file: File, priority: number = 5): string => {
      return pool.addTask(file, undefined, priority);
    },
    [pool]
  );

  const cancelTask = useCallback(
    (taskId: string): boolean => {
      return pool.cancelTask(taskId);
    },
    [pool]
  );

  const togglePerformanceDashboard = useCallback(() => {
    setShowPerformanceDashboard(prev => !prev);
  }, []);

  const toggleWorkerPoolMonitor = useCallback(() => {
    setShowWorkerPoolMonitor(prev => !prev);
  }, []);

  const toggleIncrementalRenderer = useCallback(() => {
    setShowIncrementalRenderer(prev => !prev);
  }, []);

  const exportMetrics = useCallback(() => {
    return metricsCollector.exportMetrics();
  }, []);

  const clearMetrics = useCallback(() => {
    pool.clearCompleted();
  }, [pool]);

  const resetPool = useCallback(() => {
    pool.reset();
  }, [pool]);

  // Get summary
  const summary = metricsCollector.getSummary();

  const state: PDFProcessingState = {
    poolStatus,
    metrics,
    summary,
    tasks,
    showPerformanceDashboard,
    showWorkerPoolMonitor,
    showIncrementalRenderer,
  };

  const actions: PDFProcessingActions = {
    addPDFToQueue,
    cancelTask,
    togglePerformanceDashboard,
    toggleWorkerPoolMonitor,
    toggleIncrementalRenderer,
    exportMetrics,
    clearMetrics,
    resetPool,
  };

  return { state, actions };
}
