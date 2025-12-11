// Instrument Database - Futures contract specifications
// Contains tick sizes and values for all supported futures contracts

const INSTRUMENTS = {
  // Micro E-mini Index Futures
  'MNQ': {
    name: 'Micro E-mini Nasdaq-100',
    tickSize: 0.25,          // Minimum price increment
    tickValue: 0.50,         // Dollar value per tick
    pointValue: 2,           // Dollar value per full point (4 ticks)
    multiplier: 2,           // Contract multiplier
    category: 'micro-index',
    exchange: 'CME'
  },
  'MES': {
    name: 'Micro E-mini S&P 500',
    tickSize: 0.25,
    tickValue: 1.25,
    pointValue: 5,
    multiplier: 5,
    category: 'micro-index',
    exchange: 'CME'
  },
  'MYM': {
    name: 'Micro E-mini Dow',
    tickSize: 1.0,
    tickValue: 0.50,
    pointValue: 0.50,
    multiplier: 0.50,
    category: 'micro-index',
    exchange: 'CBOT'
  },
  'M2K': {
    name: 'Micro E-mini Russell 2000',
    tickSize: 0.10,
    tickValue: 0.50,
    pointValue: 5,
    multiplier: 5,
    category: 'micro-index',
    exchange: 'CME'
  },

  // Full-size E-mini Index Futures
  'ES': {
    name: 'E-mini S&P 500',
    tickSize: 0.25,
    tickValue: 12.50,
    pointValue: 50,
    multiplier: 50,
    category: 'index',
    exchange: 'CME'
  },
  'NQ': {
    name: 'E-mini Nasdaq-100',
    tickSize: 0.25,
    tickValue: 5.00,
    pointValue: 20,
    multiplier: 20,
    category: 'index',
    exchange: 'CME'
  },
  'YM': {
    name: 'E-mini Dow ($5)',
    tickSize: 1.0,
    tickValue: 5.00,
    pointValue: 5,
    multiplier: 5,
    category: 'index',
    exchange: 'CBOT'
  },
  'RTY': {
    name: 'E-mini Russell 2000',
    tickSize: 0.10,
    tickValue: 5.00,
    pointValue: 50,
    multiplier: 50,
    category: 'index',
    exchange: 'CME'
  },

  // Energy Futures
  'CL': {
    name: 'Crude Oil',
    tickSize: 0.01,
    tickValue: 10.00,
    pointValue: 1000,
    multiplier: 1000,
    category: 'energy',
    exchange: 'NYMEX'
  },
  'NG': {
    name: 'Natural Gas',
    tickSize: 0.001,
    tickValue: 10.00,
    pointValue: 10000,
    multiplier: 10000,
    category: 'energy',
    exchange: 'NYMEX'
  },
  'RB': {
    name: 'RBOB Gasoline',
    tickSize: 0.0001,
    tickValue: 4.20,
    pointValue: 42000,
    multiplier: 42000,
    category: 'energy',
    exchange: 'NYMEX'
  },
  'HO': {
    name: 'Heating Oil',
    tickSize: 0.0001,
    tickValue: 4.20,
    pointValue: 42000,
    multiplier: 42000,
    category: 'energy',
    exchange: 'NYMEX'
  },

  // Metal Futures
  'GC': {
    name: 'Gold',
    tickSize: 0.10,
    tickValue: 10.00,
    pointValue: 100,
    multiplier: 100,
    category: 'metals',
    exchange: 'COMEX'
  },
  'SI': {
    name: 'Silver',
    tickSize: 0.005,
    tickValue: 25.00,
    pointValue: 5000,
    multiplier: 5000,
    category: 'metals',
    exchange: 'COMEX'
  },
  'HG': {
    name: 'Copper',
    tickSize: 0.0005,
    tickValue: 12.50,
    pointValue: 25000,
    multiplier: 25000,
    category: 'metals',
    exchange: 'COMEX'
  },
  'PL': {
    name: 'Platinum',
    tickSize: 0.10,
    tickValue: 5.00,
    pointValue: 50,
    multiplier: 50,
    category: 'metals',
    exchange: 'NYMEX'
  },

  // Agricultural Futures
  'ZC': {
    name: 'Corn',
    tickSize: 0.25,
    tickValue: 12.50,
    pointValue: 50,
    multiplier: 50,
    category: 'agricultural',
    exchange: 'CBOT'
  },
  'ZS': {
    name: 'Soybeans',
    tickSize: 0.25,
    tickValue: 12.50,
    pointValue: 50,
    multiplier: 50,
    category: 'agricultural',
    exchange: 'CBOT'
  },
  'ZW': {
    name: 'Wheat',
    tickSize: 0.25,
    tickValue: 12.50,
    pointValue: 50,
    multiplier: 50,
    category: 'agricultural',
    exchange: 'CBOT'
  },

  // Treasury Futures
  'ZN': {
    name: '10-Year T-Note',
    tickSize: 0.015625,      // 1/64
    tickValue: 15.625,
    pointValue: 1000,
    multiplier: 1000,
    category: 'treasury',
    exchange: 'CBOT'
  },
  'ZB': {
    name: '30-Year T-Bond',
    tickSize: 0.03125,       // 1/32
    tickValue: 31.25,
    pointValue: 1000,
    multiplier: 1000,
    category: 'treasury',
    exchange: 'CBOT'
  },
  'ZF': {
    name: '5-Year T-Note',
    tickSize: 0.0078125,     // 1/128
    tickValue: 7.8125,
    pointValue: 1000,
    multiplier: 1000,
    category: 'treasury',
    exchange: 'CBOT'
  },

  // Currency Futures
  'EUR': {
    name: 'Euro FX',
    tickSize: 0.00005,
    tickValue: 6.25,
    pointValue: 125000,
    multiplier: 125000,
    category: 'currency',
    exchange: 'CME'
  },
  'GBP': {
    name: 'British Pound',
    tickSize: 0.0001,
    tickValue: 6.25,
    pointValue: 62500,
    multiplier: 62500,
    category: 'currency',
    exchange: 'CME'
  },
  'JPY': {
    name: 'Japanese Yen',
    tickSize: 0.0000005,
    tickValue: 6.25,
    pointValue: 12500000,
    multiplier: 12500000,
    category: 'currency',
    exchange: 'CME'
  }
};

/**
 * Extract base symbol from full contract symbol
 * Examples:
 *   "MNQZ25" → "MNQ"
 *   "ESH25" → "ES"
 *   "GCJ24" → "GC"
 *
 * @param {string} symbol - Full contract symbol
 * @returns {string} - Base symbol
 */
function extractBaseSymbol(symbol) {
  if (!symbol) return null;

  // Match letters at the start of the symbol
  const match = symbol.match(/^([A-Z]+)/);
  return match ? match[1] : null;
}

/**
 * Get instrument specifications by symbol
 *
 * @param {string} symbol - Full or base symbol (e.g., "MNQZ25" or "MNQ")
 * @returns {object|null} - Instrument specifications or null if not found
 */
function getInstrument(symbol) {
  if (!symbol) return null;

  const baseSymbol = extractBaseSymbol(symbol);
  return INSTRUMENTS[baseSymbol] || null;
}

/**
 * Get tick value for an instrument
 *
 * @param {string} symbol - Full or base symbol
 * @returns {number|null} - Tick value in dollars or null if not found
 */
function getTickValue(symbol) {
  const instrument = getInstrument(symbol);
  return instrument ? instrument.tickValue : null;
}

/**
 * Get tick size for an instrument
 *
 * @param {string} symbol - Full or base symbol
 * @returns {number|null} - Tick size (minimum price increment) or null if not found
 */
function getTickSize(symbol) {
  const instrument = getInstrument(symbol);
  return instrument ? instrument.tickSize : null;
}

/**
 * Get point value for an instrument
 *
 * @param {string} symbol - Full or base symbol
 * @returns {number|null} - Point value in dollars or null if not found
 */
function getPointValue(symbol) {
  const instrument = getInstrument(symbol);
  return instrument ? instrument.pointValue : null;
}

/**
 * Check if an instrument is supported
 *
 * @param {string} symbol - Full or base symbol
 * @returns {boolean} - True if instrument is in the database
 */
function isInstrumentSupported(symbol) {
  return getInstrument(symbol) !== null;
}

/**
 * Get all supported instruments in a category
 *
 * @param {string} category - Category name (e.g., 'micro-index', 'index', 'energy')
 * @returns {array} - Array of instrument objects
 */
function getInstrumentsByCategory(category) {
  return Object.entries(INSTRUMENTS)
    .filter(([_, inst]) => inst.category === category)
    .map(([symbol, inst]) => ({ symbol, ...inst }));
}

/**
 * Get all instrument categories
 *
 * @returns {array} - Array of unique category names
 */
function getCategories() {
  const categories = new Set(
    Object.values(INSTRUMENTS).map(inst => inst.category)
  );
  return Array.from(categories);
}

/**
 * Format instrument name with symbol
 *
 * @param {string} symbol - Full or base symbol
 * @returns {string} - Formatted name (e.g., "MNQ - Micro E-mini Nasdaq-100")
 */
function formatInstrumentName(symbol) {
  const instrument = getInstrument(symbol);
  if (!instrument) return symbol;

  const baseSymbol = extractBaseSymbol(symbol);
  return `${baseSymbol} - ${instrument.name}`;
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment (for testing)
  module.exports = {
    INSTRUMENTS,
    extractBaseSymbol,
    getInstrument,
    getTickValue,
    getTickSize,
    getPointValue,
    isInstrumentSupported,
    getInstrumentsByCategory,
    getCategories,
    formatInstrumentName
  };
} else if (typeof window !== 'undefined') {
  // Browser environment - expose to window
  window.InstrumentDatabase = {
    INSTRUMENTS,
    extractBaseSymbol,
    getInstrument,
    getTickValue,
    getTickSize,
    getPointValue,
    isInstrumentSupported,
    getInstrumentsByCategory,
    getCategories,
    formatInstrumentName
  };
}
