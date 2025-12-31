// Main Content Script v4.0.0 - DIRECT CHART ACCESS
// No iframe communication needed!
(function() {
  'use strict';

  const BUILD_TIME = new Date().toISOString().slice(0, 19).replace('T', ' ');
  console.log(`%c
  ╔══════════════════════════════════════════╗
  ║  TopstepX SL/TP Assistant v4.5.7        ║
  ║  BUILD: ${BUILD_TIME}                   ║
  ║  STATUS: ✅ PERSISTENT LINES            ║
  ║  FEATURES: AUTO SYNC & RESTORE          ║
  ╚══════════════════════════════════════════╝
  `, 'color: #00ff00; font-weight: bold; font-size: 16px;');

  // State
  let state = {
    symbol: null,
    price: null,
    quantity: 1,
    side: 'long',
    hasActiveOrder: false  // NEW: Only show lines when there's an active limit order
  };

  let config = null;
  let chartAccess = null;
  let calculationEngine = null;
  let domObserver = null;
  let networkInterceptor = null;
  let apiClient = null;
  let orderContext = null;
  let configReady = false;
  let initializationStarted = false; // Prevent double initialization

  /**
   * Request config from ISOLATED world
   */
  function requestConfig() {
    console.log('[TopstepX v4] 📡 Requesting config from bridge...');
    window.postMessage({ type: 'TOPSTEP_GET_CONFIG' }, '*');
  }

  /**
   * Listen for config messages from ISOLATED world
   */
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (!event.data.type || !event.data.type.startsWith('TOPSTEP_')) return;

    switch (event.data.type) {
      case 'TOPSTEP_CONFIG_RESPONSE':
        console.log('[TopstepX v4] 📥 Config received from bridge:', event.data.config);
        config = event.data.config;
        configReady = true;
        
        // If we're waiting for config, continue initialization
        if (!chartAccess) {
          continueInitialization();
        } else {
          // Just update lines if already initialized
          updateLines();
        }
        break;

      case 'TOPSTEP_CONFIG_CHANGED':
        console.log('[TopstepX v4] 🔔 Config changed:', event.data.config);
        config = event.data.config;
        updateLines();
        break;

      case 'TOPSTEP_CONFIG_ERROR':
        console.error('[TopstepX v4] ❌ Config error:', event.data.error);
        break;
    }
  });

  /**
   * Initialize (Part 1 - wait for config)
   */
  async function initialize() {
    console.log('[TopstepX v4] 🔧 Initializing...');

    try {
      // 1. Load calculation engine
      calculationEngine = new CalculationEngine();
      console.log('[TopstepX v4] ✅ Calculation engine loaded');

      // 2. Initialize API client
      apiClient = new APIClient();
      const apiReady = apiClient.initialize();
      if (apiReady) {
        console.log('[TopstepX v4] ✅ API client initialized');
      } else {
        console.warn('[TopstepX v4] ⚠️ API client not ready (no token)');
      }

      // 3. Initialize order context
      orderContext = new OrderContext();
      const restoredOrder = orderContext.initialize();
      if (restoredOrder) {
        console.log('[TopstepX v4] 📦 Restored order:', restoredOrder);
        // Restore state from persisted order
        state.symbol = restoredOrder.symbol;
        state.price = restoredOrder.entryPrice;
        state.quantity = restoredOrder.quantity;
        state.side = restoredOrder.side;
        state.hasActiveOrder = restoredOrder.status === 'active' || restoredOrder.status === 'pending';
      }

      // 4. Request config from bridge
      requestConfig();
      
      // Wait for config with timeout
      for (let i = 0; i < 50; i++) {
        if (configReady) break;
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (!configReady) {
        console.warn('[TopstepX v4] ⚠️ Config not ready after 5s, using defaults');
        config = {
          // Risk Management
          riskMode: 'percent',
          riskPercent: 2,
          riskFixed: 500,
          accountSize: 50000,
          
          // SL/TP
          defaultSL: 100,
          defaultTP: 200,
          tpRatio: 2,
          useRatio: true,
          
          // Visual Settings - Lines
          slColor: '#FF0000',
          tpColor: '#00FF00',
          lineWidth: 1,
          slLineStyle: 0,
          tpLineStyle: 0,
          lineOpacity: 100,
          
          // Visual Settings - Text
          fontSize: 10,
          fontBold: false,
          showLabels: true,
          labelFormat: 'compact',
          showDecimals: false,
          showContracts: true,
          
          // Label Text Customization
          slPrefix: 'SL',
          tpPrefix: 'TP',
          useEmojis: false,
          
          // Options
          persistLines: true,
          autoUpdate: true,
          autoHideOnMarket: true,
          playSound: false
        };
      }

      console.log('[TopstepX v4] ✅ Config ready');
      continueInitialization();

    } catch (error) {
      console.error('[TopstepX v4] ❌ Initialization failed:', error);
    }
  }

  /**
   * Continue initialization after config is loaded
   */
  async function continueInitialization() {
    // Prevent double initialization
    if (initializationStarted) {
      console.log('[TopstepX v4] ⏭️ Initialization already started, skipping');
      return;
    }
    initializationStarted = true;
    
    try {
      // 1. Setup network interceptor (in MAIN world)
      if (typeof NetworkInterceptor !== 'undefined') {
        networkInterceptor = new NetworkInterceptor();
        
        // Listen for order creation
        networkInterceptor.on('orderCreated', (orderData) => {
          console.log('[TopstepX v4] 🆕 Order created:', orderData);
          state.hasActiveOrder = true;
          
          // Update API client with account ID if available
          if (orderData.accountId && apiClient) {
            apiClient.setAccountId(orderData.accountId);
            console.log('[TopstepX v4] 💳 Account ID set:', orderData.accountId);
          }
          
          handleOrderData(orderData);
        });
        
        // Listen for order modification (price edit via drag)
        networkInterceptor.on('orderModified', (orderData) => {
          console.log('[TopstepX v4] ✏️ Order modified:', orderData);
          
          // If only price changed, update the entry price and recalculate lines
          if (orderData.price && orderData.price !== state.price) {
            console.log('[TopstepX v4] 📍 Entry price changed from', state.price, 'to', orderData.price);
            state.price = orderData.price;
            
            // Recalculate and update lines with new entry price
            updateLines();
          }
        });

        // Listen for order cancellation
        networkInterceptor.on('orderCancelled', (data) => {
          console.log('[TopstepX v4] ❌ Order cancelled:', data);
          state.hasActiveOrder = false;
          
          // Clear all lines from chart
          if (chartAccess) {
            chartAccess.clearLines();
            console.log('[TopstepX v4] 🗑️ Lines cleared after order cancellation');
          }
          
          // Clear persisted order
          if (orderContext) {
            orderContext.cancelOrder();
            orderContext.clearOrder(false);
            console.log('[TopstepX v4] 🗑️ Order cleared from storage');
          }
        });
        
        console.log('[TopstepX v4] ✅ Network interceptor setup');
      } else {
        console.warn('[TopstepX v4] ⚠️ NetworkInterceptor not available');
      }

      // 2. Create chart access instance with API client and order context
      chartAccess = new ChartAccess(apiClient, orderContext);
      
      // 3. Find the chart
      console.log('[TopstepX v4] 🔍 Searching for chart...');
      const found = await chartAccess.findChart(60); // Wait up to 60 seconds
      
      if (!found) {
        console.error('[TopstepX v4] ❌ Could not find chart');
        return;
      }

      console.log('[TopstepX v4] ✅ Chart connected!');

      // 4. Setup DOM observer
      domObserver = new SmartDOMObserver(handleDOMData);
      domObserver.start();
      console.log('[TopstepX v4] ✅ DOM observer started');

      console.log('[TopstepX v4] ✅ INITIALIZATION COMPLETE');

      // 5. Restore persisted order lines if available
      if (orderContext && orderContext.hasOrder()) {
        const order = orderContext.getOrder();
        console.log('[TopstepX v4] 📦 Restoring order lines from storage...');
        
        // Wait a moment for chart to be fully ready
        setTimeout(() => {
          restoreOrderLines(order);
        }, 1000);
      }
      
      // 6. Start chart watchdog for SPA navigation
      startChartWatchdog();

    } catch (error) {
      console.error('[TopstepX v4] ❌ Initialization failed:', error);
    }
  }
  
  /**
   * Watchdog to detect chart recreation (SPA navigation)
   * When user navigates away and back, the chart is destroyed and recreated
   * This watchdog detects that and restores the lines
   */
  let chartWatchdogInterval = null;
  let lastChartId = null;
  
  function startChartWatchdog() {
    // Clear existing watchdog
    if (chartWatchdogInterval) {
      clearInterval(chartWatchdogInterval);
    }
    
    // Store current chart ID
    if (chartAccess && chartAccess.iframe) {
      lastChartId = chartAccess.iframe.id;
    }
    
    // Check every 2 seconds if chart changed
    chartWatchdogInterval = setInterval(async () => {
      try {
        // Find current chart iframe
        const currentIframe = document.querySelector('iframe[id^="tradingview_"]');
        
        if (!currentIframe) {
          // Chart not found - user probably navigated away
          console.log('[TopstepX v4] 🔄 Chart not found - waiting for return...');
          return;
        }
        
        // Check if chart ID changed (chart was recreated)
        if (currentIframe.id !== lastChartId) {
          console.log('[TopstepX v4] 🔄 Chart recreated! Reconnecting...');
          lastChartId = currentIframe.id;
          
          // Wait for chart to be fully ready
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Reconnect to new chart
          await reconnectToChart();
        }
      } catch (e) {
        // Ignore errors during watchdog
      }
    }, 2000);
    
    console.log('[TopstepX v4] 👀 Chart watchdog started');
  }
  
  /**
   * Reconnect to chart after SPA navigation
   */
  async function reconnectToChart() {
    try {
      console.log('[TopstepX v4] 🔄 Reconnecting to chart...');
      
      // Create new chart access instance
      chartAccess = new ChartAccess(apiClient, orderContext);
      
      // Find the chart
      const found = await chartAccess.findChart(30);
      
      if (!found) {
        console.error('[TopstepX v4] ❌ Could not reconnect to chart');
        return;
      }
      
      console.log('[TopstepX v4] ✅ Reconnected to chart!');
      
      // Restore persisted order lines
      if (orderContext && orderContext.hasOrder()) {
        const order = orderContext.getOrder();
        console.log('[TopstepX v4] 📦 Restoring order lines after navigation...');
        
        // Wait a moment for chart to be fully ready
        setTimeout(() => {
          restoreOrderLines(order);
        }, 1000);
      }
      
    } catch (error) {
      console.error('[TopstepX v4] ❌ Failed to reconnect to chart:', error);
    }
  }
  
  /**
   * Handle order data from network interceptor
   */
  function handleOrderData(orderData) {
    console.log('[TopstepX v4] 📦 Processing order data:', orderData);
    
    // Log order type for debugging
    if (orderData.orderType) {
      console.log('[TopstepX v4] 📋 Order type:', orderData.orderType.toUpperCase());
    }
    
    // IMPORTANT: Only show lines for LIMIT and STOP orders
    // Market orders execute immediately and don't need lines
    if (orderData.orderType === 'market') {
      console.log('[TopstepX v4] ⏭️ Market order - no lines needed (executes immediately)');
      state.hasActiveOrder = false;
      if (chartAccess) {
        chartAccess.clearLines();
      }
      return;
    }
    
    // This is a valid limit/stop order, ensure flag is set
    if (!state.hasActiveOrder) {
      state.hasActiveOrder = true;
      console.log('[TopstepX v4] 📍 Active limit/stop order detected');
    }
    
    let changed = false;

    if (orderData.symbol && orderData.symbol !== state.symbol) {
      state.symbol = orderData.symbol;
      console.log('[TopstepX v4] ✅ Symbol from order:', orderData.symbol);
      changed = true;
    }

    if (orderData.price && orderData.price !== state.price) {
      state.price = orderData.price;
      console.log('[TopstepX v4] ✅ Price from order:', orderData.price, `(${orderData.orderType || 'unknown'} order)`);
      changed = true;
    }

    if (orderData.quantity && orderData.quantity !== state.quantity) {
      state.quantity = orderData.quantity;
      console.log('[TopstepX v4] ✅ Quantity from order:', orderData.quantity, 'contracts');
      
      // Update contracts in chart for dynamic calculation
      if (chartAccess && chartAccess.state) {
        chartAccess.updateContracts(orderData.quantity);
      }
      
      changed = true;
    }

    if (orderData.side && orderData.side !== state.side) {
      state.side = orderData.side;
      console.log('[TopstepX v4] ✅ Side from order:', orderData.side.toUpperCase());
      changed = true;
    }

    if (changed) {
      updateLines();
    }
  }

  /**
   * Handle DOM data changes
   */
  function handleDOMData(data) {
    console.log('[TopstepX v4] 📝 DOM Data:', data);

    // Ignore DOM data if we're currently dragging
    if (chartAccess && chartAccess.isCurrentlyDragging && chartAccess.isCurrentlyDragging()) {
      console.log('[TopstepX v4] 🖱️ Ignoring DOM data during drag');
      return;
    }

    let changed = false;

    if (data.symbol && data.symbol !== state.symbol) {
      state.symbol = data.symbol;
      console.log('[TopstepX v4] ✅ Symbol:', data.symbol);
      changed = true;
    }

    if (data.price && data.price !== state.price) {
      state.price = data.price;
      console.log('[TopstepX v4] ✅ Price:', data.price);
      changed = true;
    }

    if (data.quantity && data.quantity !== state.quantity) {
      state.quantity = data.quantity;
      console.log('[TopstepX v4] ✅ Quantity:', data.quantity);
      
      // Update contracts in chart for dynamic calculation
      if (chartAccess && chartAccess.state) {
        chartAccess.updateContracts(data.quantity);
      }
      
      changed = true;
    }

    // IMPORTANT: Ignore side changes from DOM if we already have an active order
    // The network interceptor's side data is authoritative
    // DOM side detection is unreliable (hover states, etc.)
    if (data.side && data.side !== state.side) {
      // Only accept side from DOM if we don't have an active order with confirmed side
      if (!state.hasActiveOrder) {
        state.side = data.side;
        console.log('[TopstepX v4] ✅ Side from DOM:', data.side);
        changed = true;
      } else {
        console.log('[TopstepX v4] ⏭️ Ignoring side change from DOM (order already active)');
      }
    }

    // If we have complete order data from DOM, update lines
    // But only if meaningful data changed (not just side)
    if (changed && (data.changedFields?.includes('symbol') || 
                    data.changedFields?.includes('price') || 
                    data.changedFields?.includes('quantity'))) {
      updateLines();
    }
  }

  /**
   * Restore order lines from persisted order
   * @param {object} order - Persisted order object
   */
  function restoreOrderLines(order) {
    if (!order || !chartAccess || !chartAccess.chart || !config) {
      console.warn('[TopstepX v4] ⚠️ Cannot restore lines - missing data', {
        hasOrder: !!order,
        hasChartAccess: !!chartAccess,
        hasChart: !!chartAccess?.chart,
        hasConfig: !!config
      });
      return;
    }

    try {
      console.log('[TopstepX v4] 🔄 Restoring lines for order:', order.orderId);
      console.log('[TopstepX v4] 📍 Saved positions:', {
        symbol: order.symbol,
        entry: order.entryPrice,
        sl: order.slPrice,
        tp: order.tpPrice,
        slDollars: order.slDollars,
        tpDollars: order.tpDollars
      });

      // Get instrument specs
      const instrument = InstrumentDatabase.getInstrument(order.symbol);
      if (!instrument) {
        console.warn('[TopstepX v4] ⚠️ Unknown instrument:', order.symbol);
        return;
      }

      // Restore state
      state.symbol = order.symbol;
      state.price = order.entryPrice;
      state.quantity = order.quantity;
      state.side = order.side;
      state.hasActiveOrder = true;

      // Restore lines on chart using saved prices
      chartAccess.updateLines(
        order.slPrice,
        order.tpPrice,
        order.entryPrice,
        config,
        order.quantity,
        instrument
      );

      console.log('[TopstepX v4] ✅ Lines restored at SL:', order.slPrice, 'TP:', order.tpPrice);
    } catch (error) {
      console.error('[TopstepX v4] ❌ Error restoring lines:', error);
    }
  }

  /**
   * Calculate and update lines
   */
  function updateLines() {
    if (!state.symbol || !state.price || !chartAccess || !chartAccess.chart) {
      console.log('[TopstepX v4] ⏳ Waiting for data... Symbol:', state.symbol, 'Price:', state.price, 'Chart:', !!chartAccess?.chart);
      return;
    }
    
    // Don't recreate lines if user is currently dragging
    if (chartAccess.isCurrentlyDragging && chartAccess.isCurrentlyDragging()) {
      console.log('[TopstepX v4] 🖱️ User is dragging - skipping line update');
      return;
    }
    
    // If we have price and symbol data, assume there's an active order
    // (unless explicitly marked as no active order by market order detection)
    if (!state.hasActiveOrder) {
      // If we reached here with data, it means DOM detected an order
      // Set hasActiveOrder to true
      state.hasActiveOrder = true;
      console.log('[TopstepX v4] 📍 Order detected via DOM - enabling lines');
    }

    try {
      console.log('[TopstepX v4] 🧮 Calculating SL/TP...');
      console.log('[TopstepX v4] 📍 Reference Price:', state.price, `(${state.side.toUpperCase()} position)`);

      // Get instrument specs
      const instrument = InstrumentDatabase.getInstrument(state.symbol);
      if (!instrument) {
        console.warn('[TopstepX v4] ⚠️ Unknown instrument:', state.symbol);
        return;
      }

      // Calculate risk in dollars
      const riskDollars = calculationEngine.calculateRiskInDollars(
        config.riskMode,
        config.riskMode === 'percent' ? config.riskPercent : config.riskFixed,
        config.accountSize
      );

      console.log('[TopstepX v4] 💰 Risk:', riskDollars);

      // Get SL and TP in dollars
      let slDollars = config.defaultSL;
      let tpDollars;

      if (config.useRatio) {
        tpDollars = calculationEngine.applyRatioToTP(slDollars, config.tpRatio);
      } else {
        tpDollars = config.defaultTP;
      }

      console.log('[TopstepX v4] 📊 SL: $' + slDollars + ', TP: $' + tpDollars);

      // Calculate SL price
      // LONG: SL below entry (price goes down = loss)
      // SHORT: SL above entry (price goes up = loss)
      const slPrice = calculationEngine.calculateStopLossPrice(
        state.price,
        slDollars,
        instrument.tickValue,
        instrument.tickSize,
        state.side
      );

      // Calculate TP price
      // LONG: TP above entry (price goes up = profit)
      // SHORT: TP below entry (price goes down = profit)
      const tpPrice = calculationEngine.calculateTakeProfitPrice(
        state.price,
        tpDollars,
        instrument.tickValue,
        instrument.tickSize,
        state.side
      );

      // Use contracts from order
      const contracts = state.quantity || 1;

      console.log('[TopstepX v4] 📈 Entry Price:', state.price);
      console.log('[TopstepX v4] 🔴 SL Price:', slPrice, state.side === 'long' ? '(below entry)' : '(above entry)');
      console.log('[TopstepX v4] 🟢 TP Price:', tpPrice, state.side === 'long' ? '(above entry)' : '(below entry)');
      console.log('[TopstepX v4] 📊 Contracts:', contracts);

      // Update lines on chart!
      chartAccess.updateLines(slPrice, tpPrice, state.price, config, contracts, instrument);

      console.log('[TopstepX v4] ✅ Lines updated on chart!');

      // Persist order to storage
      if (orderContext && state.hasActiveOrder) {
        orderContext.setOrder({
          orderId: `order_${Date.now()}`,
          accountId: apiClient ? apiClient.getAccountId() : null,
          symbol: state.symbol,
          side: state.side,
          orderType: 'limit',
          entryPrice: state.price,
          quantity: contracts,
          slPrice: slPrice,
          tpPrice: tpPrice,
          slDollars: slDollars,
          tpDollars: tpDollars,
          status: 'active',
          timestamp: Date.now()
        });
        console.log('[TopstepX v4] 💾 Order persisted to storage');
      }

      // Update position brackets via API (debounced)
      if (apiClient && apiClient.isReady()) {
        apiClient.updatePositionBrackets(slDollars, tpDollars, true)
          .then(() => {
            console.log('[TopstepX v4] ✅ Position brackets updated via API');
          })
          .catch((error) => {
            console.error('[TopstepX v4] ❌ Failed to update position brackets:', error);
          });
      }

    } catch (error) {
      console.error('[TopstepX v4] ❌ Error updating lines:', error);
    }
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    // DOM already loaded
    setTimeout(initialize, 1000);
  }

})();
