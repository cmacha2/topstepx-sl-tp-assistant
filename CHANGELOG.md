# Changelog

All notable changes to the TopstepX SL/TP Visual Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.5.1] - 2024-12-12

### 🐛 Critical Fix - Lines Not Showing

#### Fixed
- **Lines Visibility Issue**: Fixed critical bug where lines weren't showing for existing orders
- **hasActiveOrder Logic**: Improved order detection logic to work with existing orders
- **DOM Detection**: Lines now properly show when DOM observer detects order data
- **Market Order Prevention**: Still correctly prevents lines for market orders

#### Problem Identified
The `hasActiveOrder` flag was blocking all lines unless an order was created AFTER loading the extension. This meant:
- ❌ Existing orders didn't show lines
- ❌ Page refreshes cleared the flag
- ❌ DOM-detected orders were ignored

#### Solution Implemented
1. **Auto-detection**: When DOM provides price/symbol data, automatically enable lines
2. **Smart Validation**: `hasActiveOrder` flag set automatically in `updateLines()`
3. **Explicit Blocking**: Only market orders explicitly disable lines
4. **State Management**: Better flag management in `handleOrderData()`

#### Technical Changes
- Modified `updateLines()`: Auto-enables flag when valid data exists
- Enhanced `handleOrderData()`: Explicitly sets flag for limit/stop orders
- Updated `handleDOMData()`: Better comment about order detection

#### User Experience
- ✅ Lines now appear for existing orders
- ✅ Refresh page → lines still work
- ✅ Open order ticket → lines appear immediately
- ✅ Market orders → correctly no lines (as intended)

#### Files Modified
- `content-scripts/main-content-v4.js` - Fixed order detection logic

---

## [4.5.0] - 2024-12-12

### 🚀 API Integration & Order Persistence

#### Added - API Integration
- **Position Brackets API**: Automatic updates to TopstepX position brackets endpoint
- **Debouncing System**: Smart debouncing (500ms local + 1000ms API) prevents excessive requests
- **API Client Module**: New `lib/api-client.js` for centralized API communication
- **Authorization Handling**: Automatic token retrieval from localStorage
- **Account ID Management**: Configurable account ID via localStorage or API

#### Added - Order Persistence
- **Order Context Module**: New `lib/order-context.js` for state management
- **localStorage Integration**: Orders persist across page reloads and browser restarts
- **Auto-Restore**: Lines automatically restore from saved state on page load
- **Order Lifecycle**: Full tracking of order states (pending, active, filled, cancelled)
- **24-Hour Retention**: Automatic cleanup of old orders

#### Enhanced - Drag & Drop
- **API Updates on Drag**: Position brackets update automatically after dragging lines
- **Debounced Updates**: Smart timing prevents API spam while dragging
- **Real-time Labels**: Immediate visual feedback during drag operations
- **Persistent Changes**: Dragged positions saved to localStorage and API

#### Technical Implementation
- **APIClient Class**:
  - Debounced API calls with configurable delay
  - Token and account ID management
  - Error handling and status reporting
  - Support for `setPositionBrackets` endpoint

- **OrderContext Class**:
  - Full order state management
  - localStorage persistence layer
  - Event subscription system
  - Order validation and cleanup

- **Chart Access Integration**:
  - Drag event listeners with debouncing
  - Automatic API updates after drag end
  - Order context synchronization
  - Line restoration from persisted state

#### User Experience
- ✅ Drag lines → API automatically updates position brackets
- ✅ Refresh page → Lines restore to last position
- ✅ Navigate away → State persists in localStorage
- ✅ Cancel order → Lines clear and storage updates
- ✅ Browser restart → Orders restore if within 24 hours

#### API Endpoint
```
POST https://userapi.topstepx.com/TradingAccount/setPositionBrackets
Body: {
  accountId: number,
  autoApply: boolean,
  risk: number,      // SL in dollars
  toMake: number     // TP in dollars
}
```

#### Setup Required
1. Set account ID: `localStorage.setItem('topstep_account_id', 'YOUR_ID')`
2. Token automatically retrieved from TopstepX login
3. Extension handles the rest automatically

#### Documentation
- `API-INTEGRATION-GUIDE.md` - Complete technical guide
- `QUICK-REFERENCE-API.md` - Quick setup and troubleshooting
- `TEST-API-INTEGRATION.js` - Comprehensive test suite

#### Files Added
- `lib/api-client.js` - API communication layer
- `lib/order-context.js` - Order state management
- `API-INTEGRATION-GUIDE.md` - Full documentation
- `QUICK-REFERENCE-API.md` - Quick reference
- `TEST-API-INTEGRATION.js` - Testing utilities

#### Files Modified
- `manifest.json` - Added new library references
- `content-scripts/main-content-v4.js` - Integrated API and persistence
- `lib/chart-access.js` - Added drag handlers and API calls
- `ui/drag-handler.js` - Enhanced with API support

#### Future Enhancements
- Auto-detect account ID from API responses
- Retry logic for failed API calls
- Order history tracking
- Multi-tab synchronization
- User-facing error notifications

---

## [4.4.2] - 2024-12-11

### 🗑️ Order Lifecycle Management

#### Added
- **Auto Clear on Cancel**: Lines automatically removed when order is cancelled
- **Order Cancellation Detection**: Intercepts DELETE requests to `/Order/cancel/`
- **Order ID Tracking**: Verifies cancelled order matches active order
- **State Management**: Updates `hasActiveOrder` flag on cancellation

#### Technical Implementation - Order Cancellation
- Intercepts DELETE requests in both fetch and XHR
- Extracts order ID from URL pattern: `/Order/cancel/{accountId}/id/{orderId}`
- Compares with active order ID before clearing
- Emits `orderCancelled` event to main content script
- Clears chart lines via `chartAccess.clearLines()`

#### User Experience - Order Cancellation
- ✅ Cancel order in TopstepX → Lines disappear automatically
- ✅ No manual cleanup needed
- ✅ Clean chart when order is not active
- ✅ Console logging for debugging

#### Example Flow
```
User cancels order in TopstepX
  ↓
DELETE /Order/cancel/{accountId}/id/{orderId}
  ↓
Network Interceptor detects DELETE
  ↓
Extracts and compares order ID
  ↓
Emits 'orderCancelled' event
  ↓
Main content clears lines
  ↓
Chart is clean
```

#### Files Modified
- `lib/network-interceptor.js` - Added DELETE request interception
- `content-scripts/main-content-v4.js` - Added `orderCancelled` event handler
- `ORDER-LIFECYCLE-MANAGEMENT.md` - Complete documentation (NEW)
- `ORDER-CANCEL-FEATURE.md` - Quick guide (NEW)

#### Impact
- ✅ Clean chart management
- ✅ No manual cleanup required
- ✅ Better visual feedback
- ✅ Professional user experience

## [4.4.1] - 2024-12-11

### 🐛 Critical BugFix

#### Fixed
- **Undefined Value Parse Error**: Fixed `"undefined" cannot be parsed` error when loading popup with old configurations
- **Config Merging**: Storage manager now automatically merges saved configs with defaults
- **Safe Value Assignment**: Added helper functions to prevent undefined values in form inputs
- **DOM Validation**: Added element existence checks with detailed error logging

#### Enhanced
- **Backward Compatibility**: Old configs (pre-v4.4.0) now load seamlessly with new defaults
- **Forward Compatibility**: New fields automatically added when missing
- **Storage Manager**: Enhanced `getConfig()` and `updateConfig()` with triple-merge strategy
- **Logging**: Added comprehensive debug logging for config loading

#### Added
- **Migration Script**: Optional manual migration utility (`scripts/migrate-config.js`)
- **BugFix Documentation**: Detailed analysis in `BUGFIX-UNDEFINED-VALUES.md`

#### Technical
- **popup.js**: Added `safeSet()`, `safeCheck()`, `safeText()` helpers
- **storage-manager.js**: Enhanced config merging with spread operators
- **DOM Caching**: Added validation to detect missing elements

#### Impact
- ✅ Popup loads without errors on upgrade from v4.3.x
- ✅ No data loss from existing configurations
- ✅ Proper defaults for all new v4.4.0 fields
- ✅ Production-ready upgrade path

## [4.4.0] - 2024-12-11

### 🎨 Full Customization Update

#### Added - Visual Settings
- **Line Style Options**: Solid, Dotted, or Dashed lines (separate for SL/TP)
- **Line Opacity**: Adjustable transparency (0-100%)
- **Font Size Control**: Configurable label font size (8-16px)
- **Label Format Options**: 
  - Compact: `SL -$100 (1x)`
  - Full: `STOP LOSS: -$100.00 (1x)`
  - Minimal: `SL -$100`
- **Custom Text Labels**: Customize SL/TP prefix text (any language/symbols)
- **Emoji Support**: Optional emoji icons (🛑 🎯)

#### Added - Display Options
- **Decimal Control**: Toggle decimal places on dollar amounts
- **Contract Display**: Toggle contract count visibility
- **Bold Text**: Make labels bold for better visibility
- **Auto-hide Market Orders**: Automatically hide lines for market orders

#### Added - Configuration
- **Complete Dashboard**: All settings now accessible via UI
- **25+ Configuration Options**: Every aspect fully customizable
- **Preset Examples**: 5 professional configuration presets
- **Configuration Guide**: Complete documentation (CONFIGURATION-GUIDE.md)

#### Enhanced
- **Format Label Function**: Smart label formatting based on config
- **Dynamic Updates**: Labels update using configured format
- **Storage Manager**: Extended with all new config options
- **Popup UI**: Reorganized with subsections and better layout

#### Improved
- **CSS Styling**: Added styles for select dropdowns and text inputs
- **Form Validation**: All new fields properly validated
- **Persistence**: All settings saved and restored correctly
- **Code Structure**: Clean, maintainable, production-ready

#### Technical
- **chart-access.js**: Added `formatLabel()` function
- **storage-manager.js**: Extended DEFAULT_CONFIG with 15+ new options
- **popup.html**: Reorganized into logical subsections
- **popup.css**: New styles for selects, subsections, and inputs
- **popup.js**: Updated to handle all new configuration fields

### Configuration Options Summary

**Visual - Lines:**
- Line width (1-10px)
- Line style (solid/dotted/dashed) - separate for SL/TP
- Line opacity (0-100%)
- Line colors

**Visual - Text:**
- Font size (8-16px)
- Font weight (normal/bold)
- Label format (compact/full/minimal)
- Custom prefix text (SL/TP)
- Emoji icons toggle

**Display:**
- Show labels toggle
- Show decimals toggle
- Show contracts toggle
- Bold text toggle
- Use emojis toggle

**Behavior:**
- Persist lines across sessions
- Auto-update on price change
- Auto-hide for market orders
- Play sound alert

### Presets Included

1. **Minimalist Trader**: Ultra-clean, minimal distraction
2. **Professional Trader**: Balanced visibility and info
3. **Beginner Trader**: Maximum information, high visibility
4. **Day Trader**: Fast execution, auto-clearing
5. **Swing Trader**: Visual emphasis, persistent lines

### Documentation
- ✅ CONFIGURATION-GUIDE.md: Complete configuration reference
- ✅ 5 detailed preset examples
- ✅ Visual comparisons (line width, font size, formats)
- ✅ Best practices for different trading styles
- ✅ 25+ configuration examples

### Breaking Changes
None - Fully backward compatible. Existing configs will use new defaults for added features.

---

## [4.3.1] - 2024-12-11

### 🎯 Minimalist UI Update

#### Changed
- **Line Width**: Default changed from 3px to 1px (minimalist)
- **Font Size**: Reduced from 13px to 10px
- **Font Weight**: Changed from bold to normal (thinner)
- **Label Format**: Simplified from full to compact
  - Before: `🛑 STOP LOSS: -$100.00 (1x)`
  - After: `SL -$100 (1x)`
- **Decimal Display**: Changed from .00 to whole numbers

#### Removed
- Emoji icons from default labels (optional now)
- Heavy bold styling

---

## [4.3.0] - 2024-12-11

### 🎯 Complete Order Detection System

#### Added
- **Full Order Type Support**:
  - Limit orders (type: 1)
  - Market orders (type: 2)
  - Stop orders (type: 4)
- **Smart Position Logic**: Correct SL/TP placement based on LONG/SHORT
- **Position Size Detection**: Uses `positionSize` field (+/- for LONG/SHORT)
- **Market Order Handling**: Lines don't show for market orders

#### Enhanced
- **Network Interceptor**: Detects order type from `type` field
- **Logging System**: Ultra-detailed console logs
- **Side Detection**: Correctly identifies LONG vs SHORT from positionSize

#### Fixed
- Lines now appear in correct positions for SHORT positions
- Stop orders properly detected and handled
- Contract quantity correctly extracted from absolute value

---

## [4.2.0] - 2024-12-10

### 🔄 Dynamic Updates

#### Added
- **Real-time Value Updates**: Lines update when orders are dragged
- **Dynamic Labels**: Dollar amounts recalculate in real-time
- **Contract Display**: Shows quantity on labels

---

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
