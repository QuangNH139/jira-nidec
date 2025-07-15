import React, { useMemo } from 'react';
import { Row, Col, Card, Statistic, Typography, Space, Button, Spin, List, Avatar, Tag } from 'antd';
import {
  BarChartOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  ProjectOutlined,
  TeamOutlined,
  UserOutlined,
  BugOutlined,
  CheckSquareOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useUserIssues } from '../hooks/useIssues';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
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
    <div>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0 }}>
          Welcome back, {user?.full_name || user?.username}!
        </Title>
        <Text type="secondary">
          Here's what's happening with your projects today.
        </Text>
      </div>

      {/* Stats Grid */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        {statsData.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.icon}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Content Grid */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title="My Recent Issues" extra={<Link to="/projects">View All Projects</Link>}>
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
                  <List.Item>
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
          <Card title="Quick Actions">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Link to="/projects">
                <Button 
                  type="primary" 
                  icon={<ProjectOutlined />} 
                  block
                  size="large"
                >
                  View Projects
                </Button>
              </Link>
              <Link to="/users">
                <Button 
                  icon={<TeamOutlined />} 
                  block
                  size="large"
                >
                  Manage Team
                </Button>
              </Link>
              <Button 
                icon={<BarChartOutlined />} 
                block
                size="large"
                disabled
              >
                View Reports
              </Button>
            </Space>
          </Card>

          {/* Project Summary */}
          <Card title="My Projects" style={{ marginTop: 16 }}>
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
    </div>
  );
};

export default Dashboard;
