#!/bin/bash
# Convert SVG assets to PNG for Expo

set -e

cd "$(dirname "$0")"

echo "🎨 Converting EchoPlay assets..."

# Check for conversion tools
if command -v convert &> /dev/null; then
    echo "✓ Using ImageMagick"
    convert icon.svg -resize 1024x1024 icon.png
    convert splash.svg -resize 1242x2436 splash.png
elif command -v inkscape &> /dev/null; then
    echo "✓ Using Inkscape"
    inkscape icon.svg --export-filename=icon.png --export-width=1024 --export-height=1024
    inkscape splash.svg --export-filename=splash.png --export-width=1242 --export-height=2436
elif command -v rsvg-convert &> /dev/null; then
    echo "✓ Using rsvg-convert"
    rsvg-convert -w 1024 -h 1024 icon.svg -o icon.png
    rsvg-convert -w 1242 -h 2436 splash.svg -o splash.png
else
    echo "❌ No conversion tool found!"
    echo ""
    echo "Please install one of the following:"
    echo "  • ImageMagick:  sudo apt-get install imagemagick"
    echo "  • Inkscape:     sudo apt-get install inkscape"
    echo "  • librsvg:      sudo apt-get install librsvg2-bin"
    echo ""
    echo "Or convert manually:"
    echo "  • Online: https://cloudconvert.com/svg-to-png"
    echo "  • Node.js: npm install -g sharp-cli"
    exit 1
fi

# Verify output
if [ -f "icon.png" ] && [ -f "splash.png" ]; then
    echo "✓ Assets converted successfully!"
    echo ""
    ls -lh icon.png splash.png
    echo ""
    echo "✅ Ready to build your Expo app!"
else
    echo "❌ Conversion failed"
    exit 1
fi
