<div align="center">

<img src="assets/icons/icon128.png" alt="TopstepX SL/TP Assistant" width="100">

# TopstepX SL/TP Assistant

**Automatic Stop Loss & Take Profit visualization for TopstepX**

[![Download v4.5.8](https://img.shields.io/badge/⬇_Download-v4.5.8-00C853?style=for-the-badge)](https://github.com/cmacha2/topstepx-sl-tp-assistant/releases/latest/download/topstepx-sltp-assistant-v4.5.8.zip)
&nbsp;
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://github.com/cmacha2/topstepx-sl-tp-assistant/releases)
&nbsp;
[![MIT License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

Place an order → See your risk instantly

</div>

<br>

## Overview

TopstepX SL/TP Assistant is a Chrome extension that draws Stop Loss and Take Profit lines directly on your TradingView chart when trading on TopstepX. It calculates dollar values in real-time, helping you visualize risk before executing trades.

**Key Features:**
- Automatic SL/TP line placement on limit and stop orders
- Real-time dollar value calculations
- Lines update when you drag orders on the chart
- Fully customizable colors, width, and default values
- Works with all TopstepX futures instruments

<br>

---

## For Traders

### Quick Install

1. **Download** the [latest release](https://github.com/cmacha2/topstepx-sl-tp-assistant/releases/latest/download/topstepx-sltp-assistant-v4.5.8.zip)
2. **Extract** the ZIP to any folder
3. **Open** `chrome://extensions` in Chrome
4. **Enable** "Developer mode" (toggle in top-right)
5. **Click** "Load unpacked" and select the extracted folder
6. **Trade** on [TopstepX](https://topstepx.com) — lines appear automatically

### How It Works

| Action | Result |
|--------|--------|
| Place a limit/stop order | SL (red) and TP (green) lines appear |
| Drag order on chart | Lines recalculate to new entry price |
| Cancel order | Lines disappear |
| Modify quantity | Dollar values update |

### Position Logic

| Position | Stop Loss | Take Profit |
|----------|-----------|-------------|
| **Long** | Below entry | Above entry |
| **Short** | Above entry | Below entry |

### Configuration

Click the extension icon to access settings:

| Setting | Default | Description |
|---------|---------|-------------|
| Stop Loss | $100 | Default SL per contract |
| Take Profit | $200 | Default TP per contract |
| SL Color | Red | Stop loss line color |
| TP Color | Green | Take profit line color |
| Line Width | 1px | Line thickness (1-10) |

### Supported Instruments

| Micro | Standard | Commodities |
|-------|----------|-------------|
| MES, MNQ, M2K, MYM | ES, NQ, RTY, YM | CL, MCL, GC, SI |

<br>

---

## For Developers

### Architecture

```
topstepx-sl-tp-assistant/
├── manifest.json           # Extension config (Manifest V3)
├── background/
│   └── service-worker.js   # Background service worker
├── content-scripts/
│   ├── main-content-v4.js  # Main logic (runs in MAIN world)
│   └── config-bridge.js    # Storage bridge (ISOLATED world)
├── lib/
│   ├── chart-access.js     # TradingView chart API integration
│   ├── network-interceptor.js  # XHR/Fetch interception
│   ├── smart-dom-observer.js   # DOM mutation observer
│   ├── calculations.js     # SL/TP price calculations
│   ├── instrument-database.js  # Tick sizes & values
│   └── storage-manager.js  # Chrome storage wrapper
└── popup/                  # Settings UI
```

### Technical Details

**Content Script Worlds:**
- `MAIN` world: Accesses TradingView's `window.tradingViewApi` for chart manipulation
- `ISOLATED` world: Accesses `chrome.storage` for configuration

**Order Detection:**
- Intercepts `POST /Order` for new orders
- Intercepts `PATCH /Order/edit/stopLimit/{id}` for modifications
- Parses `symbolId`, `limitPrice`/`stopPrice`, `positionSize`, and `type`

**Position Size Logic:**
- Positive `positionSize` → Long position
- Negative `positionSize` → Short position

### Building

```bash
# Clone repository
git clone https://github.com/cmacha2/topstepx-sl-tp-assistant.git
cd topstepx-sl-tp-assistant

# Load in Chrome
# 1. Go to chrome://extensions
# 2. Enable Developer mode
# 3. Load unpacked → select project folder
```

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and test on TopstepX
4. Commit: `git commit -m "feat: add my feature"`
5. Push: `git push origin feature/my-feature`
6. Open a Pull Request

<br>

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Lines not appearing | Open DevTools (F12), check for `[TopstepX v4]` logs |
| Wrong line positions | Verify order type (long vs short) in console |
| Extension not loading | Reload extension at `chrome://extensions`, then refresh page |

<br>

---

## Changelog

**v4.5.8** — Fixed line drawing, order edit detection, drag handling  
**v4.5.5** — Added stop order support, persistent lines  
**v4.3.0** — Full order type detection, smart position logic

[View all releases](https://github.com/cmacha2/topstepx-sl-tp-assistant/releases)

<br>

---

## License & Privacy

**MIT License** — Free to use, modify, and distribute.

**Privacy** — No data collection. All settings stored locally via `chrome.storage.local`.

See [LICENSE](LICENSE) and [PRIVACY-POLICY.md](PRIVACY-POLICY.md)

<br>

---

<div align="center">

**[Download](https://github.com/cmacha2/topstepx-sl-tp-assistant/releases)** · **[Issues](https://github.com/cmacha2/topstepx-sl-tp-assistant/issues)** · **[Releases](https://github.com/cmacha2/topstepx-sl-tp-assistant/releases)**

<sub>⚠️ This is a visual tool only. Not affiliated with TopstepX or TradingView. Trading involves risk.</sub>

</div>
