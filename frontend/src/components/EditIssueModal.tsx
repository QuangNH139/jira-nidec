import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Button, message, Upload, Row, Col, Image } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { issuesAPI, uploadAPI } from '../services/api';
import { Issue, ProjectMember } from '../types';
import dayjs from 'dayjs';

const { Option } = Select;
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
  const queryClient = useQueryClient();
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const updateIssueMutation = useMutation({
    mutationFn: ({ issueId, data }: { issueId: number; data: UpdateIssueData }) => 
      issuesAPI.update(issueId, data),
    onSuccess: (response) => {
      message.success('Issue updated successfully!');
      // Invalidate and refetch issues and backlog
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
      queryClient.invalidateQueries({ queryKey: ['backlog', projectId] });
      queryClient.invalidateQueries({ queryKey: ['kanban', projectId] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
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
        story_points: issue.story_points,
        start_date: issue.start_date ? dayjs(issue.start_date) : null,
      });
      setBeforeImage(issue.before_image || null);
      setAfterImage(issue.after_image || null);
    }
  }, [visible, issue, form]);

  const handleImageUpload = async (file: File, type: 'before' | 'after') => {
    setUploading(true);
    try {
      console.log('Starting upload for file:', file.name, 'type:', type);
      const response = await uploadAPI.uploadFile(file);
      console.log('Upload response:', response);
      const filename = response.data.filename;
      
      if (type === 'before') {
        setBeforeImage(filename);
      } else {
        setAfterImage(filename);
      }
      
      message.success('Image uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error details:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      console.error('Response headers:', error.response?.headers);
      message.error(error.response?.data?.error || error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleImageRemove = (type: 'before' | 'after') => {
    if (type === 'before') {
      setBeforeImage(null);
    } else {
      setAfterImage(null);
    }
  };

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
        // Preserve the current sprint_id to prevent issue from being removed from sprint
        sprint_id: issue.sprint_id,
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
          name="title"
          label="Title"
          rules={[
            { required: true, message: 'Please enter issue title' },
            { min: 1, max: 200, message: 'Title must be between 1-200 characters' }
          ]}
        >
          <Input placeholder="Enter issue title" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[
            { max: 1000, message: 'Description must be less than 1000 characters' }
          ]}
        >
          <TextArea 
            placeholder="Enter issue description (optional)"
            rows={4}
          />
        </Form.Item>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item
            name="type"
            label="Type"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Please select issue type' }]}
          >
            <Select placeholder="Select type">
              <Option value="task">Task</Option>
              <Option value="story">Story</Option>
              <Option value="bug">Bug</Option>
              <Option value="epic">Epic</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label="Priority"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Please select priority' }]}
          >
            <Select placeholder="Select priority">
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
              <Option value="critical">Critical</Option>
            </Select>
          </Form.Item>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item
            name="assignee_id"
            label="Assignee"
            style={{ flex: 1 }}
          >
            <Select 
              placeholder="Select assignee (optional)"
              allowClear
            >
              {projectMembers.map(member => (
                <Option key={member.id} value={member.id}>
                  {member.full_name} ({member.email})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="story_points"
            label="Story Points"
            style={{ flex: 1 }}
          >
            <Select placeholder="Select story points" allowClear>
              <Option value={1}>1</Option>
              <Option value={2}>2</Option>
              <Option value={3}>3</Option>
              <Option value={5}>5</Option>
              <Option value={8}>8</Option>
              <Option value={13}>13</Option>
              <Option value={21}>21</Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          name="start_date"
          label="Start Date"
        >
          <DatePicker 
            style={{ width: '100%' }}
            placeholder="Select start date (optional)"
          />
        </Form.Item>

        {/* Image Upload Section */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Before Image">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {beforeImage ? (
                  <div style={{ position: 'relative' }}>
                    <Image
                      width={200}
                      height={150}
                      src={uploadAPI.getFileUrl(beforeImage)}
                      alt="Before"
                      style={{ objectFit: 'cover', borderRadius: '6px' }}
                    />
                    <Button
                      type="primary"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleImageRemove('before')}
                      style={{ position: 'absolute', top: '4px', right: '4px' }}
                    />
                  </div>
                ) : (
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={(file) => {
                      handleImageUpload(file, 'before');
                      return false;
                    }}
                    disabled={uploading}
                  >
                    <Button icon={<UploadOutlined />} loading={uploading}>
                      Upload Before Image
                    </Button>
                  </Upload>
                )}
              </div>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="After Image">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {afterImage ? (
                  <div style={{ position: 'relative' }}>
                    <Image
                      width={200}
                      height={150}
                      src={uploadAPI.getFileUrl(afterImage)}
                      alt="After"
                      style={{ objectFit: 'cover', borderRadius: '6px' }}
                    />
                    <Button
                      type="primary"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleImageRemove('after')}
                      style={{ position: 'absolute', top: '4px', right: '4px' }}
                    />
                  </div>
                ) : (
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={(file) => {
                      handleImageUpload(file, 'after');
                      return false;
                    }}
                    disabled={uploading}
                  >
                    <Button icon={<UploadOutlined />} loading={uploading}>
                      Upload After Image
                    </Button>
                  </Upload>
                )}
              </div>
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
            loading={updateIssueMutation.isPending}
          >
            Update Issue
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditIssueModal;
