import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import FileUpload from './FileUpload';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  currentDirectoryId: string | null;
}

const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  currentDirectoryId,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-surface-container-lowest border border-outline-variant/20">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>
              upload_file
            </span>
            <DialogTitle className="text-on-surface font-semibold tracking-tight">
              Upload Files
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="py-4">
          <FileUpload
            onUploadSuccess={() => {
              onUploadSuccess();
              onClose();
            }}
            currentDirectoryId={currentDirectoryId}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;
