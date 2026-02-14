import { useState, useRef, useEffect } from 'react';
import {
  Download,
  Trash2,
  File,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Loader2,
  Folder,
  FolderOpen,
  Eye,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
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
  const [isHovered, setIsHovered] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  const directoryItem = isDirectory ? (item as DirectoryMetadata) : null;
  const fileItem = !isDirectory ? (item as FileMetadata) : null;

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      // Clean up image preview URL when component unmounts
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const getFileIcon = () => {
    if (isDirectory) {
      return isHovered ? (
        <FolderOpen className="w-5 h-5 text-yellow-500" />
      ) : (
        <Folder className="w-5 h-5 text-yellow-500" />
      );
    }

    if (!fileItem) return <File className="w-5 h-5 text-gray-500" />;

    const category = getFileCategory(fileItem.mime_type);
    const iconClass = 'w-5 h-5';

    switch (category) {
      case 'Image':
        return <Image className={`${iconClass} text-purple-500`} />;
      case 'Video':
        return <Video className={`${iconClass} text-red-500`} />;
      case 'Audio':
        return <Music className={`${iconClass} text-green-500`} />;
      case 'Archive':
        return <Archive className={`${iconClass} text-yellow-600`} />;
      case 'PDF':
      case 'Document':
      case 'Text':
        return <FileText className={`${iconClass} text-blue-500`} />;
      default:
        return <File className={`${iconClass} text-gray-500`} />;
    }
  };

  const handleDownload = async () => {
    if (!fileItem) return;

    setDownloading(true);
    try {
      const response = await fetch(`/api/files/${fileItem.id}/download`);

      if (!response.ok) {
        throw new Error('Download failed');
      }

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
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  const handleShowImage = async () => {
    if (!fileItem) return;

    try {
      const response = await fetch(`/api/files/${fileItem.id}/download`);

      if (!response.ok) {
        throw new Error('Failed to load image');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setImagePreviewUrl(url);
      setShowImagePreview(true);
    } catch (error) {
      console.error('Image preview error:', error);
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

  const isImage = fileItem && getFileCategory(fileItem.mime_type) === 'Image';

  const handleDelete = async () => {
    const itemName = isDirectory
      ? (item as DirectoryMetadata).name
      : (item as FileMetadata).original_filename;

    const confirmMessage = isDirectory
      ? `Are you sure you want to delete the folder "${itemName}" and all its contents?`
      : `Are you sure you want to delete "${itemName}"?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(
        isDirectory ? `/api/directories/${item.id}` : `/api/files/${item.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      toast.success(
        isDirectory ? 'Folder deleted successfully!' : 'File deleted successfully!'
      );
      onDelete(item.id, isDirectory);
    } catch (error) {
      console.error('Delete error:', error);
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

    // For folders: clicking the row navigates into the folder
    // For files: clicking the row selects the file
    // (The checkbox will handle selection for both when clicked directly)
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

  return (
    <tr
      className={`transition-colors cursor-pointer ${
        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
      }`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Checkbox Column */}
      <td
        className="px-6 py-4 w-12"
        onClick={(e) => {
          e.stopPropagation();
          if (selectionMode || isHovered) {
            onSelectionToggle(item.id, isDirectory);
          }
        }}
      >
        {(selectionMode || isHovered) && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
            }}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        )}
      </td>

      {/* Name Column */}
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          {getFileIcon()}
          <div className="min-w-0">
            <p className={`font-medium text-gray-800 truncate ${isDirectory ? 'font-semibold' : ''}`}>
              {isDirectory ? directoryItem?.name : fileItem?.original_filename}
            </p>
            {!isDirectory && fileItem?.description && (
              <p className="text-sm text-gray-500 truncate">{fileItem.description}</p>
            )}
          </div>
        </div>
      </td>

      {/* Size Column */}
      <td className="px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">
        {isDirectory
          ? formatFileSize(directoryItem?.total_size || 0)
          : formatFileSize(fileItem?.file_size || 0)}
      </td>

      {/* Type/Items Column */}
      <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell">
        {isDirectory
          ? `${directoryItem?.file_count || 0} item(s)`
          : getFileCategory(fileItem?.mime_type || null)}
      </td>

      {/* Date Column */}
      <td className="px-6 py-4 text-sm text-gray-600 hidden lg:table-cell">
        {isDirectory
          ? formatRelativeTime(directoryItem?.updated_at || '')
          : formatRelativeTime(fileItem?.uploaded_at || '')}
      </td>

      {/* Actions Column */}
      {!selectionMode && (
        <td className="px-6 py-4 text-right">
          <div className="flex items-center justify-end space-x-2">
            {isDirectory && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onNavigate) onNavigate(item.id);
                }}
                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                title="Open Folder"
              >
                <FolderOpen className="w-5 h-5" />
              </button>
            )}
            {isImage && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShowImage();
                }}
                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Show Image"
              >
                <Eye className="w-5 h-5" />
              </button>
            )}
            {!isDirectory && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                disabled={downloading || deleting}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                title="Download"
              >
                {downloading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              disabled={downloading || deleting}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Delete"
            >
              {deleting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
            </button>
          </div>
        </td>
      )}

      {/* Image Preview Modal */}
      <Dialog open={showImagePreview} onOpenChange={handleCloseImagePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center justify-between">
              <span className="truncate">{fileItem?.original_filename}</span>
              <button
                onClick={handleCloseImagePreview}
                className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-2 overflow-auto max-h-[calc(90vh-80px)]">
            {imagePreviewUrl && (
              <img
                src={imagePreviewUrl}
                alt={fileItem?.original_filename || 'Preview'}
                className="w-full h-auto rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </tr>
  );
};

export default FileTableRow;
