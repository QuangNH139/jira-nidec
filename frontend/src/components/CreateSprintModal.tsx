import React from 'react';
import { Modal, Form, Input, DatePicker, Button, message } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sprintsAPI } from '../services/api';
import dayjs from 'dayjs';

interface CreateSprintModalProps {
  visible: boolean;
  onCancel: () => void;
  projectId: number;
  onSprintCreated?: () => void;
}

interface CreateSprintData {
  name: string;
  goal?: string;
  start_date?: string;
  end_date?: string;
  project_id: number;
}

const CreateSprintModal: React.FC<CreateSprintModalProps> = ({
  visible,
  onCancel,
  onSprintCreated,
  projectId
}) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const createSprintMutation = useMutation({
    mutationFn: (data: CreateSprintData) => sprintsAPI.create(data),
    onSuccess: (response) => {
      message.success('Sprint created successfully!');
      // Invalidate and refetch sprints and issues
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      queryClient.invalidateQueries({ queryKey: ['backlog', projectId] });
      queryClient.invalidateQueries({ queryKey: ['active-sprint', projectId] });
      if (onSprintCreated) {
        onSprintCreated();
      }
      form.resetFields();
      onCancel();
    },
    onError: (error: any) => {
      console.error('Create sprint error:', error);
      message.error(error.response?.data?.error || 'Failed to create sprint');
    }
  });

  const handleSubmit = async (values: any) => {
    try {
      const submitData: CreateSprintData = {
        name: values.name,
        goal: values.goal,
        project_id: projectId,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : undefined,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : undefined,
      };

      createSprintMutation.mutate(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Create New Sprint"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{}}
      >
        <Form.Item
          name="name"
          label="Sprint Name"
          rules={[
            { required: true, message: 'Please enter sprint name' },
            { min: 3, message: 'Sprint name must be at least 3 characters' }
          ]}
        >
          <Input placeholder="Enter sprint name (e.g., Sprint 1, Week 1)" />
        </Form.Item>

        <Form.Item
          name="goal"
          label="Sprint Goal"
          rules={[
            { max: 500, message: 'Sprint goal must be less than 500 characters' }
          ]}
        >
          <Input.TextArea 
            rows={3}
            placeholder="What is the goal of this sprint? (optional)"
          />
        </Form.Item>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item
            name="start_date"
            label="Start Date"
            style={{ flex: 1 }}
            rules={[
              {
                validator: (_, value) => {
                  const endDate = form.getFieldValue('end_date');
                  if (value && endDate && value.isAfter(endDate)) {
                    return Promise.reject('Start date must be before end date');
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <DatePicker 
              style={{ width: '100%' }}
              placeholder="Select start date"
            />
          </Form.Item>

          <Form.Item
            name="end_date"
            label="End Date"
            style={{ flex: 1 }}
            rules={[
              {
                validator: (_, value) => {
                  const startDate = form.getFieldValue('start_date');
                  if (value && startDate && value.isBefore(startDate)) {
                    return Promise.reject('End date must be after start date');
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <DatePicker 
              style={{ width: '100%' }}
              placeholder="Select end date"
            />
          </Form.Item>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
          <Button onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            type="primary" 
            htmlType="submit"
            loading={createSprintMutation.isPending}
          >
            Create Sprint
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateSprintModal;
