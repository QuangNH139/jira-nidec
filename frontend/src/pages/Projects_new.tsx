import React, { useState } from 'react';
import { 
  Typography, 
  Button, 
  Card, 
  Row, 
  Col, 
  Spin, 
  Empty, 
  Tag, 
  Avatar, 
  Modal, 
  Form, 
  Input,
  Space,
  Tooltip,
  Dropdown
} from 'antd';
import { 
  PlusOutlined, 
  ProjectOutlined, 
  TeamOutlined, 
  CalendarOutlined,
  EditOutlined,
  DeleteOutlined,
  EllipsisOutlined
} from '@ant-design/icons';
import { useProjects, useCreateProject, useDeleteProject } from '../hooks/useProjects';
import { CreateProjectData } from '../types';

const { Title, Text } = Typography;
const { Meta } = Card;

const Projects: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  
  const { data: projects, isLoading, error } = useProjects();
  const createProjectMutation = useCreateProject();
  const deleteProjectMutation = useDeleteProject();

  const handleCreateProject = async (values: CreateProjectData) => {
    try {
      await createProjectMutation.mutateAsync(values);
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleDeleteProject = (id: number) => {
    Modal.confirm({
      title: 'Delete Project',
      content: 'Are you sure you want to delete this project? This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deleteProjectMutation.mutate(id),
    });
  };

  const getProjectMenuItems = (projectId: number) => [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit Project',
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete Project',
      danger: true,
      onClick: () => handleDeleteProject(projectId),
    },
  ];

  if (isLoading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <Text type="danger">Error loading projects. Please try again.</Text>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Projects
          </Title>
          <Text type="secondary">
            Manage your projects and track progress
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setIsModalVisible(true)}
        >
          New Project
        </Button>
      </div>

      {!projects || projects.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No projects found"
          style={{ marginTop: 48 }}
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
            Create Your First Project
          </Button>
        </Empty>
      ) : (
        <Row gutter={[24, 24]}>
          {projects.map((project) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={project.id}>
              <Card
                className="project-card"
                hoverable
                actions={[
                  <Tooltip title="View Board">
                    <ProjectOutlined key="board" />
                  </Tooltip>,
                  <Tooltip title="Team Members">
                    <TeamOutlined key="team" />
                  </Tooltip>,
                  <Dropdown
                    menu={{ items: getProjectMenuItems(project.id) }}
                    trigger={['click']}
                  >
                    <EllipsisOutlined key="more" />
                  </Dropdown>,
                ]}
              >
                <Meta
                  avatar={
                    <Avatar 
                      style={{ backgroundColor: '#1890ff' }} 
                      size={40}
                    >
                      {project.key || project.name.charAt(0)}
                    </Avatar>
                  }
                  title={project.name}
                  description={
                    <Space direction="vertical" size={8}>
                      <Text type="secondary">
                        {project.description || 'No description'}
                      </Text>
                      <div>
                        <Tag color="blue" icon={<CalendarOutlined />}>
                          {new Date(project.created_at).toLocaleDateString()}
                        </Tag>
                      </div>
                    </Space>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title="Create New Project"
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
          onFinish={handleCreateProject}
          requiredMark={false}
        >
          <Form.Item
            name="name"
            label="Project Name"
            rules={[
              { required: true, message: 'Please enter project name' },
              { min: 3, message: 'Project name must be at least 3 characters' }
            ]}
          >
            <Input placeholder="Enter project name" />
          </Form.Item>

          <Form.Item
            name="key"
            label="Project Key"
            rules={[
              { required: true, message: 'Please enter project key' },
              { min: 2, max: 10, message: 'Project key must be 2-10 characters' },
              { pattern: /^[A-Z]+$/, message: 'Project key must contain only uppercase letters' }
            ]}
          >
            <Input placeholder="e.g., PROJ" maxLength={10} />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Enter project description (optional)" 
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={createProjectMutation.isPending}
              >
                Create Project
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Projects;
