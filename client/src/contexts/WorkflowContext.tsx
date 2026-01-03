import { createContext, useContext, useState, useCallback } from 'react';

export interface WorkflowData {
  projectId?: number;
  projectName: string;
  description: string;
  items: any[];
  analysisResults?: string;
  riskData?: any;
  currentStep: 'creation' | 'analysis' | 'risks' | 'complete';
}

interface WorkflowContextType {
  workflow: WorkflowData;
  updateWorkflow: (data: Partial<WorkflowData>) => void;
  setProjectData: (id: number, name: string, description: string) => void;
  setAnalysisResults: (results: string) => void;
  setRiskData: (risks: any) => void;
  advanceStep: () => void;
  reset: () => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

const initialState: WorkflowData = {
  projectName: '',
  description: '',
  items: [],
  currentStep: 'creation',
};

export function WorkflowProvider({ children }: { children: React.ReactNode }) {
  const [workflow, setWorkflow] = useState<WorkflowData>(initialState);

  const updateWorkflow = useCallback((data: Partial<WorkflowData>) => {
    setWorkflow(prev => ({ ...prev, ...data }));
  }, []);

  const setProjectData = useCallback((id: number, name: string, description: string) => {
    setWorkflow(prev => ({
      ...prev,
      projectId: id,
      projectName: name,
      description,
      currentStep: 'analysis',
    }));
  }, []);

  const setAnalysisResults = useCallback((results: string) => {
    setWorkflow(prev => ({
      ...prev,
      analysisResults: results,
      currentStep: 'risks',
    }));
  }, []);

  const setRiskData = useCallback((risks: any) => {
    setWorkflow(prev => ({
      ...prev,
      riskData: risks,
      currentStep: 'complete',
    }));
  }, []);

  const advanceStep = useCallback(() => {
    setWorkflow(prev => {
      const steps: Array<WorkflowData['currentStep']> = ['creation', 'analysis', 'risks', 'complete'];
      const currentIndex = steps.indexOf(prev.currentStep);
      const nextStep = steps[currentIndex + 1] || 'complete';
      return { ...prev, currentStep: nextStep };
    });
  }, []);

  const reset = useCallback(() => {
    setWorkflow(initialState);
  }, []);

  return (
    <WorkflowContext.Provider
      value={{
        workflow,
        updateWorkflow,
        setProjectData,
        setAnalysisResults,
        setRiskData,
        advanceStep,
        reset,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within WorkflowProvider');
  }
  return context;
}
