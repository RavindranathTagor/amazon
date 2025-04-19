(function() {
  // Shopping list state
  let shoppingListItems = JSON.parse(localStorage.getItem('amazonShoppingList') || '[]');
  let isShoppingListVisible = false;
  
  // Price history tracking state
  let priceHistoryData = JSON.parse(localStorage.getItem('amazonPriceHistory') || '{}');
  let priceAlerts = JSON.parse(localStorage.getItem('amazonPriceAlerts') || '{}');
  
  // Price check intervals (in milliseconds)
  const PRICE_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes
  const AGGRESSIVE_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  let priceCheckIntervalId = null;
  
  // DOM Elements
  let shoppingListContainer;
  let shoppingListButton;
  let shoppingListPanel;
  let shoppingListInput;
  let shoppingListItemsContainer;
  
  // API endpoints for price data (for demonstration)
  const API_ENDPOINTS = {
    productInfo: 'https://api.example.com/products/',
    priceHistory: 'https://api.example.com/price-history/'
  };
  
  // Initialize shopping list feature
  function initShoppingList() {
    createShoppingListUI();
    attachEventListeners();
    renderShoppingList();
    initializePriceTracking();
    
    // Check for price alerts that have been triggered
    checkPriceAlerts();
  }
  
  // Create the shopping list UI elements
  function createShoppingListUI() {
    // Create main container
    shoppingListContainer = document.createElement('div');
    shoppingListContainer.id = 'shopping-list-container';
    
    // Create toggle button
    shoppingListButton = document.createElement('button');
    shoppingListButton.id = 'shopping-list-button';
    shoppingListButton.setAttribute('aria-label', 'Toggle Shopping List & Price Tracker');
    shoppingListButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <path d="M3 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3zm0 2h18v10H3V3z"/>
        <path d="M5 5h2v2H5zM8 5h8v1H8zM5 9h2v2H5zM8 9h8v1H8zM4 16a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H4zm0 2h16v2H4v-2z"/>
      </svg>
      <span>Shopping & Price Tracker</span>
    `;
    
    // Create shopping list panel
    shoppingListPanel = document.createElement('div');
    shoppingListPanel.id = 'shopping-list-panel';
    shoppingListPanel.className = 'hidden';
    
    // Create tabs for shopping list and price tracker
    const tabs = document.createElement('div');
    tabs.className = 'shopping-list-tabs';
    tabs.innerHTML = `
      <button class="tab-button active" data-tab="list">Shopping List</button>
      <button class="tab-button" data-tab="prices">Price Tracker</button>
    `;
    
    // Create header for the panel
    const header = document.createElement('div');
    header.className = 'shopping-list-header';
    header.innerHTML = `
      <h2>My Shopping List</h2>
      <button id="shopping-list-close" aria-label="Close Shopping List">×</button>
    `;
    
    // Create form for adding new items
    const form = document.createElement('form');
    form.id = 'shopping-list-form';
    form.innerHTML = `
      <input type="text" id="shopping-list-input" placeholder="Add an item to your list" autocomplete="off">
      <button type="submit" id="shopping-list-add">Add</button>
    `;
    
    // Create container for list items
    shoppingListItemsContainer = document.createElement('div');
    shoppingListItemsContainer.id = 'shopping-list-items';
    
    // Create container for price tracker
    const priceTrackerContainer = document.createElement('div');
    priceTrackerContainer.id = 'price-tracker-container';
    priceTrackerContainer.className = 'tab-content hidden';
    priceTrackerContainer.innerHTML = `
      <div class="price-tracker-header">
        <h3>Track product prices</h3>
        <p>Add products to track their price history</p>
      </div>
      <div id="price-tracker-form">
        <input type="text" id="product-url-input" placeholder="Paste Amazon product URL or ID">
        <button id="add-tracking-btn">Track Price</button>
      </div>
      <div id="price-tracked-items"></div>
    `;
    
    // Create action buttons
    const actions = document.createElement('div');
    actions.className = 'shopping-list-actions';
    actions.innerHTML = `
      <button id="shopping-list-clear">Clear All</button>
      <button id="shopping-list-save">Save List</button>
    `;
    
    // Create price tracker actions
    const priceActions = document.createElement('div');
    priceActions.className = 'price-tracker-actions';
    priceActions.innerHTML = `
      <button id="clear-all-tracking">Clear All</button>
      <button id="check-all-prices">Update Prices</button>
    `;
    
    // Create container for shopping list content
    const shoppingListContent = document.createElement('div');
    shoppingListContent.id = 'shopping-list-content';
    shoppingListContent.className = 'tab-content';
    
    // Assemble the shopping list content
    shoppingListContent.appendChild(form);
    shoppingListContent.appendChild(shoppingListItemsContainer);
    shoppingListContent.appendChild(actions);
    
    // Add price tracker actions to price tracker container
    priceTrackerContainer.appendChild(priceActions);
    
    // Assemble the panel
    shoppingListPanel.appendChild(header);
    shoppingListPanel.appendChild(tabs);
    shoppingListPanel.appendChild(shoppingListContent);
    shoppingListPanel.appendChild(priceTrackerContainer);
    
    // Add to the main container
    shoppingListContainer.appendChild(shoppingListButton);
    shoppingListContainer.appendChild(shoppingListPanel);
    
    // Add to the page
    document.body.appendChild(shoppingListContainer);
    
    // Store reference to input
    shoppingListInput = document.getElementById('shopping-list-input');
  }
  
  // Attach event listeners to interactive elements
  function attachEventListeners() {
    // Toggle shopping list visibility
    shoppingListButton.addEventListener('click', toggleShoppingList);
    document.getElementById('shopping-list-close').addEventListener('click', toggleShoppingList);
    
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(tab => {
      tab.addEventListener('click', function() {
        // Remove active class from all tabs
        document.querySelectorAll('.tab-button').forEach(t => t.classList.remove('active'));
        // Add active class to clicked tab
        this.classList.add('active');
        
        // Hide all tab content
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.add('hidden');
        });
        
        // Show selected tab content
        const tabToShow = this.getAttribute('data-tab');
        if (tabToShow === 'list') {
          document.getElementById('shopping-list-content').classList.remove('hidden');
          document.querySelector('.shopping-list-header h2').textContent = 'My Shopping List';
        } else if (tabToShow === 'prices') {
          document.getElementById('price-tracker-container').classList.remove('hidden');
          document.querySelector('.shopping-list-header h2').textContent = 'Price Tracker';
        }
      });
    });
    
    // Form submission to add new items
    document.getElementById('shopping-list-form').addEventListener('submit', function(e) {
      e.preventDefault();
      addShoppingListItem();
    });
    
    // Enhanced price tracking event listeners
    document.getElementById('add-tracking-btn').addEventListener('click', addPriceTracking);
    document.getElementById('check-all-prices').addEventListener('click', function() {
      updateAllPrices(true);
    });
    document.getElementById('clear-all-tracking').addEventListener('click', clearAllTracking);
    
    // Listen for price alert setup
    document.addEventListener('click', function(e) {
      if (e.target && e.target.classList.contains('set-price-alert')) {
        const productId = e.target.getAttribute('data-product-id');
        setupPriceAlert(productId);
      }
      
      if (e.target && e.target.classList.contains('alert-delete')) {
        const productId = e.target.getAttribute('data-product-id');
        removePriceAlert(productId);
      }
    });
    
    // Clear all items
    document.getElementById('shopping-list-clear').addEventListener('click', clearShoppingList);
    
    // Save list
    document.getElementById('shopping-list-save').addEventListener('click', function() {
      saveShoppingList();
      showNotification('Shopping list saved!');
    });
    
    // Close the panel when clicking outside
    document.addEventListener('click', function(e) {
      if (isShoppingListVisible && 
          !shoppingListContainer.contains(e.target) && 
          e.target !== shoppingListButton) {
        toggleShoppingList();
      }
    });
  }
  
  // Toggle the visibility of the shopping list panel
  function toggleShoppingList() {
    isShoppingListVisible = !isShoppingListVisible;
    shoppingListPanel.classList.toggle('hidden', !isShoppingListVisible);
    
    if (isShoppingListVisible) {
      shoppingListInput.focus();
    }
  }
  
  // Initialize price tracking functionality
  function initializePriceTracking() {
    // Clear any existing interval
    if (priceCheckIntervalId) {
      clearInterval(priceCheckIntervalId);
    }
    
    // Check for price updates periodically
    priceCheckIntervalId = setInterval(updateAllPrices, PRICE_CHECK_INTERVAL);
    
    // Initial render of tracked items
    renderPriceTrackedItems();
    
    // If we have active alerts, use a more aggressive check interval
    if (Object.keys(priceAlerts).length > 0) {
      clearInterval(priceCheckIntervalId);
      priceCheckIntervalId = setInterval(updateAllPrices, AGGRESSIVE_CHECK_INTERVAL);
    }
  }
  
  // Add a new product to price tracking
  function addPriceTracking() {
    const urlInput = document.getElementById('product-url-input');
    const productUrl = urlInput.value.trim();
    
    if (!productUrl) {
      showNotification('Please enter a product URL or ID', 'error');
      return;
    }
    
    // Extract product ID from URL
    let productId = productUrl;
    
    // If it's a URL, try to extract the product ID
    if (productUrl.includes('amazon.com')) {
      const match = productUrl.match(/\/([A-Z0-9]{10})(?:\/|\?|$)/);
      if (match && match[1]) {
        productId = match[1];
      } else {
        // Try another common Amazon URL pattern
        const dpMatch = productUrl.match(/\/dp\/([A-Z0-9]{10})(?:\/|\?|$)/);
        if (dpMatch && dpMatch[1]) {
          productId = dpMatch[1];
        } else {
          showNotification('Could not identify product ID from URL', 'error');
          return;
        }
      }
    }
    
    // Don't track duplicates
    if (priceHistoryData[productId]) {
      showNotification('This product is already being tracked', 'error');
      return;
    }
    
    showNotification('Adding product to price tracker...', 'info');
    
    // Fetch current product info
    fetchProductInfo(productId)
      .then(productInfo => {
        if (!productInfo) {
          showNotification('Could not retrieve product information', 'error');
          return;
        }
        
        // Initialize price history with current price
        priceHistoryData[productId] = {
          title: productInfo.title,
          currentPrice: productInfo.price,
          currency: productInfo.currency || '$',
          highestPrice: productInfo.price,
          lowestPrice: productInfo.price,
          averagePrice: productInfo.price,
          priceHistory: [
            {
              price: productInfo.price,
              date: new Date().toISOString()
            }
          ],
          imageUrl: productInfo.imageUrl,
          productUrl: productInfo.url || `https://www.amazon.com/dp/${productId}`,
          addedDate: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem('amazonPriceHistory', JSON.stringify(priceHistoryData));
        
        // Update UI
        renderPriceTrackedItems();
        
        // Clear input
        urlInput.value = '';
        
        showNotification('Product added to price tracker!', 'success');
      })
      .catch(error => {
        console.error('Error adding price tracking:', error);
        showNotification('Error adding product to price tracker', 'error');
      });
  }
  
  // Fetch product information from Amazon
  function fetchProductInfo(productId) {
    // In a real implementation, you would call an API to get the product info
    // For this demo, we'll simulate fetching data from the current page if it's a product page
    
    return new Promise((resolve, reject) => {
      // Check if we're on a product page
      const onProductPage = window.location.pathname.includes('/dp/') || 
                           window.location.pathname.includes('/gp/product/');
      
      if (onProductPage) {
        // Try to get product info from the current page
        try {
          const title = document.querySelector('#productTitle')?.textContent.trim() || 
                       document.querySelector('.product-title')?.textContent.trim() || 
                       'Unknown Product';
          
          // Try different price selectors that Amazon might use
          const priceElement = document.querySelector('.a-price .a-offscreen') || 
                              document.querySelector('#priceblock_ourprice') || 
                              document.querySelector('.a-price');
          
          let price = 0;
          let currency = '$';
          
          if (priceElement) {
            const priceText = priceElement.textContent.trim();
            // Extract price digits and currency
            const priceMatch = priceText.match(/([^\d.,]*)([\d.,]+)/);
            if (priceMatch) {
              currency = priceMatch[1].trim() || '$';
              price = parseFloat(priceMatch[2].replace(/[^\d.]/g, ''));
            }
          }
          
          const imageUrl = document.querySelector('#landingImage')?.src || 
                          document.querySelector('#imgBlkFront')?.src || 
                          '';
          
          resolve({
            title,
            price,
            currency,
            imageUrl,
            url: window.location.href
          });
        } catch (error) {
          console.error('Error extracting product info from page:', error);
          
          // Fallback to simulated data if extraction fails
          resolve(generateSimulatedProductData(productId));
        }
      } else {
        // If not on a product page, we'll use simulated data
        resolve(generateSimulatedProductData(productId));
      }
    });
  }
  
  // Generate simulated product data for demonstration
  function generateSimulatedProductData(productId) {
    // Create realistic sample product names based on categories
    const productTypes = [
      "Wireless Headphones",
      "4K Smart TV",
      "Bluetooth Speaker",
      "Gaming Laptop",
      "Digital Camera",
      "Smartwatch",
      "Robot Vacuum",
      "Electric Toothbrush",
      "Coffee Maker",
      "Wireless Charger"
    ];
    
    const brands = [
      "TechPro",
      "ElectraMax",
      "SoundWave",
      "VisuTech",
      "SmartLife",
      "HomeGenius",
      "PowerTech",
      "FutureTech",
      "EcoSmart",
      "LuxeComfort"
    ];
    
    // Generate a deterministic but random-looking price based on product ID
    const priceBase = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 300;
    const price = priceBase + 29.99;
    
    // Generate a product name from the ID to ensure consistency
    const brandIndex = productId.charCodeAt(0) % brands.length;
    const typeIndex = productId.charCodeAt(productId.length - 1) % productTypes.length;
    const title = `${brands[brandIndex]} ${productTypes[typeIndex]} - Model ${productId.substring(0, 5).toUpperCase()}`;
    
    return {
      title: title,
      price: price,
      currency: '$',
      imageUrl: `https://picsum.photos/seed/${productId}/200/200`,
      url: `https://www.amazon.com/dp/${productId}`
    };
  }
  
  // Update the price of a tracked product
  function updateProductPrice(productId) {
    return fetchProductInfo(productId)
      .then(productInfo => {
        if (!productInfo || !priceHistoryData[productId]) return false;
        
        const currentTrackedItem = priceHistoryData[productId];
        const newPrice = productInfo.price;
        
        // Only add to history if price has changed
        if (newPrice !== currentTrackedItem.currentPrice) {
          currentTrackedItem.priceHistory.push({
            price: newPrice,
            date: new Date().toISOString()
          });
          
          // Update current price
          currentTrackedItem.currentPrice = newPrice;
          
          // Update price analytics
          currentTrackedItem.lowestPrice = Math.min(currentTrackedItem.lowestPrice, newPrice);
          currentTrackedItem.highestPrice = Math.max(currentTrackedItem.highestPrice, newPrice);
          
          // Calculate new average
          const sum = currentTrackedItem.priceHistory.reduce((total, entry) => total + entry.price, 0);
          currentTrackedItem.averagePrice = sum / currentTrackedItem.priceHistory.length;
          
          // Check if any price alerts have been triggered
          checkProductPriceAlert(productId, newPrice);
          
          // Update localStorage
          localStorage.setItem('amazonPriceHistory', JSON.stringify(priceHistoryData));
          
          return {
            productId,
            oldPrice: currentTrackedItem.priceHistory[currentTrackedItem.priceHistory.length - 2].price,
            newPrice: newPrice,
            difference: newPrice - currentTrackedItem.priceHistory[currentTrackedItem.priceHistory.length - 2].price
          };
        }
        
        return false;
      });
  }
  
  // Update all tracked product prices
  function updateAllPrices(userInitiated = false) {
    const productIds = Object.keys(priceHistoryData);
    
    if (productIds.length === 0) {
      if (userInitiated) {
        showNotification('No products being tracked');
      }
      return;
    }
    
    if (userInitiated) {
      showNotification('Updating product prices...', 'info');
    }
    
    const updatePromises = productIds.map(productId => updateProductPrice(productId));
    
    Promise.all(updatePromises)
      .then(results => {
        // Filter out false results (no price change)
        const changedProducts = results.filter(Boolean);
        
        if (changedProducts.length > 0) {
          // Render updated tracked items
          renderPriceTrackedItems();
          
          // Notify of price changes if user initiated the update
          if (userInitiated) {
            changedProducts.forEach(change => {
              const product = priceHistoryData[change.productId];
              const changeType = change.difference > 0 ? 'increased' : 'decreased';
              const message = `${product.title.substring(0, 20)}... ${changeType} by ${product.currency}${Math.abs(change.difference).toFixed(2)}`;
              showNotification(message, changeType === 'decreased' ? 'success' : 'warning');
            });
          }
        } else if (userInitiated) {
          showNotification('No price changes detected');
        }
      })
      .catch(error => {
        console.error('Error updating prices:', error);
        if (userInitiated) {
          showNotification('Error updating prices', 'error');
        }
      });
  }
  
  // Setup a price alert for a product
  function setupPriceAlert(productId) {
    const product = priceHistoryData[productId];
    if (!product) return;
    
    // Create an overlay form to set the target price
    const alertForm = document.createElement('div');
    alertForm.className = 'price-alert-container';
    
    // Calculate a suggested price (10% below current)
    const suggestedPrice = (product.currentPrice * 0.9).toFixed(2);
    
    alertForm.innerHTML = `
      <div style="font-weight:500;color:#232f3e;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#232f3e" style="vertical-align: middle; margin-right: 6px;">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
        </svg>
        Set price alert for ${product.title.substring(0, 30)}${product.title.length > 30 ? '...' : ''}
      </div>
      <div class="price-alert-form">
        <label style="font-size:14px;color:#565959;">
          Alert me when price drops to:
          <div style="display:flex;align-items:center;margin-top:5px;">
            <span style="font-weight:500;margin-right:5px;">${product.currency}</span>
            <input type="number" class="price-alert-input" id="alert-price-${productId}" 
              value="${suggestedPrice}" step="0.01" min="0.01" max="${product.currentPrice.toFixed(2)}">
          </div>
        </label>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <button class="price-alert-button" id="save-alert-${productId}">Set Alert</button>
          <button class="remove-tracking" id="cancel-alert-${productId}" style="margin-top:0;">Cancel</button>
        </div>
      </div>
      <div style="font-size:12px;color:#565959;margin-top:8px;">
        Current price: ${product.currency}${product.currentPrice.toFixed(2)} 
        · Lowest price: ${product.currency}${product.lowestPrice.toFixed(2)}
      </div>
    `;
    
    // Find the product element and append the form
    const productElement = document.querySelector(`.tracked-product[data-product-id="${productId}"]`);
    if (productElement) {
      // Remove any existing alert form
      const existingForm = productElement.querySelector('.price-alert-container');
      if (existingForm) {
        existingForm.remove();
      }
      
      productElement.appendChild(alertForm);
      
      // Focus the input
      document.getElementById(`alert-price-${productId}`).focus();
      
      // Add event listener to save button
      document.getElementById(`save-alert-${productId}`).addEventListener('click', function() {
        const targetPrice = parseFloat(document.getElementById(`alert-price-${productId}`).value);
        
        if (isNaN(targetPrice) || targetPrice <= 0) {
          showNotification('Please enter a valid price', 'error');
          return;
        }
        
        if (targetPrice >= product.currentPrice) {
          showNotification('Target price must be lower than current price', 'error');
          return;
        }
        
        // Save the alert
        priceAlerts[productId] = {
          targetPrice: targetPrice,
          createdAt: new Date().toISOString(),
          notified: false
        };
        
        localStorage.setItem('amazonPriceAlerts', JSON.stringify(priceAlerts));
        
        // Change to more frequent checks if we have alerts
        if (Object.keys(priceAlerts).length > 0) {
          clearInterval(priceCheckIntervalId);
          priceCheckIntervalId = setInterval(updateAllPrices, AGGRESSIVE_CHECK_INTERVAL);
        }
        
        // Remove the form
        alertForm.remove();
        
        // Render alert status
        renderPriceAlert(productElement, productId, product);
        
        showNotification(`Alert set! We'll notify you when price drops below ${product.currency}${targetPrice.toFixed(2)}`, 'success');
      });
      
      // Add event listener to cancel button
      document.getElementById(`cancel-alert-${productId}`).addEventListener('click', function() {
        alertForm.remove();
      });
    }
  }
  
  // Render price alert for a product
  function renderPriceAlert(productElement, productId, product) {
    // Remove any existing alert display
    const existingAlert = productElement.querySelector('.price-alert-active');
    if (existingAlert) {
      existingAlert.remove();
    }
    
    // If there's an active alert for this product, show it
    if (priceAlerts[productId]) {
      const alertInfo = document.createElement('div');
      alertInfo.className = 'price-alert-active';
      
      // Calculate percentage below current price
      const percentBelow = ((product.currentPrice - priceAlerts[productId].targetPrice) / product.currentPrice) * 100;
      
      alertInfo.innerHTML = `
        <span>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#0066c0" style="vertical-align: middle; margin-right: 4px;">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
          </svg>
          Alert: ${product.currency}${priceAlerts[productId].targetPrice.toFixed(2)} 
          <span style="color:#565959;font-size:11px;">(${percentBelow.toFixed(1)}% below current)</span>
        </span>
        <button class="alert-delete" data-product-id="${productId}">×</button>
      `;
      
      // Find where to insert the alert (after the price info)
      const productInfo = productElement.querySelector('.product-info');
      const priceInfo = productElement.querySelector('.price-info');
      
      if (productInfo && priceInfo) {
        productInfo.insertBefore(alertInfo, priceInfo.nextSibling);
      } else {
        productElement.appendChild(alertInfo);
      }
    }
  }
  
  // Check if any price alerts have been triggered
  function checkPriceAlerts() {
    Object.keys(priceAlerts).forEach(productId => {
      const product = priceHistoryData[productId];
      const alert = priceAlerts[productId];
      
      if (product && alert && !alert.notified && product.currentPrice <= alert.targetPrice) {
        // Alert triggered!
        alert.notified = true;
        localStorage.setItem('amazonPriceAlerts', JSON.stringify(priceAlerts));
        
        // Show notification
        showNotification(
          `🔔 Price Alert: ${product.title.substring(0, 25)}... is now ${product.currency}${product.currentPrice.toFixed(2)}`,
          'success',
          8000
        );
        
        // If browser notifications are supported and permitted, use them too
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Amazon Price Alert", {
            body: `${product.title} is now ${product.currency}${product.currentPrice.toFixed(2)}`,
            icon: product.imageUrl
          });
        }
      }
    });
  }
  
  // Check a specific product for price alert
  function checkProductPriceAlert(productId, currentPrice) {
    const alert = priceAlerts[productId];
    const product = priceHistoryData[productId];
    
    if (alert && !alert.notified && currentPrice <= alert.targetPrice) {
      // Alert triggered!
      alert.notified = true;
      localStorage.setItem('amazonPriceAlerts', JSON.stringify(priceAlerts));
      
      // Show notification
      showNotification(
        `🔔 Price Alert: ${product.title.substring(0, 25)}... is now ${product.currency}${currentPrice.toFixed(2)}`,
        'success',
        8000
      );
      
      // If browser notifications are supported and permitted, use them too
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Amazon Price Alert", {
          body: `${product.title} is now ${product.currency}${currentPrice.toFixed(2)}`,
          icon: product.imageUrl
        });
      }
    }
  }
  
  // Render all price tracked items
  function renderPriceTrackedItems() {
    const trackedItemsContainer = document.getElementById('price-tracked-items');
    if (!trackedItemsContainer) return;
    
    // Clear existing content
    trackedItemsContainer.innerHTML = '';
    
    // Check if we have any items to display
    const productIds = Object.keys(priceHistoryData);
    if (productIds.length === 0) {
      trackedItemsContainer.innerHTML = `
        <div class="empty-tracker">
          <p>You haven't added any products to track yet.</p>
          <p>Add a product URL or ID above to start tracking prices.</p>
        </div>
      `;
      return;
    }
    
    // Create and add tracked item elements
    productIds.forEach(productId => {
      const product = priceHistoryData[productId];
      const trackedItem = document.createElement('div');
      trackedItem.className = 'tracked-product';
      trackedItem.setAttribute('data-product-id', productId);
      
      // Calculate price change and trend
      let priceChangeClass = '';
      let priceChangeIcon = '';
      let priceChangePercent = '';
      
      if (product.priceHistory.length > 1) {
        const oldestPrice = product.priceHistory[0].price;
        const priceDiff = product.currentPrice - oldestPrice;
        const percentChange = (priceDiff / oldestPrice) * 100;
        
        if (priceDiff < 0) {
          priceChangeClass = 'price-decreased';
          priceChangeIcon = '↓';
        } else if (priceDiff > 0) {
          priceChangeClass = 'price-increased';
          priceChangeIcon = '↑';
        }
        
        priceChangePercent = `<span class="${priceChangeClass}">${priceChangeIcon} ${Math.abs(percentChange).toFixed(1)}%</span>`;
      }
      
      // Calculate days tracking
      const daysSinceAdded = Math.floor((new Date() - new Date(product.addedDate)) / (1000 * 60 * 60 * 24));
      const trackingDays = daysSinceAdded === 0 ? 'Today' : daysSinceAdded === 1 ? '1 day' : `${daysSinceAdded} days`;
      
      // Create HTML content
      trackedItem.innerHTML = `
        <div class="product-image">
          <img src="${product.imageUrl || 'https://placehold.it/60x60'}" alt="${product.title}">
        </div>
        <div class="product-info">
          <a href="${product.productUrl}" target="_blank" class="product-title">${product.title}</a>
          <div class="price-info">
            <span class="current-price ${priceChangeClass}">${product.currency}${product.currentPrice.toFixed(2)}</span>
            ${priceChangePercent}
            <span style="margin-left:auto;font-size:12px;color:#565959;">Tracking: ${trackingDays}</span>
          </div>
          <div class="price-stats">
            <span>Low: ${product.currency}${product.lowestPrice.toFixed(2)}</span>
            <span>Avg: ${product.currency}${product.averagePrice.toFixed(2)}</span>
            <span>High: ${product.currency}${product.highestPrice.toFixed(2)}</span>
          </div>
          ${renderPriceHistoryChart(product)}
        </div>
        <div class="product-actions">
          <button class="set-price-alert" data-product-id="${productId}">
            ${priceAlerts[productId] ? 'Edit Alert' : 'Set Alert'}
          </button>
          <button class="remove-tracking" data-product-id="${productId}">Remove</button>
        </div>
      `;
      
      trackedItemsContainer.appendChild(trackedItem);
      
      // If there's an active alert, render it
      if (priceAlerts[productId]) {
        renderPriceAlert(trackedItem, productId, product);
      }
      
      // Add event listener for remove button
      trackedItem.querySelector('.remove-tracking').addEventListener('click', function() {
        removeTrackedProduct(productId);
      });
    });
  }
  
  // Render a simple price history chart
  function renderPriceHistoryChart(product) {
    if (product.priceHistory.length <= 1) {
      return '<div class="price-history-chart" style="opacity:0.5;display:flex;align-items:center;justify-content:center;font-size:12px;color:#565959;">Not enough data to show chart</div>';
    }
    
    // Find min and max prices for scaling
    const prices = product.priceHistory.map(entry => entry.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice || 1; // Avoid division by zero
    
    // Create chart
    let chartHtml = '<div class="price-history-chart">';
    chartHtml += '<div class="chart-line"></div>';
    
    // Plot points and lines
    for (let i = 0; i < product.priceHistory.length; i++) {
      const entry = product.priceHistory[i];
      const price = entry.price;
      
      // Calculate position
      const x = (i / (product.priceHistory.length - 1)) * 100;
      const y = 100 - ((price - minPrice) / range) * 80; // 80% of height for variation
      
      // Add point
      chartHtml += `<div class="price-point" style="left:${x}%;bottom:${y}%"></div>`;
      
      // Add line to next point
      if (i < product.priceHistory.length - 1) {
        const nextEntry = product.priceHistory[i + 1];
        const nextPrice = nextEntry.price;
        const nextX = ((i + 1) / (product.priceHistory.length - 1)) * 100;
        const nextY = 100 - ((nextPrice - minPrice) / range) * 80;
        
        // Calculate line length and angle
        const length = Math.sqrt(Math.pow(nextX - x, 2) + Math.pow(nextY - y, 2));
        const angle = Math.atan2(nextY - y, nextX - x) * (180 / Math.PI);
        
        chartHtml += `<div class="price-line" style="left:${x}%;bottom:${y}%;width:${length}%;transform:rotate(${angle}deg);transform-origin:left bottom"></div>`;
      }
    }
    
    chartHtml += '</div>';
    return chartHtml;
  }
  
  // Remove a tracked product
  function removeTrackedProduct(productId) {
    if (priceHistoryData[productId]) {
      delete priceHistoryData[productId];
      localStorage.setItem('amazonPriceHistory', JSON.stringify(priceHistoryData));
      
      // Also remove any alerts for this product
      if (priceAlerts[productId]) {
        delete priceAlerts[productId];
        localStorage.setItem('amazonPriceAlerts', JSON.stringify(priceAlerts));
      }
      
      renderPriceTrackedItems();
      showNotification('Product removed from tracking', 'info');
    }
  }
  
  // Clear all tracked products
  function clearAllTracking() {
    if (Object.keys(priceHistoryData).length === 0) {
      showNotification('No products are being tracked', 'info');
      return;
    }
    
    if (confirm('Are you sure you want to remove all tracked products?')) {
      priceHistoryData = {};
      priceAlerts = {};
      localStorage.setItem('amazonPriceHistory', JSON.stringify(priceHistoryData));
      localStorage.setItem('amazonPriceAlerts', JSON.stringify(priceAlerts));
      
      renderPriceTrackedItems();
      showNotification('All tracked products have been removed', 'info');
    }
  }
  
  // Add a new item to the shopping list
  function addShoppingListItem() {
    const itemText = shoppingListInput.value.trim();
    
    if (!itemText) {
      showNotification('Please enter an item', 'error');
      return;
    }
    
    // Create new item object
    const newItem = {
      id: Date.now().toString(),
      text: itemText,
      completed: false,
      dateAdded: new Date().toISOString()
    };
    
    // Add to array
    shoppingListItems.push(newItem);
    
    // Save to localStorage
    localStorage.setItem('amazonShoppingList', JSON.stringify(shoppingListItems));
    
    // Render updated list
    renderShoppingList();
    
    // Clear input
    shoppingListInput.value = '';
    shoppingListInput.focus();
  }
  
  // Render the shopping list
  function renderShoppingList() {
    shoppingListItemsContainer.innerHTML = '';
    
    if (shoppingListItems.length === 0) {
      shoppingListItemsContainer.innerHTML = `
        <div class="empty-list">
          <p>Your shopping list is empty.</p>
          <p>Add items to start your list.</p>
        </div>
      `;
      return;
    }
    
    // Sort items: uncompleted first, then completed
    shoppingListItems.sort((a, b) => {
      if (a.completed === b.completed) {
        // If completion status is the same, sort by date added (newest first)
        return new Date(b.dateAdded) - new Date(a.dateAdded);
      }
      // Otherwise, uncompleted first
      return a.completed ? 1 : -1;
    });
    
    // Create item elements
    shoppingListItems.forEach(item => {
      const listItem = document.createElement('div');
      listItem.className = `shopping-list-item ${item.completed ? 'completed' : ''}`;
      listItem.setAttribute('data-id', item.id);
      
      listItem.innerHTML = `
        <label class="item-checkbox">
          <input type="checkbox" ${item.completed ? 'checked' : ''}>
          <span class="checkmark"></span>
        </label>
        <span class="item-text">${item.text}</span>
        <button class="item-delete">×</button>
      `;
      
      shoppingListItemsContainer.appendChild(listItem);
      
      // Add event listeners
      const checkbox = listItem.querySelector('input[type="checkbox"]');
      const deleteButton = listItem.querySelector('.item-delete');
      
      checkbox.addEventListener('change', function() {
        toggleItemCompletion(item.id);
      });
      
      deleteButton.addEventListener('click', function() {
        removeShoppingListItem(item.id);
      });
    });
  }
  
  // Toggle item completion status
  function toggleItemCompletion(itemId) {
    const itemIndex = shoppingListItems.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      shoppingListItems[itemIndex].completed = !shoppingListItems[itemIndex].completed;
      
      // Save to localStorage
      localStorage.setItem('amazonShoppingList', JSON.stringify(shoppingListItems));
      
      // Update UI
      renderShoppingList();
    }
  }
  
  // Remove an item from the shopping list
  function removeShoppingListItem(itemId) {
    shoppingListItems = shoppingListItems.filter(item => item.id !== itemId);
    
    // Save to localStorage
    localStorage.setItem('amazonShoppingList', JSON.stringify(shoppingListItems));
    
    // Update UI
    renderShoppingList();
  }
  
  // Clear all items from the shopping list
  function clearShoppingList() {
    if (shoppingListItems.length === 0) {
      showNotification('Shopping list is already empty', 'info');
      return;
    }
    
    if (confirm('Are you sure you want to clear your shopping list?')) {
      shoppingListItems = [];
      localStorage.setItem('amazonShoppingList', JSON.stringify(shoppingListItems));
      renderShoppingList();
      showNotification('Shopping list cleared', 'info');
    }
  }
  
  // Save the shopping list (this is already auto-saved, but provides user feedback)
  function saveShoppingList() {
    localStorage.setItem('amazonShoppingList', JSON.stringify(shoppingListItems));
  }
  
  // Show a notification message
  function showNotification(message, type = 'info', duration = 3000) {
    // Remove any existing notification
    const existingNotification = document.querySelector('.amazon-notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `amazon-notification ${type}`;
    notification.textContent = message;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
      notification.classList.add('visible');
    }, 10);
    
    // Hide after duration
    setTimeout(() => {
      notification.classList.remove('visible');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, duration);
  }
  
  // Request notification permission
  function requestNotificationPermission() {
    if ("Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            showNotification("Notifications enabled for price alerts!", "success");
          }
        });
      }
    }
  }
  
  // Initialize when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShoppingList);
  } else {
    initShoppingList();
  }
  
  // Request notification permission after a short delay
  setTimeout(requestNotificationPermission, 3000);
})();
