import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Typography } from 'antd';
import { 
  OrderedListOutlined, 
  TableOutlined, 
  TeamOutlined
} from '@ant-design/icons';
import { useProject } from '../hooks/useProjects';

const { Text } = Typography;

const ProjectNavigation: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { data: project } = useProject(parseInt(projectId!));

  if (!projectId || !project) {
    return null;
  }

  const currentPath = location.pathname;
  let selectedKey = '';
  
  if (currentPath.includes('/backlog')) {
    selectedKey = 'backlog';
  } else if (currentPath.includes('/board')) {
    selectedKey = 'board';
  } else if (currentPath.includes('/team')) {
    selectedKey = 'team';
  } else if (currentPath.includes('/settings')) {
    selectedKey = 'settings';
  }

  const menuItems = [
    {
      key: 'backlog',
      icon: <OrderedListOutlined />,
      label: 'Backlog',
      onClick: () => navigate(`/projects/${projectId}/backlog`)
    },
    {
      key: 'board',
      icon: <TableOutlined />,
      label: 'Active Sprint',
      onClick: () => navigate(`/projects/${projectId}/board`)
    },
    {
      key: 'team',
      icon: <TeamOutlined />,
      label: 'Team',
      onClick: () => navigate(`/projects/${projectId}/team`)
    }
  ];

  return (
    <div style={{
      background: '#fff',
      borderBottom: '1px solid #f0f0f0',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Text strong style={{ fontSize: 16, color: '#0052cc' }}>
          {project.name}
        </Text>
        <Menu
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={menuItems}
          style={{ 
            border: 'none',
            background: 'transparent',
            minWidth: 300
          }}
        />
      </div>
    </div>
  );
};

export default ProjectNavigation;
