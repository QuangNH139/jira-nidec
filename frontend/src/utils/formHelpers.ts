import { Form } from 'antd';
import { VALIDATION_RULES } from './constants';

// Common form utilities
export const useFormHelpers = () => {
  const [form] = Form.useForm();

  const resetForm = () => {
    form.resetFields();
  };

  const setFormValues = (values: any) => {
    form.setFieldsValue(values);
  };

  const validateFields = async () => {
    try {
      const values = await form.validateFields();
      return { success: true, values };
    } catch (error) {
      return { success: false, error };
    }
  };

  return {
    form,
    resetForm,
    setFormValues,
    validateFields,
  };
};

// Common validation rule generators
export const createValidationRules = {
  title: (required = true, minLength = 1, maxLength = 200) => {
    const rules = [];
    if (required) rules.push(VALIDATION_RULES.title.required);
    if (minLength > 1) rules.push(VALIDATION_RULES.title.minLength(minLength));
    if (maxLength < 200) rules.push(VALIDATION_RULES.title.maxLength(maxLength));
    return rules;
  },

  description: (maxLength = 1000) => {
    return [VALIDATION_RULES.description.maxLength(maxLength)];
  },

  username: () => {
    return [
      VALIDATION_RULES.username.required,
      VALIDATION_RULES.username.minLength,
    ];
  },

  email: () => {
    return [
      VALIDATION_RULES.email.required,
      VALIDATION_RULES.email.email,
    ];
  },

  password: () => {
    return [
      VALIDATION_RULES.password.required,
      VALIDATION_RULES.password.minLength,
    ];
  },

  projectKey: () => {
    return [
      VALIDATION_RULES.projectKey.required,
      VALIDATION_RULES.projectKey.length,
      VALIDATION_RULES.projectKey.pattern,
    ];
  },

  sprintName: () => {
    return [
      VALIDATION_RULES.sprintName.required,
      VALIDATION_RULES.sprintName.length,
    ];
  },

  required: (fieldName: string) => {
    return [{ required: true, message: `Please select ${fieldName}` }];
  },
};

// Form field configurations
export const getFieldConfig = (type: string) => {
  switch (type) {
    case 'issueTitle':
      return {
        name: 'title',
        label: 'Title',
        rules: createValidationRules.title(),
        placeholder: 'Enter issue title',
      };

    case 'taskTitle':
      return {
        name: 'title',
        label: 'Task Title',
        rules: createValidationRules.title(true, 3),
        placeholder: 'Enter task title',
      };

    case 'description':
      return {
        name: 'description',
        label: 'Description',
        rules: createValidationRules.description(),
        placeholder: 'Enter description (optional)',
      };

    case 'issueType':
      return {
        name: 'type',
        label: 'Issue Type',
        rules: createValidationRules.required('issue type'),
        placeholder: 'Select issue type',
      };

    case 'priority':
      return {
        name: 'priority',
        label: 'Priority',
        rules: createValidationRules.required('priority'),
        placeholder: 'Select priority',
      };

    case 'assignee':
      return {
        name: 'assignee_id',
        label: 'Assignee',
        placeholder: 'Select assignee (optional)',
      };

    case 'storyPoints':
      return {
        name: 'story_points',
        label: 'Story Points',
        placeholder: 'Select story points',
      };

    case 'startDate':
      return {
        name: 'start_date',
        label: 'Start Date',
        placeholder: 'Select start date (optional)',
      };

    case 'status':
      return {
        name: 'status_id',
        label: 'Status',
        rules: createValidationRules.required('status'),
        placeholder: 'Select status',
      };

    case 'sprintName':
      return {
        name: 'name',
        label: 'Sprint Name',
        rules: createValidationRules.sprintName(),
        placeholder: 'Enter sprint name',
      };

    case 'sprintGoal':
      return {
        name: 'goal',
        label: 'Sprint Goal',
        rules: [VALIDATION_RULES.sprintGoal.maxLength],
        placeholder: 'Enter sprint goal (optional)',
      };

    case 'endDate':
      return {
        name: 'end_date',
        label: 'End Date',
        placeholder: 'Select end date',
      };

    case 'projectName':
      return {
        name: 'name',
        label: 'Project Name',
        rules: createValidationRules.title(true, 3),
        placeholder: 'Enter project name',
      };

    case 'projectKey':
      return {
        name: 'key',
        label: 'Project Key',
        rules: createValidationRules.projectKey(),
        placeholder: 'e.g., PROJ',
      };

    case 'username':
      return {
        name: 'username',
        label: 'Username',
        rules: createValidationRules.username(),
        placeholder: 'Enter username',
      };

    case 'email':
      return {
        name: 'email',
        label: 'Email',
        rules: createValidationRules.email(),
        placeholder: 'Enter email',
      };

    case 'fullName':
      return {
        name: 'full_name',
        label: 'Full Name',
        rules: [VALIDATION_RULES.fullName.required],
        placeholder: 'Enter full name',
      };

    case 'role':
      return {
        name: 'role',
        label: 'Role',
        rules: createValidationRules.required('role'),
        placeholder: 'Select role',
      };

    default:
      return {
        name: type,
        label: type.charAt(0).toUpperCase() + type.slice(1),
        placeholder: `Enter ${type}`,
      };
  }
};
