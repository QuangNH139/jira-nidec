import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, App as AntdApp } from 'antd';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ProjectAccessGuard from './components/ProjectAccessGuard';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Users from './pages/Users';
import Board from './pages/Board';
import Backlog from './pages/Backlog';
import TeamMembers from './pages/TeamMembers';
import Profile from './pages/Profile';
import MyActivities from './pages/MyActivities';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      onError: (error: any) => {
        // Error handling will be done in individual components
        console.error('Mutation error:', error);
      },
    },
  },
});

// Ant Design theme configuration - Jira style
const antdTheme = {
  token: {
    colorPrimary: '#0052cc',
    colorPrimaryHover: '#0065ff',
    colorPrimaryActive: '#003884',
    borderRadius: 3,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    fontSize: 14,
    fontSizeHeading1: 24,
    fontSizeHeading2: 20,
    fontSizeHeading3: 16,
    fontSizeHeading4: 14,
    colorText: '#172b4d',
    colorTextSecondary: '#5e6c84',
    colorTextTertiary: '#6b778c',
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f4f5f7',
    colorBorder: '#dfe1e6',
    colorBorderSecondary: '#f4f5f7',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
    boxShadowSecondary: '0 1px 3px rgba(0, 0, 0, 0.08)',
  },
  components: {
    Layout: {
      siderBg: '#ffffff',
      headerBg: '#ffffff',
      bodyBg: '#f4f5f7',
      headerHeight: 64,
      headerPadding: '0 24px',
      triggerBg: '#ffffff',
      triggerColor: '#42526e',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#deebff',
      itemSelectedColor: '#0052cc',
      itemHoverBg: '#fafbfc',
      itemHoverColor: '#0052cc',
      itemActiveBg: '#deebff',
      itemHeight: 40,
      itemMarginInline: 8,
      itemBorderRadius: 3,
      iconSize: 16,
    },
    Button: {
      borderRadius: 3,
      fontWeight: 500,
      primaryShadow: 'none',
      defaultShadow: 'none',
    },
    Card: {
      borderRadius: 3,
      headerBg: '#ffffff',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
      boxShadowHover: '0 2px 8px rgba(0, 82, 204, 0.15)',
    },
    Table: {
      borderRadius: 3,
      headerBg: '#fafbfc',
      headerColor: '#172b4d',
      rowHoverBg: '#f4f5f7',
    },
    Input: {
      borderRadius: 3,
      activeBorderColor: '#0052cc',
      hoverBorderColor: '#0052cc',
      activeShadow: '0 0 0 2px rgba(0, 82, 204, 0.2)',
    },
    Select: {
      borderRadius: 3,
      optionSelectedBg: '#deebff',
      optionSelectedColor: '#0052cc',
    },
    Modal: {
      borderRadius: 3,
      headerBg: '#ffffff',
    },
    Tag: {
      borderRadius: 3,
      fontWeight: 500,
    },
    Avatar: {
      // Remove fontWeight as it's not a valid Avatar token
    },
  },
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={antdTheme}>
        <AntdApp>
          <AuthProvider>
            <Router>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Projects />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Users />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Profile />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/my-activities"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <MyActivities />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/projects/:projectId/backlog"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <ProjectAccessGuard>
                          <Backlog />
                        </ProjectAccessGuard>
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/projects/:projectId/board"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <ProjectAccessGuard>
                          <Board />
                        </ProjectAccessGuard>
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/projects/:projectId/team"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <ProjectAccessGuard>
                          <TeamMembers />
                        </ProjectAccessGuard>
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                
                {/* Redirect root to dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                {/* Catch all - redirect to dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Router>
          </AuthProvider>
        </AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

export default App;
