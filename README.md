# FileShare Frontend

A modern, sleek React frontend application for the FileShare Rust backend. Built with React, TypeScript, Tailwind CSS, and Vite for optimal performance on Raspberry Pi.

## Features

- **Drag & Drop Upload**: Intuitive file upload with drag-and-drop support
- **File Management**: View, download, and delete files with ease
- **Responsive Design**: Optimized for both mobile and desktop browsers
- **Real-time Health Check**: Monitor backend connection status
- **Grid & List Views**: Switch between card and table layouts
- **Search Functionality**: Quickly find files by name, description, or type
- **Modern UI/UX**: Clean, professional design with smooth animations
- **Progress Tracking**: Visual feedback for uploads and downloads
- **Toast Notifications**: User-friendly success/error messages

## Tech Stack

- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **React Hot Toast** - Elegant toast notifications
- **Axios** - Promise-based HTTP client

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Rust backend running (see `../fileshare_rust/README.md`)

## Installation

### 1. Navigate to the project directory

```bash
cd fileshare-frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

The application uses environment variables for configuration. Copy the example file:

```bash
cp .env.example .env
```

For **development** (using proxy):
- Leave `VITE_API_URL` empty in `.env`
- The dev server will proxy API requests to `http://localhost:3000`

For **production** (Raspberry Pi deployment):
- Set `VITE_API_URL` to your Raspberry Pi's Tailscale IP:
  ```
  VITE_API_URL=http://100.x.x.x:3000
  ```

## Development

### Start the development server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

**Important**: Make sure the Rust backend is running on `http://localhost:3000` before starting the frontend.

### Build for production

```bash
npm run build
```

The optimized production build will be in the `dist` directory.

### Preview production build

```bash
npm run preview
```

## Project Structure

```
fileshare-frontend/
├── src/
│   ├── components/          # React components
│   │   ├── FileUpload.tsx   # Drag & drop upload component
│   │   ├── FileList.tsx     # File list with grid/table views
│   │   ├── FileCard.tsx     # Individual file card (grid view)
│   │   └── FileTableRow.tsx # Individual file row (table view)
│   ├── services/            # API services
│   │   └── api.ts           # API client with all endpoints
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts         # File metadata and response types
│   ├── utils/               # Utility functions
│   │   └── format.ts        # File size, date formatting, etc.
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles with Tailwind
├── public/                  # Static assets
├── .env                     # Environment variables
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

## Deployment to Raspberry Pi

There are two approaches to deploy this application:

### Option 1: Serve from the Rust Backend (Recommended)

This approach bundles the frontend with the backend for a single-server deployment.

1. **Build the frontend**:
   ```bash
   npm run build
   ```

2. **Copy the `dist` folder to your Rust backend**:
   ```bash
   # On your development machine
   scp -r dist/* pi@your-raspberry-pi:/path/to/fileshare_rust/public/
   ```

3. **Update the Rust backend** to serve static files (if not already configured)

4. **Access the application** via your Raspberry Pi's Tailscale IP:
   ```
   http://100.x.x.x:3000
   ```

### Option 2: Separate Frontend Server

Run the frontend separately on the Raspberry Pi.

1. **Transfer the entire project to Raspberry Pi**:
   ```bash
   scp -r fileshare-frontend pi@your-raspberry-pi:~/
   ```

2. **On the Raspberry Pi, configure the environment**:
   ```bash
   cd ~/fileshare-frontend
   nano .env
   ```
   Set:
   ```
   VITE_API_URL=http://localhost:3000
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Build and preview**:
   ```bash
   npm run build
   npm run preview -- --host 0.0.0.0 --port 4173
   ```

5. **Access via Tailscale**:
   ```
   http://100.x.x.x:4173
   ```

### Running as a Service (systemd)

To run the frontend as a background service:

1. **Create a service file**:
   ```bash
   sudo nano /etc/systemd/system/fileshare-frontend.service
   ```

2. **Add the following** (adjust paths as needed):
   ```ini
   [Unit]
   Description=FileShare Frontend
   After=network.target

   [Service]
   Type=simple
   User=pi
   WorkingDirectory=/home/pi/fileshare-frontend
   ExecStart=/usr/bin/npm run preview -- --host 0.0.0.0 --port 4173
   Restart=always
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   ```

3. **Enable and start the service**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable fileshare-frontend.service
   sudo systemctl start fileshare-frontend.service
   ```

4. **Check status**:
   ```bash
   sudo systemctl status fileshare-frontend.service
   ```

## API Endpoints Used

The frontend interacts with the following backend API endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Check backend health status |
| `/api/files` | GET | List all uploaded files |
| `/api/files` | POST | Upload a new file |
| `/api/files/:id` | GET | Get file metadata |
| `/api/files/:id/download` | GET | Download a file |
| `/api/files/:id` | DELETE | Delete a file |

## Component Overview

### App.tsx
Main application component that:
- Manages global state (files, loading, health status)
- Fetches files on mount and periodically checks backend health
- Renders header, stats, upload section, and file list

### FileUpload.tsx
Upload component featuring:
- Drag-and-drop file selection
- File preview before upload
- Optional description field
- Upload progress indication
- Success/error notifications

### FileList.tsx
File listing component with:
- Search functionality
- Grid/List view toggle
- Responsive layout
- Empty state handling

### FileCard.tsx (Grid View)
Individual file card displaying:
- File icon based on MIME type
- File metadata (size, type, date)
- Expandable details
- Download and delete actions

### FileTableRow.tsx (List View)
Table row for compact file display:
- Icon and filename
- Size, type, and date columns (responsive)
- Inline download/delete buttons

## Performance Optimizations

The application is optimized for Raspberry Pi with:

- **Code Splitting**: Lazy loading for optimal bundle size
- **Memoization**: Efficient re-rendering with useMemo
- **Debouncing**: Search input optimizations
- **Optimized Images**: Proper icon usage instead of heavy images
- **Minified Production Build**: Compressed CSS and JS
- **Tree Shaking**: Unused code elimination

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Backend Connection Issues

**Problem**: "Failed to load files" error

**Solution**:
1. Ensure the Rust backend is running
2. Check that the proxy configuration in `vite.config.ts` is correct
3. Verify the `VITE_API_URL` environment variable if in production

### Build Errors

**Problem**: TypeScript compilation errors

**Solution**:
```bash
npm run type-check
```
Fix any type errors reported.

### Port Already in Use

**Problem**: Dev server port 5173 is occupied

**Solution**:
```bash
npm run dev -- --port 5174
```

### Slow Performance on Raspberry Pi

**Solution**:
1. Ensure you're using the production build (`npm run build`)
2. Serve static files instead of running dev server
3. Use a reverse proxy like nginx for better performance

## Development Tips

### Hot Module Replacement (HMR)

Vite provides instant HMR. Changes to components will reflect immediately without full page reload.

### Type Checking

Run TypeScript type checking:
```bash
npm run type-check
```

### Linting (if configured)

```bash
npm run lint
```

## Customization

### Changing Colors

Edit `tailwind.config.js` to customize the color scheme:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom colors
      },
    },
  },
}
```

### Adding New File Type Icons

Edit `src/utils/format.ts` in the `getFileIcon()` function to add custom icon mappings.

### Modifying Upload Limits

The frontend doesn't impose file size limits. Configure limits in the Rust backend if needed.

## Future Enhancements

Potential features to add:

- [ ] Multi-file upload
- [ ] Upload queue management
- [ ] File preview (images, PDFs)
- [ ] User authentication
- [ ] File sharing links
- [ ] Dark mode toggle
- [ ] Advanced filtering and sorting
- [ ] Folder organization
- [ ] Thumbnail generation

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For questions or issues:
1. Check this README
2. Review the backend API documentation
3. Check browser console for errors
4. Verify backend is running and accessible

## Acknowledgments

- Built with [React](https://react.dev/)
- Powered by [Vite](https://vitejs.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide](https://lucide.dev/)
- Backend by [Rust/Axum](https://github.com/tokio-rs/axum)

---

**Happy File Sharing!**
