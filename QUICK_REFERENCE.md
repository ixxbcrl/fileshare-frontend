# Quick Reference Guide - Directory Features

## Component Files Created/Modified

### ✅ New Components (3)
1. **`src/components/Breadcrumb.tsx`**
   - Purpose: Navigation breadcrumb showing current path
   - Usage: `<Breadcrumb path={breadcrumbPath} onNavigate={handleNavigate} />`

2. **`src/components/NewFolderModal.tsx`**
   - Purpose: Modal for creating new folders
   - Usage: `<NewFolderModal isOpen={...} onClose={...} onSuccess={...} parentDirectoryId={...} />`

3. **`src/components/SelectionToolbar.tsx`**
   - Purpose: Toolbar for bulk delete operations
   - Usage: `<SelectionToolbar selectedFileIds={...} selectedDirectoryIds={...} onClearSelection={...} onDeleteSuccess={...} />`

### ✅ Updated Components (5)
1. **`src/components/FileCard.tsx`**
   - Added: Directory support, selection mode, long-press

2. **`src/components/FileTableRow.tsx`**
   - Added: Directory support, selection mode, long-press

3. **`src/components/FileList.tsx`**
   - Added: Directory display, selection props

4. **`src/components/FileUpload.tsx`**
   - Added: `currentDirectoryId` prop for uploading to folders

5. **`src/App.tsx`**
   - Added: Navigation state, selection state, all event handlers

### ✅ Updated Core Files (3)
1. **`src/types/index.ts`**
   - Added: DirectoryMetadata, BreadcrumbItem, new response types

2. **`src/services/api.ts`**
   - Added: Directory API endpoints, bulk delete

3. **`src/index.css`**
   - Added: slideUp and fadeIn animations

---

## Key Features at a Glance

### 🗂️ Folder Operations
```typescript
// Create folder
POST /api/directories
{ name: "Documents", parent_id: null }

// Get folder info
GET /api/directories/:id

// Delete folder
DELETE /api/directories/:id
```

### 📁 File Operations in Folders
```typescript
// Upload to folder
POST /api/files
FormData with: file, description, parent_directory_id

// List files in folder
GET /api/files?parent_directory_id=xxx

// Response includes both:
{
  files: FileMetadata[],
  directories: DirectoryMetadata[],
  total: number
}
```

### 🗑️ Bulk Delete
```typescript
POST /api/bulk-delete
{
  file_ids: ["id1", "id2"],
  directory_ids: ["id3", "id4"]
}

// Response:
{
  success: true,
  deleted_files: 2,
  deleted_directories: 2,
  message: "Deleted successfully"
}
```

---

## User Interactions

### Desktop
| Action | Result |
|--------|--------|
| Click folder | Navigate into folder |
| Hover over item | Checkbox appears |
| Click checkbox | Enter selection mode, select item |
| Click item (in selection mode) | Toggle selection |
| Click "Delete Selected" | Bulk delete confirmation |
| Click breadcrumb | Navigate to that folder |

### Mobile
| Action | Result |
|--------|--------|
| Tap folder | Navigate into folder |
| Long-press item (600ms) | Enter selection mode, select item |
| Tap item (in selection mode) | Toggle selection |
| Tap "Delete Selected" | Bulk delete confirmation |
| Tap breadcrumb | Navigate to that folder |

---

## State Management in App.tsx

```typescript
// Navigation
const [currentDirectoryId, setCurrentDirectoryId] = useState<string | null>(null);
const [breadcrumbPath, setBreadcrumbPath] = useState<BreadcrumbItem[]>([]);

// Data
const [files, setFiles] = useState<FileMetadata[]>([]);
const [directories, setDirectories] = useState<DirectoryMetadata[]>([]);

// Selection
const [selectionMode, setSelectionMode] = useState(false);
const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
const [selectedDirectoryIds, setSelectedDirectoryIds] = useState<string[]>([]);

// UI
const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
```

---

## Component Prop Interfaces

### FileCard / FileTableRow
```typescript
interface FileCardProps {
  item: FileMetadata | DirectoryMetadata;
  isDirectory: boolean;
  onDelete: (id: string, isDirectory: boolean) => void;
  onNavigate?: (directoryId: string) => void;
  selectionMode: boolean;
  isSelected: boolean;
  onSelectionToggle: (id: string, isDirectory: boolean) => void;
}
```

### FileList
```typescript
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
}
```

### Breadcrumb
```typescript
interface BreadcrumbProps {
  path: BreadcrumbItem[];
  onNavigate: (directoryId: string | null) => void;
}

interface BreadcrumbItem {
  id: string | null;
  name: string;
}
```

---

## CSS Classes Reference

### Animations
```css
.animate-slide-up    /* Slide up with fade in */
.animate-fade-in     /* Simple fade in */
```

### Custom Classes
```css
.btn-primary         /* Blue action button */
.btn-secondary       /* Gray cancel button */
.btn-danger          /* Red delete button */
.card                /* White card with shadow */
.input-field         /* Styled input field */
```

---

## File Type Icons

| Type | Icon | Color |
|------|------|-------|
| Directory | Folder/FolderOpen | Yellow-500 |
| Image | ImageIcon | Purple-500 |
| Video | Video | Red-500 |
| Audio | Music | Green-500 |
| PDF | FileText | Red-600 |
| Document | FileText | Blue-500 |
| Archive | Archive | Yellow-600 |
| Default | File | Gray-500 |

---

## Common Code Patterns

### Determining if item is directory
```typescript
const isDirectory = !('original_filename' in item);
// OR
const isDirectory = 'file_count' in item;
```

### Navigation
```typescript
// Navigate forward
handleNavigate(directoryId);

// Navigate back to root
handleNavigate(null);

// Navigate via breadcrumb
breadcrumbPath.forEach(item => {
  if (item.id === targetId) {
    handleNavigate(item.id);
  }
});
```

### Selection
```typescript
// Toggle selection
handleSelectionToggle(itemId, isDirectory);

// Clear all selections
setSelectionMode(false);
setSelectedFileIds([]);
setSelectedDirectoryIds([]);

// Check if selected
const isSelected = isDirectory
  ? selectedDirectoryIds.includes(item.id)
  : selectedFileIds.includes(item.id);
```

---

## Responsive Breakpoints

| Breakpoint | Width | Features Hidden/Changed |
|------------|-------|-------------------------|
| sm | 640px | Table columns start hiding |
| md | 768px | More table columns visible |
| lg | 1024px | All columns visible, 3-column grid |

---

## Error Handling

All API calls include try-catch blocks with toast notifications:

```typescript
try {
  const response = await fetch(...);
  if (!response.ok) throw new Error('Failed');
  toast.success('Success!');
} catch (error) {
  console.error('Error:', error);
  toast.error('Failed to perform action');
}
```

---

## TypeScript Types Quick Ref

```typescript
// File
interface FileMetadata {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string | null;
  uploaded_at: string;
  description: string | null;
  parent_directory_id: string | null;  // NEW
}

// Directory
interface DirectoryMetadata {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  file_count: number;
  total_size: number;
}

// List Response
interface ListFilesResponse {
  files: FileMetadata[];
  directories: DirectoryMetadata[];  // NEW
  total: number;
}
```

---

## Development Commands

```bash
# Type check
npm run type-check

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Component Import Map

```typescript
// App.tsx imports
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import Breadcrumb from './components/Breadcrumb';
import NewFolderModal from './components/NewFolderModal';
import SelectionToolbar from './components/SelectionToolbar';
import type { FileMetadata, DirectoryMetadata, BreadcrumbItem } from './types';

// FileList.tsx imports
import FileCard from './FileCard';
import FileTableRow from './FileTableRow';

// Icons used across components
import {
  HardDrive, RefreshCw, Activity, FolderPlus,    // App.tsx
  Home, ChevronRight,                             // Breadcrumb.tsx
  Folder, FolderOpen,                             // FileCard/Row
  Download, Trash2, Info,                         // Actions
  Grid, List, Search, FolderOpen,                 // FileList.tsx
  Upload, X, Loader2                              // Various
} from 'lucide-react';
```

---

## Testing the Implementation

1. **Start the backend**: Make sure Rust backend is running
2. **Start the frontend**: `npm run dev`
3. **Open browser**: Visit `http://localhost:5173`
4. **Create a folder**: Click "New Folder"
5. **Navigate**: Click the folder to open it
6. **Upload**: Upload a file into the folder
7. **Navigate back**: Use breadcrumbs
8. **Select items**: Try both desktop hover and mobile long-press
9. **Bulk delete**: Select multiple items and delete

---

## Tips for Customization

### Change folder icon color
```typescript
// FileCard.tsx / FileTableRow.tsx
return isHovered ? (
  <FolderOpen className="w-12 h-12 text-blue-500" />  // Change color here
) : (
  <Folder className="w-12 h-12 text-blue-500" />      // Change color here
);
```

### Adjust long-press duration
```typescript
// FileCard.tsx / FileTableRow.tsx
longPressTimerRef.current = setTimeout(() => {
  // ...
}, 600);  // Change 600 to desired milliseconds
```

### Change selection highlight color
```css
/* In component className */
className={`${isSelected ? 'bg-green-50 border-2 border-green-500' : ''}`}
```

### Modify breadcrumb truncation
```typescript
// Breadcrumb.tsx
<span className="max-w-[150px] sm:max-w-[200px] truncate">
  {/* Adjust max-w values */}
```

---

This quick reference provides all the essential information for working with the new directory features!
