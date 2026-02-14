import React from 'react';
import { FolderPlus, Files, HardDrive, Activity } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { formatFileSize } from '../utils/format';

interface SidebarProps {
  currentDirectoryId: string | null;
  onNavigate: (directoryId: string | null) => void;
  onNewFolder: () => void;
  totalItems: number;
  totalSize: number;
  healthStatus: 'healthy' | 'unhealthy' | 'checking';
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentDirectoryId,
  onNavigate,
  onNewFolder,
  totalItems,
  totalSize,
  healthStatus,
}) => {
  const storageLimit = 10 * 1024 * 1024 * 1024; // 10GB example limit
  const usagePercentage = (totalSize / storageLimit) * 100;

  return (
    <div className="w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col border-r border-slate-700">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="relative">
            <HardDrive className="w-8 h-8 text-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full" />
          </div>
          <div>
            <h1 className="text-lg font-bold">FileShare</h1>
            <p className="text-xs text-slate-400">Cloud Storage</p>
          </div>
        </div>
      </div>

      {/* New Folder Button */}
      <div className="p-4">
        <Button
          onClick={onNewFolder}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/30"
        >
          <FolderPlus className="w-4 h-4" />
          New Folder
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2">
        <button
          onClick={() => onNavigate(null)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
            currentDirectoryId === null
              ? 'bg-gradient-to-r from-indigo-500/20 to-purple-600/20 text-white border border-indigo-500/30'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Files className="w-5 h-5" />
          <span className="font-medium">All Files</span>
        </button>
      </nav>

      {/* Storage Stats */}
      <div className="p-4 border-t border-slate-700 space-y-4">
        {/* Health Status */}
        <div className="flex items-center gap-2 text-sm">
          <Activity className="w-4 h-4" />
          <span className="text-slate-400">Status:</span>
          <span
            className={`font-semibold ${
              healthStatus === 'healthy'
                ? 'text-green-400'
                : healthStatus === 'unhealthy'
                ? 'text-red-400'
                : 'text-yellow-400'
            }`}
          >
            {healthStatus === 'healthy' ? 'Healthy' : healthStatus === 'unhealthy' ? 'Unhealthy' : 'Checking...'}
          </span>
        </div>

        {/* Storage Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Storage</span>
            <span className="text-white font-medium">{usagePercentage.toFixed(1)}%</span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{formatFileSize(totalSize)}</span>
            <span>{formatFileSize(storageLimit)}</span>
          </div>
        </div>

        {/* File Count */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Total Items</span>
          <span className="text-white font-medium">{totalItems}</span>
        </div>
      </div>
    </div>
  );
};
