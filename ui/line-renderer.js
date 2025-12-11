// Line Renderer - TradingView chart line drawing
// Handles creation and management of Stop Loss and Take Profit lines

/**
 * Line Renderer Class
 * Manages drawing and updating lines on TradingView chart
 */
class LineRenderer {
  /**
   * @param {object} tvWidget - TradingView widget instance
   */
  constructor(tvWidget = null) {
    this.widget = tvWidget;
    this.chart = null;
    this.slLineId = null;
    this.tpLineId = null;
    this.isReady = false;
  }

  /**
   * Initialize renderer
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Wait for TradingView widget
      await this.waitForWidget();

      // Get active chart
      if (this.widget && this.widget.activeChart) {
        this.chart = this.widget.activeChart();
        this.isReady = true;
        console.log('[LineRenderer] Initialized successfully');
      } else {
        throw new Error('Unable to access TradingView chart');
      }
    } catch (error) {
      console.error('[LineRenderer] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Wait for TradingView widget to be available
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<void>}
   */
  async waitForWidget(timeout = 10000) {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkWidget = () => {
        // Check if we've timed out
        if (Date.now() - startTime > timeout) {
          reject(new Error('TradingView widget timeout'));
          return;
        }

        // Try to find widget
        if (window.tvWidget && window.tvWidget.onChartReady) {
          // Widget found, wait for chart ready
          window.tvWidget.onChartReady(() => {
            this.widget = window.tvWidget;
            resolve();
          });
        } else if (window.TradingView) {
          // Check for TradingView global
          setTimeout(checkWidget, 100);
        } else {
          // Keep checking
          setTimeout(checkWidget, 100);
        }
      };

      checkWidget();
    });
  }

  /**
   * Create Stop Loss line
   * @param {number} price - Price level for the line
   * @param {object} config - Line configuration
   * @returns {string|null} - Line ID or null if failed
   */
  createStopLossLine(price, config = {}) {
    if (!this.isReady || !this.chart) {
      console.warn('[LineRenderer] Not ready to create line');
      return null;
    }

    try {
      // Remove existing SL line
      if (this.slLineId) {
        this.removeLine(this.slLineId);
      }

      // Default configuration
      const lineConfig = {
        linecolor: config.slColor || '#FF0000',
        linewidth: config.lineWidth || 2,
        linestyle: this.getLineStyle(config.slLineStyle || 'solid'),
        showLabel: config.showLabels !== false,
        text: config.slDollars ? `SL: $${config.slDollars}` : 'Stop Loss',
        textcolor: config.slColor || '#FF0000',
        fontsize: 12,
        horzLabelsAlign: 'right',
        vertLabelsAlign: 'middle'
      };

      // Create horizontal line
      this.slLineId = this.chart.createShape(
        { time: this.getCurrentTime(), price: price },
        {
          shape: 'horizontal_line',
          overrides: lineConfig,
          zOrder: 'top',
          disableSelection: false,
          disableSave: true,
          disableUndo: true
        }
      );

      console.log('[LineRenderer] SL line created:', this.slLineId);
      return this.slLineId;
    } catch (error) {
      console.error('[LineRenderer] Failed to create SL line:', error);
      return null;
    }
  }

  /**
   * Create Take Profit line
   * @param {number} price - Price level for the line
   * @param {object} config - Line configuration
   * @returns {string|null} - Line ID or null if failed
   */
  createTakeProfitLine(price, config = {}) {
    if (!this.isReady || !this.chart) {
      console.warn('[LineRenderer] Not ready to create line');
      return null;
    }

    try {
      // Remove existing TP line
      if (this.tpLineId) {
        this.removeLine(this.tpLineId);
      }

      // Default configuration
      const lineConfig = {
        linecolor: config.tpColor || '#00FF00',
        linewidth: config.lineWidth || 2,
        linestyle: this.getLineStyle(config.tpLineStyle || 'solid'),
        showLabel: config.showLabels !== false,
        text: config.tpDollars ? `TP: $${config.tpDollars}` : 'Take Profit',
        textcolor: config.tpColor || '#00FF00',
        fontsize: 12,
        horzLabelsAlign: 'right',
        vertLabelsAlign: 'middle'
      };

      // Create horizontal line
      this.tpLineId = this.chart.createShape(
        { time: this.getCurrentTime(), price: price },
        {
          shape: 'horizontal_line',
          overrides: lineConfig,
          zOrder: 'top',
          disableSelection: false,
          disableSave: true,
          disableUndo: true
        }
      );

      console.log('[LineRenderer] TP line created:', this.tpLineId);
      return this.tpLineId;
    } catch (error) {
      console.error('[LineRenderer] Failed to create TP line:', error);
      return null;
    }
  }

  /**
   * Create Entry line
   * @param {number} price - Price level for the line
   * @param {object} config - Line configuration
   * @returns {string|null} - Line ID or null if failed
   */
  createEntryLine(price, config = {}) {
    if (!this.isReady || !this.chart) {
      console.warn('[LineRenderer] Not ready to create line');
      return null;
    }

    try {
      // Default configuration
      const lineConfig = {
        linecolor: config.color || '#FFFFFF',
        linewidth: config.width || 1,
        linestyle: this.getLineStyle('solid'),
        showLabel: config.showLabels !== false,
        text: config.text || 'Entry',
        textcolor: config.color || '#FFFFFF',
        fontsize: 10,
        horzLabelsAlign: 'right',
        vertLabelsAlign: 'middle',
        opacity: 60
      };

      // Create horizontal line
      const entryLineId = this.chart.createShape(
        { time: this.getCurrentTime(), price: price },
        {
          shape: 'horizontal_line',
          overrides: lineConfig,
          zOrder: 'top',
          disableSelection: true,
          disableSave: true,
          disableUndo: true
        }
      );

      console.log('[LineRenderer] Entry line created:', entryLineId);
      return entryLineId;
    } catch (error) {
      console.error('[LineRenderer] Failed to create entry line:', error);
      return null;
    }
  }

  /**
   * Update line position
   * @param {string} lineId - Line ID
   * @param {number} newPrice - New price level
   * @returns {boolean} - True if successful
   */
  updateLinePosition(lineId, newPrice) {
    if (!this.chart || !lineId) {
      return false;
    }

    try {
      const entity = this.chart.getShapeById(lineId);
      if (entity) {
        entity.setPoints([{ time: this.getCurrentTime(), price: newPrice }]);
        return true;
      }
    } catch (error) {
      console.error('[LineRenderer] Failed to update line position:', error);
    }

    return false;
  }

  /**
   * Update line label
   * @param {string} lineId - Line ID
   * @param {string} text - New label text
   * @returns {boolean} - True if successful
   */
  updateLineLabel(lineId, text) {
    if (!this.chart || !lineId) {
      return false;
    }

    try {
      const entity = this.chart.getShapeById(lineId);
      if (entity) {
        entity.setProperties({ text: text });
        return true;
      }
    } catch (error) {
      console.error('[LineRenderer] Failed to update line label:', error);
    }

    return false;
  }

  /**
   * Get line by ID
   * @param {string} lineId - Line ID
   * @returns {object|null} - Line entity or null
   */
  getLine(lineId) {
    if (!this.chart || !lineId) {
      return null;
    }

    try {
      return this.chart.getShapeById(lineId);
    } catch (error) {
      console.error('[LineRenderer] Failed to get line:', error);
      return null;
    }
  }

  /**
   * Remove line by ID
   * @param {string} lineId - Line ID to remove
   * @returns {boolean} - True if successful
   */
  removeLine(lineId) {
    if (!this.chart || !lineId) {
      return false;
    }

    try {
      this.chart.removeEntity(lineId);
      console.log('[LineRenderer] Line removed:', lineId);
      return true;
    } catch (error) {
      console.error('[LineRenderer] Failed to remove line:', error);
      return false;
    }
  }

  /**
   * Remove all lines
   */
  removeAllLines() {
    if (this.slLineId) {
      this.removeLine(this.slLineId);
      this.slLineId = null;
    }

    if (this.tpLineId) {
      this.removeLine(this.tpLineId);
      this.tpLineId = null;
    }

    console.log('[LineRenderer] All lines removed');
  }

  /**
   * Get current time for line placement
   * @returns {number} - Current timestamp
   */
  getCurrentTime() {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * Convert line style string to TradingView constant
   * @param {string} style - Style name ('solid', 'dashed', 'dotted')
   * @returns {number} - TradingView line style constant
   */
  getLineStyle(style) {
    const styles = {
      'solid': 0,
      'dashed': 1,
      'dotted': 2
    };

    return styles[style] || 0;
  }

  /**
   * Check if lines exist
   * @returns {object} - { sl: boolean, tp: boolean }
   */
  hasLines() {
    return {
      sl: this.slLineId !== null,
      tp: this.tpLineId !== null
    };
  }

  /**
   * Get line IDs
   * @returns {object} - { sl: string|null, tp: string|null }
   */
  getLineIds() {
    return {
      sl: this.slLineId,
      tp: this.tpLineId
    };
  }

  /**
   * Check if renderer is ready
   * @returns {boolean}
   */
  isRendererReady() {
    return this.isReady;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment (for testing)
  module.exports = LineRenderer;
}
