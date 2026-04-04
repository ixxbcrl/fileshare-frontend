import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { fileApi } from '../services/api';
import toast from 'react-hot-toast';

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parentDirectoryId: string | null;
}

const NewFolderModal = ({ isOpen, onClose, onSuccess, parentDirectoryId }: NewFolderModalProps) => {
  const [folderName, setFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFolderName('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = folderName.trim();
    if (!trimmedName) { toast.error('Folder name cannot be empty'); return; }
    if (trimmedName.length > 255) { toast.error('Folder name is too long (max 255 characters)'); return; }

    setCreating(true);
    try {
      await fileApi.createDirectory(trimmedName, parentDirectoryId);
      toast.success(`Folder "${trimmedName}" created!`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create folder');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-surface-container-lowest border border-outline-variant/20">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary-container p-2 rounded-sm">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '22px' }}>
                create_new_folder
              </span>
            </div>
            <DialogTitle className="text-on-surface font-semibold tracking-tight">New Folder</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="py-4">
            <label htmlFor="folderName" className="block text-sm font-medium text-on-surface mb-2">
              Folder Name
            </label>
            <input
              ref={inputRef}
              id="folderName"
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && onClose()}
              placeholder="Enter folder name..."
              className="w-full bg-surface-container-low border-none rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-on-surface placeholder:text-outline-variant"
              disabled={creating}
              maxLength={255}
            />
            <p className="mt-2 text-xs text-on-surface-variant">
              {folderName.length}/255 characters
            </p>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="px-4 py-2 text-sm font-medium text-on-surface-variant border border-outline-variant rounded-sm hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !folderName.trim()}
              className="px-4 py-2 text-sm font-medium bg-primary text-on-primary rounded-sm hover:bg-primary-dim transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {creating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
              ) : (
                <><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>create_new_folder</span> Create Folder</>
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewFolderModal;
