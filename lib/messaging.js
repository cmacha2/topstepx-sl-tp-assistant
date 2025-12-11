// Messaging System - Cross-frame communication
// Handles secure message passing between parent page and TradingView iframe

/**
 * Message types for communication protocol
 */
const MESSAGE_TYPES = {
  // Parent → Iframe messages
  INIT_CONFIG: 'INIT_CONFIG',                 // Initial configuration and state
  UPDATE_CONFIG: 'UPDATE_CONFIG',              // Configuration changed
  DRAW_LINES: 'DRAW_LINES',                   // Draw SL/TP lines
  REMOVE_LINES: 'REMOVE_LINES',               // Remove all lines
  INSTRUMENT_CHANGED: 'INSTRUMENT_CHANGED',    // Different contract selected
  PRICE_CHANGED: 'PRICE_CHANGED',             // Entry price changed
  CONTRACTS_CHANGED: 'CONTRACTS_CHANGED',      // Manual contract qty change

  // Iframe → Parent messages
  IFRAME_READY: 'IFRAME_READY',               // Iframe loaded and ready
  LINE_DRAGGED: 'LINE_DRAGGED',               // User dragged a line
  UPDATE_CONTRACTS: 'UPDATE_CONTRACTS',        // Update contract field
  CALCULATION_COMPLETE: 'CALCULATION_COMPLETE', // Calculation results
  ERROR: 'ERROR',                              // Error occurred

  // Bidirectional
  PING: 'PING',                               // Health check
  PONG: 'PONG'                                // Response to ping
};

/**
 * Message Bridge Class
 * Handles secure cross-frame messaging
 */
class MessageBridge {
  /**
   * @param {boolean} isIframe - True if running in iframe context
   */
  constructor(isIframe = false) {
    this.isIframe = isIframe;
    this.listeners = new Map();
    this.messageQueue = [];
    this.ready = false;
    this.debugMode = false;

    this.init();
  }

  /**
   * Initialize message listener
   */
  init() {
    window.addEventListener('message', (event) => {
      this.handleMessage(event);
    });
  }

  /**
   * Handle incoming message
   * @param {MessageEvent} event - Message event
   */
  handleMessage(event) {
    // Security: Validate origin
    if (!this.isValidOrigin(event.origin)) {
      if (this.debugMode) {
        console.warn('Message from invalid origin:', event.origin);
      }
      return;
    }

    // Validate message structure
    if (!event.data || event.data.source !== 'topstep-sltp-extension') {
      return;
    }

    const { type, data, timestamp } = event.data;

    if (this.debugMode) {
      console.log('[MessageBridge] Received:', type, data);
    }

    // Route message to appropriate handlers
    if (this.listeners.has(type)) {
      const handlers = this.listeners.get(type);
      handlers.forEach(callback => {
        try {
          callback(data, event);
        } catch (error) {
          console.error(`Error in message handler for ${type}:`, error);
        }
      });
    }

    // Special handling for PONG messages
    if (type === MESSAGE_TYPES.PONG) {
      this.ready = true;
      this.flushMessageQueue();
    }
  }

  /**
   * Validate message origin
   * @param {string} origin - Message origin
   * @returns {boolean} - True if origin is valid
   */
  isValidOrigin(origin) {
    // Allow messages from same origin
    if (origin === window.location.origin) {
      return true;
    }

    // Allow TopstepX
    if (origin.includes('topstepx.com')) {
      return true;
    }

    // Allow TradingView
    if (origin.includes('tradingview.com')) {
      return true;
    }

    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return true;
    }

    return false;
  }

  /**
   * Register message handler
   * @param {string} messageType - Message type to listen for
   * @param {function} callback - Handler function (data, event) => {}
   */
  on(messageType, callback) {
    if (!this.listeners.has(messageType)) {
      this.listeners.set(messageType, []);
    }

    this.listeners.get(messageType).push(callback);

    if (this.debugMode) {
      console.log(`[MessageBridge] Registered handler for ${messageType}`);
    }
  }

  /**
   * Unregister message handler
   * @param {string} messageType - Message type
   * @param {function} callback - Handler function to remove
   */
  off(messageType, callback) {
    if (!this.listeners.has(messageType)) {
      return;
    }

    const handlers = this.listeners.get(messageType);
    const index = handlers.indexOf(callback);

    if (index !== -1) {
      handlers.splice(index, 1);
    }

    if (handlers.length === 0) {
      this.listeners.delete(messageType);
    }
  }

  /**
   * Send message to target window
   * @param {Window} targetWindow - Target window object
   * @param {string} messageType - Message type
   * @param {*} data - Message data
   */
  send(targetWindow, messageType, data) {
    if (!targetWindow) {
      console.error('Target window is null');
      return;
    }

    const message = {
      source: 'topstep-sltp-extension',
      type: messageType,
      data: data,
      timestamp: Date.now()
    };

    try {
      targetWindow.postMessage(message, '*');

      if (this.debugMode) {
        console.log('[MessageBridge] Sent:', messageType, data);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  /**
   * Send message to iframe
   * @param {HTMLIFrameElement} iframe - Iframe element
   * @param {string} messageType - Message type
   * @param {*} data - Message data
   */
  sendToIframe(iframe, messageType, data) {
    if (!iframe || !iframe.contentWindow) {
      console.error('Invalid iframe');
      return;
    }

    this.send(iframe.contentWindow, messageType, data);
  }

  /**
   * Send message to parent window
   * @param {string} messageType - Message type
   * @param {*} data - Message data
   */
  sendToParent(messageType, data) {
    if (window.parent === window) {
      if (this.debugMode) {
        console.warn('Already in parent window');
      }
      return;
    }

    this.send(window.parent, messageType, data);
  }

  /**
   * Queue message for later sending
   * Used when target is not ready yet
   * @param {Window} targetWindow - Target window
   * @param {string} messageType - Message type
   * @param {*} data - Message data
   */
  queueMessage(targetWindow, messageType, data) {
    this.messageQueue.push({ targetWindow, messageType, data });
  }

  /**
   * Flush queued messages
   */
  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const { targetWindow, messageType, data } = this.messageQueue.shift();
      this.send(targetWindow, messageType, data);
    }
  }

  /**
   * Send ping to check if target is ready
   * @param {Window} targetWindow - Target window
   */
  ping(targetWindow) {
    this.send(targetWindow, MESSAGE_TYPES.PING, {});
  }

  /**
   * Respond to ping with pong
   * @param {Window} targetWindow - Target window
   */
  pong(targetWindow) {
    this.send(targetWindow, MESSAGE_TYPES.PONG, {});
  }

  /**
   * Wait for iframe to be ready
   * @param {HTMLIFrameElement} iframe - Iframe element
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<boolean>} - True if ready, false if timeout
   */
  async waitForIframe(iframe, timeout = 5000) {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = timeout / 100;

      const checkReady = () => {
        if (this.ready) {
          resolve(true);
          return;
        }

        attempts++;
        if (attempts >= maxAttempts) {
          console.warn('Iframe ready timeout');
          resolve(false);
          return;
        }

        // Send ping
        this.ping(iframe.contentWindow);

        // Check again after delay
        setTimeout(checkReady, 100);
      };

      // Listen for pong
      this.on(MESSAGE_TYPES.PONG, () => {
        this.ready = true;
        resolve(true);
      });

      // Start checking
      checkReady();
    });
  }

  /**
   * Enable debug mode
   */
  enableDebug() {
    this.debugMode = true;
    console.log('[MessageBridge] Debug mode enabled');
  }

  /**
   * Disable debug mode
   */
  disableDebug() {
    this.debugMode = false;
  }

  /**
   * Clear all listeners
   */
  clearAllListeners() {
    this.listeners.clear();
  }

  /**
   * Get message type constants
   * @returns {object} - MESSAGE_TYPES object
   */
  static getMessageTypes() {
    return MESSAGE_TYPES;
  }
}

/**
 * Auto-responder for PING messages
 * Should be enabled in iframe to respond to pings from parent
 */
function enablePingAutoRespond() {
  window.addEventListener('message', (event) => {
    if (event.data &&
        event.data.source === 'topstep-sltp-extension' &&
        event.data.type === MESSAGE_TYPES.PING) {

      const pong = {
        source: 'topstep-sltp-extension',
        type: MESSAGE_TYPES.PONG,
        data: {},
        timestamp: Date.now()
      };

      event.source.postMessage(pong, '*');
    }
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment (for testing)
  module.exports = { MessageBridge, MESSAGE_TYPES, enablePingAutoRespond };
}
