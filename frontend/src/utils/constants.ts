// Shared constants across the application

export const ISSUE_TYPES = [
  { value: 'task', label: 'Task', icon: '📋', emoji: '📋' },
  { value: 'story', label: 'Story', icon: '📖', emoji: '📖' },
  { value: 'bug', label: 'Bug', icon: '🐛', emoji: '🐛' },
  { value: 'epic', label: 'Epic', icon: '🚀', emoji: '🚀' },
] as const;

export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#52c41a', emoji: '🟢' },
  { value: 'medium', label: 'Medium', color: '#faad14', emoji: '🟡' },
  { value: 'high', label: 'High', color: '#ff7a45', emoji: '🟠' },
  { value: 'critical', label: 'Critical', color: '#ff4d4f', emoji: '🔴' },
] as const;

export const STORY_POINTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export const USER_ROLES = [
  { value: 'admin', label: 'Admin', icon: '👑', color: 'blue' },
  { value: 'developer', label: 'Developer', icon: '🧑‍💻', color: 'green' },
  { value: 'scrum_master', label: 'Scrum Master', icon: '📋', color: 'orange' },
] as const;

export const PROJECT_MEMBER_ROLES = [
  { value: 'owner', label: 'Owner', color: 'gold' },
  { value: 'admin', label: 'Admin', color: 'blue' },
  { value: 'member', label: 'Member', color: 'green' },
] as const;

// Story points to complexity mapping
export const COMPLEXITY_MAPPING: Record<number, number> = {
  1: 1,    // Very Low
  2: 2,    // Low
  3: 3,    // Low-Medium
  5: 5,    // Medium
  8: 7,    // Medium-High
  13: 8,   // High
  21: 9,   // Very High
  34: 10   // Extremely High
};

export const VALIDATION_RULES = {
  title: {
    required: { required: true, message: 'Please enter title' },
    minLength: (min: number) => ({ min, message: `Title must be at least ${min} characters` }),
    maxLength: (max: number) => ({ max, message: `Title must be less than ${max} characters` }),
  },
  description: {
    maxLength: (max: number) => ({ max, message: `Description must be less than ${max} characters` }),
  },
  username: {
    required: { required: true, message: 'Please enter username' },
    minLength: { min: 3, message: 'Username must be at least 3 characters' },
  },
  email: {
    required: { required: true, message: 'Please enter email' },
    email: { type: 'email' as const, message: 'Please enter a valid email' },
  },
  password: {
    required: { required: true, message: 'Please enter password' },
    minLength: { min: 6, message: 'Password must be at least 6 characters' },
  },
  fullName: {
    required: { required: true, message: 'Please enter full name' },
  },
  projectKey: {
    required: { required: true, message: 'Please enter project key' },
    length: { min: 2, max: 10, message: 'Project key must be 2-10 characters' },
    pattern: { pattern: /^[A-Z]+$/, message: 'Project key must contain only uppercase letters' },
  },
  sprintName: {
    required: { required: true, message: 'Please enter sprint name' },
    length: { min: 1, max: 100, message: 'Sprint name must be between 1-100 characters' },
  },
  sprintGoal: {
    maxLength: { max: 500, message: 'Sprint goal must be less than 500 characters' },
  },
  issueType: {
    required: { required: true, message: 'Please select issue type' },
  },
  priority: {
    required: { required: true, message: 'Please select priority' },
  },
  status: {
    required: { required: true, message: 'Please select status' },
  },
  role: {
    required: { required: true, message: 'Please select a role' },
  },
} as const;
