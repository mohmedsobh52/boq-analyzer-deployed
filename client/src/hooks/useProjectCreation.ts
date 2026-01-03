import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export interface ProjectCreationData {
  name: string;
  description?: string;
  items?: Array<{
    itemCode: string;
    description: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    totalPrice?: number;
    category?: string;
    wbsCode?: string;
    notes?: string;
  }>;
}

export function useProjectCreation() {
  const [isCreating, setIsCreating] = useState(false);
  const createProjectMutation = trpc.projects.create.useMutation();
  const addItemsMutation = trpc.projects.addItems.useMutation();
  // uploadFile is not yet implemented
  // const uploadFileMutation = trpc.projects.uploadFile.useMutation();
  const invalidateProjects = trpc.useUtils().projects.invalidate;

  const createProject = async (
    projectData: ProjectCreationData,
    fileUrl?: string,
    fileKey?: string,
    fileName?: string,
    fileType?: string,
    fileSize?: number
  ) => {
    setIsCreating(true);
    try {
      // Create project
      const projectResult = await createProjectMutation.mutateAsync({
        name: projectData.name,
        description: projectData.description,
      });

      const projectId = (projectResult as any).insertId || projectResult[0];

      // Add items if provided
      if (projectData.items && projectData.items.length > 0) {
        await addItemsMutation.mutateAsync({
          projectId: projectId as number,
          items: projectData.items,
        });
      }

      // Upload file if provided
      if (fileUrl && fileKey && fileName && fileType && fileSize) {
        // uploadFile is not yet implemented
        console.warn('File upload feature coming soon');
      }

      // Invalidate projects list to refresh
      await invalidateProjects();

      toast.success('Project created successfully');
      return projectId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createProject,
    isCreating,
    isLoading: createProjectMutation.isPending || addItemsMutation.isPending,
  };
}
