# TopstepX SL/TP Assistant

<div align="center">

![Version](https://img.shields.io/badge/version-4.5.8-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome](https://img.shields.io/badge/chrome-extension-yellow.svg)

**Visual Stop Loss and Take Profit lines with automatic risk calculation for TopstepX traders**

[Features](#-features) • [Download](#-download--installation) • [Usage](#-usage) • [Configuration](#️-configuration)

</div>

---

## 📥 Download & Installation

### ⬇️ Quick Install (Recommended)

1. **Download the latest version:**

   [![Download v4.5.8](https://img.shields.io/badge/Download-v4.5.8-brightgreen?style=for-the-badge&logo=googlechrome)](https://github.com/cmacha2/topstepx-sl-tp-assistant/releases/latest/download/topstepx-sltp-assistant-v4.5.8.zip)

   Or go to [Releases](https://github.com/cmacha2/topstepx-sl-tp-assistant/releases) and download the `.zip` file.

2. **Extract the ZIP file** to a folder on your computer (e.g., `Desktop/topstepx-extension`)

3. **Open Chrome Extensions:**
   - Type `chrome://extensions/` in your browser address bar
   - Or go to Menu → More Tools → Extensions

4. **Enable Developer Mode:**
   - Toggle the switch in the **top right corner**

5. **Load the Extension:**
   - Click **"Load unpacked"** button
   - Select the folder where you extracted the ZIP
   - The extension icon should appear in your toolbar

6. **Start Trading:**
   - Go to [TopstepX.com](https://topstepx.com)
   - Open a chart and place a limit order
   - SL/TP lines will appear automatically! 🎯

### 📷 Installation Steps

```
Step 1: Download ZIP → Step 2: Extract → Step 3: chrome://extensions/
    ↓                       ↓                        ↓
Step 4: Enable "Developer mode" → Step 5: "Load unpacked" → Step 6: Select folder
    ↓
✅ Extension installed! Go to TopstepX and place an order.
```

---

## 🎯 Overview

TopstepX SL/TP Assistant automatically draws Stop Loss and Take Profit lines on your charts when you place limit or stop orders. It helps you visualize your risk and potential profit in real-time.

### ✨ Key Features

- ✅ **Automatic Line Placement** - Lines appear when you place limit/stop orders
- 📊 **Dynamic Values** - Dollar amounts update as you drag orders
- 🎨 **Fully Customizable** - Colors, line width, and display options
- 🔄 **Real-Time Updates** - Lines follow your order modifications
- 💾 **Persistent** - Lines survive page refresh and navigation
- 💰 **Risk Management** - Configure default SL/TP values

---

## 🚀 Features

### Automatic Order Detection

The extension detects when you:
- ✅ Create a **Limit Order** (Buy/Sell)
- ✅ Create a **Stop Order** (Buy/Sell)
- ✅ **Modify** an existing order (drag on chart)
- ✅ **Cancel** an order (lines disappear)

### Visual Lines

| Line | Color | Description |
|------|-------|-------------|
| **Stop Loss** | 🔴 Red | Shows potential loss |
| **Take Profit** | 🟢 Green | Shows potential profit |

Labels display dollar amounts: `SL -$100` and `TP +$200`

### Smart Position Logic

| Position | Stop Loss | Take Profit |
|----------|-----------|-------------|
| **LONG** | Below entry | Above entry |
| **SHORT** | Above entry | Below entry |

---

## 🎮 Usage

### Basic Workflow

1. **Open a chart** on TopstepX
2. **Place a limit or stop order** on the chart
3. **Lines appear automatically**:
   - 🔴 Red line for Stop Loss
   - 🟢 Green line for Take Profit
4. **Drag the order** to modify - lines update in real-time
5. **Cancel the order** - lines disappear

### Example

```
Create Limit Buy Order at 25700 (1 contract)
                    ↓
Extension automatically draws:
  🟢 TP Line: 25900 (+$200)    ← Above entry
  📍 Entry:   25700
  🔴 SL Line: 25600 (-$100)    ← Below entry
```

---

## ⚙️ Configuration

Click the extension icon to open settings:

### Risk Management
- **Risk Mode**: Percentage or Fixed amount
- **Account Size**: Your total account size
- **Stop Loss**: Default SL in dollars (e.g., $100)
- **Take Profit**: Default TP in dollars (e.g., $200)
- **Use Ratio**: Auto-calculate TP from SL (e.g., 1:2)

### Visual Settings
- **Stop Loss Color**: Default red (#FF0000)
- **Take Profit Color**: Default green (#00FF00)
- **Line Width**: 1-10px (default: 1px)

---

## 📊 Supported Instruments

- **Micro E-mini**: MES, MNQ, M2K, MYM
- **E-mini**: ES, NQ, RTY, YM
- **Crude Oil**: CL, MCL
- And more...

---

## 🐛 Troubleshooting

### Lines not appearing?

1. Open DevTools (F12) → Console
2. Look for `[TopstepX v4]` messages
3. Verify you see `✅ Chart connected!`
4. Try placing a new limit order

### Lines in wrong position?

- Check the order type (LONG vs SHORT)
- For LONG: SL below, TP above
- For SHORT: SL above, TP below

### Extension not loading?

1. Go to `chrome://extensions/`
2. Click the reload button on the extension
3. Refresh TopstepX page (Ctrl+Shift+R)

---

## 📝 Changelog

### v4.5.8 (2024-12-31)
- 🔧 Fixed line drawing with world: MAIN configuration
- 🔧 Fixed order edit detection (drag to modify price)
- 🔧 Fixed drag detection to prevent line recreation
- 🔧 Improved DOM observer to ignore false side changes
- 🧹 Cleaned up repository

### v4.5.5 (2024-12-15)
- 🛡️ Stop orders support
- 💾 Persistent lines on navigation
- 🔧 Auto-clear on cancel/execute

[View full changelog](CHANGELOG.md)

---

## 📄 License

MIT License - see [LICENSE](LICENSE)

## 🔒 Privacy

This extension does NOT collect any personal data. All settings are stored locally.

See [Privacy Policy](PRIVACY-POLICY.md)

---

## ⚠️ Disclaimer

This extension is a **VISUAL TOOL ONLY** and does not provide financial advice.

- ❌ Not affiliated with TopstepX or TradingView
- ❌ No automatic trade execution
- ⚠️ Trading involves substantial risk of loss

**Always verify your stop loss and take profit levels before executing trades.**

---

<div align="center">

**Made with ❤️ for TopstepX traders**

⭐ Star this repo if you find it helpful!

[Report Bug](https://github.com/cmacha2/topstepx-sl-tp-assistant/issues) • [Request Feature](https://github.com/cmacha2/topstepx-sl-tp-assistant/issues)

</div>
