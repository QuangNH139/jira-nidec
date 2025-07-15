import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Row,
  Col,
  Typography,
  App,
  Divider,
  Space,
  Alert,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  EditOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { usersAPI } from '../services/api';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const Profile: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const { message } = App.useApp();
  const { updateUser } = useAuth();

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getProfile();
      setUserProfile(response.data);
      form.setFieldsValue({
        username: response.data.username,
        email: response.data.email,
        full_name: response.data.full_name,
        avatar_url: response.data.avatar_url,
      });
    } catch (error: any) {
      message.error('Failed to fetch profile');
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [form, message]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const response = await usersAPI.updateProfile(values);
      
      // The API returns { message: string, user: User }
      // But TypeScript expects ApiResponse<User> which might be different
      const apiResponse = response.data as any;
      const updatedUser = apiResponse.user || apiResponse;
      setUserProfile(updatedUser);
      updateUser(updatedUser);
      message.success('Profile updated successfully');
      setEditing(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update profile';
      message.error(errorMessage);
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.setFieldsValue({
      username: userProfile?.username,
      email: userProfile?.email,
      full_name: userProfile?.full_name,
      avatar_url: userProfile?.avatar_url,
    });
    setEditing(false);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card loading={loading}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Avatar
            size={120}
            src={userProfile?.avatar_url}
            icon={<UserOutlined />}
            style={{ marginBottom: '16px' }}
          />
          <Title level={2} style={{ margin: 0 }}>
            {userProfile?.full_name || userProfile?.username}
          </Title>
          <Text type="secondary">{userProfile?.email}</Text>
          <br />
          <Text type="secondary" style={{ textTransform: 'capitalize' }}>
            {userProfile?.role?.replace('_', ' ')}
          </Text>
        </div>

        <Divider>
          {editing ? 'Editing Profile' : 'Profile Information'}
        </Divider>

        {!editing && (
          <Alert
            message="Click 'Edit Profile' to modify your information"
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={!editing}
        >
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Username"
                name="username"
                rules={[
                  { required: true, message: 'Please input your username!' },
                  { min: 3, message: 'Username must be at least 3 characters!' },
                ]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="Enter username"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please input your email!' },
                  { type: 'email', message: 'Please enter a valid email!' },
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="Enter email"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Full Name"
            name="full_name"
            rules={[
              { required: true, message: 'Please input your full name!' },
            ]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>

          <Form.Item
            label="Avatar URL"
            name="avatar_url"
            rules={[
              { type: 'url', message: 'Please enter a valid URL!' },
            ]}
          >
            <Input placeholder="Enter avatar URL (optional)" />
          </Form.Item>

          <Form.Item style={{ marginTop: '32px', textAlign: 'center' }}>
            <Space>
              {!editing ? (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => setEditing(true)}
                  disabled={loading}
                >
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button onClick={handleCancel} disabled={loading}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    htmlType="submit"
                    loading={loading}
                  >
                    Save Changes
                  </Button>
                </>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Profile;
