# 🧪 Quick Test: OrderStore Persistence

## Test en 5 Pasos

### 1️⃣ Coloca una Orden
```
1. Abre TopstepX
2. Coloca limit order (ej: MNQ @ 25923.5)
3. Verás las líneas SL/TP en el chart
```

### 2️⃣ Verifica que se Guardó
Abre consola (F12):
```javascript
window.orderStore.debug();
// Debe mostrar:
// - Active Order: {symbol: "MNQ", entryPrice: 25923.5, ...}
// - Lines State: {slPrice: ..., tpPrice: ..., ...}
// - Has Active Order: true
```

### 3️⃣ Refresh la Página
```
Hit F5 (Refresh)
```

### 4️⃣ Verifica que se Restauraron
Espera ~3-5 segundos, luego verás:
```
[OrderStore] 💧 Rehydrating from storage...
[OrderStore] ✅ Rehydrated successfully
[TopstepX Chart] 💧 Attempting to restore lines from store...
[TopstepX Chart] ✅ Lines restored successfully!
```

**Resultado**: Las líneas deben aparecer exactamente donde estaban antes.

### 5️⃣ Cancela la Orden
```
1. Cancela la orden en TopstepX
2. Las líneas desaparecen
3. Verifica en consola:
```

```javascript
window.orderStore.debug();
// Debe mostrar:
// - Active Order: null
// - Lines State: null
// - Has Active Order: false
```

## ✅ Success Indicators

- ✅ Líneas aparecen al colocar orden
- ✅ Estado se guarda automáticamente
- ✅ Líneas persisten después de F5
- ✅ Líneas desaparecen al cancelar
- ✅ Estado se limpia al cancelar

## 🐛 Si No Funciona

### Problema: Líneas no aparecen después de F5

**Solución**:
```javascript
// 1. Verifica que hay datos en storage
chrome.storage.local.get('topstep_order_store', console.log);

// 2. Si hay datos, intenta rehydratar manualmente
await window.orderStore.rehydrate();

// 3. Si rehydrata OK, restaura al chart
await window.chartAccess.restoreFromStore();
```

### Problema: Error "OrderStore not available"

**Solución**:
```javascript
// Verifica que el módulo está cargado
typeof window.orderStore !== 'undefined'

// Si es false, reload la extensión:
// chrome://extensions/ → Click reload
```

### Problema: Datos expirados (> 24 horas)

**Comportamiento esperado**: El store ignora datos > 24h

**Logs**:
```
[OrderStore] ⏰ Stored data expired (age: 1440 minutes)
```

## 🎯 Test Avanzado: Multiple Scenarios

### Scenario 1: Same Day Trading
```
Morning:
  - Coloca orden
  - Toma break (15 mins)
  - Refresh página
  → Líneas deben estar ahí
```

### Scenario 2: Close Browser
```
Afternoon:
  - Coloca orden
  - Close Chrome completamente
  - Open Chrome 1 hour later
  - Go to TopstepX
  → Líneas deben restaurarse
```

### Scenario 3: Multiple Refreshes
```
1. Coloca orden
2. F5 (refresh)
3. Líneas aparecen
4. F5 de nuevo
5. Líneas aparecen de nuevo
6. Repeat 10 times
→ Siempre deben aparecer
```

### Scenario 4: Modify and Refresh
```
1. Coloca orden
2. Arrastra una línea
3. F5 (refresh)
→ Líneas deben aparecer en la NUEVA posición
```

### Scenario 5: Cancel and Refresh
```
1. Coloca orden
2. Cancela orden
3. F5 (refresh)
→ NO deben aparecer líneas (storage limpio)
```

## 📊 Storage Inspection

### Ver Storage Directo
```javascript
// En consola
chrome.storage.local.get('topstep_order_store', (result) => {
  console.log('Stored data:', result.topstep_order_store);
  
  if (result.topstep_order_store) {
    const age = Date.now() - result.topstep_order_store.timestamp;
    console.log('Age (minutes):', Math.round(age / 1000 / 60));
  }
});
```

### Clear Storage Manually
```javascript
// Si quieres limpiar para testing
chrome.storage.local.remove('topstep_order_store', () => {
  console.log('Storage cleared');
});
```

### Force Save
```javascript
// Forzar guardado manual
window.orderStore.persist();
```

## 🎉 Expected Logs Sequence

### On Order Creation
```
[NetworkInterceptor] 🆕 Order created: {...}
[TopstepX Chart] 📊 Updating lines...
[TopstepX Chart] ✅ Lines created
[TopstepX Chart] 🏪 State persisted to OrderStore
[OrderStore] 📝 Upserting order: {...}
[OrderStore] 💾 Persist requested
[Config Bridge] 💾 Order store saved to chrome.storage.local
```

### On Page Refresh
```
[OrderStore] 🏪 Store initialized
[TopstepX v4] 💧 Rehydrating OrderStore...
[OrderStore] 💧 Rehydrating from storage...
[Config Bridge] 📦 Order store loaded: Found
[OrderStore] ✅ Rehydrated successfully
[TopstepX v4] 💧 OrderStore rehydrated successfully
[TopstepX Chart] 💧 Attempting to restore lines from store...
[TopstepX Chart] 💧 Lines data found: {...}
[TopstepX Chart] 📊 Updating lines...
[TopstepX Chart] ✅ Lines restored successfully!
```

### On Order Cancel
```
[NetworkInterceptor] ❌ ORDER CANCELLED: {...}
[TopstepX Chart] 🏪 Order store cleared
[OrderStore] 🗑️ Removing order
[OrderStore] 💾 Storage clear requested
[Config Bridge] 🗑️ Order store cleared from storage
```

## 💡 Tips

1. **Mantén la consola abierta** - Los logs te dirán exactamente qué está pasando
2. **Verifica timestamps** - Asegúrate que los datos no tienen > 24h
3. **Test en diferentes browsers** - Chrome, Edge, etc (todos soportan chrome.storage)
4. **Clear cache si es necesario** - A veces ayuda con testing
5. **Reload extension** - Si algo se comporta raro, reload la extensión

---

**Version**: 4.6.0  
**Feature**: OrderStore Pattern  
**Status**: ✅ Production Ready

