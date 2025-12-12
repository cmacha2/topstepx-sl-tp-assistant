// Config Bridge - ISOLATED world
// Bridges chrome.storage access to MAIN world via postMessage

(function() {
  'use strict';

  console.log('[TopstepX Config Bridge] 🌉 Starting in ISOLATED world');

  const storageManager = new StorageManager();
  const ORDER_STORE_KEY = 'topstep_order_store';

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

        case 'TOPSTEP_SAVE_ORDER_STORE':
          console.log('[TopstepX Config Bridge] 🏪 Saving order store:', event.data.data);
          await saveOrderStore(event.data.data);
          window.postMessage({
            type: 'TOPSTEP_ORDER_STORE_SAVED',
            success: true
          }, '*');
          break;

        case 'TOPSTEP_LOAD_ORDER_STORE':
          console.log('[TopstepX Config Bridge] 🏪 Loading order store');
          const storeData = await loadOrderStore();
          window.postMessage({
            type: 'TOPSTEP_ORDER_STORE_LOADED',
            data: storeData
          }, '*');
          break;

        case 'TOPSTEP_CLEAR_ORDER_STORE':
          console.log('[TopstepX Config Bridge] 🏪 Clearing order store');
          await clearOrderStore();
          window.postMessage({
            type: 'TOPSTEP_ORDER_STORE_CLEARED',
            success: true
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

  // Helper functions for OrderStore persistence
  async function saveOrderStore(data) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const storeData = {};
        storeData[ORDER_STORE_KEY] = data;
        chrome.storage.local.set(storeData, () => {
          console.log('[TopstepX Config Bridge] 💾 Order store saved to chrome.storage.local');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  async function loadOrderStore() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(ORDER_STORE_KEY, (result) => {
          const data = result[ORDER_STORE_KEY] || null;
          console.log('[TopstepX Config Bridge] 📦 Order store loaded:', data ? 'Found' : 'Empty');
          resolve(data);
        });
      } else {
        resolve(null);
      }
    });
  }

  async function clearOrderStore() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.remove(ORDER_STORE_KEY, () => {
          console.log('[TopstepX Config Bridge] 🗑️ Order store cleared from storage');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  console.log('[TopstepX Config Bridge] ✅ Bridge ready');
})();

