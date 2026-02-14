import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
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
  MoreVertical,
  Eye,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
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
        <FolderOpen className="w-8 h-8" />
      ) : (
        <Folder className="w-8 h-8" />
      );
    }

    if (!fileItem) return <File className="w-8 h-8" />;

    const category = getFileCategory(fileItem.mime_type);
    const iconClass = 'w-8 h-8';

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

    // For folders: clicking the card navigates into the folder
    // For files: clicking the card selects the file
    // (The checkbox will handle selection for both when clicked directly)
    if (isDirectory && onNavigate) {
      onNavigate(item.id);
    } else {
      onSelectionToggle(item.id, isDirectory);
    }
  };

  const handleOpenDirectory = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDirectory && onNavigate) {
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

  const getGradientForType = () => {
    if (isDirectory) return 'from-yellow-400 to-orange-500';

    const category = getFileCategory(fileItem?.mime_type || null);
    switch (category) {
      case 'Image':
        return 'from-pink-400 to-rose-600';
      case 'Video':
        return 'from-purple-400 to-indigo-600';
      case 'Audio':
        return 'from-green-400 to-emerald-600';
      case 'Document':
        return 'from-blue-400 to-cyan-600';
      case 'Archive':
        return 'from-amber-400 to-orange-600';
      default:
        return 'from-slate-400 to-slate-600';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`group relative bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-200 overflow-hidden cursor-pointer ${
        isSelected ? 'ring-2 ring-indigo-500' : ''
      }`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient accent overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative p-4 sm:p-5">
        {/* Selection Checkbox */}
        {(selectionMode || isHovered) && (
          <div
            className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10"
            onClick={(e) => {
              e.stopPropagation();
              onSelectionToggle(item.id, isDirectory);
            }}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
              }}
              className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        )}

        {/* Icon with gradient background */}
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${getGradientForType()} flex items-center justify-center shadow-lg transform transition-transform duration-200 group-hover:scale-110 mb-3 sm:mb-4`}>
          <div className="text-white">{getFileIcon()}</div>
        </div>

        {/* Title and metadata */}
        <div className="mb-2 sm:mb-3">
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors mb-1">
            {isDirectory ? directoryItem?.name : fileItem?.original_filename}
          </h3>

          <div className="space-y-0.5">
            {isDirectory ? (
              <>
                <p className="text-xs text-slate-500">
                  {directoryItem?.file_count || 0} items • {formatFileSize(directoryItem?.total_size || 0)}
                </p>
                <p className="text-xs text-slate-400">
                  {formatRelativeTime(directoryItem?.updated_at || '')}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-500">
                  {formatFileSize(fileItem?.file_size || 0)} • {getFileCategory(fileItem?.mime_type || null)}
                </p>
                <p className="text-xs text-slate-400">
                  {formatRelativeTime(fileItem?.uploaded_at || '')}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Action Menu - Bottom Right */}
        {!selectionMode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/80 backdrop-blur-sm hover:bg-white"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
              {isDirectory && (
                <DropdownMenuItem
                  onClick={handleOpenDirectory}
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Open Folder
                </DropdownMenuItem>
              )}
              {isImage && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShowImage();
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Show Image
                </DropdownMenuItem>
              )}
              {!isDirectory && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload();
                  }}
                  disabled={downloading || deleting}
                >
                  {downloading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {downloading ? 'Downloading...' : 'Download'}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setShowInfo(!showInfo);
                }}
              >
                <Info className="w-4 h-4 mr-2" />
                {showInfo ? 'Hide Details' : 'Show Details'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={downloading || deleting}
                className="text-red-600 focus:text-red-600"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                {deleting ? 'Deleting...' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Detailed Info (Collapsible) */}
        {showInfo && !selectionMode && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-200 space-y-2 sm:space-y-3 text-xs animate-fade-in">
            {!isDirectory && fileItem && (
              <>
                {fileItem.description && (
                  <div>
                    <span className="font-medium text-slate-700">Description:</span>
                    <p className="text-slate-600 mt-1">{fileItem.description}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium text-slate-700">MIME Type:</span>
                  <p className="text-slate-600">{fileItem.mime_type}</p>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Stored as:</span>
                  <p className="text-slate-600 break-all">{fileItem.filename}</p>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Upload Date:</span>
                  <p className="text-slate-600">
                    {new Date(fileItem.uploaded_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-slate-700">ID:</span>
                  <p className="text-slate-600 break-all">{item.id}</p>
                </div>
              </>
            )}
            {isDirectory && directoryItem && (
              <>
                <div>
                  <span className="font-medium text-slate-700">Created:</span>
                  <p className="text-slate-600">
                    {new Date(directoryItem.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Updated:</span>
                  <p className="text-slate-600">
                    {new Date(directoryItem.updated_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-slate-700">ID:</span>
                  <p className="text-slate-600 break-all">{item.id}</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom gradient accent */}
      <div className={`h-1 bg-gradient-to-r ${getGradientForType()} opacity-0 group-hover:opacity-100 transition-opacity`} />

      {/* Image Preview Modal */}
      <Dialog open={showImagePreview} onOpenChange={handleCloseImagePreview}>
        <DialogContent className="max-w-4xl max-h-[95vh] sm:max-h-[90vh] p-0 overflow-hidden w-[95vw] sm:w-auto">
          <DialogHeader className="p-4 sm:p-6 pb-2">
            <DialogTitle className="flex items-center justify-between">
              <span className="truncate text-sm sm:text-base">{fileItem?.original_filename}</span>
              <button
                onClick={handleCloseImagePreview}
                className="ml-2 sm:ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 sm:p-6 pt-2 overflow-auto max-h-[calc(95vh-60px)] sm:max-h-[calc(90vh-80px)]">
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
    </motion.div>
  );
};

export default FileCard;
