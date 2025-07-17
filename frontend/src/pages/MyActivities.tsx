import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  List, 
  Typography, 
  Select, 
  Space, 
  Tag, 
  Avatar, 
  Empty, 
  Spin,
  Button,
  Row,
  Col
} from 'antd';
import { 
  UserOutlined, 
  ClockCircleOutlined, 
  ReloadOutlined,
  FilterOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  LoginOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { logsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  action: string;
  userId: number;
  userName: string;
  details: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

const MyActivities: React.FC = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    limit: 50,
    action: undefined as string | undefined,
    projectId: undefined as number | undefined
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-activities', filters],
    queryFn: () => logsAPI.getMyActivities(filters),
    select: (response) => response.data,
    refetchInterval: 30000 // Auto refresh every 30 seconds
  });

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN')) return <LoginOutlined style={{ color: '#52c41a' }} />;
    if (action.includes('LOGOUT')) return <LogoutOutlined style={{ color: '#faad14' }} />;
    if (action.includes('CREATE')) return <PlusOutlined style={{ color: '#1890ff' }} />;
    if (action.includes('UPDATE') || action.includes('EDIT')) return <EditOutlined style={{ color: '#722ed1' }} />;
    if (action.includes('DELETE')) return <DeleteOutlined style={{ color: '#ff4d4f' }} />;
    if (action.includes('VIEW') || action.includes('GET')) return <EyeOutlined style={{ color: '#13c2c2' }} />;
    return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('LOGIN')) return 'green';
    if (action.includes('LOGOUT')) return 'orange';
    if (action.includes('CREATE')) return 'blue';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'purple';
    if (action.includes('DELETE')) return 'red';
    if (action.includes('VIEW') || action.includes('GET')) return 'cyan';
    return 'default';
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return '#ff4d4f';
      case 'WARN': return '#faad14';
      case 'INFO': return '#52c41a';
      case 'DEBUG': return '#d9d9d9';
      default: return '#d9d9d9';
    }
  };

  const formatActionName = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getDetailsText = (action: string, details: Record<string, any>) => {
    switch (action) {
      case 'ISSUE_CREATE':
        return `Created task: "${details.title}" in project ${details.projectId}`;
      case 'ISSUE_UPDATE':
        return `Updated task: "${details.issueTitle}" ${details.changes ? `(Changed: ${Object.keys(details.changes).join(', ')})` : ''}`;
      case 'ISSUE_DELETE':
        return `Deleted task: "${details.issueTitle}" from project ${details.projectId}`;
      case 'ISSUE_ASSIGN':
        return `Assigned task: "${details.issueTitle}" to user ${details.newAssignee}`;
      case 'SPRINT_CREATE':
        return `Created sprint: "${details.sprintName}" in project ${details.projectId}`;
      case 'SPRINT_START':
        return `Started sprint: "${details.sprintName}"`;
      case 'PROJECT_CREATE':
        return `Created project: "${details.projectName}" with key ${details.projectKey}`;
      case 'USER_LOGIN':
        return `Logged in as ${details.role}`;
      case 'USER_LOGOUT':
        return `Logged out`;
      default:
        return JSON.stringify(details);
    }
  };

  const actionOptions = [
    'USER_LOGIN',
    'USER_LOGOUT',
    'ISSUE_CREATE',
    'ISSUE_UPDATE',
    'ISSUE_DELETE',
    'ISSUE_ASSIGN',
    'SPRINT_CREATE',
    'SPRINT_START',
    'SPRINT_COMPLETE',
    'PROJECT_CREATE',
    'PROJECT_UPDATE'
  ];

  const logs = data?.logs || [];

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>
            <ClockCircleOutlined style={{ marginRight: 8 }} />
            My Activities
          </Title>
          <Text type="secondary">Track your recent activities and actions</Text>
        </Col>
        <Col>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={() => refetch()}
            loading={isLoading}
          >
            Refresh
          </Button>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text strong>Action Type</Text>
              <Select
                placeholder="All actions"
                style={{ width: '100%' }}
                allowClear
                value={filters.action}
                onChange={(value) => setFilters(prev => ({ ...prev, action: value }))}
              >
                {actionOptions.map(action => (
                  <Option key={action} value={action}>
                    {getActionIcon(action)} {formatActionName(action)}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col span={6}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text strong>Limit</Text>
              <Select
                value={filters.limit}
                style={{ width: '100%' }}
                onChange={(value) => setFilters(prev => ({ ...prev, limit: value }))}
              >
                <Option value={25}>25 activities</Option>
                <Option value={50}>50 activities</Option>
                <Option value={100}>100 activities</Option>
              </Select>
            </Space>
          </Col>
          <Col span={12}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text strong>Current User</Text>
              <div style={{ 
                padding: '6px 11px', 
                border: '1px solid #d9d9d9', 
                borderRadius: 6,
                background: '#fafafa'
              }}>
                <Space>
                  <Avatar size={20} icon={<UserOutlined />} />
                  <Text strong>{user?.full_name || user?.username}</Text>
                  <Tag color="blue">{user?.role}</Tag>
                </Space>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Activities List */}
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <FilterOutlined />
            <Text strong>Recent Activities ({logs.length})</Text>
          </Space>
        </div>

        <Spin spinning={isLoading}>
          {logs.length === 0 ? (
            <Empty 
              description="No activities found"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={logs}
              renderItem={(log: LogEntry) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {getActionIcon(log.action)}
                        <div 
                          style={{ 
                            width: 4, 
                            height: 40, 
                            backgroundColor: getLevelColor(log.level),
                            borderRadius: 2
                          }} 
                        />
                      </div>
                    }
                    title={
                      <Space>
                        <Tag color={getActionColor(log.action)}>
                          {formatActionName(log.action)}
                        </Tag>
                        <Tag color={getLevelColor(log.level)} style={{ color: '#fff' }}>
                          {log.level}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {formatTimestamp(log.timestamp)}
                        </Text>
                      </Space>
                    }
                    description={
                      <div>
                        <Text>{getDetailsText(log.action, log.details)}</Text>
                        {log.ip && (
                          <div style={{ marginTop: 4 }}>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              IP: {log.ip} • {log.userAgent?.split(' ')[0]}
                            </Text>
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default MyActivities;
