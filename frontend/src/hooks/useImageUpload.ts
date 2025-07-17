import { useMutation } from '@tanstack/react-query';
import { message } from 'antd';
import { uploadAPI } from '../services/api';

interface UseImageUploadOptions {
  onSuccess?: (filename: string, type: 'before' | 'after') => void;
  onError?: (error: any) => void;
}

export const useImageUpload = (options: UseImageUploadOptions = {}) => {
  const { onSuccess, onError } = options;

  const uploadMutation = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: 'before' | 'after' }) => {
      const response = await uploadAPI.uploadFile(file);
      return { filename: response.data.filename, type };
    },
    onSuccess: ({ filename, type }) => {
      message.success('Image uploaded successfully!');
      if (onSuccess) {
        onSuccess(filename, type);
      }
    },
    onError: (error: any) => {
      console.error('Upload error details:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to upload image';
      message.error(errorMessage);
      if (onError) {
        onError(error);
      }
    },
  });

  const handleImageUpload = async (file: File, type: 'before' | 'after') => {
    uploadMutation.mutate({ file, type });
    return false; // Prevent default upload behavior
  };

  return {
    handleImageUpload,
    uploading: uploadMutation.isPending,
    uploadMutation,
  };
};
