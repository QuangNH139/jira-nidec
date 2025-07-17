import React from 'react';
import { Button, Space } from 'antd';

interface ModalFooterProps {
  onCancel: () => void;
  onSubmit?: () => void;
  loading?: boolean;
  submitText?: string;
  cancelText?: string;
  submitType?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  disabled?: boolean;
  extraButtons?: React.ReactNode[];
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
  onCancel,
  onSubmit,
  loading = false,
  submitText = 'Save',
  cancelText = 'Cancel',
  submitType = 'primary',
  disabled = false,
  extraButtons = [],
}) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
      <Space>
        {extraButtons}
        <Button onClick={onCancel} disabled={loading}>
          {cancelText}
        </Button>
        {onSubmit && (
          <Button
            type={submitType}
            onClick={onSubmit}
            loading={loading}
            disabled={disabled}
          >
            {submitText}
          </Button>
        )}
      </Space>
    </div>
  );
};

// For use with Form components
interface FormModalFooterProps extends Omit<ModalFooterProps, 'onSubmit'> {
  htmlType?: 'button' | 'submit' | 'reset';
}

export const FormModalFooter: React.FC<FormModalFooterProps> = ({
  onCancel,
  loading = false,
  submitText = 'Save',
  cancelText = 'Cancel',
  submitType = 'primary',
  disabled = false,
  extraButtons = [],
  htmlType = 'submit',
}) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
      <Space>
        {extraButtons}
        <Button onClick={onCancel} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          type={submitType}
          htmlType={htmlType}
          loading={loading}
          disabled={disabled}
        >
          {submitText}
        </Button>
      </Space>
    </div>
  );
};
