// Main Content Script v4.0.0 - DIRECT CHART ACCESS
// No iframe communication needed!
(function() {
  'use strict';

  const BUILD_TIME = new Date().toISOString().slice(0, 19).replace('T', ' ');
  console.log(`%c
  ╔══════════════════════════════════════════╗
  ║  TopstepX SL/TP Assistant v4.3.1        ║
  ║  BUILD: ${BUILD_TIME}                   ║
  ║  STATUS: 🎯 ENHANCED UI                 ║
  ║  ORDERS: LIMIT, STOP, MARKET            ║
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
  let storageManager = null;
  let domObserver = null;
  let networkInterceptor = null;

  /**
   * Initialize
   */
  async function initialize() {
    console.log('[TopstepX v4] 🔧 Initializing...');

    try {
      // 1. Load modules
      calculationEngine = new CalculationEngine();
      storageManager = new StorageManager();
      config = await storageManager.getConfig();
      console.log('[TopstepX v4] ✅ Config loaded');

      // 2. Setup network interceptor (in MAIN world)
      if (typeof NetworkInterceptor !== 'undefined') {
        networkInterceptor = new NetworkInterceptor();
        
        // Listen for order creation
        networkInterceptor.on('orderCreated', (orderData) => {
          console.log('[TopstepX v4] 🆕 Order created:', orderData);
          state.hasActiveOrder = true;
          handleOrderData(orderData);
        });
        
        // Listen for order modification
        networkInterceptor.on('orderModified', (orderData) => {
          console.log('[TopstepX v4] ✏️ Order modified:', orderData);
          handleOrderData(orderData);
        });
        
        console.log('[TopstepX v4] ✅ Network interceptor setup');
      } else {
        console.warn('[TopstepX v4] ⚠️ NetworkInterceptor not available');
      }

      // 3. Create chart access instance
      chartAccess = new ChartAccess();
      
      // 4. Find the chart
      console.log('[TopstepX v4] 🔍 Searching for chart...');
      const found = await chartAccess.findChart(60); // Wait up to 60 seconds
      
      if (!found) {
        console.error('[TopstepX v4] ❌ Could not find chart');
        return;
      }

      console.log('[TopstepX v4] ✅ Chart connected!');

      // 5. Setup DOM observer
      domObserver = new SmartDOMObserver(handleDOMData);
      domObserver.start();
      console.log('[TopstepX v4] ✅ DOM observer started');

      // 6. Listen for config changes
      storageManager.onConfigChanged((newConfig) => {
        config = newConfig;
        console.log('[TopstepX v4] 🔄 Config updated');
        updateLines();
      });

      console.log('[TopstepX v4] ✅ INITIALIZATION COMPLETE');

    } catch (error) {
      console.error('[TopstepX v4] ❌ Initialization failed:', error);
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

    if (data.side && data.side !== state.side) {
      state.side = data.side;
      console.log('[TopstepX v4] ✅ Side:', data.side);
      changed = true;
    }

    if (changed) {
      updateLines();
    }
  }

  /**
   * Calculate and update lines
   */
  function updateLines() {
    // CRITICAL: Only show lines if there's an active limit/stop order
    if (!state.hasActiveOrder) {
      console.log('[TopstepX v4] ⏸️ No active order - lines hidden');
      return;
    }
    
    if (!state.symbol || !state.price || !chartAccess || !chartAccess.chart) {
      console.log('[TopstepX v4] ⏳ Waiting for data... Symbol:', state.symbol, 'Price:', state.price, 'Chart:', !!chartAccess?.chart);
      return;
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

