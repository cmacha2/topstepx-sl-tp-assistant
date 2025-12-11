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

      // Buttons
      saveBtn: document.getElementById('saveBtn'),
      resetBtn: document.getElementById('resetBtn'),

      // Status
      status: document.getElementById('status')
    };
  }

  /**
   * Populate form with configuration values
   * @param {object} config - Configuration object
   */
  populateForm(config) {
    // Risk Management
    this.elements.riskPercent.checked = config.riskMode === 'percent';
    this.elements.riskFixed.checked = config.riskMode === 'fixed';
    this.elements.riskPercentValue.value = config.riskPercent;
    this.elements.riskFixedValue.value = config.riskFixed;
    this.elements.accountSize.value = config.accountSize;

    // SL/TP
    this.elements.defaultSL.value = config.defaultSL;
    this.elements.defaultTP.value = config.defaultTP;
    this.elements.tpRatio.value = config.tpRatio;
    this.elements.useRatio.checked = config.useRatio;

    // Visual Settings - Colors
    this.elements.slColor.value = config.slColor;
    this.elements.tpColor.value = config.tpColor;

    // Visual Settings - Lines
    this.elements.lineWidth.value = config.lineWidth;
    this.elements.lineWidthValue.textContent = config.lineWidth;
    this.elements.slLineStyle.value = config.slLineStyle || 0;
    this.elements.tpLineStyle.value = config.tpLineStyle || 0;
    this.elements.lineOpacity.value = config.lineOpacity || 100;
    this.elements.lineOpacityValue.textContent = config.lineOpacity || 100;

    // Visual Settings - Text
    this.elements.fontSize.value = config.fontSize || 10;
    this.elements.fontSizeValue.textContent = config.fontSize || 10;
    this.elements.labelFormat.value = config.labelFormat || 'compact';
    this.elements.slPrefix.value = config.slPrefix || 'SL';
    this.elements.tpPrefix.value = config.tpPrefix || 'TP';

    // Display Options
    this.elements.showLabels.checked = config.showLabels;
    this.elements.showDecimals.checked = config.showDecimals || false;
    this.elements.showContracts.checked = config.showContracts !== false;
    this.elements.fontBold.checked = config.fontBold || false;
    this.elements.useEmojis.checked = config.useEmojis || false;

    // Behavior Options
    this.elements.persistLines.checked = config.persistLines;
    this.elements.autoUpdate.checked = config.autoUpdate;
    this.elements.autoHideOnMarket.checked = config.autoHideOnMarket !== false;
    this.elements.playSound.checked = config.playSound || false;
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
