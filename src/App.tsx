import { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { motion } from 'motion/react';
import { Upload } from 'lucide-react';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import Breadcrumb from './components/Breadcrumb';
import NewFolderModal from './components/NewFolderModal';
import SelectionToolbar from './components/SelectionToolbar';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
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

  const fetchFiles = useCallback(async (directoryId?: string | null, showToast = false) => {
    try {
      setRefreshing(true);
      const targetDir = directoryId !== undefined ? directoryId : currentDirectoryId;
      const params = targetDir ? `?parent_directory_id=${targetDir}` : '';
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
  }, [currentDirectoryId]);

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
    checkHealth();

    // Check health every 30 seconds
    const healthInterval = setInterval(checkHealth, 30000);

    return () => clearInterval(healthInterval);
  }, []);

  useEffect(() => {
    // Fetch files whenever the current directory changes
    fetchFiles(currentDirectoryId);
  }, [currentDirectoryId, fetchFiles]);

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
    fetchFiles(currentDirectoryId, true);
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
    <div className="flex h-screen bg-slate-50">
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

      {/* Sidebar */}
      <Sidebar
        currentDirectoryId={currentDirectoryId}
        onNavigate={handleNavigate}
        onNewFolder={() => setIsNewFolderModalOpen(true)}
        totalItems={totalItems}
        totalSize={totalSize}
        healthStatus={healthStatus}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar
          onRefresh={handleRefresh}
          refreshing={refreshing}
          healthStatus={healthStatus}
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-8">
            {/* Breadcrumb Navigation */}
            {breadcrumbPath.length > 0 && (
              <div className="mb-6">
                <Breadcrumb path={breadcrumbPath} onNavigate={handleNavigate} />
              </div>
            )}

            {/* Quick Actions Banner with Upload */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl text-white shadow-xl shadow-indigo-500/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <Upload className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-semibold">Quick Upload</h2>
              </div>
              <FileUpload onUploadSuccess={handleUploadSuccess} currentDirectoryId={currentDirectoryId} />
            </motion.div>

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
              currentDirectoryId={currentDirectoryId}
            />
          </div>
        </div>
      </div>

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
