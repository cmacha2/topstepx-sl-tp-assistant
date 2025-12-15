// Chart Access Module
// Provides access to TradingView chart from main window
(function() {
  'use strict';

  class ChartAccess {
    constructor(apiClient = null, orderContext = null) {
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
        slDollars: 0,
        tpDollars: 0,
        slPrice: null,
        tpPrice: null
      };
      
      // Track last known positions for drag detection
      this.lastKnownPositions = {
        sl: null,
        tp: null
      };
      
      // Polling interval for line position updates
      this.updateInterval = null;
      
      // API client and order context
      this.apiClient = apiClient;
      this.orderContext = orderContext;
      
      // Drag handler
      this.dragHandler = null;
      this.dragUpdateTimer = null;
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
    updateLines(slPrice, tpPrice, entryPrice, config, contracts, instrument) {
      console.log('[TopstepX Chart] 📊 Updating lines...');
      console.log('[TopstepX Chart] SL:', slPrice, 'TP:', tpPrice, 'Entry:', entryPrice);
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

      // Calculate $ values
      const slTicks = Math.abs(entryPrice - slPrice) / instrument.tickSize;
      const tpTicks = Math.abs(tpPrice - entryPrice) / instrument.tickSize;
      
      const slDollars = slTicks * instrument.tickValue * contracts;
      const tpDollars = tpTicks * instrument.tickValue * contracts;
      
      this.state.slDollars = slDollars;
      this.state.tpDollars = tpDollars;
      this.state.slPrice = slPrice;
      this.state.tpPrice = tpPrice;

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
      
      // Setup drag listeners for the lines
      this.setupDragListeners();
      
      // Start monitoring line positions for dynamic updates
      this.startDynamicUpdates();
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
     * Setup drag detection via polling
     * TradingView doesn't have onEntityChanged, so we poll for position changes
     */
    setupDragListeners() {
      // Store initial positions for change detection
      this.lastKnownPositions = {
        sl: null,
        tp: null
      };
      
      // Get initial positions
      this.updateLastKnownPositions();
      
      console.log('[TopstepX Chart] 🎯 Drag detection setup (via polling)');
    }
    
    /**
     * Update last known positions
     */
    updateLastKnownPositions() {
      try {
        if (this.lines.stopLoss) {
          const slShape = this.chart.getShapeById(this.lines.stopLoss);
          if (slShape) {
            const points = slShape.getPoints();
            if (points && points.length > 0) {
              this.lastKnownPositions.sl = points[0].price;
            }
          }
        }
        
        if (this.lines.takeProfit) {
          const tpShape = this.chart.getShapeById(this.lines.takeProfit);
          if (tpShape) {
            const points = tpShape.getPoints();
            if (points && points.length > 0) {
              this.lastKnownPositions.tp = points[0].price;
            }
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }
    
    /**
     * Check if lines have been dragged (called from updateLineLabels)
     */
    checkForDraggedLines() {
      if (!this.chart || !this.lastKnownPositions) return;
      
      try {
        let hasDragged = false;
        
        // Check SL line
        if (this.lines.stopLoss) {
          const slShape = this.chart.getShapeById(this.lines.stopLoss);
          if (slShape) {
            const points = slShape.getPoints();
            if (points && points.length > 0) {
              const currentPrice = points[0].price;
              if (this.lastKnownPositions.sl !== null && 
                  Math.abs(currentPrice - this.lastKnownPositions.sl) > 0.01) {
                console.log(`[TopstepX Chart] 🎯 SL dragged: ${this.lastKnownPositions.sl} → ${currentPrice}`);
                this.lastKnownPositions.sl = currentPrice;
                this.handleLineDragged('SL', currentPrice);
                hasDragged = true;
              }
            }
          }
        }
        
        // Check TP line
        if (this.lines.takeProfit) {
          const tpShape = this.chart.getShapeById(this.lines.takeProfit);
          if (tpShape) {
            const points = tpShape.getPoints();
            if (points && points.length > 0) {
              const currentPrice = points[0].price;
              if (this.lastKnownPositions.tp !== null && 
                  Math.abs(currentPrice - this.lastKnownPositions.tp) > 0.01) {
                console.log(`[TopstepX Chart] 🎯 TP dragged: ${this.lastKnownPositions.tp} → ${currentPrice}`);
                this.lastKnownPositions.tp = currentPrice;
                this.handleLineDragged('TP', currentPrice);
                hasDragged = true;
              }
            }
          }
        }
        
        return hasDragged;
      } catch (e) {
        // Ignore errors during drag detection
        return false;
      }
    }
    
    /**
     * Handle line dragged event
     * @param {string} lineType - 'SL' or 'TP'
     * @param {number} newPrice - New price level
     */
    handleLineDragged(lineType, newPrice) {
      try {
        const { entryPrice, contracts, instrument } = this.state;
        
        if (!entryPrice || !instrument) return;
        
        // Calculate new dollar value
        const ticks = Math.abs(newPrice - entryPrice) / instrument.tickSize;
        const dollars = ticks * instrument.tickValue * contracts;
        
        // Update state
        if (lineType === 'SL') {
          this.state.slDollars = dollars;
          this.state.slPrice = newPrice;
        } else {
          this.state.tpDollars = dollars;
          this.state.tpPrice = newPrice;
        }
        
        console.log(`[TopstepX Chart] 💰 ${lineType} new value: $${dollars.toFixed(2)} @ ${newPrice}`);
        
        // Schedule API update (debounced)
        this.scheduleDragEndUpdate();
        
      } catch (error) {
        console.error('[TopstepX Chart] ❌ Error handling line drag:', error);
      }
    }
    
    /**
     * Schedule API update after drag settles
     * @private
     */
    scheduleDragEndUpdate() {
      // Clear existing timer
      if (this.dragUpdateTimer) {
        clearTimeout(this.dragUpdateTimer);
      }
      
      // Set new timer (800ms debounce - wait for user to finish dragging)
      this.dragUpdateTimer = setTimeout(() => {
        this.onDragEnd();
      }, 800);
    }
    
    /**
     * Handle drag end - update API and storage
     * @private
     */
    async onDragEnd() {
      console.log('[TopstepX Chart] 🏁 Drag ended - updating API...');
      
      const { slDollars, tpDollars, slPrice, tpPrice } = this.state;
      
      // Update order context
      if (this.orderContext && this.orderContext.hasOrder()) {
        this.orderContext.updateSLTP(slPrice, tpPrice, slDollars, tpDollars);
        console.log('[TopstepX Chart] 💾 Order context updated:', { slPrice, tpPrice, slDollars, tpDollars });
      }
      
      // Update position brackets via API
      if (this.apiClient && this.apiClient.isReady()) {
        try {
          console.log('[TopstepX Chart] 📡 Calling API: setPositionBrackets({ risk:', Math.round(slDollars), ', toMake:', Math.round(tpDollars), '})');
          await this.apiClient.updatePositionBrackets(slDollars, tpDollars, true);
          console.log('[TopstepX Chart] ✅ Position brackets updated via API!');
        } catch (error) {
          console.error('[TopstepX Chart] ❌ Failed to update position brackets:', error);
        }
      } else {
        console.warn('[TopstepX Chart] ⚠️ API client not ready. Status:', this.apiClient?.getStatus());
      }
    }
    
    /**
     * Update line labels based on current positions
     * Also checks for dragged lines
     */
    updateLineLabels() {
      // First check if lines have been dragged
      this.checkForDraggedLines();
      if (!this.chart || !this.state.entryPrice) return;
      
      try {
        const { entryPrice, contracts, instrument, config } = this.state;
        
        // Skip if labels are disabled
        if (!config.showLabels) return;
        
        // Get current line prices
        const slShape = this.lines.stopLoss ? this.chart.getShapeById(this.lines.stopLoss) : null;
        const tpShape = this.lines.takeProfit ? this.chart.getShapeById(this.lines.takeProfit) : null;
        
        if (slShape) {
          const slPrice = slShape.getPoints()[0].price;
          const slTicks = Math.abs(entryPrice - slPrice) / instrument.tickSize;
          const slDollars = slTicks * instrument.tickValue * contracts;
          
          // Update text using configured format
          const newText = this.formatLabel('sl', slDollars, contracts, config);
          slShape.setProperties({ text: newText });
        }
        
        if (tpShape) {
          const tpPrice = tpShape.getPoints()[0].price;
          const tpTicks = Math.abs(tpPrice - entryPrice) / instrument.tickSize;
          const tpDollars = tpTicks * instrument.tickValue * contracts;
          
          // Update text using configured format
          const newText = this.formatLabel('tp', tpDollars, contracts, config);
          tpShape.setProperties({ text: newText });
        }
      } catch (e) {
        // Ignore errors (line might have been deleted)
      }
    }

    /**
     * Clear all lines
     */
    clearLines() {
      // Stop dynamic updates
      this.stopDynamicUpdates();
      
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
        slDollars: 0,
        tpDollars: 0,
        slPrice: null,
        tpPrice: null
      };
      
      // Clear last known positions
      this.lastKnownPositions = {
        sl: null,
        tp: null
      };
      
      // Clear drag timer
      if (this.dragUpdateTimer) {
        clearTimeout(this.dragUpdateTimer);
        this.dragUpdateTimer = null;
      }

      console.log('[TopstepX Chart] ✅ All lines cleared');
    }
    
    /**
     * Set API client
     * @param {APIClient} apiClient - API client instance
     */
    setAPIClient(apiClient) {
      this.apiClient = apiClient;
      console.log('[TopstepX Chart] API client set');
    }
    
    /**
     * Set order context
     * @param {OrderContext} orderContext - Order context instance
     */
    setOrderContext(orderContext) {
      this.orderContext = orderContext;
      console.log('[TopstepX Chart] Order context set');
    }
  }

  // Export to window
  window.ChartAccess = ChartAccess;

})();

