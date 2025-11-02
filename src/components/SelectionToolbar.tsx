import { useState } from 'react';
import { Trash2, X, Loader2 } from 'lucide-react';
import { fileApi } from '../services/api';
import toast from 'react-hot-toast';

interface SelectionToolbarProps {
  selectedFileIds: string[];
  selectedDirectoryIds: string[];
  onClearSelection: () => void;
  onDeleteSuccess: () => void;
}

const SelectionToolbar = ({
  selectedFileIds,
  selectedDirectoryIds,
  onClearSelection,
  onDeleteSuccess,
}: SelectionToolbarProps) => {
  const [deleting, setDeleting] = useState(false);

  const totalSelected = selectedFileIds.length + selectedDirectoryIds.length;

  const handleBulkDelete = async () => {
    const fileCount = selectedFileIds.length;
    const dirCount = selectedDirectoryIds.length;

    let confirmMessage = 'Are you sure you want to delete ';
    if (fileCount > 0 && dirCount > 0) {
      confirmMessage += `${fileCount} file(s) and ${dirCount} folder(s)?`;
    } else if (fileCount > 0) {
      confirmMessage += `${fileCount} file(s)?`;
    } else {
      confirmMessage += `${dirCount} folder(s)?`;
    }

    confirmMessage += '\n\nDeleting folders will also delete all files inside them. This action cannot be undone.';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fileApi.bulkDelete(selectedFileIds, selectedDirectoryIds);

      toast.success(
        `Successfully deleted ${response.deleted_files} file(s) and ${response.deleted_directories} folder(s)`
      );

      onDeleteSuccess();
      onClearSelection();
    } catch (error: any) {
      console.error('Bulk delete error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete selected items';
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  if (totalSelected === 0) {
    return null;
  }

  return (
    <>
      {/* Desktop Toolbar */}
      <div className="hidden sm:flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-semibold text-blue-900">
            {totalSelected} item(s) selected
          </span>
          {selectedFileIds.length > 0 && (
            <span className="text-xs text-blue-700">
              {selectedFileIds.length} file(s)
            </span>
          )}
          {selectedDirectoryIds.length > 0 && (
            <span className="text-xs text-blue-700">
              {selectedDirectoryIds.length} folder(s)
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleBulkDelete}
            disabled={deleting}
            className="btn-danger flex items-center space-x-2"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Selected</span>
              </>
            )}
          </button>

          <button
            onClick={onClearSelection}
            disabled={deleting}
            className="btn-secondary flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        </div>
      </div>

      {/* Mobile Floating Action Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-40 animate-slide-up">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-900">
            {totalSelected} selected
          </span>
          <button
            onClick={onClearSelection}
            disabled={deleting}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <button
          onClick={handleBulkDelete}
          disabled={deleting}
          className="btn-danger w-full flex items-center justify-center space-x-2"
        >
          {deleting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Deleting...</span>
            </>
          ) : (
            <>
              <Trash2 className="w-5 h-5" />
              <span>Delete Selected</span>
            </>
          )}
        </button>
      </div>
    </>
  );
};

export default SelectionToolbar;
