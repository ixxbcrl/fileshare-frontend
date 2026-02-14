import React from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { Button } from './ui/button';

interface TopBarProps {
  onRefresh: () => void;
  refreshing: boolean;
  healthStatus: 'healthy' | 'unhealthy' | 'checking';
}

export const TopBar: React.FC<TopBarProps> = ({ onRefresh, refreshing, healthStatus }) => {
  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200">
      <div className="flex items-center justify-between px-8 py-4">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search files and folders..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Health Status Indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                healthStatus === 'healthy'
                  ? 'bg-green-500'
                  : healthStatus === 'unhealthy'
                  ? 'bg-red-500'
                  : 'bg-yellow-500 animate-pulse'
              }`}
            />
            <span className="text-sm text-slate-600">
              {healthStatus === 'healthy' ? 'Online' : healthStatus === 'unhealthy' ? 'Offline' : 'Checking'}
            </span>
          </div>

          {/* Refresh Button */}
          <Button
            onClick={onRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
};
