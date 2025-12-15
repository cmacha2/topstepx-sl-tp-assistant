// Network Interceptor - Captures API calls to TopstepX backend
// This is more reliable than DOM parsing as it gets the actual data being sent

class NetworkInterceptor {
  constructor() {
    this.listeners = new Map();
    this.orderData = null;
    this.setupInterceptors();
  }

  /**
   * Setup fetch and XMLHttpRequest interceptors
   */
  setupInterceptors() {
    console.log('[TopstepX Network] Setting up network interceptors');

    // Intercept fetch API
    this.interceptFetch();

    // Intercept XMLHttpRequest
    this.interceptXHR();
  }

  /**
   * Intercept window.fetch calls
   */
  interceptFetch() {
    const originalFetch = window.fetch;
    const self = this;

    window.fetch = async function(...args) {
      const [url, options] = args;

      // Call original fetch
      const response = await originalFetch.apply(this, args);

      // Clone response so we can read it
      const clonedResponse = response.clone();

      // Process the request/response
      self.processRequest(url, options, clonedResponse);

      return response;
    };
  }

  /**
   * Intercept XMLHttpRequest
   */
  interceptXHR() {
    const self = this;
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      this._url = url;
      this._method = method;
      return originalOpen.apply(this, [method, url, ...rest]);
    };

    XMLHttpRequest.prototype.send = function(body) {
      this.addEventListener('load', function() {
        // Only process if responseType allows text access
        // (blob, arraybuffer, etc. will throw errors when accessing responseText)
        try {
          if (this.responseType === '' || this.responseType === 'text' || this.responseType === 'json') {
            const responseText = this.responseType === 'json' ? JSON.stringify(this.response) : this.responseText;
            self.processXHRResponse(this._url, this._method, body, responseText);
          }
        } catch (e) {
          // Ignore errors from non-text responses (blob, arraybuffer, etc.)
        }
      });
      return originalSend.apply(this, [body]);
    };
  }

  /**
   * Process fetch request/response
   */
  async processRequest(url, options, response) {
    try {
      const method = options?.method || 'GET';
      
      // Check for order cancellation first
      if (this.isOrderCancelEndpoint(url) && (method === 'DELETE' || method === 'POST')) {
        console.log('[TopstepX Network] 🗑️ Fetch order cancellation detected:', url);
        
        // Extract order ID from URL if possible
        const orderIdMatch = url.match(/\/id\/(\d+)/);
        const orderId = orderIdMatch ? orderIdMatch[1] : null;
        
        // Emit cancellation event
        this.notifyListeners('orderCancelled', { 
          orderId, 
          url,
          timestamp: Date.now() 
        });
        
        // Clear stored order data
        this.orderData = null;
        return;
      }
      
      // Look for order-related endpoints
      if (this.isOrderEndpoint(url)) {
        console.log('[TopstepX Network] ✅ Order endpoint detected:', url);

        // Try to parse request body - this is the most reliable source
        if (options && options.body) {
          const requestData = typeof options.body === 'string'
            ? JSON.parse(options.body)
            : options.body;

          console.log('[TopstepX Network] 📤 Request body:', requestData);
          this.extractOrderData(requestData);
        }

        // Try to parse response to confirm order was accepted
        try {
          const responseData = await response.json();
          console.log('[TopstepX Network] 📥 Response data:', responseData);
          if (responseData.result === 1 || responseData.success) {
            console.log('[TopstepX Network] ✅ Order confirmed by server');
          }
        } catch (e) {
          // Response parsing failed, that's ok
        }
      }
    } catch (error) {
      // Ignore JSON parse errors for non-JSON responses
      if (this.isOrderEndpoint(url)) {
        console.log('[TopstepX Network] ⚠️ Could not parse request/response');
      }
    }
  }

  /**
   * Process XMLHttpRequest response
   */
  processXHRResponse(url, method, requestBody, responseText) {
    try {
      // Check for order cancellation first
      if (this.isOrderCancelEndpoint(url) && (method === 'DELETE' || method === 'POST')) {
        console.log('[TopstepX Network] 🗑️ Order cancellation detected:', url);
        
        // Extract order ID from URL if possible
        const orderIdMatch = url.match(/\/id\/(\d+)/);
        const orderId = orderIdMatch ? orderIdMatch[1] : null;
        
        // Emit cancellation event
        this.notifyListeners('orderCancelled', { 
          orderId, 
          url,
          timestamp: Date.now() 
        });
        
        // Clear stored order data
        this.orderData = null;
        return;
      }
      
      if (this.isOrderEndpoint(url)) {
        console.log('[TopstepX Network] XHR Order endpoint detected:', url);

        if (requestBody) {
          const requestData = typeof requestBody === 'string'
            ? JSON.parse(requestBody)
            : requestBody;
          console.log('[TopstepX Network] XHR Order request:', requestData);
          this.extractOrderData(requestData);
        }

        if (responseText) {
          const responseData = JSON.parse(responseText);
          console.log('[TopstepX Network] XHR Order response:', responseData);
          // Only process response if it was successful
          if (responseData.result === 1 || responseData.success) {
            // Don't re-extract from response, request data is more reliable
            console.log('[TopstepX Network] ✅ Order confirmed by server');
          }
        }
      }
    } catch (error) {
      // Ignore parse errors
    }
  }

  /**
   * Check if URL is an order-related endpoint
   */
  isOrderEndpoint(url) {
    if (!url) return false;

    // TopstepX specific endpoint
    if (url.includes('userapi.topstepx.com/Order')) {
      return true;
    }

    // Generic order patterns as fallback
    const orderPatterns = [
      '/order',
      '/trade',
      '/submit',
      '/position',
      '/execution',
      'placeorder',
      'createorder',
      'modifyorder'
    ];

    const urlLower = url.toLowerCase();
    return orderPatterns.some(pattern => urlLower.includes(pattern));
  }

  /**
   * Check if URL is an order cancellation endpoint
   */
  isOrderCancelEndpoint(url) {
    if (!url) return false;
    return url.includes('/Order/cancel/') || url.includes('/cancel');
  }

  /**
   * Extract order data from API payload
   */
  extractOrderData(data) {
    if (!data) return;

    const extractedData = {};
    
    // Extract accountId and save to localStorage for API client
    if (data.accountId) {
      extractedData.accountId = data.accountId;
      // Save to localStorage for API client to use
      try {
        localStorage.setItem('topstep_account_id', data.accountId.toString());
        console.log('[TopstepX Network] 💾 Account ID saved:', data.accountId);
      } catch (e) {
        // Ignore storage errors
      }
    }

    // TopstepX specific format
    if (data.symbolId) {
      // Extract symbol from "F.US.MNQ" → "MNQ"
      const symbolMatch = data.symbolId.match(/F\.US\.([A-Z0-9]+)/);
      if (symbolMatch) {
        extractedData.symbol = symbolMatch[1]; // "MNQ"
      } else {
        extractedData.symbol = data.symbolId;
      }
    }

    // Get price based on order type
    // TopstepX uses: type 1 = limit (use limitPrice), type 2 = market (no price), type 3 = stop (use stopPrice)
    if (data.type === 3 && data.stopPrice !== undefined && data.stopPrice !== null) {
      // STOP order - use stopPrice
      extractedData.price = data.stopPrice;
      console.log('[TopstepX Network] 📍 STOP order - using stopPrice:', data.stopPrice);
    } else if (data.limitPrice !== undefined && data.limitPrice !== null) {
      // LIMIT order - use limitPrice
      extractedData.price = data.limitPrice;
      console.log('[TopstepX Network] 📍 LIMIT order - using limitPrice:', data.limitPrice);
    } else if (data.stopPrice !== undefined && data.stopPrice !== null) {
      // Fallback to stopPrice if no limitPrice
      extractedData.price = data.stopPrice;
      console.log('[TopstepX Network] 📍 Using stopPrice as fallback:', data.stopPrice);
    }

    if (data.positionSize !== undefined && data.positionSize !== null) {
      // positionSize: negative = SHORT, positive = LONG
      // Absolute value = quantity
      extractedData.quantity = Math.abs(data.positionSize);
      extractedData.side = data.positionSize < 0 ? 'short' : 'long';
    }

    // Generic fallback for other APIs
    if (!extractedData.symbol) {
      const symbolFields = ['symbol', 'instrument', 'contract', 'contractId'];
      for (const field of symbolFields) {
        if (data[field]) {
          extractedData.symbol = data[field];
          break;
        }
      }
    }

    if (!extractedData.price) {
      // Fallback: check other common price fields including stopPrice
      const priceFields = ['price', 'stopPrice', 'limitPrice', 'limit', 'entryPrice'];
      for (const field of priceFields) {
        if (data[field] !== undefined && data[field] !== null) {
          extractedData.price = data[field];
          console.log('[TopstepX Network] 📍 Using fallback price from', field, ':', data[field]);
          break;
        }
      }
    }

    if (!extractedData.quantity) {
      const qtyFields = ['quantity', 'size', 'contracts', 'qty', 'amount'];
      for (const field of qtyFields) {
        if (data[field] !== undefined) {
          extractedData.quantity = data[field];
          break;
        }
      }
    }

    if (!extractedData.side) {
      const sideFields = ['side', 'action', 'orderSide', 'direction'];
      for (const field of sideFields) {
        if (data[field]) {
          extractedData.side = data[field];
          break;
        }
      }
    }

    // If we found any order data, store it
    if (Object.keys(extractedData).length > 0) {
      // Determine order type from data.type field
      // TopstepX uses: 1 = limit, 2 = market, 3 = stop
      let orderType = 'limit'; // default
      if (data.type !== undefined) {
        if (data.type === 1) orderType = 'limit';
        else if (data.type === 2) orderType = 'market';
        else if (data.type === 3) orderType = 'stop';
      }
      
      // Log what we found
      const orderTypeName = orderType.toUpperCase();
      const sideName = extractedData.side ? extractedData.side.toUpperCase() : 'UNKNOWN';
      console.log(`[TopstepX Network] 📋 ${orderTypeName} ${sideName} order detected`);
      console.log('[TopstepX Network] Extracted order data:', extractedData);
      console.log('[TopstepX Network] Raw prices - limitPrice:', data.limitPrice, ', stopPrice:', data.stopPrice, ', type:', data.type);
      
      this.orderData = {
        ...this.orderData,
        ...extractedData,
        orderType: orderType,
        timestamp: Date.now()
      };

      // Notify listeners with correct event names
      // 'orderCreated' for new orders, 'orderData' for compatibility
      this.notifyListeners('orderCreated', this.orderData);
      this.notifyListeners('orderData', this.orderData);
      
      console.log('[TopstepX Network] ✅ Emitted orderCreated event:', this.orderData);
    }
  }

  /**
   * Subscribe to order data updates
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('[TopstepX Network] Error in listener:', error);
      }
    });
  }

  /**
   * Get current order data
   */
  getOrderData() {
    return this.orderData;
  }

  /**
   * Clear stored order data
   */
  clearOrderData() {
    this.orderData = null;
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NetworkInterceptor;
}
