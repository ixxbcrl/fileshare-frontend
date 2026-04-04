import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { Loader2 } from 'lucide-react';
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
    if (incoming.length > 0) setSelectedFiles(prev => mergeFiles(prev, incoming));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []);
    if (incoming.length > 0) setSelectedFiles(prev => mergeFiles(prev, incoming));
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    if (selectedFiles.length <= 1 && fileInputRef.current) fileInputRef.current.value = '';
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
      toast.success(total === 1 ? 'File uploaded!' : `${completed} files uploaded!`);
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
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-sm p-6 text-center cursor-pointer transition-all duration-300 min-h-[120px] flex flex-col items-center justify-center ${
          isDragging
            ? 'border-primary bg-primary-container/20'
            : 'border-outline-variant bg-surface-container-low hover:border-primary/60 hover:bg-surface-container'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />

        <span className="material-symbols-outlined text-on-surface-variant mb-3" style={{ fontSize: '36px' }}>
          cloud_upload
        </span>

        {selectedFiles.length > 0 ? (
          <div className="w-full" onClick={e => e.stopPropagation()}>
            <p className="text-xs text-on-surface-variant mb-3 text-center">
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
              ({formatFileSize(selectedFiles.reduce((s, f) => s + f.size, 0))})
            </p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
              {selectedFiles.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center justify-between bg-surface-container-lowest rounded-sm px-3 py-2"
                >
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-on-surface truncate text-sm">{file.name}</p>
                    <p className="text-xs text-on-surface-variant">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }}
                    className="ml-3 p-1.5 hover:bg-surface-container rounded-sm transition-colors flex-shrink-0"
                    disabled={uploading}
                  >
                    <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '16px' }}>close</span>
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-on-surface-variant mt-3 text-center">Drop more or click to add more files</p>
          </div>
        ) : (
          <div className="space-y-1 text-center">
            <p className="font-medium text-on-surface text-sm">
              Drop files here or <span className="text-primary">browse</span>
            </p>
            <p className="text-xs text-on-surface-variant">Any file type · Multiple files supported</p>
          </div>
        )}
      </div>

      {/* Upload progress */}
      {uploading && uploadProgress > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-on-surface-variant">
              Uploading {Math.min(Math.round((uploadProgress / 100) * uploadTotalRef.current), uploadTotalRef.current)} of {uploadTotalRef.current}...
            </span>
            <span className="text-xs font-medium text-on-surface">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-surface-container-high rounded-full h-1 overflow-hidden">
            <div
              className="bg-primary h-1 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload button */}
      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <button
            onClick={(e) => { e.stopPropagation(); handleUpload(); }}
            disabled={selectedFiles.length === 0 || uploading}
            className="w-full bg-primary text-on-primary py-2.5 rounded-sm text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary-dim transition-colors active:scale-[0.98] disabled:opacity-50"
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>upload</span>
                {selectedFiles.length === 1 ? 'Upload File' : `Upload ${selectedFiles.length} Files`}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
