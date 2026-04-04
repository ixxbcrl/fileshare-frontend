import { useMemo } from 'react';
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
  viewMode: 'grid' | 'list';
}

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
  viewMode,
}: FileListProps) => {
  const combinedItems = useMemo((): CombinedItem[] => {
    const dirItems: CombinedItem[] = directories.map((dir) => ({ item: dir, isDirectory: true }));
    const fileItems: CombinedItem[] = files.map((file) => ({ item: file, isDirectory: false }));
    return [...dirItems, ...fileItems];
  }, [directories, files]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return combinedItems;
    const query = searchQuery.toLowerCase();
    return combinedItems.filter(({ item, isDirectory }) => {
      if (isDirectory) {
        return (item as DirectoryMetadata).name.toLowerCase().includes(query);
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-surface-container-lowest rounded-sm p-6 h-32 animate-shimmer" />
        ))}
      </div>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-24">
        <span className="material-symbols-outlined text-outline-variant mb-4 block" style={{ fontSize: '64px' }}>
          folder_open
        </span>
        <h3 className="text-lg font-medium text-on-surface mb-2">
          {searchQuery ? 'No items found' : 'No files or folders yet'}
        </h3>
        <p className="text-sm text-on-surface-variant">
          {searchQuery
            ? 'Try adjusting your search query'
            : 'Upload a file or create a folder to get started'}
        </p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map(({ item, isDirectory }) => (
          <FileCard
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
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-on-surface-variant">
            {selectionMode && <th className="pb-4 w-10" />}
            <th className="pb-4 font-medium text-xs uppercase tracking-widest pl-2">Name</th>
            <th className="pb-4 font-medium text-xs uppercase tracking-widest">Status</th>
            <th className="pb-4 font-medium text-xs uppercase tracking-widest hidden sm:table-cell">Size</th>
            <th className="pb-4 font-medium text-xs uppercase tracking-widest hidden md:table-cell">Modified</th>
            <th className="pb-4 font-medium text-xs uppercase tracking-widest text-right pr-2">Actions</th>
          </tr>
          <tr>
            <td colSpan={selectionMode ? 6 : 5} className="p-0">
              <div className="h-[1px] bg-outline-variant/20 w-full" />
            </td>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/10">
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
  );
};

export default FileList;
