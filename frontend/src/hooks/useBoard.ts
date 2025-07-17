import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { issuesAPI, projectsAPI, sprintsAPI } from '../services/api';
import { Issue } from '../types';

// Query keys
export const boardQueryKeys = {
  all: ['board'] as const,
  project: (projectId: number) => [...boardQueryKeys.all, 'project', projectId] as const,
  kanban: (projectId: number) => [...boardQueryKeys.project(projectId), 'kanban'] as const,
  projectDetails: (projectId: number) => [...boardQueryKeys.project(projectId), 'details'] as const,
  members: (projectId: number) => [...boardQueryKeys.project(projectId), 'members'] as const,
  statuses: (projectId: number) => [...boardQueryKeys.project(projectId), 'statuses'] as const,
};

// Hook for fetching kanban board data with optional sprint filter
export const useKanbanBoard = (projectId: number, sprintId?: number) => {
  return useQuery({
    queryKey: [...boardQueryKeys.kanban(projectId), sprintId],
    queryFn: async () => {
      const response = await issuesAPI.getKanban(projectId, sprintId);
      return response.data;
    },
    enabled: !!projectId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Hook for fetching active sprint
export const useActiveSprint = (projectId: number) => {
  return useQuery({
    queryKey: ['active-sprint', projectId],
    queryFn: async () => {
      const response = await sprintsAPI.getActive(projectId);
      return response.data;
    },
    enabled: !!projectId,
    staleTime: 60 * 1000, // 1 minute
  });
};

// Hook for fetching project details
export const useProjectDetails = (projectId: number) => {
  return useQuery({
    queryKey: boardQueryKeys.projectDetails(projectId),
    queryFn: async () => {
      const response = await projectsAPI.getById(projectId);
      return response.data;
    },
    enabled: !!projectId,
  });
};

// Hook for fetching project members
export const useProjectMembers = (projectId: number) => {
  return useQuery({
    queryKey: boardQueryKeys.members(projectId),
    queryFn: async () => {
      const response = await projectsAPI.getMembers(projectId);
      return response.data;
    },
    enabled: !!projectId,
  });
};

// Hook for fetching project statuses
export const useProjectStatuses = (projectId: number) => {
  return useQuery({
    queryKey: boardQueryKeys.statuses(projectId),
    queryFn: async () => {
      const response = await projectsAPI.getStatuses(projectId);
      return response.data;
    },
    enabled: !!projectId,
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
      // Invalidate all kanban queries and board data
      queryClient.invalidateQueries({
        queryKey: boardQueryKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: ['issues'],
      });
      message.success('Issue status updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating issue status:', error);
      message.error('Failed to update issue status');
    },
  });
};

// Hook for creating a new issue
export const useCreateIssue = (projectId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (issueData: Partial<Issue>) => {
      const response = await issuesAPI.create(issueData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate kanban board data for this project
      queryClient.invalidateQueries({
        queryKey: boardQueryKeys.kanban(projectId),
      });
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
    onSuccess: () => {
      // Invalidate kanban board data for this project
      queryClient.invalidateQueries({
        queryKey: boardQueryKeys.kanban(projectId),
      });
      // Also invalidate general board queries
      queryClient.invalidateQueries({
        queryKey: boardQueryKeys.all,
      });
      // Invalidate active sprint query as well
      queryClient.invalidateQueries({
        queryKey: ['active-sprint', projectId],
      });
      message.success('Issue updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating issue:', error);
      message.error('Failed to update issue');
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
      // Invalidate kanban board data for this project
      queryClient.invalidateQueries({
        queryKey: boardQueryKeys.kanban(projectId),
      });
      message.success('Issue deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting issue:', error);
      message.error('Failed to delete issue');
    },
  });
};

// Combined hook for all board data
export const useBoardData = (projectId: number) => {
  const kanbanQuery = useKanbanBoard(projectId);
  const projectQuery = useProjectDetails(projectId);
  const membersQuery = useProjectMembers(projectId);
  const statusesQuery = useProjectStatuses(projectId);

  return {
    kanban: kanbanQuery,
    project: projectQuery,
    members: membersQuery,
    statuses: statusesQuery,
    isLoading: kanbanQuery.isLoading || projectQuery.isLoading || membersQuery.isLoading || statusesQuery.isLoading,
    error: kanbanQuery.error || projectQuery.error || membersQuery.error || statusesQuery.error,
  };
};
