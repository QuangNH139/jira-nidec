import React from 'react';
import { Select } from 'antd';
import { ISSUE_TYPES, PRIORITY_OPTIONS, STORY_POINTS, USER_ROLES, PROJECT_MEMBER_ROLES } from '../../utils/constants';

const { Option } = Select;

interface BaseSelectProps {
  placeholder?: string;
  allowClear?: boolean;
  value?: any;
  onChange?: (value: any) => void;
  style?: React.CSSProperties;
}

// Issue Type Select Component
export const IssueTypeSelect: React.FC<BaseSelectProps> = (props) => {
  return (
    <Select {...props}>
      {ISSUE_TYPES.map(type => (
        <Option key={type.value} value={type.value}>
          {type.emoji} {type.label}
        </Option>
      ))}
    </Select>
  );
};

// Priority Select Component  
export const PrioritySelect: React.FC<BaseSelectProps> = (props) => {
  return (
    <Select {...props}>
      {PRIORITY_OPTIONS.map(priority => (
        <Option key={priority.value} value={priority.value}>
          {priority.emoji} {priority.label}
        </Option>
      ))}
    </Select>
  );
};

// Story Points Select Component
export const StoryPointsSelect: React.FC<BaseSelectProps> = (props) => {
  return (
    <Select {...props}>
      {STORY_POINTS.map(point => (
        <Option key={point} value={point}>
          {point} points
        </Option>
      ))}
    </Select>
  );
};

// User Role Select Component
export const UserRoleSelect: React.FC<BaseSelectProps> = (props) => {
  return (
    <Select {...props}>
      {USER_ROLES.map(role => (
        <Option key={role.value} value={role.value}>
          {role.icon} {role.label}
        </Option>
      ))}
    </Select>
  );
};

// Project Member Role Select Component
export const ProjectMemberRoleSelect: React.FC<BaseSelectProps> = (props) => {
  return (
    <Select {...props}>
      {PROJECT_MEMBER_ROLES.map(role => (
        <Option key={role.value} value={role.value}>
          {role.label}
        </Option>
      ))}
    </Select>
  );
};

// Members Select Component
interface MembersSelectProps extends BaseSelectProps {
  members: Array<{
    id: number;
    username?: string;
    full_name?: string;
    email?: string;
  }>;
  showEmail?: boolean;
}

export const MembersSelect: React.FC<MembersSelectProps> = ({ 
  members, 
  showEmail = false, 
  ...props 
}) => {
  return (
    <Select {...props}>
      {members.map(member => (
        <Option key={member.id} value={member.id}>
          {member.full_name || member.username}
          {showEmail && member.email && ` (${member.email})`}
        </Option>
      ))}
    </Select>
  );
};

// Statuses Select Component
interface StatusesSelectProps extends BaseSelectProps {
  statuses: Array<{
    id: number;
    name: string;
  }>;
}

export const StatusesSelect: React.FC<StatusesSelectProps> = ({ 
  statuses, 
  ...props 
}) => {
  return (
    <Select {...props}>
      {statuses.map(status => (
        <Option key={status.id} value={status.id}>
          {status.name}
        </Option>
      ))}
    </Select>
  );
};
