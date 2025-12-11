# Changelog

All notable changes to the TopstepX SL/TP Visual Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-10

### 🎉 Initial Release

#### Added
- **Visual SL/TP Lines**: Display Stop Loss and Take Profit lines on TradingView charts
- **Risk-Based Calculations**: Automatic contract sizing based on account risk
- **Drag-to-Adjust**: Manually adjust SL/TP levels by dragging chart lines
- **Multi-Instrument Support**: Support for 8 futures instruments
  - Micros: MNQ, MES, MYM, M2K
  - Full-size: ES, NQ, YM, RTY
- **Configuration UI**: User-friendly popup for settings management
- **Risk Management Modes**:
  - Percentage of account (e.g., 2% of $50,000)
  - Fixed dollar amount (e.g., $500 per trade)
- **Risk:Reward Ratios**: Automatic TP calculation based on SL (e.g., 1:2 ratio)
- **Real-Time Updates**: Automatic recalculation on instrument/price changes
- **Persistent Settings**: Configuration saved via Chrome Storage sync
- **Cross-Frame Communication**: Secure messaging between parent and iframe
- **Entry Line**: Visual reference for entry price level

#### Core Components
- `CalculationEngine`: Risk and P&L calculation engine
- `InstrumentDatabase`: Complete tick specifications for all supported instruments
- `StorageManager`: Configuration persistence and defaults
- `MessageBridge`: Cross-frame communication system
- `LineRenderer`: TradingView chart line drawing
- `DragHandler`: Interactive line manipulation
- `main-content.js`: TopstepX DOM integration
- `iframe-content.js`: TradingView Widget integration
- `popup.js`: Settings UI controller

#### Features
- ✅ Automatic contract quantity calculation
- ✅ Visual line colors customization
- ✅ Line width adjustment
- ✅ Auto-update on price changes
- ✅ Support for long and short positions
- ✅ Real-time P&L recalculation on drag
- ✅ Console logging for debugging
- ✅ Error handling and recovery

#### Documentation
- README.md: Complete user and technical documentation
- QUICKSTART.md: 5-minute setup guide
- DEVELOPMENT.md: Developer guide with debugging tips
- PROJECT-STRUCTURE.md: Architecture and file organization
- Icon generation tool with instructions

#### Technical Details
- Manifest V3 compliant
- Pure vanilla JavaScript (no dependencies)
- ~3,600 lines of code across 13 JavaScript files
- Iframe injection using `match_origin_as_fallback`
- TradingView Widget API integration
- Chrome Storage API for persistence
- PostMessage API for cross-frame communication
- MutationObserver for DOM change detection

### Known Limitations
- Only works on TopstepX.com platform
- Requires TradingView chart to be loaded
- Manual order placement (no auto-execution)
- Limited to supported instruments (8 futures contracts)
- Desktop Chrome only (no mobile support)

### Security
- ✅ No external network requests
- ✅ All data stored locally
- ✅ Origin validation on all messages
- ✅ Minimal permissions requested
- ✅ No credentials or sensitive data handling

---

## [Unreleased]

### Planned Features (Future Versions)

#### v1.1.0 (Enhancement Release)
- [ ] Additional instruments (CL, GC, etc.)
- [ ] Sound alerts for price approaching SL/TP
- [ ] Keyboard shortcuts for line adjustment
- [ ] Dark/light theme for popup
- [ ] Export/import configuration
- [ ] Multiple risk profiles

#### v1.2.0 (Advanced Features)
- [ ] Trade journal integration
- [ ] Screenshot capture on trade setup
- [ ] Performance statistics tracking
- [ ] Risk heatmap overlay
- [ ] Multi-timeframe line display
- [ ] Support/resistance integration

#### v2.0.0 (Major Update)
- [ ] Bracket order integration (auto-submit SL/TP orders)
- [ ] TopstepX API integration
- [ ] OCO (One-Cancels-Other) functionality
- [ ] Advanced order types support
- [ ] Multi-account management
- [ ] Cloud sync for settings

#### Future Considerations
- [ ] Support for other trading platforms
- [ ] Mobile/tablet version
- [ ] Chrome Web Store publishing
- [ ] Auto-update mechanism
- [ ] Telemetry (opt-in) for improvements
- [ ] Community feature requests

---

## Version History

### Version Numbering
- **Major (X.0.0)**: Breaking changes, major new features
- **Minor (1.X.0)**: New features, backward compatible
- **Patch (1.0.X)**: Bug fixes, minor improvements

### Release Schedule
- **Patch releases**: As needed for critical bugs
- **Minor releases**: Monthly (feature additions)
- **Major releases**: Quarterly (significant changes)

---

## How to Update

### For Users
1. Download latest version
2. Replace extension folder
3. Go to `chrome://extensions/`
4. Click "Reload" on the extension
5. Verify new version number

### For Developers
1. Update version in `manifest.json`
2. Update this CHANGELOG.md
3. Test all functionality
4. Create git tag: `git tag v1.0.0`
5. Push to repository

---

## Feedback & Issues

We welcome feedback and bug reports!

**Found a bug?**
- Check console for error messages
- Note your Chrome version
- Note the instrument/settings used
- Document steps to reproduce

**Feature requests?**
- Describe the use case
- Explain expected behavior
- Include mockups if applicable

---

## Credits

### Built With
- Chrome Extension Manifest V3
- TradingView Charting Library API
- Vanilla JavaScript (ES6+)

### Inspiration
- Traders needing visual risk management
- TopstepX evaluation account challenges
- TradingView's powerful charting capabilities

---

## License

This project is for personal use. Always ensure compliance with:
- TopstepX Terms of Service
- TradingView Terms of Service
- Chrome Web Store Developer Program Policies

---

## Disclaimer

**Trading involves substantial risk of loss.**

This extension is:
- ✅ A visual aid for risk management
- ✅ An educational tool
- ✅ A calculator for position sizing

This extension is NOT:
- ❌ Financial advice
- ❌ A guarantee of profits
- ❌ An auto-trading system
- ❌ A replacement for proper risk management

**Always verify calculations independently before placing trades.**

Use at your own risk. The developers assume no liability for trading losses.

---

*Last updated: December 10, 2024*
