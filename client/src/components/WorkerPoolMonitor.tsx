/**
 * Worker Pool Monitor Component
 * 
 * Displays real-time worker pool status and task queue
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getWorkerPool, WorkerPoolStatus, Task } from '@/lib/workerPool';

interface WorkerPoolMonitorProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function WorkerPoolMonitor({ isOpen = true, onClose }: WorkerPoolMonitorProps) {
  const [status, setStatus] = useState<WorkerPoolStatus | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const pool = getWorkerPool();

    // Subscribe to status updates
    const unsubscribe = pool.subscribe((newStatus) => {
      setStatus(newStatus);
      setTasks(pool.getAllTasks());
    });

    // Initial status
    setStatus(pool.getStatus());
    setTasks(pool.getAllTasks());

    return () => {
      unsubscribe();
    };
  }, []);

  if (!isOpen || !status) return null;

  const successRate = status.completedTasks + status.failedTasks > 0
    ? ((status.completedTasks / (status.completedTasks + status.failedTasks)) * 100).toFixed(1)
    : 'N/A';

  return (
    <div className="fixed bottom-4 left-4 w-96 max-h-96 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex justify-between items-center">
        <h3 className="text-white font-semibold">🔄 Worker Pool Monitor</h3>
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
        {/* Pool Stats */}
        <div className="grid grid-cols-2 gap-2">
          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-purple-500">
                {status.activeWorkers}/{status.totalWorkers}
              </div>
              <div className="text-xs text-muted-foreground">Active Workers</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-500">{status.queuedTasks}</div>
              <div className="text-xs text-muted-foreground">Queued Tasks</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-500">{status.completedTasks}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-500">{status.failedTasks}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </CardContent>
          </Card>
        </div>

        {/* Success Rate */}
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Progress value={parseFloat(successRate as string) || 0} className="flex-1" />
              <span className="text-sm font-mono">{successRate}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Worker Details */}
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Worker Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-32 overflow-y-auto">
            {status.workers.map(worker => (
              <div key={worker.id} className="flex items-center justify-between text-xs p-2 bg-background/50 rounded">
                <div className="flex-1">
                  <div className="font-mono">Worker {worker.id}</div>
                  <div className="text-muted-foreground">
                    {worker.completedTasks} completed, {worker.failedTasks} failed
                  </div>
                </div>
                <Badge
                  variant={
                    worker.health === 'healthy'
                      ? 'default'
                      : worker.health === 'degraded'
                        ? 'secondary'
                        : 'destructive'
                  }
                >
                  {worker.isActive ? '🟢 Running' : '⚪ Idle'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Task Queue */}
        {tasks.length > 0 && (
          <Card className="bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Task Queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 max-h-32 overflow-y-auto">
              {tasks.slice(0, 5).map(task => (
                <div
                  key={task.id}
                  className="flex items-center justify-between text-xs p-2 bg-background/50 rounded"
                >
                  <div className="flex-1 truncate">
                    <div className="truncate">{task.file.name}</div>
                    <div className="text-muted-foreground">
                      Priority: {task.priority}
                    </div>
                  </div>
                  <Badge
                    variant={
                      task.status === 'completed'
                        ? 'default'
                        : task.status === 'failed'
                          ? 'destructive'
                          : task.status === 'running'
                            ? 'secondary'
                            : 'outline'
                    }
                  >
                    {task.status === 'running' && '⏳'}
                    {task.status === 'completed' && '✓'}
                    {task.status === 'failed' && '✗'}
                    {task.status === 'pending' && '⏱'}
                    {task.status}
                  </Badge>
                </div>
              ))}
              {tasks.length > 5 && (
                <div className="text-xs text-muted-foreground text-center py-2">
                  +{tasks.length - 5} more tasks
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Average Task Time */}
        {status.averageTaskTime > 0 && (
          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="text-sm">
                <div className="text-muted-foreground mb-1">Average Task Time</div>
                <div className="text-2xl font-bold text-cyan-500">
                  {(status.averageTaskTime / 1000).toFixed(1)}s
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
