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
        config: null
      };
      
      // Polling interval for line position updates
      this.updateInterval = null;
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
              linewidth: options.width || 1,  // Líneas más finas por defecto
              linestyle: options.style || 0, // 0 = solid, 1 = dotted, 2 = dashed
              showLabel: true,
              textcolor: options.color || '#FF0000',
              fontsize: 10,  // Texto más pequeño
              bold: false,   // Sin negrita para que sea más fino
              text: options.text || ''
            },
            lock: false,
            disableSelection: false,
            disableSave: true,
            disableUndo: false
          }
        );

        console.log('[TopstepX Chart] ✅ Line created:', lineId, 'at price', price, `(width: ${options.width}px)`);
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
     * Update SL/TP lines
     */
    updateLines(slPrice, tpPrice, entryPrice, config, contracts, instrument) {
      console.log('[TopstepX Chart] 📊 Updating lines...');
      console.log('[TopstepX Chart] SL:', slPrice, 'TP:', tpPrice, 'Entry:', entryPrice);
      console.log('[TopstepX Chart] Contracts:', contracts, '| Width:', config.lineWidth + 'px');

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

      console.log('[TopstepX Chart] 🔴 SL Loss: -$' + slDollars.toFixed(2));
      console.log('[TopstepX Chart] 🟢 TP Profit: +$' + tpDollars.toFixed(2));

      // Remove old lines
      if (this.lines.stopLoss) this.removeLine(this.lines.stopLoss);
      if (this.lines.takeProfit) this.removeLine(this.lines.takeProfit);

      // Format labels - texto corto y compacto
      const slLabel = `SL -$${slDollars.toFixed(0)} (${contracts}x)`;
      const tpLabel = `TP +$${tpDollars.toFixed(0)} (${contracts}x)`;

      // Create new lines with configured width
      this.lines.stopLoss = this.createLine(slPrice, {
        color: config.slColor || '#FF0000',
        width: config.lineWidth || 1,
        style: 0, // solid
        text: config.showLabels ? slLabel : ''
      });

      this.lines.takeProfit = this.createLine(tpPrice, {
        color: config.tpColor || '#00FF00',
        width: config.lineWidth || 1,
        style: 0, // solid
        text: config.showLabels ? tpLabel : ''
      });

      console.log('[TopstepX Chart] ✅ Lines created with width:', config.lineWidth + 'px');
      
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
     * Update line labels based on current positions
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
        
        if (slShape) {
          const slPrice = slShape.getPoints()[0].price;
          const slTicks = Math.abs(entryPrice - slPrice) / instrument.tickSize;
          const slDollars = slTicks * instrument.tickValue * contracts;
          
          // Update text - corto y compacto
          const newText = `SL -$${slDollars.toFixed(0)} (${contracts}x)`;
          slShape.setProperties({ text: newText });
        }
        
        if (tpShape) {
          const tpPrice = tpShape.getPoints()[0].price;
          const tpTicks = Math.abs(tpPrice - entryPrice) / instrument.tickSize;
          const tpDollars = tpTicks * instrument.tickValue * contracts;
          
          // Update text - corto y compacto
          const newText = `TP +$${tpDollars.toFixed(0)} (${contracts}x)`;
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
        config: null
      };

      console.log('[TopstepX Chart] ✅ All lines cleared');
    }
  }

  // Export to window
  window.ChartAccess = ChartAccess;

})();

