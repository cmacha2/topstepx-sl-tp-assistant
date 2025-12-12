/**
 * DOM Order Detection Debug Script
 * 
 * Paste this in the console on TopstepX to explore where orders are stored
 */

console.log('%c🔍 TopstepX DOM Order Detection Debug', 'font-size: 20px; color: #00ff00; font-weight: bold');

// 1. Search for "MNQ" or your symbol in all text nodes
function searchForSymbol(symbol = 'MNQ') {
  console.log(`\n📊 Searching for symbol: ${symbol}`);
  
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null
  );
  
  const matches = [];
  let node;
  
  while (node = walker.nextNode()) {
    if (node.textContent.includes(symbol)) {
      matches.push({
        text: node.textContent.trim(),
        element: node.parentElement,
        path: getElementPath(node.parentElement)
      });
    }
  }
  
  console.log(`Found ${matches.length} text nodes containing "${symbol}"`);
  matches.slice(0, 5).forEach((match, i) => {
    console.log(`\n[${i+1}] Text:`, match.text);
    console.log('    Path:', match.path);
    console.log('    Element:', match.element);
  });
  
  return matches;
}

// 2. Search for price-like numbers (e.g., 25923.5)
function searchForPrices() {
  console.log('\n💰 Searching for prices (pattern: XXXXX.X)');
  
  const priceRegex = /\d{4,5}\.\d{1,2}/g;
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null
  );
  
  const matches = [];
  let node;
  
  while (node = walker.nextNode()) {
    const prices = node.textContent.match(priceRegex);
    if (prices) {
      matches.push({
        prices: prices,
        text: node.textContent.trim(),
        element: node.parentElement,
        path: getElementPath(node.parentElement)
      });
    }
  }
  
  console.log(`Found ${matches.length} elements with price-like numbers`);
  matches.slice(0, 5).forEach((match, i) => {
    console.log(`\n[${i+1}] Prices:`, match.prices);
    console.log('    Text:', match.text);
    console.log('    Path:', match.path);
    console.log('    Element:', match.element);
  });
  
  return matches;
}

// 3. Search for elements with "order" in class/id
function searchForOrderElements() {
  console.log('\n📋 Searching for elements with "order" in class/id');
  
  const allElements = document.querySelectorAll('*');
  const matches = [];
  
  allElements.forEach(el => {
    const className = el.className?.toString().toLowerCase() || '';
    const id = el.id?.toLowerCase() || '';
    
    if (className.includes('order') || id.includes('order')) {
      matches.push({
        tag: el.tagName,
        class: el.className,
        id: el.id,
        text: el.textContent.substring(0, 100),
        element: el,
        path: getElementPath(el)
      });
    }
  });
  
  console.log(`Found ${matches.length} elements with "order" in class/id`);
  matches.slice(0, 10).forEach((match, i) => {
    console.log(`\n[${i+1}] ${match.tag}.${match.class}#${match.id}`);
    console.log('    Path:', match.path);
    console.log('    Text:', match.text.substring(0, 80));
    console.log('    Element:', match.element);
  });
  
  return matches;
}

// 4. Search for table rows (orders often in tables)
function searchForTableRows() {
  console.log('\n📊 Searching for table rows with data');
  
  const rows = document.querySelectorAll('tr, [role="row"]');
  const matches = [];
  
  rows.forEach(row => {
    const text = row.textContent.trim();
    
    // Check if row contains price-like numbers or symbols
    if (text.match(/\d{4,5}\.\d/) || text.match(/MNQ|MES|MYM|M2K/)) {
      matches.push({
        text: text.substring(0, 150),
        cells: Array.from(row.children).map(cell => cell.textContent.trim()),
        element: row,
        path: getElementPath(row)
      });
    }
  });
  
  console.log(`Found ${matches.length} relevant table rows`);
  matches.slice(0, 5).forEach((match, i) => {
    console.log(`\n[${i+1}] Row:`, match.text);
    console.log('    Cells:', match.cells);
    console.log('    Path:', match.path);
    console.log('    Element:', match.element);
  });
  
  return matches;
}

// 5. Search for lists (ul, ol, divs with list role)
function searchForLists() {
  console.log('\n📝 Searching for lists with order-like data');
  
  const lists = document.querySelectorAll('ul, ol, [role="list"], [role="listbox"]');
  const matches = [];
  
  lists.forEach(list => {
    const items = list.querySelectorAll('li, [role="listitem"], [role="option"]');
    
    if (items.length > 0) {
      const itemTexts = Array.from(items).slice(0, 5).map(item => item.textContent.trim().substring(0, 100));
      
      matches.push({
        type: list.tagName,
        itemCount: items.length,
        samples: itemTexts,
        element: list,
        path: getElementPath(list)
      });
    }
  });
  
  console.log(`Found ${matches.length} lists`);
  matches.slice(0, 5).forEach((match, i) => {
    console.log(`\n[${i+1}] ${match.type} with ${match.itemCount} items`);
    console.log('    Samples:', match.samples);
    console.log('    Path:', match.path);
    console.log('    Element:', match.element);
  });
  
  return matches;
}

// 6. Deep inspect a specific element
function inspectElement(element) {
  console.log('\n🔬 Deep inspection of element:', element);
  console.log('Tag:', element.tagName);
  console.log('Classes:', element.className);
  console.log('ID:', element.id);
  console.log('Attributes:', Array.from(element.attributes).map(a => `${a.name}="${a.value}"`));
  console.log('Text:', element.textContent.substring(0, 200));
  console.log('Children:', element.children.length);
  console.log('Path:', getElementPath(element));
  
  // Get all data attributes
  const dataAttrs = {};
  Array.from(element.attributes).forEach(attr => {
    if (attr.name.startsWith('data-')) {
      dataAttrs[attr.name] = attr.value;
    }
  });
  if (Object.keys(dataAttrs).length > 0) {
    console.log('Data attributes:', dataAttrs);
  }
  
  return element;
}

// Helper: Get element path
function getElementPath(element) {
  const path = [];
  let current = element;
  
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    
    if (current.id) {
      selector += `#${current.id}`;
    } else if (current.className) {
      const classes = current.className.toString().split(' ').filter(c => c).slice(0, 2);
      if (classes.length > 0) {
        selector += `.${classes.join('.')}`;
      }
    }
    
    path.unshift(selector);
    current = current.parentElement;
    
    if (path.length > 5) break; // Limit depth
  }
  
  return path.join(' > ');
}

// 7. Search in React/Vue dev tools data
function searchForReactData() {
  console.log('\n⚛️ Searching for React/Vue component data');
  
  // Check for React
  const reactRoot = document.querySelector('[data-reactroot], #root, #app');
  if (reactRoot) {
    console.log('Found React root:', reactRoot);
    
    // Try to find React fiber
    const fiberKey = Object.keys(reactRoot).find(key => key.startsWith('__react'));
    if (fiberKey) {
      console.log('React fiber key:', fiberKey);
      console.log('React data:', reactRoot[fiberKey]);
    }
  }
  
  // Check for Vue
  const vueRoot = document.querySelector('[data-v-app], #app');
  if (vueRoot) {
    console.log('Found Vue root:', vueRoot);
    const vueKey = Object.keys(vueRoot).find(key => key.startsWith('__vue'));
    if (vueKey) {
      console.log('Vue key:', vueKey);
      console.log('Vue data:', vueRoot[vueKey]);
    }
  }
}

// 8. Monitor DOM changes
function monitorDOMChanges() {
  console.log('\n👁️ Monitoring DOM changes for 10 seconds...');
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            const text = node.textContent;
            if (text.includes('MNQ') || text.match(/\d{4,5}\.\d/)) {
              console.log('🆕 New element with order data:', node);
              console.log('   Text:', text.substring(0, 100));
            }
          }
        });
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  setTimeout(() => {
    observer.disconnect();
    console.log('✅ Stopped monitoring');
  }, 10000);
}

// ===== MAIN EXECUTION =====

console.log('\n' + '='.repeat(60));
console.log('Running all searches...');
console.log('='.repeat(60));

// Run all searches
const symbolMatches = searchForSymbol('MNQ'); // Change to your symbol
const priceMatches = searchForPrices();
const orderElements = searchForOrderElements();
const tableRows = searchForTableRows();
const lists = searchForLists();

searchForReactData();

console.log('\n' + '='.repeat(60));
console.log('✅ Search complete!');
console.log('='.repeat(60));

console.log('\n💡 TIPS:');
console.log('1. Change symbol: searchForSymbol("ES")');
console.log('2. Inspect element: inspectElement(element)');
console.log('3. Monitor changes: monitorDOMChanges()');
console.log('4. Search again: searchForOrderElements()');

console.log('\n📊 RESULTS SAVED:');
console.log('- symbolMatches:', symbolMatches.length);
console.log('- priceMatches:', priceMatches.length);
console.log('- orderElements:', orderElements.length);
console.log('- tableRows:', tableRows.length);
console.log('- lists:', lists.length);

// Export to window for easy access
window.debugResults = {
  symbolMatches,
  priceMatches,
  orderElements,
  tableRows,
  lists
};

console.log('\n💾 Access results: window.debugResults');

