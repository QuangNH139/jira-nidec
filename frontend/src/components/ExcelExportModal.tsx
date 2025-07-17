import React, { useState } from 'react';
import { Modal, DatePicker, Form, message, Button, Typography } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import { useExportIssues } from '../hooks/useIssues';

const { Text } = Typography;

interface ExcelExportModalProps {
  visible: boolean;
  onCancel: () => void;
  projectId: number;
  projectName: string;
}

const ExcelExportModal: React.FC<ExcelExportModalProps> = ({ 
  visible, 
  onCancel, 
  projectId, 
  projectName 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const exportMutation = useExportIssues();

  const handleExport = async (values: { dateRange: [dayjs.Dayjs, dayjs.Dayjs] }) => {
    if (!values.dateRange || !values.dateRange[0] || !values.dateRange[1]) {
      message.error('Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      const startDate = values.dateRange[0].format('YYYY-MM-DD');
      const endDate = values.dateRange[1].format('YYYY-MM-DD');

      const blob = await exportMutation.mutateAsync({
        projectId,
        startDate,
        endDate
      });

      // Create filename
      const filename = `${projectName}_Issues_${startDate}_to_${endDate}.xlsx`;
      
      // Download file
      saveAs(blob, filename);
      message.success('Excel file downloaded successfully! The file includes image information and URLs.');
      onCancel();
      form.resetFields();
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export Excel file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Export Issues - ${projectName}`}
      open={visible}
      onCancel={() => {
        onCancel();
        form.resetFields();
      }}
      footer={null}
      width={500}
    >
      <Form form={form} onFinish={handleExport} layout="vertical">
        <div style={{ 
          background: '#f6ffed', 
          border: '1px solid #b7eb8f', 
          borderRadius: '6px', 
          padding: '12px', 
          marginBottom: '16px' 
        }}>
          <Text type="secondary">
            📷 <strong>New Feature:</strong> The exported Excel file now includes image information (Before/After images) 
            with direct URLs for easy access to attached files.
          </Text>
        </div>
        
        <Form.Item
          name="dateRange"
          label="Date Range"
          rules={[{ required: true, message: 'Please select date range' }]}
        >
          <DatePicker.RangePicker
            format="YYYY-MM-DD"
            placeholder={['Start Date', 'End Date']}
            allowClear
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<DownloadOutlined />}
              loading={loading || exportMutation.isPending}
            >
              Export Excel
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ExcelExportModal;
