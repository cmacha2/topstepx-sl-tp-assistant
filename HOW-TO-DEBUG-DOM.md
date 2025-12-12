# 🔍 Cómo Debuggear el DOM para Encontrar Órdenes

## El Problema

Cuando refrescas la página, la orden **ya existe** en TopstepX pero la extensión no la ve porque:
1. Solo capturamos el POST cuando creas la orden
2. Si la orden ya existe antes de cargar la extensión → no hay POST → no hay captura
3. Las líneas desaparecen porque no sabemos que hay una orden activa

## La Solución

Buscar la orden en el **DOM** de TopstepX donde siempre está visible.

## 🚀 Paso a Paso

### 1. Prepara el Escenario

1. Abre TopstepX
2. **Coloca una orden limit** (ejemplo: MNQ @ 25923.5)
3. **Verifica que la orden está activa** en la interfaz de TopstepX
4. Abre DevTools (F12)

### 2. Carga el Script de Debug

1. Abre la pestaña **Console**
2. Copia y pega todo el contenido de `debug-dom-orders.js`
3. Presiona Enter

Verás algo como:

```
🔍 TopstepX DOM Order Detection Debug

============================================================
Running all searches...
============================================================

📊 Searching for symbol: MNQ
Found 12 text nodes containing "MNQ"

[1] Text: MNQ Limit Buy 1 @ 25923.5
    Path: div.order-row > span.symbol
    Element: <span class="symbol">MNQ</span>

💰 Searching for prices (pattern: XXXXX.X)
Found 8 elements with price-like numbers

[1] Prices: ["25923.5"]
    Text: 25923.5
    Path: div.order-row > span.price
```

### 3. Analiza los Resultados

El script busca automáticamente:

✅ **Símbolos** (MNQ, ES, etc.)
✅ **Precios** (25923.5, 18923.25, etc.)
✅ **Elementos con "order"** en class/id
✅ **Tablas** con datos
✅ **Listas** con items
✅ **React/Vue** component data

### 4. Inspecciona Elementos Específicos

Si encontraste algo interesante:

```javascript
// Ver más detalles de un elemento
inspectElement(window.debugResults.orderElements[0].element)

// Ver todas las clases
window.debugResults.orderElements.forEach((el, i) => {
  console.log(`[${i}]`, el.class, el.text);
});

// Ver todas las rutas (paths)
window.debugResults.orderElements.forEach((el, i) => {
  console.log(`[${i}]`, el.path);
});
```

### 5. Monitorea Cambios en Tiempo Real

```javascript
monitorDOMChanges()
```

Esto observa el DOM por 10 segundos y te muestra cuando aparecen nuevos elementos con datos de órdenes.

## 🎯 Qué Buscar

### Patrones Comunes

1. **Clase con "order"**
   ```html
   <div class="active-orders">
   <div class="order-row">
   <div class="orderItem">
   ```

2. **Tabla de órdenes**
   ```html
   <table class="orders-table">
     <tr>
       <td>MNQ</td>
       <td>25923.5</td>
       <td>Limit</td>
       <td>Buy</td>
     </tr>
   </table>
   ```

3. **Lista de órdenes**
   ```html
   <ul class="order-list">
     <li>MNQ Limit Buy @ 25923.5</li>
   </ul>
   ```

4. **Data attributes**
   ```html
   <div data-order-id="123456" data-symbol="MNQ" data-price="25923.5">
   ```

### Información Que Necesitamos

Para recrear las líneas necesitamos:
- ✅ **Symbol** (MNQ, ES, etc.)
- ✅ **Price** (25923.5)
- ✅ **Side** (Buy/Sell o Long/Short)
- ✅ **Type** (Limit/Stop)
- ✅ **Quantity** (1, 2, 3 contratos)

## 💡 Búsquedas Personalizadas

### Buscar tu símbolo específico

```javascript
searchForSymbol('ES')  // Para E-mini S&P
searchForSymbol('NQ')  // Para Nasdaq
```

### Buscar por texto específico

```javascript
// Buscar "Buy" o "Sell"
document.body.innerHTML.match(/Buy|Sell/g)

// Buscar "Limit"
document.body.innerHTML.match(/Limit/g)

// Ver cuántas veces aparece
console.log('Limit appears:', document.body.innerHTML.match(/Limit/g)?.length)
```

### Buscar en elementos visibles solo

```javascript
function searchVisibleElements() {
  const all = document.querySelectorAll('*');
  const visible = [];
  
  all.forEach(el => {
    if (el.offsetWidth > 0 && el.offsetHeight > 0) {
      const text = el.textContent.trim();
      if (text.includes('MNQ') || text.match(/\d{4,5}\.\d/)) {
        visible.push({
          text: text.substring(0, 100),
          element: el
        });
      }
    }
  });
  
  console.log('Visible elements with order data:', visible.length);
  visible.forEach((v, i) => console.log(`[${i}]`, v.text));
  return visible;
}

searchVisibleElements()
```

## 🔬 Ejemplo Real de Análisis

Supongamos que el script encontró:

```
[3] div.order-container > div.active-order
    Text: MNQ Limit Buy 1 @ 25923.5 SL: 25900.0 TP: 25948.0
```

Ahora inspecciona:

```javascript
const el = window.debugResults.orderElements[3].element;
inspectElement(el);

// Ver estructura
console.log('HTML:', el.innerHTML);

// Ver children
Array.from(el.children).forEach((child, i) => {
  console.log(`Child [${i}]:`, child.textContent.trim());
});

// Buscar spans, divs específicos
el.querySelectorAll('span').forEach(span => {
  console.log('Span:', span.className, span.textContent);
});
```

## 🎨 Highlighting en la Página

Para ver visualmente dónde están los elementos:

```javascript
// Highlight all order elements
window.debugResults.orderElements.forEach(match => {
  match.element.style.border = '3px solid red';
  match.element.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
});

// Highlight table rows
window.debugResults.tableRows.forEach(match => {
  match.element.style.border = '2px solid blue';
});

// Remove highlights
document.querySelectorAll('[style*="border"]').forEach(el => {
  el.style.border = '';
  el.style.backgroundColor = '';
});
```

## 📝 Documentar el Hallazgo

Cuando encuentres el elemento correcto, documenta:

```javascript
// Ejemplo:
const ORDER_SELECTOR = 'div.active-orders > div.order-row';
const SYMBOL_SELECTOR = 'span.symbol';
const PRICE_SELECTOR = 'span.limit-price';
const SIDE_SELECTOR = 'span.order-side';
const QUANTITY_SELECTOR = 'span.quantity';

// Test
const orderEl = document.querySelector(ORDER_SELECTOR);
if (orderEl) {
  console.log('Symbol:', orderEl.querySelector(SYMBOL_SELECTOR)?.textContent);
  console.log('Price:', orderEl.querySelector(PRICE_SELECTOR)?.textContent);
  console.log('Side:', orderEl.querySelector(SIDE_SELECTOR)?.textContent);
  console.log('Qty:', orderEl.querySelector(QUANTITY_SELECTOR)?.textContent);
}
```

## 🚨 Tips Importantes

1. **Refresca y prueba**: Después de encontrar el selector, refresca la página y verifica que sigue funcionando
2. **Coloca otra orden**: Prueba con diferentes tipos (Limit, Stop, Buy, Sell)
3. **Múltiples órdenes**: ¿Qué pasa si tienes 2 órdenes activas?
4. **Sin órdenes**: ¿El elemento desaparece o se oculta?

## 🎯 Siguiente Paso

Una vez que encuentres los selectores correctos:
1. Créalos en `lib/active-orders-observer.js`
2. Implementa la lógica de observación
3. Emite eventos cuando detectes una orden
4. Integra con `main-content-v4.js`

## 💬 Share Your Findings

Cuando encuentres algo, comparte:
```javascript
console.log('=== ORDER DETECTION SOLUTION ===');
console.log('Selector:', 'your-selector-here');
console.log('Sample HTML:', element.outerHTML);
console.log('Data extraction:', {
  symbol: 'how to get',
  price: 'how to get',
  side: 'how to get'
});
```

---

**Ready? Let's find those orders! 🕵️**

