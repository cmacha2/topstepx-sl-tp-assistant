# Complete Configuration Guide v4.4.0

## 🎛️ Overview

TopstepX SL/TP Assistant now offers **full customization** of all visual and behavior settings. Every aspect of the lines, labels, and functionality can be configured through the dashboard.

## 📋 Table of Contents

1. [Risk Management](#risk-management)
2. [Stop Loss & Take Profit](#stop-loss--take-profit)
3. [Visual Settings](#visual-settings)
4. [Display Options](#display-options)
5. [Behavior Options](#behavior-options)
6. [Configuration Examples](#configuration-examples)

---

## 🎯 Risk Management

### Risk Mode
Choose how you calculate your risk per trade.

**Options:**
- **Percentage of Account**: Risk a % of your total account
- **Fixed Dollar Amount**: Risk a fixed $ amount per trade

### Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| **Risk Percent** | Number | 2% | Percentage of account to risk |
| **Risk Fixed** | Number | $500 | Fixed dollar amount to risk |
| **Account Size** | Number | $50,000 | Your total account size |

**Example:**
```javascript
{
  riskMode: 'percent',
  riskPercent: 2,        // Risk 2% of account
  accountSize: 50000     // On $50k account = $1,000 risk
}
```

---

## 💰 Stop Loss & Take Profit

Configure your default SL/TP values and risk:reward ratios.

### Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| **Stop Loss** | Number | $100 | Dollar loss per contract |
| **Take Profit** | Number | $200 | Dollar profit per contract |
| **Use Ratio** | Boolean | true | Auto-calculate TP from SL |
| **Risk:Reward Ratio** | Number | 2 | Multiplier for TP (1:2 = TP is 2x SL) |

**Examples:**

*Fixed SL/TP:*
```javascript
{
  useRatio: false,
  defaultSL: 100,   // $100 loss
  defaultTP: 300    // $300 profit (1:3 ratio)
}
```

*Ratio-based:*
```javascript
{
  useRatio: true,
  defaultSL: 100,   // $100 loss
  tpRatio: 2        // TP = $100 × 2 = $200 profit
}
```

---

## 🎨 Visual Settings

### Line Colors

Customize the colors of your Stop Loss and Take Profit lines.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| **SL Color** | Color | #FF0000 | Stop Loss line color (Red) |
| **TP Color** | Color | #00FF00 | Take Profit line color (Green) |

**Color Recommendations:**
```javascript
// Classic
slColor: '#FF0000'  // Bright red
tpColor: '#00FF00'  // Bright green

// Professional
slColor: '#E53935'  // Material Red 600
tpColor: '#43A047'  // Material Green 600

// Dark Theme
slColor: '#CC0000'  // Dark red
tpColor: '#00AA00'  // Dark green

// Pastel
slColor: '#FF6666'  // Light red
tpColor: '#66FF66'  // Light green
```

### Line Style

Control the appearance and style of your lines.

| Setting | Type | Range/Options | Default | Description |
|---------|------|---------------|---------|-------------|
| **Line Width** | Slider | 1-10px | 1px | Thickness of lines |
| **SL Line Style** | Dropdown | Solid/Dotted/Dashed | Solid | Stop Loss line style |
| **TP Line Style** | Dropdown | Solid/Dotted/Dashed | Solid | Take Profit line style |
| **Line Opacity** | Slider | 0-100% | 100% | Transparency of lines |

**Line Styles:**
- **0 = Solid** (━━━━━)
- **1 = Dotted** (·······)
- **2 = Dashed** (- - - -)

**Examples:**

*Minimalist (thin solid):*
```javascript
{
  lineWidth: 1,
  slLineStyle: 0,  // Solid
  tpLineStyle: 0,  // Solid
  lineOpacity: 100
}
```

*Highlighted (thick dashed):*
```javascript
{
  lineWidth: 5,
  slLineStyle: 2,  // Dashed
  tpLineStyle: 2,  // Dashed
  lineOpacity: 80
}
```

### Label Settings

Customize the text labels shown on your lines.

| Setting | Type | Range/Options | Default | Description |
|---------|------|---------------|---------|-------------|
| **Font Size** | Slider | 8-16px | 10px | Size of label text |
| **Label Format** | Dropdown | Compact/Full/Minimal | Compact | Text format style |
| **Stop Loss Text** | Text Input | Any text | "SL" | Custom SL prefix |
| **Take Profit Text** | Text Input | Any text | "TP" | Custom TP prefix |

**Label Format Examples:**

| Format | Example Output |
|--------|----------------|
| **Compact** | `SL -$100 (2x)` |
| **Full** | `STOP LOSS: -$100.00 (2x)` |
| **Minimal** | `SL -$100` |

**Custom Text Examples:**

```javascript
// English
{
  slPrefix: 'SL',
  tpPrefix: 'TP'
}

// Spanish
{
  slPrefix: 'PÉRDIDA',
  tpPrefix: 'GANANCIA'
}

// Symbols
{
  slPrefix: '⛔',
  tpPrefix: '✅'
}

// Trading Slang
{
  slPrefix: 'STOP',
  tpPrefix: 'TARGET'
}
```

---

## 👁️ Display Options

Fine-tune what information is shown on your lines.

### Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| **Show Labels** | Checkbox | ✅ Yes | Display dollar amounts on lines |
| **Show Decimals** | Checkbox | ❌ No | Show cents ($100.00 vs $100) |
| **Show Contracts** | Checkbox | ✅ Yes | Display contract count (1x, 2x) |
| **Bold Text** | Checkbox | ❌ No | Make label text bold |
| **Use Emojis** | Checkbox | ❌ No | Add emoji icons (🛑 🎯) |

**Display Combinations:**

*Minimalist:*
```javascript
{
  showLabels: true,
  showDecimals: false,
  showContracts: true,
  fontBold: false,
  useEmojis: false
}
// Output: SL -$100 (1x)
```

*Detailed:*
```javascript
{
  showLabels: true,
  showDecimals: true,
  showContracts: true,
  fontBold: true,
  useEmojis: true
}
// Output: 🛑 SL -$100.00 (1x)
```

*Ultra Clean:*
```javascript
{
  showLabels: true,
  showDecimals: false,
  showContracts: false,
  fontBold: false,
  useEmojis: false
}
// Output: SL -$100
```

---

## ⚙️ Behavior Options

Control how the extension behaves.

### Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| **Keep Lines Across Sessions** | Checkbox | ✅ Yes | Persist lines when page reloads |
| **Auto-update on Price Change** | Checkbox | ✅ Yes | Update lines when order moves |
| **Auto-hide for Market Orders** | Checkbox | ✅ Yes | Don't show lines for market orders |
| **Play Sound** | Checkbox | ❌ No | Sound alert when lines appear |

**Behavior Examples:**

*Always Show (sticky):*
```javascript
{
  persistLines: true,
  autoUpdate: true,
  autoHideOnMarket: false,  // Show even for market orders
  playSound: false
}
```

*Clean Session:*
```javascript
{
  persistLines: false,       // Clear on reload
  autoUpdate: true,
  autoHideOnMarket: true,
  playSound: false
}
```

---

## 📖 Configuration Examples

### Preset 1: Minimalist Trader

For clean charts with minimal distraction.

```javascript
{
  // Lines
  slColor: '#CC0000',
  tpColor: '#00AA00',
  lineWidth: 1,
  slLineStyle: 0,
  tpLineStyle: 0,
  lineOpacity: 90,
  
  // Labels
  fontSize: 9,
  labelFormat: 'minimal',
  slPrefix: 'SL',
  tpPrefix: 'TP',
  
  // Display
  showLabels: true,
  showDecimals: false,
  showContracts: false,
  fontBold: false,
  useEmojis: false
}
```
**Result:** Thin lines, small text, no extra info
```
SL -$100
TP +$200
```

### Preset 2: Professional Trader

Balanced visibility and information.

```javascript
{
  // Lines
  slColor: '#E53935',
  tpColor: '#43A047',
  lineWidth: 2,
  slLineStyle: 0,
  tpLineStyle: 0,
  lineOpacity: 100,
  
  // Labels
  fontSize: 11,
  labelFormat: 'compact',
  slPrefix: 'STOP',
  tpPrefix: 'TARGET',
  
  // Display
  showLabels: true,
  showDecimals: false,
  showContracts: true,
  fontBold: false,
  useEmojis: false
}
```
**Result:** Medium lines, clear labels, contract count
```
STOP -$100 (2x)
TARGET +$200 (2x)
```

### Preset 3: Beginner Trader

High visibility, maximum information.

```javascript
{
  // Lines
  slColor: '#FF0000',
  tpColor: '#00FF00',
  lineWidth: 5,
  slLineStyle: 0,
  tpLineStyle: 0,
  lineOpacity: 100,
  
  // Labels
  fontSize: 13,
  labelFormat: 'full',
  slPrefix: 'SL',
  tpPrefix: 'TP',
  
  // Display
  showLabels: true,
  showDecimals: true,
  showContracts: true,
  fontBold: true,
  useEmojis: true
}
```
**Result:** Thick lines, large text, full information
```
🛑 STOP LOSS: -$100.00 (2x)
🎯 TAKE PROFIT: +$200.00 (2x)
```

### Preset 4: Day Trader

Fast execution, auto-clearing.

```javascript
{
  // Lines
  slColor: '#FF3333',
  tpColor: '#33FF33',
  lineWidth: 3,
  slLineStyle: 0,
  tpLineStyle: 0,
  lineOpacity: 100,
  
  // Labels
  fontSize: 10,
  labelFormat: 'compact',
  slPrefix: 'SL',
  tpPrefix: 'TP',
  
  // Display
  showLabels: true,
  showDecimals: false,
  showContracts: true,
  fontBold: false,
  useEmojis: false,
  
  // Behavior
  persistLines: false,        // Clear each session
  autoUpdate: true,
  autoHideOnMarket: true,
  playSound: true             // Audio alerts
}
```

### Preset 5: Swing Trader

Visual emphasis, persistent lines.

```javascript
{
  // Lines
  slColor: '#D32F2F',
  tpColor: '#388E3C',
  lineWidth: 4,
  slLineStyle: 2,             // Dashed
  tpLineStyle: 2,             // Dashed
  lineOpacity: 90,
  
  // Labels
  fontSize: 12,
  labelFormat: 'full',
  slPrefix: 'STOP',
  tpPrefix: 'PROFIT',
  
  // Display
  showLabels: true,
  showDecimals: true,
  showContracts: true,
  fontBold: true,
  useEmojis: false,
  
  // Behavior
  persistLines: true,         // Keep across sessions
  autoUpdate: true,
  autoHideOnMarket: false,
  playSound: false
}
```

---

## 🔄 How to Apply Configuration

### Method 1: Through Dashboard (UI)

1. Click the extension icon
2. Configure all settings
3. Click **"Save Settings"**
4. Settings apply immediately to new orders

### Method 2: Programmatically (Console)

```javascript
// Get current config
chrome.storage.sync.get('topstep_sltp_config', (result) => {
  console.log(result.topstep_sltp_config);
});

// Set new config
const newConfig = {
  lineWidth: 5,
  slColor: '#FF0000',
  // ... other settings
};

chrome.storage.sync.set({ 
  topstep_sltp_config: newConfig 
}, () => {
  console.log('Config saved!');
});
```

### Method 3: Reset to Defaults

1. Click **"Reset to Defaults"** button in dashboard
2. Confirm reset
3. All settings return to default values

---

## ✅ Best Practices

### For Chart Clarity
- Use thin lines (1-2px)
- Avoid emojis for professional look
- Use subtle colors (darker reds/greens)
- Minimal label format

### For Maximum Information
- Use larger font size (12-13px)
- Enable all display options
- Full label format
- Show decimals and contracts

### For Performance
- Disable persistLines if not needed
- Use simpler line styles (solid)
- Smaller font sizes

### For Accessibility
- Use high contrast colors
- Bold text for better readability
- Larger font sizes (13-16px)
- Full label format

---

## 📊 Visual Reference

### Line Width Comparison
```
1px  ─
2px  ━
3px  ━
5px  ▬
10px ▬▬
```

### Font Size Comparison
```
8px   (tiny)
10px  (small) ← Default
12px  (medium)
14px  (large)
16px  (extra large)
```

### Label Format Comparison
```
Compact:  SL -$100 (1x)
Full:     STOP LOSS: -$100.00 (1x)
Minimal:  SL -$100
```

---

**Version:** 4.4.0  
**Last Updated:** December 11, 2024  
**Status:** ✅ Production Ready  
**Full Customization:** ✅ Complete

