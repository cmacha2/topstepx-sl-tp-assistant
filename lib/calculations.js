// Calculation Engine - Risk management and P&L calculations
// Handles all calculations for stop loss, take profit, and contract sizing

/**
 * Calculation Engine Class
 * Provides methods for risk calculation, price level calculation,
 * and contract quantity determination
 */
class CalculationEngine {
  /**
   * Calculate risk amount in dollars
   *
   * @param {string} riskMode - 'percent' or 'fixed'
   * @param {number} riskAmount - Risk percentage (if percent mode) or fixed dollar amount
   * @param {number} accountSize - Total account size in dollars
   * @returns {number} - Risk amount in dollars
   *
   * Examples:
   *   ('percent', 2, 50000) → $1,000
   *   ('fixed', 500, 50000) → $500
   */
  calculateRiskInDollars(riskMode, riskAmount, accountSize) {
    if (riskMode === 'percent') {
      return (riskAmount / 100) * accountSize;
    }
    return riskAmount;
  }

  /**
   * Convert dollar P&L to number of ticks
   *
   * @param {number} dollars - Dollar amount
   * @param {number} tickValue - Dollar value per tick
   * @returns {number} - Number of ticks
   *
   * Example:
   *   (100, 0.50) → 200 ticks
   *   (150, 12.50) → 12 ticks
   */
  dollarsToTicks(dollars, tickValue) {
    if (tickValue === 0) {
      throw new Error('Tick value cannot be zero');
    }
    return Math.abs(dollars) / tickValue;
  }

  /**
   * Convert ticks to dollar P&L
   *
   * @param {number} ticks - Number of ticks
   * @param {number} tickValue - Dollar value per tick
   * @param {number} contracts - Number of contracts (default: 1)
   * @returns {number} - Dollar amount
   *
   * Example:
   *   (200, 0.50, 1) → $100
   *   (200, 0.50, 10) → $1,000
   */
  ticksToDollars(ticks, tickValue, contracts = 1) {
    return ticks * tickValue * contracts;
  }

  /**
   * Calculate Stop Loss price level
   *
   * @param {number} entryPrice - Entry price
   * @param {number} slDollars - Stop loss in dollars (per contract)
   * @param {number} tickValue - Dollar value per tick
   * @param {number} tickSize - Minimum price increment
   * @param {string} side - 'long' or 'short'
   * @returns {number} - Stop loss price level
   *
   * Example:
   *   (21450, 100, 0.50, 0.25, 'long') → 21400
   *   Entry: 21450, SL: $100/0.50 = 200 ticks, 200*0.25 = 50 points
   *   Long SL: 21450 - 50 = 21400
   */
  calculateStopLossPrice(entryPrice, slDollars, tickValue, tickSize, side) {
    const ticks = this.dollarsToTicks(slDollars, tickValue);
    const priceMovement = ticks * tickSize;

    if (side === 'long') {
      return entryPrice - priceMovement;
    } else {
      return entryPrice + priceMovement;
    }
  }

  /**
   * Calculate Take Profit price level
   *
   * @param {number} entryPrice - Entry price
   * @param {number} tpDollars - Take profit in dollars (per contract)
   * @param {number} tickValue - Dollar value per tick
   * @param {number} tickSize - Minimum price increment
   * @param {string} side - 'long' or 'short'
   * @returns {number} - Take profit price level
   *
   * Example:
   *   (21450, 200, 0.50, 0.25, 'long') → 21550
   *   Entry: 21450, TP: $200/0.50 = 400 ticks, 400*0.25 = 100 points
   *   Long TP: 21450 + 100 = 21550
   */
  calculateTakeProfitPrice(entryPrice, tpDollars, tickValue, tickSize, side) {
    const ticks = this.dollarsToTicks(tpDollars, tickValue);
    const priceMovement = ticks * tickSize;

    if (side === 'long') {
      return entryPrice + priceMovement;
    } else {
      return entryPrice - priceMovement;
    }
  }

  /**
   * Calculate number of contracts based on risk
   *
   * @param {number} riskDollars - Total risk in dollars
   * @param {number} ticksToSL - Number of ticks to stop loss
   * @param {number} tickValue - Dollar value per tick
   * @returns {number} - Number of contracts (rounded down)
   *
   * Example:
   *   (1000, 200, 0.50) → 10 contracts
   *   Risk: $1,000 / (200 ticks * $0.50) = $1,000 / $100 = 10
   */
  calculateContracts(riskDollars, ticksToSL, tickValue) {
    if (ticksToSL === 0) {
      throw new Error('Ticks to stop loss cannot be zero');
    }

    const dollarRiskPerContract = ticksToSL * tickValue;
    const contracts = riskDollars / dollarRiskPerContract;

    return Math.floor(contracts);
  }

  /**
   * Calculate dollar P&L from price difference
   * Used when user drags a line to recalculate P&L
   *
   * @param {number} entryPrice - Entry price
   * @param {number} targetPrice - Target price (SL or TP)
   * @param {number} contracts - Number of contracts
   * @param {number} tickValue - Dollar value per tick
   * @param {number} tickSize - Minimum price increment
   * @returns {number} - Dollar P&L (positive or negative)
   *
   * Example:
   *   (21450, 21400, 10, 0.50, 0.25) → -$1,000
   *   Price diff: 21450 - 21400 = 50 points
   *   Ticks: 50 / 0.25 = 200 ticks
   *   P&L: 200 * $0.50 * 10 = $1,000 (negative because it's a loss)
   */
  calculateDollarsFromPrice(entryPrice, targetPrice, contracts, tickValue, tickSize) {
    const priceDiff = targetPrice - entryPrice;
    const ticks = Math.abs(priceDiff) / tickSize;
    const dollars = ticks * tickValue * contracts;

    // Return negative if it's a loss (target below entry for long)
    return priceDiff < 0 ? -dollars : dollars;
  }

  /**
   * Apply risk:reward ratio to calculate TP from SL
   *
   * @param {number} slDollars - Stop loss in dollars
   * @param {number} ratio - Risk:reward ratio (e.g., 2 for 1:2)
   * @returns {number} - Take profit in dollars
   *
   * Example:
   *   (100, 2) → $200
   *   (150, 3) → $450
   */
  applyRatioToTP(slDollars, ratio) {
    return slDollars * ratio;
  }

  /**
   * Round price to nearest tick
   *
   * @param {number} price - Price to round
   * @param {number} tickSize - Minimum price increment
   * @returns {number} - Rounded price
   *
   * Example:
   *   (21450.37, 0.25) → 21450.25
   *   (5850.16, 0.25) → 5850.00
   */
  roundToTick(price, tickSize) {
    return Math.round(price / tickSize) * tickSize;
  }

  /**
   * Calculate price difference in ticks
   *
   * @param {number} price1 - First price
   * @param {number} price2 - Second price
   * @param {number} tickSize - Minimum price increment
   * @returns {number} - Number of ticks difference
   *
   * Example:
   *   (21450, 21400, 0.25) → 200 ticks
   */
  priceDiffToTicks(price1, price2, tickSize) {
    return Math.abs(price1 - price2) / tickSize;
  }

  /**
   * Detect trade side based on order type or current position
   * This is a helper function that may need to be enhanced based on UI
   *
   * @param {string} orderType - 'buy' or 'sell'
   * @returns {string} - 'long' or 'short'
   */
  detectSide(orderType) {
    if (orderType && orderType.toLowerCase().includes('buy')) {
      return 'long';
    }
    if (orderType && orderType.toLowerCase().includes('sell')) {
      return 'short';
    }
    // Default to long if unclear
    return 'long';
  }

  /**
   * Validate calculation inputs
   *
   * @param {object} params - Calculation parameters
   * @returns {object} - { valid: boolean, errors: array }
   */
  validateInputs(params) {
    const errors = [];

    if (!params.entryPrice || params.entryPrice <= 0) {
      errors.push('Entry price must be greater than 0');
    }

    if (!params.tickValue || params.tickValue <= 0) {
      errors.push('Tick value must be greater than 0');
    }

    if (!params.tickSize || params.tickSize <= 0) {
      errors.push('Tick size must be greater than 0');
    }

    if (params.riskDollars !== undefined && params.riskDollars <= 0) {
      errors.push('Risk amount must be greater than 0');
    }

    if (params.slDollars !== undefined && params.slDollars <= 0) {
      errors.push('Stop loss amount must be greater than 0');
    }

    if (params.tpDollars !== undefined && params.tpDollars <= 0) {
      errors.push('Take profit amount must be greater than 0');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Complete calculation flow for SL/TP and contracts
   * Main method that combines all calculations
   *
   * @param {object} config - Configuration object
   * @returns {object} - Complete calculation results
   *
   * Example config:
   * {
   *   riskMode: 'percent',
   *   riskAmount: 2,
   *   accountSize: 50000,
   *   entryPrice: 21450,
   *   slDollars: 100,
   *   useRatio: true,
   *   tpRatio: 2,
   *   tpDollars: 200,  // ignored if useRatio is true
   *   tickValue: 0.50,
   *   tickSize: 0.25,
   *   side: 'long'
   * }
   */
  calculateAll(config) {
    // Validate inputs
    const validation = this.validateInputs(config);
    if (!validation.valid) {
      throw new Error(`Invalid inputs: ${validation.errors.join(', ')}`);
    }

    // Calculate risk in dollars
    const riskDollars = this.calculateRiskInDollars(
      config.riskMode,
      config.riskAmount,
      config.accountSize
    );

    // Determine TP dollars
    let tpDollars;
    if (config.useRatio) {
      tpDollars = this.applyRatioToTP(config.slDollars, config.tpRatio);
    } else {
      tpDollars = config.tpDollars;
    }

    // Calculate price levels
    const slPrice = this.calculateStopLossPrice(
      config.entryPrice,
      config.slDollars,
      config.tickValue,
      config.tickSize,
      config.side
    );

    const tpPrice = this.calculateTakeProfitPrice(
      config.entryPrice,
      tpDollars,
      config.tickValue,
      config.tickSize,
      config.side
    );

    // Round to nearest tick
    const slPriceRounded = this.roundToTick(slPrice, config.tickSize);
    const tpPriceRounded = this.roundToTick(tpPrice, config.tickSize);

    // Calculate ticks to SL
    const ticksToSL = this.priceDiffToTicks(
      config.entryPrice,
      slPriceRounded,
      config.tickSize
    );

    // Calculate contracts
    const contracts = this.calculateContracts(
      riskDollars,
      ticksToSL,
      config.tickValue
    );

    // Calculate actual dollar risk with rounded contracts
    const actualDollarRisk = this.ticksToDollars(
      ticksToSL,
      config.tickValue,
      contracts
    );

    // Calculate ticks to TP
    const ticksToTP = this.priceDiffToTicks(
      config.entryPrice,
      tpPriceRounded,
      config.tickSize
    );

    // Calculate actual dollar profit
    const actualDollarProfit = this.ticksToDollars(
      ticksToTP,
      config.tickValue,
      contracts
    );

    return {
      riskDollars,
      slDollars: config.slDollars,
      tpDollars,
      slPrice: slPriceRounded,
      tpPrice: tpPriceRounded,
      contracts,
      ticksToSL,
      ticksToTP,
      actualDollarRisk,
      actualDollarProfit,
      actualRatio: actualDollarProfit / actualDollarRisk
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment (for testing)
  module.exports = CalculationEngine;
} else if (typeof window !== 'undefined') {
  // Browser environment - expose to window
  window.CalculationEngine = CalculationEngine;
}
