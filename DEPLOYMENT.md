# Deployment Guide - FileShare Frontend

Complete guide for deploying the FileShare frontend to production on Raspberry Pi.

## Pre-Deployment Checklist

- [ ] Backend is running and accessible
- [ ] Tailscale is configured on Raspberry Pi
- [ ] Node.js is installed on Raspberry Pi (v18+)
- [ ] Port 3000 is accessible (backend)
- [ ] Port 4173 is available (if running separate frontend)

## Deployment Method 1: Bundled with Backend (Recommended)

This method serves the frontend directly from the Rust backend.

### Step 1: Build the Frontend

On your development machine:

```bash
cd fileshare-frontend

# Install dependencies if not done
npm install

# Build for production
npm run build
```

This creates an optimized production build in the `dist` directory.

### Step 2: Update Backend Configuration

You need to modify the Rust backend to serve static files.

**Option A**: If backend already has static file serving, just copy files.

**Option B**: Add static file serving to the Rust backend (requires code changes):

In `src/main.rs`, add:
```rust
use tower_http::services::ServeDir;

// In your router setup:
.nest_service("/", ServeDir::new("public"))
```

### Step 3: Transfer Files to Raspberry Pi

```bash
# From your development machine
# Replace pi@raspberrypi with your actual Raspberry Pi address
scp -r dist/* pi@raspberrypi:/home/pi/fileshare_rust/public/

# Or using Tailscale IP
scp -r dist/* pi@100.x.x.x:/home/pi/fileshare_rust/public/
```

### Step 4: Access the Application

Open your browser and navigate to:
```
http://100.x.x.x:3000
```

The frontend will be served alongside the API.

## Deployment Method 2: Separate Frontend Server

Run the frontend as a separate service on the Raspberry Pi.

### Step 1: Transfer Project to Raspberry Pi

```bash
# On your development machine
# Zip the project
cd ..
tar -czf fileshare-frontend.tar.gz fileshare-frontend/

# Transfer to Raspberry Pi
scp fileshare-frontend.tar.gz pi@100.x.x.x:~/

# On Raspberry Pi
ssh pi@100.x.x.x
cd ~
tar -xzf fileshare-frontend.tar.gz
cd fileshare-frontend
```

### Step 2: Configure Environment

```bash
# Copy and edit .env file
cp .env.example .env
nano .env
```

Set:
```
VITE_API_URL=http://localhost:3000
```

### Step 3: Install Dependencies

```bash
npm install
```

This might take 5-10 minutes on Raspberry Pi.

### Step 4: Build for Production

```bash
npm run build
```

### Step 5: Test the Build

```bash
npm run preview -- --host 0.0.0.0 --port 4173
```

Test by visiting: `http://100.x.x.x:4173`

Press `Ctrl+C` to stop when done testing.

### Step 6: Create systemd Service

Create a service file:

```bash
sudo nano /etc/systemd/system/fileshare-frontend.service
```

Add the following content (adjust paths as needed):

```ini
[Unit]
Description=FileShare Frontend
After=network.target fileshare-backend.service
Wants=fileshare-backend.service

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/fileshare-frontend
Environment="NODE_ENV=production"
ExecStart=/usr/bin/npm run preview -- --host 0.0.0.0 --port 4173
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Step 7: Enable and Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable fileshare-frontend.service

# Start the service
sudo systemctl start fileshare-frontend.service

# Check status
sudo systemctl status fileshare-frontend.service
```

### Step 8: View Logs

```bash
# Follow logs in real-time
sudo journalctl -u fileshare-frontend.service -f

# View last 50 lines
sudo journalctl -u fileshare-frontend.service -n 50

# View logs from today
sudo journalctl -u fileshare-frontend.service --since today
```

## Using Nginx as Reverse Proxy (Optional but Recommended)

For better performance and HTTPS support, use Nginx.

### Install Nginx

```bash
sudo apt update
sudo apt install nginx
```

### Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/fileshare
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name 100.x.x.x;  # Your Tailscale IP

    # Frontend
    location / {
        proxy_pass http://localhost:4173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000;
    }

    # Optional: static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://localhost:4173;
    }
}
```

### Enable Nginx Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/fileshare /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable on boot
sudo systemctl enable nginx
```

Now access via: `http://100.x.x.x` (port 80)

## Adding HTTPS with Let's Encrypt (Optional)

For secure connections over the internet (not just Tailscale):

### Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx
```

### Get Certificate

```bash
# Replace with your domain
sudo certbot --nginx -d yourdomain.com
```

Follow the prompts. Certbot will automatically update your Nginx configuration.

### Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot will auto-renew via cron
```

## Performance Optimization

### Enable Gzip Compression

In Nginx configuration, add:

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
```

### Caching Strategy

Add to Nginx:

```nginx
location ~* \.(js|css)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location ~* \.(png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Monitoring

### Check Service Status

```bash
# Frontend status
sudo systemctl status fileshare-frontend.service

# Backend status
sudo systemctl status fileshare-backend.service

# Nginx status
sudo systemctl status nginx
```

### Monitor Resources

```bash
# CPU and Memory usage
htop

# Disk usage
df -h

# Port usage
sudo netstat -tlnp | grep -E ':(3000|4173|80|443)'
```

### Set Up Monitoring Script

Create a simple monitoring script:

```bash
nano ~/monitor-fileshare.sh
```

Add:
```bash
#!/bin/bash

echo "=== FileShare Status ==="
echo ""

echo "Backend Service:"
systemctl is-active fileshare-backend.service

echo "Frontend Service:"
systemctl is-active fileshare-frontend.service

echo "Nginx:"
systemctl is-active nginx

echo ""
echo "=== Port Status ==="
sudo netstat -tlnp | grep -E ':(3000|4173|80)'

echo ""
echo "=== Disk Usage ==="
df -h /home/pi/fileshare_rust/uploads
```

Make executable:
```bash
chmod +x ~/monitor-fileshare.sh
```

Run:
```bash
./monitor-fileshare.sh
```

## Updating the Application

### Method 1: Bundled Deployment

```bash
# On development machine
cd fileshare-frontend
git pull  # if using git
npm install
npm run build
scp -r dist/* pi@100.x.x.x:/home/pi/fileshare_rust/public/

# On Raspberry Pi
sudo systemctl restart fileshare-backend.service
```

### Method 2: Separate Server

```bash
# On Raspberry Pi
cd ~/fileshare-frontend
git pull  # if using git
npm install
npm run build

# Restart service
sudo systemctl restart fileshare-frontend.service
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
sudo journalctl -u fileshare-frontend.service -n 50

# Common issues:
# - Port already in use: Change port in service file
# - Wrong working directory: Verify path in service file
# - Missing dependencies: Run npm install
```

### Can't Connect

```bash
# Check if service is running
sudo systemctl status fileshare-frontend.service

# Check port is listening
sudo netstat -tlnp | grep 4173

# Check firewall (if enabled)
sudo ufw status
sudo ufw allow 4173/tcp  # if needed

# Check Tailscale
tailscale status
```

### High Memory Usage

```bash
# Check Node.js memory
ps aux | grep node

# If needed, limit Node.js memory in service file:
Environment="NODE_OPTIONS=--max-old-space-size=512"
```

### Slow Performance

1. Ensure you're using production build
2. Check Raspberry Pi CPU/memory: `htop`
3. Enable Nginx caching
4. Use CDN for static assets (advanced)

## Rollback Procedure

### Bundled Deployment

```bash
# Keep backups of dist folder
cp -r public public.backup

# To rollback
cp -r public.backup/* public/
sudo systemctl restart fileshare-backend.service
```

### Separate Server

```bash
# Use git to rollback
cd ~/fileshare-frontend
git log --oneline  # find commit hash
git checkout <previous-commit-hash>
npm install
npm run build
sudo systemctl restart fileshare-frontend.service
```

## Security Hardening

1. **Firewall**: Only allow necessary ports
   ```bash
   sudo ufw enable
   sudo ufw allow 22/tcp   # SSH
   sudo ufw allow 80/tcp   # HTTP
   sudo ufw allow 443/tcp  # HTTPS
   sudo ufw allow 41641/udp  # Tailscale
   ```

2. **Update regularly**:
   ```bash
   sudo apt update && sudo apt upgrade
   ```

3. **Disable unused services**

4. **Use strong SSH keys** instead of passwords

5. **Monitor logs** for suspicious activity

## Backup Strategy

### Automated Backup Script

```bash
nano ~/backup-fileshare.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/home/pi/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup uploads folder
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /home/pi/fileshare_rust/uploads

# Backup database
cp /home/pi/fileshare_rust/files.db $BACKUP_DIR/files_$DATE.db

# Keep only last 7 days
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "files_*.db" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make executable:
```bash
chmod +x ~/backup-fileshare.sh
```

Add to crontab for daily backups:
```bash
crontab -e
```

Add:
```
0 2 * * * /home/pi/backup-fileshare.sh
```

## Final Checklist

- [ ] Frontend builds without errors
- [ ] Backend is running and accessible
- [ ] Health check endpoint works
- [ ] File upload works
- [ ] File download works
- [ ] File delete works
- [ ] Search functionality works
- [ ] Mobile responsive design works
- [ ] Services start on boot
- [ ] Logs are being written
- [ ] Backups are configured
- [ ] Monitoring is set up

---

**Your FileShare application is now deployed and ready to use!**

For support, refer to:
- [README.md](./README.md) - Full documentation
- [QUICKSTART.md](./QUICKSTART.md) - Quick reference
- [Backend API Docs](../fileshare_rust/API_DOCUMENTATION.md) - API reference
