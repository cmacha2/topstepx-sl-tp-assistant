# Quick Reference: API Integration & Order Persistence

## Setup (One-time)

```javascript
// 1. Set your account ID (in browser console on topstepx.com)
localStorage.setItem('topstep_account_id', 'YOUR_ACCOUNT_ID');

// 2. Reload the extension or page
location.reload();
```

## How It Works

### When You Place an Order
1. Lines appear on chart (SL/TP)
2. Order is saved to localStorage
3. Position brackets updated via API

### When You Drag Lines
1. Labels update in real-time
2. After 500ms: localStorage updated
3. After 1500ms: API called with new values

### When You Refresh Page
1. Order restored from localStorage
2. Lines reappear at last position
3. Everything continues working

### When Order is Cancelled
1. Lines removed from chart
2. Order cleared from localStorage

## API Details

### Endpoint
```
POST https://userapi.topstepx.com/TradingAccount/setPositionBrackets
```

### Request
```json
{
  "accountId": 15379279,
  "autoApply": true,
  "risk": 299,      // Stop Loss in dollars
  "toMake": 600     // Take Profit in dollars
}
```

### Response
```json
{
  "success": true,
  "errorCode": 0,
  "errorMessage": null
}
```

## Debugging

### Check API Status
```javascript
// In console:
window.apiClient.getStatus()
```

### Check Order Status
```javascript
// In console:
window.orderContext.getStatus()
```

### View Stored Order
```javascript
// In console:
JSON.parse(localStorage.getItem('topstep_sltp_orders'))
```

### Clear Stored Order
```javascript
// In console:
localStorage.removeItem('topstep_sltp_orders')
```

## Console Messages

### Good Signs ✅
- `✅ API Client initialized`
- `💾 Order persisted to storage`
- `✅ Position brackets updated via API`
- `📦 Restored order from storage`

### Warning Signs ⚠️
- `⚠️ API client not ready (no token)` → Login to TopstepX
- `⚠️ Account ID not set` → Set account ID in localStorage

### Error Signs ❌
- `❌ API call failed` → Check token/account ID
- `❌ Failed to persist order` → Check localStorage

## Testing

### Quick Test
```javascript
// Paste in console:
// (Load the TEST-API-INTEGRATION.js file)
```

### Manual Test
1. Place limit order
2. See lines appear
3. Drag a line
4. Check console for API call
5. Refresh page
6. Lines should restore

## Files

### New Files
- `lib/api-client.js` - API integration
- `lib/order-context.js` - Order persistence
- `API-INTEGRATION-GUIDE.md` - Full documentation
- `TEST-API-INTEGRATION.js` - Test script
- `QUICK-REFERENCE-API.md` - This file

### Modified Files
- `manifest.json` - Added new libraries
- `content-scripts/main-content-v4.js` - Integrated features
- `lib/chart-access.js` - Added drag listeners
- `ui/drag-handler.js` - Added API support

## Troubleshooting

### Lines don't persist after refresh
- Check localStorage: `localStorage.getItem('topstep_sltp_orders')`
- Order might be older than 24 hours (auto-cleared)

### API calls fail
- Check token: `localStorage.getItem('token')`
- Check account ID: `localStorage.getItem('topstep_account_id')`
- Try logout/login on TopstepX

### Lines update but API doesn't get called
- Check API client status: `window.apiClient.getStatus()`
- Verify account ID is set

### Multiple tabs open
- Each tab has independent state
- Close other tabs for consistent behavior

## Support

Check console for detailed logs with prefixes:
- `[APIClient]`
- `[OrderContext]`
- `[TopstepX Chart]`
- `[TopstepX v4]`


