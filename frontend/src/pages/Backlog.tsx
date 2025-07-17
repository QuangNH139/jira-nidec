import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Card,
  Row,
  Col,
  Spin,
  Empty,
  Button,
  Space,
  Tag,
  Avatar,
  Tooltip,
  Modal,
  message,
  Dropdown
} from 'antd';
import {
  PlayCircleOutlined,
  PlusOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  DragOutlined,
  UserOutlined,
  BugFilled,
  CheckCircleFilled,
  CheckCircleOutlined,
  ExclamationCircleFilled,
  EyeOutlined
} from '@ant-design/icons';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sprintsAPI, issuesAPI, projectsAPI } from '../services/api';
import { Sprint, Issue } from '../types';
import CreateSprintModal from '../components/CreateSprintModal';
import EditSprintModal from '../components/EditSprintModal';
import CreateIssueModal from '../components/CreateIssueModal';
import EditIssueModal from '../components/EditIssueModal';
import IssueDetailModal from '../components/IssueDetailModal';
import ProjectNavigation from '../components/ProjectNavigation';

const { Title, Text } = Typography;

interface DragItem {
  type: string;
  id: number;
  source: 'backlog' | 'sprint';
}

const ItemTypes = {
  ISSUE: 'issue',
};

const IssueItem: React.FC<{
  issue: Issue;
  onView: (issue: Issue) => void;
  onEdit: (issue: Issue) => void;
  onDelete: (issueId: number) => void;
}> = ({ issue, onView, onEdit, onDelete }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.ISSUE,
    item: { type: ItemTypes.ISSUE, id: issue.id, source: issue.sprint_id ? 'sprint' : 'backlog' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case 'bug':
        return <BugFilled style={{ color: '#ff4d4f' }} />;
      case 'story':
        return <CheckCircleFilled style={{ color: '#52c41a' }} />;
      case 'task':
        return <ExclamationCircleFilled style={{ color: '#1890ff' }} />;
      default:
        return <ExclamationCircleFilled style={{ color: '#1890ff' }} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#ff4d4f';
      case 'high': return '#ff7a45';
      case 'medium': return '#faad14';
      case 'low': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  const menuItems = [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'View Details',
      onClick: () => onView(issue)
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit',
      onClick: () => onEdit(issue)
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete',
      onClick: () => onDelete(issue.id),
      danger: true
    }
  ];

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        marginBottom: 8
      }}
    >
      <Card
        size="small"
        hoverable
        style={{ backgroundColor: '#fafafa' }}
        bodyStyle={{ padding: '12px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <DragOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
              {getIssueTypeIcon(issue.type)}
              <Text strong style={{ fontSize: 12 }}>
                {issue.title}
              </Text>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Tag
                color={getPriorityColor(issue.priority)}
                style={{ fontSize: 10, marginBottom: 0 }}
              >
                {issue.priority?.toUpperCase()}
              </Tag>
              
              {issue.story_points && (
                <Tag color="blue" style={{ fontSize: 10, marginBottom: 0 }}>
                  {issue.story_points} pts
                </Tag>
              )}
              
              {issue.assignee_name && (
                <Tooltip title={`Assigned to ${issue.assignee_name}`}>
                  <Avatar size={16} icon={<UserOutlined />} />
                </Tooltip>
              )}
            </div>
          </div>
          
          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<MoreOutlined />}
              size="small"
              style={{ marginLeft: 8 }}
            />
          </Dropdown>
        </div>
      </Card>
    </div>
  );
};

const SprintCard: React.FC<{
  sprint: Sprint;
  issues: Issue[];
  onStartSprint: (sprintId: number) => void;
  onCompleteSprint: (sprintId: number) => void;
  onEditSprint: (sprint: Sprint) => void;
  onDeleteSprint: (sprintId: number) => void;
  onViewIssue: (issue: Issue) => void;
  onEditIssue: (issue: Issue) => void;
  onDeleteIssue: (issueId: number) => void;
}> = ({ sprint, issues, onStartSprint, onCompleteSprint, onEditSprint, onDeleteSprint, onViewIssue, onEditIssue, onDeleteIssue }) => {
  const queryClient = useQueryClient();
  
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.ISSUE,
    drop: (item: DragItem) => {
      if (item.source !== 'sprint') {
        // Move issue to sprint
        moveIssueToSprint(item.id, sprint.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const moveIssueToSprint = async (issueId: number, sprintId: number) => {
    try {
      await issuesAPI.update(issueId, { sprint_id: sprintId });
      queryClient.invalidateQueries({ queryKey: ['backlog'] });
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      message.success('Issue moved to sprint');
    } catch (error) {
      message.error('Failed to move issue');
    }
  };

  const sprintMenuItems = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit Sprint',
      onClick: () => onEditSprint(sprint)
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete Sprint',
      onClick: () => onDeleteSprint(sprint.id),
      danger: true
    }
  ];

  const totalStoryPoints = issues.reduce((sum, issue) => sum + (issue.story_points || 0), 0);

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text strong>{sprint.name}</Text>
            <Tag color={sprint.status === 'active' ? 'green' : 'blue'} style={{ marginLeft: 8 }}>
              {sprint.status?.toUpperCase()}
            </Tag>
          </div>
          <Space>
            <Text type="secondary">{issues.length} issues • {totalStoryPoints} pts</Text>
            {sprint.status === 'planned' && (
              <Button
                type="primary"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => onStartSprint(sprint.id)}
              >
                Start Sprint
              </Button>
            )}
            {sprint.status === 'active' && (
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => onCompleteSprint(sprint.id)}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              >
                Complete Sprint
              </Button>
            )}
            <Dropdown
              menu={{ items: sprintMenuItems }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button type="text" icon={<MoreOutlined />} size="small" />
            </Dropdown>
          </Space>
        </div>
      }
      style={{ marginBottom: 16 }}
    >
      <div
        ref={drop}
        style={{
          minHeight: 100,
          backgroundColor: isOver ? '#e6f7ff' : 'transparent',
          border: isOver ? '2px dashed #1890ff' : '2px dashed transparent',
          borderRadius: 4,
          padding: 8
        }}
      >
        {sprint.goal && (
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary" italic>
              Goal: {sprint.goal}
            </Text>
          </div>
        )}
        
        {issues.length > 0 ? (
          issues.map(issue => (
            <IssueItem
              key={issue.id}
              issue={issue}
              onView={onViewIssue}
              onEdit={onEditIssue}
              onDelete={onDeleteIssue}
            />
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Text type="secondary">
              Drop issues here to add them to the sprint
            </Text>
          </div>
        )}
      </div>
    </Card>
  );
};

const BacklogCard: React.FC<{
  issues: Issue[];
  onViewIssue: (issue: Issue) => void;
  onEditIssue: (issue: Issue) => void;
  onDeleteIssue: (issueId: number) => void;
}> = ({ issues, onViewIssue, onEditIssue, onDeleteIssue }) => {
  const queryClient = useQueryClient();
  
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.ISSUE,
    drop: (item: DragItem) => {
      if (item.source !== 'backlog') {
        // Move issue back to backlog
        moveIssueToBacklog(item.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const moveIssueToBacklog = async (issueId: number) => {
    try {
      await issuesAPI.update(issueId, { sprint_id: null });
      queryClient.invalidateQueries({ queryKey: ['backlog'] });
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      message.success('Issue moved to backlog');
    } catch (error) {
      message.error('Failed to move issue');
    }
  };

  const totalStoryPoints = issues.reduce((sum, issue) => sum + (issue.story_points || 0), 0);

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>Backlog</Text>
          <Text type="secondary">{issues.length} issues • {totalStoryPoints} pts</Text>
        </div>
      }
      style={{ marginBottom: 16 }}
    >
      <div
        ref={drop}
        style={{
          minHeight: 200,
          backgroundColor: isOver ? '#f6ffed' : 'transparent',
          border: isOver ? '2px dashed #52c41a' : '2px dashed transparent',
          borderRadius: 4,
          padding: 8
        }}
      >
        {issues.length > 0 ? (
          issues.map(issue => (
            <IssueItem
              key={issue.id}
              issue={issue}
              onView={onViewIssue}
              onEdit={onEditIssue}
              onDelete={onDeleteIssue}
            />
          ))
        ) : (
          <Empty
            description="No issues in backlog"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </div>
    </Card>
  );
};

const Backlog: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isCreateSprintModalVisible, setIsCreateSprintModalVisible] = useState(false);
  const [isCreateIssueModalVisible, setIsCreateIssueModalVisible] = useState(false);
  const [isEditSprintModalVisible, setIsEditSprintModalVisible] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [isEditIssueModalVisible, setIsEditIssueModalVisible] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [viewingIssue, setViewingIssue] = useState<Issue | null>(null);

  // Fetch sprints
  const sprintsQuery = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => sprintsAPI.getByProject(parseInt(projectId!)),
    select: (response) => response.data
  });

  // Fetch all issues for the project
  const issuesQuery = useQuery({
    queryKey: ['backlog', projectId],
    queryFn: () => issuesAPI.getByProject(parseInt(projectId!)),
    select: (response) => response.data
  });

  // Fetch project members for assignee options
  const membersQuery = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => projectsAPI.getMembers(parseInt(projectId!)),
    select: (response) => response.data
  });

  // Start sprint mutation
  const startSprintMutation = useMutation({
    mutationFn: (sprintId: number) => sprintsAPI.start(sprintId),
    onSuccess: () => {
      message.success('Sprint started successfully!');
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      queryClient.invalidateQueries({ queryKey: ['active-sprint', projectId] });
      queryClient.invalidateQueries({ queryKey: ['backlog', projectId] });
      // Navigate to board after starting sprint
      navigate(`/projects/${projectId}/board`);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Failed to start sprint');
    }
  });

  // Complete sprint mutation
  const completeSprintMutation = useMutation({
    mutationFn: (sprintId: number) => sprintsAPI.complete(sprintId),
    onSuccess: () => {
      message.success('Sprint completed successfully!');
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      queryClient.invalidateQueries({ queryKey: ['active-sprint', projectId] });
      queryClient.invalidateQueries({ queryKey: ['backlog', projectId] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Failed to complete sprint');
    }
  });

  if (sprintsQuery.isLoading || issuesQuery.isLoading || membersQuery.isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '20px auto' }} />;
  }

  if (sprintsQuery.error) {
    return <div>Error loading sprints: {sprintsQuery.error.message}</div>;
  }

  if (issuesQuery.error) {
    return <div>Error loading issues: {issuesQuery.error.message}</div>;
  }

  if (membersQuery.error) {
    return <div>Error loading members: {membersQuery.error.message}</div>;
  }

  const sprints = sprintsQuery.data || [];
  const allIssues = issuesQuery.data || [];
  const members = membersQuery.data || [];
  
  // Separate issues by sprint
  const backlogIssues = Array.isArray(allIssues) ? allIssues.filter(issue => !issue.sprint_id) : [];
  const sprintIssuesMap = Array.isArray(sprints) ? sprints.reduce((acc, sprint) => {
    acc[sprint.id] = Array.isArray(allIssues) ? allIssues.filter(issue => issue.sprint_id === sprint.id) : [];
    return acc;
  }, {} as Record<number, Issue[]>) : {};

  const handleStartSprint = (sprintId: number) => {
    Modal.confirm({
      title: 'Start Sprint',
      content: 'Are you sure you want to start this sprint? This will move you to the board view.',
      onOk: () => startSprintMutation.mutate(sprintId)
    });
  };

  const handleCompleteSprint = (sprintId: number) => {
    Modal.confirm({
      title: 'Complete Sprint',
      content: 'Are you sure you want to complete this sprint? This action cannot be undone.',
      onOk: () => completeSprintMutation.mutate(sprintId)
    });
  };

  const handleCreateSprintSuccess = () => {
    sprintsQuery.refetch();
  }

  const handleViewIssue = (issue: Issue) => {
    setViewingIssue(issue);
  };

  const handleEditIssue = (issue: Issue) => {
    setEditingIssue(issue);
    setIsEditIssueModalVisible(true);
  };

  const handleDeleteIssue = (issueId: number) => {
    // TODO: Implement delete issue
    console.log('Delete issue:', issueId);
  };

  const handleEditSprint = (sprint: Sprint) => {
    setEditingSprint(sprint);
    setIsEditSprintModalVisible(true);
  };

  const handleDeleteSprint = async (sprintId: number) => {
    try {
      Modal.confirm({
        title: 'Delete Sprint',
        content: 'Are you sure you want to delete this sprint? All issues will be moved back to the backlog.',
        okText: 'Delete',
        okType: 'danger',
        cancelText: 'Cancel',
        onOk: async () => {
          await sprintsAPI.delete(sprintId);
          message.success('Sprint deleted successfully');
          sprintsQuery.refetch();
          issuesQuery.refetch();
        }
      });
    } catch (error) {
      console.error('Error deleting sprint:', error);
      message.error('Failed to delete sprint');
    }
  };

  return (
    <div>
      <ProjectNavigation />
      <DndProvider backend={HTML5Backend}>
        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={2}>Project Backlog</Title>
              <Text type="secondary">Manage your sprints and backlog items</Text>
            </div>
            <Space>
              <Button
                type="default"
                icon={<PlusOutlined />}
                onClick={() => setIsCreateIssueModalVisible(true)}
              >
                Create Task
              </Button>
              <Button
                type="default"
                icon={<PlusOutlined />}
                onClick={() => setIsCreateSprintModalVisible(true)}
              >
                Create Sprint
              </Button>
              <Button
                type="primary"
                onClick={() => navigate(`/projects/${projectId}/board`)}
              >
                Go to Board
              </Button>
              <Button
                onClick={() => sprintsQuery.refetch()}
              >
                Refresh
              </Button>
            </Space>
          </div>

        <Row gutter={[24, 24]}>
          <Col span={24}>
            {/* Active Sprints Section */}
            <div style={{ marginBottom: 16 }}>
              <Title level={4} style={{ marginBottom: 16, color: '#52c41a' }}>
                🟢 Active Sprints
              </Title>
              {Array.isArray(sprints) && sprints.filter(sprint => sprint.status === 'active').length > 0 ? (
                sprints
                  .filter(sprint => sprint.status === 'active')
                  .map(sprint => (
                    <SprintCard
                      key={sprint.id}
                      sprint={sprint}
                      issues={sprintIssuesMap[sprint.id] || []}
                      onStartSprint={handleStartSprint}
                      onCompleteSprint={handleCompleteSprint}
                      onEditSprint={handleEditSprint}
                      onDeleteSprint={handleDeleteSprint}
                      onViewIssue={handleViewIssue}
                      onEditIssue={handleEditIssue}
                      onDeleteIssue={handleDeleteIssue}
                    />
                  ))
              ) : (
                <Card style={{ marginBottom: 16, textAlign: 'center', padding: 20 }}>
                  <Text type="secondary">No active sprints. Start a sprint from the planning section below.</Text>
                </Card>
              )}
            </div>

            {/* Planning Sprints Section */}
            <div style={{ marginBottom: 16 }}>
              <Title level={4} style={{ marginBottom: 16, color: '#1890ff' }}>
                🔵 Planning Sprints
              </Title>
              {Array.isArray(sprints) ? sprints
                .filter(sprint => sprint.status === 'planned' || !sprint.status)
                .map(sprint => (
                  <SprintCard
                    key={sprint.id}
                    sprint={sprint}
                    issues={sprintIssuesMap[sprint.id] || []}
                    onStartSprint={handleStartSprint}
                    onCompleteSprint={handleCompleteSprint}
                    onEditSprint={handleEditSprint}
                    onDeleteSprint={handleDeleteSprint}
                    onViewIssue={handleViewIssue}
                    onEditIssue={handleEditIssue}
                    onDeleteIssue={handleDeleteIssue}
                  />
                )) : null}
            </div>

            {/* Backlog */}
            <BacklogCard
              issues={backlogIssues}
              onViewIssue={handleViewIssue}
              onEditIssue={handleEditIssue}
              onDeleteIssue={handleDeleteIssue}
            />
          </Col>
        </Row>

        <CreateSprintModal
          visible={isCreateSprintModalVisible}
          onCancel={() => setIsCreateSprintModalVisible(false)}
          onSprintCreated={handleCreateSprintSuccess}
          projectId={parseInt(projectId!)}
        />

        <EditSprintModal
          visible={isEditSprintModalVisible}
          onCancel={() => {
            setIsEditSprintModalVisible(false);
            setEditingSprint(null);
          }}
          sprint={editingSprint}
          projectId={parseInt(projectId!)}
        />

        <CreateIssueModal
          visible={isCreateIssueModalVisible}
          onCancel={() => setIsCreateIssueModalVisible(false)}
          projectId={parseInt(projectId!)}
        />

        <IssueDetailModal
          visible={viewingIssue !== null}
          issue={viewingIssue}
          onCancel={() => setViewingIssue(null)}
        />

        <EditIssueModal
          visible={isEditIssueModalVisible}
          onCancel={() => {
            setIsEditIssueModalVisible(false);
            setEditingIssue(null);
          }}
          issue={editingIssue}
          projectMembers={members}
          projectId={parseInt(projectId!)}
        />
        </div>
      </DndProvider>
    </div>
  );
};

export default Backlog;
