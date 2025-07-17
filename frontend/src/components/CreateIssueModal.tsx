import React from 'react';
import { Modal, Form, Input, Select, DatePicker, Button, message, Row, Col } from 'antd';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { issuesAPI, projectsAPI } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

interface CreateIssueModalProps {
  visible: boolean;
  onCancel: () => void;
  projectId: number;
}

interface CreateIssueData {
  title: string;
  description?: string;
  type: 'task' | 'story' | 'bug' | 'epic';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status_id: number;
  assignee_id?: number;
  project_id: number;
  sprint_id?: number;
  story_points?: number;
  start_date?: string;
}

const CreateIssueModal: React.FC<CreateIssueModalProps> = ({
  visible,
  onCancel,
  projectId
}) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Fetch project members
  const membersQuery = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => projectsAPI.getMembers(projectId),
    select: (response) => response.data,
    enabled: !!projectId
  });

  // Fetch project statuses
  const statusesQuery = useQuery({
    queryKey: ['project-statuses', projectId],
    queryFn: () => projectsAPI.getStatuses(projectId),
    select: (response) => response.data,
    enabled: !!projectId
  });

  const createIssueMutation = useMutation({
    mutationFn: (data: CreateIssueData) => issuesAPI.create(data),
    onSuccess: (response) => {
      message.success('Task created successfully!');
      // Invalidate and refetch issues and backlog
      queryClient.invalidateQueries({ queryKey: ['backlog', projectId] });
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
      form.resetFields();
      onCancel();
    },
    onError: (error: any) => {
      console.error('Create issue error:', error);
      message.error(error.response?.data?.error || 'Failed to create task');
    }
  });

  const handleSubmit = async (values: any) => {
    try {
      const submitData: CreateIssueData = {
        title: values.title,
        description: values.description,
        type: values.type,
        priority: values.priority,
        status_id: values.status_id,
        assignee_id: values.assignee_id,
        project_id: projectId,
        story_points: values.story_points,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : undefined,
      };

      createIssueMutation.mutate(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const members = membersQuery.data || [];
  const statuses = statusesQuery.data || [];

  return (
    <Modal
      title="Create New Task"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={700}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          type: 'task',
          priority: 'medium'
        }}
      >
        <Form.Item
          name="title"
          label="Task Title"
          rules={[
            { required: true, message: 'Please enter task title' },
            { min: 3, message: 'Task title must be at least 3 characters' }
          ]}
        >
          <Input placeholder="Enter task title" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[
            { max: 1000, message: 'Description must be less than 1000 characters' }
          ]}
        >
          <TextArea 
            rows={4}
            placeholder="Describe the task (optional)"
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="type"
              label="Issue Type"
              rules={[{ required: true, message: 'Please select issue type' }]}
            >
              <Select placeholder="Select issue type">
                <Option value="task">📋 Task</Option>
                <Option value="story">📖 Story</Option>
                <Option value="bug">🐛 Bug</Option>
                <Option value="epic">🚀 Epic</Option>
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
                <Option value="low">🟢 Low</Option>
                <Option value="medium">🟡 Medium</Option>
                <Option value="high">🟠 High</Option>
                <Option value="critical">🔴 Critical</Option>
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
                {statuses.map((status) => (
                  <Option key={status.id} value={status.id}>
                    {status.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="assignee_id"
              label="Assignee"
            >
              <Select placeholder="Select assignee (optional)" allowClear>
                {members.map((member) => (
                  <Option key={member.id} value={member.id}>
                    👤 {member.full_name}
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
                    {point} points
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
          <Button onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            type="primary" 
            htmlType="submit"
            loading={createIssueMutation.isPending}
          >
            Create Task
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateIssueModal;
