import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { issuesAPI } from '../services/api';
import { Issue } from '../types';

// Query keys
export const issueKeys = {
  all: ['issues'] as const,
  lists: () => [...issueKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...issueKeys.lists(), { filters }] as const,
  details: () => [...issueKeys.all, 'detail'] as const,
  detail: (id: number) => [...issueKeys.details(), id] as const,
  byProject: (projectId: number, sprint?: number) => [...issueKeys.all, 'project', projectId, { sprint }] as const,
  byUser: (userId: number) => [...issueKeys.all, 'user', userId] as const,
  kanban: (projectId: number, sprint?: number) => [...issueKeys.all, 'kanban', projectId, { sprint }] as const,
  stats: (projectId: number) => [...issueKeys.all, 'stats', projectId] as const,
};

// Hook for fetching issues by project
export const useProjectIssues = (projectId: number, sprint?: number) => {
  return useQuery({
    queryKey: issueKeys.byProject(projectId, sprint),
    queryFn: async () => {
      const response = await issuesAPI.getByProject(projectId, sprint);
      return response.data;
    },
    enabled: !!projectId,
  });
};

// Hook for fetching kanban board
export const useKanbanBoard = (projectId: number, sprint?: number) => {
  return useQuery({
    queryKey: issueKeys.kanban(projectId, sprint),
    queryFn: async () => {
      const response = await issuesAPI.getKanban(projectId, sprint);
      return response.data;
    },
    enabled: !!projectId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Hook for fetching issues by user
export const useUserIssues = (userId: number) => {
  return useQuery({
    queryKey: issueKeys.byUser(userId),
    queryFn: async () => {
      const response = await issuesAPI.getByUser(userId);
      return response.data;
    },
    enabled: !!userId,
  });
};

// Hook for fetching a single issue
export const useIssue = (issueId: number) => {
  return useQuery({
    queryKey: issueKeys.detail(issueId),
    queryFn: async () => {
      const response = await issuesAPI.getById(issueId);
      return response.data;
    },
    enabled: !!issueId,
  });
};

// Hook for fetching project statistics
export const useProjectStats = (projectId: number) => {
  return useQuery({
    queryKey: issueKeys.stats(projectId),
    queryFn: async () => {
      const response = await issuesAPI.getProjectStats(projectId);
      return response.data;
    },
    enabled: !!projectId,
  });
};

// Hook for creating an issue
export const useCreateIssue = (projectId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (issueData: Partial<Issue>) => {
      const response = await issuesAPI.create(issueData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: issueKeys.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.kanban(projectId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.stats(projectId) });
      message.success('Issue created successfully');
    },
    onError: (error: any) => {
      console.error('Error creating issue:', error);
      message.error('Failed to create issue');
    },
  });
};

// Hook for updating an issue
export const useUpdateIssue = (projectId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ issueId, issueData }: { issueId: number; issueData: Partial<Issue> }) => {
      const response = await issuesAPI.update(issueId, issueData);
      return response.data;
    },
    onSuccess: (_, { issueId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: issueKeys.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.kanban(projectId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(issueId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.stats(projectId) });
      message.success('Issue updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating issue:', error);
      message.error('Failed to update issue');
    },
  });
};

// Hook for updating issue status (drag and drop)
export const useUpdateIssueStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ issueId, statusId }: { issueId: number; statusId: number }) => {
      const response = await issuesAPI.updateStatus(issueId, statusId);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all kanban queries for simplicity
      queryClient.invalidateQueries({
        queryKey: issueKeys.all,
      });
      message.success('Issue status updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating issue status:', error);
      message.error('Failed to update issue status');
    },
  });
};

// Hook for adding issue to sprint
export const useAddIssueToSprint = (projectId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ issueId, sprintId }: { issueId: number; sprintId: number }) => {
      const response = await issuesAPI.addToSprint(issueId, sprintId);
      return response.data;
    },
    onSuccess: (_, { issueId }) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.kanban(projectId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(issueId) });
      message.success('Issue added to sprint successfully');
    },
    onError: (error: any) => {
      console.error('Error adding issue to sprint:', error);
      message.error('Failed to add issue to sprint');
    },
  });
};

// Hook for removing issue from sprint
export const useRemoveIssueFromSprint = (projectId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (issueId: number) => {
      const response = await issuesAPI.removeFromSprint(issueId);
      return response.data;
    },
    onSuccess: (_, issueId) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.kanban(projectId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(issueId) });
      message.success('Issue removed from sprint successfully');
    },
    onError: (error: any) => {
      console.error('Error removing issue from sprint:', error);
      message.error('Failed to remove issue from sprint');
    },
  });
};

// Hook for deleting an issue
export const useDeleteIssue = (projectId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (issueId: number) => {
      const response = await issuesAPI.delete(issueId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.kanban(projectId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.stats(projectId) });
      message.success('Issue deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting issue:', error);
      message.error('Failed to delete issue');
    },
  });
};

// Hook for exporting issues to Excel
export const useExportIssues = () => {
  return useMutation({
    mutationFn: async ({ projectId, startDate, endDate }: { projectId: number; startDate: string; endDate: string }) => {
      const response = await issuesAPI.exportToExcel(projectId, startDate, endDate);
      return response.data;
    },
    onError: (error: any) => {
      console.error('Error exporting issues:', error);
      message.error('Failed to export issues');
    },
  });
};
