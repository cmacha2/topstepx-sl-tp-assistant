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
        self.processXHRResponse(this._url, this._method, body, this.responseText);
      });
      return originalSend.apply(this, [body]);
    };
  }

  /**
   * Process fetch request/response
   */
  async processRequest(url, options, response) {
    try {
      // Look for order-related endpoints
      if (this.isOrderEndpoint(url)) {
        console.log('[TopstepX Network] ✅ Order endpoint detected:', url);

        // Try to parse request body
        if (options && options.body) {
          const requestData = typeof options.body === 'string'
            ? JSON.parse(options.body)
            : options.body;

          console.log('[TopstepX Network] 📤 Request body:', requestData);
          this.extractOrderData(requestData);
        }

        // Try to parse response
        const responseData = await response.json();
        console.log('[TopstepX Network] 📥 Response data:', responseData);
        this.extractOrderData(responseData);
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
          this.extractOrderData(responseData);
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
   * Extract order data from API payload
   */
  extractOrderData(data) {
    if (!data) return;

    const extractedData = {};

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
      this.orderData = {
        ...this.orderData,
        ...extractedData,
        timestamp: Date.now()
      };

      // Notify listeners
      this.notifyListeners('orderData', this.orderData);
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
