import React, { ReactNode, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Button, Typography } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  ProjectOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import JiraBreadcrumb from './JiraBreadcrumb';

const { Header, Sider, Content } = AntLayout;
const { Title } = Typography;

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: 'Projects',
    },
    // Only show Users menu to admins
    ...(user?.role === 'admin' ? [{
      key: '/users',
      icon: <UserOutlined />,
      label: 'People',
    }] : []),
    {
      key: '/my-activities',
      icon: <ClockCircleOutlined />,
      label: 'Your work',
    },
    {
      key: '/profile',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: logout,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <AntLayout style={{ minHeight: '100vh', background: '#f4f5f7' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed} 
        theme="light"
        width={280}
        collapsedWidth={64}
        style={{
          background: '#ffffff',
          borderRight: '1px solid #dfe1e6',
          boxShadow: '1px 0 2px rgba(0,0,0,0.08)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ 
          height: 64, 
          margin: 0, 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '0' : '0 16px',
          background: '#0052cc',
          borderBottom: '1px solid #dfe1e6',
          transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)',
        }}>
          <Title 
            level={4} 
            style={{ 
              color: 'white', 
              margin: 0,
              fontSize: collapsed ? '14px' : '16px',
              fontWeight: 600,
              transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)',
              letterSpacing: collapsed ? '0' : '0.5px',
            }}
          >
            {collapsed ? 'NTM' : 'NIDEC TASK MANAGEMENT'}
          </Title>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            borderRight: 'none',
            paddingTop: '8px',
            background: 'transparent',
          }}
          className="jira-sidebar-menu"
        />
      </Sider>
      <AntLayout>
        <Header style={{ 
          padding: '0 24px', 
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #dfe1e6',
          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
          height: 64,
          position: 'relative',
          zIndex: 9,
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 40,
              height: 40,
              color: '#42526e',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="jira-toggle-button"
          />
          
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            arrow
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: '3px',
              transition: 'background-color 0.2s ease',
            }}
            className="jira-user-menu"
            >
              <Avatar 
                size={24} 
                style={{ 
                  backgroundColor: '#0052cc', 
                  marginRight: 8,
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </Avatar>
              <span style={{ 
                marginLeft: 4, 
                color: '#172b4d',
                fontSize: '14px',
                fontWeight: 500,
              }}>
                {user?.full_name || user?.username}
              </span>
            </div>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '16px',
            padding: '24px',
            minHeight: 'calc(100vh - 96px)',
            background: '#ffffff',
            borderRadius: '3px',
            border: '1px solid #dfe1e6',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            overflow: 'auto',
          }}
        >
          <JiraBreadcrumb />
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
