# OrderStore Pattern - Architecture Documentation

## 🎯 Overview

The **OrderStore** is a state management pattern that ensures SL/TP lines **persist** across page reloads, browser restarts, and navigation. Inspired by TopstepX's internal OrderStore, it follows five core principles:

1. **In-Memory**: State lives in RAM for instant access
2. **Event-Based**: Observable pattern with explicit events
3. **Deterministic**: Same inputs always produce same state
4. **Rehydratable**: Survives page reloads via `chrome.storage.local`
5. **Observable**: Multiple consumers can subscribe to changes

## 🏗️ Architecture

### Components

```
┌─────────────────────────────────────────────┐
│          MAIN World (Chart Access)          │
├─────────────────────────────────────────────┤
│  ┌──────────────┐      ┌────────────────┐  │
│  │  OrderStore  │◄────►│  ChartAccess   │  │
│  │  (In-Memory) │      │  (TradingView) │  │
│  └──────┬───────┘      └────────────────┘  │
│         │                                    │
│         │ window.postMessage()               │
│         ▼                                    │
├─────────────────────────────────────────────┤
│         ISOLATED World (Storage Access)      │
├─────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐  │
│  │        Config Bridge                 │  │
│  │  chrome.storage.local (persistent)   │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Communication Flow

```
1. User places order
   ↓
2. Lines drawn on chart
   ↓
3. ChartAccess calls orderStore.upsert()
   ↓
4. OrderStore updates in-memory state
   ↓
5. OrderStore sends SAVE message to bridge
   ↓
6. Bridge saves to chrome.storage.local
   ↓
7. Page reloads
   ↓
8. OrderStore.rehydrate() called on init
   ↓
9. Bridge loads from chrome.storage.local
   ↓
10. Lines restored to chart automatically
```

## 📦 OrderStore API

### Core Methods

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
orderStore.getSnapshot();        // Get full state object
```

### State Structure

```javascript
{
  activeOrder: {
    symbol: 'MNQ',
    entryPrice: 25923.5,
    contracts: 1,
    side: 'long',        // 'long' or 'short'
    timestamp: Date.now()
  },
  linesState: {
    slPrice: 25903.5,
    tpPrice: 25948.0,
    entryPrice: 25923.5,
    contracts: 1,
    side: 'long',
    instrument: {
      symbol: 'MNQ',
      tickSize: 0.25,
      tickValue: 5
    },
    config: {
      slColor: '#FF0000',
      tpColor: '#00FF00',
      lineWidth: 1,
      slLineStyle: 0,
      tpLineStyle: 0,
      fontSize: 10,
      // ... all config options
    },
    timestamp: Date.now()
  },
  timestamp: Date.now()
}
```

## 🔄 Lifecycle Events

### 1. Order Creation

```javascript
// User places limit order
↓
networkInterceptor detects order
↓
handleOrderData() processes it
↓
chartAccess.updateLines() draws lines
↓
chartAccess.persistToStore() saves state
↓
orderStore.upsert() updates in-memory
↓
orderStore.persist() saves to storage
↓
Event: 'order-upserted' emitted
```

### 2. Line Dragging

```javascript
// User drags SL line
↓
chartAccess.detectLineDrag() detects change
↓
chartAccess.persistToStore() with new positions
↓
orderStore.upsert() updates in-memory
↓
orderStore.persist() saves to storage
↓
lineDragSync syncs to TopstepX API
```

### 3. Order Cancellation

```javascript
// User cancels order
↓
networkInterceptor detects DELETE
↓
Event: 'orderCancelled' emitted
↓
chartAccess.clearLines() removes lines
↓
orderStore.remove() clears state
↓
orderStore.clearStorage() removes from storage
↓
Event: 'order-removed' emitted
```

### 4. Page Reload

```javascript
// Page loads
↓
OrderStore initialized
↓
main-content-v4.js calls rehydrateOrderStore()
↓
orderStore.rehydrate() requests data
↓
Bridge loads from chrome.storage.local
↓
orderStore receives data via postMessage
↓
Validates TTL (24 hours)
↓
chartAccess.restoreFromStore() redraws lines
↓
Event: 'rehydrated' emitted
↓
Lines appear exactly as before!
```

## 🔐 Storage Details

### Location
- **API**: `chrome.storage.local`
- **Key**: `topstep_order_store`
- **Scope**: Device-specific (not synced)
- **Size**: ~1-2 KB
- **TTL**: 24 hours (auto-cleanup)

### Why `chrome.storage.local`?

1. **Persistent**: Survives browser restarts
2. **Private**: Never leaves your device
3. **Fast**: Local access, no network
4. **Reliable**: Part of Chrome API
5. **Capacity**: 10 MB limit (plenty for our needs)

### Security

- **No server**: Data never sent externally
- **Local only**: Stays on your machine
- **Extension-scoped**: Only this extension can access
- **TTL**: Auto-expires after 24 hours

## 📝 Integration Points

### `lib/chart-access.js`

```javascript
// After drawing lines
persistToStore(slPrice, tpPrice, entryPrice, contracts, instrument, config, side) {
  const orderData = { symbol, entryPrice, contracts, side };
  const linesData = { slPrice, tpPrice, instrument, config };
  window.orderStore.upsert(orderData, linesData);
}

// On page load
async restoreFromStore() {
  const linesData = window.orderStore.getLinesState();
  if (linesData) {
    this.updateLines(...linesData);
    return true;
  }
  return false;
}

// On clear
clearLines() {
  // ... remove lines from chart
  window.orderStore.remove();
}
```

### `content-scripts/main-content-v4.js`

```javascript
// During initialization
async function rehydrateOrderStore() {
  const rehydrated = await window.orderStore.rehydrate();
  if (rehydrated && chartAccess) {
    const restored = await chartAccess.restoreFromStore();
    if (restored) {
      state.hasActiveOrder = true;
      // Update local state
    }
  }
}
```

### `content-scripts/config-bridge.js`

```javascript
// Listen for save requests (MAIN → ISOLATED)
window.addEventListener('message', (event) => {
  if (event.data.type === 'TOPSTEP_SAVE_ORDER_STORE') {
    chrome.storage.local.set({
      'topstep_order_store': event.data.data
    });
  }
});

// Listen for load requests
if (event.data.type === 'TOPSTEP_LOAD_ORDER_STORE') {
  chrome.storage.local.get('topstep_order_store', (result) => {
    window.postMessage({
      type: 'TOPSTEP_ORDER_STORE_DATA',
      data: result.topstep_order_store
    }, '*');
  });
}
```

## 🎯 Benefits

### User Experience
- ✅ **Zero Data Loss**: Lines never disappear
- ⚡ **Instant Restore**: Lines appear immediately on load
- 🎯 **Professional**: Feels like native TopstepX behavior
- 🔒 **Privacy**: Data stays local
- 🗑️ **Auto-Cleanup**: 24h TTL prevents stale data

### Developer Experience
- 📊 **Observable**: Easy to react to changes
- 🔄 **Deterministic**: Predictable behavior
- 🏗️ **Scalable**: Clean architecture for new features
- 🐛 **Debuggable**: Built-in debug methods
- 🧪 **Testable**: Pure functions, mockable

## 📊 Use Cases

### Day Trader Workflow

```
Morning:
- Set lines for MNQ limit @ 25920
- Risk: $300, TP: $600

Lunch Break:
- Close browser

Afternoon:
- Reopen TopstepX
- Lines still there!
- Limit executes
- SL/TP ready to go
```

### Multi-Chart Workflow

```
Chart 1: MNQ with lines
↓
Switch to Chart 2: ES
↓
Back to Chart 1
↓
Lines persisted! No redrawing needed
```

### Connection Loss

```
Trading MNQ
↓
Internet drops
↓
Page reloads
↓
Lines restored automatically
↓
Continue trading seamlessly
```

## 🐛 Debugging

### Console Commands

```javascript
// Check if OrderStore is available
typeof window.orderStore !== 'undefined'

// Print current state
window.orderStore.debug()

// Get snapshot
const state = window.orderStore.getSnapshot()
console.log(state)

// Check if has active order
window.orderStore.hasActiveOrder()

// Manual rehydrate
await window.orderStore.rehydrate()

// Force clear
window.orderStore.remove()

// Subscribe to events
window.orderStore.on('order-upserted', (data) => {
  console.log('Order upserted:', data);
});
```

### Checking Storage

```javascript
// In ISOLATED world (or popup)
chrome.storage.local.get('topstep_order_store', (result) => {
  console.log('Stored state:', result.topstep_order_store);
});

// Clear storage manually
chrome.storage.local.remove('topstep_order_store');
```

### Event Logging

```javascript
// Log all events
['order-upserted', 'order-removed', 'rehydrated'].forEach(event => {
  window.orderStore.on(event, (data) => {
    console.log(`[OrderStore] Event: ${event}`, data);
  });
});
```

## ⚠️ Edge Cases

### 1. TTL Expiration

**Scenario**: User returns after 25 hours

**Behavior**:
- Rehydrate checks TTL
- Data expired → rejected
- Storage cleared automatically
- No lines restored
- User must place new order

### 2. Corrupted Data

**Scenario**: Storage contains invalid JSON

**Behavior**:
- Rehydrate catches parse error
- Returns false
- Storage cleared
- Fresh start

### 3. Multiple Tabs

**Scenario**: User opens 2 TopstepX tabs

**Behavior**:
- Each tab has own OrderStore instance
- Both share same storage
- Last write wins (deterministic)
- Recommended: Use only one tab

### 4. Browser Private Mode

**Scenario**: User trades in Incognito

**Behavior**:
- `chrome.storage.local` still works
- Data cleared when incognito closes
- Expected behavior for privacy mode

## 🔮 Future Enhancements

### Potential Features

1. **Multiple Orders**: Store array instead of single order
2. **Undo/Redo**: Stack-based state history
3. **Cloud Sync**: Optional sync to user's TopstepX account
4. **Export/Import**: JSON export for backup
5. **Compression**: LZ-string for larger datasets

### Scalability

Current implementation handles:
- ✅ 1 active order
- ✅ 2 lines (SL/TP)
- ✅ Full config (50+ properties)
- ✅ < 2 KB storage

To support 10 simultaneous orders:
- Array-based storage
- ~20 KB total
- Still well under 10 MB limit

## 📚 References

### Inspiration

- TopstepX internal OrderStore pattern
- Redux principles (single source of truth)
- React Context API (observable pattern)
- LocalStorage + TTL pattern

### Related Patterns

- **Event Sourcing**: All changes tracked as events
- **CQRS**: Command/Query separation
- **Repository Pattern**: Abstract storage layer
- **Observer Pattern**: Pub/sub for state changes

---

**Version**: 4.6.0  
**Last Updated**: December 12, 2024  
**Status**: ✅ Production Ready

