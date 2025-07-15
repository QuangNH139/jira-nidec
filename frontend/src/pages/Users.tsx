import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Avatar,
  Modal,
  Form,
  Input,
  Select,
  App,
  Popconfirm,
  Typography,
  Row,
  Col,
  Statistic,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MailOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { usersAPI } from '../services/api';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';

const { Title } = Typography;
const { Option } = Select;

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const { user: currentUser } = useAuth();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      setUsers(response.data);
    } catch (error: any) {
      message.error('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = () => {
    // Show info modal directly instead of form modal
    Modal.info({
      title: 'How to Add New Users',
      width: 600,
      content: (
        <div style={{ marginTop: '16px' }}>
          <h4>How to add new users to the system:</h4>
          <ol style={{ paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}>
              Share the registration link: 
              <div style={{ 
                background: '#f5f5f5', 
                padding: '8px', 
                borderRadius: '4px', 
                margin: '4px 0',
                fontFamily: 'monospace'
              }}>
                {window.location.origin}/register
              </div>
            </li>
            <li style={{ marginBottom: '8px' }}>
              Have them create their own account
            </li>
            <li style={{ marginBottom: '8px' }}>
              Once registered, you can update their role and information from this page
            </li>
          </ol>
          <div style={{ 
            background: '#e6f7ff', 
            padding: '12px', 
            borderRadius: '6px',
            border: '1px solid #91d5ff',
            marginTop: '16px'
          }}>
            <strong>Note:</strong> Only users with admin role can manage other users. 
            You cannot delete your own account.
          </div>
        </div>
      ),
    });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    });
    setModalVisible(true);
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await usersAPI.delete(userId);
      message.success('User deleted successfully');
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      
      if (error.response?.status === 403) {
        message.error('Access denied. Only admins can delete users.');
      } else if (error.response?.status === 400) {
        message.error(error.response?.data?.error || 'Cannot delete this user');
      } else if (error.response?.status === 404) {
        message.error('User not found');
      } else {
        message.error('Failed to delete user. Please try again.');
      }
    }
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingUser) {
        // Update existing user
        await usersAPI.update(editingUser.id, values);
        message.success('User updated successfully');
        setModalVisible(false);
        setEditingUser(null);
        form.resetFields();
        fetchUsers();
      }
    } catch (error: any) {
      console.error('Error saving user:', error);
      
      if (editingUser) {
        if (error.response?.status === 403) {
          message.error('Access denied. Only admins can update users.');
        } else if (error.response?.status === 400) {
          const errorMsg = error.response?.data?.error;
          if (errorMsg?.includes('username')) {
            message.error('Username already taken');
          } else if (errorMsg?.includes('email')) {
            message.error('Email already taken');
          } else {
            message.error(errorMsg || 'Invalid data provided');
          }
        } else if (error.response?.status === 404) {
          message.error('User not found');
        } else {
          message.error('Failed to update user. Please try again.');
        }
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'red';
      case 'scrum_master':
        return 'blue';
      case 'developer':
        return 'green';
      default:
        return 'default';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return '👑';
      case 'scrum_master':
        return '🎯';
      case 'developer':
        return '💻';
      default:
        return '👤';
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: 'Avatar',
      dataIndex: 'avatar_url',
      key: 'avatar',
      width: 60,
      render: (avatar_url: string, record: User) => (
        <Avatar
          src={avatar_url}
          icon={<UserOutlined />}
          size="default"
        />
      ),
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      sorter: (a: User, b: User) => a.username.localeCompare(b.username),
    },
    {
      title: 'Full Name',
      dataIndex: 'full_name',
      key: 'full_name',
      sorter: (a: User, b: User) => (a.full_name || '').localeCompare(b.full_name || ''),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => (
        <Space>
          <MailOutlined />
          {email}
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={getRoleColor(role)}>
          {getRoleIcon(role)} {role.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Admin', value: 'admin' },
        { text: 'Scrum Master', value: 'scrum_master' },
        { text: 'Developer', value: 'developer' },
      ],
      onFilter: (value, record: User) => record.role === value,
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a: User, b: User) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: User) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditUser(record)}
            disabled={currentUser?.role !== 'admin'}
          />
          <Popconfirm
            title="Are you sure you want to delete this user?"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="Yes"
            cancelText="No"
            disabled={currentUser?.role !== 'admin' || record.id === currentUser?.id}
          >
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              disabled={currentUser?.role !== 'admin' || record.id === currentUser?.id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const getStatistics = () => {
    const totalUsers = users.length;
    const adminCount = users.filter(u => u.role === 'admin').length;
    const scrumMasterCount = users.filter(u => u.role === 'scrum_master').length;
    const developerCount = users.filter(u => u.role === 'developer').length;

    return { totalUsers, adminCount, scrumMasterCount, developerCount };
  };

  const stats = getStatistics();

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>
              <TeamOutlined /> Users Management
            </Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateUser}
              disabled={currentUser?.role !== 'admin'}
            >
              Add User Guide
            </Button>
          </Col>
        </Row>
      </div>

      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.totalUsers}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Admins"
              value={stats.adminCount}
              prefix="👑"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Scrum Masters"
              value={stats.scrumMasterCount}
              prefix="🎯"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Developers"
              value={stats.developerCount}
              prefix="💻"
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} users`,
          }}
        />
      </Card>

      <Modal
        title="Edit User"
        open={modalVisible && !!editingUser}
        onOk={handleModalSubmit}
        onCancel={() => {
          setModalVisible(false);
          setEditingUser(null);
          form.resetFields();
        }}
        okText="Update"
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: '16px' }}
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, message: 'Please input username!' },
              { min: 3, message: 'Username must be at least 3 characters!' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>

          <Form.Item
            name="full_name"
            label="Full Name"
            rules={[{ required: true, message: 'Please input full name!' }]}
          >
            <Input placeholder="Full Name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select a role!' }]}
          >
            <Select placeholder="Select a role">
              <Option value="developer">🧑‍💻 Developer</Option>
              <Option value="scrum_master">🎯 Scrum Master</Option>
              <Option value="admin">👑 Admin</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;
