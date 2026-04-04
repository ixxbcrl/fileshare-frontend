import StorageWidget from '../StorageWidget';
import FileCard from '../FileCard';
import type { FileMetadata, DirectoryMetadata } from '../../types';
import { formatRelativeTime } from '../../utils/format';

interface HomeViewProps {
  files: FileMetadata[];
  directories: DirectoryMetadata[];
  recentFiles: FileMetadata[];
  totalSize: number;
  onNavigate: (directoryId: string) => void;
  onUploadClick: () => void;
  onDelete: (id: string, isDirectory: boolean) => void;
  onSelectionToggle: (id: string, isDirectory: boolean) => void;
  selectionMode: boolean;
  selectedFileIds: string[];
  selectedDirectoryIds: string[];
  onViewAllFiles: () => void;
}

const HomeView = ({
  files,
  directories,
  recentFiles,
  totalSize,
  onNavigate,
  onUploadClick,
  onDelete,
  onSelectionToggle,
  selectionMode,
  selectedFileIds,
  selectedDirectoryIds: _selectedDirectoryIds,
  onViewAllFiles,
}: HomeViewProps) => {
  // Show up to 4 recent files for the dashboard grid
  const dashboardFiles = recentFiles.slice(0, 4);
  const recentActivity = recentFiles.slice(0, 4);

  return (
    <div className="pt-8 px-4 md:px-12 pb-12 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Welcome header */}
        <header className="mb-12">
          <h1 className="text-4xl font-light tracking-tight text-on-surface mb-2">
            Welcome to Manuscript.
          </h1>
          <p className="text-on-surface-variant text-sm max-w-lg leading-relaxed">
            Your digital archive. {files.length + directories.length} items in root directory.
          </p>
        </header>

        {/* Main grid */}
        <div className="grid grid-cols-12 gap-8">
          {/* Left column */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            {/* Featured card */}
            <section className="group relative overflow-hidden bg-surface-container-lowest rounded-sm">
              <div className="aspect-[21/9] w-full relative bg-surface-container-high flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-80" />
                <span className="material-symbols-outlined text-outline-variant" style={{ fontSize: '80px' }}>
                  folder_special
                </span>
                <div className="absolute bottom-8 left-8">
                  <span className="bg-primary-container text-on-primary-container px-3 py-1 text-[10px] uppercase tracking-widest font-bold mb-4 inline-block rounded-sm">
                    Your Archive
                  </span>
                  <h2 className="text-2xl font-semibold tracking-tight text-on-surface">
                    Personal File Collection
                  </h2>
                  <p className="text-on-surface-variant text-sm mt-1">
                    {files.length + directories.length} items
                  </p>
                </div>
              </div>
            </section>

            {/* Recent file grid (asymmetric 2-col) */}
            {dashboardFiles.length > 0 ? (
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-8">
                  {dashboardFiles.slice(0, 2).map((file) => (
                    <FileCard
                      key={`dash-${file.id}`}
                      item={file}
                      isDirectory={false}
                      onDelete={onDelete}
                      onNavigate={onNavigate}
                      selectionMode={selectionMode}
                      isSelected={selectedFileIds.includes(file.id)}
                      onSelectionToggle={onSelectionToggle}
                    />
                  ))}
                </div>
                <div className="space-y-8 pt-12">
                  {dashboardFiles.slice(2, 4).map((file) => (
                    <FileCard
                      key={`dash-${file.id}`}
                      item={file}
                      isDirectory={false}
                      onDelete={onDelete}
                      onNavigate={onNavigate}
                      selectionMode={selectionMode}
                      isSelected={selectedFileIds.includes(file.id)}
                      onSelectionToggle={onSelectionToggle}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-surface-container rounded-sm p-12 text-center">
                <span className="material-symbols-outlined text-outline-variant mb-4 block" style={{ fontSize: '48px' }}>
                  cloud_upload
                </span>
                <h3 className="text-lg font-medium text-on-surface mb-2">Start your archive</h3>
                <p className="text-sm text-on-surface-variant mb-6">Upload your first files to get started</p>
                <button
                  onClick={onUploadClick}
                  className="bg-primary text-on-primary px-6 py-2.5 rounded-sm text-sm font-medium hover:bg-primary-dim transition-colors flex items-center gap-2 mx-auto"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>upload</span>
                  Upload Files
                </button>
              </div>
            )}

            {/* View all link */}
            {(files.length + directories.length) > 0 && (
              <button
                onClick={onViewAllFiles}
                className="text-xs font-semibold text-primary flex items-center gap-1 group/btn"
              >
                View All Files
                <span className="material-symbols-outlined transition-transform group-hover/btn:translate-x-1" style={{ fontSize: '14px' }}>
                  arrow_forward
                </span>
              </button>
            )}
          </div>

          {/* Right column */}
          <div className="col-span-12 lg:col-span-4 space-y-12">
            {/* Storage widget */}
            <section>
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">Storage</h3>
                <span className="text-xs text-on-surface font-medium">
                  {Math.min(Math.round((totalSize / (50 * 1024 * 1024 * 1024)) * 100), 100)}% used
                </span>
              </div>
              <StorageWidget totalSize={totalSize} position="inline" />
            </section>

            {/* Recent activity */}
            <section>
              <h3 className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold mb-6">
                Recent Activity
              </h3>
              <div className="space-y-6">
                {recentActivity.length > 0 ? recentActivity.map((file, i) => (
                  <div key={file.id} className="flex gap-4">
                    <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${i === 0 ? 'bg-primary' : 'bg-outline-variant'}`} />
                    <div>
                      <p className="text-sm text-on-surface leading-tight">
                        Uploaded <span className="italic">{file.original_filename}</span>
                      </p>
                      <p className="text-[10px] text-outline-variant mt-1 uppercase tracking-tight">
                        {formatRelativeTime(file.uploaded_at)}
                      </p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-on-surface-variant">No recent activity</p>
                )}
              </div>
              {recentActivity.length > 0 && (
                <button onClick={onViewAllFiles} className="mt-8 text-xs font-semibold text-primary flex items-center gap-1 group/btn">
                  View All Files
                  <span className="material-symbols-outlined transition-transform group-hover/btn:translate-x-1" style={{ fontSize: '14px' }}>arrow_forward</span>
                </button>
              )}
            </section>

            {/* Quick tags */}
            <section className="p-6 bg-surface-container-low rounded-sm">
              <h3 className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold mb-4">Quick Tags</h3>
              <div className="flex flex-wrap gap-2">
                {['Images', 'Documents', 'Videos', 'Archives', 'Audio'].map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-surface-container-highest text-[10px] font-bold text-on-surface-variant rounded-full uppercase tracking-tighter cursor-not-allowed"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={onUploadClick}
        className="fixed bottom-8 right-8 h-14 w-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-50 group"
        title="Upload New Item"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>add</span>
        <span className="absolute right-full mr-4 bg-on-background text-surface text-[10px] uppercase tracking-widest px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap rounded-sm">
          Upload New Item
        </span>
      </button>
    </div>
  );
};

export default HomeView;
