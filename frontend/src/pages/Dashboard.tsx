import React, { useMemo, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Space, Button, Spin, List, Avatar, Tag } from 'antd';
import {
  BarChartOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  ProjectOutlined,
  TeamOutlined,
  UserOutlined,
  BugOutlined,
  CheckSquareOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useUserIssues } from '../hooks/useIssues';
import IssueDetailModal from '../components/IssueDetailModal';
import { Issue } from '../types';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [viewingIssue, setViewingIssue] = useState<Issue | null>(null);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  
  // TanStack Query hooks
  const projectsQuery = useProjects();
  const userIssuesQuery = useUserIssues(user?.id || 0);

  // Calculate stats using useMemo
  const stats = useMemo(() => {
    const projects = projectsQuery.data || [];
    const userIssues = userIssuesQuery.data || [];

    const activeIssues = userIssues.filter((issue: any) => 
      issue.status_category === 'todo' || issue.status_category === 'inprogress'
    ).length;
    
    const completedIssues = userIssues.filter((issue: any) => 
      issue.status_category === 'done'
    ).length;

    return {
      totalProjects: projects.length,
      activeIssues,
      completedIssues,
      assignedToMe: userIssues.length,
    };
  }, [projectsQuery.data, userIssuesQuery.data]);

  const isLoading = projectsQuery.isLoading || userIssuesQuery.isLoading;
  const projects = projectsQuery.data || [];
  const userIssues = userIssuesQuery.data || [];

  const statsData = [
    {
      title: 'Total Projects',
      value: stats.totalProjects,
      icon: <ProjectOutlined style={{ color: '#1890ff' }} />,
      color: '#1890ff',
    },
    {
      title: 'Issues Assigned to Me',
      value: stats.assignedToMe,
      icon: <UserOutlined style={{ color: '#faad14' }} />,
      color: '#faad14',
    },
    {
      title: 'Active Issues',
      value: stats.activeIssues,
      icon: <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />,
      color: '#fa8c16',
    },
    {
      title: 'Completed Issues',
      value: stats.completedIssues,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      color: '#52c41a',
    },
  ];

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'bug':
        return <BugOutlined style={{ color: '#ff4d4f' }} />;
      case 'task':
        return <CheckSquareOutlined style={{ color: '#52c41a' }} />;
      default:
        return <ExclamationCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'gold';
      case 'low':
        return 'green';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ background: '#ffffff' }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={1} style={{ 
          margin: 0, 
          fontSize: '24px',
          fontWeight: 500,
          color: '#172b4d',
          marginBottom: '8px',
        }}>
          Dashboard
        </Title>
        <Text style={{ 
          color: '#5e6c84',
          fontSize: '14px',
        }}>
          Welcome back, {user?.full_name || user?.username}. Here's what's happening with your projects today.
        </Text>
      </div>

      {/* Stats Grid */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {statsData.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card 
              style={{
                borderRadius: '3px',
                border: '1px solid #dfe1e6',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease',
              }}
              className="jira-stat-card"
            >
              <Statistic
                title={<span style={{ fontSize: '12px', color: '#5e6c84', fontWeight: 500 }}>{stat.title}</span>}
                value={stat.value}
                prefix={stat.icon}
                valueStyle={{ 
                  color: stat.color,
                  fontSize: '24px',
                  fontWeight: 600,
                }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Content Grid */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card 
            title={
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#172b4d' }}>
                My Recent Issues
              </span>
            }
            extra={
              <Link 
                to="/projects" 
                style={{ 
                  fontSize: '14px', 
                  color: '#0052cc',
                  fontWeight: 500,
                }}
              >
                View All Projects
              </Link>
            }
            style={{
              borderRadius: '3px',
              border: '1px solid #dfe1e6',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            {userIssues.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <ExclamationCircleOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary">No issues assigned to you</Text>
                </div>
              </div>
            ) : (
              <List
                dataSource={userIssues.slice(0, 5)}
                renderItem={(issue: any) => (
                  <List.Item
                    actions={[
                      <Button
                        key="view"
                        type="text"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => {
                          setViewingIssue(issue);
                          setIsViewModalVisible(true);
                        }}
                      >
                        View
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={getIssueIcon(issue.type)} />}
                      title={
                        <div>
                          <Text strong>{issue.title}</Text>
                          <Tag color={getPriorityColor(issue.priority)} style={{ marginLeft: 8 }}>
                            {issue.priority.toUpperCase()}
                          </Tag>
                        </div>
                      }
                      description={
                        <div>
                          <Text type="secondary">{issue.project_name}</Text>
                          <Tag color={issue.status_color} style={{ marginLeft: 8 }}>
                            {issue.status_name}
                          </Tag>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card 
            title={
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#172b4d' }}>
                Quick Actions
              </span>
            }
            style={{
              borderRadius: '3px',
              border: '1px solid #dfe1e6',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Link to="/projects">
                <Button 
                  type="primary" 
                  icon={<ProjectOutlined />} 
                  block
                  size="large"
                  style={{
                    borderRadius: '3px',
                    fontWeight: 500,
                    height: '40px',
                  }}
                >
                  View Projects
                </Button>
              </Link>
              <Link to="/users">
                <Button 
                  icon={<TeamOutlined />} 
                  block
                  size="large"
                  style={{
                    borderRadius: '3px',
                    fontWeight: 500,
                    height: '40px',
                    border: '1px solid #dfe1e6',
                  }}
                >
                  Manage Team
                </Button>
              </Link>
              <Button 
                icon={<BarChartOutlined />} 
                block
                size="large"
                disabled
                style={{
                  borderRadius: '3px',
                  fontWeight: 500,
                  height: '40px',
                }}
              >
                View Reports
              </Button>
            </Space>
          </Card>

          {/* Project Summary */}
          <Card 
            title={
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#172b4d' }}>
                My Projects
              </span>
            }
            style={{ 
              marginTop: 16,
              borderRadius: '3px',
              border: '1px solid #dfe1e6',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            {projects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <ProjectOutlined style={{ fontSize: 32, color: '#d9d9d9' }} />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">No projects yet</Text>
                </div>
              </div>
            ) : (
              <List
                dataSource={projects.slice(0, 3)}
                renderItem={(project: any) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<ProjectOutlined />} />}
                      title={
                        <Link to={`/projects/${project.id}/board`}>
                          {project.name}
                        </Link>
                      }
                      description={project.description || 'No description'}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Issue Detail Modal */}
      <IssueDetailModal
        visible={isViewModalVisible}
        onCancel={() => {
          setIsViewModalVisible(false);
          setViewingIssue(null);
        }}
        issue={viewingIssue}
      />
    </div>
  );
};

export default Dashboard;
