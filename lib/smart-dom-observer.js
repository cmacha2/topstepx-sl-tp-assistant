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
      side: 'long'
    };
    this.pollInterval = null;
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

    if (newData.symbol && newData.symbol !== this.currentData.symbol) {
      console.log('[TopstepX DOM] Symbol changed:', newData.symbol);
      this.currentData.symbol = newData.symbol;
      hasChanges = true;
    }

    if (newData.price && newData.price !== this.currentData.price) {
      console.log('[TopstepX DOM] Price changed:', newData.price);
      this.currentData.price = newData.price;
      hasChanges = true;
    }

    if (newData.quantity && newData.quantity !== this.currentData.quantity) {
      console.log('[TopstepX DOM] Quantity changed:', newData.quantity);
      this.currentData.quantity = newData.quantity;
      hasChanges = true;
    }

    // Only update side if we found a definitive value (not null)
    if (newData.side !== null && newData.side !== this.currentData.side) {
      console.log('[TopstepX DOM] Side changed:', newData.side);
      this.currentData.side = newData.side;
      hasChanges = true;
    }

    // Notify if changes detected
    if (hasChanges && this.onDataChange) {
      this.onDataChange({
        symbol: this.currentData.symbol,
        price: this.currentData.price,
        quantity: this.currentData.quantity,
        side: this.currentData.side,
        source: 'dom'
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
   * Find side (long/short) from order ticket UI
   * Looks for active order button or specific UI elements
   */
  findSide() {
    // Strategy 1: Look for the active order button in the order ticket
    // TopstepX shows "Limit Sell" or "Limit Buy" as a button/label in the order ticket
    const orderTicket = document.querySelector('[class*="order"], [class*="ticket"], [class*="trade"]');
    
    if (orderTicket) {
      const ticketText = orderTicket.innerText;
      if (ticketText.includes('Limit Sell') || ticketText.includes('Sell')) {
      return 'short';
    }
      if (ticketText.includes('Limit Buy') || ticketText.includes('Buy')) {
        return 'long';
      }
    }
    
    // Strategy 2: Look for buttons with specific text
    const buttons = document.querySelectorAll('button, [role="button"]');
    for (const button of buttons) {
      const text = button.innerText || button.textContent || '';
      // Look for active/selected sell button
      if ((text.includes('Sell') || text.includes('Limit Sell')) && 
          (button.classList.contains('active') || button.classList.contains('selected') || 
           button.getAttribute('aria-pressed') === 'true')) {
        return 'short';
      }
      // Look for active/selected buy button
      if ((text.includes('Buy') || text.includes('Limit Buy')) && 
          (button.classList.contains('active') || button.classList.contains('selected') ||
           button.getAttribute('aria-pressed') === 'true')) {
      return 'long';
    }
    }

    // Strategy 3: Look for the floating order label (like in your screenshot "Limit Sell -1")
    const orderLabels = document.querySelectorAll('[class*="label"], [class*="order-type"], span, div');
    for (const label of orderLabels) {
      const text = label.innerText || '';
      // Be very specific - must have "Limit Sell" as exact text pattern
      if (/Limit\s+Sell/i.test(text) && text.length < 50) {
        return 'short';
      }
      if (/Limit\s+Buy/i.test(text) && text.length < 50) {
    return 'long';
      }
    }

    // Don't change current side if we can't determine - return null
    return null;
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
