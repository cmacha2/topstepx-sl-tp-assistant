// Network Interceptor - Captures API calls to TopstepX backend
// This is more reliable than DOM parsing as it gets the actual data being sent

class NetworkInterceptor {
  constructor() {
    this.listeners = new Map();
    this.orderData = null;
    this.activeOrderId = null;
    this.processedRequests = new Set(); // Track processed requests to avoid duplicates
    this.setupInterceptors();
  }

  /**
   * Setup fetch and XMLHttpRequest interceptors
   */
  setupInterceptors() {
    console.log('[TopstepX Network] 🔧 Setting up network interceptors in MAIN world');
    console.log('[TopstepX Network] 📍 Running in:', typeof window !== 'undefined' ? 'MAIN' : 'ISOLATED');
    console.log('[TopstepX Network] 🪟 window.fetch available:', typeof window.fetch === 'function');

    // Intercept fetch API
    this.interceptFetch();

    // Intercept XMLHttpRequest
    this.interceptXHR();
    
    console.log('[TopstepX Network] ✅ All interceptors installed successfully');
  }

  /**
   * Intercept window.fetch calls
   */
  interceptFetch() {
    const originalFetch = window.fetch;
    const self = this;

    window.fetch = async function(...args) {
      const [url, options] = args;
      
      // Log all fetch calls for debugging
      if (url && typeof url === 'string') {
        console.log('[TopstepX Network] 🌐 Fetch call to:', url);
        if (options?.method) {
          console.log('[TopstepX Network] 📤 Method:', options.method);
        }
        if (options?.body) {
          console.log('[TopstepX Network] 📦 Body:', options.body);
        }
      }

      // Process BEFORE the request for POST (order creation)
      if (url && typeof url === 'string' && url.includes('userapi.topstepx.com/Order')) {
        self.processOrderRequest(url, options);
      }

      // Call original fetch
      const response = await originalFetch.apply(this, args);

      // Clone response so we can read it
      const clonedResponse = response.clone();

      // Process the request/response
      await self.processRequest(url, options, clonedResponse);

      return response;
    };
    
    console.log('[TopstepX Network] ✅ Fetch interceptor installed');
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
      
      // Log XHR open for order endpoints
      if (url && url.includes('userapi.topstepx.com/Order')) {
        console.log('[TopstepX Network] 🔷 XHR.open():', method, url);
      }
      
      return originalOpen.apply(this, [method, url, ...rest]);
    };

    XMLHttpRequest.prototype.send = function(body) {
      // Log XHR send for order endpoints
      if (this._url && this._url.includes('userapi.topstepx.com/Order')) {
        console.log('[TopstepX Network] 🔶 XHR.send():', this._method, this._url);
        if (body) {
          console.log('[TopstepX Network] 📦 XHR Body:', body);
        }
      }
      
      this.addEventListener('load', function() {
        // Only process if responseType allows reading as text
        let responseText = null;
        try {
          if (this.responseType === '' || this.responseType === 'text') {
            responseText = this.responseText;
          } else if (this.responseType === 'json') {
            responseText = JSON.stringify(this.response);
          }
        } catch (e) {
          // Ignore - responseText not accessible
        }
        
        if (responseText) {
          self.processXHRResponse(this._url, this._method, body, responseText);
        }
      });
      return originalSend.apply(this, [body]);
    };
    
    console.log('[TopstepX Network] ✅ XHR interceptor installed');
  }

  /**
   * Process order request (before it's sent)
   */
  processOrderRequest(url, options) {
    try {
      // POST = Create order
      if (options?.method === 'POST' && options.body) {
        const requestData = typeof options.body === 'string'
          ? JSON.parse(options.body)
          : options.body;
        
        // Map type field to readable name
        const typeMap = {
          1: 'LIMIT',
          2: 'MARKET',
          4: 'STOP'
        };
        const orderType = typeMap[requestData.type] || 'UNKNOWN';
        
        // Determine side from positionSize
        const side = requestData.positionSize > 0 ? 'LONG/BUY' : 'SHORT/SELL';
        
        console.log('[TopstepX Network] 🆕 CREATE ORDER detected:', {
          type: orderType,
          side: side,
          price: requestData.limitPrice || requestData.stopPrice || 'market',
          symbol: requestData.symbolId,
          contracts: Math.abs(requestData.positionSize)
        });
        console.log('[TopstepX Network] 📋 Full order data:', requestData);
        
        this.extractOrderData(requestData, 'create');
      }
      
      // PATCH = Modify order
      else if (options?.method === 'PATCH') {
        // Extract limitPrice from URL: /Order/edit/stopLimit/2074304743?limitPrice=25697.5
        let urlMatch = url.match(/\/Order\/edit\/stopLimit\/(\d+)\?limitPrice=([\d.]+)/);
        
        if (urlMatch) {
          const orderId = urlMatch[1];
          const limitPrice = parseFloat(urlMatch[2]);
          
          console.log('[TopstepX Network] ✏️ MODIFY LIMIT ORDER detected:', {
            orderId,
            limitPrice
          });
          
          // Update order data with new price
          this.extractOrderData({ 
            limitPrice,
            orderId,
            type: 'modify'
          }, 'modify');
          return;
        }
        
        // Also check for stopPrice modifications: /Order/edit/stopLimit/ID?stopPrice=PRICE
        urlMatch = url.match(/\/Order\/edit\/stopLimit\/(\d+)\?stopPrice=([\d.]+)/);
        
        if (urlMatch) {
          const orderId = urlMatch[1];
          const stopPrice = parseFloat(urlMatch[2]);
          
          console.log('[TopstepX Network] ✏️ MODIFY STOP ORDER detected:', {
            orderId,
            stopPrice
          });
          
          // Update order data with new price
          this.extractOrderData({ 
            stopPrice,
            orderId,
            type: 'modify'
          }, 'modify');
        }
      }
    } catch (error) {
      console.error('[TopstepX Network] ❌ Error processing order request:', error);
    }
  }

  /**
   * Process fetch request/response
   */
  async processRequest(url, options, response) {
    try {
      // Look for order-related endpoints
      if (this.isOrderEndpoint(url)) {
        console.log('[TopstepX Network] ✅ Order endpoint detected:', url);

        // Try to parse response
        try {
          const responseData = await response.json();
          console.log('[TopstepX Network] 📥 Response data:', responseData);
          
          // Store order ID if present
          if (responseData.orderId) {
            this.activeOrderId = responseData.orderId;
            console.log('[TopstepX Network] 📝 Active order ID:', this.activeOrderId);
          }
        } catch (jsonError) {
          // Not JSON or empty response
        }
      }
    } catch (error) {
      // Ignore errors
      if (this.isOrderEndpoint(url)) {
        console.log('[TopstepX Network] ⚠️ Could not parse response');
      }
    }
  }

  /**
   * Process XMLHttpRequest response
   */
  processXHRResponse(url, method, requestBody, responseText) {
    try {
      console.log('[TopstepX Network] 🔍 XHR detected:', method, url);
      
      if (this.isOrderEndpoint(url)) {
        console.log('[TopstepX Network] ✅ XHR Order endpoint detected:', url);
        console.log('[TopstepX Network] 📤 XHR Method:', method);

        // Process request body for POST
        if (requestBody && method === 'POST') {
          const requestData = typeof requestBody === 'string'
            ? JSON.parse(requestBody)
            : requestBody;
          
          const typeMap = { 1: 'LIMIT', 2: 'MARKET', 4: 'STOP' };
          const orderType = typeMap[requestData.type] || 'UNKNOWN';
          const side = requestData.positionSize > 0 ? 'LONG/BUY' : 'SHORT/SELL';
          
          console.log('[TopstepX Network] 📦 XHR CREATE ORDER:', {
            type: orderType,
            side: side,
            price: requestData.limitPrice || requestData.stopPrice || 'market',
            contracts: Math.abs(requestData.positionSize)
          });
          
          this.extractOrderData(requestData, 'create');
        }
        
        // Process for PATCH (modify) - check both limitPrice and stopPrice
        if (method === 'PATCH') {
          let urlMatch = url.match(/\/Order\/edit\/stopLimit\/(\d+)\?limitPrice=([\d.]+)/);
          if (urlMatch) {
            const orderId = urlMatch[1];
            const limitPrice = parseFloat(urlMatch[2]);
            console.log('[TopstepX Network] ✏️ XHR MODIFY LIMIT:', { orderId, limitPrice });
            this.extractOrderData({ 
              limitPrice,
              orderId,
              type: 'modify'
            }, 'modify');
          } else {
            // Check for stopPrice
            urlMatch = url.match(/\/Order\/edit\/stopLimit\/(\d+)\?stopPrice=([\d.]+)/);
            if (urlMatch) {
              const orderId = urlMatch[1];
              const stopPrice = parseFloat(urlMatch[2]);
              console.log('[TopstepX Network] ✏️ XHR MODIFY STOP:', { orderId, stopPrice });
              this.extractOrderData({ 
                stopPrice,
                orderId,
                type: 'modify'
              }, 'modify');
            }
          }
        }

        // Process response
        if (responseText) {
          const responseData = JSON.parse(responseText);
          console.log('[TopstepX Network] 📥 XHR Response:', responseData);
          
          // Store order ID if present
          if (responseData.orderId) {
            this.activeOrderId = responseData.orderId;
            console.log('[TopstepX Network] 📝 Active order ID:', this.activeOrderId);
          }
        }
      }
    } catch (error) {
      console.log('[TopstepX Network] ⚠️ XHR processing error:', error.message);
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
  extractOrderData(data, action = 'create') {
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

    // Detect order type from data.type field
    // type: 1 = Limit, type: 2 = Market, type: 4 = Stop
    if (data.type !== undefined) {
      const typeMap = {
        1: 'limit',
        2: 'market',
        4: 'stop'
      };
      extractedData.orderType = typeMap[data.type] || 'unknown';
    }

    // Handle limit, stop, and market orders
    if (data.limitPrice !== undefined && data.limitPrice !== null) {
      extractedData.price = data.limitPrice;
      if (!extractedData.orderType) extractedData.orderType = 'limit';
    } else if (data.stopPrice !== undefined && data.stopPrice !== null) {
      extractedData.price = data.stopPrice;
      if (!extractedData.orderType) extractedData.orderType = 'stop';
    }

    // CRITICAL: positionSize determines the side
    // Positive (1, 2, 3...) = LONG/BUY
    // Negative (-1, -2, -3...) = SHORT/SELL
    // Absolute value = quantity (number of contracts)
    if (data.positionSize !== undefined && data.positionSize !== null) {
      extractedData.quantity = Math.abs(data.positionSize);
      extractedData.side = data.positionSize > 0 ? 'long' : 'short';
      
      console.log('[TopstepX Network] 📊 Position analysis:', {
        positionSize: data.positionSize,
        quantity: extractedData.quantity,
        side: extractedData.side
      });
    }
    
    // Store order ID if present
    if (data.orderId) {
      extractedData.orderId = data.orderId;
    }
    
    // Store action type
    extractedData.action = action;

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
      // Create a unique key for deduplication
      const dedupKey = `${action}-${extractedData.price}-${extractedData.symbol || 'unknown'}-${Date.now()}`;
      const dedupKeyShort = `${action}-${extractedData.price}-${extractedData.symbol || 'unknown'}`;
      
      // Check if we've already processed this exact request recently (within 1 second)
      if (this.processedRequests.has(dedupKeyShort)) {
        console.log('[TopstepX Network] ⏭️ Skipping duplicate order processing');
        return;
      }
      
      // Mark as processed
      this.processedRequests.add(dedupKeyShort);
      
      // Clear old entries after 2 seconds
      setTimeout(() => {
        this.processedRequests.delete(dedupKeyShort);
      }, 2000);
      
      console.log('[TopstepX Network] 🎯 Extracted order data:', {
        ...extractedData,
        orderType: extractedData.orderType || 'unknown',
        action: action
      });
      
      // For modify actions, merge with existing data
      if (action === 'modify' && this.orderData) {
        this.orderData = {
          ...this.orderData,
          ...extractedData,
          timestamp: Date.now()
        };
      } else {
        // For create actions, replace all data
        this.orderData = {
          ...extractedData,
          timestamp: Date.now()
        };
      }

      console.log('[TopstepX Network] 💾 Current order data:', this.orderData);

      // Notify listeners
      this.notifyListeners('orderData', this.orderData);
      
      // Notify action-specific listeners
      if (action === 'create') {
        this.notifyListeners('orderCreated', this.orderData);
      } else if (action === 'modify') {
        this.notifyListeners('orderModified', this.orderData);
      }
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
} else if (typeof window !== 'undefined') {
  // Browser environment - expose to window
  window.NetworkInterceptor = NetworkInterceptor;
  console.log('[TopstepX Network] ✅ NetworkInterceptor exposed to window');
}
