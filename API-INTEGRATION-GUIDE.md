# API Integration & Order Persistence Guide

## Overview

This guide explains the new features added to the TopstepX SL/TP Assistant:

1. **API Integration** - Automatically updates position brackets via TopstepX API
2. **Debouncing** - Prevents excessive API calls while dragging lines
3. **Order Persistence** - Saves orders to localStorage for restoration after page reload

## Features

### 1. API Integration (`lib/api-client.js`)

The `APIClient` class handles communication with the TopstepX API:

#### Initialization
```javascript
const apiClient = new APIClient();
apiClient.initialize(); // Reads token from localStorage
```

#### Setting Account ID
```javascript
// Set manually if needed
apiClient.setAccountId(15379279);

// Or store in localStorage
localStorage.setItem('topstep_account_id', '15379279');
```

#### Update Position Brackets
```javascript
// With debouncing (default 1000ms)
await apiClient.updatePositionBrackets(299, 600, true);

// Custom debounce time
await apiClient.updatePositionBrackets(299, 600, true, 500);
```

#### API Endpoint
```
POST https://userapi.topstepx.com/TradingAccount/setPositionBrackets

Headers:
  - accept: application/json
  - authorization: Bearer <token>
  - content-type: application/json

Body:
{
  "accountId": 15379279,
  "autoApply": true,
  "risk": 299,      // SL in dollars
  "toMake": 600     // TP in dollars
}

Response:
{
  "success": true,
  "errorCode": 0,
  "errorMessage": null
}
```

### 2. Order Persistence (`lib/order-context.js`)

The `OrderContext` class manages order state persistence:

#### Order Structure
```javascript
{
  orderId: "order_1234567890",
  accountId: 15379279,
  symbol: "MNQZ25",
  side: "long",
  orderType: "limit",
  entryPrice: 21450,
  quantity: 10,
  slPrice: 21400,
  tpPrice: 21550,
  slDollars: 100,
  tpDollars: 200,
  status: "active",
  timestamp: 1234567890,
  updatedAt: 1234567891
}
```

#### Usage
```javascript
const orderContext = new OrderContext();

// Initialize and restore previous order
const restoredOrder = orderContext.initialize();

// Create/update an order
orderContext.setOrder({
  orderId: `order_${Date.now()}`,
  symbol: 'MNQZ25',
  entryPrice: 21450,
  // ... other fields
});

// Update SL/TP
orderContext.updateSLTP(21400, 21550, 100, 200);

// Check if there's an active order
if (orderContext.hasOrder()) {
  const order = orderContext.getOrder();
}

// Cancel order
orderContext.cancelOrder();
orderContext.clearOrder();
```

#### Persistence Behavior
- Orders are stored in `localStorage` under key `topstep_sltp_orders`
- Orders older than 24 hours are automatically cleared
- Orders persist across:
  - Page refreshes
  - Browser restarts
  - Navigation between routes
  - Leaving and returning to the page

### 3. Drag & Drop with API Updates

When you drag SL or TP lines:

1. **During Drag**: Labels update in real-time showing new dollar values
2. **After Release**: 
   - Wait 500ms (local debounce)
   - Update order context (localStorage)
   - Call API with 1000ms debounce
   - Total effective debounce: ~1.5 seconds

This prevents excessive API calls while providing responsive UI updates.

### 4. Integration Flow

```
User Drags Line
    ↓
Chart Access handles drag event
    ↓
Calculate new dollar values
    ↓
Update line labels (immediate)
    ↓
Wait 500ms (local debounce)
    ↓
Update OrderContext → localStorage
    ↓
Call API with 1000ms debounce
    ↓
Position brackets updated on TopstepX
```

## Setup Instructions

### 1. Authorization Token

The extension reads the auth token from `localStorage`:

```javascript
// On topstepx.com, the token is stored as:
localStorage.getItem('token')
```

The extension automatically retrieves this when initialized.

### 2. Account ID

Set your account ID in one of two ways:

**Option 1: Via localStorage**
```javascript
// In browser console on topstepx.com:
localStorage.setItem('topstep_account_id', '15379279');
```

**Option 2: Via API Client**
```javascript
// The extension can be enhanced to auto-detect account ID
// from API responses or user profile
```

### 3. Testing the Integration

#### Test API Connection
```javascript
// Open console on topstepx.com
const api = new APIClient();
api.initialize();
api.setAccountId(YOUR_ACCOUNT_ID);

// Test update
api.updatePositionBrackets(100, 200, true)
  .then(response => console.log('✅ Success:', response))
  .catch(error => console.error('❌ Error:', error));
```

#### Test Order Persistence
```javascript
// Create an order
const ctx = new OrderContext();
ctx.initialize();
ctx.setOrder({
  orderId: 'test_123',
  symbol: 'MNQZ25',
  entryPrice: 21450,
  slPrice: 21400,
  tpPrice: 21550,
  slDollars: 100,
  tpDollars: 200,
  status: 'active',
  timestamp: Date.now()
});

// Refresh the page
location.reload();

// After reload, check if restored
const ctx2 = new OrderContext();
const restored = ctx2.initialize();
console.log('Restored order:', restored);
```

#### Test Drag & Drop
1. Place a limit order on TopstepX
2. Lines should appear on chart
3. Drag SL or TP line
4. Watch console for:
   - `🎯 SL dragged to...` or `🎯 TP dragged to...`
   - `💾 Order context updated`
   - `✅ Position brackets updated via API`
5. Refresh page - lines should restore to last position

## Debugging

### Enable Verbose Logging
All modules log to console with prefixes:
- `[APIClient]` - API operations
- `[OrderContext]` - Order persistence
- `[TopstepX Chart]` - Chart operations
- `[TopstepX v4]` - Main content script

### Check API Status
```javascript
// In console:
apiClient.getStatus()
// Returns: { ready, hasToken, hasAccountId, accountId, pendingRequests }
```

### Check Order Status
```javascript
// In console:
orderContext.getStatus()
// Returns: { hasOrder, currentOrder, listeners, storageAvailable }
```

### Common Issues

**Issue**: API calls fail with 401 Unauthorized
- **Solution**: Token expired. Logout and login again on TopstepX

**Issue**: Position brackets not updating
- **Solution**: Verify account ID is set correctly

**Issue**: Orders not persisting
- **Solution**: Check localStorage is enabled and not blocked

**Issue**: Lines appear immediately on page load even without order
- **Solution**: Extension now only shows lines when `hasActiveOrder` is true

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Content Script                        │
│                  (main-content-v4.js)                    │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ API Client  │  │ OrderContext │  │ Chart Access  │  │
│  │             │  │              │  │               │  │
│  │ • Debounce  │  │ • Persist    │  │ • Draw lines  │  │
│  │ • API calls │  │ • Restore    │  │ • Drag events │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
│         │                │                   │           │
│         │                │                   │           │
│         ▼                ▼                   ▼           │
│    TopstepX API    localStorage        TradingView      │
└─────────────────────────────────────────────────────────┘
```

## Files Modified/Created

### New Files
- `lib/api-client.js` - API integration with debouncing
- `lib/order-context.js` - Order state management and persistence

### Modified Files
- `manifest.json` - Added new libraries to content scripts
- `content-scripts/main-content-v4.js` - Integrated API client and order context
- `lib/chart-access.js` - Added drag listeners and API updates
- `ui/drag-handler.js` - Added API and order context support (optional, currently handled in chart-access)

## Future Enhancements

### Potential Improvements
1. **Auto-detect Account ID** - Extract from API responses or user profile
2. **Retry Logic** - Automatic retry on API failures
3. **Offline Support** - Queue API calls when offline
4. **Order History** - Track multiple orders over time
5. **Sync Across Tabs** - BroadcastChannel for multi-tab sync
6. **Error Notifications** - User-friendly error messages in UI
7. **Manual Sync Button** - Force sync with API on demand

### API Enhancements
- Support for other TopstepX endpoints
- Batch updates for multiple instruments
- Real-time order status tracking
- Position monitoring and updates

## Version History

### v4.4.3 (Current)
- ✅ API integration with position brackets endpoint
- ✅ Debouncing for drag events
- ✅ Order persistence with localStorage
- ✅ Auto-restore on page load
- ✅ Integration with existing line rendering system

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify token and account ID are set correctly
3. Test API connectivity manually
4. Check localStorage for persisted data

## License

Same as parent project.

