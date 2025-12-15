// Configuration Migration Script
// Run this in console to upgrade old configs to v4.4.1 format

(async function migrateConfig() {
  console.log('🔄 Starting configuration migration...');
  
  // Get current config
  const result = await chrome.storage.sync.get('topstep_sltp_config');
  const oldConfig = result.topstep_sltp_config || {};
  
  console.log('📦 Old config:', oldConfig);
  
  // Default values for new fields
  const newDefaults = {
    // Visual Settings - Lines
    slLineStyle: 0,
    tpLineStyle: 0,
    lineOpacity: 100,
    
    // Visual Settings - Text
    fontSize: 10,
    fontBold: false,
    labelFormat: 'compact',
    showDecimals: false,
    showContracts: true,
    
    // Label Text Customization
    slPrefix: 'SL',
    tpPrefix: 'TP',
    useEmojis: false,
    
    // Options
    autoHideOnMarket: true,
    playSound: false
  };
  
  // Merge old config with new defaults
  const migratedConfig = {
    ...newDefaults,
    ...oldConfig
  };
  
  console.log('✅ Migrated config:', migratedConfig);
  
  // Save migrated config
  await chrome.storage.sync.set({
    topstep_sltp_config: migratedConfig
  });
  
  console.log('💾 Configuration migrated successfully!');
  console.log('🔄 Reload the extension and TopstepX page to apply changes');
})();




