#!/bin/bash

# Build script for Chrome Web Store submission
# Creates a clean ZIP file with only necessary files

VERSION="4.4.1"
BUILD_DIR="build"
ZIP_NAME="topstepx-sltp-assistant-v${VERSION}.zip"

echo "🏗️  Building TopstepX SL/TP Assistant v${VERSION} for Chrome Web Store"
echo ""

# Clean previous build
if [ -d "$BUILD_DIR" ]; then
    echo "🧹 Cleaning previous build..."
    rm -rf "$BUILD_DIR"
fi

# Create build directory
echo "📁 Creating build directory..."
mkdir -p "$BUILD_DIR"

# Copy necessary files and directories
echo "📦 Copying files..."

# Core directories
cp -r assets "$BUILD_DIR/"
cp -r background "$BUILD_DIR/"
cp -r content-scripts "$BUILD_DIR/"
cp -r lib "$BUILD_DIR/"
cp -r popup "$BUILD_DIR/"
cp -r ui "$BUILD_DIR/"

# Essential files
cp manifest.json "$BUILD_DIR/"
cp LICENSE "$BUILD_DIR/"
cp README.md "$BUILD_DIR/"
cp PRIVACY-POLICY.md "$BUILD_DIR/"

echo "✅ Files copied"

# Remove any backup files or hidden files
echo "🧹 Cleaning build directory..."
find "$BUILD_DIR" -name "*.backup" -delete
find "$BUILD_DIR" -name "*.bak" -delete
find "$BUILD_DIR" -name ".DS_Store" -delete
find "$BUILD_DIR" -name "*.swp" -delete

# Create ZIP file
echo "📦 Creating ZIP file..."
cd "$BUILD_DIR"
zip -r "../${ZIP_NAME}" . -x "*.git*" -x "*node_modules*" -x "*.DS_Store"
cd ..

# Calculate size
ZIP_SIZE=$(du -h "$ZIP_NAME" | cut -f1)

echo ""
echo "✅ Build complete!"
echo ""
echo "📦 Package: ${ZIP_NAME}"
echo "📏 Size: ${ZIP_SIZE}"
echo ""
echo "📋 Contents:"
ls -la "$BUILD_DIR" | grep -v "^d" | wc -l | xargs echo "   Files:"
du -sh "$BUILD_DIR" | awk '{print "   Total size: " $1}'
echo ""
echo "🚀 Ready to upload to Chrome Web Store!"
echo ""
echo "Next steps:"
echo "1. Go to: https://chrome.google.com/webstore/devconsole"
echo "2. Click 'New Item'"
echo "3. Upload: ${ZIP_NAME}"
echo "4. Fill in store listing details"
echo "5. Submit for review"
echo ""


