import { ISSUE_TYPES, PRIORITY_OPTIONS, COMPLEXITY_MAPPING, USER_ROLES, PROJECT_MEMBER_ROLES } from './constants';

// Issue type utilities
export const getIssueTypeConfig = (type: string) => {
  return ISSUE_TYPES.find(t => t.value === type);
};

// Priority utilities
export const getPriorityColor = (priority: string): string => {
  const config = PRIORITY_OPTIONS.find(p => p.value === priority);
  return config?.color || '#d9d9d9';
};

export const getPriorityConfig = (priority: string) => {
  return PRIORITY_OPTIONS.find(p => p.value === priority);
};

// Story points and complexity utilities
export const getComplexityPoints = (storyPoints: number | undefined): number => {
  if (!storyPoints || storyPoints === 0) return 0;
  return COMPLEXITY_MAPPING[storyPoints] || Math.min(Math.round(storyPoints / 3.4), 10);
};

export const getComplexityColor = (points: number): string => {
  if (points === 0) return '#d9d9d9';
  if (points <= 2) return '#52c41a';    // Green (Easy)
  if (points <= 4) return '#faad14';    // Yellow (Medium-Low)
  if (points <= 6) return '#fa8c16';    // Orange (Medium)
  if (points <= 8) return '#f50';       // Red-Orange (Hard)
  return '#ff4d4f';                     // Red (Very Hard)
};

export const getComplexityLabel = (points: number): string => {
  if (points === 0) return 'Not Estimated';
  if (points <= 2) return 'Easy';
  if (points <= 4) return 'Medium-Low';
  if (points <= 6) return 'Medium';
  if (points <= 8) return 'Hard';
  return 'Very Hard';
};

// Status utilities
export const getStatusColor = (category: string): string => {
  switch (category) {
    case 'todo':
      return 'default';
    case 'inprogress':
      return 'processing';
    case 'done':
      return 'success';
    default:
      return 'default';
  }
};

export const getSprintStatusColor = (status: string): string => {
  switch (status) {
    case 'active': 
      return '#52c41a';
    case 'completed': 
      return '#1890ff';
    case 'planned': 
    default: 
      return '#faad14';
  }
};

// Role utilities
export const getRoleColor = (role: string): string => {
  const userRole = USER_ROLES.find(r => r.value === role);
  if (userRole) return userRole.color;
  
  const projectRole = PROJECT_MEMBER_ROLES.find(r => r.value === role);
  return projectRole?.color || 'default';
};

export const getUserRoleConfig = (role: string) => {
  return USER_ROLES.find(r => r.value === role);
};

export const getProjectMemberRoleConfig = (role: string) => {
  return PROJECT_MEMBER_ROLES.find(r => r.value === role);
};

// Statistics utilities
export const calculateProjectStats = (issues: any[]) => {
  const totalIssues = issues.length;
  const completedIssues = issues.filter(issue => issue.status_category === 'done').length;
  const inProgressIssues = issues.filter(issue => issue.status_category === 'inprogress').length;
  const todoIssues = issues.filter(issue => issue.status_category === 'todo').length;
  
  const totalStoryPoints = issues.reduce((sum, issue) => sum + (issue.story_points || 0), 0);
  const completedStoryPoints = issues
    .filter(issue => issue.status_category === 'done')
    .reduce((sum, issue) => sum + (issue.story_points || 0), 0);

  return {
    totalIssues,
    completedIssues,
    inProgressIssues,
    todoIssues,
    totalStoryPoints,
    completedStoryPoints,
    completionRate: totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0
  };
};

export const calculateSprintStats = (issues: any[]) => {
  return calculateProjectStats(issues);
};

// Date utilities
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString();
};

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString();
};

// Text utilities
export const truncateText = (text: string | undefined, maxLength: number): string => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};
