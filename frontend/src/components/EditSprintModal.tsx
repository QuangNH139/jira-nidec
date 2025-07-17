import React, { useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Button, message } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sprintsAPI } from '../services/api';
import { Sprint } from '../types';
import dayjs from 'dayjs';

interface EditSprintModalProps {
  visible: boolean;
  onCancel: () => void;
  sprint: Sprint | null;
  projectId: number;
}

interface UpdateSprintData {
  name: string;
  goal?: string;
  start_date?: string;
  end_date?: string;
}

const EditSprintModal: React.FC<EditSprintModalProps> = ({
  visible,
  onCancel,
  sprint,
  projectId
}) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const updateSprintMutation = useMutation({
    mutationFn: ({ sprintId, data }: { sprintId: number; data: UpdateSprintData }) => 
      sprintsAPI.update(sprintId, data),
    onSuccess: (response) => {
      message.success('Sprint updated successfully!');
      // Invalidate and refetch sprints
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      queryClient.invalidateQueries({ queryKey: ['sprints', 'active', projectId] });
      queryClient.invalidateQueries({ queryKey: ['backlog', projectId] });
      form.resetFields();
      onCancel();
    },
    onError: (error: any) => {
      console.error('Update sprint error:', error);
      message.error(error.response?.data?.error || 'Failed to update sprint');
    }
  });

  // Populate form when sprint changes
  useEffect(() => {
    if (visible && sprint) {
      form.setFieldsValue({
        name: sprint.name,
        goal: sprint.goal,
        start_date: sprint.start_date ? dayjs(sprint.start_date) : null,
        end_date: sprint.end_date ? dayjs(sprint.end_date) : null,
      });
    }
  }, [visible, sprint, form]);

  const handleSubmit = async (values: any) => {
    if (!sprint) return;

    try {
      const submitData: UpdateSprintData = {
        name: values.name,
        goal: values.goal,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : undefined,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : undefined,
      };

      updateSprintMutation.mutate({
        sprintId: sprint.id,
        data: submitData
      });
    } catch (error) {
      console.error('Form validation error:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Edit Sprint"
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
          name="name"
          label="Sprint Name"
          rules={[
            { required: true, message: 'Please enter sprint name' },
            { min: 1, max: 100, message: 'Sprint name must be between 1-100 characters' }
          ]}
        >
          <Input placeholder="Enter sprint name" />
        </Form.Item>

        <Form.Item
          name="goal"
          label="Sprint Goal"
          rules={[
            { max: 500, message: 'Sprint goal must be less than 500 characters' }
          ]}
        >
          <Input.TextArea 
            placeholder="Enter sprint goal (optional)"
            rows={3}
          />
        </Form.Item>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item
            name="start_date"
            label="Start Date"
            style={{ flex: 1 }}
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
            loading={updateSprintMutation.isPending}
          >
            Update Sprint
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditSprintModal;
