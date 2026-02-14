import { useState, useEffect, useRef } from 'react';
import { FolderPlus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
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
    if (!trimmedName) {
      toast.error('Folder name cannot be empty');
      return;
    }

    if (trimmedName.length > 255) {
      toast.error('Folder name is too long (max 255 characters)');
      return;
    }

    setCreating(true);
    try {
      await fileApi.createDirectory(trimmedName, parentDirectoryId);
      toast.success(`Folder "${trimmedName}" created successfully!`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating folder:', error);
      const errorMessage = error.response?.data?.error || 'Failed to create folder';
      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <FolderPlus className="w-6 h-6 text-indigo-600" />
            </div>
            <DialogTitle>New Folder</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="py-4">
            <label htmlFor="folderName" className="block text-sm font-semibold text-slate-700 mb-2">
              Folder Name
            </label>
            <input
              ref={inputRef}
              id="folderName"
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter folder name..."
              className="input-field"
              disabled={creating}
              maxLength={255}
            />
            <p className="mt-2 text-xs text-slate-500">
              {folderName.length}/255 characters
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating || !folderName.trim()}
              className="bg-gradient-to-r from-indigo-500 to-purple-600"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FolderPlus className="w-4 h-4" />
                  Create Folder
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewFolderModal;
