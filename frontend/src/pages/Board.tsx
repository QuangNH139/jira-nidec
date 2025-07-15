import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  Typography,
  Card,
  Row,
  Col,
  Spin,
  Empty,
  Tag,
  Avatar,
  Button,
  Space,
  Dropdown,
  Modal,
  Form,
  Input,
  Select,
  Tooltip,
  message,
  DatePicker
} from 'antd';
import {
  PlusOutlined,
  UserOutlined,
  BugFilled,
  CheckCircleFilled,
  ExclamationCircleFilled,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { KanbanColumn, Issue } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  useKanbanBoard, 
  useUpdateIssueStatus, 
  useCreateIssue, 
  useUpdateIssue,
  useDeleteIssue 
} from '../hooks/useIssues';
import { 
  useProject, 
  useProjectMembers, 
  useProjectStatuses 
} from '../hooks/useProjects';
import ExcelExport from '../components/ExcelExport';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ItemTypes = {
  ISSUE: 'issue',
};

interface DraggedIssue {
  id: number;
  status_id: number;
}

// Issue Card Component with drag functionality
const IssueCard: React.FC<{
  issue: Issue;
  onEdit: (issue: Issue) => void;
  onDelete: (issueId: number) => void;
}> = ({ issue, onEdit, onDelete }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.ISSUE,
    item: { id: issue.id, status_id: issue.status_id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case 'bug':
        return <BugFilled style={{ color: '#ff4d4f' }} />;
      case 'task':
        return <CheckCircleFilled style={{ color: '#52c41a' }} />;
      case 'story':
        return <ExclamationCircleFilled style={{ color: '#1890ff' }} />;
      case 'epic':
        return <ExclamationCircleFilled style={{ color: '#722ed1' }} />;
      default:
        return <CheckCircleFilled style={{ color: '#52c41a' }} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return '#ff4d4f';
      case 'high':
        return '#ff7a45';
      case 'medium':
        return '#ffa940';
      case 'low':
        return '#52c41a';
      default:
        return '#d9d9d9';
    }
  };

  const menuItems = [
    {
      key: 'edit',
      label: 'Edit Issue',
      icon: <EditOutlined />,
      onClick: () => onEdit(issue),
    },
    {
      key: 'delete',
      label: 'Delete Issue',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => {
        Modal.confirm({
          title: 'Delete Issue',
          content: 'Are you sure you want to delete this issue? This action cannot be undone.',
          okText: 'Yes, Delete',
          okType: 'danger',
          cancelText: 'Cancel',
          onOk: () => onDelete(issue.id),
        });
      },
    },
  ];

  return (
    <Card
      ref={drag}
      size="small"
      className={`mb-2 cursor-pointer hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
      bodyStyle={{ padding: '8px 12px' }}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <Space size="small">
          {getIssueTypeIcon(issue.type)}
          <Text strong className="text-xs">
            {issue.title}
          </Text>
        </Space>
        <Dropdown
          menu={{ items: menuItems }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button
            type="text"
            size="small"
            icon={<MoreOutlined />}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      </div>
      
      {issue.description && (
        <Text type="secondary" className="text-xs block mb-2">
          {issue.description.length > 50
            ? `${issue.description.substring(0, 50)}...`
            : issue.description}
        </Text>
      )}

      <div className="flex justify-between items-center">
        <Space size="small">
          <Tag color={getPriorityColor(issue.priority)} className="text-xs">
            {issue.priority.toUpperCase()}
          </Tag>
          {issue.story_points && (
            <Tag className="text-xs">{issue.story_points} pts</Tag>
          )}
        </Space>
        
        {issue.assignee_id && (
          <Tooltip title={issue.assignee_name}>
            <Avatar size="small" icon={<UserOutlined />} />
          </Tooltip>
        )}
      </div>
    </Card>
  );
};

// Column Component with drop functionality
const KanbanColumnComponent: React.FC<{
  column: KanbanColumn;
  onDrop: (issueId: number, newStatusId: number) => void;
  onEdit: (issue: Issue) => void;
  onDelete: (issueId: number) => void;
}> = ({ column, onDrop, onEdit, onDelete }) => {
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.ISSUE,
    drop: (item: DraggedIssue) => {
      if (item.status_id !== column.id) {
        onDrop(item.id, column.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`kanban-column h-full p-3 rounded-lg ${
        isOver ? 'drag-over' : ''
      }`}
      style={{ 
        minHeight: '500px',
        background: isOver ? '#f6ffed' : '#ffffff',
        border: isOver ? '2px dashed #52c41a' : '1px solid #f0f0f0'
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <Title level={5} className="m-0">
            {column.name}
          </Title>
          <span className="text-gray-500 text-sm">({column.issues.length})</span>
        </div>
      </div>

      {column.issues.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No issues"
          className="mt-8"
        />
      ) : (
        <div className="space-y-2">
          {column.issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
};

const Board: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  // TanStack Query hooks
  const kanbanQuery = useKanbanBoard(parseInt(projectId!));
  const projectQuery = useProject(parseInt(projectId!));
  const membersQuery = useProjectMembers(parseInt(projectId!));
  const statusesQuery = useProjectStatuses(parseInt(projectId!));
  
  const updateIssueStatusMutation = useUpdateIssueStatus();
  const createIssueMutation = useCreateIssue(parseInt(projectId!));
  const updateIssueMutation = useUpdateIssue(parseInt(projectId!));
  const deleteIssueMutation = useDeleteIssue(parseInt(projectId!));

  // Local state for modals and forms
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Handle errors - redirect if access denied
  React.useEffect(() => {
    const error = kanbanQuery.error || projectQuery.error || membersQuery.error || statusesQuery.error;
    if (error) {
      const errorResponse = error as any;
      if (errorResponse.response?.status === 403) {
        message.error('Access denied to this project. You may not be a member of this project.');
        navigate('/projects');
      }
    }
  }, [kanbanQuery.error, projectQuery.error, membersQuery.error, statusesQuery.error, navigate]);

  // Get assignee options including current assignee if not in members
  const getAssigneeOptions = () => {
    const members = membersQuery.data || [];
    const options = [...members];
    
    // If editing an issue and current assignee is not in members, add them
    if (editingIssue && editingIssue.assignee_id && editingIssue.assignee_name) {
      const isCurrentAssigneeInMembers = members.some((member: any) => member.id === editingIssue.assignee_id);
      if (!isCurrentAssigneeInMembers) {
        console.log('Adding current assignee to options:', editingIssue.assignee_name); // Debug log
        options.push({
          id: editingIssue.assignee_id,
          username: editingIssue.assignee_name,
          email: '',
          full_name: editingIssue.assignee_name,
          role: 'member' as const
        });
      }
    }
    
    console.log('Assignee options:', options); // Debug log
    return options;
  };

  const handleDrop = async (issueId: number, newStatusId: number) => {
    updateIssueStatusMutation.mutate({ issueId, statusId: newStatusId });
  };

  const handleCreateIssue = async (values: any) => {
    createIssueMutation.mutate({
      ...values,
      project_id: parseInt(projectId!),
      reporter_id: currentUser?.id
    }, {
      onSuccess: () => {
        setIsCreateModalVisible(false);
        createForm.resetFields();
      }
    });
  };

  const handleEditIssue = (issue: Issue) => {
    console.log('Editing issue:', issue); // Debug log
    setEditingIssue(issue);
    editForm.setFieldsValue({
      title: issue.title,
      description: issue.description,
      type: issue.type,
      priority: issue.priority,
      status_id: issue.status_id,
      assignee_id: issue.assignee_id,
      story_points: issue.story_points,
      start_date: issue.start_date ? dayjs(issue.start_date) : null,
    });
    setIsEditModalVisible(true);
  };

  const handleUpdateIssue = async (values: any) => {
    if (!editingIssue) return;

    updateIssueMutation.mutate({
      issueId: editingIssue.id,
      issueData: values
    }, {
      onSuccess: () => {
        setIsEditModalVisible(false);
        setEditingIssue(null);
        editForm.resetFields();
      }
    });
  };

  const handleDeleteIssue = (issueId: number) => {
    deleteIssueMutation.mutate(issueId);
  };

  const isLoading = kanbanQuery.isLoading || projectQuery.isLoading || membersQuery.isLoading || statusesQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  const columns = kanbanQuery.data || [];
  const project = projectQuery.data;
  const members = membersQuery.data || [];
  const statuses = statusesQuery.data || [];

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Title level={2} className="m-0">
              {project?.name} Board
            </Title>
            <Text type="secondary">{project?.description}</Text>
          </div>
          <Space>
            <ExcelExport 
              projectId={parseInt(projectId!)} 
              projectName={project?.name || 'Project'} 
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalVisible(true)}
            >
              Create Issue
            </Button>
          </Space>
        </div>

        <Row gutter={16} className="h-full">
          {columns.map((column: any) => (
            <Col span={8} key={column.id}>
              <KanbanColumnComponent
                column={column}
                onDrop={handleDrop}
                onEdit={handleEditIssue}
                onDelete={handleDeleteIssue}
              />
            </Col>
          ))}
        </Row>

        {/* Create Issue Modal */}
        <Modal
          title="Create New Issue"
          open={isCreateModalVisible}
          onCancel={() => {
            setIsCreateModalVisible(false);
            createForm.resetFields();
          }}
          onOk={() => createForm.submit()}
          okText="Create"
          width={600}
        >
          <Form
            form={createForm}
            layout="vertical"
            onFinish={handleCreateIssue}
          >
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: 'Please enter issue title' }]}
            >
              <Input placeholder="Enter issue title" />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <TextArea
                rows={4}
                placeholder="Enter issue description"
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="type"
                  label="Type"
                  rules={[{ required: true, message: 'Please select issue type' }]}
                >
                  <Select placeholder="Select issue type">
                    <Option value="task">Task</Option>
                    <Option value="story">Story</Option>
                    <Option value="bug">Bug</Option>
                    <Option value="epic">Epic</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="priority"
                  label="Priority"
                  rules={[{ required: true, message: 'Please select priority' }]}
                >
                  <Select placeholder="Select priority">
                    <Option value="low">Low</Option>
                    <Option value="medium">Medium</Option>
                    <Option value="high">High</Option>
                    <Option value="critical">Critical</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="status_id"
                  label="Status"
                  rules={[{ required: true, message: 'Please select status' }]}
                >
                  <Select placeholder="Select status">
                    {statuses.map((status: any) => (
                      <Option key={status.id} value={status.id}>
                        {status.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="assignee_id" label="Assignee">
                  <Select 
                    placeholder="Select assignee" 
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      String(option?.children).toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {members.map((member: any) => (
                      <Option key={member.id} value={member.id}>
                        {member.full_name || member.username}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="story_points" label="Story Points">
                  <Select placeholder="Select story points" allowClear>
                    {[1, 2, 3, 5, 8, 13, 21].map((point) => (
                      <Option key={point} value={point}>
                        {point}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="start_date" label="Start Date">
                  <DatePicker 
                    placeholder="Select start date"
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>

        {/* Edit Issue Modal */}
        <Modal
          title="Edit Issue"
          open={isEditModalVisible}
          onCancel={() => {
            setIsEditModalVisible(false);
            setEditingIssue(null);
            editForm.resetFields();
          }}
          onOk={() => editForm.submit()}
          okText="Update"
          width={600}
        >
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleUpdateIssue}
          >
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: 'Please enter issue title' }]}
            >
              <Input placeholder="Enter issue title" />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <TextArea
                rows={4}
                placeholder="Enter issue description"
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="type"
                  label="Type"
                  rules={[{ required: true, message: 'Please select issue type' }]}
                >
                  <Select placeholder="Select issue type">
                    <Option value="task">Task</Option>
                    <Option value="story">Story</Option>
                    <Option value="bug">Bug</Option>
                    <Option value="epic">Epic</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="priority"
                  label="Priority"
                  rules={[{ required: true, message: 'Please select priority' }]}
                >
                  <Select placeholder="Select priority">
                    <Option value="low">Low</Option>
                    <Option value="medium">Medium</Option>
                    <Option value="high">High</Option>
                    <Option value="critical">Critical</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="status_id"
                  label="Status"
                  rules={[{ required: true, message: 'Please select status' }]}
                >
                  <Select placeholder="Select status">
                    {statuses.map((status: any) => (
                      <Option key={status.id} value={status.id}>
                        {status.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="assignee_id" label="Assignee">
                  <Select 
                    placeholder="Select assignee" 
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      String(option?.children).toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {getAssigneeOptions().map((member: any) => (
                      <Option key={member.id} value={member.id}>
                        {member.full_name || member.username}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="story_points" label="Story Points">
                  <Select placeholder="Select story points" allowClear>
                    {[1, 2, 3, 5, 8, 13, 21].map((point) => (
                      <Option key={point} value={point}>
                        {point}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="start_date" label="Start Date">
                  <DatePicker 
                    placeholder="Select start date"
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
      </div>
    </DndProvider>
  );
};

export default Board;
