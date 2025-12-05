#!/bin/bash

echo "📦 Creating deployment package..."

# Create a temporary directory
rm -rf .deploy-temp
mkdir -p .deploy-temp

# Copy server files
cp -r server .deploy-temp/
cp .do/app.yaml .deploy-temp/

# Create tarball
cd .deploy-temp
tar -czf ../perfmon-server.tar.gz .
cd ..

# Clean up
rm -rf .deploy-temp

echo "✅ Package created: perfmon-server.tar.gz"
echo ""
echo "Now upload this to DigitalOcean App Platform:"
echo "1. Go to: https://cloud.digitalocean.com/apps"
echo "2. Click 'Create App'"
echo "3. Choose 'Upload Source Code'"
echo "4. Upload perfmon-server.tar.gz"
echo ""
echo "Or use the dashboard method described in DEPLOYMENT.md"
