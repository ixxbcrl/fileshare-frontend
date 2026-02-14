import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { formatFileSize } from '../utils/format';
import toast from 'react-hot-toast';

interface FileUploadProps {
  onUploadSuccess: () => void;
  currentDirectoryId: string | null;
}

const FileUpload = ({ onUploadSuccess, currentDirectoryId }: FileUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (description.trim()) {
        formData.append('description', description.trim());
      }
      if (currentDirectoryId) {
        formData.append('parent_directory_id', currentDirectoryId);
      }

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      await response.json();

      toast.success('File uploaded successfully!');
      setSelectedFile(null);
      setDescription('');
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onUploadSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {/* Drag and Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
          transition-all duration-300 ease-in-out
          ${
            isDragging
              ? 'border-white bg-white/30 backdrop-blur-sm'
              : 'border-white/40 bg-white/10 backdrop-blur-sm hover:border-white hover:bg-white/20'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />

        <div className="flex flex-col items-center space-y-3">
          <Upload
            className={`w-12 h-12 ${
              isDragging ? 'text-white' : 'text-white/80'
            } transition-colors duration-200`}
          />

          {selectedFile ? (
            <div className="w-full">
              <div className="flex items-center justify-between bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                <div className="flex-1 text-left">
                  <p className="font-semibold text-slate-900 truncate text-sm">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-600">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  className="ml-3 p-1.5 hover:bg-slate-100 rounded-full transition-colors"
                  disabled={uploading}
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="font-semibold text-white">
                Drop your file here or click to browse
              </p>
              <p className="text-sm text-white/80">
                Any file type supported
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Description Input */}
      {selectedFile && (
        <div className="mt-4">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description (optional)..."
            className="w-full px-4 py-2 bg-white/90 backdrop-blur-sm border border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-slate-900 placeholder-slate-500 text-sm"
            disabled={uploading}
          />
        </div>
      )}

      {/* Upload Progress */}
      {uploading && uploadProgress > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-white">
              Uploading...
            </span>
            <span className="text-sm font-semibold text-white">
              {uploadProgress}%
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && (
        <div className="mt-4">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleUpload();
            }}
            disabled={!selectedFile || uploading}
            className="w-full bg-white hover:bg-white/90 text-indigo-600 shadow-lg"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload File
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
