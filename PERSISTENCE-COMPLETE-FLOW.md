# 🔄 Complete Persistence Flow

## Arquitectura de Persistencia Total

Este documento explica cómo funciona la persistencia completa del estado, incluyendo **drag & drop** de líneas.

## 🎯 Objetivo

**Estado persistente** que NO se pierda al:
- ✅ Refrescar la página (F5)
- ✅ Navegar a otra ruta
- ✅ Salir y volver a entrar
- ✅ Cerrar y abrir el navegador
- ✅ **Arrastrar líneas y refrescar**

## 📊 Componentes del Sistema

### 1. OrderStore (In-Memory + chrome.storage.local)
```javascript
{
  activeOrder: { symbol, entryPrice, contracts, side },
  linesState: { slPrice, tpPrice, entryPrice, ... },
  timestamp: Date.now()
}
```

### 2. Line Drag Detection (Chart Access)
- Monitorea posición de líneas cada 500ms
- Detecta cambios (drag & drop)
- Trigger: sync + persistence

### 3. Debouncing (1 segundo)
- Previene spam de requests
- Usuario arrastra → Espera 1s → Sync + Save

## 🔄 Flujo Completo

### Scenario 1: Orden Nueva (Sin Drag)

```
1. Usuario coloca limit order en TopstepX
   ↓
2. NetworkInterceptor captura request
   POST /Order
   {symbolId: "F.US.MNQ", positionSize: 1, limitPrice: 25923.5}
   ↓
3. Extrae: side = positionSize > 0 ? 'long' : 'short'
   Emite: 'orderCreated' event
   ↓
4. main-content-v4.js recibe event
   Actualiza state: {symbol, price, side, quantity}
   ↓
5. Calcula SL/TP usando CalculationEngine
   Entry: 25923.5
   SL: 25903.5 (below for long)
   TP: 25948.0 (above for long)
   ↓
6. chartAccess.updateLines(sl, tp, entry, config, contracts, instrument, side)
   ↓
7. Dibuja líneas en TradingView chart
   ↓
8. persistToStore(sl, tp, entry, contracts, instrument, config, side)
   ↓
9. OrderStore.upsert(orderData, linesData)
   ↓
10. OrderStore.persist() → postMessage bridge
   ↓
11. Config Bridge (ISOLATED) → chrome.storage.local.set()
   ↓
12. Estado guardado en storage ✅
```

### Scenario 2: Drag & Drop + Persistence

```
1. Usuario arrastra línea de SL de 25903.5 → 25898.0
   ↓
2. TradingView API detecta cambio (getShapeById)
   ↓
3. chartAccess.updateLineLabels() ejecuta cada 500ms
   ↓
4. Obtiene nueva posición:
   currentSlPrice = 25898.0
   ↓
5. detectLineDrag() compara:
   lastPositions.slPrice (25903.5) !== currentSlPrice (25898.0)
   ↓
6. Log: "🖱️ Line position changed!"
   ↓
7. Actualiza lastPositions:
   lastPositions.slPrice = 25898.0
   ↓
8. Trigger dos acciones CON DEBOUNCE (1 segundo):
   
   A) lineDragSync.syncWithDebounce()
      - Calcula risk/profit
      - POST a TopstepX API
      - Actualiza platform brackets
   
   B) chartAccess.updateStoreAfterDrag()
      - Espera 1 segundo
      - persistToStore() con NUEVAS posiciones
      - OrderStore guarda nuevo estado
      - chrome.storage.local actualizado
   ↓
9. Después de 1 segundo:
   - TopstepX platform brackets = $470 (nuevo risk)
   - OrderStore state = {slPrice: 25898.0, ...}
   - chrome.storage.local = nuevo estado ✅
```

### Scenario 3: Refresh Después de Drag

```
1. Usuario hit F5 (refresh)
   ↓
2. Extension reloads
   ↓
3. OrderStore.rehydrate() ejecuta
   ↓
4. postMessage: 'TOPSTEP_LOAD_ORDER_STORE'
   ↓
5. Config Bridge lee chrome.storage.local
   ↓
6. Retorna estado guardado:
   {
     activeOrder: {...},
     linesState: {
       slPrice: 25898.0,  ← POSICIÓN ARRASTRADA!
       tpPrice: 25948.0,
       entryPrice: 25923.5,
       side: 'long',
       ...
     }
   }
   ↓
7. OrderStore carga a memoria:
   this.activeOrder = stored.activeOrder
   this.linesState = stored.linesState
   ↓
8. Emite: 'rehydrated' event
   ↓
9. chartAccess.restoreFromStore()
   ↓
10. Lee linesData = orderStore.getLinesState()
   ↓
11. Llama: updateLines(
       25898.0,  ← SL en posición arrastrada
       25948.0,  ← TP original
       25923.5,  ← Entry
       config,
       contracts,
       instrument,
       'long'
     )
   ↓
12. Líneas aparecen en POSICIONES ARRASTRADAS ✅
```

## 🔑 Key Components

### 1. `detectLineDrag()` - Chart Access
```javascript
detectLineDrag(currentSlPrice, currentTpPrice) {
  // Compara posiciones actuales vs últimas
  const slChanged = currentSlPrice !== this.lastPositions.slPrice;
  const tpChanged = currentTpPrice !== this.lastPositions.tpPrice;
  
  if (slChanged || tpChanged) {
    // Update tracking
    this.lastPositions.slPrice = currentSlPrice;
    this.lastPositions.tpPrice = currentTpPrice;
    
    // Trigger sync con TopstepX
    window.lineDragSync.syncWithDebounce(...);
    
    // Trigger persist a OrderStore
    this.updateStoreAfterDrag(currentSlPrice, currentTpPrice);
  }
}
```

### 2. `updateStoreAfterDrag()` - Chart Access
```javascript
updateStoreAfterDrag(slPrice, tpPrice) {
  // Clear existing timer
  clearTimeout(this.storeUpdateTimer);
  
  // Debounce (1 segundo)
  this.storeUpdateTimer = setTimeout(() => {
    // Persist nuevas posiciones
    this.persistToStore(
      slPrice,    // Nueva posición SL
      tpPrice,    // Nueva posición TP
      entryPrice,
      contracts,
      instrument,
      config,
      side
    );
  }, 1000);
}
```

### 3. `persistToStore()` - Chart Access
```javascript
persistToStore(slPrice, tpPrice, entryPrice, contracts, instrument, config, side) {
  const linesData = {
    slPrice: slPrice,     // Puede ser posición original o arrastrada
    tpPrice: tpPrice,     // Puede ser posición original o arrastrada
    entryPrice: entryPrice,
    contracts: contracts,
    side: side,           // REAL side from order
    instrument: {...},
    config: {...}
  };
  
  // Upsert = Insert or Update
  orderStore.upsert(orderData, linesData);
}
```

### 4. `OrderStore.upsert()` - Order Store
```javascript
upsert(orderData, linesData) {
  // Update in-memory
  this.activeOrder = orderData;
  this.linesState = linesData;
  
  // Persist to storage
  this.persist();
  
  // Emit event
  this.emit('order-upserted', {order, lines});
}
```

## ⏱️ Timing

### Debounce Coordination

```javascript
// Ambos usan 1 segundo
lineDragSync.debounceDelay = 1000;
chartAccess.storeUpdateTimer = 1000;

// Resultado:
// Usuario arrastra
// ↓
// Espera 1 segundo
// ↓
// Simultáneamente:
//   - Sync con TopstepX API
//   - Update OrderStore
```

## 🎬 Casos de Uso

### Caso 1: Drag Múltiple Rápido
```
Usuario arrastra SL:
  25903.5 → 25900.0 (espera 0.5s)
  25900.0 → 25898.0 (espera 0.3s)
  25898.0 → 25895.0 (espera 1.5s)

Resultado:
  - Timer se resetea con cada movimiento
  - Solo al final (1.5s de pausa) se ejecuta sync + persist
  - 1 sola request a TopstepX API
  - 1 solo update a OrderStore
  - Eficiente ✅
```

### Caso 2: Drag → Cancel → Drag Nuevo
```
1. Usuario arrastra SL a 25895.0
2. Espera 1 segundo
3. Sync + Persist ejecutado ✅
4. Usuario cancela orden
5. OrderStore.remove() limpia todo
6. Usuario coloca NUEVA orden
7. Arrastra a nueva posición
8. Nuevo state persistido ✅
```

### Caso 3: Drag → Close Browser → Open
```
Day Trader workflow:
1. Coloca orden @ 10:00 AM
2. Arrastra líneas a posición perfecta
3. Toma lunch break (close browser)
4. Vuelve @ 2:00 PM
5. Abre TopstepX
6. Líneas aparecen en posición arrastrada ✅
7. Listo para trading
```

## 📊 Data Flow Diagram

```
User Action (Drag)
       ↓
TradingView Chart API
       ↓
chartAccess.updateLineLabels()
       ↓
detectLineDrag()
       ↓
     Split
    /     \
   /       \
Sync      Store
  ↓         ↓
TopstepX  OrderStore
  ↓         ↓
Platform  chrome.storage.local
Brackets     ↓
          (Persistent)
             ↓
          Page Refresh
             ↓
          Rehydrate
             ↓
          Restore Lines
             ↓
          🎉 Same positions!
```

## 🔍 Debugging

### Check Current State
```javascript
// Ver estado en memoria
window.orderStore.debug();

// Ver storage directo
chrome.storage.local.get('topstep_order_store', console.log);

// Ver líneas actuales
window.chartAccess.state;
```

### Test Drag Persistence
```javascript
// 1. Coloca orden
// 2. Espera que aparezcan líneas
// 3. Arrastra una línea
console.log('[TEST] Dragging line...');

// 4. Espera 1 segundo
setTimeout(() => {
  // 5. Verifica que se guardó
  chrome.storage.local.get('topstep_order_store', (result) => {
    console.log('[TEST] Stored positions:', {
      slPrice: result.topstep_order_store.linesState.slPrice,
      tpPrice: result.topstep_order_store.linesState.tpPrice
    });
  });
}, 1500);

// 6. Refresh página (F5)
// 7. Verifica que líneas aparecen en NUEVA posición
```

### Verify Logs Sequence
```
[TopstepX Chart] 🖱️ Line position changed!
[TopstepX Chart] - SL: 25903.5 → 25898.0
[Line Drag Sync] ⏱️ Sync scheduled (debounced)
[TopstepX Chart] 🏪 Updating OrderStore with dragged positions
[Line Drag Sync] 🚀 Starting sync...
[Line Drag Sync] 💰 Risk/Profit calculated: ...
[Line Drag Sync] 📤 Sending to TopstepX: {...}
[OrderStore] 📝 Upserting order: {...}
[OrderStore] 💾 Persist requested
[Config Bridge] 💾 Order store saved to chrome.storage.local
[Line Drag Sync] ✅ Sync successful
[TopstepX Chart] ✅ OrderStore updated - positions will persist on refresh
```

## ✅ Success Indicators

Al hacer F5 después de drag:

1. ✅ Líneas aparecen en POSICIONES ARRASTRADAS
2. ✅ No hay "flicker" (aparecen directo)
3. ✅ Labels muestran valores correctos
4. ✅ Side correcto (long/short)
5. ✅ Console muestra "Rehydrated successfully"
6. ✅ Console muestra "Lines restored successfully"

## 🎯 Benefits

### Para el Usuario
- 🔒 **Zero Data Loss**: Nunca pierde su setup
- ⚡ **Instant Restore**: Líneas aparecen inmediatamente
- 🎨 **Customizable**: Arrastra a posición perfecta
- 💪 **Reliable**: Funciona incluso cerrando browser
- 🚀 **Professional**: Como plataformas nativas

### Para el Sistema
- 📦 **Single Source of Truth**: OrderStore
- 🔄 **Sync Garantizado**: TopstepX + Storage
- ⚡ **Efficient**: Debouncing previene spam
- 🏗️ **Scalable**: Arquitectura limpia
- 🐛 **Debuggable**: Logs claros en cada paso

---

**Version**: 4.6.0+  
**Status**: ✅ Production Ready  
**Pattern**: OrderStore + Drag Persistence

