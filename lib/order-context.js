// Order Context - Order State Management and Persistence
// Manages order state across page reloads, navigation, and sessions

/**
 * Order Context Class
 * Handles order state persistence using localStorage
 */
class OrderContext {
  constructor() {
    this.storageKey = 'topstep_sltp_orders';
    this.currentOrder = null;
    this.listeners = new Set();
  }

  /**
   * Initialize the order context
   * Loads persisted orders from localStorage
   * @returns {object|null} - Restored order or null
   */
  initialize() {
    try {
      const restored = this.restoreOrder();
      if (restored) {
        console.log('[OrderContext] Restored order from storage:', restored);
        this.currentOrder = restored;
      } else {
        console.log('[OrderContext] No persisted order found');
      }
      return restored;
    } catch (error) {
      console.error('[OrderContext] Failed to initialize:', error);
      return null;
    }
  }

  /**
   * Create or update an order
   * @param {object} orderData - Order data
   * @returns {object} - The created/updated order
   * 
   * Order data structure:
   * {
   *   orderId: string,           // Unique order ID
   *   accountId: number,         // TopstepX account ID
   *   symbol: string,            // Instrument symbol (e.g., 'MNQZ25')
   *   side: string,              // 'long' or 'short'
   *   orderType: string,         // 'limit', 'stop', 'market'
   *   entryPrice: number,        // Order entry price
   *   quantity: number,          // Number of contracts
   *   slPrice: number,           // Stop Loss price
   *   tpPrice: number,           // Take Profit price
   *   slDollars: number,         // Stop Loss in dollars
   *   tpDollars: number,         // Take Profit in dollars
   *   status: string,            // 'pending', 'active', 'filled', 'cancelled'
   *   timestamp: number,         // Creation timestamp
   *   updatedAt: number          // Last update timestamp
   * }
   */
  setOrder(orderData) {
    const order = {
      ...orderData,
      updatedAt: Date.now()
    };

    // If no timestamp, add it
    if (!order.timestamp) {
      order.timestamp = Date.now();
    }

    this.currentOrder = order;
    this.persist();
    this.notifyListeners('order_updated', order);
    
    console.log('[OrderContext] Order set:', order);
    return order;
  }

  /**
   * Update specific fields of the current order
   * @param {object} updates - Partial order data to update
   * @returns {object|null} - Updated order or null if no current order
   */
  updateOrder(updates) {
    if (!this.currentOrder) {
      console.warn('[OrderContext] No current order to update');
      return null;
    }

    this.currentOrder = {
      ...this.currentOrder,
      ...updates,
      updatedAt: Date.now()
    };

    this.persist();
    this.notifyListeners('order_updated', this.currentOrder);
    
    console.log('[OrderContext] Order updated:', updates);
    return this.currentOrder;
  }

  /**
   * Update SL/TP prices
   * @param {number} slPrice - New Stop Loss price (optional)
   * @param {number} tpPrice - New Take Profit price (optional)
   * @param {number} slDollars - New Stop Loss in dollars (optional)
   * @param {number} tpDollars - New Take Profit in dollars (optional)
   * @returns {object|null} - Updated order or null
   */
  updateSLTP(slPrice = null, tpPrice = null, slDollars = null, tpDollars = null) {
    if (!this.currentOrder) {
      console.warn('[OrderContext] No current order to update SL/TP');
      return null;
    }

    const updates = { updatedAt: Date.now() };
    
    if (slPrice !== null) updates.slPrice = slPrice;
    if (tpPrice !== null) updates.tpPrice = tpPrice;
    if (slDollars !== null) updates.slDollars = slDollars;
    if (tpDollars !== null) updates.tpDollars = tpDollars;

    this.currentOrder = {
      ...this.currentOrder,
      ...updates
    };

    this.persist();
    this.notifyListeners('sltp_updated', updates);
    
    console.log('[OrderContext] SL/TP updated:', updates);
    return this.currentOrder;
  }

  /**
   * Get current order
   * @returns {object|null} - Current order or null
   */
  getOrder() {
    return this.currentOrder;
  }

  /**
   * Check if there's an active order
   * @returns {boolean}
   */
  hasOrder() {
    return this.currentOrder !== null && 
           this.currentOrder.status !== 'cancelled' && 
           this.currentOrder.status !== 'filled';
  }

  /**
   * Clear current order
   * @param {boolean} keepInStorage - Keep in storage for restore (default: false)
   */
  clearOrder(keepInStorage = false) {
    const order = this.currentOrder;
    this.currentOrder = null;
    
    if (!keepInStorage) {
      this.clearStorage();
    }
    
    this.notifyListeners('order_cleared', order);
    console.log('[OrderContext] Order cleared');
  }

  /**
   * Mark order as cancelled
   */
  cancelOrder() {
    if (this.currentOrder) {
      this.currentOrder.status = 'cancelled';
      this.currentOrder.updatedAt = Date.now();
      this.persist();
      this.notifyListeners('order_cancelled', this.currentOrder);
      console.log('[OrderContext] Order cancelled:', this.currentOrder.orderId);
    }
  }

  /**
   * Mark order as filled
   */
  fillOrder() {
    if (this.currentOrder) {
      this.currentOrder.status = 'filled';
      this.currentOrder.updatedAt = Date.now();
      this.persist();
      this.notifyListeners('order_filled', this.currentOrder);
      console.log('[OrderContext] Order filled:', this.currentOrder.orderId);
    }
  }

  /**
   * Persist current order to localStorage
   * @private
   */
  persist() {
    try {
      if (this.currentOrder) {
        localStorage.setItem(this.storageKey, JSON.stringify(this.currentOrder));
        console.log('[OrderContext] Order persisted to localStorage');
      } else {
        localStorage.removeItem(this.storageKey);
      }
    } catch (error) {
      console.error('[OrderContext] Failed to persist order:', error);
    }
  }

  /**
   * Restore order from localStorage
   * @returns {object|null} - Restored order or null
   */
  restoreOrder() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const order = JSON.parse(stored);
        
        // Check if order is still valid (e.g., not too old)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        const age = Date.now() - order.timestamp;
        
        if (age > maxAge) {
          console.log('[OrderContext] Stored order too old, clearing');
          this.clearStorage();
          return null;
        }
        
        return order;
      }
    } catch (error) {
      console.error('[OrderContext] Failed to restore order:', error);
    }
    return null;
  }

  /**
   * Clear storage
   * @private
   */
  clearStorage() {
    try {
      localStorage.removeItem(this.storageKey);
      console.log('[OrderContext] Storage cleared');
    } catch (error) {
      console.error('[OrderContext] Failed to clear storage:', error);
    }
  }

  /**
   * Subscribe to order changes
   * @param {function} callback - Callback function (eventType, data) => {}
   * @returns {function} - Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners
   * @private
   * @param {string} eventType - Event type
   * @param {*} data - Event data
   */
  notifyListeners(eventType, data) {
    this.listeners.forEach(callback => {
      try {
        callback(eventType, data);
      } catch (error) {
        console.error('[OrderContext] Listener error:', error);
      }
    });
  }

  /**
   * Get order history (future enhancement)
   * For now, only tracks current order
   * @returns {array} - Array of orders
   */
  getOrderHistory() {
    // Future: implement order history
    return this.currentOrder ? [this.currentOrder] : [];
  }

  /**
   * Export order data as JSON
   * @returns {string|null} - JSON string or null
   */
  exportOrder() {
    if (!this.currentOrder) {
      return null;
    }
    return JSON.stringify(this.currentOrder, null, 2);
  }

  /**
   * Import order data from JSON
   * @param {string} jsonString - JSON order data
   * @returns {object|null} - Imported order or null
   */
  importOrder(jsonString) {
    try {
      const order = JSON.parse(jsonString);
      return this.setOrder(order);
    } catch (error) {
      console.error('[OrderContext] Failed to import order:', error);
      return null;
    }
  }

  /**
   * Get context status
   * @returns {object} - Status information
   */
  getStatus() {
    return {
      hasOrder: this.hasOrder(),
      currentOrder: this.currentOrder,
      listeners: this.listeners.size,
      storageAvailable: typeof localStorage !== 'undefined'
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment (for testing)
  module.exports = OrderContext;
} else if (typeof window !== 'undefined') {
  // Browser environment - expose to window
  window.OrderContext = OrderContext;
}

