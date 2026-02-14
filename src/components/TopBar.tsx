import React from 'react';
import { RefreshCw, Search, Menu } from 'lucide-react';
import { Button } from './ui/button';

interface TopBarProps {
  onRefresh: () => void;
  refreshing: boolean;
  healthStatus: 'healthy' | 'unhealthy' | 'checking';
  onToggleSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onRefresh, refreshing, healthStatus, onToggleSidebar }) => {
  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        {/* Mobile Menu Button & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6 text-slate-700" />
          </button>
          <div className="lg:hidden flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">FileShare</h1>
          </div>
        </div>

        {/* Search - Hidden on mobile */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search files and folders..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Health Status Indicator - Hidden on small mobile */}
          <div className="hidden sm:flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                healthStatus === 'healthy'
                  ? 'bg-green-500'
                  : healthStatus === 'unhealthy'
                  ? 'bg-red-500'
                  : 'bg-yellow-500 animate-pulse'
              }`}
            />
            <span className="text-sm text-slate-600 hidden md:inline">
              {healthStatus === 'healthy' ? 'Online' : healthStatus === 'unhealthy' ? 'Offline' : 'Checking'}
            </span>
          </div>

          {/* Refresh Button */}
          <Button
            onClick={onRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="min-w-0"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline ml-2">Refresh</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
