// Smart DOM Observer - Monitors input changes as fallback
// Works in conjunction with Network Interceptor
// Network Interceptor = source of truth when order is placed
// DOM Observer = provides real-time updates while editing

class SmartDOMObserver {
  constructor(onDataChange) {
    this.onDataChange = onDataChange;
    this.currentData = {
      symbol: null,
      price: null,
      quantity: null,
      side: null  // Start as null, don't assume
    };
    this.pollInterval = null;
    this.lastSideChangeTime = 0;
    this.sideDebounceMs = 2000; // Don't report side changes more than once every 2 seconds
  }

  /**
   * Start monitoring DOM inputs
   */
  start() {
    console.log('[TopstepX DOM] Starting smart DOM observer');

    // Poll every 500ms to check for input changes
    this.pollInterval = setInterval(() => {
      this.checkInputs();
    }, 500);

    // Also check immediately
    this.checkInputs();
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Check all inputs for changes
   */
  checkInputs() {
    const newData = {
      symbol: this.findSymbol(),
      price: this.findPrice(),
      quantity: this.findQuantity(),
      side: this.findSide()
    };

    // Check if anything changed
    let hasChanges = false;
    let changedFields = [];

    if (newData.symbol && newData.symbol !== this.currentData.symbol) {
      console.log('[TopstepX DOM] Symbol changed:', newData.symbol);
      this.currentData.symbol = newData.symbol;
      hasChanges = true;
      changedFields.push('symbol');
    }

    if (newData.price && newData.price !== this.currentData.price) {
      console.log('[TopstepX DOM] Price changed:', newData.price);
      this.currentData.price = newData.price;
      hasChanges = true;
      changedFields.push('price');
    }

    if (newData.quantity && newData.quantity !== this.currentData.quantity) {
      console.log('[TopstepX DOM] Quantity changed:', newData.quantity);
      this.currentData.quantity = newData.quantity;
      hasChanges = true;
      changedFields.push('quantity');
    }

    // Side changes are handled more carefully - debounced and only when meaningful
    if (newData.side && newData.side !== this.currentData.side) {
      const now = Date.now();
      const timeSinceLastSideChange = now - this.lastSideChangeTime;
      
      // Only report side change if it's been a while since the last one
      // This prevents rapid toggling when user hovers over buttons
      if (timeSinceLastSideChange > this.sideDebounceMs) {
        console.log('[TopstepX DOM] Side changed:', newData.side);
        this.currentData.side = newData.side;
        this.lastSideChangeTime = now;
        hasChanges = true;
        changedFields.push('side');
      }
    }

    // Only notify if we have meaningful changes (not just side by itself)
    // Side-only changes are usually false positives from hovering
    const hasMeaningfulChanges = changedFields.includes('symbol') || 
                                  changedFields.includes('price') || 
                                  changedFields.includes('quantity');

    if (hasChanges && hasMeaningfulChanges && this.onDataChange) {
      this.onDataChange({
        symbol: this.currentData.symbol,
        price: this.currentData.price,
        quantity: this.currentData.quantity,
        side: this.currentData.side,
        source: 'dom',
        changedFields: changedFields
      });
    }
  }

  /**
   * Find symbol/instrument from inputs
   * Looks for inputs containing contract codes like MNQZ25, ESH26
   */
  findSymbol() {
    const inputs = document.querySelectorAll('input[type="text"]');

    for (const input of inputs) {
      const value = input.value || '';

      // Match full contract code (e.g., MNQZ25, ESH26)
      const contractMatch = value.match(/^(MNQ|MES|MYM|M2K|ES|NQ|YM|RTY)[A-Z]\d{2}$/);
      if (contractMatch) {
        // Extract base symbol
        const baseMatch = value.match(/^(MNQ|MES|MYM|M2K|ES|NQ|YM|RTY)/);
        return baseMatch ? baseMatch[1] : null;
      }
    }

    return null;
  }

  /**
   * Find price input
   * Looks for number input with large value (futures prices are typically > 1000)
   */
  findPrice() {
    const inputs = document.querySelectorAll('input[type="number"]');

    for (const input of inputs) {
      const value = parseFloat(input.value);

      // Futures prices are typically > 1000
      // And have decimal steps like 0.25, 0.10, or 1.0
      const step = input.getAttribute('step');

      if (!isNaN(value) && value > 1000 &&
          (step === '0.25' || step === '0.1' || step === '1' || step === '1.0')) {
        return value;
      }
    }

    return null;
  }

  /**
   * Find quantity/contracts input
   * Looks for small integer input (1-100 range typically)
   */
  findQuantity() {
    const inputs = document.querySelectorAll('input[type="number"]');

    for (const input of inputs) {
      const value = parseInt(input.value);
      const step = input.getAttribute('step');
      const min = input.getAttribute('min');

      // Contracts: integer step, min=1, reasonable value range
      if (!isNaN(value) &&
          step === '1' &&
          min === '1' &&
          value >= 1 &&
          value <= 1000) {
        return value;
      }
    }

    return null;
  }

  /**
   * Find side (long/short) from active order widget
   * Only looks at the actual order entry widget, not hover states
   */
  findSide() {
    // Look for the order widget that shows "Limit Sell" or "Limit Buy"
    // This is more specific than searching the entire page
    
    // Look for elements with specific classes that indicate an active order entry
    const orderWidgets = document.querySelectorAll('[class*="order"], [class*="Order"], [data-testid*="order"]');
    
    for (const widget of orderWidgets) {
      const text = widget.innerText || '';
      
      // Look for "Limit Sell" in the order widget
      if (text.includes('Limit Sell')) {
        return 'short';
      }
      
      // Look for "Limit Buy" in the order widget
      if (text.includes('Limit Buy')) {
        return 'long';
      }
    }
    
    // Fallback: look for position size indicator
    // In TopstepX, positionSize -1 = short, +1 = long
    // This appears in the trading widget
    const positionIndicators = document.querySelectorAll('[class*="position"], [class*="qty"]');
    for (const el of positionIndicators) {
      const text = el.innerText || '';
      if (text.includes('-') && !text.includes('$')) {
        return 'short';
      }
    }

    // Return null if we can't determine - don't guess
    return null;
  }

  /**
   * Set side externally (from network interceptor)
   * This takes precedence over DOM detection
   */
  setSide(side) {
    this.currentData.side = side;
    this.lastSideChangeTime = Date.now();
  }

  /**
   * Get current data snapshot
   */
  getData() {
    return { ...this.currentData };
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SmartDOMObserver;
} else if (typeof window !== 'undefined') {
  // Browser environment - expose to window
  window.SmartDOMObserver = SmartDOMObserver;
}
