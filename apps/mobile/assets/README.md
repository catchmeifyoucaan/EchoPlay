# EchoPlay Mobile App Assets

This directory contains the app icon and splash screen assets.

## Current Status

- ✅ SVG source files created (`icon.svg`, `splash.svg`)
- ❌ PNG exports needed for Expo build

## Required Assets

### App Icon
- **File**: `icon.png`
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Used for**: iOS App Store, Android Play Store, home screen icon

### Splash Screen
- **File**: `splash.png`
- **Size**: 1242x2436 pixels (iPhone 11 Pro Max resolution)
- **Format**: PNG
- **Used for**: App launch screen while loading

## Converting SVG to PNG

### Option 1: Using ImageMagick (Recommended)

```bash
# Install ImageMagick
sudo apt-get install imagemagick

# Convert icon
convert icon.svg -resize 1024x1024 icon.png

# Convert splash
convert splash.svg -resize 1242x2436 splash.png
```

### Option 2: Using Inkscape

```bash
# Install Inkscape
sudo apt-get install inkscape

# Convert icon
inkscape icon.svg --export-filename=icon.png --export-width=1024 --export-height=1024

# Convert splash
inkscape splash.svg --export-filename=splash.png --export-width=1242 --export-height=2436
```

### Option 3: Online Tools

1. Go to https://cloudconvert.com/svg-to-png
2. Upload `icon.svg`, set width to 1024px
3. Download as `icon.png`
4. Repeat for `splash.svg` with width 1242px

### Option 4: Using Node.js (sharp)

```bash
npm install -g sharp-cli

# Convert icon
sharp -i icon.svg -o icon.png resize 1024 1024

# Convert splash
sharp -i splash.svg -o splash.png resize 1242 2436
```

## Design Notes

**Color Scheme:**
- Primary: Indigo (#6366f1)
- Secondary: Purple (#8b5cf6)
- Accent: White (#ffffff)

**Icon Elements:**
- Left: Echo waves (representing listening/sound)
- Right: Play button (representing action/debate)
- Bottom: "EchoPlay" wordmark

**Splash Elements:**
- Same logo as icon (centered)
- App name and tagline
- Gradient background
- Loading indicator placeholder

## Customization

To customize the design:

1. Edit the SVG files directly (they're text-based XML)
2. Use a vector graphics editor:
   - Adobe Illustrator
   - Figma
   - Inkscape (free)
   - Sketch
3. Export as PNG with the required dimensions

## After Converting

Once you have the PNG files:

```bash
# Verify files exist
ls -lh icon.png splash.png

# Should show:
# icon.png    (1024x1024)
# splash.png  (1242x2436)
```

Then rebuild your Expo app:

```bash
cd /home/user/EchoPlay/apps/mobile
npm start
```

## Production Assets

For production, you may want to create adaptive icons for Android:

- `adaptive-icon.png` (1024x1024)
- Foreground layer (transparent PNG)
- Background layer (solid color or gradient)

Expo will automatically generate all required sizes from the base 1024x1024 icon.
