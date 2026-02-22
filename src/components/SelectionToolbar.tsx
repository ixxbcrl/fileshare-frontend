import { useState, useRef, useEffect } from 'react';
import { Trash2, X, Loader2, FolderInput, ChevronDown } from 'lucide-react';
import { fileApi } from '../services/api';
import toast from 'react-hot-toast';
import type { DirectoryMetadata } from '../types';

interface SelectionToolbarProps {
  selectedFileIds: string[];
  selectedDirectoryIds: string[];
  onClearSelection: () => void;
  onDeleteSuccess: () => void;
  availableFolders: DirectoryMetadata[];
}

const SelectionToolbar = ({
  selectedFileIds,
  selectedDirectoryIds,
  onClearSelection,
  onDeleteSuccess,
  availableFolders,
}: SelectionToolbarProps) => {
  const [deleting, setDeleting] = useState(false);
  const [moving, setMoving] = useState(false);
  const [moveDropdownOpen, setMoveDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const totalSelected = selectedFileIds.length + selectedDirectoryIds.length;

  // Exclude selected directories from move targets (can't move a folder into itself)
  const moveTargets = availableFolders.filter(
    (folder) => !selectedDirectoryIds.includes(folder.id)
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMoveDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleBulkMove = async (targetDirectoryId: string, targetName: string) => {
    setMoveDropdownOpen(false);
    setMoving(true);
    try {
      await Promise.all(
        selectedFileIds.map((fileId) => fileApi.moveFile(fileId, targetDirectoryId))
      );
      await Promise.all(
        selectedDirectoryIds.map((dirId) => fileApi.moveDirectory(dirId, targetDirectoryId))
      );

      toast.success(`Successfully moved ${totalSelected} item(s) to "${targetName}"`);
      onDeleteSuccess();
      onClearSelection();
    } catch (error: any) {
      console.error('Bulk move error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to move selected items';
      toast.error(errorMessage);
    } finally {
      setMoving(false);
    }
  };

  if (totalSelected === 0) {
    return null;
  }

  const isBusy = deleting || moving;

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
          {/* Move to folder dropdown */}
          {moveTargets.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setMoveDropdownOpen((prev) => !prev)}
                disabled={isBusy}
                className="btn-secondary flex items-center space-x-2"
              >
                {moving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Moving...</span>
                  </>
                ) : (
                  <>
                    <FolderInput className="w-4 h-4" />
                    <span>Move to folder</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${moveDropdownOpen ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>

              {moveDropdownOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                  {moveTargets.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => handleBulkMove(folder.id, folder.name)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <FolderInput className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="truncate">Move to {folder.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleBulkDelete}
            disabled={isBusy}
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
            disabled={isBusy}
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
            disabled={isBusy}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Mobile move options */}
        {moveTargets.length > 0 && (
          <div className="mb-2 space-y-1">
            {moveTargets.map((folder) => (
              <button
                key={folder.id}
                onClick={() => handleBulkMove(folder.id, folder.name)}
                disabled={isBusy}
                className="btn-secondary w-full flex items-center justify-center space-x-2"
              >
                {moving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Moving...</span>
                  </>
                ) : (
                  <>
                    <FolderInput className="w-5 h-5" />
                    <span className="truncate">Move to {folder.name}</span>
                  </>
                )}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={handleBulkDelete}
          disabled={isBusy}
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
