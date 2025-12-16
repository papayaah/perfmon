#!/bin/bash

# Deploy Lighthouse performance monitor to production

SERVER="root@159.89.201.140"
DEPLOY_PATH="/opt/perfmon"

echo "🚀 Deploying to $SERVER..."

# Create directories if they don't exist
echo "📁 Creating directories..."
ssh $SERVER "mkdir -p $DEPLOY_PATH/server $DEPLOY_PATH/queue-manager"

# Copy updated files
echo "📤 Copying files..."
scp docker-compose.yml $SERVER:$DEPLOY_PATH/
scp Dockerfile $SERVER:$DEPLOY_PATH/
scp Dockerfile.queue $SERVER:$DEPLOY_PATH/
scp nginx-lb.conf $SERVER:$DEPLOY_PATH/
scp server/index.js $SERVER:$DEPLOY_PATH/server/
scp server/package.json $SERVER:$DEPLOY_PATH/server/
scp -r queue-manager/ $SERVER:$DEPLOY_PATH/

# Rebuild and restart
ssh $SERVER << 'EOF'
cd /opt/perfmon

echo "🛑 Stopping all services..."
docker compose down --remove-orphans

echo "🧹 Cleaning Docker cache..."
docker system prune -f

echo "🏗️  Rebuilding all services..."
docker compose build --no-cache

echo "🚀 Starting services..."
docker compose up -d

echo "⏳ Waiting for startup..."
sleep 30

echo "📊 Service Status:"
docker compose ps

echo "🏥 Health Checks:"
echo -n "Queue Manager: "
timeout 10 docker exec lighthouse-queue curl -s http://localhost:8080/health 2>/dev/null | jq -r '.status // "ERROR"' || echo "ERROR"

for i in {1..5}; do
  echo -n "Worker $i: "
  timeout 10 docker exec lighthouse-worker-$i curl -s http://localhost:8080/health 2>/dev/null | jq -r '.status // "ERROR"' || echo "ERROR"
done

echo "📈 Queue Stats:"
curl -s http://localhost:9001/api/queue-stats | jq '.' || echo "ERROR"

echo "🧪 Testing analysis..."
curl -X POST http://localhost:9001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","deviceType":"desktop"}' \
  --max-time 120 | jq -r '.scores // "FAILED"' || echo "FAILED"

echo "📋 Recent logs:"
docker compose logs --tail=20

EOF

echo "✅ Deploy complete!"
