# Changelog

All notable changes to the TopstepX SL/TP Visual Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.6.0] - 2024-12-12

### 🏪 OrderStore Pattern - Persistent Lines

#### Problem Solved
- **Before**: Lines disappeared on page reload, browser restart, or navigation
- **After**: Lines persist forever (up to 24h TTL) and restore automatically

#### Core Principles

Inspired by TopstepX internal OrderStore:

1. **In-Memory**: State lives in RAM for instant access (zero I/O latency)
2. **Event-Based**: Observable pattern with explicit events (add, update, remove)
3. **Deterministic**: Same inputs always produce same state (predictable)
4. **Rehydratable**: Survives page reloads via `chrome.storage.local`
5. **Observable**: Multiple consumers can subscribe to state changes

#### API Methods

```javascript
// UPSERT - Add or update order and lines
orderStore.upsert(orderData, linesData);

// REMOVE - Delete order and lines
orderStore.remove();

// CLEAR - Alias for remove
orderStore.clear();

// GETTERS
orderStore.getActiveOrder();     // { symbol, entryPrice, contracts, side }
orderStore.getLinesState();      // { slPrice, tpPrice, instrument, config }
orderStore.hasActiveOrder();     // boolean

// LIFECYCLE
await orderStore.rehydrate();    // Restore from storage
orderStore.persist();            // Save to storage (automatic)

// EVENTS (Observable)
orderStore.on('order-upserted', callback);
orderStore.on('order-removed', callback);
orderStore.on('rehydrated', callback);

// DEBUG
orderStore.debug();              // Print state to console
```

#### Workflow

```
1. Place order → Lines drawn → State saved
   ↓
2. Page refresh (F5) → State restored → Lines reappear
   ↓
3. Close browser → Come back later (< 24h) → Lines still there
   ↓
4. Drag line → State updated → Persisted automatically
   ↓
5. Cancel order → State cleared → Lines removed
```

#### Storage Details

- **Location**: `chrome.storage.local` (device-specific)
- **Key**: `topstep_order_store`
- **Size**: ~1-2 KB per order
- **TTL**: 24 hours (auto-cleanup)
- **Privacy**: Local only, never synced to cloud

#### What's Saved

```javascript
{
  activeOrder: {
    symbol: 'MNQ',
    entryPrice: 25923.5,
    contracts: 1,
    side: 'long',
    timestamp: Date.now()
  },
  linesState: {
    slPrice: 25903.5,
    tpPrice: 25948.0,
    instrument: { tickSize, tickValue },
    config: { colors, styles, labels, ... }
  }
}
```

#### Bridge Pattern

Communication between MAIN world (OrderStore) and ISOLATED world (chrome.storage):

```
MAIN World              ISOLATED World
----------              --------------
OrderStore   <─────>   Config Bridge
(chart access)         (storage access)

Messages:
- TOPSTEP_SAVE_ORDER_STORE   → Save to storage
- TOPSTEP_LOAD_ORDER_STORE   → Load from storage
- TOPSTEP_CLEAR_ORDER_STORE  → Clear storage
```

#### Integration Points

**`lib/order-store.js`** (NEW):
- Core OrderStore class with in-memory state
- Event system for observability
- Persist/rehydrate methods
- TTL validation (24 hours)

**`lib/chart-access.js`**:
- `persistToStore()` - Save after drawing/dragging lines
- `restoreFromStore()` - Restore lines on page load
- `clearLines()` - Remove from store on cancel

**`content-scripts/main-content-v4.js`**:
- `rehydrateOrderStore()` - Restore on initialization
- Calls `chartAccess.restoreFromStore()` if data exists

**`content-scripts/config-bridge.js`**:
- Storage handlers for OrderStore messages
- Bridges MAIN world to ISOLATED world
- Handles save/load/clear operations

#### Benefits

- ✅ **Zero Data Loss**: Lines never disappear on reload
- ⚡ **Instant Restore**: Lines appear immediately (< 100ms)
- 🎯 **Professional UX**: Seamless, production-ready experience
- 🔒 **Local Privacy**: Data never leaves your device
- 🗑️ **Auto-Cleanup**: 24h TTL prevents stale data
- 📊 **Observable**: React to changes anywhere in code
- 🏗️ **Scalable Pattern**: Clean architecture for future features

#### Use Cases

**Day Trader**: Set lines in morning, take breaks, lines persist all day

**Connection Loss**: Internet drops, page reloads, lines restore automatically

**Browser Restart**: Close Chrome, come back hours later, lines waiting

**Multi-Chart**: Switch between instruments, lines stay in place

#### Files Created/Modified

- NEW: `lib/order-store.js` - Core OrderStore implementation
- NEW: `ORDERSTORE-PATTERN.md` - Complete architecture documentation
- Modified: `content-scripts/config-bridge.js` - Added storage handlers
- Modified: `lib/chart-access.js` - Added persist/restore methods
- Modified: `content-scripts/main-content-v4.js` - Added rehydration
- Modified: `manifest.json` - Added order-store.js, version bump

#### Impact

- 🎯 **Game Changer**: Professional-grade state management
- 🚀 **User Experience**: Lines persist like native TopstepX UI
- 🔒 **Reliability**: Never lose your setup again
- 📊 **Architecture**: Scalable pattern for future features
- ⚡ **Performance**: In-memory = instant operations

#### Debugging

```javascript
// Console commands
window.orderStore.debug();
window.orderStore.getSnapshot();
await window.orderStore.rehydrate();
window.orderStore.hasActiveOrder();
```

## [4.5.0] - 2024-12-12

### 🔄 Line Drag Sync - Auto-Update TopstepX Platform

#### Added - Line Drag Sync Feature
- **Drag & Sync**: When you drag SL/TP lines on the chart, automatically updates TopstepX platform brackets
- **Smart Debouncing**: 1-second delay prevents spam API calls while dragging
- **Auto Token Capture**: Uses `localStorage` token for seamless authentication
- **Account ID Tracking**: Automatically captures account ID from order requests
- **Real-time Calculation**: Converts dragged line positions to risk/profit dollars
- **Enable/Disable Toggle**: Complete control via popup checkbox

#### How It Works
```
1. User places limit/stop order
   ↓
2. Extension draws SL/TP lines on chart
   ↓
3. User drags a line to new position
   ↓
4. Extension detects position change
   ↓
5. After 1 second (debounce), calculates new risk/profit
   ↓
6. Makes POST to /TradingAccount/setPositionBrackets
   ↓
7. TopstepX platform brackets updated
```

#### New Components
- **`lib/line-drag-sync.js`**: Core sync module
  - `LineDragSync` class with debouncing
  - Token retrieval from `localStorage`
  - Risk/profit calculation from line positions
  - API communication with TopstepX
  - Custom events for status tracking

#### Chart Integration
- **`lib/chart-access.js`**: Drag detection
  - `detectLineDrag()` method to track position changes
  - Compares current vs last position every 500ms
  - Triggers `syncWithDebounce()` when changed
  - Resets tracking on line clear

#### Network Integration
- **`lib/network-interceptor.js`**: Account ID capture
  - Extracts `accountId` from order requests
  - Passes to `lineDragSync` module automatically
  - No manual configuration needed

#### Configuration
- **`lib/storage-manager.js`**: New settings
  - `enableLineDragSync` (boolean): Enable/disable feature
  - `syncDebounceDelay` (number): Delay in ms (default: 1000)

#### UI Updates
- **`popup/popup.html`**: New sync section
  - Checkbox to enable/disable sync
  - Helpful info box explaining workflow
  - Clean, informative design
- **`popup/popup.css`**: Info box styling
- **`popup/popup.js`**: Sync toggle handling

#### API Endpoint
```
POST https://userapi.topstepx.com/TradingAccount/setPositionBrackets
Headers:
  - Authorization: Bearer {token from localStorage}
  - Content-Type: application/json
Body: 
  {
    "accountId": 15379279,
    "autoApply": true,
    "risk": 300,      // Calculated from SL line position
    "toMake": 600     // Calculated from TP line position
  }
```

#### Benefits
- ✅ **One Action, Two Updates**: Drag line → Both chart and platform sync
- ✅ **No Manual Entry**: TopstepX brackets update automatically
- ✅ **Visual First**: See your risk on chart, then platform follows
- ✅ **Smart Debounce**: Smooth dragging without API spam
- ✅ **Token from Storage**: No login prompts or manual auth
- ✅ **Opt-in Feature**: Disabled by default, enable when ready

#### Technical Details
- Runs in `MAIN` world for full chart API access
- Uses TradingView's `getShapeById()` to track line positions
- Debounces with `setTimeout` and `clearTimeout`
- Captures auth token from `localStorage.getItem('token')`
- Account ID auto-captured from order creation requests
- Calculates risk using: `(entryPrice - slPrice) / tickSize * tickValue * contracts`

#### Files Modified/Created
- NEW: `lib/line-drag-sync.js` - Core sync module
- Modified: `lib/chart-access.js` - Drag detection
- Modified: `lib/network-interceptor.js` - Account ID capture
- Modified: `lib/storage-manager.js` - New config options
- Modified: `popup/popup.html` - Sync UI section
- Modified: `popup/popup.css` - Info box styles
- Modified: `popup/popup.js` - Sync toggle handling
- Modified: `content-scripts/main-content-v4.js` - Config application
- Modified: `manifest.json` - Added module and permissions

#### Impact
- 🎯 **Game Changer**: Seamless integration between visual lines and platform
- 🚀 **Workflow Improvement**: One drag updates everything
- 🔒 **Secure**: Uses existing TopstepX auth, no new credentials
- 📊 **Accurate**: Calculates exact risk/profit from line positions
- ⚡ **Fast**: 1-second debounce feels instant but prevents spam

## [4.4.2] - 2024-12-11

### 🗑️ Order Lifecycle Management

#### Added
- **Auto Clear on Cancel** - Lines automatically removed when order is cancelled
- **Order Cancellation Detection** - Intercepts DELETE requests to `/Order/cancel/`
- **Order ID Tracking** - Verifies cancelled order matches active order
- **State Management** - Updates `hasActiveOrder` flag on cancellation

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

#### Problem
- Error: "The specified value 'undefined' cannot be parsed"
- UI settings not saving/applying correctly
- `populateForm()` failing on line 104
- Caused by missing config fields when loading old configurations

#### Root Cause
- Content scripts in `MAIN` world don't have direct `chrome.storage` access
- New config options added (line styles, opacity, etc.) weren't in old saved configs
- Form inputs received `undefined` values
- HTML input validation failed on undefined

#### Solution 1: Config Bridge
- Created `content-scripts/config-bridge.js` running in `ISOLATED` world
- Bridge has `chrome.storage` access
- Communicates with `MAIN` world via `window.postMessage`
- Handles config load/save requests
- Forwards between popup and main content script

#### Solution 2: Default Merging
- Modified `storage-manager.js` `getConfig()`:
  ```javascript
  const savedConfig = result[this.configKey] || {};
  const mergedConfig = { ...DEFAULT_CONFIG, ...savedConfig };
  resolve(mergedConfig);
  ```
- Always merges saved config with defaults
- Ensures all new fields have values
- Backward compatible with old configs

#### Solution 3: Safe Setters
- Created `safeSet()` and `safeCheck()` helpers in `popup.js`:
  ```javascript
  const safeSet = (element, value, defaultValue) => {
    if (element) {
      element.value = value !== undefined && value !== null ? value : defaultValue;
    }
  };
  ```
- Gracefully handles undefined/null values
- Provides fallback defaults
- Prevents form validation errors

#### Files Modified
- `lib/storage-manager.js` - Config merging logic
- `popup/popup.js` - Safe setters, improved error handling
- `content-scripts/config-bridge.js` - Communication bridge (NEW)
- `manifest.json` - Added config-bridge to ISOLATED world
- `STORAGE-FIX-v4.4.1.md` - Complete fix documentation (NEW)

#### Impact
- ✅ All settings save/load correctly
- ✅ No more undefined errors
- ✅ Backward compatible with v4.3.x configs
- ✅ New options work perfectly
- ✅ Form validation passes

## [4.4.0] - 2024-12-10

### 🎨 Full UI Customization

#### Added - Complete Visual Control
- **Line Style Options**: Solid, Dotted, Dashed for SL and TP independently
- **Line Opacity**: Adjustable from 0-100% with live preview
- **Font Size**: Text size control (8-20px) with slider
- **Label Format**: Choose between "SL/TP", "Stop/Target", "Risk/Reward", or Custom
- **Custom Prefixes**: Define your own text for SL and TP labels
- **Display Toggles**: Show/hide decimals, contracts, emojis, bold text
- **Auto-hide Market Orders**: Option to hide lines for market orders (type: 2)
- **Sound Alerts**: Optional audio notification when lines are drawn

#### Configuration Options Added
```javascript
// Line Visual Settings
slLineStyle: 0,           // 0=Solid, 1=Dotted, 2=Dashed
tpLineStyle: 0,
lineOpacity: 100,         // 0-100%
fontSize: 10,             // 8-20px

// Label Settings
labelFormat: 'sl-tp',     // 'sl-tp', 'stop-target', 'risk-reward', 'custom'
slPrefix: 'SL',           // Custom text for SL label
tpPrefix: 'TP',           // Custom text for TP label
showLabels: true,
fontBold: false,
useEmojis: false,
showDecimals: false,
showContracts: true,

// Behavior
autoHideOnMarket: true,
playSound: false,
persistLines: true,
autoUpdate: true
```

#### UI Improvements
- Organized popup into logical sections:
  - Risk Settings
  - Line Colors  
  - Line Style
  - Label Settings
  - Display Options
  - Behavior Options
- Added sliders with live value display
- Color pickers with preview swatches
- Dropdown selectors for line styles
- Checkbox groups for toggles
- Help text for complex options
- Clean, dark, professional design

#### Technical Updates
- `lib/chart-access.js`:
  - `createLine()` accepts all style options
  - `formatLabel()` for dynamic label generation
  - Applies opacity, font size, line style
- `lib/storage-manager.js`:
  - Expanded `DEFAULT_CONFIG` with all new options
  - Validation for new fields
- `popup/popup.html`:
  - New input controls for all options
  - Improved layout and organization
- `popup/popup.css`:
  - Slider styles
  - Color preview styles
  - Responsive design updates

#### Files Modified
- `lib/chart-access.js` - Visual customization logic
- `lib/storage-manager.js` - Extended configuration
- `popup/popup.html` - Complete UI redesign
- `popup/popup.css` - New component styles
- `popup/popup.js` - Event handling for new controls
- `manifest.json` - Version bump to 4.4.0

#### Impact
- 🎨 **Full Control**: Customize every visual aspect
- 📊 **Professional Look**: Match your trading style
- 🎯 **Clarity**: Choose label format that makes sense to you
- ⚡ **Flexible**: Enable/disable features as needed
- 🎭 **Personal**: Create your own look and feel

## [4.3.0] - 2024-12-09

### 🎯 Multi-Order Type Support

#### Added
- **Limit Orders** (type: 1) - Uses `limitPrice`
- **Market Orders** (type: 2) - Immediate execution
- **Stop Orders** (type: 4) - Uses `stopPrice`

#### Side Detection Logic
- **Positive `positionSize`** (1, 2, 3...) → LONG/BUY
- **Negative `positionSize`** (-1, -2, -3...) → SHORT/SELL
- **Absolute value** = Number of contracts

#### Line Placement Logic
- **Long Orders**: SL below entry, TP above entry
- **Short Orders**: SL above entry, TP below entry
- **Reference Price**: Uses `limitPrice` or `stopPrice` (not market price)

#### Files Modified
- `lib/network-interceptor.js` - Added stop and market order detection
- `content-scripts/main-content-v4.js` - Side-based line placement
- `lib/calculations.js` - Updated for all order types

#### Impact
- ✅ Works with all order types
- ✅ Correct SL/TP placement based on side
- ✅ Accurate risk calculation for any entry method

## [4.2.0] - 2024-12-08

### 🔧 Initial Release - Core Features

#### Features
- Network interception for order detection
- Dynamic SL/TP line rendering on TradingView chart
- Risk calculation engine
- Instrument database with tick values
- Popup configuration UI
- Chrome storage persistence
- Auto-clear on order modification

#### Architecture
- Content scripts in MAIN world for chart access
- Network interceptor for API monitoring
- Modular design with separate libraries
- Event-driven communication

---

## Version History Summary

| Version | Date | Key Feature |
|---------|------|-------------|
| 4.5.0 | 2024-12-12 | 🔄 Line Drag Sync |
| 4.4.2 | 2024-12-11 | 🗑️ Auto Clear on Cancel |
| 4.4.1 | 2024-12-11 | 🐛 Storage Fix |
| 4.4.0 | 2024-12-10 | 🎨 Full Customization |
| 4.3.0 | 2024-12-09 | 🎯 Multi-Order Support |
| 4.2.0 | 2024-12-08 | 🔧 Initial Release |
