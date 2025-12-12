/**
 * OrderStore - Persistent State Management for SL/TP Lines
 * 
 * Core Principles:
 * 1. In-Memory: Fast access, zero I/O latency for reads
 * 2. Event-Based: Observable pattern with explicit events
 * 3. Deterministic: Same inputs always produce same state
 * 4. Rehydratable: Survives page reloads via localStorage
 * 5. Observable: Multiple consumers can subscribe
 */

class OrderStore {
  constructor() {
    // In-memory state
    this.state = {
      activeOrder: null,      // { symbol, entryPrice, contracts, side, timestamp }
      linesState: null,       // { slPrice, tpPrice, entryPrice, instrument, config }
      timestamp: null
    };
    
    // Event listeners
    this.listeners = new Map();
    
    // Storage key
    this.storageKey = 'topstep_order_store';
    
    // TTL: 24 hours (stale data cleanup)
    this.ttl = 24 * 60 * 60 * 1000;
    
    console.log('[OrderStore] 🏪 Initialized');
  }
  
  /**
   * UPSERT - Add or update active order and lines state
   * @param {object} orderData - Order details { symbol, entryPrice, contracts, side }
   * @param {object} linesData - Lines state { slPrice, tpPrice, instrument, config }
   */
  upsert(orderData, linesData) {
    console.log('[OrderStore] 💾 UPSERT:', { orderData, linesData });
    
    // Validate inputs
    if (!orderData || !linesData) {
      console.error('[OrderStore] ❌ Invalid upsert data');
      return;
    }
    
    // Update in-memory state (deterministic)
    this.state = {
      activeOrder: {
        ...orderData,
        timestamp: Date.now()
      },
      linesState: {
        ...linesData,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    };
    
    console.log('[OrderStore] ✅ State updated:', this.state);
    
    // Persist to storage
    this.persist();
    
    // Emit event (observable pattern)
    this.emit('order-upserted', this.state);
  }
  
  /**
   * REMOVE - Delete active order and lines
   */
  remove() {
    console.log('[OrderStore] 🗑️ REMOVE');
    
    // Clear in-memory state
    this.state = {
      activeOrder: null,
      linesState: null,
      timestamp: Date.now()
    };
    
    // Clear storage
    this.clearStorage();
    
    // Emit event
    this.emit('order-removed', this.state);
  }
  
  /**
   * CLEAR - Alias for remove (semantic clarity)
   */
  clear() {
    this.remove();
  }
  
  /**
   * GET - Active order
   * @returns {object|null}
   */
  getActiveOrder() {
    return this.state.activeOrder;
  }
  
  /**
   * GET - Lines state
   * @returns {object|null}
   */
  getLinesState() {
    return this.state.linesState;
  }
  
  /**
   * HAS - Check if active order exists
   * @returns {boolean}
   */
  hasActiveOrder() {
    return this.state.activeOrder !== null && this.state.linesState !== null;
  }
  
  /**
   * GET - Full state snapshot (debugging)
   * @returns {object}
   */
  getSnapshot() {
    return { ...this.state };
  }
  
  /**
   * PERSIST - Save state to storage (automatic)
   */
  persist() {
    // Request storage save via bridge (MAIN → ISOLATED world)
    window.postMessage({
      type: 'TOPSTEP_SAVE_ORDER_STORE',
      data: this.state
    }, '*');
    
    console.log('[OrderStore] 💾 Persist request sent to bridge');
  }
  
  /**
   * REHYDRATE - Restore state from storage (on page load)
   * @returns {Promise<boolean>} - True if rehydrated, false if no data
   */
  async rehydrate() {
    console.log('[OrderStore] 💧 Rehydrating from storage...');
    
    return new Promise((resolve) => {
      // Request load from storage via bridge
      const messageHandler = (event) => {
        if (event.source !== window) return;
        
        if (event.data.type === 'TOPSTEP_ORDER_STORE_DATA') {
          window.removeEventListener('message', messageHandler);
          
          const savedState = event.data.data;
          
          if (!savedState || !savedState.activeOrder || !savedState.linesState) {
            console.log('[OrderStore] 💧 No saved state found');
            resolve(false);
            return;
          }
          
          // Check TTL (24 hours)
          const age = Date.now() - savedState.timestamp;
          if (age > this.ttl) {
            console.log('[OrderStore] ⏰ Saved state expired (TTL: 24h)');
            this.clearStorage();
            resolve(false);
            return;
          }
          
          // Restore in-memory state (deterministic)
          this.state = savedState;
          console.log('[OrderStore] ✅ State rehydrated:', this.state);
          
          // Emit event
          this.emit('rehydrated', this.state);
          
          resolve(true);
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      // Request data from bridge
      window.postMessage({
        type: 'TOPSTEP_LOAD_ORDER_STORE'
      }, '*');
      
      // Timeout after 3 seconds
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        console.log('[OrderStore] ⏰ Rehydration timeout');
        resolve(false);
      }, 3000);
    });
  }
  
  /**
   * CLEAR STORAGE - Remove from persistent storage
   */
  clearStorage() {
    window.postMessage({
      type: 'TOPSTEP_CLEAR_ORDER_STORE'
    }, '*');
    
    console.log('[OrderStore] 🗑️ Storage clear request sent');
  }
  
  /**
   * SUBSCRIBE - Add event listener (observable pattern)
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    console.log('[OrderStore] 👂 Subscribed to:', event);
  }
  
  /**
   * UNSUBSCRIBE - Remove event listener
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
      console.log('[OrderStore] 👋 Unsubscribed from:', event);
    }
  }
  
  /**
   * EMIT - Trigger event (internal)
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data) {
    if (!this.listeners.has(event)) return;
    
    console.log('[OrderStore] 📢 Emitting:', event, data);
    
    const callbacks = this.listeners.get(event);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('[OrderStore] ❌ Listener error:', error);
      }
    });
  }
  
  /**
   * DEBUG - Print current state
   */
  debug() {
    console.log('[OrderStore] 🔍 DEBUG STATE:');
    console.log('- Active Order:', this.state.activeOrder);
    console.log('- Lines State:', this.state.linesState);
    console.log('- Timestamp:', this.state.timestamp);
    console.log('- Age:', this.state.timestamp ? `${Math.floor((Date.now() - this.state.timestamp) / 1000)}s` : 'N/A');
    console.log('- Listeners:', Array.from(this.listeners.keys()));
  }
}

// Export as singleton
if (typeof window !== 'undefined') {
  window.orderStore = new OrderStore();
  console.log('[OrderStore] ✅ Global instance created: window.orderStore');
}

// Node.js export (for testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OrderStore;
}

