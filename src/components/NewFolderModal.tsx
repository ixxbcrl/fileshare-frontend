import { useState, useEffect, useRef } from 'react';
import { FolderPlus, X, Loader2 } from 'lucide-react';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FolderPlus className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">New Folder</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={creating}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div>
            <label htmlFor="folderName" className="block text-sm font-semibold text-gray-700 mb-2">
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
            <p className="mt-2 text-xs text-gray-500">
              {folderName.length}/255 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center space-x-2"
              disabled={creating || !folderName.trim()}
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <FolderPlus className="w-4 h-4" />
                  <span>Create Folder</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewFolderModal;
