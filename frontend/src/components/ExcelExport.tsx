import React, { useState } from 'react';
import { Button, DatePicker, Form, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import { useExportIssues } from '../hooks/useIssues';

interface ExcelExportProps {
  projectId: number;
  projectName: string;
}

const ExcelExport: React.FC<ExcelExportProps> = ({ projectId, projectName }) => {
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
      message.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export Excel file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} onFinish={handleExport} layout="inline">
      <Form.Item
        name="dateRange"
        rules={[{ required: true, message: 'Please select date range' }]}
      >
        <DatePicker.RangePicker
          format="YYYY-MM-DD"
          placeholder={['Start Date', 'End Date']}
          allowClear
          style={{ width: 250 }}
        />
      </Form.Item>
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          icon={<DownloadOutlined />}
          loading={loading || exportMutation.isPending}
        >
          Export Excel
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ExcelExport;
