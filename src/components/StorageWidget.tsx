import React from 'react';
import { formatFileSize } from '../utils/format';

interface StorageWidgetProps {
  totalSize: number;
  position?: 'fixed' | 'inline';
}

const STORAGE_LIMIT = 50 * 1024 * 1024 * 1024; // 50 GB

const StorageWidget: React.FC<StorageWidgetProps> = ({ totalSize, position = 'inline' }) => {
  const usagePercent = Math.min(Math.round((totalSize / STORAGE_LIMIT) * 100), 100);

  const content = (
    <div className="bg-surface-container-lowest p-4 rounded-sm border border-outline-variant/10 shadow-sm flex flex-col gap-2 w-56">
      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        <span>Storage</span>
        <span>{usagePercent}%</span>
      </div>
      <div className="h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: `${usagePercent}%` }} />
      </div>
      <p className="text-[10px] text-on-surface-variant">
        {formatFileSize(totalSize)} of {formatFileSize(STORAGE_LIMIT)} used
      </p>
    </div>
  );

  if (position === 'fixed') {
    return (
      <div className="fixed bottom-8 right-8 z-40">
        {content}
      </div>
    );
  }

  return content;
};

export default StorageWidget;
