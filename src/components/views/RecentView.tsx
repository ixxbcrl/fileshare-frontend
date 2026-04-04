import type { FileMetadata, DirectoryMetadata } from '../../types';
import FileTableRow from '../FileTableRow';
import { formatRelativeTime } from '../../utils/format';

interface RecentViewProps {
  files: FileMetadata[];
  loading: boolean;
  onDelete: (id: string, isDirectory: boolean) => void;
  onNavigate: (directoryId: string) => void;
  selectionMode: boolean;
  selectedFileIds: string[];
  onSelectionToggle: (id: string, isDirectory: boolean) => void;
}

const RecentView = ({
  files,
  loading,
  onDelete,
  onNavigate,
  selectionMode,
  selectedFileIds,
  onSelectionToggle,
}: RecentViewProps) => {
  const lastSync = files.length > 0 ? formatRelativeTime(files[0].uploaded_at) : 'Never';

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
      {/* Header */}
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter text-on-background mb-2">My Archive</h1>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>sync</span>
            <span className="text-xs font-medium tracking-wide">
              Last Upload: {lastSync}
            </span>
          </div>
        </div>
        <button className="bg-surface-container-high text-on-surface px-5 py-2 text-sm font-medium rounded-sm hover:bg-surface-container-highest transition-colors flex items-center gap-2 cursor-not-allowed opacity-60">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sort</span>
          Sort
        </button>
      </header>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-surface-container-low rounded-sm animate-shimmer" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-24">
          <span className="material-symbols-outlined text-outline-variant mb-4 block" style={{ fontSize: '64px' }}>
            history
          </span>
          <h3 className="text-lg font-medium text-on-surface mb-2">No recent files</h3>
          <p className="text-sm text-on-surface-variant">Upload files to see them here</p>
        </div>
      ) : (
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
              {files.map((file) => (
                <FileTableRow
                  key={`file-${file.id}`}
                  item={file}
                  isDirectory={false}
                  onDelete={onDelete}
                  onNavigate={onNavigate}
                  selectionMode={selectionMode}
                  isSelected={selectedFileIds.includes(file.id)}
                  onSelectionToggle={onSelectionToggle}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pinned Assets - static placeholder section */}
      <div className="mt-24">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-8">
          Pinned Assets
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 aspect-[16/7] relative overflow-hidden bg-surface-container rounded-sm flex items-center justify-center">
            <div className="text-center p-8">
              <span className="material-symbols-outlined text-outline-variant mb-3 block" style={{ fontSize: '48px' }}>
                push_pin
              </span>
              <h4 className="text-sm font-bold uppercase tracking-[0.3em] mb-2 text-on-surface-variant">
                No Pinned Files
              </h4>
              <p className="text-xs text-on-surface-variant">
                Pinned files will appear here
              </p>
            </div>
          </div>
          <div className="aspect-square bg-surface-container-high p-6 flex flex-col justify-between rounded-sm">
            <span className="material-symbols-outlined text-outline-variant" style={{ fontSize: '32px', fontVariationSettings: "'FILL' 1" }}>
              star
            </span>
            <div>
              <h4 className="text-sm font-bold tracking-tight mb-1 text-on-surface-variant">Starred Files</h4>
              <p className="text-xs text-on-surface-variant">Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Satisfy TypeScript - DirectoryMetadata is used in FileTableRow
const _: DirectoryMetadata | null = null;
void _;

export default RecentView;
