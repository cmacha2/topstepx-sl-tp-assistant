// Popup Controller - Manages popup UI and user interactions

class PopupController {
  constructor() {
    this.storageManager = new StorageManager();
    this.elements = {};
    this.init();
  }

  /**
   * Initialize popup
   */
  async init() {
    // Cache DOM elements
    this.cacheElements();

    // Load current configuration
    const config = await this.storageManager.getConfig();
    this.populateForm(config);

    // Setup event listeners
    this.setupEventListeners();

    // Update visibility based on toggles
    this.updateVisibility();

    // Update color previews
    this.updateColorPreviews();
  }

  /**
   * Cache DOM elements for better performance
   */
  cacheElements() {
    console.log('[Popup] Caching DOM elements...');
    
    this.elements = {
      // Risk Management
      riskPercent: document.getElementById('riskPercent'),
      riskFixed: document.getElementById('riskFixed'),
      riskPercentValue: document.getElementById('riskPercentValue'),
      riskFixedValue: document.getElementById('riskFixedValue'),
      accountSize: document.getElementById('accountSize'),
      percentGroup: document.getElementById('percentGroup'),
      fixedGroup: document.getElementById('fixedGroup'),

      // SL/TP
      defaultSL: document.getElementById('defaultSL'),
      defaultTP: document.getElementById('defaultTP'),
      tpRatio: document.getElementById('tpRatio'),
      useRatio: document.getElementById('useRatio'),
      ratioGroup: document.getElementById('ratioGroup'),
      tpGroup: document.getElementById('tpGroup'),

      // Visual Settings - Colors
      slColor: document.getElementById('slColor'),
      tpColor: document.getElementById('tpColor'),
      slColorPreview: document.getElementById('slColorPreview'),
      tpColorPreview: document.getElementById('tpColorPreview'),

      // Visual Settings - Lines
      lineWidth: document.getElementById('lineWidth'),
      lineWidthValue: document.getElementById('lineWidthValue'),
      slLineStyle: document.getElementById('slLineStyle'),
      tpLineStyle: document.getElementById('tpLineStyle'),
      lineOpacity: document.getElementById('lineOpacity'),
      lineOpacityValue: document.getElementById('lineOpacityValue'),

      // Visual Settings - Text
      fontSize: document.getElementById('fontSize'),
      fontSizeValue: document.getElementById('fontSizeValue'),
      labelFormat: document.getElementById('labelFormat'),
      slPrefix: document.getElementById('slPrefix'),
      tpPrefix: document.getElementById('tpPrefix'),

      // Display Options
      showLabels: document.getElementById('showLabels'),
      showDecimals: document.getElementById('showDecimals'),
      showContracts: document.getElementById('showContracts'),
      fontBold: document.getElementById('fontBold'),
      useEmojis: document.getElementById('useEmojis'),

      // Behavior Options
      persistLines: document.getElementById('persistLines'),
      autoUpdate: document.getElementById('autoUpdate'),
      autoHideOnMarket: document.getElementById('autoHideOnMarket'),
      playSound: document.getElementById('playSound'),
      
      // Line Drag Sync
      enableLineDragSync: document.getElementById('enableLineDragSync'),

      // Buttons
      saveBtn: document.getElementById('saveBtn'),
      resetBtn: document.getElementById('resetBtn'),

      // Status
      status: document.getElementById('status')
    };
    
    // Verify all elements exist
    const missingElements = [];
    for (const [key, element] of Object.entries(this.elements)) {
      if (!element) {
        missingElements.push(key);
      }
    }
    
    if (missingElements.length > 0) {
      console.error('[Popup] Missing elements:', missingElements);
    } else {
      console.log('[Popup] ✅ All elements cached successfully');
    }
  }

  /**
   * Populate form with configuration values
   * @param {object} config - Configuration object
   */
  populateForm(config) {
    console.log('[Popup] Loading config:', config);
    
    // Helper function to safely set value
    const safeSet = (element, value, defaultValue) => {
      if (element) {
        element.value = value !== undefined && value !== null ? value : defaultValue;
      }
    };
    
    // Helper function to safely set checked
    const safeCheck = (element, value, defaultValue = false) => {
      if (element) {
        element.checked = value !== undefined && value !== null ? value : defaultValue;
      }
    };
    
    // Helper function to safely set text content
    const safeText = (element, value, defaultValue) => {
      if (element) {
        element.textContent = value !== undefined && value !== null ? value : defaultValue;
      }
    };

    // Risk Management
    safeCheck(this.elements.riskPercent, config.riskMode === 'percent', true);
    safeCheck(this.elements.riskFixed, config.riskMode === 'fixed', false);
    safeSet(this.elements.riskPercentValue, config.riskPercent, 2);
    safeSet(this.elements.riskFixedValue, config.riskFixed, 500);
    safeSet(this.elements.accountSize, config.accountSize, 50000);

    // SL/TP
    safeSet(this.elements.defaultSL, config.defaultSL, 100);
    safeSet(this.elements.defaultTP, config.defaultTP, 200);
    safeSet(this.elements.tpRatio, config.tpRatio, 2);
    safeCheck(this.elements.useRatio, config.useRatio, true);

    // Visual Settings - Colors
    safeSet(this.elements.slColor, config.slColor, '#FF0000');
    safeSet(this.elements.tpColor, config.tpColor, '#00FF00');

    // Visual Settings - Lines
    safeSet(this.elements.lineWidth, config.lineWidth, 1);
    safeText(this.elements.lineWidthValue, config.lineWidth, 1);
    safeSet(this.elements.slLineStyle, config.slLineStyle, 0);
    safeSet(this.elements.tpLineStyle, config.tpLineStyle, 0);
    safeSet(this.elements.lineOpacity, config.lineOpacity, 100);
    safeText(this.elements.lineOpacityValue, config.lineOpacity, 100);

    // Visual Settings - Text
    safeSet(this.elements.fontSize, config.fontSize, 10);
    safeText(this.elements.fontSizeValue, config.fontSize, 10);
    safeSet(this.elements.labelFormat, config.labelFormat, 'compact');
    safeSet(this.elements.slPrefix, config.slPrefix, 'SL');
    safeSet(this.elements.tpPrefix, config.tpPrefix, 'TP');

    // Display Options
    safeCheck(this.elements.showLabels, config.showLabels, true);
    safeCheck(this.elements.showDecimals, config.showDecimals, false);
    safeCheck(this.elements.showContracts, config.showContracts, true);
    safeCheck(this.elements.fontBold, config.fontBold, false);
    safeCheck(this.elements.useEmojis, config.useEmojis, false);

    // Behavior Options
    safeCheck(this.elements.persistLines, config.persistLines, true);
    safeCheck(this.elements.autoUpdate, config.autoUpdate, true);
    safeCheck(this.elements.autoHideOnMarket, config.autoHideOnMarket, true);
    safeCheck(this.elements.playSound, config.playSound, false);
    
    // Line Drag Sync
    safeCheck(this.elements.enableLineDragSync, config.enableLineDragSync, false);
    
    console.log('[Popup] Config loaded successfully');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Risk mode toggle
    this.elements.riskPercent.addEventListener('change', () => {
      this.updateVisibility();
    });

    this.elements.riskFixed.addEventListener('change', () => {
      this.updateVisibility();
    });

    // Use ratio toggle
    this.elements.useRatio.addEventListener('change', () => {
      this.updateVisibility();
    });

    // Sliders
    this.elements.lineWidth.addEventListener('input', (e) => {
      this.elements.lineWidthValue.textContent = e.target.value;
    });

    this.elements.lineOpacity.addEventListener('input', (e) => {
      this.elements.lineOpacityValue.textContent = e.target.value;
    });

    this.elements.fontSize.addEventListener('input', (e) => {
      this.elements.fontSizeValue.textContent = e.target.value;
    });

    // Color pickers
    this.elements.slColor.addEventListener('input', () => {
      this.updateColorPreviews();
    });

    this.elements.tpColor.addEventListener('input', () => {
      this.updateColorPreviews();
    });

    // Save button
    this.elements.saveBtn.addEventListener('click', () => {
      this.saveConfig();
    });

    // Reset button
    this.elements.resetBtn.addEventListener('click', () => {
      this.resetToDefaults();
    });

    // Add validation on number inputs
    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        this.validateNumberInput(e.target);
      });
    });
  }

  /**
   * Update visibility of conditional elements
   */
  updateVisibility() {
    // Risk mode visibility
    const riskMode = document.querySelector('input[name="riskMode"]:checked')?.value;

    if (riskMode === 'percent') {
      this.elements.percentGroup.style.display = 'block';
      this.elements.fixedGroup.style.display = 'none';
    } else {
      this.elements.percentGroup.style.display = 'none';
      this.elements.fixedGroup.style.display = 'block';
    }

    // TP ratio visibility
    const useRatio = this.elements.useRatio.checked;

    if (useRatio) {
      this.elements.ratioGroup.style.display = 'block';
      this.elements.tpGroup.style.display = 'none';
    } else {
      this.elements.ratioGroup.style.display = 'none';
      this.elements.tpGroup.style.display = 'block';
    }
  }

  /**
   * Update color preview elements
   */
  updateColorPreviews() {
    this.elements.slColorPreview.style.background = this.elements.slColor.value;
    this.elements.tpColorPreview.style.background = this.elements.tpColor.value;
  }

  /**
   * Validate number input
   * @param {HTMLInputElement} input - Input element to validate
   */
  validateNumberInput(input) {
    const value = parseFloat(input.value);
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);

    if (isNaN(value)) {
      input.classList.add('error');
      return false;
    }

    if (min !== undefined && value < min) {
      input.value = min;
    }

    if (max !== undefined && value > max) {
      input.value = max;
    }

    input.classList.remove('error');
    return true;
  }

  /**
   * Collect configuration from form
   * @returns {object} - Configuration object
   */
  collectConfig() {
    return {
      // Risk Management
      riskMode: document.querySelector('input[name="riskMode"]:checked').value,
      riskPercent: parseFloat(this.elements.riskPercentValue.value),
      riskFixed: parseFloat(this.elements.riskFixedValue.value),
      accountSize: parseFloat(this.elements.accountSize.value),

      // SL/TP
      defaultSL: parseFloat(this.elements.defaultSL.value),
      defaultTP: parseFloat(this.elements.defaultTP.value),
      tpRatio: parseFloat(this.elements.tpRatio.value),
      useRatio: this.elements.useRatio.checked,

      // Visual Settings - Lines
      slColor: this.elements.slColor.value,
      tpColor: this.elements.tpColor.value,
      lineWidth: parseInt(this.elements.lineWidth.value),
      slLineStyle: parseInt(this.elements.slLineStyle.value),
      tpLineStyle: parseInt(this.elements.tpLineStyle.value),
      lineOpacity: parseInt(this.elements.lineOpacity.value),

      // Visual Settings - Text
      fontSize: parseInt(this.elements.fontSize.value),
      fontBold: this.elements.fontBold.checked,
      showLabels: this.elements.showLabels.checked,
      labelFormat: this.elements.labelFormat.value,
      showDecimals: this.elements.showDecimals.checked,
      showContracts: this.elements.showContracts.checked,

      // Label Text Customization
      slPrefix: this.elements.slPrefix.value.trim() || 'SL',
      tpPrefix: this.elements.tpPrefix.value.trim() || 'TP',
      useEmojis: this.elements.useEmojis.checked,

      // Behavior Options
      persistLines: this.elements.persistLines.checked,
      autoUpdate: this.elements.autoUpdate.checked,
      autoHideOnMarket: this.elements.autoHideOnMarket.checked,
      playSound: this.elements.playSound.checked,
      
      // Line Drag Sync
      enableLineDragSync: this.elements.enableLineDragSync.checked,
      syncDebounceDelay: 1000, // Fixed 1 second

      // Advanced (from defaults)
      roundContracts: 'down',
      minContracts: 1,
      maxContracts: 100
    };
  }

  /**
   * Save configuration
   */
  async saveConfig() {
    try {
      // Disable save button during save
      this.elements.saveBtn.disabled = true;
      this.elements.saveBtn.textContent = 'Saving...';

      // Collect config from form
      const config = this.collectConfig();

      // Validate configuration
      const validation = this.storageManager.validateConfig(config);
      if (!validation.valid) {
        this.showStatus(`Validation errors: ${validation.errors.join(', ')}`, 'error');
        return;
      }

      // Save to storage
      await this.storageManager.saveConfig(config);

      // Show success message
      this.showStatus('Settings saved successfully!', 'success');

      // Log for debugging
      console.log('Configuration saved:', config);
    } catch (error) {
      console.error('Failed to save configuration:', error);
      this.showStatus('Failed to save settings. Please try again.', 'error');
    } finally {
      // Re-enable save button
      this.elements.saveBtn.disabled = false;
      this.elements.saveBtn.textContent = 'Save Settings';
    }
  }

  /**
   * Reset configuration to defaults
   */
  async resetToDefaults() {
    try {
      const confirmed = confirm('Are you sure you want to reset all settings to defaults?');

      if (!confirmed) {
        return;
      }

      // Reset to defaults
      await this.storageManager.resetConfig();

      // Get default config
      const defaultConfig = StorageManager.getDefaults();

      // Update form
      this.populateForm(defaultConfig);

      // Update visibility
      this.updateVisibility();

      // Update color previews
      this.updateColorPreviews();

      // Show success message
      this.showStatus('Settings reset to defaults', 'info');

      console.log('Configuration reset to defaults');
    } catch (error) {
      console.error('Failed to reset configuration:', error);
      this.showStatus('Failed to reset settings. Please try again.', 'error');
    }
  }

  /**
   * Show status message
   * @param {string} message - Message to display
   * @param {string} type - Message type: 'success', 'error', 'info'
   */
  showStatus(message, type = 'info') {
    this.elements.status.textContent = message;
    this.elements.status.className = `status ${type}`;
    this.elements.status.style.display = 'block';

    // Hide after 3 seconds
    setTimeout(() => {
      this.elements.status.style.display = 'none';
    }, 3000);
  }

  /**
   * Calculate and preview risk
   * Useful for showing user what their risk will be
   */
  calculatePreviewRisk() {
    const config = this.collectConfig();
    const calc = new CalculationEngine();

    const riskDollars = calc.calculateRiskInDollars(
      config.riskMode,
      config.riskMode === 'percent' ? config.riskPercent : config.riskFixed,
      config.accountSize
    );

    return {
      riskDollars,
      riskPercent: (riskDollars / config.accountSize) * 100
    };
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
