# Deploy to DigitalOcean Droplet with Docker

Much simpler than manual setup - everything runs in containers!

## 1. Create Droplet

```bash
# Via doctl
doctl compute droplet create perfmon \
  --image docker-20-04 \
  --size s-2vcpu-2gb \
  --region nyc1 \
  --ssh-keys YOUR_SSH_KEY_ID

# Or use web UI and select "Docker on Ubuntu 22.04" marketplace image
```

Recommended: **$12/month** (2GB RAM, 1 vCPU) for reliable Lighthouse performance

## 2. SSH into Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

## 3. Install Docker Compose (if not included)

```bash
# Check if docker-compose exists
docker-compose --version

# If not, install it
apt update
apt install -y docker-compose
```

## 4. Clone and Setup

```bash
# Clone repo
cd /opt
git clone https://github.com/papayaah/perfmon.git
cd perfmon

# Build frontend
docker run --rm -v $(pwd):/app -w /app node:20-slim sh -c "npm install && npm run build"

# Or if you have Node locally, just run:
# npm install && npm run build

# Create directories for SSL
mkdir -p certbot/conf certbot/www

# Update nginx.conf with your domain (optional, for SSL)
# sed -i 's/YOUR_DOMAIN.com/yourdomain.com/g' nginx.conf
```

## 5. Start Services

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

## 6. Setup Firewall

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## 7. Setup SSL (Optional)

```bash
# Get certificate
docker-compose run --rm certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email your@email.com \
  --agree-tos \
  --no-eff-email \
  -d yourdomain.com

# Update nginx.conf - uncomment the HTTPS server block
nano nginx.conf
# Replace YOUR_DOMAIN.com with your actual domain

# Restart nginx
docker-compose restart nginx
```

## 8. Deploy Updates

Create `deploy.sh` on your local machine:

```bash
#!/bin/bash
set -e

echo "Building frontend..."
npm run build

echo "Deploying to droplet..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'certbot' \
  ./ root@YOUR_DROPLET_IP:/opt/perfmon/

ssh root@YOUR_DROPLET_IP << 'EOF'
cd /opt/perfmon
docker-compose pull
docker-compose up -d --build
docker-compose logs -f api
EOF
```

Make it executable:
```bash
chmod +x deploy.sh
```

## Monitoring

```bash
# View all logs
docker-compose logs -f

# View only API logs
docker-compose logs -f api

# View Nginx logs
docker-compose logs -f nginx

# Check resource usage
docker stats

# Restart services
docker-compose restart api
docker-compose restart nginx
```

## Backup Stats

```bash
# Stats are persisted in server/stats.json
# Backup regularly
scp root@YOUR_DROPLET_IP:/opt/perfmon/server/stats.json ./backup-stats.json
```

## Troubleshooting

```bash
# Restart everything
docker-compose restart

# Rebuild and restart
docker-compose up -d --build

# View Chrome/Lighthouse errors
docker-compose logs api | grep -i "lighthouse\|chrome"

# Check health
curl http://YOUR_DROPLET_IP/health
curl http://YOUR_DROPLET_IP/api/queue-stats
```

## Advantages over App Platform

- **More resources**: 2GB RAM vs shared resources
- **Better performance**: Dedicated CPU for Chrome
- **Full control**: Adjust any Docker/Chrome settings
- **Persistent stats**: Volume-mounted stats.json
- **Easy monitoring**: Direct access to logs
- **Cost effective**: $12/month vs $5/month but actually works

## Environment Variables

Edit `docker-compose.yml` to adjust:
- `MAX_CONCURRENT_ANALYSES` - How many analyses run at once (default: 2)
- `MAX_QUEUE_SIZE` - Max queued requests (default: 20)
- `QUEUE_TIMEOUT_MS` - Request timeout (default: 120000)
