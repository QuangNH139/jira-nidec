import axios, { AxiosResponse } from 'axios';
import { 
  LoginCredentials, 
  RegisterData, 
  User, 
  Project, 
  Sprint, 
  Issue, 
  Comment,
  KanbanColumn,
  IssueStatus,
  ProjectMember,
  ApiResponse
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Log 403 errors for debugging
    if (error.response?.status === 403) {
      console.warn('Access denied to resource:', error.config?.url, error.response?.data);
    }
    
    // Error messages will be handled by individual components using TanStack Query
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: LoginCredentials): Promise<AxiosResponse<ApiResponse<{ token: string; user: User }>>> => 
    api.post('/auth/login', credentials),
  register: (userData: RegisterData): Promise<AxiosResponse<ApiResponse<{ token: string; user: User }>>> => 
    api.post('/auth/register', userData),
};

// Users API
export const usersAPI = {
  getAll: (): Promise<AxiosResponse<User[]>> => api.get('/users'),
  getProfile: (): Promise<AxiosResponse<User>> => api.get('/users/profile'),
  updateProfile: (data: Partial<User>): Promise<AxiosResponse<ApiResponse<User>>> => api.put('/users/profile', data),
  getById: (id: number): Promise<AxiosResponse<User>> => api.get(`/users/${id}`),
  update: (id: number, data: Partial<User>): Promise<AxiosResponse<User>> => api.put(`/users/${id}`, data),
  delete: (id: number): Promise<AxiosResponse<{ message: string }>> => api.delete(`/users/${id}`),
};

// Projects API
export const projectsAPI = {
  getAll: (): Promise<AxiosResponse<Project[]>> => api.get('/projects'),
  getById: (id: number): Promise<AxiosResponse<Project>> => api.get(`/projects/${id}`),
  create: (data: Partial<Project>): Promise<AxiosResponse<ApiResponse<Project>>> => api.post('/projects', data),
  update: (id: number, data: Partial<Project>): Promise<AxiosResponse<ApiResponse<Project>>> => api.put(`/projects/${id}`, data),
  delete: (id: number): Promise<AxiosResponse<{ message: string }>> => api.delete(`/projects/${id}`),
  getMembers: (id: number): Promise<AxiosResponse<ProjectMember[]>> => {
    return api.get(`/projects/${id}/members`).catch(error => {
      if (error.response?.status === 403) {
        console.warn(`Access denied to project ${id} members. User may not be a member of this project.`);
        // Return empty array instead of throwing error
        return {
          data: [],
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config || {}
        } as AxiosResponse<ProjectMember[]>;
      }
      throw error;
    });
  },
  addMember: (id: number, data: { user_id: number; role?: string }): Promise<AxiosResponse<{ message: string }>> => 
    api.post(`/projects/${id}/members`, data),
  removeMember: (id: number, userId: number): Promise<AxiosResponse<{ message: string }>> => 
    api.delete(`/projects/${id}/members/${userId}`),
  getStatuses: (id: number): Promise<AxiosResponse<IssueStatus[]>> => {
    return api.get(`/projects/${id}/statuses`).catch(error => {
      if (error.response?.status === 403) {
        console.warn(`Access denied to project ${id} statuses. User may not be a member of this project.`);
        // Return default statuses instead of throwing error
        return {
          data: [],
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config || {}
        } as AxiosResponse<IssueStatus[]>;
      }
      throw error;
    });
  },
};

// Sprints API
export const sprintsAPI = {
  getByProject: (projectId: number): Promise<AxiosResponse<Sprint[]>> => api.get(`/sprints/project/${projectId}`),
  getActive: (projectId: number): Promise<AxiosResponse<Sprint | null>> => 
    api.get(`/sprints/project/${projectId}/active`),
  getById: (id: number): Promise<AxiosResponse<Sprint>> => api.get(`/sprints/${id}`),
  create: (data: Partial<Sprint>): Promise<AxiosResponse<ApiResponse<Sprint>>> => api.post('/sprints', data),
  update: (id: number, data: Partial<Sprint>): Promise<AxiosResponse<ApiResponse<Sprint>>> => 
    api.put(`/sprints/${id}`, data),
  start: (id: number): Promise<AxiosResponse<ApiResponse<Sprint>>> => api.post(`/sprints/${id}/start`),
  complete: (id: number): Promise<AxiosResponse<ApiResponse<Sprint>>> => api.post(`/sprints/${id}/complete`),
  delete: (id: number): Promise<AxiosResponse<{ message: string }>> => api.delete(`/sprints/${id}`),
  getIssues: (id: number): Promise<AxiosResponse<Issue[]>> => api.get(`/sprints/${id}/issues`),
  getStats: (id: number): Promise<AxiosResponse<any>> => api.get(`/sprints/${id}/stats`),
};

// Issues API
export const issuesAPI = {
  getByProject: (projectId: number, sprint?: number): Promise<AxiosResponse<Issue[]>> => {
    const params = sprint ? { sprint } : {};
    return api.get(`/issues/project/${projectId}`, { params });
  },
  getKanban: (projectId: number, sprint?: number): Promise<AxiosResponse<KanbanColumn[]>> => {
    const params = sprint ? { sprint } : {};
    return api.get(`/issues/project/${projectId}/kanban`, { params });
  },
  getByUser: (userId: number): Promise<AxiosResponse<Issue[]>> => api.get(`/issues/user/${userId}`),
  getById: (id: number): Promise<AxiosResponse<Issue>> => api.get(`/issues/${id}`),
  create: (data: Partial<Issue>): Promise<AxiosResponse<ApiResponse<Issue>>> => api.post('/issues', data),
  update: (id: number, data: Partial<Issue>): Promise<AxiosResponse<ApiResponse<Issue>>> => 
    api.put(`/issues/${id}`, data),
  updateStatus: (id: number, statusId: number): Promise<AxiosResponse<ApiResponse<Issue>>> => 
    api.patch(`/issues/${id}/status`, { status_id: statusId }),
  addToSprint: (id: number, sprintId: number): Promise<AxiosResponse<ApiResponse<Issue>>> => 
    api.patch(`/issues/${id}/sprint`, { sprint_id: sprintId }),
  removeFromSprint: (id: number): Promise<AxiosResponse<ApiResponse<Issue>>> => 
    api.delete(`/issues/${id}/sprint`),
  delete: (id: number): Promise<AxiosResponse<{ message: string }>> => api.delete(`/issues/${id}`),
  getProjectStats: (projectId: number): Promise<AxiosResponse<any>> => api.get(`/issues/project/${projectId}/stats`),
  exportToExcel: (projectId: number, startDate: string, endDate: string): Promise<AxiosResponse<Blob>> => 
    api.get(`/issues/project/${projectId}/export`, { 
      params: { startDate, endDate },
      responseType: 'blob'
    }),
};

// Comments API
export const commentsAPI = {
  getByIssue: (issueId: number): Promise<AxiosResponse<Comment[]>> => api.get(`/comments/issue/${issueId}`),
  getRecent: (projectId: number, limit?: number): Promise<AxiosResponse<Comment[]>> => 
    api.get(`/comments/project/${projectId}/recent`, { params: { limit } }),
  getById: (id: number): Promise<AxiosResponse<Comment>> => api.get(`/comments/${id}`),
  create: (data: Partial<Comment>): Promise<AxiosResponse<ApiResponse<Comment>>> => api.post('/comments', data),
  update: (id: number, content: string): Promise<AxiosResponse<ApiResponse<Comment>>> => 
    api.put(`/comments/${id}`, { content }),
  delete: (id: number): Promise<AxiosResponse<{ message: string }>> => api.delete(`/comments/${id}`),
};

// Upload API
export const uploadAPI = {
  uploadFile: (file: File): Promise<AxiosResponse<{ message: string; filename: string; url: string }>> => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteFile: (filename: string): Promise<AxiosResponse<{ message: string }>> => 
    api.delete(`/uploads/${filename}`),
  getFileUrl: (filename: string): string => `${API_BASE_URL}/uploads/${filename}`,
};

// Logs API
export const logsAPI = {
  getMyActivities: (params?: { limit?: number; action?: string; projectId?: number }): Promise<AxiosResponse<any>> =>
    api.get('/logs/my-activities', { params }),
  getDatabase: (params?: { limit?: number; userId?: number; action?: string }): Promise<AxiosResponse<any>> =>
    api.get('/logs/database', { params }),
  getFile: (limit?: number): Promise<AxiosResponse<any>> =>
    api.get('/logs/file', { params: { limit } }),
  rotate: (daysToKeep?: number): Promise<AxiosResponse<{ message: string; daysKept: number }>> =>
    api.post('/logs/rotate', {}, { params: { daysToKeep } }),
};

export default api;
