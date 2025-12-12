/**
 * Active Orders Observer
 * Monitors DOM for active orders to restore lines after page reload
 * 
 * TopstepX displays active orders in the DOM, we can parse them to:
 * 1. Detect if there's an active limit/stop order
 * 2. Extract order details (price, symbol, side, quantity)
 * 3. Restore lines even after page refresh
 */

class ActiveOrdersObserver {
  constructor(onOrderDetected) {
    this.onOrderDetected = onOrderDetected;
    this.observer = null;
    this.checkInterval = null;
    this.lastDetectedOrders = new Set();
    this.isMonitoring = false;
  }

  /**
   * Start monitoring DOM for active orders
   */
  start() {
    console.log('[Active Orders Observer] 🔍 Starting DOM monitoring for active orders...');
    
    // Check immediately
    this.checkForActiveOrders();
    
    // Then check every 2 seconds
    this.checkInterval = setInterval(() => {
      this.checkForActiveOrders();
    }, 2000);
    
    // Also setup MutationObserver for real-time updates
    this.setupMutationObserver();
    
    this.isMonitoring = true;
    console.log('[Active Orders Observer] ✅ Monitoring started');
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    this.isMonitoring = false;
    console.log('[Active Orders Observer] ⏹️ Monitoring stopped');
  }

  /**
   * Setup MutationObserver to watch for DOM changes
   */
  setupMutationObserver() {
    this.observer = new MutationObserver(() => {
      this.checkForActiveOrders();
    });

    // Observe the entire document for changes
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-order-id']
    });
  }

  /**
   * Check DOM for active orders
   */
  checkForActiveOrders() {
    try {
      // Strategy 1: Look for order rows in Working Orders panel
      const workingOrders = this.findWorkingOrders();
      if (workingOrders.length > 0) {
        console.log('[Active Orders Observer] 📋 Found working orders:', workingOrders.length);
        this.processOrders(workingOrders);
        return;
      }

      // Strategy 2: Look for order chips/badges
      const orderChips = this.findOrderChips();
      if (orderChips.length > 0) {
        console.log('[Active Orders Observer] 🏷️ Found order chips:', orderChips.length);
        this.processOrderChips(orderChips);
        return;
      }

      // Strategy 3: Look for chart overlays with order info
      const chartOrders = this.findChartOrders();
      if (chartOrders.length > 0) {
        console.log('[Active Orders Observer] 📊 Found chart orders:', chartOrders.length);
        this.processChartOrders(chartOrders);
        return;
      }

      // No orders found
      if (this.lastDetectedOrders.size > 0) {
        console.log('[Active Orders Observer] ℹ️ No active orders detected');
        this.lastDetectedOrders.clear();
      }

    } catch (error) {
      console.error('[Active Orders Observer] ❌ Error checking orders:', error);
    }
  }

  /**
   * Find working orders in DOM (main strategy)
   */
  findWorkingOrders() {
    const orders = [];
    
    // Look for common patterns in TopstepX DOM
    // This will need to be adjusted based on actual TopstepX structure
    
    // Pattern 1: Table rows with order data
    const orderRows = document.querySelectorAll('[class*="order"], [class*="Order"], [data-order-id]');
    orderRows.forEach(row => {
      const orderData = this.extractOrderFromRow(row);
      if (orderData) {
        orders.push(orderData);
      }
    });

    // Pattern 2: Order list items
    const orderItems = document.querySelectorAll('[class*="working-order"], [class*="WorkingOrder"]');
    orderItems.forEach(item => {
      const orderData = this.extractOrderFromElement(item);
      if (orderData) {
        orders.push(orderData);
      }
    });

    return orders;
  }

  /**
   * Find order chips/badges
   */
  findOrderChips() {
    return document.querySelectorAll('[class*="order-chip"], [class*="OrderChip"]');
  }

  /**
   * Find chart overlay orders
   */
  findChartOrders() {
    return document.querySelectorAll('[class*="chart-order"], [class*="ChartOrder"]');
  }

  /**
   * Extract order data from DOM row
   */
  extractOrderFromRow(row) {
    try {
      const text = row.innerText || row.textContent || '';
      
      // Look for key patterns
      const hasLimit = text.includes('Limit') || text.includes('LMT');
      const hasStop = text.includes('Stop') || text.includes('STP');
      const hasBuy = text.includes('Buy') || text.includes('BUY');
      const hasSell = text.includes('Sell') || text.includes('SELL');
      
      if (!hasLimit && !hasStop) {
        return null; // Not a limit or stop order
      }

      // Extract price (look for numbers like 25923.5, 25,923.5, etc.)
      const priceMatch = text.match(/(\d{1,3}(?:,?\d{3})*\.?\d*)/);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null;

      // Extract symbol (MNQ, ES, NQ, etc.)
      const symbolMatch = text.match(/\b(MNQ|NQ|ES|RTY|YM|CL|GC|SI)\b/i);
      const symbol = symbolMatch ? symbolMatch[1].toUpperCase() : null;

      // Extract quantity
      const quantityMatch = text.match(/(\d+)\s*x|x\s*(\d+)|Qty:\s*(\d+)/i);
      const quantity = quantityMatch ? parseInt(quantityMatch[1] || quantityMatch[2] || quantityMatch[3]) : 1;

      // Determine side
      const side = hasBuy ? 'long' : (hasSell ? 'short' : null);

      // Determine order type
      const orderType = hasLimit ? 'limit' : (hasStop ? 'stop' : null);

      if (price && symbol && side && orderType) {
        console.log('[Active Orders Observer] ✅ Extracted order:', {
          price, symbol, side, orderType, quantity, source: 'row'
        });
        return { price, symbol, side, orderType, quantity };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract order data from generic DOM element
   */
  extractOrderFromElement(element) {
    // Similar to extractOrderFromRow but more flexible
    return this.extractOrderFromRow(element);
  }

  /**
   * Process found orders
   */
  processOrders(orders) {
    orders.forEach(orderData => {
      const orderId = `${orderData.symbol}_${orderData.price}_${orderData.side}`;
      
      if (!this.lastDetectedOrders.has(orderId)) {
        console.log('[Active Orders Observer] 🆕 New order detected:', orderData);
        this.lastDetectedOrders.add(orderId);
        
        // Notify callback
        if (this.onOrderDetected) {
          this.onOrderDetected(orderData);
        }
      }
    });
  }

  /**
   * Process order chips
   */
  processOrderChips(chips) {
    const orders = [];
    chips.forEach(chip => {
      const orderData = this.extractOrderFromElement(chip);
      if (orderData) {
        orders.push(orderData);
      }
    });
    this.processOrders(orders);
  }

  /**
   * Process chart orders
   */
  processChartOrders(chartOrders) {
    const orders = [];
    chartOrders.forEach(order => {
      const orderData = this.extractOrderFromElement(order);
      if (orderData) {
        orders.push(orderData);
      }
    });
    this.processOrders(orders);
  }

  /**
   * Manual search for order in entire DOM (fallback)
   */
  searchEntireDOM() {
    console.log('[Active Orders Observer] 🔎 Performing deep DOM search...');
    
    const allElements = document.querySelectorAll('*');
    const potentialOrders = [];

    allElements.forEach(el => {
      const text = el.textContent || '';
      
      // Look for limit/stop keywords with price nearby
      if ((text.includes('Limit') || text.includes('Stop')) && 
          /\d{4,5}\.?\d*/.test(text)) {
        
        const orderData = this.extractOrderFromElement(el);
        if (orderData) {
          potentialOrders.push(orderData);
        }
      }
    });

    console.log('[Active Orders Observer] Found potential orders:', potentialOrders.length);
    
    if (potentialOrders.length > 0) {
      this.processOrders(potentialOrders);
    }
  }
}

// Export
if (typeof window !== 'undefined') {
  window.ActiveOrdersObserver = ActiveOrdersObserver;
  console.log('[Active Orders Observer] ✅ Class loaded');
}

