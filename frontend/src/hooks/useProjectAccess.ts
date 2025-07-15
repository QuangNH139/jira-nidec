import { useState, useEffect } from 'react';
import { projectsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export interface ProjectAccessResult {
  hasAccess: boolean;
  loading: boolean;
  error: string | null;
}

export const useProjectAccess = (projectId: number | null): ProjectAccessResult => {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!projectId || !user) {
        setLoading(false);
        setHasAccess(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Admin users have access to all projects
        if (user.role === 'admin') {
          setHasAccess(true);
          return;
        }

        // Try to get project info - will fail with 403 if no access
        await projectsAPI.getById(projectId);
        setHasAccess(true);
      } catch (error: any) {
        console.warn(`Access check failed for project ${projectId}:`, error.response?.status);
        
        if (error.response?.status === 403) {
          setError('Access denied to this project');
          setHasAccess(false);
        } else if (error.response?.status === 404) {
          setError('Project not found');
          setHasAccess(false);
        } else {
          setError('Failed to check project access');
          setHasAccess(false);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [projectId, user]);

  return { hasAccess, loading, error };
};

export default useProjectAccess;
