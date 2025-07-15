import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { projectsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ProjectAccessGuardProps {
  children: React.ReactNode;
}

const ProjectAccessGuard: React.FC<ProjectAccessGuardProps> = ({ children }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkProjectAccess = async () => {
      if (!projectId || !user) {
        setLoading(false);
        return;
      }

      try {
        // Try to get the project - this will fail with 403 if no access
        await projectsAPI.getById(parseInt(projectId));
        setHasAccess(true);
      } catch (error: any) {
        console.error('Project access check failed:', error);
        
        if (error.response?.status === 403) {
          setError('You do not have access to this project. You may not be a member of this project.');
        } else if (error.response?.status === 404) {
          setError('Project not found.');
        } else {
          setError('Failed to load project information.');
        }
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkProjectAccess();
  }, [projectId, user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <Result
        status="403"
        title="Access Denied"
        subTitle={error || "You don't have permission to access this project."}
        extra={
          <Button type="primary" onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
};

export default ProjectAccessGuard;
