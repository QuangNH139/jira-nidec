import React from 'react';
import { Modal, Form, Input, DatePicker, Row, Col } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { issuesAPI, projectsAPI, sprintsAPI } from '../services/api';
import { useQueryInvalidation } from '../hooks/useQueryInvalidation';
import { getFieldConfig } from '../utils/formHelpers';
import { IssueTypeSelect, PrioritySelect, MembersSelect, StoryPointsSelect, StatusesSelect, SprintsSelect } from './shared/FormSelects';
import { FormModalFooter } from './shared/ModalFooter';

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
  const { invalidateIssueOperations } = useQueryInvalidation();

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

  // Fetch project sprints
  const sprintsQuery = useQuery({
    queryKey: ['project-sprints', projectId],
    queryFn: () => sprintsAPI.getByProject(projectId),
    select: (response) => response.data,
    enabled: !!projectId
  });

  const createIssueMutation = useMutation({
    mutationFn: (data: CreateIssueData) => issuesAPI.create(data),
    onSuccess: () => {
      invalidateIssueOperations(projectId);
      form.resetFields();
      onCancel();
    },
    onError: (error: any) => {
      console.error('Create issue error:', error);
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
        sprint_id: values.sprint_id,
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
  const sprints = sprintsQuery.data || [];

  const titleConfig = getFieldConfig('taskTitle');
  const descriptionConfig = getFieldConfig('description');
  const typeConfig = getFieldConfig('issueType');
  const priorityConfig = getFieldConfig('priority');
  const statusConfig = getFieldConfig('status');
  const assigneeConfig = getFieldConfig('assignee');
  const sprintConfig = getFieldConfig('sprint');
  const storyPointsConfig = getFieldConfig('storyPoints');
  const startDateConfig = getFieldConfig('startDate');

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
          {...titleConfig}
        >
          <Input placeholder={titleConfig.placeholder} />
        </Form.Item>

        <Form.Item
          {...descriptionConfig}
        >
          <TextArea 
            rows={4}
            placeholder={descriptionConfig.placeholder}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              {...typeConfig}
            >
              <IssueTypeSelect placeholder={typeConfig.placeholder} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              {...priorityConfig}
            >
              <PrioritySelect placeholder={priorityConfig.placeholder} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              {...statusConfig}
            >
              <StatusesSelect 
                statuses={statuses}
                placeholder={statusConfig.placeholder}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              {...assigneeConfig}
            >
              <MembersSelect
                members={members}
                placeholder={assigneeConfig.placeholder}
                allowClear
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              {...sprintConfig}
            >
              <SprintsSelect
                sprints={sprints}
                placeholder={sprintConfig.placeholder}
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item 
              {...storyPointsConfig}
            >
              <StoryPointsSelect 
                placeholder={storyPointsConfig.placeholder}
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item 
              {...startDateConfig}
            >
              <DatePicker 
                placeholder={startDateConfig.placeholder}
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Col>
        </Row>

        <FormModalFooter
          onCancel={handleCancel}
          loading={createIssueMutation.isPending}
          submitText="Create Task"
        />
      </Form>
    </Modal>
  );
};

export default CreateIssueModal;
