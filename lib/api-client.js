// API Client - TopstepX API Integration
// Handles position brackets updates with debouncing

/**
 * API Client Class
 * Manages API calls to TopstepX endpoints with debouncing
 */
class APIClient {
  constructor() {
    this.baseURL = 'https://userapi.topstepx.com';
    this.debounceTimers = new Map();
    this.defaultDebounceMs = 1000; // 1 second debounce
    this.token = null;
    this.accountId = null;
  }

  /**
   * Initialize the API client
   * Retrieves token and account ID from localStorage
   */
  initialize() {
    try {
      // Get token from localStorage
      this.token = localStorage.getItem('token');
      
      // Get account ID from localStorage or other storage
      const accountIdStr = localStorage.getItem('topstep_account_id');
      if (accountIdStr) {
        this.accountId = parseInt(accountIdStr, 10);
      }
      
      if (!this.token) {
        console.warn('[APIClient] No auth token found in localStorage');
        return false;
      }
      
      console.log('[APIClient] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[APIClient] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Set account ID manually
   * @param {number} accountId - TopstepX account ID
   */
  setAccountId(accountId) {
    this.accountId = accountId;
    localStorage.setItem('topstep_account_id', accountId.toString());
    console.log('[APIClient] Account ID set:', accountId);
  }

  /**
   * Get current account ID
   * @returns {number|null}
   */
  getAccountId() {
    return this.accountId;
  }

  /**
   * Update position brackets (SL/TP) with debouncing
   * @param {number} slDollars - Stop Loss in dollars (risk)
   * @param {number} tpDollars - Take Profit in dollars (toMake)
   * @param {boolean} autoApply - Auto-apply to new positions
   * @param {number} debounceMs - Debounce delay in milliseconds
   * @returns {Promise<object>} - API response
   */
  updatePositionBrackets(slDollars, tpDollars, autoApply = true, debounceMs = null) {
    const delay = debounceMs !== null ? debounceMs : this.defaultDebounceMs;
    
    return new Promise((resolve, reject) => {
      // Clear existing timer for this operation
      const timerKey = 'updatePositionBrackets';
      if (this.debounceTimers.has(timerKey)) {
        clearTimeout(this.debounceTimers.get(timerKey));
      }

      // Set new timer
      const timer = setTimeout(async () => {
        this.debounceTimers.delete(timerKey);
        
        try {
          const result = await this._updatePositionBracketsImmediate(
            slDollars,
            tpDollars,
            autoApply
          );
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);

      this.debounceTimers.set(timerKey, timer);
      
      console.log(`[APIClient] Position brackets update debounced (${delay}ms)`);
    });
  }

  /**
   * Update position brackets immediately (internal use)
   * @private
   * @param {number} slDollars - Stop Loss in dollars (risk)
   * @param {number} tpDollars - Take Profit in dollars (toMake)
   * @param {boolean} autoApply - Auto-apply to new positions
   * @returns {Promise<object>} - API response
   */
  async _updatePositionBracketsImmediate(slDollars, tpDollars, autoApply) {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    if (!this.accountId) {
      throw new Error('No account ID set');
    }

    const endpoint = `${this.baseURL}/TradingAccount/setPositionBrackets`;
    
    const payload = {
      accountId: this.accountId,
      autoApply: autoApply,
      risk: Math.round(slDollars), // Round to nearest dollar
      toMake: Math.round(tpDollars) // Round to nearest dollar
    };

    console.log('[APIClient] Updating position brackets:', payload);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'authorization': `Bearer ${this.token}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('[APIClient] ✅ Position brackets updated successfully:', data);
      } else {
        console.error('[APIClient] ❌ API returned error:', data.errorMessage);
        throw new Error(data.errorMessage || 'Unknown error');
      }

      return data;
    } catch (error) {
      console.error('[APIClient] ❌ Failed to update position brackets:', error);
      throw error;
    }
  }

  /**
   * Cancel pending debounced requests
   * @param {string} operation - Operation to cancel (optional, cancels all if not provided)
   */
  cancelPendingRequests(operation = null) {
    if (operation) {
      if (this.debounceTimers.has(operation)) {
        clearTimeout(this.debounceTimers.get(operation));
        this.debounceTimers.delete(operation);
        console.log(`[APIClient] Cancelled pending request: ${operation}`);
      }
    } else {
      // Cancel all pending requests
      this.debounceTimers.forEach((timer, key) => {
        clearTimeout(timer);
        console.log(`[APIClient] Cancelled pending request: ${key}`);
      });
      this.debounceTimers.clear();
    }
  }

  /**
   * Check if API client is ready
   * @returns {boolean}
   */
  isReady() {
    return this.token !== null && this.accountId !== null;
  }

  /**
   * Get API status
   * @returns {object}
   */
  getStatus() {
    return {
      ready: this.isReady(),
      hasToken: this.token !== null,
      hasAccountId: this.accountId !== null,
      accountId: this.accountId,
      pendingRequests: this.debounceTimers.size
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment (for testing)
  module.exports = APIClient;
} else if (typeof window !== 'undefined') {
  // Browser environment - expose to window
  window.APIClient = APIClient;
}

