import { useQueryClient } from '@tanstack/react-query';

// Query key factories
export const queryKeys = {
  // Projects
  projects: {
    all: ['projects'] as const,
    detail: (id: number) => ['projects', id] as const,
    members: (id: number) => ['projects', id, 'members'] as const,
    statuses: (id: number) => ['projects', id, 'statuses'] as const,
  },
  
  // Issues
  issues: {
    all: ['issues'] as const,
    byProject: (projectId: number) => ['issues', 'project', projectId] as const,
    detail: (id: number) => ['issues', id] as const,
    kanban: (projectId: number, sprint?: number) => ['issues', 'kanban', projectId, { sprint }] as const,
    stats: (projectId: number) => ['issues', 'stats', projectId] as const,
  },
  
  // Sprints
  sprints: {
    all: ['sprints'] as const,
    byProject: (projectId: number) => ['sprints', 'project', projectId] as const,
    active: (projectId: number) => ['sprints', 'active', projectId] as const,
    detail: (id: number) => ['sprints', id] as const,
  },
  
  // Users
  users: {
    all: ['users'] as const,
    detail: (id: number) => ['users', id] as const,
    profile: ['users', 'profile'] as const,
  },
  
  // Board
  board: {
    all: ['board'] as const,
    kanban: (projectId: number) => ['board', 'kanban', projectId] as const,
  },
  
  // Backlog
  backlog: {
    byProject: (projectId: number) => ['backlog', projectId] as const,
  },
};

export const useQueryInvalidation = () => {
  const queryClient = useQueryClient();

  const invalidateProject = (projectId: number) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.members(projectId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.statuses(projectId) });
  };

  const invalidateIssues = (projectId: number, issueId?: number) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.byProject(projectId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.kanban(projectId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.stats(projectId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.board.kanban(projectId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.backlog.byProject(projectId) });
    
    if (issueId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(issueId) });
    }
  };

  const invalidateSprints = (projectId: number, sprintId?: number) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.sprints.byProject(projectId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.sprints.active(projectId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.backlog.byProject(projectId) });
    
    if (sprintId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.detail(sprintId) });
    }
  };

  const invalidateUsers = (userId?: number) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    
    if (userId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
    }
  };

  const invalidateBoard = (projectId: number) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.board.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.board.kanban(projectId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.kanban(projectId) });
  };

  // Combined invalidations for common operations
  const invalidateProjectData = (projectId: number) => {
    invalidateProject(projectId);
    invalidateIssues(projectId);
    invalidateSprints(projectId);
    invalidateBoard(projectId);
  };

  const invalidateIssueOperations = (projectId: number, issueId?: number) => {
    invalidateIssues(projectId, issueId);
    invalidateBoard(projectId);
  };

  const invalidateSprintOperations = (projectId: number, sprintId?: number) => {
    invalidateSprints(projectId, sprintId);
    invalidateIssues(projectId);
    invalidateBoard(projectId);
  };

  return {
    // Individual invalidations
    invalidateProject,
    invalidateIssues,
    invalidateSprints,
    invalidateUsers,
    invalidateBoard,
    
    // Combined invalidations
    invalidateProjectData,
    invalidateIssueOperations,
    invalidateSprintOperations,
    
    // Direct query client access
    queryClient,
  };
};
