import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Card,
  Table,
  Button,
  Space,
  Tag,
  Avatar,
  Modal,
  Form,
  Select,
  Popconfirm,
  message,
  Row,
  Col,
  Statistic
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  UserOutlined,
  DeleteOutlined,
  TeamOutlined,
  CrownOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { projectsAPI, usersAPI } from '../services/api';
import { User, Project, ProjectMember } from '../types';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const TeamMembers: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (projectId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersResponse, usersResponse, projectResponse] = await Promise.all([
        projectsAPI.getMembers(parseInt(projectId!)),
        usersAPI.getAll(),
        projectsAPI.getById(parseInt(projectId!))
      ]);

      setMembers(membersResponse.data);
      setAllUsers(usersResponse.data);
      setProject(projectResponse.data);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      
      // Handle access denied errors
      if (error.response?.status === 403) {
        message.error('Access denied to this project. You may not be a member of this project.');
        navigate('/projects'); // Redirect to projects page
        return;
      }
      
      message.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (values: { user_id: number; role: string }) => {
    try {
      await projectsAPI.addMember(parseInt(projectId!), values);
      message.success('Member added successfully');
      setIsModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      console.error('Error adding member:', error);
      message.error('Failed to add member');
    }
  };

  const handleRemoveMember = async (userId: number) => {
    try {
      await projectsAPI.removeMember(parseInt(projectId!), userId);
      message.success('Member removed successfully');
      fetchData();
    } catch (error) {
      console.error('Error removing member:', error);
      message.error('Failed to remove member');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <CrownOutlined style={{ color: '#faad14' }} />;
      case 'admin':
        return <UserOutlined style={{ color: '#1890ff' }} />;
      default:
        return <UserOutlined style={{ color: '#52c41a' }} />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'gold';
      case 'admin':
        return 'blue';
      case 'member':
        return 'green';
      default:
        return 'default';
    }
  };

  const canManageMembers = () => {
    const currentMember = members.find(m => m.id === currentUser?.id);
    return currentMember?.role === 'owner' || currentUser?.role === 'admin';
  };

  const getAvailableUsers = () => {
    const memberIds = members.map(m => m.id);
    return allUsers.filter(user => !memberIds.includes(user.id));
  };

  const columns: ColumnsType<ProjectMember> = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar size={40} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.full_name || record.username}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={getRoleColor(role)} icon={getRoleIcon(role)}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Tag>
      ),
      filters: [
        { text: 'Owner', value: 'owner' },
        { text: 'Admin', value: 'admin' },
        { text: 'Member', value: 'member' },
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          {canManageMembers() && (
            <Popconfirm
              title="Remove member"
              description="Are you sure you want to remove this member from the project?"
              onConfirm={() => handleRemoveMember(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                icon={<DeleteOutlined />}
                size="small"
                danger
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const stats = {
    totalMembers: members.length,
    owners: members.filter(m => m.role === 'owner').length,
    admins: members.filter(m => m.role === 'admin').length,
    regularMembers: members.filter(m => m.role === 'member').length,
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            {project?.name} - Team Members
          </Title>
          <Text type="secondary">
            Manage project team members and their roles
          </Text>
        </div>
        {canManageMembers() && (
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => setIsModalVisible(true)}
            disabled={getAvailableUsers().length === 0}
          >
            Add Member
          </Button>
        )}
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Members"
              value={stats.totalMembers}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Owners"
              value={stats.owners}
              prefix={<CrownOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Admins"
              value={stats.admins}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Members"
              value={stats.regularMembers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={members}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} members`,
          }}
        />
      </Card>

      <Modal
        title="Add Team Member"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddMember}
          requiredMark={false}
        >
          <Form.Item
            name="user_id"
            label="Select User"
            rules={[{ required: true, message: 'Please select a user' }]}
          >
            <Select
              placeholder="Choose a user to add"
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {getAvailableUsers().map(user => (
                <Option key={user.id} value={user.id}>
                  <Space>
                    <Avatar size={24} icon={<UserOutlined />} />
                    <span>{user.full_name || user.username}</span>
                    <Text type="secondary">({user.email})</Text>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select a role' }]}
            initialValue="member"
          >
            <Select placeholder="Select role">
              <Option value="member">Member</Option>
              <Option value="admin">Admin</Option>
              {currentUser?.role === 'admin' && (
                <Option value="owner">Owner</Option>
              )}
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Add Member
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TeamMembers;
