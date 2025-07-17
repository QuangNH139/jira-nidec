import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  EllipsisOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '../hooks/useProjects';
import { CreateProjectData, Project } from '../types';
import ExcelExportModal from '../components/ExcelExportModal';

const { Title, Text } = Typography;
const { Meta } = Card;

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [exportingProject, setExportingProject] = useState<Project | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  
  const { data: projects, isLoading, error } = useProjects();
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
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

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    editForm.setFieldsValue({
      name: project.name,
      key: project.key,
      description: project.description
    });
    setIsEditModalVisible(true);
  };

  const handleUpdateProject = async (values: CreateProjectData) => {
    if (!editingProject) return;
    
    try {
      await updateProjectMutation.mutateAsync({ 
        id: editingProject.id, 
        data: values 
      });
      setIsEditModalVisible(false);
      editForm.resetFields();
      setEditingProject(null);
    } catch (error) {
      console.error('Error updating project:', error);
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

  const handleViewBoard = (projectId: number) => {
    navigate(`/projects/${projectId}/backlog`);
  };

  const handleViewTeam = (projectId: number) => {
    navigate(`/projects/${projectId}/team`);
  };

  const getProjectMenuItems = (projectId: number) => [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit Project',
      onClick: () => {
        const project = projects?.find(p => p.id === projectId);
        if (project) handleEditProject(project);
      }
    },
    {
      key: 'export',
      icon: <DownloadOutlined />,
      label: 'Export to Excel',
      onClick: () => {
        const project = projects?.find(p => p.id === projectId);
        if (project) {
          setExportingProject(project);
          setIsExportModalVisible(true);
        }
      }
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
                    <ProjectOutlined 
                      key="board" 
                      onClick={() => handleViewBoard(project.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </Tooltip>,
                  <Tooltip title="Team Members">
                    <TeamOutlined 
                      key="team" 
                      onClick={() => handleViewTeam(project.id)}
                      style={{ cursor: 'pointer' }}
                    />
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

      <Modal
        title="Edit Project"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingProject(null);
          editForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateProject}
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
              <Button onClick={() => {
                setIsEditModalVisible(false);
                setEditingProject(null);
                editForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={updateProjectMutation.isPending}
              >
                Update Project
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Excel Export Modal */}
      <ExcelExportModal
        visible={isExportModalVisible}
        onCancel={() => {
          setIsExportModalVisible(false);
          setExportingProject(null);
        }}
        projectId={exportingProject?.id || 0}
        projectName={exportingProject?.name || ''}
      />
    </div>
  );
};

export default Projects;
