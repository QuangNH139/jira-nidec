import { Request } from 'express';

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  full_name?: string;
  role: 'admin' | 'developer' | 'scrum_master';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  role?: 'admin' | 'developer' | 'scrum_master';
  avatar_url?: string;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  full_name?: string;
  role?: 'admin' | 'developer' | 'scrum_master';
  avatar_url?: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  key: string;
  owner_id: number;
  owner_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  key: string;
  owner_id: number;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  key?: string;
}

export interface ProjectMember {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: 'owner' | 'admin' | 'member';
}

export interface Sprint {
  id: number;
  name: string;
  goal?: string;
  project_id: number;
  start_date?: string;
  end_date?: string;
  status: 'planned' | 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface CreateSprintData {
  name: string;
  goal?: string;
  project_id: number;
  start_date?: string;
  end_date?: string;
}

export interface UpdateSprintData {
  name?: string;
  goal?: string;
  start_date?: string;
  end_date?: string;
  status?: 'planned' | 'active' | 'completed';
}

export interface IssueStatus {
  id: number;
  name: string;
  category: 'todo' | 'inprogress' | 'done';
  color: string;
  position: number;
  project_id: number;
}

export interface Issue {
  id: number;
  title: string;
  description?: string;
  type: 'task' | 'story' | 'bug' | 'epic';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status_id: number;
  status_name?: string;
  status_category?: string;
  status_color?: string;
  assignee_id?: number;
  assignee_name?: string;
  reporter_id: number;
  reporter_name?: string;
  project_id: number;
  sprint_id?: number;
  story_points?: number;
  start_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateIssueData {
  title: string;
  description?: string;
  type: 'task' | 'story' | 'bug' | 'epic';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status_id: number;
  assignee_id?: number;
  reporter_id: number;
  project_id: number;
  sprint_id?: number;
  story_points?: number;
  start_date?: string;
}

export interface UpdateIssueData {
  title?: string;
  description?: string;
  type?: 'task' | 'story' | 'bug' | 'epic';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status_id?: number;
  assignee_id?: number;
  sprint_id?: number;
  story_points?: number;
  start_date?: string;
}

export interface Comment {
  id: number;
  content: string;
  issue_id: number;
  author_id: number;
  author_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCommentData {
  content: string;
  issue_id: number;
  author_id: number;
}

export interface UpdateCommentData {
  content: string;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface KanbanColumn {
  id: number;
  name: string;
  category: string;
  color: string;
  issues: Issue[];
}

export interface ProjectStats {
  totalIssues: number;
  completedIssues: number;
  inProgressIssues: number;
  todoIssues: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
}

export interface SprintStats {
  totalIssues: number;
  completedIssues: number;
  inProgressIssues: number;
  todoIssues: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  burndownData: Array<{
    date: string;
    remainingPoints: number;
  }>;
}
