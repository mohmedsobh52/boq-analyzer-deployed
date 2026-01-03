import { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';

export interface ProjectWorkflowState {
  projectId?: string;
  projectName: string;
  description: string;
  items: any[];
  analysisResults?: string;
  riskAssessment?: any;
  currentStep: 'creation' | 'analysis' | 'risks' | 'complete';
}

const initialState: ProjectWorkflowState = {
  projectName: '',
  description: '',
  items: [],
  currentStep: 'creation',
};

export function useProjectWorkflow() {
  const [, setLocation] = useLocation();
  const { setCurrentPath } = useBreadcrumb();
  const [state, setState] = useState<ProjectWorkflowState>(initialState);

  const createProject = useCallback(async (data: Omit<ProjectWorkflowState, 'currentStep'>) => {
    setState(prev => ({
      ...prev,
      ...data,
      currentStep: 'analysis'
    }));

    // Simulate project creation and redirect to analysis
    setTimeout(() => {
      if (data.projectId) {
        setCurrentPath(`/projects/${data.projectId}`, data.projectName);
        setLocation(`/projects/${data.projectId}`);
      }
    }, 500);
  }, [setLocation, setCurrentPath]);

  const updateAnalysis = useCallback((analysis: string) => {
    setState(prev => ({
      ...prev,
      analysisResults: analysis,
      currentStep: 'risks'
    }));
  }, []);

  const updateRiskAssessment = useCallback((risks: any) => {
    setState(prev => ({
      ...prev,
      riskAssessment: risks,
      currentStep: 'complete'
    }));
  }, []);

  const navigateToAnalytics = useCallback(() => {
    if (state.projectId) {
      setCurrentPath('/analytics', 'Analytics');
      setLocation('/analytics');
    }
  }, [state.projectId, setLocation, setCurrentPath]);

  const navigateToRisks = useCallback(() => {
    if (state.projectId) {
      setCurrentPath(`/projects/${state.projectId}/risks`, 'Risk Management');
      setLocation(`/projects/${state.projectId}/risks`);
    }
  }, [state.projectId, setLocation, setCurrentPath]);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    createProject,
    updateAnalysis,
    updateRiskAssessment,
    navigateToAnalytics,
    navigateToRisks,
    reset,
  };
}
