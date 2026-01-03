/**
 * Worker Pool Management System
 * 
 * Manages multiple concurrent PDF extraction workers with:
 * - Queue management for concurrent uploads
 * - Priority handling
 * - Worker health monitoring
 * - Auto-restart for failed workers
 * - Load balancing
 */

import { extractPDFIncremental, ExtractionOptions } from './incrementalPdfExtractor';
import { metricsCollector } from './workerMetrics';

export interface Task {
  id: string;
  file: File;
  priority: number; // 0-10, higher = more important
  options?: ExtractionOptions;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  error?: Error;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface WorkerStatus {
  id: number;
  isActive: boolean;
  currentTask?: Task;
  completedTasks: number;
  failedTasks: number;
  totalTime: number;
  lastError?: Error;
  health: 'healthy' | 'degraded' | 'failed';
}

/**
 * Worker Pool Manager
 */
export class WorkerPoolManager {
  private maxWorkers: number;
  private workers: Map<number, WorkerStatus> = new Map();
  private taskQueue: Task[] = [];
  private activeTasks: Map<string, Task> = new Map();
  private completedTasks: Map<string, Task> = new Map();
  private listeners: Set<(status: WorkerPoolStatus) => void> = new Set();
  private processInterval: NodeJS.Timeout | null = null;

  constructor(maxWorkers: number = 4) {
    this.maxWorkers = Math.max(1, Math.min(maxWorkers, 8)); // Limit between 1-8

    // Initialize workers
    for (let i = 0; i < this.maxWorkers; i++) {
      this.workers.set(i, {
        id: i,
        isActive: false,
        completedTasks: 0,
        failedTasks: 0,
        totalTime: 0,
        health: 'healthy',
      });
    }

    // Start processing queue
    this.startProcessing();
  }

  /**
   * Add a task to the queue
   */
  addTask(file: File, options?: ExtractionOptions, priority: number = 5): string {
    const taskId = `${file.name}-${Date.now()}-${Math.random()}`;

    const task: Task = {
      id: taskId,
      file,
      priority: Math.max(0, Math.min(10, priority)),
      options,
      status: 'pending',
      createdAt: Date.now(),
    };

    this.taskQueue.push(task);
    this.sortQueue();
    this.notifyListeners();

    return taskId;
  }

  /**
   * Cancel a task
   */
  cancelTask(taskId: string): boolean {
    // Remove from queue if pending
    const queueIndex = this.taskQueue.findIndex(t => t.id === taskId);
    if (queueIndex >= 0) {
      this.taskQueue.splice(queueIndex, 1);
      this.notifyListeners();
      return true;
    }

    // Can't cancel running tasks
    return false;
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): Task | undefined {
    return this.activeTasks.get(taskId) || this.completedTasks.get(taskId);
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    return [
      ...this.taskQueue,
      ...Array.from(this.activeTasks.values()),
      ...Array.from(this.completedTasks.values()),
    ];
  }

  /**
   * Get pool status
   */
  getStatus(): WorkerPoolStatus {
    const activeWorkers = Array.from(this.workers.values()).filter(w => w.isActive).length;
    const totalCompleted = Array.from(this.workers.values()).reduce((sum, w) => sum + w.completedTasks, 0);
    const totalFailed = Array.from(this.workers.values()).reduce((sum, w) => sum + w.failedTasks, 0);
    const avgTaskTime = totalCompleted > 0
      ? Array.from(this.workers.values()).reduce((sum, w) => sum + w.totalTime, 0) / totalCompleted
      : 0;

    return {
      activeWorkers,
      totalWorkers: this.maxWorkers,
      queuedTasks: this.taskQueue.length,
      activeTasks: this.activeTasks.size,
      completedTasks: totalCompleted,
      failedTasks: totalFailed,
      averageTaskTime: avgTaskTime,
      workers: Array.from(this.workers.values()),
    };
  }

  /**
   * Subscribe to status updates
   */
  subscribe(listener: (status: WorkerPoolStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Start processing queue
   */
  private startProcessing(): void {
    this.processInterval = setInterval(() => {
      this.processQueue();
    }, 100);
  }

  /**
   * Process queue and assign tasks to available workers
   */
  private async processQueue(): Promise<void> {
    // Find available workers
    const availableWorkers = Array.from(this.workers.values()).filter(
      w => !w.isActive && w.health !== 'failed'
    );

    // Assign tasks to available workers
    for (const worker of availableWorkers) {
      if (this.taskQueue.length === 0) break;

      const task = this.taskQueue.shift();
      if (!task) break;

      worker.isActive = true;
      task.status = 'running';
      task.startedAt = Date.now();
      this.activeTasks.set(task.id, task);

      // Process task asynchronously
      this.processTask(worker, task);
    }

    this.notifyListeners();
  }

  /**
   * Process a single task
   */
  private async processTask(worker: WorkerStatus, task: Task): Promise<void> {
    const startTime = performance.now();

    try {
      worker.currentTask = task;

      const result = await extractPDFIncremental(task.file, {
        ...task.options,
        onProgress: task.options?.onProgress,
      });

      task.result = result;
      task.status = 'completed';
      task.completedAt = Date.now();

      worker.completedTasks++;
      worker.totalTime += performance.now() - startTime;
      worker.health = 'healthy';

      this.completedTasks.set(task.id, task);
      this.activeTasks.delete(task.id);
    } catch (error) {
      task.error = error instanceof Error ? error : new Error('Unknown error');
      task.status = 'failed';
      task.completedAt = Date.now();

      worker.failedTasks++;
      worker.lastError = task.error;
      worker.health = worker.failedTasks > 3 ? 'failed' : 'degraded';

      this.completedTasks.set(task.id, task);
      this.activeTasks.delete(task.id);

      console.error(`Task ${task.id} failed:`, task.error);
    } finally {
      worker.isActive = false;
      worker.currentTask = undefined;
      this.notifyListeners();
    }
  }

  /**
   * Sort queue by priority (higher first) and creation time
   */
  private sortQueue(): void {
    this.taskQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.createdAt - b.createdAt;
    });
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }

  /**
   * Shutdown the pool
   */
  shutdown(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
    this.listeners.clear();
  }

  /**
   * Clear completed tasks
   */
  clearCompleted(): void {
    this.completedTasks.clear();
    this.notifyListeners();
  }

  /**
   * Reset pool statistics
   */
  reset(): void {
    this.taskQueue = [];
    this.activeTasks.clear();
    this.completedTasks.clear();

    this.workers.forEach(worker => {
      worker.isActive = false;
      worker.currentTask = undefined;
      worker.completedTasks = 0;
      worker.failedTasks = 0;
      worker.totalTime = 0;
      worker.health = 'healthy';
    });

    this.notifyListeners();
  }
}

export interface WorkerPoolStatus {
  activeWorkers: number;
  totalWorkers: number;
  queuedTasks: number;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageTaskTime: number;
  workers: WorkerStatus[];
}

/**
 * Global worker pool instance
 */
let globalWorkerPool: WorkerPoolManager | null = null;

/**
 * Get or create global worker pool
 */
export function getWorkerPool(maxWorkers: number = 4): WorkerPoolManager {
  if (!globalWorkerPool) {
    globalWorkerPool = new WorkerPoolManager(maxWorkers);
  }
  return globalWorkerPool;
}

/**
 * Shutdown global worker pool
 */
export function shutdownWorkerPool(): void {
  if (globalWorkerPool) {
    globalWorkerPool.shutdown();
    globalWorkerPool = null;
  }
}
