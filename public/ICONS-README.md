# PWA Icons

You need to add two icon files to this directory for the PWA to work properly:

## Required Files

1. **icon-192.png** (192x192 pixels)
2. **icon-512.png** (512x512 pixels)

## How to Create Icons

### Option 1: Use an Online Tool
1. Visit [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
2. Upload your logo/icon
3. Download the generated icons
4. Rename them to `icon-192.png` and `icon-512.png`
5. Place them in this `/public` directory

### Option 2: Use Design Software
1. Create a 512x512 PNG image with your logo
2. Export at 512x512 as `icon-512.png`
3. Resize to 192x192 and export as `icon-192.png`

### Option 3: Use ImageMagick (if installed)
```bash
# From a master icon (icon.png)
magick icon.png -resize 192x192 icon-192.png
magick icon.png -resize 512x512 icon-512.png
```

## Design Guidelines

- Use a square canvas (1:1 aspect ratio)
- Provide adequate padding (safe zone ~10% from edges)
- Use high contrast colors for visibility
- Test on both light and dark backgrounds
- Keep design simple and recognizable at small sizes

## Current Setup

The app currently uses placeholder references. Once you add the icons:
1. Clear your browser cache
2. Unregister service workers
3. Reload the application
4. The icons will appear when installing the PWA

## Temporary Solution

Until you add proper icons, you can:
1. Copy `placeholder-logo.svg` or `placeholder-logo.png`
2. Rename copies to `icon-192.png` and `icon-512.png`
3. This will provide basic functionality
