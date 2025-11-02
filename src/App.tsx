import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { HardDrive, RefreshCw, Activity, FolderPlus } from 'lucide-react';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import Breadcrumb from './components/Breadcrumb';
import NewFolderModal from './components/NewFolderModal';
import SelectionToolbar from './components/SelectionToolbar';
import type { FileMetadata, DirectoryMetadata, BreadcrumbItem } from './types';
import toast from 'react-hot-toast';

function App() {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [directories, setDirectories] = useState<DirectoryMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'unhealthy' | 'checking'>('checking');

  // Navigation state
  const [currentDirectoryId, setCurrentDirectoryId] = useState<string | null>(null);
  const [breadcrumbPath, setBreadcrumbPath] = useState<BreadcrumbItem[]>([]);

  // Selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [selectedDirectoryIds, setSelectedDirectoryIds] = useState<string[]>([]);

  // Modal state
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);

  const fetchFiles = async (showToast = false, directoryId: string | null = currentDirectoryId) => {
    try {
      setRefreshing(true);
      const params = directoryId ? `?parent_directory_id=${directoryId}` : '';
      const response = await fetch(`/api/files${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }

      const data = await response.json();
      setFiles(data.files || []);
      setDirectories(data.directories || []);

      if (showToast) {
        toast.success('Files refreshed successfully!');
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to load files. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const checkHealth = async () => {
    try {
      const response = await fetch('/health');

      if (!response.ok) {
        throw new Error('Health check failed');
      }

      const data = await response.json();
      if (data.status === 'healthy') {
        setHealthStatus('healthy');
      } else {
        setHealthStatus('unhealthy');
      }
    } catch (error) {
      console.error('Health check error:', error);
      setHealthStatus('unhealthy');
    }
  };

  useEffect(() => {
    fetchFiles();
    checkHealth();

    // Check health every 30 seconds
    const healthInterval = setInterval(checkHealth, 30000);

    return () => clearInterval(healthInterval);
  }, []);

  useEffect(() => {
    // Fetch files whenever the current directory changes
    fetchFiles(false, currentDirectoryId);
  }, [currentDirectoryId]);

  const handleUploadSuccess = () => {
    fetchFiles();
  };

  const handleDelete = (id: string, isDirectory: boolean) => {
    if (isDirectory) {
      setDirectories((prevDirs) => prevDirs.filter((dir) => dir.id !== id));
    } else {
      setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
    }
  };

  const handleRefresh = () => {
    fetchFiles(true);
  };

  const handleNavigate = async (directoryId: string | null) => {
    // If navigating to a directory, we need to build the breadcrumb path
    if (directoryId === null) {
      // Going to root
      setCurrentDirectoryId(null);
      setBreadcrumbPath([]);
      return;
    }

    // Check if this directory is already in the breadcrumb path
    const existingIndex = breadcrumbPath.findIndex((item) => item.id === directoryId);

    if (existingIndex >= 0) {
      // Navigate back to an existing directory in the path
      setBreadcrumbPath(breadcrumbPath.slice(0, existingIndex + 1));
      setCurrentDirectoryId(directoryId);
    } else {
      // Navigate to a new directory
      try {
        const response = await fetch(`/api/directories/${directoryId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch directory info');
        }
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
    if (!selectionMode) {
      // Enter selection mode and select this item
      setSelectionMode(true);
    }

    if (isDirectory) {
      setSelectedDirectoryIds((prev) =>
        prev.includes(id) ? prev.filter((did) => did !== id) : [...prev, id]
      );
    } else {
      setSelectedFileIds((prev) =>
        prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
      );
    }
  };

  const handleClearSelection = () => {
    setSelectionMode(false);
    setSelectedFileIds([]);
    setSelectedDirectoryIds([]);
  };

  const handleBulkDeleteSuccess = () => {
    fetchFiles();
  };

  const totalItems = files.length + directories.length;
  const totalSize = files.reduce((sum, file) => sum + file.file_size, 0) +
    directories.reduce((sum, dir) => sum + dir.total_size, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#363636',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-3 rounded-xl">
                <HardDrive className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">FileShare</h1>
                <p className="text-sm text-gray-600">
                  Secure file sharing on Raspberry Pi
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Health Status */}
              <div className="flex items-center space-x-2">
                <Activity
                  className={`w-5 h-5 ${
                    healthStatus === 'healthy'
                      ? 'text-green-500'
                      : healthStatus === 'unhealthy'
                      ? 'text-red-500'
                      : 'text-gray-400'
                  }`}
                />
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  {healthStatus === 'healthy'
                    ? 'Connected'
                    : healthStatus === 'unhealthy'
                    ? 'Disconnected'
                    : 'Checking...'}
                </span>
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="btn-secondary flex items-center space-x-2"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Breadcrumb Navigation */}
          {breadcrumbPath.length > 0 && (
            <div className="card">
              <Breadcrumb path={breadcrumbPath} onNavigate={handleNavigate} />
            </div>
          )}

          {/* Upload Section and New Folder Button */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <FileUpload onUploadSuccess={handleUploadSuccess} currentDirectoryId={currentDirectoryId} />
            </div>
            <div className="card flex items-center justify-center">
              <button
                onClick={() => setIsNewFolderModalOpen(true)}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                <FolderPlus className="w-5 h-5" />
                <span>New Folder</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <HardDrive className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-gray-800">{totalItems}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Size</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {(totalSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <HardDrive className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {healthStatus === 'healthy' ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Selection Toolbar */}
          <SelectionToolbar
            selectedFileIds={selectedFileIds}
            selectedDirectoryIds={selectedDirectoryIds}
            onClearSelection={handleClearSelection}
            onDeleteSuccess={handleBulkDeleteSuccess}
          />

          {/* File List */}
          <FileList
            files={files}
            directories={directories}
            loading={loading}
            onDelete={handleDelete}
            onNavigate={handleNavigate}
            selectionMode={selectionMode}
            selectedFileIds={selectedFileIds}
            selectedDirectoryIds={selectedDirectoryIds}
            onSelectionToggle={handleSelectionToggle}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p className="text-sm">
              FileShare - Built with React + TypeScript + Tailwind CSS
            </p>
            <p className="text-xs mt-1">
              Backend: Rust (Axum) | Running on Raspberry Pi
            </p>
          </div>
        </div>
      </footer>

      {/* New Folder Modal */}
      <NewFolderModal
        isOpen={isNewFolderModalOpen}
        onClose={() => setIsNewFolderModalOpen(false)}
        onSuccess={() => {
          fetchFiles();
        }}
        parentDirectoryId={currentDirectoryId}
      />
    </div>
  );
}

export default App;
