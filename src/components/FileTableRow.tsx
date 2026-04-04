import { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import type { FileMetadata, DirectoryMetadata } from '../types';
import { formatFileSize, formatRelativeTime, getFileCategory } from '../utils/format';
import toast from 'react-hot-toast';

interface FileTableRowProps {
  item: FileMetadata | DirectoryMetadata;
  isDirectory: boolean;
  onDelete: (id: string, isDirectory: boolean) => void;
  onNavigate?: (directoryId: string) => void;
  selectionMode: boolean;
  isSelected: boolean;
  onSelectionToggle: (id: string, isDirectory: boolean) => void;
}

const getMaterialIcon = (isDirectory: boolean, mimeType: string | null | undefined): string => {
  if (isDirectory) return 'folder';
  const category = getFileCategory(mimeType ?? null);
  switch (category) {
    case 'PDF': return 'picture_as_pdf';
    case 'Document': return 'description';
    case 'Spreadsheet': return 'table_chart';
    case 'Video': return 'video_library';
    case 'Audio': return 'audio_file';
    case 'Image': return 'image';
    case 'Archive': return 'folder_zip';
    case 'Text': return 'article';
    default: return 'draft';
  }
};

const FileTableRow = ({
  item,
  isDirectory,
  onDelete,
  onNavigate,
  selectionMode,
  isSelected,
  onSelectionToggle,
}: FileTableRowProps) => {
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
      setImagePreviewUrl(window.URL.createObjectURL(blob));
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

  const mimeLabel = isDirectory
    ? 'DIRECTORY'
    : (getFileCategory(fileItem?.mime_type ?? null)).toUpperCase();

  const icon = getMaterialIcon(isDirectory, fileItem?.mime_type);

  return (
    <tr
      className={`group transition-colors duration-300 cursor-pointer ${
        isSelected ? 'bg-primary-container/20' : 'hover:bg-surface-container-low'
      }`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Checkbox */}
      {selectionMode && (
        <td
          className="py-4 pl-2 w-10"
          onClick={(e) => { e.stopPropagation(); onSelectionToggle(item.id, isDirectory); }}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            className="w-4 h-4 cursor-pointer accent-primary"
          />
        </td>
      )}

      {/* Name */}
      <td className="py-6 pl-2">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-sm bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {icon}
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-on-background leading-none mb-1 truncate">
              {isDirectory ? directoryItem?.name : fileItem?.original_filename}
            </div>
            <div className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">
              {mimeLabel}
            </div>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="py-6">
        <span className="px-2 py-1 bg-primary-container text-on-primary-container text-[10px] font-bold uppercase tracking-wider rounded-sm">
          Synced
        </span>
      </td>

      {/* Size */}
      <td className="py-6 text-sm text-on-surface-variant font-medium hidden sm:table-cell">
        {isDirectory
          ? formatFileSize(directoryItem?.total_size || 0)
          : formatFileSize(fileItem?.file_size || 0)}
      </td>

      {/* Modified */}
      <td className="py-6 text-sm text-on-surface-variant font-medium hidden md:table-cell">
        {isDirectory
          ? formatRelativeTime(directoryItem?.updated_at || '')
          : formatRelativeTime(fileItem?.uploaded_at || '')}
      </td>

      {/* Actions */}
      <td className="py-6 text-right pr-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="material-symbols-outlined text-on-surface-variant hover:text-on-background transition-colors p-2"
              style={{ fontSize: '20px' }}
              onClick={(e) => e.stopPropagation()}
            >
              {(downloading || deleting) ? '' : 'more_horiz'}
            </button>
          </DropdownMenuTrigger>
          {!(downloading || deleting) && (
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
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(); }}>
                  {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (
                    <span className="material-symbols-outlined mr-2" style={{ fontSize: '16px' }}>download</span>
                  )}
                  Download
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                className="text-error focus:text-error"
              >
                {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (
                  <span className="material-symbols-outlined mr-2" style={{ fontSize: '16px' }}>delete</span>
                )}
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          )}
        </DropdownMenu>
        {(downloading || deleting) && <Loader2 className="w-4 h-4 animate-spin inline text-on-surface-variant" />}
      </td>

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
    </tr>
  );
};

export default FileTableRow;
