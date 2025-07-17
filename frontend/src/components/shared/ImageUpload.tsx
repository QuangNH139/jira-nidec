import React from 'react';
import { Upload, Button, Image } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useImageUpload } from '../../hooks/useImageUpload';
import { uploadAPI } from '../../services/api';

interface ImageUploadProps {
  value?: string | null;
  onChange?: (value: string | null) => void;
  type: 'before' | 'after';
  label?: string;
  width?: number;
  height?: number;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  type,
  label = 'Upload Image',
  width = 200,
  height = 150,
  disabled = false,
}) => {
  const { handleImageUpload, uploading } = useImageUpload({
    onSuccess: (filename) => {
      if (onChange) {
        onChange(filename);
      }
    },
  });

  const handleRemove = () => {
    if (onChange) {
      onChange(null);
    }
  };

  const handleUpload = (file: File) => {
    handleImageUpload(file, type);
    return false; // Prevent default upload behavior
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {value ? (
        <div style={{ position: 'relative' }}>
          <Image
            width={width}
            height={height}
            src={uploadAPI.getFileUrl(value)}
            alt={type}
            style={{ objectFit: 'cover', borderRadius: '6px' }}
          />
          {!disabled && (
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={handleRemove}
              style={{ position: 'absolute', top: '4px', right: '4px' }}
            />
          )}
        </div>
      ) : (
        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={handleUpload}
          disabled={uploading || disabled}
        >
          <Button 
            icon={<UploadOutlined />} 
            loading={uploading}
            disabled={disabled}
          >
            {label}
          </Button>
        </Upload>
      )}
    </div>
  );
};
