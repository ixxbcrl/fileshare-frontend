import { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
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
  const moveTargets = availableFolders.filter((f) => !selectedDirectoryIds.includes(f.id));

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
    let msg = 'Delete ';
    if (fileCount > 0 && dirCount > 0) msg += `${fileCount} file(s) and ${dirCount} folder(s)?`;
    else if (fileCount > 0) msg += `${fileCount} file(s)?`;
    else msg += `${dirCount} folder(s)?`;
    msg += '\n\nFolders and all contents will be permanently removed.';
    if (!window.confirm(msg)) return;

    setDeleting(true);
    try {
      const response = await fileApi.bulkDelete(selectedFileIds, selectedDirectoryIds);
      toast.success(`Deleted ${response.deleted_files} file(s) and ${response.deleted_directories} folder(s)`);
      onDeleteSuccess();
      onClearSelection();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete selected items');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkMove = async (targetDirectoryId: string, targetName: string) => {
    setMoveDropdownOpen(false);
    setMoving(true);
    try {
      await Promise.all(selectedFileIds.map((id) => fileApi.moveFile(id, targetDirectoryId)));
      await Promise.all(selectedDirectoryIds.map((id) => fileApi.moveDirectory(id, targetDirectoryId)));
      toast.success(`Moved ${totalSelected} item(s) to "${targetName}"`);
      onDeleteSuccess();
      onClearSelection();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to move selected items');
    } finally {
      setMoving(false);
    }
  };

  if (totalSelected === 0) return null;

  const isBusy = deleting || moving;

  return (
    <>
      {/* Desktop toolbar */}
      <div className="hidden sm:flex items-center justify-between bg-surface-container border border-outline-variant/20 rounded-sm p-4 mb-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-on-surface">
            {totalSelected} item(s) selected
          </span>
          {selectedFileIds.length > 0 && (
            <span className="text-xs text-on-surface-variant">{selectedFileIds.length} file(s)</span>
          )}
          {selectedDirectoryIds.length > 0 && (
            <span className="text-xs text-on-surface-variant">{selectedDirectoryIds.length} folder(s)</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Move to folder */}
          {moveTargets.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setMoveDropdownOpen((prev) => !prev)}
                disabled={isBusy}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-surface-container-high text-on-surface rounded-sm hover:bg-surface-variant transition-colors disabled:opacity-50"
              >
                {moving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Moving...</span></>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>drive_file_move</span>
                    <span>Move to folder</span>
                    <span className="material-symbols-outlined transition-transform" style={{ fontSize: '16px', transform: moveDropdownOpen ? 'rotate(180deg)' : 'none' }}>
                      expand_more
                    </span>
                  </>
                )}
              </button>
              {moveDropdownOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-surface-container-lowest border border-outline-variant/20 rounded-sm shadow-lg z-50 py-1">
                  {moveTargets.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => handleBulkMove(folder.id, folder.name)}
                      className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '16px' }}>folder</span>
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
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-error-container/20 text-error rounded-sm hover:bg-error-container/30 transition-colors disabled:opacity-50"
          >
            {deleting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span>Deleting...</span></>
            ) : (
              <><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span><span>Delete</span></>
            )}
          </button>

          <button
            onClick={onClearSelection}
            disabled={isBusy}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
            <span>Cancel</span>
          </button>
        </div>
      </div>

      {/* Mobile floating bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant/10 shadow-lg p-4 z-40 animate-slide-up">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-on-surface">{totalSelected} selected</span>
          <button onClick={onClearSelection} disabled={isBusy} className="p-2 hover:bg-surface-container rounded-full transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        {moveTargets.length > 0 && (
          <div className="mb-2 space-y-1">
            {moveTargets.map((folder) => (
              <button
                key={folder.id}
                onClick={() => handleBulkMove(folder.id, folder.name)}
                disabled={isBusy}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-surface-container text-on-surface rounded-sm hover:bg-surface-container-high transition-colors disabled:opacity-50"
              >
                {moving ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>drive_file_move</span>
                )}
                <span className="truncate">Move to {folder.name}</span>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={handleBulkDelete}
          disabled={isBusy}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-error-container/20 text-error rounded-sm hover:bg-error-container/30 transition-colors disabled:opacity-50"
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
          )}
          Delete Selected
        </button>
      </div>
    </>
  );
};

export default SelectionToolbar;
