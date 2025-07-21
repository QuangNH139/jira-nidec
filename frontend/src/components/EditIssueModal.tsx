import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, DatePicker, message, Row, Col } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { issuesAPI, sprintsAPI } from '../services/api';
import { Issue, ProjectMember } from '../types';
import { useQueryInvalidation } from '../hooks/useQueryInvalidation';
import { getFieldConfig } from '../utils/formHelpers';
import { IssueTypeSelect, PrioritySelect, MembersSelect, StoryPointsSelect, SprintsSelect } from './shared/FormSelects';
import { ImageUpload } from './shared/ImageUpload';
import { FormModalFooter } from './shared/ModalFooter';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface EditIssueModalProps {
  visible: boolean;
  onCancel: () => void;
  issue: Issue | null;
  projectMembers: ProjectMember[];
  projectId: number;
}

interface UpdateIssueData {
  title: string;
  description?: string;
  type: 'task' | 'story' | 'bug' | 'epic';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee_id?: number;
  story_points?: number;
  start_date?: string;
  before_image?: string;
  after_image?: string;
  sprint_id?: number | null;
}

const EditIssueModal: React.FC<EditIssueModalProps> = ({
  visible,
  onCancel,
  issue,
  projectMembers,
  projectId
}) => {
  const [form] = Form.useForm();
  const { invalidateIssueOperations } = useQueryInvalidation();
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);

  // Fetch project sprints
  const sprintsQuery = useQuery({
    queryKey: ['project-sprints', projectId],
    queryFn: () => sprintsAPI.getByProject(projectId),
    select: (response) => response.data,
    enabled: !!projectId
  });

  const updateIssueMutation = useMutation({
    mutationFn: ({ issueId, data }: { issueId: number; data: UpdateIssueData }) => 
      issuesAPI.update(issueId, data),
    onSuccess: () => {
      message.success('Issue updated successfully!');
      invalidateIssueOperations(projectId, issue?.id);
      form.resetFields();
      onCancel();
    },
    onError: (error: any) => {
      console.error('Update issue error:', error);
      message.error(error.response?.data?.error || 'Failed to update issue');
    }
  });

  // Populate form when issue changes
  useEffect(() => {
    if (visible && issue) {
      form.setFieldsValue({
        title: issue.title,
        description: issue.description,
        type: issue.type,
        priority: issue.priority,
        assignee_id: issue.assignee_id,
        sprint_id: issue.sprint_id,
        story_points: issue.story_points,
        start_date: issue.start_date ? dayjs(issue.start_date) : null,
      });
      setBeforeImage(issue.before_image || null);
      setAfterImage(issue.after_image || null);
    }
  }, [visible, issue, form]);

  const handleSubmit = async (values: any) => {
    if (!issue) return;

    try {
      const submitData: UpdateIssueData = {
        title: values.title,
        description: values.description,
        type: values.type,
        priority: values.priority,
        assignee_id: values.assignee_id,
        story_points: values.story_points,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : undefined,
        before_image: beforeImage || undefined,
        after_image: afterImage || undefined,
        sprint_id: values.sprint_id,
      };

      updateIssueMutation.mutate({
        issueId: issue.id,
        data: submitData
      });
    } catch (error) {
      console.error('Form validation error:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setBeforeImage(null);
    setAfterImage(null);
    onCancel();
  };

  const titleConfig = getFieldConfig('issueTitle');
  const descriptionConfig = getFieldConfig('description');
  const typeConfig = getFieldConfig('issueType');
  const priorityConfig = getFieldConfig('priority');
  const assigneeConfig = getFieldConfig('assignee');
  const sprintConfig = getFieldConfig('sprint');
  const storyPointsConfig = getFieldConfig('storyPoints');
  const startDateConfig = getFieldConfig('startDate');

  const sprints = sprintsQuery.data || [];

  return (
    <Modal
      title="Edit Issue"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
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
            placeholder={descriptionConfig.placeholder}
            rows={4}
          />
        </Form.Item>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item
            {...typeConfig}
            style={{ flex: 1 }}
          >
            <IssueTypeSelect placeholder={typeConfig.placeholder} />
          </Form.Item>

          <Form.Item
            {...priorityConfig}
            style={{ flex: 1 }}
          >
            <PrioritySelect placeholder={priorityConfig.placeholder} />
          </Form.Item>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item
            {...assigneeConfig}
            style={{ flex: 1 }}
          >
            <MembersSelect 
              members={projectMembers}
              placeholder={assigneeConfig.placeholder}
              allowClear
              showEmail
            />
          </Form.Item>

          <Form.Item
            {...sprintConfig}
            style={{ flex: 1 }}
          >
            <SprintsSelect 
              sprints={sprints}
              placeholder={sprintConfig.placeholder}
              allowClear
            />
          </Form.Item>

          <Form.Item
            {...storyPointsConfig}
            style={{ flex: 1 }}
          >
            <StoryPointsSelect 
              placeholder={storyPointsConfig.placeholder}
              allowClear
            />
          </Form.Item>
        </div>

        <Form.Item
          {...startDateConfig}
        >
          <DatePicker 
            style={{ width: '100%' }}
            placeholder={startDateConfig.placeholder}
          />
        </Form.Item>

        {/* Image Upload Section */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Before Image">
              <ImageUpload
                value={beforeImage}
                onChange={setBeforeImage}
                type="before"
                label="Upload Before Image"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="After Image">
              <ImageUpload
                value={afterImage}
                onChange={setAfterImage}
                type="after"
                label="Upload After Image"
              />
            </Form.Item>
          </Col>
        </Row>

        <FormModalFooter
          onCancel={handleCancel}
          loading={updateIssueMutation.isPending}
          submitText="Update Issue"
        />
      </Form>
    </Modal>
  );
};

export default EditIssueModal;
