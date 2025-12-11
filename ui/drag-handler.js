// Drag Handler - Interactive line manipulation
// Handles user dragging of Stop Loss and Take Profit lines

/**
 * Drag Handler Class
 * Manages drag events and recalculations when lines are moved
 */
class DragHandler {
  /**
   * @param {object} chart - TradingView chart instance
   * @param {CalculationEngine} calculationEngine - Calculation engine instance
   * @param {LineRenderer} lineRenderer - Line renderer instance
   */
  constructor(chart, calculationEngine, lineRenderer) {
    this.chart = chart;
    this.calc = calculationEngine;
    this.renderer = lineRenderer;
    this.isDragging = false;
    this.listeners = new Map();
    this.currentState = null;
  }

  /**
   * Attach drag listeners to a line
   * @param {string} lineId - Line ID to attach listeners to
   * @param {string} lineType - 'SL' or 'TP'
   */
  attachDragListeners(lineId, lineType) {
    if (!this.chart || !lineId) {
      console.warn('[DragHandler] Cannot attach listeners: invalid parameters');
      return;
    }

    try {
      // Subscribe to shape changed event
      this.chart.onEntityChanged(lineId, (entity) => {
        this.handleLineDragged(lineType, entity);
      });

      console.log(`[DragHandler] Attached listeners to ${lineType} line:`, lineId);
    } catch (error) {
      console.error('[DragHandler] Failed to attach drag listeners:', error);
    }
  }

  /**
   * Handle line dragged event
   * @param {string} lineType - 'SL' or 'TP'
   * @param {object} entity - Line entity
   */
  handleLineDragged(lineType, entity) {
    if (!this.currentState) {
      console.warn('[DragHandler] No current state available');
      return;
    }

    try {
      // Get new price from entity
      const points = entity.getPoints();
      if (!points || points.length === 0) {
        return;
      }

      const newPrice = points[0].price;

      // Prevent processing if price hasn't actually changed
      if (lineType === 'SL' && newPrice === this.currentState.slPrice) {
        return;
      }
      if (lineType === 'TP' && newPrice === this.currentState.tpPrice) {
        return;
      }

      console.log(`[DragHandler] ${lineType} line dragged to:`, newPrice);

      // Process the drag
      this.onLineDragged(lineType, newPrice);
    } catch (error) {
      console.error('[DragHandler] Error handling line drag:', error);
    }
  }

  /**
   * Process line drag and recalculate
   * @param {string} lineType - 'SL' or 'TP'
   * @param {number} newPrice - New price level
   */
  onLineDragged(lineType, newPrice) {
    const {
      entryPrice,
      contracts,
      instrument,
      tickValue,
      tickSize,
      side
    } = this.currentState;

    // Round price to nearest tick
    const roundedPrice = this.calc.roundToTick(newPrice, tickSize);

    // Calculate new dollar P&L
    const newDollars = this.calc.calculateDollarsFromPrice(
      entryPrice,
      roundedPrice,
      contracts || 1,  // Use 1 contract if contracts not set yet
      tickValue,
      tickSize
    );

    // Update the line's price to rounded value
    if (lineType === 'SL') {
      this.renderer.updateLinePosition(this.renderer.slLineId, roundedPrice);
      this.currentState.slPrice = roundedPrice;
      this.currentState.slDollars = Math.abs(newDollars);
    } else {
      this.renderer.updateLinePosition(this.renderer.tpLineId, roundedPrice);
      this.currentState.tpPrice = roundedPrice;
      this.currentState.tpDollars = Math.abs(newDollars);
    }

    // Update line label
    this.updateLineLabel(lineType, Math.abs(newDollars));

    // Recalculate contracts if SL was moved
    if (lineType === 'SL' && this.currentState.riskDollars) {
      const ticksToSL = this.calc.priceDiffToTicks(
        entryPrice,
        roundedPrice,
        tickSize
      );

      const newContracts = this.calc.calculateContracts(
        this.currentState.riskDollars,
        ticksToSL,
        tickValue
      );

      this.currentState.contracts = newContracts;

      // Notify parent about new contract quantity
      this.notifyParent({
        type: 'UPDATE_CONTRACTS',
        contracts: newContracts
      });
    }

    // Notify parent about the drag event
    this.notifyParent({
      type: 'LINE_DRAGGED',
      lineType: lineType,
      newPrice: roundedPrice,
      newDollars: Math.abs(newDollars),
      state: this.currentState
    });

    console.log(`[DragHandler] ${lineType} updated:`, {
      price: roundedPrice,
      dollars: Math.abs(newDollars),
      contracts: this.currentState.contracts
    });
  }

  /**
   * Update line label with new dollar amount
   * @param {string} lineType - 'SL' or 'TP'
   * @param {number} dollars - Dollar amount
   */
  updateLineLabel(lineType, dollars) {
    const lineId = lineType === 'SL' ?
      this.renderer.slLineId :
      this.renderer.tpLineId;

    if (!lineId) {
      return;
    }

    const label = `${lineType}: $${dollars.toFixed(2)}`;
    this.renderer.updateLineLabel(lineId, label);
  }

  /**
   * Set current trading state
   * @param {object} state - Current state object
   */
  setState(state) {
    this.currentState = state;
    console.log('[DragHandler] State updated:', state);
  }

  /**
   * Get current state
   * @returns {object|null} - Current state
   */
  getState() {
    return this.currentState;
  }

  /**
   * Notify parent window
   * @param {object} data - Data to send to parent
   */
  notifyParent(data) {
    if (window.parent === window) {
      return;
    }

    window.parent.postMessage({
      source: 'topstep-sltp-extension',
      ...data,
      timestamp: Date.now()
    }, '*');
  }

  /**
   * Enable drag mode
   */
  enableDrag() {
    this.isDragging = false;
    console.log('[DragHandler] Drag enabled');
  }

  /**
   * Disable drag mode
   */
  disableDrag() {
    this.isDragging = false;
    console.log('[DragHandler] Drag disabled');
  }

  /**
   * Detach all listeners
   */
  detachAllListeners() {
    this.listeners.clear();
    console.log('[DragHandler] All listeners detached');
  }

  /**
   * Reset drag handler state
   */
  reset() {
    this.currentState = null;
    this.isDragging = false;
    this.listeners.clear();
    console.log('[DragHandler] Reset');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment (for testing)
  module.exports = DragHandler;
}
