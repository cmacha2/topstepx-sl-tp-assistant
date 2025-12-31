# 🚀 Cómo Publicar en Chrome Web Store
## Guía Rápida en Español

---

## ✅ ESTADO: 90% LISTO

Tu extensión está casi lista. Solo faltan **screenshots** y registro de cuenta.

---

## 📸 PASO 1: Crear Screenshots (REQUERIDO)

Necesitas 2-5 capturas de pantalla (1280x800px recomendado).

### Screenshot 1: Popup de Configuración
1. Abre Chrome
2. Click en el icono de la extensión
3. Toma captura del popup con las opciones
4. Guarda como: `assets/store-screenshots/screenshot-1-config.png`

### Screenshot 2: Chart con Líneas SL/TP
1. Ve a TopstepX.com
2. Abre un chart
3. Coloca una orden limit o stop
4. Espera a que aparezcan las líneas rojas (SL) y verdes (TP)
5. Toma captura mostrando las líneas con sus etiquetas
6. Guarda como: `assets/store-screenshots/screenshot-2-chart-lines.png`

### Screenshot 3-5 (Opcionales pero recomendados)
- Ejemplo de orden LONG (SL abajo, TP arriba)
- Ejemplo de orden SHORT (SL arriba, TP abajo)
- Ejemplo arrastrando una orden (líneas actualizándose)

**Tip:** Usa herramientas como:
- macOS: Cmd + Shift + 4
- Windows: Windows + Shift + S
- O cualquier tool de screenshots

---

## 💳 PASO 2: Registrar Cuenta Developer

1. Ve a: https://chrome.google.com/webstore/devconsole
2. Inicia sesión con tu cuenta de Google
3. Paga $5 USD (pago único, no mensual)
4. Verifica tu email
5. ¡Listo!

---

## 📦 PASO 3: Subir la Extensión

### 3.1 Verificar que el Build Existe
```bash
ls -lh topstepx-sltp-assistant-v4.5.5.zip
```
Debe mostrar: `68K` (68 kilobytes)

Si no existe, genera el build:
```bash
./build-store.sh
```

### 3.2 Ir al Dashboard
- URL: https://chrome.google.com/webstore/devconsole
- Click en **"New Item"**

### 3.3 Subir ZIP
- Click en **"Choose file"**
- Selecciona: `topstepx-sltp-assistant-v4.5.5.zip`
- Espera a que suba (30 segundos)

---

## 📝 PASO 4: Llenar Información

### Nombre
```
TopstepX SL/TP Assistant
```

### Descripción Corta
```
Visual Stop Loss and Take Profit lines with automatic risk calculation for TopstepX traders
```

### Descripción Detallada
Abre el archivo `CHROME-STORE-SUBMISSION.md` y copia la sección **"Detailed Description"** completa.

### Categoría
```
Productivity
```

### Idioma
```
English
```

---

## 🖼️ PASO 5: Subir Imágenes

1. **Icon pequeño (128x128):**
   - Sube: `assets/icons/icon128.png`

2. **Screenshots:**
   - Sube todos los de: `assets/store-screenshots/`
   - Mínimo 1, máximo 5
   - Recomendado: 2-3

3. **Promo Tile** (Opcional):
   - Si creaste el promo tile de 440x280px, súbelo
   - Si no, puedes omitirlo por ahora

---

## 🔐 PASO 6: Privacy & Permisos

### Single Purpose
```
Visual trading assistant that displays Stop Loss and Take Profit lines on TopstepX charts for risk management
```

### Justificación de Permisos

**storage:**
```
Save user configuration preferences (colors, line width, risk settings) locally on device
```

**activeTab + scripting:**
```
Access TopstepX.com charts to draw visual Stop Loss and Take Profit lines
```

**host_permissions - topstepx.com:**
```
Access TopstepX charts to detect orders and draw visual risk management lines
```

**host_permissions - tradingview.com:**
```
Access TradingView chart widgets embedded in TopstepX to render lines using chart API
```

### Preguntas de Privacidad

**¿Ejecuta código remoto?**
```
NO
```

**¿Recopila datos de usuario?**
```
NO - All settings stored locally on device only
```

---

## 🌍 PASO 7: Distribución

- **Precio:** Free
- **Países:** All countries (o selecciona los que quieras)
- **Visibilidad:** Public

---

## 🎯 PASO 8: Enviar para Revisión

1. Revisa que toda la información esté completa
2. Click en **"Submit for Review"**
3. Confirma el envío
4. ¡Listo! Ahora solo esperar

---

## ⏱️ TIEMPOS

- **Tu trabajo:** 1 hora (screenshots + llenar formularios)
- **Revisión de Google:** 2-5 días hábiles
- **Típicamente:** 2-3 días

---

## 📧 DESPUÉS DE ENVIAR

### Si Aprueban ✅
- Recibirás email: "Your item has been published"
- La extensión se publica inmediatamente
- Recibirás el link de la Chrome Web Store
- Los usuarios podrán instalarla con 1 click

### Si Rechazan ❌
- Recibirás email explicando las razones
- Haz las correcciones necesarias
- Actualiza la versión (ej: 4.5.6)
- Vuelve a enviar

---

## 🆘 SI GOOGLE PIDE ACLARACIONES

1. **Responde rápido** (menos de 24 horas)
2. **Sé claro y profesional**
3. **Explica cualquier permiso** que cuestionen:
   - "Este permiso es necesario para [razón específica]"
   - "Sin este permiso, la funcionalidad X no funcionaría"
4. **Ofrece documentación adicional** si la piden

---

## 📚 DOCUMENTOS DE REFERENCIA

Todo preparado para ti:

1. **CHROME-STORE-SUBMISSION.md** - Guía completa en inglés
2. **FINAL-CHECKLIST.md** - Checklist detallada
3. **PRIVACY-POLICY.md** - Política de privacidad
4. **README.md** - Documentación de la extensión

---

## 🎯 ACCIÓN INMEDIATA

### HOY (1 hora):
1. ✅ Toma 2-5 screenshots
2. ✅ Registra cuenta developer ($5)
3. ✅ Sube extensión a Chrome Web Store
4. ✅ Llena todos los formularios
5. ✅ Submit for review

### LUEGO (2-5 días):
- Espera el email de Google
- Si aprueban: ¡Celebra! 🎉
- Si rechazan: Corrige y reenvía

---

## ✅ RESUMEN

**LO QUE ESTÁ LISTO:**
- ✅ Código completo y funcional
- ✅ Manifest.json correcto (v4.5.5)
- ✅ Privacy Policy completa
- ✅ Build listo (68KB)
- ✅ Documentación completa
- ✅ Sin problemas de seguridad

**LO QUE FALTA:**
- ⚠️ Screenshots (30 minutos)
- ⚠️ Cuenta developer ($5)
- ⚠️ Subir a Chrome Web Store (20 minutos)

**TOTAL: ~1 hora de trabajo + 2-5 días de espera**

---

## 💡 TIPS

1. **Screenshots de calidad:** Usa alta resolución, limpia la pantalla
2. **Descripción clara:** Explica qué hace la extensión sin exagerar
3. **Responde rápido:** Si Google te contacta, responde en 24h
4. **Paciencia:** La revisión puede tardar hasta 5 días hábiles
5. **No te desanimes:** Si rechazan, es normal, solo corrige y reenvía

---

## 🎉 ¡SUERTE!

Tu extensión es muy útil para traders de TopstepX. Una vez publicada:

- Los usuarios podrán instalarla fácilmente
- Tendrás estadísticas de instalaciones
- Podrás actualizarla cuando quieras
- Ayudarás a muchos traders a gestionar mejor su riesgo

**¡Adelante! Ya casi está lista para el mundo.**

---

**¿Preguntas?** Consulta los archivos:
- `CHROME-STORE-SUBMISSION.md` (guía completa)
- `FINAL-CHECKLIST.md` (checklist detallada)

**¿Problemas técnicos?** Revisa:
- Chrome Web Store Policies: https://developer.chrome.com/docs/webstore/program-policies/
- Best Practices: https://developer.chrome.com/docs/webstore/best-practices/
