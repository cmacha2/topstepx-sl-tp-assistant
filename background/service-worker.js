// Background Service Worker
// Handles extension lifecycle events and background tasks

console.log('[TopstepX SL/TP] Background service worker initialized');

// Extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[TopstepX SL/TP] Extension installed');

    // Set default configuration on first install
    chrome.storage.sync.get(null, (items) => {
      if (Object.keys(items).length === 0) {
        console.log('[TopstepX SL/TP] Setting default configuration');

        const defaultConfig = {
          riskMode: 'percent',
          riskPercent: 2,
          riskFixed: 500,
          accountSize: 50000,
          defaultSL: 100,
          defaultTP: 200,
          tpRatio: 2,
          useRatio: true,
          slColor: '#FF0000',
          tpColor: '#00FF00',
          lineWidth: 2,
          persistLines: true,
          autoUpdate: true
        };

        chrome.storage.sync.set(defaultConfig, () => {
          console.log('[TopstepX SL/TP] Default configuration saved');
        });
      }
    });
  } else if (details.reason === 'update') {
    console.log('[TopstepX SL/TP] Extension updated to version', chrome.runtime.getManifest().version);
  }
});

// Extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('[TopstepX SL/TP] Extension started');
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[TopstepX SL/TP] Message received:', message);

  // Handle different message types
  switch (message.type) {
    case 'GET_CONFIG':
      // Retrieve configuration
      chrome.storage.sync.get(null, (config) => {
        sendResponse({ success: true, config: config });
      });
      return true; // Keep channel open for async response

    case 'SAVE_CONFIG':
      // Save configuration
      chrome.storage.sync.set(message.config, () => {
        sendResponse({ success: true });
      });
      return true;

    case 'LOG_ERROR':
      // Log errors from content scripts
      console.error('[TopstepX SL/TP] Error from content script:', message.error);
      sendResponse({ success: true });
      break;

    default:
      console.warn('[TopstepX SL/TP] Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

// Monitor storage changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync') {
    console.log('[TopstepX SL/TP] Configuration changed:', changes);
  }
});

// Handle browser action click (if needed in future)
chrome.action.onClicked.addListener((tab) => {
  console.log('[TopstepX SL/TP] Extension icon clicked on tab:', tab.id);

  // Could open popup or perform action
  // For now, just log
});
