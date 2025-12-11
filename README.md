# TopstepX SL/TP Assistant

<div align="center">

![Version](https://img.shields.io/badge/version-4.3.1-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome](https://img.shields.io/badge/chrome-extension-yellow.svg)

**Visual Stop Loss and Take Profit lines with automatic risk calculation for TopstepX traders**

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Configuration](#configuration) • [Contributing](#contributing)

</div>

---

## 🎯 Overview

TopstepX SL/TP Assistant is a Chrome extension that automatically draws Stop Loss and Take Profit lines on your TopstepX charts when you place limit or stop orders. It helps you visualize your risk and potential profit in real-time with dynamic dollar values.

### Key Features

- ✅ **Automatic Line Placement** - Lines appear when you place limit/stop orders
- 📊 **Dynamic Values** - Dollar amounts update as you drag orders
- 🎨 **Fully Customizable** - Colors, line width, and display options
- 🔄 **Real-Time Updates** - Lines follow your order modifications
- 📱 **Smart Detection** - Supports LONG, SHORT, Limit, Stop, and Market orders
- 💰 **Risk Management** - Configure default SL/TP values and risk percentages

## 🚀 Features

### Automatic Order Detection

The extension automatically detects when you:
- Create a **Limit Order** (Buy/Sell)
- Create a **Stop Order** (Buy/Sell)
- **Modify** an existing order (drag on chart)
- **Cancel** an order (lines disappear)

### Visual Lines

- **Stop Loss Line** (Red) - Shows potential loss
- **Take Profit Line** (Green) - Shows potential profit
- **Dynamic Labels** - Display dollar amounts and contract quantity
  - Format: `SL -$100 (2x)` and `TP +$200 (2x)`

### Smart Position Logic

- **LONG Positions**: SL below entry, TP above entry
- **SHORT Positions**: SL above entry, TP below entry

### Supported Order Types

| Order Type | Detected | Lines Shown |
|------------|----------|-------------|
| Limit Buy (LONG) | ✅ | ✅ |
| Limit Sell (SHORT) | ✅ | ✅ |
| Stop Buy (LONG) | ✅ | ✅ |
| Stop Sell (SHORT) | ✅ | ✅ |
| Market Orders | ✅ | ❌ (executes immediately) |

## 📦 Installation

### Option 1: Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store soon. This is the **recommended** method for most users.

[Install from Chrome Web Store](#) _(Link will be added after approval)_

### Option 2: Install from Source (For Developers)

1. **Clone the repository**
   ```bash
   git clone https://github.com/cmacha2/topstepx-sl-tp-assistant.git
   cd topstepx-sl-tp-assistant
   ```

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top right)
   - Click **Load unpacked**
   - Select the extension folder

3. **Navigate to TopstepX**
   - Go to [TopstepX.com](https://topstepx.com)
   - Open a chart
   - The extension is now active!

### Option 3: Install from Release

1. Download the latest `.zip` from [Releases](https://github.com/cmacha2/topstepx-sl-tp-assistant/releases)
2. Extract the ZIP file
3. Load in Chrome as unpacked extension (see Option 2, step 2)

## 🎮 Usage

### Basic Workflow

1. **Open a chart** on TopstepX
2. **Place a limit or stop order** on the chart
3. **Lines appear automatically**:
   - Red line for Stop Loss
   - Green line for Take Profit
4. **Drag the order** to modify - lines update in real-time
5. **Cancel the order** - lines disappear

### Example

```
Create Limit Buy Order at 25700 (1 contract)
↓
Extension automatically draws:
  TP Line: 25900 (+$200)    ← Green, above entry
  SL Line: 25600 (-$100)    ← Red, below entry
```

## ⚙️ Configuration

Click the extension icon to open the configuration popup:

### Risk Management

- **Risk Mode**: Percentage or Fixed dollar amount
- **Risk Percent**: % of account to risk per trade
- **Risk Fixed**: Fixed dollar risk per trade
- **Account Size**: Your total account size

### Stop Loss & Take Profit

- **Stop Loss**: Default SL in dollars per contract
- **Take Profit**: Default TP in dollars per contract
- **Use Ratio**: Auto-calculate TP from SL (e.g., 1:2 ratio)
- **Risk:Reward Ratio**: Multiplier for TP calculation

### Visual Settings

- **Stop Loss Color**: Line color (default: Red #FF0000)
- **Take Profit Color**: Line color (default: Green #00FF00)
- **Line Width**: Thickness from 1-10px (default: 1px for minimalist look)

### Options

- **Keep lines across sessions**: Persist lines when page reloads
- **Auto-update on price change**: Update lines when order price changes
- **Show dollar amounts on lines**: Display labels with $ values

## 🎨 Customization Examples

### Minimalist Style
```javascript
{
  lineWidth: 1,           // Thinnest lines
  slColor: '#CC0000',     // Dark red
  tpColor: '#00AA00',     // Dark green
  showLabels: true        // Show values
}
```

### High Visibility
```javascript
{
  lineWidth: 5,           // Thick lines
  slColor: '#FF0000',     // Bright red
  tpColor: '#00FF00',     // Bright green
  showLabels: true        // Show values
}
```

## 🏗️ Architecture

```
topstepx-sl-tp-assistant/
├── manifest.json              # Extension manifest
├── popup/                     # Configuration UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content-scripts/           # Scripts injected into TopstepX
│   └── main-content-v4.js    # Main logic
├── lib/                       # Core libraries
│   ├── calculations.js        # SL/TP calculations
│   ├── chart-access.js        # TradingView chart API
│   ├── instrument-database.js # Futures contracts specs
│   ├── network-interceptor.js # Order detection
│   ├── smart-dom-observer.js  # DOM monitoring
│   └── storage-manager.js     # Chrome storage
├── background/
│   └── service-worker.js      # Background tasks
└── assets/
    └── icons/                 # Extension icons
```

## 🔧 How It Works

1. **Order Detection**: Intercepts network requests to TopstepX API
   - POST `/Order` → Create order
   - PATCH `/Order/edit/stopLimit/{id}` → Modify order

2. **Data Extraction**: Parses order data
   - `symbolId`: Instrument (e.g., "F.US.MNQ" → "MNQ")
   - `limitPrice` or `stopPrice`: Entry price
   - `positionSize`: Quantity and side (positive=LONG, negative=SHORT)
   - `type`: Order type (1=Limit, 2=Market, 4=Stop)

3. **Calculation**: Computes SL/TP prices
   - Uses instrument specs (tick size, tick value)
   - Applies configured SL/TP dollar amounts
   - Calculates correct direction based on LONG/SHORT

4. **Rendering**: Draws lines on TradingView chart
   - Direct access to chart API (runs in MAIN world)
   - Creates horizontal lines with labels
   - Updates dynamically when order moves

## 📊 Supported Instruments

Currently supports all TopstepX futures:
- **Micro E-mini**: MES, MNQ, M2K, MYM
- **E-mini**: ES, NQ, RTY, YM
- **Micro Crude Oil**: MCL
- **Crude Oil**: CL
- And more...

Each instrument has precise tick size and tick value specifications for accurate calculations.

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Reporting Issues

If you find a bug or have a suggestion:
1. Check existing [Issues](https://github.com/cmacha2/topstepx-sl-tp-assistant/issues)
2. Create a new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Console logs (F12 → Console)

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Test thoroughly on TopstepX
5. Commit (`git commit -m 'Add AmazingFeature'`)
6. Push to branch (`git push origin feature/AmazingFeature`)
7. Open a Pull Request

### Development Guidelines

- Use ES6+ JavaScript
- Follow existing code style
- Add console logs for debugging (`console.log('[TopstepX ...]')`)
- Test with LONG and SHORT positions
- Test with different instruments
- Document any new features

## 🐛 Troubleshooting

### Lines not appearing?

1. **Check console logs** (F12 → Console)
   - Look for `[TopstepX v4.3.1]` banner
   - Look for `✅ All interceptors installed successfully`

2. **Verify order detection**
   - Create a limit order
   - Check for `🆕 CREATE ORDER detected` log
   - Verify symbol, price, and side are correct

3. **Check chart connection**
   - Look for `✅ Chart found and ready!` log
   - If not found, refresh the page

### Lines in wrong position?

- Verify the order type (LONG vs SHORT)
- Check console: `Side from order: LONG` or `SHORT`
- For LONG: SL should be below, TP above
- For SHORT: SL should be above, TP below

### Extension not loading?

1. Go to `chrome://extensions/`
2. Check for errors under the extension
3. Click "Reload" button
4. Refresh TopstepX page (F5)

## 📝 Changelog

### v4.3.1 (2024-12-11)
- ✨ Minimalist UI with thinner lines (1px default)
- 📝 Compact labels: `SL -$100 (1x)` format
- 🎨 Smaller font size (10px) for cleaner look
- 🔧 Line width configurable 1-10px

### v4.3.0 (2024-12-11)
- 🎯 Full order type detection (Limit, Stop, Market)
- 📊 Smart position logic (LONG/SHORT based on positionSize)
- ✅ Market orders skip line rendering
- 🔧 Enhanced logging for debugging

### v4.2.0 (2024-12-10)
- 🔄 Dynamic value updates when dragging orders
- 💰 Real-time dollar recalculation
- 📈 Contract quantity display

## 🏪 Publishing to Chrome Web Store

Want to help distribute this extension? See the complete guide:
- **[Chrome Web Store Publishing Guide](CHROME-STORE-GUIDE.md)** - Complete guide
- **[Quick Publish Guide](QUICK-PUBLISH.md)** - Fast track (30 minutes)

### Build for Store

```bash
./build-store.sh
```

This creates a clean ZIP file ready for Chrome Web Store submission.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Privacy

This extension does NOT collect any personal data. All settings are stored locally on your device.

See [Privacy Policy](PRIVACY-POLICY.md) for complete details.

## 🙏 Acknowledgments

- Built for the TopstepX trading community
- Uses TradingView chart API
- Inspired by the need for better visual risk management
- Open source contributors

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/cmacha2/topstepx-sl-tp-assistant/issues)
- **Discussions**: [GitHub Discussions](https://github.com/cmacha2/topstepx-sl-tp-assistant/discussions)
- **Documentation**: [Complete Guides](https://github.com/cmacha2/topstepx-sl-tp-assistant/tree/main)

## ⚠️ Disclaimer

**Important:** This extension is a VISUAL TOOL ONLY and does not provide financial advice.

- ❌ Not affiliated with TopstepX or TradingView
- ❌ No guaranteed profits
- ❌ No automatic trade execution
- ⚠️ Trading involves substantial risk of loss

**Always verify your stop loss and take profit levels before executing trades. Use at your own risk.**

---

<div align="center">

**Made with ❤️ for TopstepX traders**

⭐ Star this repo if you find it helpful!

</div>
