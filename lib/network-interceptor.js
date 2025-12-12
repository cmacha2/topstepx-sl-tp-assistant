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
      
      // Check order list response to see if our tracked order still exists
      if (this.isOrderListEndpoint(url) && method === 'GET' && responseText) {
        this.checkOrderListForCancellation(responseText);
      }
      
      if (this.isOrderEndpoint(url) && !this.isOrderListEndpoint(url)) {
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
   * Check order list response to detect if tracked order was cancelled/filled
   */
  checkOrderListForCancellation(responseText) {
    try {
      // Get stored order from localStorage
      const storedOrderStr = localStorage.getItem('topstep_sltp_orders');
      if (!storedOrderStr) return;
      
      const storedOrder = JSON.parse(storedOrderStr);
      if (!storedOrder || !storedOrder.entryPrice) return;
      
      // Parse the order list
      const orders = JSON.parse(responseText);
      if (!Array.isArray(orders)) return;
      
      // Look for active LIMIT orders with our entry price
      const hasMatchingOrder = orders.some(order => {
        // Check if it's a working limit order at our price
        const isWorking = order.status === 'Working' || order.status === 1;
        const isLimit = order.type === 1 || order.orderType === 'Limit';
        const priceMatches = Math.abs((order.limitPrice || order.price) - storedOrder.entryPrice) < 0.5;
        
        return isWorking && isLimit && priceMatches;
      });
      
      if (!hasMatchingOrder) {
        console.log('[TopstepX Network] ⚠️ Stored order not found in active orders - clearing');
        
        // Emit cancellation event
        this.notifyListeners('orderCancelled', { 
          reason: 'Order not found in active orders list',
          timestamp: Date.now() 
        });
        
        // Clear stored order data
        this.orderData = null;
      }
    } catch (error) {
      // Ignore errors during check
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
    // TopstepX cancel patterns
    return url.includes('/Order/cancel/') || 
           url.includes('/cancel') ||
           url.includes('cancelOrder') ||
           url.includes('CancelOrder');
  }
  
  /**
   * Check if URL is getting order list (to detect if orders were removed)
   */
  isOrderListEndpoint(url) {
    if (!url) return false;
    // Pattern: /Order?accountId=XXXXX (GET request for order list)
    return url.includes('userapi.topstepx.com/Order?accountId=') ||
           url.includes('userapi.topstepx.com/Order/?accountId=');
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

    if (data.limitPrice !== undefined && data.limitPrice !== null) {
      extractedData.price = data.limitPrice;
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
      const priceFields = ['price', 'limit', 'entryPrice'];
      for (const field of priceFields) {
        if (data[field] !== undefined) {
          extractedData.price = data[field];
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
      console.log('[TopstepX Network] Extracted order data:', extractedData);
      
      // Determine order type from limitPrice vs stopPrice
      let orderType = 'limit'; // default
      if (data.type !== undefined) {
        // TopstepX uses: 1 = limit, 2 = market, 3 = stop
        if (data.type === 2) orderType = 'market';
        else if (data.type === 3) orderType = 'stop';
      }
      
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
