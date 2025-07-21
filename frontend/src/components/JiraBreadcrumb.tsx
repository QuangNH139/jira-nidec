import React from 'react';
import { Breadcrumb } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { HomeOutlined, ProjectOutlined, DashboardOutlined, UserOutlined, ClockCircleOutlined, SettingOutlined } from '@ant-design/icons';

interface JiraBreadcrumbProps {
  projectName?: string;
  pageName?: string;
}

const JiraBreadcrumb: React.FC<JiraBreadcrumbProps> = ({ projectName, pageName }) => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const getIcon = (segment: string) => {
    switch (segment) {
      case 'dashboard':
        return <DashboardOutlined />;
      case 'projects':
        return <ProjectOutlined />;
      case 'users':
        return <UserOutlined />;
      case 'my-activities':
        return <ClockCircleOutlined />;
      case 'profile':
        return <SettingOutlined />;
      default:
        return null;
    }
  };

  const getLabel = (segment: string) => {
    switch (segment) {
      case 'dashboard':
        return 'Dashboard';
      case 'projects':
        return 'Projects';
      case 'users':
        return 'People';
      case 'my-activities':
        return 'Your work';
      case 'profile':
        return 'Settings';
      case 'board':
        return 'Board';
      case 'backlog':
        return 'Backlog';
      case 'team':
        return 'Team';
      default:
        return segment.charAt(0).toUpperCase() + segment.slice(1);
    }
  };

  const items = [
    {
      title: (
        <Link to="/dashboard" style={{ color: '#5e6c84', fontSize: '12px' }}>
          <HomeOutlined style={{ fontSize: '14px' }} />
        </Link>
      ),
    },
    ...pathSegments.map((segment, index) => {
      const isLast = index === pathSegments.length - 1;
      const path = '/' + pathSegments.slice(0, index + 1).join('/');
      
      // Handle project name display
      if (segment === 'projects' && projectName && index < pathSegments.length - 1) {
        return null; // Skip projects segment when we have a project name
      }
      
      if (projectName && pathSegments[index - 1] === 'projects' && /^\d+$/.test(segment)) {
        return {
          title: isLast ? (
            <span style={{ color: '#172b4d', fontSize: '12px', fontWeight: 500 }}>
              {projectName}
            </span>
          ) : (
            <Link to={path} style={{ color: '#5e6c84', fontSize: '12px' }}>
              {projectName}
            </Link>
          ),
        };
      }

      return {
        title: isLast ? (
          <span style={{ color: '#172b4d', fontSize: '12px', fontWeight: 500 }}>
            {getIcon(segment)} {pageName || getLabel(segment)}
          </span>
        ) : (
          <Link to={path} style={{ color: '#5e6c84', fontSize: '12px' }}>
            {getIcon(segment)} {getLabel(segment)}
          </Link>
        ),
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null),
  ];

  return (
    <div style={{ 
      marginBottom: '16px', 
      paddingBottom: '8px',
      borderBottom: '1px solid #f4f5f7',
    }}>
      <Breadcrumb 
        items={items}
        separator="/"
        style={{
          fontSize: '12px',
          color: '#5e6c84',
        }}
      />
    </div>
  );
};

export default JiraBreadcrumb;