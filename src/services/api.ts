import axios from 'axios';
import type { AxiosProgressEvent } from 'axios';
import type {
  FileMetadata,
  DirectoryMetadata,
  UploadResponse,
  ListFilesResponse,
  CreateDirectoryResponse,
  BulkDeleteResponse,
  DeleteResponse,
  MoveResponse,
  HealthResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fileApi = {
  /**
   * Check if the API is healthy
   */
  healthCheck: async (): Promise<HealthResponse> => {
    const response = await apiClient.get<HealthResponse>('/health');
    return response.data;
  },

  /**
   * Upload a file with optional description and parent directory
   */
  uploadFile: async (
    file: File,
    description?: string,
    parentDirectoryId?: string | null,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }
    if (parentDirectoryId) {
      formData.append('parent_directory_id', parentDirectoryId);
    }

    const response = await apiClient.post<UploadResponse>('/api/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    return response.data;
  },

  /**
   * Get a list of files and directories in a specific directory
   */
  listFiles: async (parentDirectoryId?: string | null): Promise<ListFilesResponse> => {
    const params = parentDirectoryId ? { parent_directory_id: parentDirectoryId } : {};
    const response = await apiClient.get<ListFilesResponse>('/api/files', { params });
    return response.data;
  },

  /**
   * Get metadata for a specific file
   */
  getFileInfo: async (fileId: string): Promise<FileMetadata> => {
    const response = await apiClient.get<FileMetadata>(`/api/files/${fileId}`);
    return response.data;
  },

  /**
   * Download a file
   */
  downloadFile: async (fileId: string, originalFilename: string): Promise<void> => {
    const response = await apiClient.get(`/api/files/${fileId}/download`, {
      responseType: 'blob',
    });

    // Create a blob URL and trigger download
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = originalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Delete a file
   */
  deleteFile: async (fileId: string): Promise<DeleteResponse> => {
    const response = await apiClient.delete<DeleteResponse>(`/api/files/${fileId}`);
    return response.data;
  },

  /**
   * Create a new directory
   */
  createDirectory: async (
    name: string,
    parentId: string | null = null
  ): Promise<CreateDirectoryResponse> => {
    const response = await apiClient.post<CreateDirectoryResponse>('/api/directories', {
      name,
      parent_id: parentId,
    });
    return response.data;
  },

  /**
   * Get directory information
   */
  getDirectoryInfo: async (directoryId: string): Promise<DirectoryMetadata> => {
    const response = await apiClient.get<DirectoryMetadata>(`/api/directories/${directoryId}`);
    return response.data;
  },

  /**
   * Delete a directory
   */
  deleteDirectory: async (directoryId: string): Promise<DeleteResponse> => {
    const response = await apiClient.delete<DeleteResponse>(`/api/directories/${directoryId}`);
    return response.data;
  },

  /**
   * Move a file to a different directory
   */
  moveFile: async (fileId: string, targetDirectoryId: string): Promise<MoveResponse> => {
    const response = await apiClient.patch<MoveResponse>(`/api/files/${fileId}`, {
      parent_directory_id: targetDirectoryId,
    });
    return response.data;
  },

  /**
   * Move a directory to a different parent directory
   */
  moveDirectory: async (directoryId: string, targetDirectoryId: string): Promise<MoveResponse> => {
    const response = await apiClient.patch<MoveResponse>(`/api/directories/${directoryId}`, {
      parent_id: targetDirectoryId,
    });
    return response.data;
  },

  /**
   * Bulk delete files and directories
   */
  bulkDelete: async (
    fileIds: string[],
    directoryIds: string[]
  ): Promise<BulkDeleteResponse> => {
    const response = await apiClient.post<BulkDeleteResponse>('/api/bulk-delete', {
      file_ids: fileIds,
      directory_ids: directoryIds,
    });
    return response.data;
  },
};

export default fileApi;
