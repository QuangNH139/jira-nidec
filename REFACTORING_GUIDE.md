# Jira Project - Code Refactoring Guide

## Overview

This document outlines the refactoring efforts to consolidate duplicate logic patterns across the Jira project and provides guidelines for using the shared utilities.

## Refactored Components

### 1. Shared Constants (`utils/constants.ts`)

Centralized all application constants including:
- Issue types with icons and labels
- Priority options with colors and emojis  
- Story points array
- User roles configurations
- Project member roles
- Validation rules
- Complexity mapping for story points

### 2. Helper Utilities (`utils/helpers.ts`)

Common utility functions for:
- Issue type configuration and color mapping
- Priority color and configuration helpers
- Story points to complexity conversion
- Status color mapping  
- Role utilities
- Statistics calculations
- Date formatting
- Text truncation

### 3. Form Helpers (`utils/formHelpers.ts`)

Standardized form utilities:
- Common validation rule generators
- Form field configurations
- Reusable form patterns

### 4. Query Management (`hooks/useQueryInvalidation.ts`)

Centralized query invalidation patterns:
- Query key factories
- Standardized invalidation functions
- Combined invalidation for common operations

### 5. Image Upload Hook (`hooks/useImageUpload.ts`)

Reusable image upload logic:
- File upload handling
- Error management
- Loading states
- Success/error callbacks

### 6. Shared UI Components

#### FormSelects (`components/shared/FormSelects.tsx`)
- `IssueTypeSelect` - Issue type dropdown with icons
- `PrioritySelect` - Priority dropdown with colors  
- `StoryPointsSelect` - Story points dropdown
- `UserRoleSelect` - User roles dropdown
- `ProjectMemberRoleSelect` - Project member roles dropdown
- `MembersSelect` - Project members dropdown
- `StatusesSelect` - Issue statuses dropdown

#### ImageUpload (`components/shared/ImageUpload.tsx`)
- Reusable image upload component
- Preview and delete functionality
- Consistent styling and behavior

#### ModalFooter (`components/shared/ModalFooter.tsx`)
- `ModalFooter` - Standard modal footer with cancel/submit buttons
- `FormModalFooter` - Form-specific footer with htmlType support

## Usage Examples

### Using Shared Constants

```typescript
import { ISSUE_TYPES, PRIORITY_OPTIONS, STORY_POINTS } from '../utils/constants';

// Access issue types
const taskType = ISSUE_TYPES.find(type => type.value === 'task');

// Use validation rules
import { VALIDATION_RULES } from '../utils/constants';
const titleRules = [
  VALIDATION_RULES.title.required,
  VALIDATION_RULES.title.minLength(3)
];
```

### Using Helper Functions

```typescript
import { getPriorityColor, getComplexityPoints, calculateProjectStats } from '../utils/helpers';

// Get priority color for styling
const color = getPriorityColor('high'); // Returns '#ff7a45'

// Convert story points to complexity
const complexity = getComplexityPoints(8); // Returns 7

// Calculate project statistics
const stats = calculateProjectStats(issues);
```

### Using Shared Form Components

```typescript
import { IssueTypeSelect, PrioritySelect, MembersSelect } from './shared/FormSelects';

// In your form
<Form.Item name="type" label="Type">
  <IssueTypeSelect placeholder="Select issue type" />
</Form.Item>

<Form.Item name="priority" label="Priority">
  <PrioritySelect placeholder="Select priority" />
</Form.Item>

<Form.Item name="assignee_id" label="Assignee">
  <MembersSelect 
    members={projectMembers}
    placeholder="Select assignee"
    allowClear
    showEmail
  />
</Form.Item>
```

### Using Query Invalidation

```typescript
import { useQueryInvalidation } from '../hooks/useQueryInvalidation';

const MyComponent = () => {
  const { invalidateIssueOperations, invalidateProjectData } = useQueryInvalidation();
  
  const updateMutation = useMutation({
    mutationFn: updateIssue,
    onSuccess: () => {
      // Invalidate all issue-related queries for the project
      invalidateIssueOperations(projectId, issueId);
    }
  });
};
```

### Using Image Upload

```typescript
import { ImageUpload } from './shared/ImageUpload';

const [beforeImage, setBeforeImage] = useState<string | null>(null);

<ImageUpload
  value={beforeImage}
  onChange={setBeforeImage}
  type="before"
  label="Upload Before Image"
  width={200}
  height={150}
/>
```

### Using Form Helpers

```typescript
import { getFieldConfig, createValidationRules } from '../utils/formHelpers';

// Get predefined field configuration
const titleConfig = getFieldConfig('issueTitle');

// Use in form
<Form.Item {...titleConfig}>
  <Input placeholder={titleConfig.placeholder} />
</Form.Item>

// Create custom validation rules
const customRules = createValidationRules.title(true, 5, 100);
```

## Refactored Components

### Before Refactoring (Example)
```typescript
// Duplicated across multiple files
const [form] = Form.useForm();
const queryClient = useQueryClient();

const mutation = useMutation({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
    queryClient.invalidateQueries({ queryKey: ['backlog', projectId] });
    queryClient.invalidateQueries({ queryKey: ['kanban', projectId] });
    // ... more invalidations
  }
});

// Hardcoded options
<Select>
  <Option value="low">Low</Option>
  <Option value="medium">Medium</Option>
  <Option value="high">High</Option>
  <Option value="critical">Critical</Option>
</Select>
```

### After Refactoring
```typescript
import { useQueryInvalidation } from '../hooks/useQueryInvalidation';
import { PrioritySelect } from './shared/FormSelects';

const { invalidateIssueOperations } = useQueryInvalidation();

const mutation = useMutation({
  onSuccess: () => {
    invalidateIssueOperations(projectId, issueId);
  }
});

<PrioritySelect placeholder="Select priority" />
```

## Benefits of Refactoring

1. **Reduced Code Duplication**: Eliminated repeated patterns across 15+ files
2. **Consistent Behavior**: All modals now use the same validation rules and options
3. **Easier Maintenance**: Changes to constants or patterns only need to be made in one place
4. **Better Type Safety**: Centralized types and interfaces
5. **Improved Reusability**: Shared components can be used across the application
6. **Standardized Patterns**: Consistent query invalidation and form handling

## Migration Guide

To migrate existing components to use the shared utilities:

1. **Replace hardcoded options** with shared select components
2. **Use shared validation rules** from constants
3. **Replace query invalidation** with hooks from `useQueryInvalidation`
4. **Use shared form configurations** from `formHelpers`
5. **Replace custom image upload** with `ImageUpload` component
6. **Use shared modal footers** instead of custom ones

## File Structure

```
src/
├── utils/
│   ├── constants.ts          # Shared constants
│   ├── helpers.ts            # Utility functions  
│   └── formHelpers.ts        # Form utilities
├── hooks/
│   ├── useQueryInvalidation.ts # Query management
│   └── useImageUpload.ts       # Image upload logic
└── components/
    └── shared/
        ├── FormSelects.tsx   # Reusable select components
        ├── ImageUpload.tsx   # Image upload component
        └── ModalFooter.tsx   # Modal footer components
```

## Next Steps

1. Continue migrating remaining modals to use shared utilities
2. Add unit tests for shared utilities
3. Consider creating more shared components (e.g., IssueCard, SprintCard)
4. Document component APIs for better developer experience
5. Add error boundaries for shared components
