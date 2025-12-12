# OrderStore Pattern - Arquitectura de Persistencia

## 🏪 Overview

El **OrderStore** es un sistema de gestión de estado inspirado en el patrón que usa TopstepX internamente. Garantiza que las líneas de SL/TP persistan cuando sales y regresas a la página.

## 📐 Principios de Diseño

### 1. **In-Memory**
- Estado rápido y reactivo en memoria RAM
- No hay latencia de I/O para operaciones frecuentes
- Acceso instantáneo a datos

```javascript
orderStore.activeOrder  // Acceso inmediato
orderStore.linesState   // Sin delays
```

### 2. **Event-Based**
- Observable: Suscríbete a cambios
- Desacoplado: Componentes no se conocen entre sí
- Reactivo: Responde a cambios automáticamente

```javascript
orderStore.on('order-upserted', (data) => {
  console.log('Order saved:', data);
});

orderStore.on('order-removed', () => {
  console.log('Order cleared');
});

orderStore.on('rehydrated', (data) => {
  console.log('State restored:', data);
});
```

### 3. **Determinístico**
- Mismas entradas → Mismos resultados
- Sin side effects inesperados
- Estado predecible

```javascript
// Siempre produce el mismo resultado
orderStore.upsert(orderData, linesData);
orderStore.getActiveOrder(); // → orderData exacto
```

### 4. **Rehydratable**
- Persiste a `chrome.storage.local`
- Se restaura al recargar
- TTL de 24 horas

```javascript
// Al inicializar
await orderStore.rehydrate();

// Restaura estado automáticamente
if (orderStore.hasActiveOrder()) {
  chartAccess.restoreFromStore();
}
```

### 5. **Observable**
- Emite eventos en cada cambio
- Múltiples listeners posibles
- Desuscripción fácil

```javascript
const handler = (data) => console.log(data);

orderStore.on('order-upserted', handler);
orderStore.off('order-upserted', handler); // Cleanup
```

## 🔧 API Reference

### Constructor
```javascript
const orderStore = new OrderStore();
```

### Methods

#### `upsert(orderData, linesData)`
Inserta o actualiza el estado actual.

```javascript
orderStore.upsert(
  {
    symbol: 'MNQ',
    entryPrice: 25923.5,
    contracts: 1,
    side: 'long'
  },
  {
    slPrice: 25903.5,
    tpPrice: 25948.0,
    entryPrice: 25923.5,
    contracts: 1,
    instrument: { tickSize: 0.25, tickValue: 5 },
    config: { /* visual config */ }
  }
);
```

**Emits**: `order-upserted`

#### `remove()`
Elimina el estado actual y limpia el storage.

```javascript
orderStore.remove();
```

**Emits**: `order-removed` (solo si había orden)

#### `clear()`
Alias de `remove()`. Semántica más explícita.

```javascript
orderStore.clear();
```

#### `getActiveOrder()`
Obtiene la orden actual.

```javascript
const order = orderStore.getActiveOrder();
// → { symbol: 'MNQ', entryPrice: 25923.5, ... } | null
```

#### `getLinesState()`
Obtiene el estado de las líneas.

```javascript
const lines = orderStore.getLinesState();
// → { slPrice, tpPrice, instrument, config, ... } | null
```

#### `hasActiveOrder()`
Verifica si hay una orden activa.

```javascript
if (orderStore.hasActiveOrder()) {
  // Restore lines
}
```

#### `rehydrate()`
Restaura el estado desde `chrome.storage.local`.

```javascript
const restored = await orderStore.rehydrate();
if (restored) {
  console.log('State restored!');
}
```

**Returns**: `Promise<boolean>` - `true` si se restauró, `false` si no había datos

**Emits**: `rehydrated` (si hay datos válidos)

#### `persist()`
Guarda el estado actual en storage.

```javascript
orderStore.persist();
```

**Note**: Llamado automáticamente por `upsert()`

#### `on(event, callback)`
Suscribe a eventos.

```javascript
orderStore.on('order-upserted', (data) => {
  console.log('Order:', data.order);
  console.log('Lines:', data.lines);
});
```

**Events**:
- `order-upserted` → `{ order, lines }`
- `order-removed` → `undefined`
- `rehydrated` → `{ order, lines }`

#### `off(event, callback)`
Desuscribe de eventos.

```javascript
const handler = (data) => console.log(data);
orderStore.on('order-upserted', handler);
orderStore.off('order-upserted', handler);
```

#### `debug()`
Imprime el estado actual en consola.

```javascript
orderStore.debug();
// [OrderStore] 🔍 Current State:
// - Active Order: {...}
// - Lines State: {...}
// - Has Active Order: true
// - Listeners: ['order-upserted', 'rehydrated']
```

#### `getSnapshot()`
Obtiene un snapshot del estado (útil para debugging).

```javascript
const snapshot = orderStore.getSnapshot();
// {
//   activeOrder: {...},
//   linesState: {...},
//   hasActiveOrder: true,
//   listeners: ['order-upserted', 'rehydrated']
// }
```

## 🔄 Workflow Completo

### 1. Inicialización (Page Load)

```
Extension loads
  ↓
OrderStore created (in-memory)
  ↓
orderStore.rehydrate() called
  ↓
Checks chrome.storage.local
  ↓
If data exists and < 24 hours old:
  - Restore to in-memory state
  - Emit 'rehydrated' event
  ↓
chartAccess.restoreFromStore()
  ↓
Lines drawn on chart
```

### 2. Order Creation (Network Event)

```
User places limit order
  ↓
NetworkInterceptor captures request
  ↓
Emits 'orderCreated' event
  ↓
main-content-v4.js handles event
  ↓
chartAccess.updateLines(...)
  ↓
chartAccess.persistToStore(...)
  ↓
orderStore.upsert(orderData, linesData)
  ↓
In-memory state updated
  ↓
orderStore.persist()
  ↓
Bridge saves to chrome.storage.local
  ↓
Emits 'order-upserted' event
```

### 3. Order Cancellation

```
User cancels order in TopstepX
  ↓
NetworkInterceptor detects DELETE
  ↓
Emits 'orderCancelled' event
  ↓
chartAccess.clearLines()
  ↓
orderStore.remove()
  ↓
In-memory state cleared
  ↓
Storage cleared via bridge
  ↓
Emits 'order-removed' event
```

### 4. Page Refresh

```
User hits F5
  ↓
Extension reloads
  ↓
orderStore.rehydrate()
  ↓
If valid data exists:
  - Load from storage
  - Restore in-memory state
  - Emit 'rehydrated'
  ↓
chartAccess.restoreFromStore()
  ↓
Lines appear on chart
  ↓
User sees lines exactly as before
```

## 🌉 Bridge Pattern (MAIN ↔ ISOLATED)

El OrderStore corre en el **MAIN world** (donde tiene acceso al chart), pero `chrome.storage` solo está disponible en el **ISOLATED world**. Usamos un **bridge** para comunicar:

```
MAIN World                    ISOLATED World
------------                  --------------
OrderStore                    Config Bridge
    ↓                              ↓
persist()                     chrome.storage.local.set()
    ↓ postMessage                  ↓
    ←──────────────────────────────
         "TOPSTEP_SAVE_ORDER_STORE"

rehydrate()                   chrome.storage.local.get()
    ↓ postMessage                  ↓
    ──────────────────────────────→
         "TOPSTEP_LOAD_ORDER_STORE"
    ←──────────────────────────────
         "TOPSTEP_ORDER_STORE_LOADED"
```

### Messages

#### Save Request
```javascript
// MAIN → ISOLATED
window.postMessage({
  type: 'TOPSTEP_SAVE_ORDER_STORE',
  data: {
    activeOrder: {...},
    linesState: {...},
    timestamp: Date.now()
  }
}, '*');
```

#### Load Request
```javascript
// MAIN → ISOLATED
window.postMessage({
  type: 'TOPSTEP_LOAD_ORDER_STORE'
}, '*');

// ISOLATED → MAIN
window.postMessage({
  type: 'TOPSTEP_ORDER_STORE_LOADED',
  data: { activeOrder, linesState, timestamp }
}, '*');
```

#### Clear Request
```javascript
// MAIN → ISOLATED
window.postMessage({
  type: 'TOPSTEP_CLEAR_ORDER_STORE'
}, '*');
```

## 💾 Storage Format

```javascript
// Key: 'topstep_order_store'
// Location: chrome.storage.local
{
  activeOrder: {
    symbol: 'MNQ',
    entryPrice: 25923.5,
    contracts: 1,
    side: 'long',
    timestamp: 1702400000000
  },
  linesState: {
    slPrice: 25903.5,
    tpPrice: 25948.0,
    entryPrice: 25923.5,
    contracts: 1,
    instrument: {
      symbol: 'MNQ',
      tickSize: 0.25,
      tickValue: 5
    },
    config: {
      slColor: '#FF0000',
      tpColor: '#00FF00',
      lineWidth: 1,
      fontSize: 10,
      // ... all visual config
    },
    timestamp: 1702400000000
  },
  timestamp: 1702400000000
}
```

## ⏰ TTL (Time To Live)

- **Duration**: 24 horas
- **Check**: Al rehydratar
- **Action**: Si `Date.now() - timestamp > 24h` → Ignora y limpia

```javascript
const age = Date.now() - stored.timestamp;
if (age > 24 * 60 * 60 * 1000) {
  console.log('Data expired');
  orderStore.clearStorage();
  return false;
}
```

## 🎯 Use Cases

### 1. Day Trader
```
Morning:
  - Configura líneas
  - Toma coffee break
  - Regresa → Líneas siguen ahí

All day:
  - Switch entre charts
  - Líneas persisten
  - No redibuja manualmente
```

### 2. Connection Loss
```
Internet drops
  ↓
Page reloads
  ↓
OrderStore rehydrates
  ↓
Lines restore
  ↓
Continúa trading sin interrupción
```

### 3. Browser Restart
```
Close Chrome
  ↓
Come back hours later
  ↓
Open TopstepX
  ↓
Lines are there (< 24h)
  ↓
Ready to trade
```

### 4. Multi-Device NO
```
OrderStore usa chrome.storage.local
  ↓
NO se sincroniza entre devices
  ↓
Cada device tiene su propio estado
  ↓
Perfecto para trading focused
```

## 🔒 Security & Privacy

### Local Only
- Usa `chrome.storage.local` (no `.sync`)
- No se envía a servidores externos
- Device-specific
- No sale del navegador

### No PII
- Solo precios y configuración
- No tokens, passwords, o datos sensibles
- Safe to store

### Expiration
- TTL de 24 horas previene stale data
- Auto-cleanup

## 🐛 Debugging

### Console Commands

```javascript
// Ver estado actual
window.orderStore.debug();

// Forzar rehydratación
await window.orderStore.rehydrate();

// Ver snapshot
const state = window.orderStore.getSnapshot();
console.table(state);

// Verificar storage directo
chrome.storage.local.get('topstep_order_store', console.log);

// Limpiar manualmente
window.orderStore.clear();
```

### Logs

Busca en consola:
```
[OrderStore] 🏪 Store initialized
[OrderStore] 📝 Upserting order: ...
[OrderStore] 💾 Persist requested
[OrderStore] 💧 Rehydrating from storage...
[OrderStore] ✅ Rehydrated successfully
[OrderStore] 🗑️ Removing order
```

## ✅ Benefits

1. **Zero Data Loss**: Refresh, close, reopen → Lines stay
2. **Fast**: In-memory state = instant access
3. **Observable**: React to changes anywhere
4. **Deterministic**: Predictable behavior
5. **TTL**: Auto-cleanup prevents stale data
6. **Decoupled**: Components don't depend on each other
7. **Professional**: Production-ready pattern

## 📚 Related Files

- `lib/order-store.js` - Core OrderStore implementation
- `content-scripts/config-bridge.js` - Storage bridge (ISOLATED world)
- `lib/chart-access.js` - `persistToStore()`, `restoreFromStore()`
- `content-scripts/main-content-v4.js` - `rehydrateOrderStore()`

---

**Version**: 4.6.0  
**Pattern**: Inspired by TopstepX internal OrderStore  
**Status**: ✅ Production Ready

