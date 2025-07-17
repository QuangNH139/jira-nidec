export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'developer' | 'scrum_master';
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  key: string;
  owner_id: number;
  owner_name?: string;
  user_role?: 'owner' | 'admin' | 'member';
  created_at: string;
  updated_at?: string;
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
  updated_at?: string;
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
  project_name?: string;
  sprint_id?: number | null;
  story_points?: number;
  start_date?: string;
  before_image?: string;
  after_image?: string;
  created_at: string;
  updated_at?: string;
}

export interface Comment {
  id: number;
  content: string;
  issue_id: number;
  author_id: number;
  author_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface KanbanColumn {
  id: number;
  name: string;
  category: string;
  color: string;
  issues: Issue[];
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
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

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  errors?: Array<{
    msg: string;
    param: string;
    value: any;
  }>;
}

// Create project data interface
export interface CreateProjectData {
  name: string;
  description?: string;
  key: string;
}

export interface ProjectMember {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: 'owner' | 'admin' | 'member';
}
