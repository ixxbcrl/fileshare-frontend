import { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import NavBar from './components/NavBar';
import { Sidebar } from './components/Sidebar';
import NewFolderModal from './components/NewFolderModal';
import SelectionToolbar from './components/SelectionToolbar';
import UploadModal from './components/UploadModal';
import HomeView from './components/views/HomeView';
import AllFilesView from './components/views/AllFilesView';
import RecentView from './components/views/RecentView';
import { fileApi } from './services/api';
import type { FileMetadata, DirectoryMetadata, BreadcrumbItem } from './types';
import toast from 'react-hot-toast';

type ViewType = 'home' | 'all-files' | 'recent';

function App() {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [directories, setDirectories] = useState<DirectoryMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // View state
  const [currentView, setCurrentView] = useState<ViewType>('home');

  // Navigation state
  const [currentDirectoryId, setCurrentDirectoryId] = useState<string | null>(null);
  const [breadcrumbPath, setBreadcrumbPath] = useState<BreadcrumbItem[]>([]);

  // Selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [selectedDirectoryIds, setSelectedDirectoryIds] = useState<string[]>([]);

  // Modal state
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Sidebar open state (mobile only)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [globalFiles, setGlobalFiles] = useState<FileMetadata[]>([]);
  const [globalDirectories, setGlobalDirectories] = useState<DirectoryMetadata[]>([]);
  const isSearching = searchQuery.trim() !== '';

  // Recent files state
  const [recentFiles, setRecentFiles] = useState<FileMetadata[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);

  const fetchFiles = useCallback(async (directoryId?: string | null, showToast = false) => {
    try {
      setRefreshing(true);
      const targetDir = directoryId !== undefined ? directoryId : currentDirectoryId;
      const params = targetDir ? `?parent_directory_id=${targetDir}` : '';
      const response = await fetch(`/api/files${params}`);
      if (!response.ok) throw new Error('Failed to fetch files');
      const data = await response.json();
      setFiles(data.files || []);
      setDirectories(data.directories || []);
      if (showToast) toast.success('Files refreshed!');
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to load files. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentDirectoryId]);

  const fetchAllFiles = useCallback(async () => {
    try {
      const allFiles: FileMetadata[] = [];
      const allDirs: DirectoryMetadata[] = [];
      const queue: (string | null)[] = [null];
      while (queue.length > 0) {
        const dirId = queue.shift()!;
        const params = dirId ? `?parent_directory_id=${dirId}` : '';
        const response = await fetch(`/api/files${params}`);
        if (!response.ok) continue;
        const data = await response.json();
        allFiles.push(...(data.files || []));
        allDirs.push(...(data.directories || []));
        for (const dir of (data.directories || [])) queue.push(dir.id);
      }
      setGlobalFiles(allFiles);
      setGlobalDirectories(allDirs);
    } catch (error) {
      console.error('Error fetching all files:', error);
    }
  }, []);

  const fetchRecentFiles = useCallback(async () => {
    setRecentLoading(true);
    try {
      const data = await fileApi.getRecentFiles(20);
      setRecentFiles(data.files);
    } catch (error) {
      console.error('Error fetching recent files:', error);
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSearching) return;
    const timer = setTimeout(() => fetchAllFiles(), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, isSearching, fetchAllFiles]);

  useEffect(() => {
    fetchFiles(currentDirectoryId);
  }, [currentDirectoryId, fetchFiles]);

  useEffect(() => {
    if (currentView === 'recent') fetchRecentFiles();
  }, [currentView, fetchRecentFiles]);

  // Also fetch recent files for home view dashboard
  useEffect(() => {
    if (currentView === 'home') fetchRecentFiles();
  }, [currentView, fetchRecentFiles]);

  const handleUploadSuccess = () => {
    fetchFiles();
    if (currentView === 'home' || currentView === 'recent') fetchRecentFiles();
  };

  const handleDelete = (id: string, isDirectory: boolean) => {
    if (isDirectory) {
      setDirectories((prev) => prev.filter((dir) => dir.id !== id));
    } else {
      setFiles((prev) => prev.filter((file) => file.id !== id));
    }
    setRecentFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleNavigate = async (directoryId: string | null) => {
    if (directoryId === null) {
      setCurrentDirectoryId(null);
      setBreadcrumbPath([]);
      return;
    }
    const existingIndex = breadcrumbPath.findIndex((item) => item.id === directoryId);
    if (existingIndex >= 0) {
      setBreadcrumbPath(breadcrumbPath.slice(0, existingIndex + 1));
      setCurrentDirectoryId(directoryId);
    } else {
      try {
        const response = await fetch(`/api/directories/${directoryId}`);
        if (!response.ok) throw new Error('Failed to fetch directory info');
        const dirInfo: DirectoryMetadata = await response.json();
        setBreadcrumbPath([...breadcrumbPath, { id: directoryId, name: dirInfo.name }]);
        setCurrentDirectoryId(directoryId);
      } catch (error) {
        console.error('Error navigating to directory:', error);
        toast.error('Failed to navigate to directory');
      }
    }
  };

  const handleSelectionToggle = (id: string, isDirectory: boolean) => {
    if (!selectionMode) setSelectionMode(true);
    if (isDirectory) {
      setSelectedDirectoryIds((prev) => {
        const next = prev.includes(id) ? prev.filter((did) => did !== id) : [...prev, id];
        if (next.length === 0 && selectedFileIds.length === 0) setSelectionMode(false);
        return next;
      });
    } else {
      setSelectedFileIds((prev) => {
        const next = prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id];
        if (next.length === 0 && selectedDirectoryIds.length === 0) setSelectionMode(false);
        return next;
      });
    }
  };

  const handleClearSelection = () => {
    setSelectionMode(false);
    setSelectedFileIds([]);
    setSelectedDirectoryIds([]);
  };

  const handleBulkDeleteSuccess = () => {
    fetchFiles();
    if (currentView === 'recent') fetchRecentFiles();
  };

  const handleViewChange = (view: ViewType) => {
    setSidebarOpen(false);
    setCurrentView(view);
    if (view === 'all-files') {
      setCurrentDirectoryId(null);
      setBreadcrumbPath([]);
    }
    if (view !== 'all-files') {
      setSearchQuery('');
    }
  };

  const totalItems = files.length + directories.length;
  const totalSize = files.reduce((sum, f) => sum + f.file_size, 0) +
    directories.reduce((sum, d) => sum + d.total_size, 0);

  const currentDirectoryName = breadcrumbPath.length > 0
    ? breadcrumbPath[breadcrumbPath.length - 1].name
    : null;

  return (
    <div className="bg-surface min-h-screen text-on-surface font-sans">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#ffffff',
            color: '#2e342d',
            borderRadius: '0.125rem',
            border: '1px solid #ecefe7',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#4d6452', secondary: '#e4ffe7' } },
          error: { iconTheme: { primary: '#9f403d', secondary: '#fff7f6' } },
        }}
      />

      {/* Fixed top navbar */}
      <NavBar
        currentView={currentView}
        onViewChange={handleViewChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onUploadClick={() => setIsUploadModalOpen(true)}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      {/* Fixed left sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        onNewFolder={() => setIsNewFolderModalOpen(true)}
        totalItems={totalItems}
        totalSize={totalSize}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area - offset for fixed navbar (h-16) and sidebar (w-64) */}
      <main className="md:ml-64 pt-16 min-h-screen">
        {currentView === 'home' && (
          <HomeView
            files={files}
            directories={directories}
            recentFiles={recentFiles}
            totalSize={totalSize}
            onNavigate={handleNavigate}
            onUploadClick={() => setIsUploadModalOpen(true)}
            onDelete={handleDelete}
            onSelectionToggle={handleSelectionToggle}
            selectionMode={selectionMode}
            selectedFileIds={selectedFileIds}
            selectedDirectoryIds={selectedDirectoryIds}
            onViewAllFiles={() => handleViewChange('all-files')}
          />
        )}

        {currentView === 'all-files' && (
          <AllFilesView
            files={isSearching ? globalFiles : files}
            directories={isSearching ? globalDirectories : directories}
            loading={loading || refreshing}
            onDelete={handleDelete}
            onNavigate={(id) => {
              handleNavigate(id);
            }}
            selectionMode={selectionMode}
            selectedFileIds={selectedFileIds}
            selectedDirectoryIds={selectedDirectoryIds}
            onSelectionToggle={handleSelectionToggle}
            onClearSelection={handleClearSelection}
            onBulkDeleteSuccess={handleBulkDeleteSuccess}
            breadcrumbPath={breadcrumbPath}
            onBreadcrumbNavigate={handleNavigate}
            totalItems={isSearching ? globalFiles.length + globalDirectories.length : totalItems}
            totalSize={totalSize}
            isGlobalSearch={isSearching}
            searchQuery={searchQuery}
            currentDirectoryName={currentDirectoryName}
          />
        )}

        {currentView === 'recent' && (
          <RecentView
            files={recentFiles}
            loading={recentLoading}
            onDelete={handleDelete}
            onNavigate={handleNavigate}
            selectionMode={selectionMode}
            selectedFileIds={selectedFileIds}
            onSelectionToggle={handleSelectionToggle}
          />
        )}
      </main>

      {/* Selection toolbar (shown in recent view too) */}
      {currentView === 'recent' && (
        <div className="md:ml-64 px-8">
          <SelectionToolbar
            selectedFileIds={selectedFileIds}
            selectedDirectoryIds={selectedDirectoryIds}
            onClearSelection={handleClearSelection}
            onDeleteSuccess={handleBulkDeleteSuccess}
            availableFolders={directories}
          />
        </div>
      )}

      {/* Upload modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        currentDirectoryId={currentDirectoryId}
      />

      {/* New folder modal */}
      <NewFolderModal
        isOpen={isNewFolderModalOpen}
        onClose={() => setIsNewFolderModalOpen(false)}
        onSuccess={() => fetchFiles()}
        parentDirectoryId={currentDirectoryId}
      />
    </div>
  );
}

export default App;
