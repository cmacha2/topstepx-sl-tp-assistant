# Contributing to TopstepX SL/TP Assistant

First off, thank you for considering contributing to TopstepX SL/TP Assistant! 🎉

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

**When reporting a bug, include:**
- Clear and descriptive title
- Steps to reproduce the behavior
- Expected behavior vs actual behavior
- Screenshots or console logs (F12 → Console)
- Browser version and OS
- Extension version

**Example:**
```markdown
**Bug**: Lines appear on wrong side for SHORT positions

**Steps to reproduce:**
1. Open TopstepX chart
2. Create a SHORT limit order at 25700
3. Observe line positions

**Expected**: SL above entry, TP below
**Actual**: SL below entry, TP above

**Console logs:**
[TopstepX v4.3.1] Side from order: SHORT
[TopstepX v4.3.1] SL Price: 25600 (below entry)  ← WRONG

**Environment:**
- Chrome 120
- macOS 14.0
- Extension v4.3.1
```

### Suggesting Enhancements

Enhancement suggestions are welcome! Please:
- Use a clear and descriptive title
- Provide a detailed description of the feature
- Explain why this enhancement would be useful
- Include mockups or examples if applicable

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/topstepx-sl-tp-assistant.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add console logs for debugging
   - Test thoroughly with different order types

4. **Test your changes**
   - Test with LONG positions
   - Test with SHORT positions
   - Test with different instruments (MES, MNQ, ES, NQ)
   - Test line dragging and updates
   - Check console for errors

5. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
   
   Use conventional commits:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation
   - `style:` - Code style (formatting)
   - `refactor:` - Code refactoring
   - `test:` - Tests
   - `chore:` - Maintenance

6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Open a Pull Request**
   - Describe what your PR does
   - Link related issues
   - Add screenshots if UI changes

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/cmacha2/topstepx-sl-tp-assistant.git
   cd topstepx-sl-tp-assistant
   ```

2. **Load extension in Chrome**
   - Open `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the project folder

3. **Make changes**
   - Edit files in your IDE
   - Click "Reload" in chrome://extensions/ after changes
   - Refresh TopstepX page (F5)

## Code Style

### JavaScript

- Use ES6+ features
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

**Good:**
```javascript
function calculateStopLossPrice(entryPrice, slDollars, tickValue, tickSize, side) {
  const ticks = slDollars / tickValue;
  const priceMovement = ticks * tickSize;
  
  if (side === 'long') {
    return entryPrice - priceMovement;  // SL below entry for LONG
  } else {
    return entryPrice + priceMovement;  // SL above entry for SHORT
  }
}
```

### Console Logging

Use prefixed logs for easy filtering:

```javascript
console.log('[TopstepX Network] 🆕 CREATE ORDER detected:', orderData);
console.log('[TopstepX v4] ✅ Price from order:', price);
console.log('[TopstepX Chart] 📊 Updating lines...');
```

### File Structure

```
lib/                      # Core libraries (reusable)
├── calculations.js       # Math and calculations
├── chart-access.js       # TradingView chart API
├── instrument-database.js# Instrument specifications
├── network-interceptor.js# API request interception
├── smart-dom-observer.js # DOM monitoring
└── storage-manager.js    # Chrome storage wrapper

content-scripts/          # Injected scripts
└── main-content-v4.js    # Main orchestrator

popup/                    # Configuration UI
├── popup.html
├── popup.css
└── popup.js

background/               # Background processes
└── service-worker.js
```

## Testing Checklist

Before submitting a PR, test:

- [ ] LONG limit order creates lines in correct positions
- [ ] SHORT limit order creates lines in correct positions
- [ ] LONG stop order works correctly
- [ ] SHORT stop order works correctly
- [ ] Market orders don't create lines
- [ ] Dragging order updates lines and values
- [ ] Multiple contracts show correct $ values
- [ ] Configuration changes apply correctly
- [ ] Extension reloads without errors
- [ ] No console errors during normal operation

## Adding New Instruments

To add support for a new futures contract:

1. Edit `lib/instrument-database.js`
2. Add entry to `INSTRUMENTS` object:

```javascript
'YOUR_SYMBOL': {
  name: 'Full Name',
  tickSize: 0.25,      // Minimum price increment
  tickValue: 5.00,     // Dollar value per tick
  exchange: 'CME'
}
```

3. Test with the new instrument
4. Update documentation

## Questions?

- Open an [Issue](https://github.com/cmacha2/topstepx-sl-tp-assistant/issues)
- Start a [Discussion](https://github.com/cmacha2/topstepx-sl-tp-assistant/discussions)

## Recognition

Contributors will be recognized in:
- README.md (Contributors section)
- Release notes
- Project documentation

Thank you for contributing! 🚀




