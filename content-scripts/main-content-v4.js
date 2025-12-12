// Main Content Script v4.0.0 - DIRECT CHART ACCESS
// No iframe communication needed!
(function() {
  'use strict';

  const BUILD_TIME = new Date().toISOString().slice(0, 19).replace('T', ' ');
  console.log(`%c
  ╔══════════════════════════════════════════╗
  ║  TopstepX SL/TP Assistant v4.6.0        ║
  ║  BUILD: ${BUILD_TIME}                   ║
  ║  STATUS: 🏪 PERSISTENT LINES + SYNC     ║
  ║  CONFIG: ORDERSTORE REHYDRATION         ║
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
  let configReady = false;

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
        
        // Apply line drag sync configuration
        if (typeof window.lineDragSync !== 'undefined') {
          window.lineDragSync.setEnabled(config.enableLineDragSync || false);
          if (config.syncDebounceDelay) {
            window.lineDragSync.debounceDelay = config.syncDebounceDelay;
          }
          console.log('[TopstepX v4] 🔄 Line drag sync:', config.enableLineDragSync ? 'ENABLED' : 'DISABLED');
        }
        
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

      // 2. Request config from bridge
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
    try {
      // 1. Setup network interceptor (in MAIN world)
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

        // Listen for order cancellation
        networkInterceptor.on('orderCancelled', (data) => {
          console.log('[TopstepX v4] ❌ Order cancelled:', data);
          state.hasActiveOrder = false;
          
          // Clear all lines from chart
          if (chartAccess) {
            chartAccess.clearLines();
            console.log('[TopstepX v4] 🗑️ Lines cleared after order cancellation');
          }
        });
        
        console.log('[TopstepX v4] ✅ Network interceptor setup');
      } else {
        console.warn('[TopstepX v4] ⚠️ NetworkInterceptor not available');
      }

      // 2. Create chart access instance
      chartAccess = new ChartAccess();
      
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
      
      // 5. Rehydrate OrderStore and restore lines if available
      await rehydrateOrderStore();

      console.log('[TopstepX v4] ✅ INITIALIZATION COMPLETE');

    } catch (error) {
      console.error('[TopstepX v4] ❌ Initialization failed:', error);
    }
  }
  
  /**
   * Rehydrate OrderStore from storage and restore lines
   */
  async function rehydrateOrderStore() {
    console.log('[TopstepX v4] 💧 Rehydrating OrderStore...');
    
    if (typeof window.orderStore === 'undefined') {
      console.warn('[TopstepX v4] ⚠️ OrderStore not available');
      return;
    }
    
    try {
      // Attempt to rehydrate from storage
      const rehydrated = await window.orderStore.rehydrate();
      
      if (!rehydrated) {
        console.log('[TopstepX v4] 💧 No data to restore');
        return;
      }
      
      console.log('[TopstepX v4] 💧 OrderStore rehydrated successfully');
      
      // Restore lines to chart
      if (chartAccess) {
        const restored = await chartAccess.restoreFromStore();
        if (restored) {
          console.log('[TopstepX v4] ✅ Lines restored to chart!');
          state.hasActiveOrder = true;
          
          // Get order data from store
          const orderData = window.orderStore.getActiveOrder();
          if (orderData) {
            state.symbol = orderData.symbol;
            state.side = orderData.side;
            state.quantity = orderData.contracts;
          }
        } else {
          console.log('[TopstepX v4] ⚠️ Could not restore lines to chart');
        }
      }
      
    } catch (error) {
      console.error('[TopstepX v4] ❌ Error rehydrating OrderStore:', error);
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

