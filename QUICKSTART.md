# FileShare Frontend - Quick Start Guide

Get up and running in under 5 minutes!

## Prerequisites

- Node.js installed (v18+)
- Rust backend running at `http://localhost:3000`

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Open in Browser

Visit `http://localhost:5173`

That's it! You should now see the FileShare application running.

## What You Can Do

- **Upload Files**: Drag and drop files or click to browse
- **View Files**: See all uploaded files in grid or list view
- **Download Files**: Click the download button on any file
- **Delete Files**: Remove files you no longer need
- **Search**: Find files by name, description, or type

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## Troubleshooting

### Can't connect to backend?

Make sure the Rust backend is running:
```bash
cd ../fileshare_rust
cargo run
```

### Port 5173 already in use?

Run on a different port:
```bash
npm run dev -- --port 5174
```

## Next Steps

- Read the full [README.md](./README.md) for deployment instructions
- Check out the backend [API Documentation](../fileshare_rust/API_DOCUMENTATION.md)
- Customize the UI by editing Tailwind colors in `tailwind.config.js`

---

Need help? Check the [full README](./README.md) or the backend documentation.
