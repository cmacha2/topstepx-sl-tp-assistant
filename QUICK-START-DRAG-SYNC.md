# 🚀 Quick Start: Line Drag Sync

## En 3 Pasos

### 1️⃣ Habilitar
- Abre el popup de la extensión
- Marca "Enable Line Drag Sync"
- Click "Save Settings"

### 2️⃣ Colocar Orden
- Coloca una limit o stop order en TopstepX
- Las líneas SL/TP aparecen en el chart

### 3️⃣ Arrastrar
- Arrastra cualquier línea (SL o TP)
- Espera 1 segundo
- ✅ TopstepX se actualiza automáticamente

## ✨ Qué Hace

Cuando arrastras las líneas en el chart:
- Calcula el nuevo risk/profit en dólares
- Obtiene tu token de `localStorage`
- Envía POST a TopstepX API
- Actualiza los position brackets

## 🎯 Resultado

```
Arrastras SL → Risk: $300 → $450
      ↓
TopstepX Platform Brackets actualizados
      ↓
Cuando tu orden ejecute → SL/TP ya están listos
```

## 🔍 Verificar que Funciona

Abre consola (F12) y busca:
```
[Line Drag Sync] ✅ Sync successful
```

O revisa tu TopstepX dashboard:
- Settings → Position Brackets
- Verás los nuevos valores de Risk y To Make

## ⚙️ Configuración

### Debounce Delay
- **Fijo**: 1 segundo
- **Por qué**: Previene spam mientras arrastras
- **Resultado**: Suave, rápido, eficiente

### Auto Apply
- **Siempre ON**: Los brackets se aplican automáticamente
- **Beneficio**: No necesitas activarlos manualmente en TopstepX

## 💡 Tips

1. **Ajusta antes de ejecutar**: Las líneas son visuales, TopstepX aplica cuando ejecuta
2. **Monitor de consola**: Mantén F12 abierto para ver los logs
3. **Desactiva si quieres**: El sync es opcional, la visual sigue funcionando

## 🐛 Si No Funciona

```javascript
// Verifica en consola:
window.lineDragSync.enabled     // Debe ser: true
localStorage.getItem('token')   // Debe tener valor
window.networkInterceptor.accountId  // Debe tener número
```

**Si falta algo**:
- Habilita el sync en el popup
- Logout/login de TopstepX para refrescar token
- Coloca una orden para capturar account ID

## 📊 Endpoint

```http
POST https://userapi.topstepx.com/TradingAccount/setPositionBrackets

Body: {
  "accountId": 15379279,
  "autoApply": true,
  "risk": 300,
  "toMake": 600
}
```

## 🎉 Y Eso Es Todo

Drag. Wait. Sync. Done.

---

**Más detalles**: Ver `LINE-DRAG-SYNC-GUIDE.md`  
**Version**: 4.5.0

