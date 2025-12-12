// Chart Access Module
// Provides access to TradingView chart from main window
(function() {
  'use strict';

  class ChartAccess {
    constructor() {
      this.iframe = null;
      this.api = null;
      this.chart = null;
      this.lines = {
        stopLoss: null,
        takeProfit: null
      };
      
      // State for dynamic calculations
      this.state = {
        entryPrice: null,
        contracts: 1,
        instrument: null,
        config: null,
        side: null
      };
      
      // Polling interval for line position updates
      this.updateInterval = null;
      
      // Track last line positions for drag detection
      this.lastPositions = {
        slPrice: null,
        tpPrice: null
      };
      
      // Timer for debounced store updates
      this.storeUpdateTimer = null;
    }

    /**
     * Find and connect to the TradingView iframe
     */
    async findChart(maxAttempts = 60) {
      console.log('[TopstepX Chart] 🔍 Looking for TradingView iframe...');
      console.log('[TopstepX Chart] 🌍 Running in MAIN world - full access to page variables');

      for (let i = 0; i < maxAttempts; i++) {
        // Log every 5 seconds
        if (i % 5 === 0) {
          console.log(`[TopstepX Chart] ⏳ Attempt ${i}/${maxAttempts}...`);
        }

        // Get all iframes
        const allIframes = document.querySelectorAll('iframe');

        // Check each iframe for TradingView
        for (const iframe of allIframes) {
          // Look for TradingView iframe by ID
          if (iframe.id && iframe.id.startsWith('tradingview_')) {
            
            // Check if it's a blob: URL (TradingView widget)
            if (iframe.src && iframe.src.includes('blob:')) {
              
              try {
                const win = iframe.contentWindow;
                
                // Check if tradingViewApi is ready
                if (win.tradingViewApi && typeof win.tradingViewApi.activeChart === 'function') {
                  
                  try {
                    const chart = win.tradingViewApi.activeChart();
                    
                    if (chart && typeof chart.createShape === 'function') {
                      // Success!
                      this.iframe = iframe;
                      this.api = win.tradingViewApi;
                      this.chart = chart;
                      
                      console.log('[TopstepX Chart] 🎉 Chart found and ready!');
                      console.log('[TopstepX Chart] ✅ Iframe ID:', iframe.id);
                      console.log('[TopstepX Chart] ✅ tradingViewApi: accessible');
                      console.log('[TopstepX Chart] ✅ createShape: available');
                      
                      return true;
                    }
                  } catch (chartError) {
                    // Chart not ready yet
                    if (i % 10 === 0) {
                      console.log(`[TopstepX Chart] ⏳ Chart found but not ready yet...`);
                    }
                  }
                }
              } catch (accessError) {
                // Cannot access iframe
                if (i % 10 === 0) {
                  console.log(`[TopstepX Chart] ⏳ Iframe found but cannot access yet...`);
                }
              }
            }
          }
        }
        
        // Wait 1 second before next attempt
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('[TopstepX Chart] ❌ Chart not found after', maxAttempts, 'seconds');
      return false;
    }

    /**
     * Create a horizontal line on the chart
     */
    createLine(price, options = {}) {
      if (!this.chart) {
        console.error('[TopstepX Chart] Chart not connected');
        return null;
      }

      try {
        const lineId = this.chart.createShape(
          { 
            time: Math.floor(Date.now() / 1000),
            price: price
          },
          {
            shape: 'horizontal_line',
            overrides: {
              linecolor: options.color || '#FF0000',
              linewidth: options.width || 1,
              linestyle: options.style || 0, // 0 = solid, 1 = dotted, 2 = dashed
              showLabel: options.showLabel !== false,
              textcolor: options.textColor || options.color || '#FF0000',
              fontsize: options.fontSize || 10,
              bold: options.bold || false,
              text: options.text || ''
            },
            lock: false,
            disableSelection: false,
            disableSave: true,
            disableUndo: false
          }
        );

        console.log('[TopstepX Chart] ✅ Line created:', lineId, 'at price', price, `(width: ${options.width}px, style: ${options.style})`);
        return lineId;

      } catch (e) {
        console.error('[TopstepX Chart] ❌ Error creating line:', e);
        return null;
      }
    }

    /**
     * Remove a line from the chart
     */
    removeLine(lineId) {
      if (!this.chart || !lineId) return;

      try {
        this.chart.removeEntity(lineId);
        console.log('[TopstepX Chart] ✅ Line removed:', lineId);
      } catch (e) {
        console.error('[TopstepX Chart] ❌ Error removing line:', e);
      }
    }

    /**
     * Format label text based on configuration
     */
    formatLabel(type, dollars, contracts, config) {
      const prefix = type === 'sl' ? (config.slPrefix || 'SL') : (config.tpPrefix || 'TP');
      const sign = type === 'sl' ? '-' : '+';
      const emoji = config.useEmojis ? (type === 'sl' ? '🛑 ' : '🎯 ') : '';
      
      // Format dollar amount
      const dollarStr = config.showDecimals ? 
        dollars.toFixed(2) : 
        Math.round(dollars).toString();
      
      // // Format contracts
      // const contractStr = config.showContracts ? ` (${contracts}x)` : '';
      
      // Choose format
      switch (config.labelFormat) {
        case 'full':
          const fullName = type === 'sl' ? 'STOP LOSS' : 'TAKE PROFIT';
          return `${emoji}${fullName}: ${sign}$${dollarStr}`;
        
        case 'minimal':
          return `${emoji}${prefix} ${sign}$${dollarStr}`;
        
        case 'compact':
        default:
          return `${emoji}${prefix} ${sign}$${dollarStr}`;
      }
    }

    /**
     * Update SL/TP lines
     */
    updateLines(slPrice, tpPrice, entryPrice, config, contracts, instrument, side) {
      console.log('[TopstepX Chart] 📊 Updating lines...');
      console.log('[TopstepX Chart] SL:', slPrice, 'TP:', tpPrice, 'Entry:', entryPrice);
      console.log('[TopstepX Chart] Side:', side);
      console.log('[TopstepX Chart] Config:', {
        width: config.lineWidth,
        fontSize: config.fontSize,
        format: config.labelFormat
      });

      // Save state for dynamic updates
      this.state.entryPrice = entryPrice;
      this.state.contracts = contracts;
      this.state.instrument = instrument;
      this.state.config = config;
      this.state.side = side; // Save side for persistence

      // Calculate $ values
      const slTicks = Math.abs(entryPrice - slPrice) / instrument.tickSize;
      const tpTicks = Math.abs(tpPrice - entryPrice) / instrument.tickSize;
      
      const slDollars = slTicks * instrument.tickValue * contracts;
      const tpDollars = tpTicks * instrument.tickValue * contracts;

      console.log('[TopstepX Chart] 🔴 SL Loss: -$' + slDollars.toFixed(2));
      console.log('[TopstepX Chart] 🟢 TP Profit: +$' + tpDollars.toFixed(2));

      // Remove old lines
      if (this.lines.stopLoss) this.removeLine(this.lines.stopLoss);
      if (this.lines.takeProfit) this.removeLine(this.lines.takeProfit);

      // Format labels using configuration
      const slLabel = this.formatLabel('sl', slDollars, contracts, config);
      const tpLabel = this.formatLabel('tp', tpDollars, contracts, config);

      console.log('[TopstepX Chart] 📝 Labels:', { sl: slLabel, tp: tpLabel });

      // Create new lines with all config options
      this.lines.stopLoss = this.createLine(slPrice, {
        color: config.slColor || '#FF0000',
        width: config.lineWidth || 1,
        style: config.slLineStyle || 0,
        fontSize: config.fontSize || 10,
        bold: config.fontBold || false,
        showLabel: config.showLabels !== false,
        text: config.showLabels ? slLabel : ''
      });

      this.lines.takeProfit = this.createLine(tpPrice, {
        color: config.tpColor || '#00FF00',
        width: config.lineWidth || 1,
        style: config.tpLineStyle || 0,
        fontSize: config.fontSize || 10,
        bold: config.fontBold || false,
        showLabel: config.showLabels !== false,
        text: config.showLabels ? tpLabel : ''
      });

      console.log('[TopstepX Chart] ✅ Lines created');
      
      // Reset last positions to new line positions
      // This prevents detectLineDrag from thinking this is a drag
      this.lastPositions = {
        slPrice: slPrice,
        tpPrice: tpPrice
      };
      console.log('[TopstepX Chart] 🔄 Last positions reset to:', this.lastPositions);
      
      // Start monitoring line positions for dynamic updates
      this.startDynamicUpdates();
      
      // Persist to OrderStore
      this.persistToStore(slPrice, tpPrice, entryPrice, contracts, instrument, config, side);
    }
    
    /**
     * Start monitoring line positions and update labels dynamically
     */
    startDynamicUpdates() {
      // Clear existing interval
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
      }
      
      // Check line positions every 500ms
      this.updateInterval = setInterval(() => {
        this.updateLineLabels();
      }, 500);
      
      console.log('[TopstepX Chart] 🔄 Dynamic updates started');
    }
    
    /**
     * Stop dynamic updates
     */
    stopDynamicUpdates() {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
        console.log('[TopstepX Chart] 🛑 Dynamic updates stopped');
      }
    }
    
    /**
     * Update contracts quantity (for dynamic recalculation)
     */
    updateContracts(contracts) {
      if (this.state.contracts !== contracts) {
        this.state.contracts = contracts;
        console.log('[TopstepX Chart] 🔄 Contracts updated to:', contracts);
        // Force immediate update
        this.updateLineLabels();
      }
    }
    
    /**
     * Update line labels based on current positions
     * Also detects when lines are dragged and triggers sync
     */
    updateLineLabels() {
      if (!this.chart || !this.state.entryPrice) return;
      
      try {
        const { entryPrice, contracts, instrument, config } = this.state;
        
        // Skip if labels are disabled
        if (!config.showLabels) return;
        
        // Get current line prices
        const slShape = this.lines.stopLoss ? this.chart.getShapeById(this.lines.stopLoss) : null;
        const tpShape = this.lines.takeProfit ? this.chart.getShapeById(this.lines.takeProfit) : null;
        
        let currentSlPrice = null;
        let currentTpPrice = null;
        
        if (slShape) {
          const slPrice = slShape.getPoints()[0].price;
          currentSlPrice = slPrice;
          const slTicks = Math.abs(entryPrice - slPrice) / instrument.tickSize;
          const slDollars = slTicks * instrument.tickValue * contracts;
          
          // Update text using configured format
          const newText = this.formatLabel('sl', slDollars, contracts, config);
          slShape.setProperties({ text: newText });
          
          // Debug: Log actual position from TradingView
          console.log('[TopstepX Chart] 📍 SL Shape position:', slPrice);
        }
        
        if (tpShape) {
          const tpPrice = tpShape.getPoints()[0].price;
          currentTpPrice = tpPrice;
          const tpTicks = Math.abs(tpPrice - entryPrice) / instrument.tickSize;
          const tpDollars = tpTicks * instrument.tickValue * contracts;
          
          // Update text using configured format
          const newText = this.formatLabel('tp', tpDollars, contracts, config);
          tpShape.setProperties({ text: newText });
          
          // Debug: Log actual position from TradingView
          console.log('[TopstepX Chart] 📍 TP Shape position:', tpPrice);
        }
        
        // Detect if lines were dragged (position changed)
        this.detectLineDrag(currentSlPrice, currentTpPrice);
        
      } catch (e) {
        // Ignore errors (line might have been deleted)
      }
    }
    
    /**
     * Detect if lines were dragged and trigger sync
     * @param {number} currentSlPrice - Current SL price
     * @param {number} currentTpPrice - Current TP price
     */
    detectLineDrag(currentSlPrice, currentTpPrice) {
      // Check if this is the first position check OR if lastPositions are not initialized
      if (this.lastPositions.slPrice === null || this.lastPositions.tpPrice === null) {
        // Initialize/reinitialize last positions
        this.lastPositions.slPrice = currentSlPrice;
        this.lastPositions.tpPrice = currentTpPrice;
        console.log('[TopstepX Chart] 🔄 Initialized last positions:', this.lastPositions);
        return;
      }
      
      // Check if positions changed (with a tolerance of 0.5 ticks to avoid false positives)
      const slChanged = currentSlPrice !== null && 
                       this.lastPositions.slPrice !== null && 
                       Math.abs(currentSlPrice - this.lastPositions.slPrice) > 0.5;
      
      const tpChanged = currentTpPrice !== null && 
                       this.lastPositions.tpPrice !== null && 
                       Math.abs(currentTpPrice - this.lastPositions.tpPrice) > 0.5;
      
      if (slChanged || tpChanged) {
        console.log('[TopstepX Chart] 🖱️ Line position changed!');
        console.log('[TopstepX Chart] - SL: ', this.lastPositions.slPrice, '→', currentSlPrice);
        console.log('[TopstepX Chart] - TP: ', this.lastPositions.tpPrice, '→', currentTpPrice);
        console.log('[TopstepX Chart] - Entry:', this.state.entryPrice);
        console.log('[TopstepX Chart] - Side:', this.state.side);
        console.log('[TopstepX Chart] - Instrument:', this.state.instrument);
        
        // Update last positions
        this.lastPositions.slPrice = currentSlPrice;
        this.lastPositions.tpPrice = currentTpPrice;
        
        // Trigger sync with debouncing (if module is available)
        if (typeof window.lineDragSync !== 'undefined') {
          console.log('[TopstepX Chart] 🔄 Calling lineDragSync with:', {
            sl: currentSlPrice,
            tp: currentTpPrice,
            entry: this.state.entryPrice,
            contracts: this.state.contracts
          });
          
          window.lineDragSync.syncWithDebounce(
            currentSlPrice,
            currentTpPrice,
            this.state.entryPrice,
            this.state.instrument,
            this.state.contracts
          );
        }
        
        // Update OrderStore with new positions (with debouncing)
        // This ensures refreshing the page shows lines in their dragged position
        this.updateStoreAfterDrag(currentSlPrice, currentTpPrice);
      }
    }
    
    /**
     * Update OrderStore after drag (with debouncing)
     * Syncs with TopstepX API debouncing
     */
    updateStoreAfterDrag(slPrice, tpPrice) {
      // Clear existing timer
      if (this.storeUpdateTimer) {
        clearTimeout(this.storeUpdateTimer);
      }
      
      // Set new timer (same delay as line drag sync)
      this.storeUpdateTimer = setTimeout(() => {
        if (typeof window.orderStore !== 'undefined' && this.state.entryPrice) {
          console.log('[TopstepX Chart] 🏪 Updating OrderStore with dragged positions');
          console.log('[TopstepX Chart] - New SL:', slPrice);
          console.log('[TopstepX Chart] - New TP:', tpPrice);
          
          this.persistToStore(
            slPrice,
            tpPrice,
            this.state.entryPrice,
            this.state.contracts,
            this.state.instrument,
            this.state.config,
            this.state.side
          );
          
          console.log('[TopstepX Chart] ✅ OrderStore updated - positions will persist on refresh');
        }
      }, 1000); // Same 1 second delay as sync
    }

    /**
     * Clear all lines
     */
    clearLines() {
      // Stop dynamic updates
      this.stopDynamicUpdates();
      
      // Clear any pending store update
      if (this.storeUpdateTimer) {
        clearTimeout(this.storeUpdateTimer);
        this.storeUpdateTimer = null;
      }
      
      // Reset last positions for drag detection
      this.lastPositions = {
        slPrice: null,
        tpPrice: null
      };
      
      if (this.lines.stopLoss) this.removeLine(this.lines.stopLoss);
      if (this.lines.takeProfit) this.removeLine(this.lines.takeProfit);

      this.lines = {
        stopLoss: null,
        takeProfit: null
      };
      
      // Clear state
      this.state = {
        entryPrice: null,
        contracts: 1,
        instrument: null,
        config: null,
        side: null
      };

      console.log('[TopstepX Chart] ✅ All lines cleared');
      
      // Clear from OrderStore
      if (typeof window.orderStore !== 'undefined') {
        window.orderStore.remove();
        console.log('[TopstepX Chart] 🏪 Order store cleared');
      }
    }
    
    /**
     * Persist current lines state to OrderStore
     */
    persistToStore(slPrice, tpPrice, entryPrice, contracts, instrument, config, side) {
      if (typeof window.orderStore === 'undefined') {
        console.warn('[TopstepX Chart] ⚠️ OrderStore not available');
        return;
      }
      
      const orderData = {
        symbol: instrument.symbol,
        entryPrice: entryPrice,
        contracts: contracts,
        // Use actual side from order (not inferred from line positions)
        side: side || 'long' // Fallback to 'long' if not provided
      };
      
      const linesData = {
        slPrice: slPrice,
        tpPrice: tpPrice,
        entryPrice: entryPrice,
        contracts: contracts,
        side: side || 'long', // Save side for proper restoration
        instrument: {
          symbol: instrument.symbol,
          tickSize: instrument.tickSize,
          tickValue: instrument.tickValue
        },
        config: {
          slColor: config.slColor,
          tpColor: config.tpColor,
          lineWidth: config.lineWidth,
          slLineStyle: config.slLineStyle,
          tpLineStyle: config.tpLineStyle,
          fontSize: config.fontSize,
          fontBold: config.fontBold,
          showLabels: config.showLabels,
          labelFormat: config.labelFormat,
          slPrefix: config.slPrefix,
          tpPrefix: config.tpPrefix,
          showDecimals: config.showDecimals,
          showContracts: config.showContracts,
          useEmojis: config.useEmojis
        }
      };
      
      window.orderStore.upsert(orderData, linesData);
      console.log('[TopstepX Chart] 🏪 State persisted to OrderStore');
    }
    
    /**
     * Restore lines from OrderStore (after page reload)
     */
    async restoreFromStore() {
      if (typeof window.orderStore === 'undefined') {
        console.warn('[TopstepX Chart] ⚠️ OrderStore not available');
        return false;
      }
      
      console.log('[TopstepX Chart] 💧 Attempting to restore lines from store...');
      
      const linesData = window.orderStore.getLinesState();
      
      if (!linesData) {
        console.log('[TopstepX Chart] 💧 No lines data in store');
        return false;
      }
      
      console.log('[TopstepX Chart] 💧 Lines data found:', linesData);
      
      try {
        // Validate data
        if (!linesData.slPrice || !linesData.tpPrice || !linesData.entryPrice) {
          console.error('[TopstepX Chart] ❌ Invalid lines data');
          return false;
        }
        
        if (!linesData.instrument || !linesData.config) {
          console.error('[TopstepX Chart] ❌ Missing instrument or config');
          return false;
        }
        
        // Restore lines
        this.updateLines(
          linesData.slPrice,
          linesData.tpPrice,
          linesData.entryPrice,
          linesData.config,
          linesData.contracts,
          linesData.instrument,
          linesData.side || 'long' // Use saved side
        );
        
        console.log('[TopstepX Chart] ✅ Lines restored successfully!');
        return true;
        
      } catch (error) {
        console.error('[TopstepX Chart] ❌ Error restoring lines:', error);
        return false;
      }
    }
  }

  // Export to window
  window.ChartAccess = ChartAccess;

})();

