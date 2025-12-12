# Percentage Mode Feature - v4.5.0

## 📊 Overview

La extensión ahora puede mostrar el SL/TP como **porcentaje de tu balance total real** en lugar de valores en dólares. Esto te da una visión más clara de cuánto estás arriesgando respecto a tu cuenta actual.

## 🎯 Por Qué Es Útil

### Antes (Solo USD)
```
SL -$300
TP +$600
```
**Problema**: No sabes qué % de tu cuenta estás arriesgando.

### Ahora (Modo Porcentaje)
```
SL -0.6%
TP +1.2%
```
**Beneficio**: Ves inmediatamente que estás arriesgando 0.6% de tu cuenta total.

## 💰 Cómo Calcula el Balance Total

### Fórmula
```
Total Account Value = Starting Balance (del template) + Current Balance (P&L actual)
```

### Ejemplos Reales

#### Ejemplo 1: Cuenta Nueva Express
```
Template: $50K Express
- startingBalance: $0 (Express siempre empieza en 0)
- balance actual: $0
- Total: $50,000 (usa accountSize del config)

Si tu SL es $300:
Porcentaje = ($300 / $50,000) * 100 = 0.6%
```

#### Ejemplo 2: Cuenta Express con Ganancias
```
Template: $50K Express
- startingBalance: $0
- balance actual: +$1,783.90 (ganancia acumulada)
- Total: $51,783.90

Si tu SL es $300:
Porcentaje = ($300 / $51,783.90) * 100 = 0.58%
```

#### Ejemplo 3: Cuenta Combine con Pérdidas
```
Template: $50K Combine
- startingBalance: $50,000
- balance actual: -$500 (pérdida acumulada)
- Total: $49,500

Si tu SL es $300:
Porcentaje = ($300 / $49,500) * 100 = 0.61%
```

## 🔧 Cómo Funciona Técnicamente

### 1. Captura de Datos de Cuenta
```javascript
// La extensión intercepta esta llamada automáticamente
GET https://userapi.topstepx.com/TradingAccount

Response (extractos relevantes):
{
  "accountId": 15379279,
  "accountName": "EXPRESS-V2-384127-45241551",
  "templateId": 4,
  "startingBalance": 0.0000,
  "balance": 1783.9000,
  "realizedDayPnl": -3.1000,
  "totalProfit": 3775.000000000,
  "totalLoss": -1758.500000000
}
```

### 2. Captura de Template Info
```javascript
// La extensión intercepta esta llamada automáticamente
GET https://userapi.topstepx.com/AccountTemplate/userTemplates

Response (extractos relevantes):
{
  "id": 4,
  "name": "$50K Express",
  "title": "$50K Express",
  "startingBalance": 0,  // Express siempre 0
  "margin": 50000
}
```

### 3. Cálculo en Tiempo Real
```javascript
// En main-content-v4.js
function updateTotalAccountValue() {
  const activeAccount = state.accountData[0];
  const template = state.templateData.find(t => t.id === activeAccount.templateId);
  
  const startingBalance = template.startingBalance || 0;
  const currentBalance = activeAccount.balance || 0;
  
  state.totalAccountValue = startingBalance + currentBalance;
  // Ejemplo: 0 + 1783.90 = 1783.90
  // Para Express, el "starting" real es el margin del template
}
```

### 4. Display en Chart
```javascript
// En chart-access.js - formatLabel()
if (config.showPercentage && totalAccountValue > 0) {
  const percentage = (dollars / totalAccountValue) * 100;
  return `${prefix} ${sign}${percentage.toFixed(1)}%`;
}
```

## 🎛️ Cómo Usar la Feature

### Paso 1: Habilitar Modo Porcentaje
1. Abre el popup de la extensión
2. Busca la sección "Display Options"
3. Marca el checkbox: **"Show percentage instead of USD (% of total account value)"**
4. Click "Save Settings"

### Paso 2: Refresh TopstepX
1. Recarga la página de TopstepX
2. La extensión capturará automáticamente:
   - Tu balance actual
   - Tu template info
   - Calculará el total

### Paso 3: Coloca una Orden
1. Coloca una limit order
2. Las líneas mostrarán porcentajes:
   ```
   SL -0.6%
   TP +1.2%
   ```

### Cambiar de Vuelta a USD
1. Abre el popup
2. Desmarca el checkbox
3. Save Settings
4. Verás de nuevo:
   ```
   SL -$300
   TP +$600
   ```

## 📊 Casos de Uso

### Uso 1: Risk Management Estricto
```
Regla: Nunca arriesgar más de 1% por trade

Con Porcentaje:
- Ves inmediatamente si estás dentro de tu regla
- SL -0.8% ✅ OK
- SL -1.3% ❌ Demasiado risk
```

### Uso 2: Cuentas con P&L Acumulado
```
Día 1: Balance $50K
- SL $300 = 0.6%

Día 5: Balance $52K (ganaste $2K)
- SL $300 = 0.58% (mismo SL, menos % porque cuenta creció)
```

### Uso 3: Comparar Trades
```
Trade A: SL -0.5%, TP +1.0% (R:R 1:2)
Trade B: SL -0.3%, TP +0.9% (R:R 1:3)

Fácil ver cuál tiene mejor risk/reward
```

## ⚠️ Notas Importantes

### Cuentas Express
Las cuentas Express tienen `startingBalance: 0` porque no es una funded account tradicional. El "starting balance" real es el `margin` del template (50K, 100K, etc.).

**Para Express:**
```
Total = 0 (starting) + balance actual
Si balance = 0, usamos accountSize del config como fallback
```

### Cuentas Combine
Las cuentas Combine tienen un `startingBalance` real (ej: 50000).

**Para Combine:**
```
Total = 50000 (starting) + balance actual
Ejemplo: 50000 + 1500 = 51500
```

### Actualización Automática
La extensión captura los datos automáticamente cuando:
- Cargas la página de TopstepX
- TopstepX hace polling de datos (cada X segundos)
- Refrescas manualmente

**No necesitas hacer nada manual.**

## 🐛 Troubleshooting

### Problema: Muestra porcentajes incorrectos
**Solución:**
1. Abre la consola del navegador (F12)
2. Busca estos logs:
   ```
   [TopstepX v4] 💰 Account data captured
   [TopstepX v4] 🎯 Template data captured
   [TopstepX v4] 💎 Total Account Value Calculated
   ```
3. Verifica que los valores sean correctos

### Problema: No muestra porcentajes
**Solución:**
1. Verifica que el checkbox esté marcado
2. Recarga la página de TopstepX
3. Coloca una nueva orden (las órdenes viejas no se actualizan)

### Problema: Dice "Total Account Value: null"
**Solución:**
1. La extensión aún no capturó los datos
2. Espera 5-10 segundos
3. Abre/cierra un chart
4. TopstepX hará una llamada API automáticamente

## 📁 Archivos Modificados

### Core Logic
- `lib/network-interceptor.js` - Captura APIs
- `content-scripts/main-content-v4.js` - Calcula total
- `lib/chart-access.js` - Display de porcentajes

### Configuration
- `lib/storage-manager.js` - Config option
- `popup/popup.html` - Checkbox UI
- `popup/popup.js` - Manejo de checkbox

### Documentation
- `CHANGELOG.md` - Release notes
- `PERCENTAGE-MODE-v4.5.0.md` - Esta guía

## 🎉 Resumen

### Lo Que Hace
✅ Muestra SL/TP como % de tu balance total real
✅ Calcula balance total = starting + current P&L
✅ Funciona con Express, Combine, todos los tipos
✅ Se actualiza automáticamente con tu balance
✅ Toggle on/off cuando quieras

### Lo Que NO Hace
❌ No modifica tu cuenta (solo display)
❌ No envía datos a servidores externos
❌ No cambia tus órdenes reales
❌ No afecta los cálculos de USD (son independientes)

### Próximos Pasos
1. Habilita el checkbox
2. Recarga TopstepX
3. Coloca una orden
4. Observa los porcentajes
5. Ajusta tu risk management

---

**Version**: 4.5.0  
**Release Date**: December 12, 2024  
**Status**: ✅ Production Ready

