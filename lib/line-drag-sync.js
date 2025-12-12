/**
 * Line Drag Sync Module
 * Syncs SL/TP line positions with TopstepX platform when user drags them
 * 
 * Features:
 * - Detects when user drags SL/TP lines on chart
 * - Debounces API calls to avoid spam
 * - Automatically updates TopstepX position brackets
 * - Uses localStorage token for auth
 */

class LineDragSync {
  constructor() {
    this.apiBase = 'https://userapi.topstepx.com';
    this.accountId = null;
    this.token = null;
    this.enabled = false;
    this.debounceTimer = null;
    this.debounceDelay = 1000; // 1 second debounce
    this.lastSyncTime = null;
    
    console.log('[Line Drag Sync] 🔄 Module initialized');
  }

  /**
   * Enable/disable sync
   * @param {boolean} enabled 
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log('[Line Drag Sync] 🔄 Sync', enabled ? 'ENABLED' : 'DISABLED');
  }

  /**
   * Get auth token from localStorage
   * @returns {string|null}
   */
  getTokenFromStorage() {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Token might be stored as JSON string with quotes
        const cleanToken = token.replace(/^"(.*)"$/, '$1');
        console.log('[Line Drag Sync] 🔑 Token retrieved from localStorage');
        return cleanToken;
      }
    } catch (error) {
      console.error('[Line Drag Sync] ❌ Error reading token:', error);
    }
    return null;
  }

  /**
   * Set account ID (captured from network requests)
   * @param {number} accountId 
   */
  setAccountId(accountId) {
    this.accountId = accountId;
    console.log('[Line Drag Sync] 👤 Account ID set:', accountId);
  }

  /**
   * Sync position brackets with debouncing
   * @param {number} slPrice - Stop loss price
   * @param {number} tpPrice - Take profit price
   * @param {number} entryPrice - Entry price
   * @param {object} instrument - Instrument details
   * @param {number} contracts - Number of contracts
   */
  syncWithDebounce(slPrice, tpPrice, entryPrice, instrument, contracts) {
    if (!this.enabled) {
      console.log('[Line Drag Sync] ⏭️ Sync disabled, skipping');
      return;
    }

    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Set new timer
    this.debounceTimer = setTimeout(() => {
      this.syncPositionBrackets(slPrice, tpPrice, entryPrice, instrument, contracts);
    }, this.debounceDelay);

    console.log('[Line Drag Sync] ⏱️ Sync scheduled (debounced)');
  }

  /**
   * Calculate risk and profit in dollars
   * @param {number} slPrice - Stop loss price
   * @param {number} tpPrice - Take profit price
   * @param {number} entryPrice - Entry price
   * @param {object} instrument - Instrument details
   * @param {number} contracts - Number of contracts
   * @returns {object} { risk, toMake }
   */
  calculateRiskProfit(slPrice, tpPrice, entryPrice, instrument, contracts) {
    const tickSize = instrument?.tickSize || 0.25;
    const tickValue = instrument?.tickValue || 5;

    // Calculate ticks difference
    const slTicks = Math.abs((entryPrice - slPrice) / tickSize);
    const tpTicks = Math.abs((tpPrice - entryPrice) / tickSize);

    // Calculate dollar amounts
    const riskDollars = slTicks * tickValue * contracts;
    const profitDollars = tpTicks * tickValue * contracts;

    console.log('[Line Drag Sync] 💰 Risk/Profit calculated:');
    console.log('[Line Drag Sync] - Entry:', entryPrice);
    console.log('[Line Drag Sync] - SL:', slPrice, '→', slTicks, 'ticks');
    console.log('[Line Drag Sync] - TP:', tpPrice, '→', tpTicks, 'ticks');
    console.log('[Line Drag Sync] - Risk:', riskDollars);
    console.log('[Line Drag Sync] - Profit:', profitDollars);

    return {
      risk: Math.round(riskDollars),
      toMake: Math.round(profitDollars)
    };
  }

  /**
   * Sync position brackets with TopstepX
   * @param {number} slPrice - Stop loss price
   * @param {number} tpPrice - Take profit price
   * @param {number} entryPrice - Entry price
   * @param {object} instrument - Instrument details
   * @param {number} contracts - Number of contracts
   */
  async syncPositionBrackets(slPrice, tpPrice, entryPrice, instrument, contracts) {
    console.log('[Line Drag Sync] 🚀 Starting sync...');

    // Get fresh token
    this.token = this.getTokenFromStorage();

    // Validate
    if (!this.token) {
      console.error('[Line Drag Sync] ❌ No auth token available');
      this.dispatchEvent('sync-error', { error: 'No auth token' });
      return;
    }

    if (!this.accountId) {
      console.error('[Line Drag Sync] ❌ No account ID available');
      this.dispatchEvent('sync-error', { error: 'No account ID' });
      return;
    }

    // Calculate risk and profit
    const { risk, toMake } = this.calculateRiskProfit(
      slPrice, 
      tpPrice, 
      entryPrice, 
      instrument, 
      contracts
    );

    // Prepare request body
    const body = {
      accountId: this.accountId,
      autoApply: true, // Always auto-apply
      risk: risk,
      toMake: toMake
    };

    console.log('[Line Drag Sync] 📤 Sending to TopstepX:', body);

    try {
      const response = await fetch(`${this.apiBase}/TradingAccount/setPositionBrackets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json',
          'x-app-type': 'px-desktop'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[Line Drag Sync] ✅ Sync successful:', result);

      this.lastSyncTime = new Date();
      this.dispatchEvent('sync-success', { risk, toMake, timestamp: this.lastSyncTime });

    } catch (error) {
      console.error('[Line Drag Sync] ❌ Sync failed:', error);
      this.dispatchEvent('sync-error', { error: error.message });
    }
  }

  /**
   * Dispatch custom event
   * @param {string} eventName 
   * @param {object} detail 
   */
  dispatchEvent(eventName, detail) {
    window.dispatchEvent(new CustomEvent(`line-drag-sync-${eventName}`, { detail }));
  }
}

// Export as singleton
if (typeof window !== 'undefined') {
  window.lineDragSync = new LineDragSync();
  console.log('[Line Drag Sync] ✅ Global instance created');
}

