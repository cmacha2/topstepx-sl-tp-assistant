# Line Drag Sync - Guía Completa

## ✨ Feature Overview

La funcionalidad **Line Drag Sync** permite que cuando arrastres las líneas de SL/TP en el chart de TradingView, automáticamente se actualicen los brackets de posición en la plataforma TopstepX.

**En simple**: Mueve una línea → TopstepX se actualiza automáticamente.

## 🎯 ¿Cómo Funciona?

### Workflow Completo

```
1. Colocas una orden (limit o stop) en TopstepX
   ↓
2. La extensión dibuja líneas de SL/TP en el chart
   ↓
3. Arrastras una línea (SL o TP) a una nueva posición
   ↓
4. La extensión detecta el cambio de posición
   ↓
5. Espera 1 segundo (debounce) por si sigues ajustando
   ↓
6. Calcula el nuevo risk y profit en dólares
   ↓
7. Obtiene el token de autenticación de localStorage
   ↓
8. Hace POST a /TradingAccount/setPositionBrackets
   ↓
9. TopstepX actualiza los brackets de posición
   ↓
10. Ahora cuando tu limit ejecute, el SL/TP estará listo
```

## 🔧 Configuración

### 1. Habilitar el Sync

1. Abre el popup de la extensión (click en el icono)
2. Scroll hasta la sección "🔄 Auto-Sync with TopstepX"
3. Marca el checkbox "Enable Line Drag Sync"
4. Click en "Save Settings"

### 2. Verificar que Todo Está Listo

Abre la consola del navegador (F12) y verifica:

```javascript
// 1. Verificar que el módulo está cargado
console.log(window.lineDragSync);
// Debe mostrar: LineDragSync {apiBase: "...", enabled: true, ...}

// 2. Verificar el token
console.log(localStorage.getItem('token'));
// Debe mostrar: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// 3. Verificar que el sync está habilitado
window.lineDragSync.enabled
// Debe mostrar: true
```

## 📋 Testing Manual

### Test 1: Verificación de Componentes

```javascript
// En la consola de TopstepX:

// 1. Módulo cargado?
console.log('LineDragSync:', typeof window.lineDragSync !== 'undefined' ? '✅' : '❌');

// 2. Token disponible?
const token = localStorage.getItem('token');
console.log('Token:', token ? '✅ ' + token.substring(0, 20) + '...' : '❌');

// 3. Account ID capturado?
console.log('Account ID:', window.networkInterceptor?.accountId || 'Not captured yet');

// 4. Sync habilitado?
console.log('Sync Enabled:', window.lineDragSync?.enabled ? '✅' : '❌');
```

### Test 2: Colocar Orden y Arrastrar Línea

1. **Coloca una orden limit en TopstepX**
   - Ejemplo: MNQ @ 25923.5
   - Cantidad: 1 contrato
   - Las líneas SL/TP deben aparecer

2. **Abre la consola** (F12) y monitorea los logs:
   ```
   [TopstepX Chart] 🖱️ Line position changed!
   [TopstepX Chart] - SL: 25903.5 → 25900.0
   [Line Drag Sync] ⏱️ Sync scheduled (debounced)
   ```

3. **Arrastra la línea de SL** hacia abajo
   - La línea debe moverse suavemente
   - El label debe actualizar el valor en tiempo real

4. **Espera 1 segundo** (debounce delay)
   - Verás en consola:
   ```
   [Line Drag Sync] 🚀 Starting sync...
   [Line Drag Sync] 🔑 Token retrieved from localStorage
   [Line Drag Sync] 👤 Account ID set: 15379279
   [Line Drag Sync] 💰 Risk/Profit calculated:
   [Line Drag Sync] - Entry: 25923.5
   [Line Drag Sync] - SL: 25900.0 → 94 ticks
   [Line Drag Sync] - TP: 25948.0 → 98 ticks
   [Line Drag Sync] - Risk: 470
   [Line Drag Sync] - Profit: 490
   [Line Drag Sync] 📤 Sending to TopstepX: {accountId: 15379279, autoApply: true, risk: 470, toMake: 490}
   [Line Drag Sync] ✅ Sync successful: {success: true, errorCode: 0}
   ```

5. **Verifica en TopstepX**
   - Abre tu dashboard de TopstepX
   - Ve a Settings → Position Brackets
   - Debes ver:
     - Risk: $470
     - To Make: $490
     - Auto Apply: ON

### Test 3: Arrastar TP

1. **Arrastra la línea de TP** hacia arriba
2. **Espera 1 segundo**
3. **Verifica** que el nuevo `toMake` se sincroniza
4. **Confirma** en TopstepX dashboard que cambió

### Test 4: Múltiples Contratos

1. **Coloca orden con 2 contratos**
2. **Arrastra SL**
3. **Verifica** que el cálculo considera los 2 contratos:
   ```
   Risk: 470 * 2 = $940
   ```

## 🐛 Troubleshooting

### Problema: "No auth token available"

**Causa**: No se encontró el token en localStorage

**Solución**:
1. Asegúrate de estar logueado en TopstepX
2. Refresh la página
3. Verifica el token:
   ```javascript
   localStorage.getItem('token')
   ```
4. Si no hay token, intenta:
   - Logout y login en TopstepX
   - Clear cookies y login de nuevo

### Problema: "No account ID available"

**Causa**: No se ha capturado el account ID todavía

**Solución**:
1. Coloca una orden en TopstepX
2. El account ID se captura automáticamente de la request
3. Verifica:
   ```javascript
   window.networkInterceptor.accountId
   ```

### Problema: Sync no se dispara al arrastrar

**Causa**: El sync podría estar deshabilitado

**Solución**:
1. Verifica config:
   ```javascript
   window.lineDragSync.enabled
   ```
2. Si es `false`, ve al popup y habilita "Enable Line Drag Sync"
3. Save settings y refresh la página

### Problema: API error 401 Unauthorized

**Causa**: Token expirado o inválido

**Solución**:
1. Logout de TopstepX
2. Login de nuevo
3. El token se renovará automáticamente
4. Refresh la extensión

### Problema: Sincroniza mal el valor

**Causa**: Instrumento tick size o tick value incorrectos

**Solución**:
1. Verifica la base de datos de instrumentos:
   ```javascript
   window.instrumentDatabase.getInstrument('MNQ')
   ```
2. Si los valores son incorrectos, abre un issue en GitHub

## 📊 API Endpoint Details

### Request

```http
POST https://userapi.topstepx.com/TradingAccount/setPositionBrackets
Content-Type: application/json
Authorization: Bearer {token}

{
  "accountId": 15379279,
  "autoApply": true,
  "risk": 300,
  "toMake": 600
}
```

### Response (Success)

```json
{
  "success": true,
  "errorCode": 0,
  "errorMessage": null
}
```

### Response (Error)

```json
{
  "success": false,
  "errorCode": 401,
  "errorMessage": "Unauthorized"
}
```

## 🎛️ Configuration Options

### `enableLineDragSync` (boolean)
- **Default**: `false`
- **Description**: Habilita o deshabilita el sync automático
- **Location**: Popup → "Auto-Sync with TopstepX" section

### `syncDebounceDelay` (number)
- **Default**: `1000` (ms)
- **Description**: Tiempo de espera después de arrastrar antes de sincronizar
- **Range**: 500-3000ms recomendado
- **Fixed**: Actualmente fijo en 1 segundo (1000ms)

## 🔒 Security Notes

### Token Storage
- El token se lee de `localStorage` bajo la key `"token"`
- El token es manejado por TopstepX, no por la extensión
- La extensión solo lo **lee**, nunca lo modifica ni guarda

### Authentication
- Usa el mismo token que TopstepX usa para sus propias API calls
- No requiere login adicional
- Si TopstepX está logueado, la extensión funciona

### Permissions
- `https://userapi.topstepx.com/*` - Para hacer POST requests
- `storage` - Para guardar configuración
- `tabs` - Para comunicación entre popup y content script

### Data Privacy
- No se envía ningún dato a servidores externos
- Todo funciona localmente entre tu navegador y TopstepX
- Account ID y token se mantienen en memoria solo durante la sesión

## 💡 Tips & Best Practices

### 1. Usa el Debounce
- El delay de 1 segundo es perfecto para ajustar la línea sin spam
- Si arrastras continuamente, solo se hace 1 request al final

### 2. Verifica Antes de Ejecutar
- Siempre revisa que las líneas estén donde quieres
- Recuerda que TopstepX aplicará estos brackets cuando la orden ejecute

### 3. Desactiva si No Lo Necesitas
- Si prefieres configurar brackets manualmente en TopstepX, desactiva el sync
- La extensión seguirá mostrando las líneas visuales

### 4. Monitor de Consola
- Mantén la consola abierta durante testing
- Los logs te dirán exactamente qué está pasando

### 5. Múltiples Órdenes
- El sync solo afecta los brackets de **posición**
- No modifica órdenes individuales
- Es para configurar los brackets que se aplicarán cuando tu orden ejecute

## 🚀 Quick Reference

### Comandos de Consola Útiles

```javascript
// Habilitar sync manualmente
window.lineDragSync.setEnabled(true);

// Deshabilitar sync
window.lineDragSync.setEnabled(false);

// Cambiar delay de debounce
window.lineDragSync.debounceDelay = 2000; // 2 segundos

// Ver account ID actual
window.networkInterceptor.accountId;

// Ver token actual
localStorage.getItem('token');

// Verificar última sincronización
window.lineDragSync.lastSyncTime;

// Sync manual (testing)
window.lineDragSync.syncPositionBrackets(25900, 25948, 25923.5, 
  {tickSize: 0.25, tickValue: 5, symbol: 'MNQ'}, 1);
```

## 📝 Example Scenarios

### Scenario 1: Day Trader con Risk Fijo

**Setup**:
- Account: $50K
- Risk per trade: $300
- Instrument: MNQ

**Workflow**:
1. Configuras en extension: Risk $300, TP $600
2. Colocas limit buy @ 25923.5
3. Líneas aparecen: SL @ 25903.5, TP @ 25948.0
4. Decides que quieres más risk, arrastras SL a 25898.0
5. Después de 1 segundo → TopstepX ahora tiene Risk: $510
6. Tu orden ejecuta → TopstepX aplica el nuevo SL automáticamente

### Scenario 2: Swing Trader con TP Amplio

**Setup**:
- Account: $100K
- Risk: $500
- TP Ratio: 3:1

**Workflow**:
1. Colocas stop sell @ 25950
2. Líneas: SL @ 25975, TP @ 25875
3. Mercado mueve, quieres mover TP más lejos
4. Arrastras TP a 25850
5. TopstepX actualiza: To Make: $2000
6. Cuando stop ejecute, TP ya está configurado

## 🎉 Success Indicators

Sabes que todo está funcionando cuando:

1. ✅ Consola muestra: `[Line Drag Sync] ✅ Sync successful`
2. ✅ TopstepX dashboard refleja los nuevos valores
3. ✅ No hay errores 401 o 403
4. ✅ El `lastSyncTime` se actualiza
5. ✅ Las líneas en el chart están en la posición correcta

## 🆘 Support

Si tienes problemas:

1. Revisa esta guía completa
2. Verifica la consola para mensajes de error
3. Confirma que TopstepX está logueado
4. Intenta deshabilitar/habilitar el sync
5. Refresh la página de TopstepX
6. Reload la extensión en `chrome://extensions`

---

**Version**: 4.5.0  
**Last Updated**: December 12, 2024  
**Feature Status**: ✅ Production Ready

