# Deploy to DigitalOcean Droplet

## 1. Create a Droplet

```bash
# Create a droplet (Ubuntu 22.04, $6/month minimum recommended)
doctl compute droplet create perfmon \
  --image ubuntu-22-04-x64 \
  --size s-1vcpu-1gb \
  --region nyc1 \
  --ssh-keys YOUR_SSH_KEY_ID

# Get your droplet IP
doctl compute droplet list
```

Or create via web UI: https://cloud.digitalocean.com/droplets/new

## 2. SSH into Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

## 3. Install Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install Chrome dependencies
apt install -y \
  chromium-browser \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libgbm1 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxkbcommon0 \
  libxrandr2 \
  xdg-utils

# Install PM2 for process management
npm install -g pm2

# Install Nginx for reverse proxy
apt install -y nginx certbot python3-certbot-nginx
```

## 4. Clone and Setup Project

```bash
# Clone your repo
cd /var/www
git clone https://github.com/papayaah/perfmon.git
cd perfmon

# Install dependencies
npm install

# Build frontend
npm run build

# Install server dependencies
cd server
npm install
cd ..
```

## 5. Configure Environment

```bash
# Create production env file
cat > server/.env << EOF
NODE_ENV=production
PORT=3001
MAX_CONCURRENT_ANALYSES=2
MAX_QUEUE_SIZE=20
QUEUE_TIMEOUT_MS=120000
CHROME_PATH=/usr/bin/chromium-browser
EOF
```

## 6. Setup PM2 (Process Manager)

```bash
# Start server with PM2
cd /var/www/perfmon/server
pm2 start index.js --name perfmon-api

# Save PM2 config
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## 7. Configure Nginx

```bash
# Create Nginx config
cat > /etc/nginx/sites-available/perfmon << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN.com;

    # Frontend (static files)
    location / {
        root /var/www/perfmon/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeout for Lighthouse
        proxy_read_timeout 120s;
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/perfmon /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t
systemctl reload nginx
```

## 8. Setup SSL (Optional but Recommended)

```bash
# Get SSL certificate
certbot --nginx -d YOUR_DOMAIN.com

# Auto-renewal is setup automatically
```

## 9. Setup Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

## 10. Deploy Updates

Create a deploy script on your local machine:

```bash
#!/bin/bash
# deploy-droplet.sh

ssh root@YOUR_DROPLET_IP << 'EOF'
cd /var/www/perfmon
git pull
npm install
npm run build
cd server
npm install
pm2 restart perfmon-api
EOF
```

Make it executable:
```bash
chmod +x deploy-droplet.sh
```

## Monitoring

```bash
# View logs
pm2 logs perfmon-api

# View status
pm2 status

# Monitor resources
pm2 monit
```

## Costs

- **$6/month** - 1GB RAM, 1 vCPU (minimum recommended)
- **$12/month** - 2GB RAM, 1 vCPU (better for concurrent requests)
- **$18/month** - 2GB RAM, 2 vCPU (best performance)

Compare to App Platform at $5/month but with severe resource constraints.
