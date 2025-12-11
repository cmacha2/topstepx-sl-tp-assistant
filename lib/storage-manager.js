// Storage Manager - Chrome storage abstraction layer
// Manages extension configuration and trade state persistence

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  // Risk Management
  riskMode: 'percent',           // 'percent' or 'fixed'
  riskPercent: 2,                // 2% of account
  riskFixed: 500,                // $500 fixed risk
  accountSize: 50000,            // $50,000 account

  // Stop Loss & Take Profit
  defaultSL: 100,                // $100 loss per contract
  defaultTP: 200,                // $200 profit per contract
  tpRatio: 2,                    // 1:2 risk:reward ratio
  useRatio: true,                // Auto-calculate TP from SL using ratio

  // Visual Settings - Lines
  slColor: '#FF0000',            // Red for stop loss
  tpColor: '#00FF00',            // Green for take profit
  lineWidth: 1,                  // Line thickness (1-10)
  slLineStyle: 0,                // 0=solid, 1=dotted, 2=dashed
  tpLineStyle: 0,                // 0=solid, 1=dotted, 2=dashed
  lineOpacity: 100,              // Line opacity (0-100%)

  // Visual Settings - Text
  fontSize: 10,                  // Label font size (8-16px)
  fontBold: false,               // Bold text
  showLabels: true,              // Show dollar amounts on lines
  labelFormat: 'compact',        // 'compact', 'full', 'minimal'
  showDecimals: false,           // Show decimal places
  showContracts: true,           // Show contract count (1x, 2x)
  
  // Label Text Customization
  slPrefix: 'SL',                // Stop Loss prefix
  tpPrefix: 'TP',                // Take Profit prefix
  useEmojis: false,              // Use emoji icons (🛑 🎯)

  // Options
  persistLines: true,            // Keep lines across sessions
  autoUpdate: true,              // Auto-update on price/instrument change
  playSound: false,              // Sound alert when lines drawn
  autoHideOnMarket: true,        // Hide lines for market orders

  // Advanced
  roundContracts: 'down',        // 'down', 'up', 'nearest'
  minContracts: 1,               // Minimum contracts to trade
  maxContracts: 100              // Maximum contracts (safety limit)
};

/**
 * Storage Manager Class
 * Handles all Chrome storage operations
 */
class StorageManager {
  constructor() {
    this.configKey = 'topstep_sltp_config';
    this.tradeStateKey = 'topstep_sltp_trade_state';
  }

  /**
   * Get current configuration
   * @returns {Promise<object>} - Configuration object
   */
  async getConfig() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get(this.configKey, (result) => {
          resolve(result[this.configKey] || DEFAULT_CONFIG);
        });
      } else {
        // Fallback for environments without chrome.storage
        resolve(DEFAULT_CONFIG);
      }
    });
  }

  /**
   * Save complete configuration
   * @param {object} config - Configuration object to save
   * @returns {Promise<void>}
   */
  async saveConfig(config) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const data = {};
        data[this.configKey] = config;
        chrome.storage.sync.set(data, () => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Update specific configuration fields
   * @param {object} updates - Partial configuration updates
   * @returns {Promise<object>} - Updated configuration
   */
  async updateConfig(updates) {
    const config = await this.getConfig();
    const newConfig = { ...config, ...updates };
    await this.saveConfig(newConfig);
    return newConfig;
  }

  /**
   * Reset configuration to defaults
   * @returns {Promise<object>} - Default configuration
   */
  async resetConfig() {
    await this.saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }

  /**
   * Get specific config value
   * @param {string} key - Configuration key
   * @param {*} defaultValue - Default value if key not found
   * @returns {Promise<*>} - Configuration value
   */
  async getConfigValue(key, defaultValue = null) {
    const config = await this.getConfig();
    return config[key] !== undefined ? config[key] : defaultValue;
  }

  /**
   * Set specific config value
   * @param {string} key - Configuration key
   * @param {*} value - Value to set
   * @returns {Promise<void>}
   */
  async setConfigValue(key, value) {
    const updates = {};
    updates[key] = value;
    await this.updateConfig(updates);
  }

  /**
   * Save current trade state (session storage)
   * @param {object} state - Trade state object
   * @returns {Promise<void>}
   *
   * State object example:
   * {
   *   instrument: 'MNQZ25',
   *   entryPrice: 21450,
   *   slPrice: 21400,
   *   tpPrice: 21550,
   *   contracts: 10,
   *   side: 'long',
   *   timestamp: Date.now()
   * }
   */
  async saveTradeState(state) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const data = {};
        data[this.tradeStateKey] = state;
        chrome.storage.local.set(data, () => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get current trade state
   * @returns {Promise<object|null>} - Trade state or null if none saved
   */
  async getTradeState() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(this.tradeStateKey, (result) => {
          resolve(result[this.tradeStateKey] || null);
        });
      } else {
        resolve(null);
      }
    });
  }

  /**
   * Clear trade state
   * @returns {Promise<void>}
   */
  async clearTradeState() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.remove(this.tradeStateKey, () => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Listen for configuration changes
   * @param {function} callback - Callback function (newConfig) => {}
   */
  onConfigChanged(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync' && changes[this.configKey]) {
          callback(changes[this.configKey].newValue);
        }
      });
    }
  }

  /**
   * Export configuration to JSON string
   * Useful for backup or sharing settings
   * @returns {Promise<string>} - JSON string of configuration
   */
  async exportConfig() {
    const config = await this.getConfig();
    return JSON.stringify(config, null, 2);
  }

  /**
   * Import configuration from JSON string
   * @param {string} jsonString - JSON configuration string
   * @returns {Promise<object>} - Imported configuration
   */
  async importConfig(jsonString) {
    try {
      const config = JSON.parse(jsonString);
      // Validate that it has the expected structure
      if (typeof config === 'object' && config !== null) {
        // Merge with defaults to ensure all keys exist
        const mergedConfig = { ...DEFAULT_CONFIG, ...config };
        await this.saveConfig(mergedConfig);
        return mergedConfig;
      } else {
        throw new Error('Invalid configuration format');
      }
    } catch (error) {
      console.error('Failed to import configuration:', error);
      throw error;
    }
  }

  /**
   * Get storage usage information
   * @returns {Promise<object>} - Storage usage stats
   */
  async getStorageInfo() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.getBytesInUse(null, (bytes) => {
          // Chrome sync storage limits:
          // - QUOTA_BYTES: 102,400 bytes (100KB)
          // - QUOTA_BYTES_PER_ITEM: 8,192 bytes (8KB)
          const maxBytes = chrome.storage.sync.QUOTA_BYTES || 102400;
          const percentUsed = (bytes / maxBytes) * 100;

          resolve({
            bytesUsed: bytes,
            maxBytes: maxBytes,
            percentUsed: percentUsed.toFixed(2),
            available: maxBytes - bytes
          });
        });
      } else {
        resolve({
          bytesUsed: 0,
          maxBytes: 0,
          percentUsed: 0,
          available: 0
        });
      }
    });
  }

  /**
   * Validate configuration object
   * @param {object} config - Configuration to validate
   * @returns {object} - { valid: boolean, errors: array }
   */
  validateConfig(config) {
    const errors = [];

    // Validate risk mode
    if (!['percent', 'fixed'].includes(config.riskMode)) {
      errors.push('riskMode must be "percent" or "fixed"');
    }

    // Validate numeric values
    if (config.riskPercent < 0 || config.riskPercent > 100) {
      errors.push('riskPercent must be between 0 and 100');
    }

    if (config.riskFixed < 0) {
      errors.push('riskFixed must be non-negative');
    }

    if (config.accountSize <= 0) {
      errors.push('accountSize must be greater than 0');
    }

    if (config.defaultSL <= 0) {
      errors.push('defaultSL must be greater than 0');
    }

    if (config.defaultTP <= 0) {
      errors.push('defaultTP must be greater than 0');
    }

    if (config.tpRatio <= 0) {
      errors.push('tpRatio must be greater than 0');
    }

    // Validate colors
    const colorRegex = /^#[0-9A-F]{6}$/i;
    if (!colorRegex.test(config.slColor)) {
      errors.push('slColor must be a valid hex color');
    }

    if (!colorRegex.test(config.tpColor)) {
      errors.push('tpColor must be a valid hex color');
    }

    // Validate line width
    if (config.lineWidth < 1 || config.lineWidth > 10) {
      errors.push('lineWidth must be between 1 and 10');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get default configuration (static)
   * @returns {object} - Default configuration object
   */
  static getDefaults() {
    return { ...DEFAULT_CONFIG };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment (for testing)
  module.exports = { StorageManager, DEFAULT_CONFIG };
} else if (typeof window !== 'undefined') {
  // Browser environment - expose to window
  window.StorageManager = StorageManager;
  window.DEFAULT_CONFIG = DEFAULT_CONFIG;
}
