#!/bin/bash

# local.sh - Convenience script to build and copy FTP service assets for local development
# This script builds the FTP service package and copies the compiled assets 
# into the current cloudrun directory for local Docker builds

set -e  # Exit on any error

echo "🔨 Building FTP service package..."

# Navigate to the FTP service package and build it
cd ../packages/ftp-service
npm run build

echo "📦 Copying built assets to cloudrun directory..."

# Copy the compiled JavaScript files to the cloudrun directory
cp dist/* ../../cloudrun/

# Navigate back to cloudrun directory
cd ../../cloudrun

echo "🐳 Building local Docker image..."

# Build the Docker image with a local tag
docker build --tag pmc-ftp-local .

echo "✅ Local build complete!"
echo ""
echo "To run the container locally:"
echo "  docker run -p 8080:8080 pmc-ftp-local"
echo ""
echo "To run with environment variables:"
echo "  docker run -p 8080:8080 \\"
echo "    -e FTP_HOST=your-host \\"
echo "    -e FTP_PORT=22 \\"
echo "    -e FTP_USERNAME=your-username \\"
echo "    -e FTP_PASSWORD=your-password \\"
echo "    -e STREAM_BUFFER_KB=256 \\"
echo "    pmc-ftp-local" 