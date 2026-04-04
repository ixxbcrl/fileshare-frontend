import { useState } from 'react';
import Breadcrumb from '../Breadcrumb';
import FileList from '../FileList';
import StorageWidget from '../StorageWidget';
import SelectionToolbar from '../SelectionToolbar';
import type { FileMetadata, DirectoryMetadata, BreadcrumbItem } from '../../types';

interface AllFilesViewProps {
  files: FileMetadata[];
  directories: DirectoryMetadata[];
  loading: boolean;
  onDelete: (id: string, isDirectory: boolean) => void;
  onNavigate: (directoryId: string) => void;
  selectionMode: boolean;
  selectedFileIds: string[];
  selectedDirectoryIds: string[];
  onSelectionToggle: (id: string, isDirectory: boolean) => void;
  onClearSelection: () => void;
  onBulkDeleteSuccess: () => void;
  breadcrumbPath: BreadcrumbItem[];
  onBreadcrumbNavigate: (directoryId: string | null) => void;
  totalItems: number;
  totalSize: number;
  isGlobalSearch: boolean;
  searchQuery: string;
  currentDirectoryName: string | null;
}

const AllFilesView = ({
  files,
  directories,
  loading,
  onDelete,
  onNavigate,
  selectionMode,
  selectedFileIds,
  selectedDirectoryIds,
  onSelectionToggle,
  onClearSelection,
  onBulkDeleteSuccess,
  breadcrumbPath,
  onBreadcrumbNavigate,
  totalItems,
  totalSize,
  isGlobalSearch,
  searchQuery,
  currentDirectoryName,
}: AllFilesViewProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const title = currentDirectoryName ?? 'All Files';
  const subtitle = isGlobalSearch
    ? `Search results for "${searchQuery}"`
    : `${totalItems} items stored in your archive`;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
      {/* Breadcrumbs + Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          {breadcrumbPath.length > 0 && (
            <div className="mb-4">
              <Breadcrumb path={breadcrumbPath} onNavigate={onBreadcrumbNavigate} />
            </div>
          )}
          {breadcrumbPath.length === 0 && (
            <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-4">
              <span>Library</span>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chevron_right</span>
              <span className="text-on-surface font-medium">All Files</span>
            </nav>
          )}
          <h1 className="text-4xl font-bold tracking-tighter text-on-background mb-2">{title}</h1>
          <p className="text-sm text-on-surface-variant">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-surface-container rounded-sm p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-sm transition-colors ${
                viewMode === 'grid'
                  ? 'bg-surface-container-lowest shadow-sm text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title="Grid view"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-sm transition-colors ${
                viewMode === 'list'
                  ? 'bg-surface-container-lowest shadow-sm text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title="List view"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>list</span>
            </button>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-high text-on-surface text-sm rounded-sm hover:bg-surface-variant transition-colors cursor-not-allowed opacity-60">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>filter_list</span>
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-high text-on-surface text-sm rounded-sm hover:bg-surface-variant transition-colors cursor-not-allowed opacity-60">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sort</span>
            Date Modified
          </button>
        </div>
      </div>

      {/* Selection toolbar */}
      <SelectionToolbar
        selectedFileIds={selectedFileIds}
        selectedDirectoryIds={selectedDirectoryIds}
        onClearSelection={onClearSelection}
        onDeleteSuccess={onBulkDeleteSuccess}
        availableFolders={directories}
      />

      {/* File grid/list */}
      <FileList
        files={files}
        directories={directories}
        loading={loading}
        onDelete={onDelete}
        onNavigate={onNavigate}
        selectionMode={selectionMode}
        selectedFileIds={selectedFileIds}
        selectedDirectoryIds={selectedDirectoryIds}
        onSelectionToggle={onSelectionToggle}
        searchQuery={searchQuery}
        viewMode={viewMode}
      />

      {/* Fixed storage widget */}
      <StorageWidget totalSize={totalSize} position="fixed" />
    </div>
  );
};

export default AllFilesView;
