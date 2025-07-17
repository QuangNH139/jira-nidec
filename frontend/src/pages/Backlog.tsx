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
  Dropdown,
  Badge,
  Collapse
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
  EyeOutlined,
  ReloadOutlined,
  SyncOutlined,
  CalendarOutlined,
  TeamOutlined
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
const { Panel } = Collapse;

interface DragItem {
  type: string;
  id: number;
  source: 'backlog' | 'sprint' | 'completed-sprint';
}

const ItemTypes = {
  ISSUE: 'issue',
};

// Utility function to convert story points to 0-10 scale
const getComplexityPoints = (storyPoints: number | undefined): number => {
  if (!storyPoints || storyPoints === 0) return 0;
  
  // Convert Fibonacci-like story points to 0-10 scale
  const pointMapping: Record<number, number> = {
    1: 1,    // Very Low
    2: 2,    // Low
    3: 3,    // Low-Medium
    5: 5,    // Medium
    8: 7,    // Medium-High
    13: 8,   // High
    21: 9,   // Very High
    34: 10   // Extremely High
  };
  
  return pointMapping[storyPoints] || Math.min(Math.round(storyPoints / 3.4), 10);
};

// Get complexity color based on 0-10 scale
const getComplexityColor = (points: number): string => {
  if (points === 0) return '#d9d9d9';
  if (points <= 2) return '#52c41a';    // Green (Easy)
  if (points <= 4) return '#faad14';    // Yellow (Medium-Low)
  if (points <= 6) return '#fa8c16';    // Orange (Medium)
  if (points <= 8) return '#f50';       // Red-Orange (Hard)
  return '#ff4d4f';                     // Red (Very Hard)
};

// Get complexity label
const getComplexityLabel = (points: number): string => {
  if (points === 0) return 'Not Estimated';
  if (points <= 2) return 'Easy';
  if (points <= 4) return 'Medium-Low';
  if (points <= 6) return 'Medium';
  if (points <= 8) return 'Hard';
  return 'Very Hard';
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
                <Tooltip title={`Complexity: ${getComplexityLabel(getComplexityPoints(issue.story_points))} (${getComplexityPoints(issue.story_points)}/10)`}>
                  <Tag 
                    color={getComplexityColor(getComplexityPoints(issue.story_points))} 
                    style={{ fontSize: 10, marginBottom: 0, fontWeight: 'bold' }}
                  >
                    {getComplexityPoints(issue.story_points)}/10
                  </Tag>
                </Tooltip>
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

const DraggableCompletedIssue: React.FC<{
  issue: Issue;
  onViewIssue: (issue: Issue) => void;
}> = ({ issue, onViewIssue }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.ISSUE,
    item: { type: ItemTypes.ISSUE, id: issue.id, source: 'completed-sprint' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        display: 'flex',
        alignItems: 'center'
      }}
      onClick={(e) => {
        e.stopPropagation();
        onViewIssue(issue);
      }}
    >
      <DragOutlined style={{ color: '#8c8c8c', fontSize: 10, marginRight: 6 }} />
      <Tag
        color={issue.status_category === 'done' ? 'green' : issue.status_category === 'inprogress' ? 'blue' : 'default'}
        style={{ marginRight: 8 }}
      >
        {issue.status_name?.toUpperCase() || 'UNKNOWN'}
      </Tag>
      <Text>{issue.title}</Text>
      {issue.story_points && (
        <Tooltip title={`Complexity: ${getComplexityLabel(getComplexityPoints(issue.story_points))} (${getComplexityPoints(issue.story_points)}/10)`}>
          <Tag 
            color={getComplexityColor(getComplexityPoints(issue.story_points))} 
            style={{ marginLeft: 8, fontSize: 10, fontWeight: 'bold' }}
          >
            {getComplexityPoints(issue.story_points)}/10
          </Tag>
        </Tooltip>
      )}
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
  isActive?: boolean;
}> = ({ 
  sprint, 
  issues, 
  onStartSprint, 
  onCompleteSprint, 
  onEditSprint, 
  onDeleteSprint, 
  onViewIssue, 
  onEditIssue, 
  onDeleteIssue,
  isActive = false
}) => {
  const queryClient = useQueryClient();
  
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.ISSUE,
    drop: (item: DragItem) => {
      if (item.source !== 'sprint' && sprint.status !== 'completed') {
        // Move issue to sprint (only if sprint is not completed)
        if (item.source === 'completed-sprint') {
          // Confirm before moving from completed sprint
          Modal.confirm({
            title: 'Move Issue to Sprint',
            content: 'Are you sure you want to move this issue from completed sprint to this sprint?',
            onOk: () => {
              moveIssueToSprint(item.id, sprint.id);
            }
          });
        } else {
          moveIssueToSprint(item.id, sprint.id);
        }
      }
    },
    canDrop: (item: DragItem) => {
      return item.source !== 'sprint' && sprint.status !== 'completed';
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const moveIssueToSprint = async (issueId: number, sprintId: number) => {
    try {
      await issuesAPI.update(issueId, { sprint_id: sprintId });
      // Invalidate all related queries for better synchronization
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['backlog'] }),
        queryClient.invalidateQueries({ queryKey: ['sprints'] }),
        queryClient.invalidateQueries({ queryKey: ['issues'] }),
        queryClient.invalidateQueries({ queryKey: ['active-sprint'] })
      ]);
      message.success('Issue moved to sprint successfully');
    } catch (error) {
      console.error('Failed to move issue:', error);
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
  const totalComplexityPoints = issues.reduce((sum, issue) => sum + getComplexityPoints(issue.story_points), 0);
  const completedIssues = issues.filter(issue => issue.status_category === 'done');
  const completionRate = issues.length > 0 ? Math.round((completedIssues.length / issues.length) * 100) : 0;

  const getSprintStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#52c41a';
      case 'completed': return '#1890ff';
      case 'planned': 
      default: return '#faad14';
    }
  };

  const getDropZoneStyle = () => {
    let backgroundColor = 'transparent';
    let border = '2px dashed transparent';
    
    if (isOver && canDrop) {
      backgroundColor = isActive ? '#e6f7ff' : '#f6ffed';
      border = isActive ? '2px dashed #1890ff' : '2px dashed #52c41a';
    } else if (isOver && !canDrop) {
      backgroundColor = '#fff2e8';
      border = '2px dashed #faad14';
    }
    
    return {
      backgroundColor,
      border,
      borderRadius: 6,
      transition: 'all 0.3s ease',
      minHeight: 120
    };
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: getSprintStatusColor(sprint.status || 'planned') 
            }} />
            <Text strong style={{ fontSize: 16 }}>{sprint.name}</Text>
            <Tag 
              color={getSprintStatusColor(sprint.status || 'planned')} 
              style={{ fontWeight: 'bold' }}
            >
              {sprint.status?.toUpperCase() || 'PLANNED'}
            </Tag>
            {sprint.status === 'completed' && completionRate > 0 && (
              <Tag color="green">{completionRate}% COMPLETED</Tag>
            )}
          </div>
          <Space>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                <TeamOutlined /> {issues.length} issues • {totalComplexityPoints}/10 complexity
              </div>
              <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                Original: {totalStoryPoints} story points
              </div>
              {sprint.start_date && (
                <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                  <CalendarOutlined /> {new Date(sprint.start_date).toLocaleDateString()}
                </div>
              )}
            </div>
            {sprint.status === 'planned' && (
              <Button
                type="primary"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => onStartSprint(sprint.id)}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
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
                style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16' }}
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
      style={{ 
        marginBottom: 16,
        border: isActive ? '2px solid #52c41a' : undefined,
        boxShadow: isActive ? '0 4px 12px rgba(82, 196, 26, 0.15)' : undefined
      }}
      headStyle={{ 
        backgroundColor: isActive ? '#f6ffed' : sprint.status === 'completed' ? '#f0f5ff' : '#fafafa',
        borderRadius: '6px 6px 0 0'
      }}
    >
      <div
        ref={drop}
        style={getDropZoneStyle()}
      >
        {sprint.goal && (
          <div style={{ 
            marginBottom: 16, 
            padding: 12, 
            backgroundColor: '#f9f9f9', 
            borderRadius: 6,
            borderLeft: '4px solid #1890ff'
          }}>
            <Text type="secondary" italic style={{ fontSize: 13 }}>
              <strong>Sprint Goal:</strong> {sprint.goal}
            </Text>
          </div>
        )}
        
        {issues.length > 0 ? (
          <div style={{ padding: 8 }}>
            {issues.map(issue => (
              <IssueItem
                key={issue.id}
                issue={issue}
                onView={onViewIssue}
                onEdit={onEditIssue}
                onDelete={onDeleteIssue}
              />
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: 40,
            backgroundColor: isOver && canDrop ? '#f6ffed' : '#fafafa',
            borderRadius: 6,
            border: '2px dashed #d9d9d9'
          }}>
            {isOver && canDrop ? (
              <div>
                <SyncOutlined style={{ fontSize: 24, color: '#52c41a', marginBottom: 8 }} />
                <div>
                  <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>
                    Drop here to add to sprint
                  </Text>
                </div>
              </div>
            ) : (
              <div>
                <Text type="secondary">
                  {sprint.status === 'completed' 
                    ? 'Sprint completed - no issues can be added'
                    : 'Drag issues here to add them to the sprint'
                  }
                </Text>
              </div>
            )}
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
  
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.ISSUE,
    drop: (item: DragItem) => {
      if (item.source !== 'backlog') {
        // Move issue back to backlog
        if (item.source === 'completed-sprint') {
          // Confirm before moving from completed sprint
          Modal.confirm({
            title: 'Move Issue to Backlog',
            content: 'Are you sure you want to move this issue from completed sprint back to backlog?',
            onOk: () => moveIssueToBacklog(item.id)
          });
        } else {
          moveIssueToBacklog(item.id);
        }
      }
    },
    canDrop: (item: DragItem) => {
      return item.source !== 'backlog';
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const moveIssueToBacklog = async (issueId: number) => {
    try {
      await issuesAPI.update(issueId, { sprint_id: null });
      // Invalidate all related queries for better synchronization
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['backlog'] }),
        queryClient.invalidateQueries({ queryKey: ['sprints'] }),
        queryClient.invalidateQueries({ queryKey: ['issues'] }),
        queryClient.invalidateQueries({ queryKey: ['active-sprint'] })
      ]);
      message.success('Issue moved to backlog successfully');
    } catch (error) {
      console.error('Failed to move issue:', error);
      message.error('Failed to move issue');
    }
  };

  const totalComplexityPoints = issues.reduce((sum, issue) => sum + getComplexityPoints(issue.story_points), 0);

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: '#722ed1' 
            }} />
            <Text strong style={{ fontSize: 16 }}>Product Backlog</Text>
            <Tag color="purple" style={{ fontWeight: 'bold' }}>
              READY
            </Tag>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
              <TeamOutlined /> {issues.length} issues • {totalComplexityPoints}/10 complexity
            </div>
            <div style={{ fontSize: 11, color: '#8c8c8c' }}>
              Ready for planning
            </div>
          </div>
        </div>
      }
      style={{ 
        marginBottom: 16,
        border: '2px solid #f0f0f0'
      }}
      headStyle={{ 
        backgroundColor: '#fafafa',
        borderRadius: '6px 6px 0 0'
      }}
    >
      <div
        ref={drop}
        style={{
          minHeight: 200,
          backgroundColor: isOver && canDrop ? '#f9f0ff' : 'transparent',
          border: isOver && canDrop ? '2px dashed #722ed1' : '2px dashed transparent',
          borderRadius: 6,
          padding: 12,
          transition: 'all 0.3s ease'
        }}
      >
        {issues.length > 0 ? (
          <div>
            <div style={{ marginBottom: 12, fontSize: 12, color: '#8c8c8c' }}>
              <Text type="secondary">
                Drag issues to sprints to start planning • Priority order maintained
              </Text>
            </div>
            {issues.map(issue => (
              <IssueItem
                key={issue.id}
                issue={issue}
                onView={onViewIssue}
                onEdit={onEditIssue}
                onDelete={onDeleteIssue}
              />
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: 60,
            backgroundColor: isOver && canDrop ? '#f9f0ff' : '#fafafa',
            borderRadius: 6,
            border: '2px dashed #d9d9d9'
          }}>
            {isOver && canDrop ? (
              <div>
                <SyncOutlined style={{ fontSize: 24, color: '#722ed1', marginBottom: 8 }} />
                <div>
                  <Text style={{ color: '#722ed1', fontWeight: 'bold' }}>
                    Drop here to move back to backlog
                  </Text>
                </div>
              </div>
            ) : (
              <Empty
                description="No issues in backlog"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh functionality
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        sprintsQuery.refetch(),
        issuesQuery.refetch(),
        membersQuery.refetch()
      ]);
      message.success('Data refreshed successfully');
    } catch (error) {
      message.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

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
    const uncompletedIssues = sprintIssuesMap[sprintId]?.filter(issue => 
      issue.status_category !== 'done'
    ) || [];

    if (uncompletedIssues.length > 0) {
      Modal.confirm({
        title: 'Complete Sprint',
        content: (
          <div>
            <p>This sprint has {uncompletedIssues.length} incomplete issue(s):</p>
            <ul style={{ marginTop: 8, marginBottom: 16 }}>
              {uncompletedIssues.slice(0, 5).map(issue => (
                <li key={issue.id}>{issue.title}</li>
              ))}
              {uncompletedIssues.length > 5 && <li>... and {uncompletedIssues.length - 5} more</li>}
            </ul>
            <p>These issues will be moved back to the backlog. Are you sure you want to complete this sprint?</p>
          </div>
        ),
        onOk: () => completeSprintMutation.mutate(sprintId),
        okText: 'Complete Sprint',
        cancelText: 'Cancel'
      });
    } else {
      Modal.confirm({
        title: 'Complete Sprint',
        content: 'Are you sure you want to complete this sprint? This action cannot be undone.',
        onOk: () => completeSprintMutation.mutate(sprintId)
      });
    }
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
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <ProjectNavigation />
      <DndProvider backend={HTML5Backend}>
        <div style={{ padding: 24 }}>
          <div style={{ 
            marginBottom: 24, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            backgroundColor: 'white',
            padding: 20,
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div>
              <Title level={2} style={{ margin: 0, marginBottom: 4 }}>Project Backlog</Title>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                <Text type="secondary">
                  Manage your sprints and backlog items • Drag & drop to organize
                </Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tooltip 
                    title={
                      <div>
                        <div><strong>New Complexity Scale (0-10):</strong></div>
                        <div>• 0: Not estimated</div>
                        <div>• 1-2: Easy tasks (1-3 story points)</div>
                        <div>• 3-4: Medium-low complexity (5 story points)</div>
                        <div>• 5-6: Medium complexity (8 story points)</div>
                        <div>• 7-8: High complexity (13 story points)</div>
                        <div>• 9-10: Very high complexity (21+ story points)</div>
                      </div>
                    }
                    placement="bottom"
                  >
                    <Text type="secondary" style={{ fontSize: 12, cursor: 'help', textDecoration: 'underline' }}>
                      Complexity Scale:
                    </Text>
                  </Tooltip>
                  <Tag color="#52c41a" style={{ fontSize: 10 }}>0-2 Easy</Tag>
                  <Tag color="#faad14" style={{ fontSize: 10 }}>3-4 Medium</Tag>
                  <Tag color="#fa8c16" style={{ fontSize: 10 }}>5-6 Hard</Tag>
                  <Tag color="#f50" style={{ fontSize: 10 }}>7-8 Very Hard</Tag>
                  <Tag color="#ff4d4f" style={{ fontSize: 10 }}>9-10 Extreme</Tag>
                </div>
              </div>
            </div>
            <Space size="middle">
              <Button
                type="text"
                icon={<ReloadOutlined spin={isRefreshing} />}
                onClick={handleRefreshAll}
                disabled={isRefreshing}
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button
                type="default"
                icon={<PlusOutlined />}
                onClick={() => setIsCreateIssueModalVisible(true)}
              >
                Create Issue
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
            </Space>
          </div>

        <Row gutter={[24, 24]}>
          <Col span={24}>
            {/* Active Sprints Section */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 16,
                padding: '12px 16px',
                backgroundColor: 'white',
                borderRadius: 6,
                border: '2px solid #52c41a'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    backgroundColor: '#52c41a' 
                  }} />
                  <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
                    Active Sprints
                  </Title>
                  <Badge 
                    count={sprints.filter(sprint => sprint.status === 'active').length} 
                    style={{ backgroundColor: '#52c41a' }}
                  />
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Currently running sprints
                </Text>
              </div>
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
                      isActive={true}
                    />
                  ))
              ) : (
                <Card style={{ 
                  marginBottom: 16, 
                  textAlign: 'center',
                  backgroundColor: '#f6ffed',
                  border: '2px dashed #52c41a',
                  borderRadius: 8
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 20 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: '#f6ffed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #52c41a'
                    }}>
                      <PlayCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                    </div>
                    
                    <div>
                      <Title level={5} style={{ margin: 0, marginBottom: 4, color: '#52c41a' }}>
                        No Active Sprints
                      </Title>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        Start a sprint from the planning section below to begin active development.
                      </Text>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Planning Sprints Section */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 16,
                padding: '12px 16px',
                backgroundColor: 'white',
                borderRadius: 6,
                border: '2px solid #1890ff'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    backgroundColor: '#1890ff' 
                  }} />
                  <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                    Planning Sprints
                  </Title>
                  <Badge 
                    count={sprints.filter(sprint => sprint.status === 'planned' || !sprint.status).length} 
                    style={{ backgroundColor: '#1890ff' }}
                  />
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Ready to start planning
                </Text>
              </div>
{Array.isArray(sprints) && sprints.filter(sprint => sprint.status === 'planned' || !sprint.status).length > 0 ? (
                sprints
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
                  ))
              ) : (
                <Card 
                  style={{ 
                    marginBottom: 16, 
                    textAlign: 'center',
                    backgroundColor: '#f0f5ff',
                    border: '2px dashed #1890ff',
                    borderRadius: 8
                  }}
                  bodyStyle={{ padding: 40 }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      backgroundColor: '#e6f7ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8
                    }}>
                      <CalendarOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                    </div>
                    
                    <div>
                      <Title level={4} style={{ margin: 0, marginBottom: 8, color: '#1890ff' }}>
                        No Planning Sprints
                      </Title>
                      <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 16 }}>
                        Create your first sprint to start planning your work.
                        <br />
                        Sprints help organize your backlog into manageable iterations.
                      </Text>
                    </div>

                    <div style={{ 
                      padding: 16, 
                      backgroundColor: '#ffffff', 
                      borderRadius: 6,
                      border: '1px solid #d9d9d9',
                      width: '100%',
                      maxWidth: 400
                    }}>
                      <Text strong style={{ display: 'block', marginBottom: 8, color: '#1890ff' }}>
                        💡 Quick Start Guide:
                      </Text>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ marginBottom: 6 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            1. Click "Create Sprint" to create a new sprint
                          </Text>
                        </div>
                        <div style={{ marginBottom: 6 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            2. Drag issues from backlog to your sprint
                          </Text>
                        </div>
                        <div style={{ marginBottom: 6 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            3. Set sprint goals and duration
                          </Text>
                        </div>
                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            4. Start sprint when ready to begin work
                          </Text>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="primary"
                      size="large"
                      icon={<PlusOutlined />}
                      onClick={() => setIsCreateSprintModalVisible(true)}
                      style={{ 
                        backgroundColor: '#1890ff',
                        borderColor: '#1890ff',
                        height: 48,
                        paddingLeft: 24,
                        paddingRight: 24
                      }}
                    >
                      Create Your First Sprint
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {/* Backlog Section */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 16,
                padding: '12px 16px',
                backgroundColor: 'white',
                borderRadius: 6,
                border: '2px solid #722ed1'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    backgroundColor: '#722ed1' 
                  }} />
                  <Title level={4} style={{ margin: 0, color: '#722ed1' }}>
                    Product Backlog
                  </Title>
                  <Badge 
                    count={backlogIssues.length} 
                    style={{ backgroundColor: '#722ed1' }}
                  />
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Issues ready for sprint planning
                </Text>
              </div>
              <BacklogCard
                issues={backlogIssues}
                onViewIssue={handleViewIssue}
                onEditIssue={handleEditIssue}
                onDeleteIssue={handleDeleteIssue}
              />
            </div>

            {/* Completed Sprints Section */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 16,
                padding: '12px 16px',
                backgroundColor: 'white',
                borderRadius: 6,
                border: '2px solid #52c41a'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    backgroundColor: '#52c41a' 
                  }} />
                  <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
                    Completed Sprints
                  </Title>
                  <Badge 
                    count={sprints.filter(sprint => sprint.status === 'completed').length} 
                    style={{ backgroundColor: '#52c41a' }}
                  />
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Sprint history and retrospectives
                </Text>
              </div>
              <Collapse
                defaultActiveKey={[]}
                style={{ backgroundColor: 'white' }}
              >
                {Array.isArray(sprints) && sprints.filter(sprint => sprint.status === 'completed').length > 0 ? (
                  sprints
                    .filter(sprint => sprint.status === 'completed')
                    .sort((a, b) => new Date(b.end_date || '').getTime() - new Date(a.end_date || '').getTime())
                    .map(sprint => {
                      const sprintIssues = sprintIssuesMap[sprint.id] || [];
                      const completedCount = sprintIssues.filter(issue => issue.status_category === 'done').length;
                      const completionRate = sprintIssues.length > 0 ? Math.round((completedCount / sprintIssues.length) * 100) : 0;
                      const totalStoryPoints = sprintIssues.reduce((sum, issue) => sum + (issue.story_points || 0), 0);
                      const totalComplexityPoints = sprintIssues.reduce((sum, issue) => sum + getComplexityPoints(issue.story_points), 0);
                      
                      return (
                        <Panel
                          key={sprint.id}
                          header={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Text strong>{sprint.name}</Text>
                                <Tag color="green">COMPLETED</Tag>
                                {sprint.end_date && (
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    {new Date(sprint.end_date).toLocaleDateString()}
                                  </Text>
                                )}
                              </div>
                              <Space>
                                <Tag color="blue">{sprintIssues.length} issues</Tag>
                                <Tag color="orange">{totalComplexityPoints}/10 complexity</Tag>
                                <Tag color="geekblue">{totalStoryPoints} story pts</Tag>
                                {completionRate > 0 && (
                                  <Tag color="green">{completionRate}% Done</Tag>
                                )}
                              </Space>
                            </div>
                          }
                          extra={
                            <Dropdown
                              menu={{
                                items: [
                                  {
                                    key: 'delete-sprint',
                                    icon: <DeleteOutlined />,
                                    label: 'Delete Sprint',
                                    onClick: () => {
                                      handleDeleteSprint(sprint.id);
                                    },
                                    danger: true
                                  }
                                ]
                              }}
                              trigger={['click']}
                              placement="bottomRight"
                            >
                              <Button 
                                type="text" 
                                icon={<MoreOutlined />} 
                                size="small"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </Dropdown>
                          }
                        >
                          {sprint.goal && (
                            <div style={{ 
                              marginBottom: 16, 
                              padding: 12, 
                              backgroundColor: '#f0f5ff', 
                              borderRadius: 6,
                              borderLeft: '4px solid #1890ff'
                            }}>
                              <Text type="secondary" italic style={{ fontSize: 13 }}>
                                <strong>Sprint Goal:</strong> {sprint.goal}
                              </Text>
                            </div>
                          )}
                          
                          <div style={{ padding: 8, backgroundColor: '#f9f9f9', borderRadius: 4 }}>
                            {sprintIssues.length > 0 ? (
                              <div>
                                <Text strong style={{ marginBottom: 8, display: 'block' }}>
                                  Sprint Issues: (Drag to move to Backlog or other Sprints)
                                </Text>
                                {sprintIssues.map(issue => (
                                  <div 
                                    key={issue.id} 
                                    style={{ 
                                      marginBottom: 4, 
                                      cursor: 'pointer',
                                      padding: '4px 8px',
                                      borderRadius: 4,
                                      transition: 'all 0.2s',
                                      backgroundColor: 'white'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#f0f0f0';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'white';
                                    }}
                                  >
                                    <DraggableCompletedIssue 
                                      issue={issue}
                                      onViewIssue={handleViewIssue}
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <Text type="secondary">No issues in this sprint</Text>
                            )}
                          </div>
                          
                          {sprint.start_date && sprint.end_date && (
                            <div style={{ 
                              marginTop: 16, 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              padding: 12,
                              backgroundColor: '#f6ffed',
                              borderRadius: 6
                            }}>
                              <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  <CalendarOutlined /> Started: {new Date(sprint.start_date).toLocaleDateString()}
                                </Text>
                              </div>
                              <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  Duration: {Math.ceil((new Date(sprint.end_date).getTime() - new Date(sprint.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                                </Text>
                              </div>
                            </div>
                          )}
                        </Panel>
                      );
                    })
                ) : (
                  <Panel key="empty" header="No completed sprints" disabled>
                    <Text type="secondary">No completed sprints yet.</Text>
                  </Panel>
                )}
              </Collapse>
            </div>
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
