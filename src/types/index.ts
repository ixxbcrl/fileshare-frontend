export interface FileMetadata {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string | null;
  uploaded_at: string;
  description: string | null;
  parent_directory_id: string | null;
}

export interface DirectoryMetadata {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  file_count: number;
  total_size: number;
}

export interface UploadResponse {
  success: boolean;
  file: FileMetadata;
  message: string;
}

export interface ListFilesResponse {
  files: FileMetadata[];
  directories: DirectoryMetadata[];
  total: number;
}

export interface CreateDirectoryResponse {
  success: boolean;
  directory: DirectoryMetadata;
  message: string;
}

export interface MoveResponse {
  success: boolean;
  message: string;
}

export interface BulkDeleteResponse {
  success: boolean;
  deleted_files: number;
  deleted_directories: number;
  message: string;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

export interface HealthResponse {
  status: string;
  service: string;
}

export interface ErrorResponse {
  error: string;
}

export interface BreadcrumbItem {
  id: string | null;
  name: string;
}
