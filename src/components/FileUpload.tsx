import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { formatFileSize } from '../utils/format';
import toast from 'react-hot-toast';
import { fileApi } from '../services/api';

interface FileUploadProps {
  onUploadSuccess: () => void;
  currentDirectoryId: string | null;
}

const mergeFiles = (existing: File[], incoming: File[]): File[] => {
  const names = new Set(existing.map(f => f.name));
  return [...existing, ...incoming.filter(f => !names.has(f.name))];
};

const FileUpload = ({ onUploadSuccess, currentDirectoryId }: FileUploadProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const uploadTotalRef = useRef(0);
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
    const incoming = Array.from(e.dataTransfer.files);
    if (incoming.length > 0) {
      setSelectedFiles(prev => mergeFiles(prev, incoming));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []);
    if (incoming.length > 0) {
      setSelectedFiles(prev => mergeFiles(prev, incoming));
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    if (selectedFiles.length <= 1 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const total = selectedFiles.length;
    uploadTotalRef.current = total;
    let completed = 0;
    let failed = 0;
    const CONCURRENCY = 3;

    for (let i = 0; i < total; i += CONCURRENCY) {
      const batch = selectedFiles.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map(file => fileApi.uploadFile(file, undefined, currentDirectoryId))
      );
      for (const result of results) {
        if (result.status === 'fulfilled') completed++;
        else { failed++; console.error('Upload failed:', result.reason); }
        setUploadProgress(Math.round(((completed + failed) / total) * 100));
      }
    }

    if (completed > 0) onUploadSuccess();

    if (failed === 0) {
      toast.success(total === 1 ? 'File uploaded successfully!' : `${completed} files uploaded successfully!`);
    } else if (completed === 0) {
      toast.error('All uploads failed. Please try again.');
    } else {
      toast.error(`${completed} uploaded, ${failed} failed.`);
    }

    setSelectedFiles([]);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploading(false);
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
          relative border-2 border-dashed rounded-xl p-4 sm:p-6 text-center cursor-pointer
          transition-all duration-300 ease-in-out min-h-[120px] sm:min-h-0
          ${
            isDragging
              ? 'border-white bg-white/30 backdrop-blur-sm'
              : 'border-white/40 bg-white/10 backdrop-blur-sm hover:border-white hover:bg-white/20 active:bg-white/25'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />

        <div className="flex flex-col items-center space-y-2 sm:space-y-3">
          <Upload
            className={`w-10 h-10 sm:w-12 sm:h-12 ${
              isDragging ? 'text-white' : 'text-white/80'
            } transition-colors duration-200`}
          />

          {selectedFiles.length > 0 ? (
            <div className="w-full" onClick={e => e.stopPropagation()}>
              <p className="text-xs text-white/80 mb-2 text-left">
                {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                ({formatFileSize(selectedFiles.reduce((s, f) => s + f.size, 0))})
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedFiles.map((file, idx) => (
                  <div key={`${file.name}-${idx}`} className="flex items-center justify-between bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-semibold text-slate-900 truncate text-xs sm:text-sm">{file.name}</p>
                      <p className="text-xs text-slate-600">{formatFileSize(file.size)}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }} className="ml-3 p-2 hover:bg-slate-100 active:bg-slate-200 rounded-full transition-colors flex-shrink-0" disabled={uploading}>
                      <X className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/60 mt-2 text-center">Drop more or click to add more</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="font-semibold text-white text-sm sm:text-base">
                <span className="hidden sm:inline">Drop your files here or </span>
                <span className="sm:hidden">Tap to </span>
                <span className="hidden sm:inline">click to </span>browse
              </p>
              <p className="text-xs sm:text-sm text-white/80">Any file type supported · Select multiple</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && uploadProgress > 0 && (
        <div className="mt-3 sm:mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-semibold text-white">
              Uploading {Math.min(Math.round((uploadProgress / 100) * uploadTotalRef.current), uploadTotalRef.current)} of {uploadTotalRef.current}...
            </span>
            <span className="text-xs sm:text-sm font-semibold text-white">
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
      {selectedFiles.length > 0 && (
        <div className="mt-3 sm:mt-4">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleUpload();
            }}
            disabled={selectedFiles.length === 0 || uploading}
            className="w-full bg-white hover:bg-white/90 active:bg-white/80 text-indigo-600 shadow-lg min-h-[44px] text-sm sm:text-base"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {selectedFiles.length === 1 ? 'Upload File' : `Upload ${selectedFiles.length} Files`}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
