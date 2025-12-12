// Config Bridge - ISOLATED world
// Bridges chrome.storage access to MAIN world via postMessage

(function() {
  'use strict';

  console.log('[TopstepX Config Bridge] 🌉 Starting in ISOLATED world');

  const storageManager = new StorageManager();

  // Listen for config requests from MAIN world
  window.addEventListener('message', async (event) => {
    // Only accept messages from same origin
    if (event.source !== window) return;
    if (!event.data.type || !event.data.type.startsWith('TOPSTEP_')) return;

    console.log('[TopstepX Config Bridge] 📨 Message received:', event.data.type);

    try {
      switch (event.data.type) {
        case 'TOPSTEP_GET_CONFIG':
          const config = await storageManager.getConfig();
          console.log('[TopstepX Config Bridge] 📤 Sending config to MAIN world:', config);
          window.postMessage({
            type: 'TOPSTEP_CONFIG_RESPONSE',
            config: config
          }, '*');
          break;

        case 'TOPSTEP_SAVE_CONFIG':
          console.log('[TopstepX Config Bridge] 💾 Saving config:', event.data.config);
          await storageManager.saveConfig(event.data.config);
          window.postMessage({
            type: 'TOPSTEP_CONFIG_SAVED',
            success: true
          }, '*');
          break;

        case 'TOPSTEP_UPDATE_CONFIG':
          console.log('[TopstepX Config Bridge] 🔄 Updating config:', event.data.updates);
          const updatedConfig = await storageManager.updateConfig(event.data.updates);
          window.postMessage({
            type: 'TOPSTEP_CONFIG_UPDATED',
            config: updatedConfig
          }, '*');
          break;
      }
    } catch (error) {
      console.error('[TopstepX Config Bridge] ❌ Error:', error);
      window.postMessage({
        type: 'TOPSTEP_CONFIG_ERROR',
        error: error.message
      }, '*');
    }
  });

  // Listen for storage changes and notify MAIN world
  storageManager.onConfigChanged((newConfig) => {
    console.log('[TopstepX Config Bridge] 🔔 Config changed, notifying MAIN world');
    window.postMessage({
      type: 'TOPSTEP_CONFIG_CHANGED',
      config: newConfig
    }, '*');
  });

  // Send initial config to MAIN world
  storageManager.getConfig().then(config => {
    console.log('[TopstepX Config Bridge] 🚀 Sending initial config to MAIN world');
    window.postMessage({
      type: 'TOPSTEP_CONFIG_RESPONSE',
      config: config
    }, '*');
  });

  // Listen for OrderStore messages from MAIN world
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    
    // Save OrderStore state
    if (event.data.type === 'TOPSTEP_SAVE_ORDER_STORE') {
      console.log('[Config Bridge] 💾 Saving OrderStore to local storage');
      chrome.storage.local.set({
        'topstep_order_store': event.data.data
      }, () => {
        console.log('[Config Bridge] ✅ OrderStore saved');
      });
    }
    
    // Load OrderStore state
    else if (event.data.type === 'TOPSTEP_LOAD_ORDER_STORE') {
      console.log('[Config Bridge] 📂 Loading OrderStore from local storage');
      chrome.storage.local.get('topstep_order_store', (result) => {
        window.postMessage({
          type: 'TOPSTEP_ORDER_STORE_DATA',
          data: result.topstep_order_store || null
        }, '*');
        console.log('[Config Bridge] 📤 OrderStore data sent to MAIN world');
      });
    }
    
    // Clear OrderStore
    else if (event.data.type === 'TOPSTEP_CLEAR_ORDER_STORE') {
      console.log('[Config Bridge] 🗑️ Clearing OrderStore from storage');
      chrome.storage.local.remove('topstep_order_store', () => {
        console.log('[Config Bridge] ✅ OrderStore cleared');
      });
    }
  });

  console.log('[TopstepX Config Bridge] ✅ Bridge ready (with OrderStore support)');
})();

