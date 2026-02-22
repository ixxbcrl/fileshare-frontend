import { useState, useMemo } from 'react';
import { Search, Grid, List as ListIcon, FolderOpen, Globe } from 'lucide-react';
import type { FileMetadata, DirectoryMetadata } from '../types';
import FileCard from './FileCard';
import FileTableRow from './FileTableRow';

interface FileListProps {
  files: FileMetadata[];
  directories: DirectoryMetadata[];
  loading: boolean;
  onDelete: (id: string, isDirectory: boolean) => void;
  onNavigate: (directoryId: string) => void;
  selectionMode: boolean;
  selectedFileIds: string[];
  selectedDirectoryIds: string[];
  onSelectionToggle: (id: string, isDirectory: boolean) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isGlobalSearch: boolean;
}

type ViewMode = 'grid' | 'list';

interface CombinedItem {
  item: FileMetadata | DirectoryMetadata;
  isDirectory: boolean;
}

const FileList = ({
  files,
  directories,
  loading,
  onDelete,
  onNavigate,
  selectionMode,
  selectedFileIds,
  selectedDirectoryIds,
  onSelectionToggle,
  searchQuery,
  onSearchChange,
  isGlobalSearch,
}: FileListProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Combine directories and files, with directories appearing first
  const combinedItems = useMemo((): CombinedItem[] => {
    const dirItems: CombinedItem[] = directories.map((dir) => ({
      item: dir,
      isDirectory: true,
    }));
    const fileItems: CombinedItem[] = files.map((file) => ({
      item: file,
      isDirectory: false,
    }));
    return [...dirItems, ...fileItems];
  }, [directories, files]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return combinedItems;

    const query = searchQuery.toLowerCase();
    return combinedItems.filter(({ item, isDirectory }) => {
      if (isDirectory) {
        const dir = item as DirectoryMetadata;
        return dir.name.toLowerCase().includes(query);
      } else {
        const file = item as FileMetadata;
        return (
          file.original_filename.toLowerCase().includes(query) ||
          file.description?.toLowerCase().includes(query) ||
          file.mime_type?.toLowerCase().includes(query)
        );
      }
    });
  }, [combinedItems, searchQuery]);

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Your Files
            <span className="ml-2 sm:ml-3 text-base sm:text-lg font-normal text-slate-500">
              ({filteredItems.length})
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search all files..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full sm:w-48 md:w-64 pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
            {isGlobalSearch && (
              <div className="absolute left-0 top-full mt-1 flex items-center gap-1 text-xs text-indigo-600 font-medium">
                <Globe className="w-3 h-3" />
                Searching all files
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
              title="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
              title="List view"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* File Display */}
      {filteredItems.length === 0 ? (
        <div className="card text-center py-12">
          <FolderOpen className="w-24 h-24 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {searchQuery ? 'No items found' : 'No files or folders yet'}
          </h3>
          <p className="text-gray-500">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Create a folder or upload your first file to get started'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredItems.map(({ item, isDirectory }) => (
            <div key={`${isDirectory ? 'dir' : 'file'}-${item.id}`}>
              <FileCard
                item={item}
                isDirectory={isDirectory}
                onDelete={onDelete}
                onNavigate={onNavigate}
                selectionMode={selectionMode}
                isSelected={
                  isDirectory
                    ? selectedDirectoryIds.includes(item.id)
                    : selectedFileIds.includes(item.id)
                }
                onSelectionToggle={onSelectionToggle}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-3 w-12"></th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                    Size
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                    Type
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                    Modified
                  </th>
                  {!selectionMode && (
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.map(({ item, isDirectory }) => (
                  <FileTableRow
                    key={`${isDirectory ? 'dir' : 'file'}-${item.id}`}
                    item={item}
                    isDirectory={isDirectory}
                    onDelete={onDelete}
                    onNavigate={onNavigate}
                    selectionMode={selectionMode}
                    isSelected={
                      isDirectory
                        ? selectedDirectoryIds.includes(item.id)
                        : selectedFileIds.includes(item.id)
                    }
                    onSelectionToggle={onSelectionToggle}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileList;
