import React from 'react';
import { Modal, Descriptions, Tag, Avatar, Image, Typography, Space, Divider } from 'antd';
import { UserOutlined, CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Issue } from '../types';
import { uploadAPI } from '../services/api';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface IssueDetailModalProps {
  visible: boolean;
  onCancel: () => void;
  issue: Issue | null;
}

const IssueDetailModal: React.FC<IssueDetailModalProps> = ({
  visible,
  onCancel,
  issue
}) => {
  if (!issue) return null;

  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case 'bug':
        return '🐛';
      case 'task':
        return '✅';
      case 'story':
        return '📖';
      case 'epic':
        return '🎯';
      default:
        return '✅';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'blue';
      case 'low':
        return 'green';
      default:
        return 'default';
    }
  };

  const getStatusColor = (category: string) => {
    switch (category) {
      case 'todo':
        return 'default';
      case 'inprogress':
        return 'processing';
      case 'done':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Modal
      title={
        <Space>
          <span style={{ fontSize: '20px' }}>{getIssueTypeIcon(issue.type)}</span>
          <Title level={4} style={{ margin: 0 }}>
            {issue.title}
          </Title>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      style={{ top: 20 }}
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* Basic Information */}
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="Issue Type">
            <Space>
              <span>{getIssueTypeIcon(issue.type)}</span>
              <Text strong>{issue.type.toUpperCase()}</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Priority">
            <Tag color={getPriorityColor(issue.priority)}>
              {issue.priority.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={getStatusColor(issue.status_category || 'default')}>
              {issue.status_name}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Story Points">
            {issue.story_points ? (
              <Tag color="blue">{issue.story_points} pts</Tag>
            ) : (
              <Text type="secondary">Not set</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Assignee">
            {issue.assignee_name ? (
              <Space>
                <Avatar size="small" icon={<UserOutlined />} />
                <Text>{issue.assignee_name}</Text>
              </Space>
            ) : (
              <Text type="secondary">Unassigned</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Reporter">
            <Space>
              <Avatar size="small" icon={<UserOutlined />} />
              <Text>{issue.reporter_name}</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Start Date">
            {issue.start_date ? (
              <Space>
                <CalendarOutlined />
                <Text>{dayjs(issue.start_date).format('YYYY-MM-DD')}</Text>
              </Space>
            ) : (
              <Text type="secondary">Not set</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            <Space>
              <ClockCircleOutlined />
              <Text>{dayjs(issue.created_at).format('YYYY-MM-DD HH:mm')}</Text>
            </Space>
          </Descriptions.Item>
        </Descriptions>

        {/* Description */}
        <Divider orientation="left">Description</Divider>
        <div style={{ 
          background: '#fafafa', 
          padding: '16px', 
          borderRadius: '6px',
          border: '1px solid #f0f0f0'
        }}>
          <Text style={{ whiteSpace: 'pre-wrap' }}>
            {issue.description || 'No description provided.'}
          </Text>
        </div>

        {/* Images Section */}
        {(issue.before_image || issue.after_image) && (
          <>
            <Divider orientation="left">Attachments</Divider>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Before Image */}
              <div>
                <Title level={5} style={{ marginBottom: '8px' }}>
                  Before Image
                </Title>
                {issue.before_image ? (
                  <div style={{ 
                    border: '2px dashed #d9d9d9', 
                    borderRadius: '8px', 
                    padding: '8px',
                    textAlign: 'center'
                  }}>
                    <Image
                      width="100%"
                      height={200}
                      src={uploadAPI.getFileUrl(issue.before_image)}
                      alt="Before"
                      style={{ 
                        objectFit: 'cover', 
                        borderRadius: '6px',
                        border: '1px solid #f0f0f0'
                      }}
                      placeholder={
                        <div style={{ 
                          height: 200, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          background: '#fafafa'
                        }}>
                          Loading...
                        </div>
                      }
                    />
                  </div>
                ) : (
                  <div style={{ 
                    height: 200, 
                    border: '2px dashed #d9d9d9', 
                    borderRadius: '8px',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: '#fafafa'
                  }}>
                    <Text type="secondary">No before image</Text>
                  </div>
                )}
              </div>

              {/* After Image */}
              <div>
                <Title level={5} style={{ marginBottom: '8px' }}>
                  After Image
                </Title>
                {issue.after_image ? (
                  <div style={{ 
                    border: '2px dashed #d9d9d9', 
                    borderRadius: '8px', 
                    padding: '8px',
                    textAlign: 'center'
                  }}>
                    <Image
                      width="100%"
                      height={200}
                      src={uploadAPI.getFileUrl(issue.after_image)}
                      alt="After"
                      style={{ 
                        objectFit: 'cover', 
                        borderRadius: '6px',
                        border: '1px solid #f0f0f0'
                      }}
                      placeholder={
                        <div style={{ 
                          height: 200, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          background: '#fafafa'
                        }}>
                          Loading...
                        </div>
                      }
                    />
                  </div>
                ) : (
                  <div style={{ 
                    height: 200, 
                    border: '2px dashed #d9d9d9', 
                    borderRadius: '8px',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: '#fafafa'
                  }}>
                    <Text type="secondary">No after image</Text>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Additional Info */}
        <Divider orientation="left">Additional Information</Divider>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Project">
            <Text strong>{issue.project_name || 'Unknown Project'}</Text>
          </Descriptions.Item>
          {issue.updated_at && dayjs(issue.updated_at).diff(dayjs(issue.created_at), 'second') > 1 && (
            <Descriptions.Item label="Last Updated">
              <Space>
                <ClockCircleOutlined />
                <Text>{dayjs(issue.updated_at).format('YYYY-MM-DD HH:mm')}</Text>
              </Space>
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>
    </Modal>
  );
};

export default IssueDetailModal;
