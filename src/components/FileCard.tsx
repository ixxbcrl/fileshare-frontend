import { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import type { FileMetadata, DirectoryMetadata } from '../types';
import { formatFileSize, formatRelativeTime, getFileCategory } from '../utils/format';
import toast from 'react-hot-toast';

interface FileCardProps {
  item: FileMetadata | DirectoryMetadata;
  isDirectory: boolean;
  onDelete: (id: string, isDirectory: boolean) => void;
  onNavigate?: (directoryId: string) => void;
  selectionMode: boolean;
  isSelected: boolean;
  onSelectionToggle: (id: string, isDirectory: boolean) => void;
}

interface IconSpec {
  icon: string;
  bg: string;
  color: string;
  filled?: boolean;
}

const getIconSpec = (isDirectory: boolean, mimeType: string | null | undefined): IconSpec => {
  if (isDirectory) {
    return { icon: 'folder', bg: 'bg-secondary-container/30', color: 'text-secondary', filled: true };
  }
  const category = getFileCategory(mimeType ?? null);
  switch (category) {
    case 'PDF':
      return { icon: 'picture_as_pdf', bg: 'bg-error-container/10', color: 'text-error' };
    case 'Document':
      return { icon: 'description', bg: 'bg-primary-container/30', color: 'text-primary' };
    case 'Spreadsheet':
      return { icon: 'table_chart', bg: 'bg-primary-container/20', color: 'text-primary' };
    case 'Video':
      return { icon: 'video_library', bg: 'bg-tertiary-container', color: 'text-tertiary' };
    case 'Audio':
      return { icon: 'audio_file', bg: 'bg-surface-container', color: 'text-on-surface-variant' };
    case 'Image':
      return { icon: 'image', bg: 'bg-surface-container', color: 'text-on-surface-variant' };
    case 'Archive':
      return { icon: 'folder_zip', bg: 'bg-surface-container', color: 'text-on-surface-variant' };
    case 'Text':
      return { icon: 'article', bg: 'bg-primary-container/20', color: 'text-primary' };
    default:
      return { icon: 'draft', bg: 'bg-surface-container', color: 'text-on-surface-variant' };
  }
};

const FileCard = ({
  item,
  isDirectory,
  onDelete,
  onNavigate,
  selectionMode,
  isSelected,
  onSelectionToggle,
}: FileCardProps) => {
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  const directoryItem = isDirectory ? (item as DirectoryMetadata) : null;
  const fileItem = !isDirectory ? (item as FileMetadata) : null;
  const isImage = fileItem && getFileCategory(fileItem.mime_type) === 'Image';

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const iconSpec = getIconSpec(isDirectory, fileItem?.mime_type);

  const handleDownload = async () => {
    if (!fileItem) return;
    setDownloading(true);
    try {
      const response = await fetch(`/api/files/${fileItem.id}/download`);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileItem.original_filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('File downloaded successfully!');
    } catch {
      toast.error('Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  const handleShowImage = async () => {
    if (!fileItem) return;
    try {
      const response = await fetch(`/api/files/${fileItem.id}/download`);
      if (!response.ok) throw new Error('Failed to load image');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setImagePreviewUrl(url);
      setShowImagePreview(true);
    } catch {
      toast.error('Failed to load image');
    }
  };

  const handleCloseImagePreview = () => {
    setShowImagePreview(false);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
  };

  const handleDelete = async () => {
    const itemName = isDirectory
      ? (item as DirectoryMetadata).name
      : (item as FileMetadata).original_filename;
    const confirmMessage = isDirectory
      ? `Delete folder "${itemName}" and all its contents?`
      : `Delete "${itemName}"?`;
    if (!window.confirm(confirmMessage)) return;

    setDeleting(true);
    try {
      const response = await fetch(
        isDirectory ? `/api/directories/${item.id}` : `/api/files/${item.id}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Delete failed');
      toast.success(isDirectory ? 'Folder deleted!' : 'File deleted!');
      onDelete(item.id, isDirectory);
    } catch {
      toast.error('Failed to delete ' + (isDirectory ? 'folder' : 'file'));
    } finally {
      setDeleting(false);
    }
  };

  const handleClick = () => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    if (isDirectory && onNavigate) {
      onNavigate(item.id);
    } else {
      onSelectionToggle(item.id, isDirectory);
    }
  };

  const handleTouchStart = () => {
    if (selectionMode) return;
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      onSelectionToggle(item.id, isDirectory);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Image card variant
  if (isImage && !isDirectory) {
    return (
      <div
        className={`group relative bg-surface-container-lowest p-4 rounded-sm border cursor-pointer transition-all duration-300 flex flex-col gap-3 ${
          isSelected ? 'border-primary ring-1 ring-primary' : 'border-transparent hover:border-outline-variant/20'
        }`}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Selection checkbox */}
        {(selectionMode) && (
          <div
            className="absolute top-2 right-2 z-10"
            onClick={(e) => { e.stopPropagation(); onSelectionToggle(item.id, false); }}
          >
            <input type="checkbox" checked={isSelected} onChange={() => {}}
              className="w-4 h-4 cursor-pointer accent-primary" />
          </div>
        )}

        <div className="aspect-[4/3] w-full rounded-sm overflow-hidden bg-surface-container relative">
          {imagePreviewUrl ? (
            <img
              src={imagePreviewUrl}
              alt={fileItem?.original_filename}
              className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>image</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-start">
          <div className="min-w-0">
            <h3 className="font-medium text-sm text-on-background truncate">
              {fileItem?.original_filename}
            </h3>
            <p className="text-[10px] uppercase tracking-wider text-on-surface-variant mt-1">
              {formatFileSize(fileItem?.file_size || 0)} • {formatRelativeTime(fileItem?.uploaded_at || '')}
            </p>
          </div>

          {!selectionMode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
                  style={{ fontSize: '18px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  more_vert
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleShowImage(); }}>
                  <span className="material-symbols-outlined mr-2" style={{ fontSize: '16px' }}>visibility</span>
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(); }} disabled={downloading || deleting}>
                  {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (
                    <span className="material-symbols-outlined mr-2" style={{ fontSize: '16px' }}>download</span>
                  )}
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}>
                  <span className="material-symbols-outlined mr-2" style={{ fontSize: '16px' }}>info</span>
                  {showInfo ? 'Hide Details' : 'Details'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                  disabled={deleting}
                  className="text-error focus:text-error"
                >
                  {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (
                    <span className="material-symbols-outlined mr-2" style={{ fontSize: '16px' }}>delete</span>
                  )}
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {showInfo && !selectionMode && fileItem && (
          <div className="pt-3 border-t border-surface-container space-y-2 text-xs animate-fade-in">
            {fileItem.description && (
              <div><span className="font-medium text-on-surface">Description:</span><p className="text-on-surface-variant mt-1">{fileItem.description}</p></div>
            )}
            <div><span className="font-medium text-on-surface">MIME:</span><p className="text-on-surface-variant">{fileItem.mime_type}</p></div>
            <div><span className="font-medium text-on-surface">ID:</span><p className="text-on-surface-variant break-all">{item.id}</p></div>
          </div>
        )}

        <Dialog open={showImagePreview} onOpenChange={handleCloseImagePreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="text-sm truncate">{fileItem?.original_filename}</DialogTitle>
            </DialogHeader>
            <div className="p-6 pt-2 overflow-auto max-h-[calc(90vh-80px)]">
              {imagePreviewUrl && (
                <img src={imagePreviewUrl} alt={fileItem?.original_filename || 'Preview'} className="w-full h-auto rounded-sm" />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Standard card
  return (
    <div
      className={`group relative bg-surface-container-lowest p-6 rounded-sm border cursor-pointer transition-all duration-300 flex flex-col gap-4 ${
        isSelected ? 'border-primary ring-1 ring-primary' : 'border-transparent hover:border-outline-variant/20'
      }`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <div
          className="absolute top-3 right-3 z-10"
          onClick={(e) => { e.stopPropagation(); onSelectionToggle(item.id, isDirectory); }}
        >
          <input type="checkbox" checked={isSelected} onChange={() => {}}
            className="w-4 h-4 cursor-pointer accent-primary" />
        </div>
      )}

      <div className="flex justify-between items-start">
        {/* Icon */}
        <div className={`w-12 h-12 ${iconSpec.bg} rounded-sm flex items-center justify-center`}>
          <span
            className={`material-symbols-outlined ${iconSpec.color}`}
            style={{
              fontSize: '32px',
              fontVariationSettings: iconSpec.filled ? "'FILL' 1" : "'FILL' 0",
            }}
          >
            {iconSpec.icon}
          </span>
        </div>

        {/* More menu */}
        {!selectionMode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ fontSize: '20px' }}
                onClick={(e) => e.stopPropagation()}
              >
                more_vert
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
              {isDirectory && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); if (onNavigate) onNavigate(item.id); }}>
                  <span className="material-symbols-outlined mr-2" style={{ fontSize: '16px' }}>folder_open</span>
                  Open Folder
                </DropdownMenuItem>
              )}
              {isImage && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleShowImage(); }}>
                  <span className="material-symbols-outlined mr-2" style={{ fontSize: '16px' }}>visibility</span>
                  Preview
                </DropdownMenuItem>
              )}
              {!isDirectory && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(); }} disabled={downloading || deleting}>
                  {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (
                    <span className="material-symbols-outlined mr-2" style={{ fontSize: '16px' }}>download</span>
                  )}
                  Download
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}>
                <span className="material-symbols-outlined mr-2" style={{ fontSize: '16px' }}>info</span>
                {showInfo ? 'Hide Details' : 'Details'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                disabled={deleting}
                className="text-error focus:text-error"
              >
                {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (
                  <span className="material-symbols-outlined mr-2" style={{ fontSize: '16px' }}>delete</span>
                )}
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Title and metadata */}
      <div>
        <h3 className="font-semibold text-on-background truncate">
          {isDirectory ? directoryItem?.name : fileItem?.original_filename}
        </h3>
        <p className="text-xs text-on-surface-variant mt-1">
          {isDirectory
            ? `${directoryItem?.file_count || 0} files • ${formatFileSize(directoryItem?.total_size || 0)}`
            : `${formatFileSize(fileItem?.file_size || 0)} • ${formatRelativeTime(fileItem?.uploaded_at || '')}`}
        </p>
      </div>

      {/* Info details */}
      {showInfo && !selectionMode && (
        <div className="pt-3 border-t border-surface-container space-y-2 text-xs animate-fade-in">
          {!isDirectory && fileItem && (
            <>
              {fileItem.description && (
                <div><span className="font-medium text-on-surface">Description:</span><p className="text-on-surface-variant mt-1">{fileItem.description}</p></div>
              )}
              <div><span className="font-medium text-on-surface">MIME:</span><p className="text-on-surface-variant">{fileItem.mime_type}</p></div>
              <div><span className="font-medium text-on-surface">Uploaded:</span><p className="text-on-surface-variant">{new Date(fileItem.uploaded_at).toLocaleString()}</p></div>
              <div><span className="font-medium text-on-surface">ID:</span><p className="text-on-surface-variant break-all">{item.id}</p></div>
            </>
          )}
          {isDirectory && directoryItem && (
            <>
              <div><span className="font-medium text-on-surface">Created:</span><p className="text-on-surface-variant">{new Date(directoryItem.created_at).toLocaleString()}</p></div>
              <div><span className="font-medium text-on-surface">ID:</span><p className="text-on-surface-variant break-all">{item.id}</p></div>
            </>
          )}
        </div>
      )}

      {/* Image Preview Modal */}
      {isImage && (
        <Dialog open={showImagePreview} onOpenChange={handleCloseImagePreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="text-sm truncate">{fileItem?.original_filename}</DialogTitle>
            </DialogHeader>
            <div className="p-6 pt-2 overflow-auto max-h-[calc(90vh-80px)]">
              {imagePreviewUrl && (
                <img src={imagePreviewUrl} alt={fileItem?.original_filename || 'Preview'} className="w-full h-auto rounded-sm" />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default FileCard;
