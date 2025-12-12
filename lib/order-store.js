/**
 * Order Store - In-Memory State Management with Persistence
 * 
 * Principles:
 * - In-memory: Fast, reactive state
 * - Event-based: Observable changes
 * - Deterministic: Predictable state transitions
 * - Rehydratable: Restore from storage
 * - Observable: Subscribe to changes
 * 
 * Inspired by TopstepX OrderStore pattern
 */

class OrderStore {
  constructor() {
    // In-memory state
    this.activeOrder = null;
    this.linesState = null;
    
    // Event listeners
    this.listeners = new Map();
    
    // Storage key
    this.storageKey = 'topstep_order_store';
    
    // TTL for stored data (24 hours)
    this.ttl = 24 * 60 * 60 * 1000;
    
    console.log('[OrderStore] 🏪 Store initialized');
  }

  /**
   * Upsert (Insert or Update) order and lines state
   * This is the primary way to save data
   * 
   * @param {object} orderData - Order information
   * @param {object} linesData - Lines state (SL/TP positions)
   */
  upsert(orderData, linesData) {
    console.log('[OrderStore] 📝 Upserting order:', orderData);
    console.log('[OrderStore] 📏 Lines state:', linesData);
    
    // Update in-memory state
    this.activeOrder = {
      ...orderData,
      timestamp: Date.now()
    };
    
    this.linesState = {
      ...linesData,
      timestamp: Date.now()
    };
    
    // Persist to storage
    this.persist();
    
    // Emit event
    this.emit('order-upserted', {
      order: this.activeOrder,
      lines: this.linesState
    });
    
    console.log('[OrderStore] ✅ Order upserted successfully');
  }

  /**
   * Remove order and clear lines
   * Called when order is cancelled or filled
   */
  remove() {
    console.log('[OrderStore] 🗑️ Removing order');
    
    const hadOrder = this.activeOrder !== null;
    
    // Clear in-memory state
    this.activeOrder = null;
    this.linesState = null;
    
    // Clear storage
    this.clearStorage();
    
    // Emit event only if there was an order
    if (hadOrder) {
      this.emit('order-removed');
      console.log('[OrderStore] ✅ Order removed successfully');
    }
  }

  /**
   * Clear all data (same as remove, but more explicit)
   */
  clear() {
    this.remove();
  }

  /**
   * Get current active order
   * @returns {object|null}
   */
  getActiveOrder() {
    return this.activeOrder;
  }

  /**
   * Get current lines state
   * @returns {object|null}
   */
  getLinesState() {
    return this.linesState;
  }

  /**
   * Check if there's an active order
   * @returns {boolean}
   */
  hasActiveOrder() {
    return this.activeOrder !== null;
  }

  /**
   * Persist current state to chrome.storage
   */
  async persist() {
    // Request storage save via bridge (MAIN → ISOLATED world)
    window.postMessage({
      type: 'TOPSTEP_SAVE_ORDER_STORE',
      data: {
        activeOrder: this.activeOrder,
        linesState: this.linesState,
        timestamp: Date.now()
      }
    }, '*');
    
    console.log('[OrderStore] 💾 Persist requested');
  }

  /**
   * Rehydrate state from storage
   * Called on extension initialization
   */
  async rehydrate() {
    console.log('[OrderStore] 💧 Rehydrating from storage...');
    
    return new Promise((resolve) => {
      // Request storage load via bridge
      window.postMessage({
        type: 'TOPSTEP_LOAD_ORDER_STORE'
      }, '*');
      
      // Listen for response
      const listener = (event) => {
        if (event.source !== window) return;
        
        if (event.data.type === 'TOPSTEP_ORDER_STORE_LOADED') {
          window.removeEventListener('message', listener);
          
          const stored = event.data.data;
          
          if (!stored || !stored.timestamp) {
            console.log('[OrderStore] 💧 No stored data found');
            resolve(false);
            return;
          }
          
          // Check TTL (24 hours)
          const age = Date.now() - stored.timestamp;
          if (age > this.ttl) {
            console.log('[OrderStore] ⏰ Stored data expired (age:', Math.round(age / 1000 / 60), 'minutes)');
            this.clearStorage();
            resolve(false);
            return;
          }
          
          // Restore in-memory state
          this.activeOrder = stored.activeOrder;
          this.linesState = stored.linesState;
          
          console.log('[OrderStore] ✅ Rehydrated successfully');
          console.log('[OrderStore] 📦 Active order:', this.activeOrder);
          console.log('[OrderStore] 📏 Lines state:', this.linesState);
          
          // Emit event
          this.emit('rehydrated', {
            order: this.activeOrder,
            lines: this.linesState
          });
          
          resolve(true);
        }
      };
      
      window.addEventListener('message', listener);
      
      // Timeout after 2 seconds
      setTimeout(() => {
        window.removeEventListener('message', listener);
        console.log('[OrderStore] ⏰ Rehydration timeout');
        resolve(false);
      }, 2000);
    });
  }

  /**
   * Clear storage (request via bridge)
   */
  clearStorage() {
    window.postMessage({
      type: 'TOPSTEP_CLEAR_ORDER_STORE'
    }, '*');
    
    console.log('[OrderStore] 🗑️ Storage clear requested');
  }

  /**
   * Subscribe to store events
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    
    console.log('[OrderStore] 👂 Listener registered for:', event);
  }

  /**
   * Unsubscribe from store events
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Emit event to all listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('[OrderStore] ❌ Error in listener:', error);
      }
    });
    
    console.log('[OrderStore] 📢 Event emitted:', event, '→', callbacks.length, 'listeners');
  }

  /**
   * Get store state snapshot (for debugging)
   */
  getSnapshot() {
    return {
      activeOrder: this.activeOrder,
      linesState: this.linesState,
      hasActiveOrder: this.hasActiveOrder(),
      listeners: Array.from(this.listeners.keys())
    };
  }

  /**
   * Log current state (debugging)
   */
  debug() {
    console.log('[OrderStore] 🔍 Current State:');
    console.log('[OrderStore] - Active Order:', this.activeOrder);
    console.log('[OrderStore] - Lines State:', this.linesState);
    console.log('[OrderStore] - Has Active Order:', this.hasActiveOrder());
    console.log('[OrderStore] - Listeners:', Array.from(this.listeners.keys()));
  }
}

// Export as singleton
if (typeof window !== 'undefined') {
  window.orderStore = new OrderStore();
  console.log('[OrderStore] ✅ Global singleton created');
  
  // Expose debug method globally
  window.debugOrderStore = () => window.orderStore.debug();
}

