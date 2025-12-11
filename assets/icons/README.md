# Extension Icons

## Icon Sizes Required

- **icon16.png** - 16x16 pixels (toolbar icon)
- **icon48.png** - 48x48 pixels (extension management page)
- **icon128.png** - 128x128 pixels (Chrome Web Store)

## Generating PNG Icons from SVG

### Option 1: Using Online Tools
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `icon.svg`
3. Convert to PNG at these sizes:
   - 16x16 → save as `icon16.png`
   - 48x48 → save as `icon48.png`
   - 128x128 → save as `icon128.png`

### Option 2: Using ImageMagick (Command Line)
```bash
# Install ImageMagick if not already installed
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick

# Generate all sizes
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png
```

### Option 3: Using Node.js (svg2png or sharp)
```bash
npm install sharp

# Create a script generate-icons.js
const sharp = require('sharp');

const sizes = [16, 48, 128];

sizes.forEach(size => {
  sharp('icon.svg')
    .resize(size, size)
    .png()
    .toFile(`icon${size}.png`);
});
```

## Temporary Placeholder Icons

For development/testing, you can use simple colored squares as placeholders.
The manifest.json will still work with the SVG or you can create simple PNGs manually.

## Icon Design

The icon represents:
- **Red line (SL)**: Stop Loss level
- **Green line (TP)**: Take Profit level
- **White line**: Entry price
- **Gray bars**: Simplified candlestick chart

Colors match the extension's default SL/TP colors for consistency.
