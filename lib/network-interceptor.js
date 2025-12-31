// Network Interceptor - Captures API calls to TopstepX backend
// This is more reliable than DOM parsing as it gets the actual data being sent

class NetworkInterceptor {
  constructor() {
    this.listeners = new Map();
    this.orderData = null;
    this.lastOrderId = null;
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
      const xhr = this;
      
      this.addEventListener('load', function() {
        // Only try to read responseText if responseType allows it
        let responseText = null;
        try {
          if (xhr.responseType === '' || xhr.responseType === 'text') {
            responseText = xhr.responseText;
          } else if (xhr.responseType === 'json') {
            responseText = JSON.stringify(xhr.response);
          }
        } catch (e) {
          // Ignore errors reading response
        }
        
        self.processXHRResponse(xhr._url, xhr._method, body, responseText);
      });
      
      return originalSend.apply(this, [body]);
    };
  }

  /**
   * Process fetch request/response
   */
  async processRequest(url, options, response) {
    try {
      // Look for order creation endpoints
      if (this.isOrderEndpoint(url)) {
        console.log('[TopstepX Network] ✅ Order endpoint detected:', url);

        let requestData = null;
        
        // Try to parse request body
        if (options && options.body) {
          requestData = typeof options.body === 'string'
            ? JSON.parse(options.body)
            : options.body;

          console.log('[TopstepX Network] 📤 Request body:', requestData);
        }

        // Try to parse response
        const responseData = await response.json();
        console.log('[TopstepX Network] 📥 Response data:', responseData);
        
        // Process the order
        this.processOrderData(requestData, responseData, url);
      }
      
      // Check for order edit (drag to modify price)
      if (this.isOrderEditEndpoint(url)) {
        console.log('[TopstepX Network] ✏️ Order edit endpoint detected:', url);
        this.processOrderEdit(url, options);
      }
      
      // Check for order cancellation
      if (this.isOrderCancelEndpoint(url)) {
        console.log('[TopstepX Network] ❌ Order cancel endpoint detected:', url);
        this.emit('orderCancelled', { url, timestamp: Date.now() });
      }
    } catch (error) {
      // Ignore JSON parse errors for non-JSON responses
      if (this.isOrderEndpoint(url)) {
        console.log('[TopstepX Network] ⚠️ Could not parse response as JSON');
      }
    }
  }

  /**
   * Process XMLHttpRequest response
   */
  processXHRResponse(url, method, requestBody, responseText) {
    try {
      if (this.isOrderEndpoint(url)) {
        console.log('[TopstepX Network] XHR Order endpoint detected:', url);

        let requestData = null;
        let responseData = null;
        
        if (requestBody) {
          requestData = typeof requestBody === 'string'
            ? JSON.parse(requestBody)
            : requestBody;
          console.log('[TopstepX Network] XHR Order request:', requestData);
        }

        if (responseText) {
          responseData = JSON.parse(responseText);
          console.log('[TopstepX Network] XHR Order response:', responseData);
        }
        
        // Process the order
        this.processOrderData(requestData, responseData, url);
      }
      
      // Check for order edit (drag to modify price)
      if (this.isOrderEditEndpoint(url)) {
        console.log('[TopstepX Network] ✏️ XHR Order edit detected:', url);
        this.processOrderEdit(url, { method });
      }
      
      // Check for order cancellation
      if (this.isOrderCancelEndpoint(url)) {
        console.log('[TopstepX Network] ❌ XHR Order cancel detected');
        this.emit('orderCancelled', { url, timestamp: Date.now() });
      }
    } catch (error) {
      // Ignore parse errors
    }
  }

  /**
   * Check if URL is an order creation endpoint
   */
  isOrderEndpoint(url) {
    if (!url) return false;

    // TopstepX specific endpoint for creating orders (POST to /Order)
    // Exclude edit and cancel endpoints
    if (url.includes('userapi.topstepx.com/Order') && 
        !url.includes('cancel') && 
        !url.includes('/edit/')) {
      return true;
    }

    return false;
  }
  
  /**
   * Check if URL is an order edit endpoint
   */
  isOrderEditEndpoint(url) {
    if (!url) return false;
    
    // TopstepX order edit: /Order/edit/stopLimit/{orderId}?limitPrice=xxx
    return url.includes('userapi.topstepx.com/Order/edit/');
  }
  
  /**
   * Check if URL is an order cancellation endpoint
   */
  isOrderCancelEndpoint(url) {
    if (!url) return false;
    
    const cancelPatterns = [
      '/Order/cancel',
      '/order/cancel',
      'cancelOrder',
      'deleteOrder'
    ];
    
    const urlLower = url.toLowerCase();
    return cancelPatterns.some(pattern => urlLower.includes(pattern.toLowerCase()));
  }

  /**
   * Process order edit (when user drags order line to new price)
   * URL format: /Order/edit/stopLimit/{orderId}?limitPrice=xxx
   */
  processOrderEdit(url, options) {
    try {
      // Extract the new price from URL query parameter
      const urlObj = new URL(url);
      const newLimitPrice = urlObj.searchParams.get('limitPrice');
      const newStopPrice = urlObj.searchParams.get('stopPrice');
      
      // Extract orderId from URL path
      const pathMatch = url.match(/\/Order\/edit\/[^\/]+\/(\d+)/);
      const orderId = pathMatch ? pathMatch[1] : null;
      
      const newPrice = newLimitPrice ? parseFloat(newLimitPrice) : 
                       newStopPrice ? parseFloat(newStopPrice) : null;
      
      if (newPrice) {
        console.log('[TopstepX Network] ✏️ Order price edited:', {
          orderId: orderId,
          newPrice: newPrice,
          type: newLimitPrice ? 'limit' : 'stop'
        });
        
        // Emit orderModified event with the new price
        this.emit('orderModified', {
          orderId: orderId,
          price: newPrice,
          orderType: newLimitPrice ? 'limit' : 'stop',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('[TopstepX Network] ⚠️ Error processing order edit:', error);
    }
  }

  /**
   * Process order data from request and response
   */
  processOrderData(requestData, responseData, url) {
    if (!requestData) return;

    const extractedData = {};
    
    // Extract account ID
    if (requestData.accountId) {
      extractedData.accountId = requestData.accountId;
    }

    // Extract symbol from "F.US.MNQ" → "MNQ"
    if (requestData.symbolId) {
      const symbolMatch = requestData.symbolId.match(/F\.US\.([A-Z0-9]+)/);
      if (symbolMatch) {
        extractedData.symbol = symbolMatch[1]; // "MNQ"
      } else {
        extractedData.symbol = requestData.symbolId;
      }
    }

    // Extract price (limitPrice for limit orders, stopPrice for stop orders)
    if (requestData.limitPrice !== undefined && requestData.limitPrice !== null) {
      extractedData.price = requestData.limitPrice;
      extractedData.orderType = 'limit';
    } else if (requestData.stopPrice !== undefined && requestData.stopPrice !== null) {
      extractedData.price = requestData.stopPrice;
      extractedData.orderType = 'stop';
    } else {
      // Market order has no price
      extractedData.orderType = 'market';
    }

    // Extract quantity and side from positionSize
    // positionSize: negative = SHORT, positive = LONG
    if (requestData.positionSize !== undefined && requestData.positionSize !== null) {
      extractedData.quantity = Math.abs(requestData.positionSize);
      extractedData.side = requestData.positionSize < 0 ? 'short' : 'long';
    }
    
    // Extract order ID from response
    if (responseData && responseData.orderId) {
      extractedData.orderId = responseData.orderId;
    }

    // Only emit if we have meaningful data
    if (extractedData.symbol && extractedData.price) {
      console.log('[TopstepX Network] ✅ Order data extracted:', extractedData);
      
      this.orderData = {
        ...extractedData,
        timestamp: Date.now()
      };

      // Determine event type
      const isNewOrder = !this.lastOrderId || this.lastOrderId !== extractedData.orderId;
      
      if (isNewOrder) {
        this.lastOrderId = extractedData.orderId;
        // Emit orderCreated event (what main-content-v4.js listens for)
        this.emit('orderCreated', this.orderData);
      } else {
        // Emit orderModified event
        this.emit('orderModified', this.orderData);
      }
      
      // Also emit generic orderData for backwards compatibility
      this.emit('orderData', this.orderData);
    }
  }

  /**
   * Subscribe to events
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Emit event to all listeners
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    console.log(`[TopstepX Network] 📡 Emitting '${event}' to ${callbacks.length} listeners`);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('[TopstepX Network] Error in listener:', error);
      }
    });
  }

  /**
   * Alias for emit (backwards compatibility)
   */
  notifyListeners(event, data) {
    this.emit(event, data);
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
    this.lastOrderId = null;
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NetworkInterceptor;
} else if (typeof window !== 'undefined') {
  window.NetworkInterceptor = NetworkInterceptor;
}
