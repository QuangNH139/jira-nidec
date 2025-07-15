import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { projectsAPI } from '../services/api';
import { Project } from '../types';

// Query keys
export const projectKeys = {
  all: ['projects'] as const,
  detail: (id: number) => ['projects', id] as const,
  members: (id: number) => ['projects', id, 'members'] as const,
  statuses: (id: number) => ['projects', id, 'statuses'] as const,
};

// Fetch all projects
export const useProjects = () => {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: async () => {
      const response = await projectsAPI.getAll();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch single project
export const useProject = (id: number) => {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const response = await projectsAPI.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

// Fetch project members
export const useProjectMembers = (projectId: number) => {
  return useQuery({
    queryKey: projectKeys.members(projectId),
    queryFn: async () => {
      const response = await projectsAPI.getMembers(projectId);
      return response.data;
    },
    enabled: !!projectId,
  });
};

// Fetch project statuses
export const useProjectStatuses = (projectId: number) => {
  return useQuery({
    queryKey: projectKeys.statuses(projectId),
    queryFn: async () => {
      const response = await projectsAPI.getStatuses(projectId);
      return response.data;
    },
    enabled: !!projectId,
  });
};

// Create project mutation
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Project>) => {
      const response = await projectsAPI.create(data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch projects
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      message.success('Project created successfully!');
    },
    onError: () => {
      message.error('Failed to create project');
    },
  });
};

// Update project mutation
export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Project> }) => {
      const response = await projectsAPI.update(id, data);
      return response.data;
    },
    onSuccess: (updatedProject: any) => {
      // Update the specific project in cache
      queryClient.setQueryData(
        projectKeys.detail(updatedProject.data?.id || updatedProject.id),
        updatedProject.data || updatedProject
      );
      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      message.success('Project updated successfully!');
    },
    onError: () => {
      message.error('Failed to update project');
    },
  });
};

// Delete project mutation
export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await projectsAPI.delete(id);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch projects
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      message.success('Project deleted successfully!');
    },
    onError: () => {
      message.error('Failed to delete project');
    },
  });
};

// Add project member mutation
export const useAddProjectMember = (projectId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberData: { user_id: number; role?: string }) => {
      const response = await projectsAPI.addMember(projectId, memberData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.members(projectId) });
      message.success('Member added successfully');
    },
    onError: (error: any) => {
      console.error('Error adding member:', error);
      message.error('Failed to add member');
    },
  });
};

// Remove project member mutation
export const useRemoveProjectMember = (projectId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await projectsAPI.removeMember(projectId, userId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.members(projectId) });
      message.success('Member removed successfully');
    },
    onError: (error: any) => {
      console.error('Error removing member:', error);
      message.error('Failed to remove member');
    },
  });
};
