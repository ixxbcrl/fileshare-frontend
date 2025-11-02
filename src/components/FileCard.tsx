import { useState, useRef, useEffect } from 'react';
import {
  Download,
  Trash2,
  File,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  Loader2,
  Info,
  Folder,
  FolderOpen,
} from 'lucide-react';
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
  const [isHovered, setIsHovered] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  const directoryItem = isDirectory ? (item as DirectoryMetadata) : null;
  const fileItem = !isDirectory ? (item as FileMetadata) : null;

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const getFileIcon = () => {
    if (isDirectory) {
      return isHovered ? (
        <FolderOpen className="w-12 h-12 text-yellow-500" />
      ) : (
        <Folder className="w-12 h-12 text-yellow-500" />
      );
    }

    if (!fileItem) return <File className="w-12 h-12 text-gray-500" />;

    const category = getFileCategory(fileItem.mime_type);
    const iconClass = 'w-12 h-12';

    switch (category) {
      case 'Image':
        return <ImageIcon className={iconClass} />;
      case 'Video':
        return <Video className={iconClass} />;
      case 'Audio':
        return <Music className={iconClass} />;
      case 'Archive':
        return <Archive className={iconClass} />;
      case 'PDF':
      case 'Document':
      case 'Text':
        return <FileText className={iconClass} />;
      default:
        return <File className={iconClass} />;
    }
  };

  const getIconColor = () => {
    if (isDirectory) {
      return 'text-yellow-500';
    }

    if (!fileItem) return 'text-gray-500';

    const category = getFileCategory(fileItem.mime_type);

    switch (category) {
      case 'Image':
        return 'text-purple-500';
      case 'Video':
        return 'text-red-500';
      case 'Audio':
        return 'text-green-500';
      case 'PDF':
        return 'text-red-600';
      case 'Document':
        return 'text-blue-500';
      case 'Archive':
        return 'text-yellow-600';
      default:
        return 'text-gray-500';
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

    if (selectionMode) {
      onSelectionToggle(item.id, isDirectory);
    } else if (isDirectory && onNavigate) {
      onNavigate(item.id);
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
    <div
      className={`card group relative animate-slide-up transition-all cursor-pointer ${
        isSelected ? 'bg-blue-50 border-2 border-blue-500' : 'hover:shadow-lg'
      }`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection Checkbox */}
      {(selectionMode || isHovered) && (
        <div className="absolute top-4 right-4 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelectionToggle(item.id, isDirectory);
            }}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        </div>
      )}

      {/* File Icon and Info */}
      <div className="flex items-start space-x-4">
        <div className={`flex-shrink-0 ${getIconColor()}`}>{getFileIcon()}</div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
            {isDirectory ? directoryItem?.name : fileItem?.original_filename}
          </h3>

          <div className="mt-2 space-y-1">
            {isDirectory ? (
              <>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Items:</span> {directoryItem?.file_count || 0}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Size:</span>{' '}
                  {formatFileSize(directoryItem?.total_size || 0)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Modified:</span>{' '}
                  {formatRelativeTime(directoryItem?.updated_at || '')}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Size:</span> {formatFileSize(fileItem?.file_size || 0)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Type:</span> {getFileCategory(fileItem?.mime_type || null)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Uploaded:</span>{' '}
                  {formatRelativeTime(fileItem?.uploaded_at || '')}
                </p>
                {fileItem?.description && (
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Description:</span> {fileItem.description}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Info Button */}
        {!selectionMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowInfo(!showInfo);
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Toggle details"
          >
            <Info className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Detailed Info (Collapsible) */}
      {showInfo && !selectionMode && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm animate-fade-in">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-medium text-gray-700">ID:</span>
              <p className="text-gray-600 text-xs break-all">{item.id}</p>
            </div>
            {!isDirectory && fileItem?.mime_type && (
              <div>
                <span className="font-medium text-gray-700">MIME Type:</span>
                <p className="text-gray-600 text-xs">{fileItem.mime_type}</p>
              </div>
            )}
          </div>
          {!isDirectory && fileItem && (
            <>
              <div>
                <span className="font-medium text-gray-700">Stored as:</span>
                <p className="text-gray-600 text-xs break-all">{fileItem.filename}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Upload Date:</span>
                <p className="text-gray-600 text-xs">
                  {new Date(fileItem.uploaded_at).toLocaleString()}
                </p>
              </div>
            </>
          )}
          {isDirectory && directoryItem && (
            <>
              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <p className="text-gray-600 text-xs">
                  {new Date(directoryItem.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Updated:</span>
                <p className="text-gray-600 text-xs">
                  {new Date(directoryItem.updated_at).toLocaleString()}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Action Buttons (Only for files and not in selection mode) */}
      {!isDirectory && !selectionMode && (
        <div className="mt-6 flex space-x-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            disabled={downloading || deleting}
            className="btn-primary flex-1 flex items-center justify-center space-x-2"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download</span>
              </>
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={downloading || deleting}
            className="btn-danger flex items-center justify-center space-x-2 px-4"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      {/* Delete Button for Directories (not in selection mode) */}
      {isDirectory && !selectionMode && (
        <div className="mt-6">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={deleting}
            className="btn-danger w-full flex items-center justify-center space-x-2"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Folder</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileCard;
