let aiButton = null;

function init() {
  if (window.location.href.includes('outlook.')) {
    console.log('AI Email Assistant: Initializing for Outlook');
    observeOutlookChanges();
    
    // Also run checks periodically for dynamic content
    setInterval(() => {
      checkForComposeWindow();
    }, 2000);
  }
}

function observeOutlookChanges() {
  console.log('AI Email Assistant: Setting up Outlook observers');
  
  // More aggressive observer
  const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        shouldCheck = true;
      }
    });
    
    if (shouldCheck) {
      // Debounce the check
      clearTimeout(window.outlookCheckTimeout);
      window.outlookCheckTimeout = setTimeout(() => {
        checkForComposeWindow();
      }, 500);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'data-app-section', 'aria-label']
  });

  // Initial check
  setTimeout(() => checkForComposeWindow(), 1000);
  setTimeout(() => checkForComposeWindow(), 3000);
  setTimeout(() => checkForComposeWindow(), 5000);
}

function checkForComposeWindow() {
  console.log('AI Email Assistant: Checking for Outlook compose window');
  
  // Much more comprehensive selectors for different Outlook versions
  const composeSelectors = [
    // Standard compose selectors
    'div[contenteditable="true"][role="textbox"]',
    'div[contenteditable="true"][aria-label*="body"]',
    'div[contenteditable="true"][aria-label*="Message body"]',
    'div[contenteditable="true"][aria-label*="message"]',
    
    // Outlook Web App selectors
    'div[data-app-section="ConversationContainer"] div[contenteditable="true"]',
    'div[data-app-section="ComposeBodyContainer"] div[contenteditable="true"]',
    'div[data-app-section="BodyContainer"] div[contenteditable="true"]',
    'div[data-app-section="MessageBody"] div[contenteditable="true"]',
    
    // Generic compose selectors
    'div.compose-body-container div[contenteditable="true"]',
    'div[role="textbox"][contenteditable="true"]',
    'div[contenteditable="true"][data-outlook-cycle]',
    
    // More specific selectors
    'div[id*="compose"] div[contenteditable="true"]',
    'div[class*="compose"] div[contenteditable="true"]',
    'div[aria-label*="compose"] div[contenteditable="true"]',
    
    // Fallback selectors
    '[contenteditable="true"]',
    'iframe[title*="Rich Text Editor"]'
  ];
  
  let composeArea = null;
  let usedSelector = '';
  
  for (const selector of composeSelectors) {
    const elements = document.querySelectorAll(selector);
    
    for (const element of elements) {
      // Check if this looks like a compose area
      if (isValidComposeArea(element)) {
        composeArea = element;
        usedSelector = selector;
        console.log(`AI Email Assistant: Found Outlook compose area with selector: ${selector}`);
        break;
      }
    }
    
    if (composeArea) break;
  }
  
  if (composeArea && !document.getElementById('ai-email-button-outlook')) {
    console.log('AI Email Assistant: Adding AI button to Outlook compose area');
    addAIButton(composeArea);
  } else if (!composeArea) {
    console.log('AI Email Assistant: No Outlook compose area found');
  } else {
    console.log('AI Email Assistant: Outlook button already exists');
  }
  
  // Also try more aggressive searching
  setTimeout(() => aggressiveButtonPlacement(), 1000);
}

function isValidComposeArea(element) {
  // Check if this element looks like a real compose area
  if (!element || !element.isConnected) return false;
  
  // Must be contenteditable
  if (!element.contentEditable || element.contentEditable === 'false') return false;
  
  // Must be visible
  const rect = element.getBoundingClientRect();
  if (rect.width < 50 || rect.height < 20) return false;
  
  // Check if it's in a compose context
  const parentText = element.closest('div')?.textContent || '';
  const hasComposeContext = parentText.includes('To:') || 
                           parentText.includes('Subject:') ||
                           parentText.includes('Send') ||
                           element.closest('[data-app-section*="Compose"]') ||
                           element.closest('[data-app-section*="Message"]');
  
  return hasComposeContext;
}

function aggressiveButtonPlacement() {
  // If we still don't have a button, try more aggressive placement
  if (document.getElementById('ai-email-button-outlook')) {
    return; // Button already exists
  }
  
  console.log('AI Email Assistant: Trying aggressive Outlook button placement');
  
  // Look for any contenteditable area and try to place button nearby
  const editableAreas = document.querySelectorAll('[contenteditable="true"]');
  
  for (const area of editableAreas) {
    const rect = area.getBoundingClientRect();
    if (rect.width > 100 && rect.height > 50) {
      console.log('AI Email Assistant: Found potential compose area, placing button');
      addAIButton(area);
      return;
    }
  }
  
  // Last resort: create floating button
  createFloatingButton();
}

function createFloatingButton() {
  if (document.getElementById('ai-floating-button-outlook')) {
    return; // Already exists
  }
  
  console.log('AI Email Assistant: Creating floating Outlook button');
  
  const floatingButton = document.createElement('div');
  floatingButton.id = 'ai-floating-button-outlook';
  floatingButton.innerHTML = '🤖 AI Email Assistant';
  floatingButton.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%);
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    font-family: 'Segoe UI', 'Segoe UI Web', Arial, sans-serif;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    transition: all 0.2s ease;
  `;
  
  floatingButton.addEventListener('click', () => {
    // Find any compose area and generate response
    const composeArea = document.querySelector('[contenteditable="true"]');
    if (composeArea) {
      generateAIResponse(composeArea);
    } else {
      alert('Please click in an email compose area first, then try again.');
    }
  });
  
  floatingButton.addEventListener('mouseenter', () => {
    floatingButton.style.transform = 'scale(1.05)';
    floatingButton.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
  });
  
  floatingButton.addEventListener('mouseleave', () => {
    floatingButton.style.transform = 'scale(1)';
    floatingButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  });
  
  document.body.appendChild(floatingButton);
  
  // Remove after 30 seconds if not used
  setTimeout(() => {
    if (floatingButton.parentNode && !document.getElementById('ai-email-button-outlook')) {
      floatingButton.style.opacity = '0.5';
      floatingButton.innerHTML = '🤖 Click to activate';
    }
  }, 30000);
}

function addAIButton(composeArea) {
  if (document.getElementById('ai-email-button-outlook') || document.getElementById('ai-email-container-outlook')) {
    return; // Button already exists
  }

  console.log('AI Email Assistant: Starting Outlook button placement');
  
  // Try multiple placement strategies for Outlook (much more aggressive)
  let targetElement = null;
  let placementStrategy = '';
  
  // Strategy 1: Find toolbar near compose area
  const toolbarSelectors = [
    'div[role="toolbar"]',
    'div[data-app-section="ToolbarHost"]',
    'div[data-app-section="CommandBar"]',
    'div[data-app-section="Toolbar"]',
    '.ms-CommandBar',
    '[role="menubar"]'
  ];
  
  for (const selector of toolbarSelectors) {
    const toolbar = composeArea.closest('div').querySelector(selector) ||
                   composeArea.parentElement.querySelector(selector) ||
                   document.querySelector(selector);
    
    if (toolbar && toolbar.offsetWidth > 100) {
      targetElement = toolbar;
      placementStrategy = `toolbar (${selector})`;
      break;
    }
  }
  
  // Strategy 2: Find send button and place near it
  if (!targetElement) {
    const sendSelectors = [
      'button[aria-label*="Send"]',
      'button[data-app-section="SendButton"]',
      'button[title*="Send"]',
      'button[name*="send"]',
      'button[id*="send"]',
      'div[data-app-section="PrimaryCommand"]',
      '.ms-Button--primary'
    ];
    
    for (const selector of sendSelectors) {
      const sendButton = document.querySelector(selector);
      if (sendButton && sendButton.offsetParent) {
        targetElement = sendButton.parentElement;
        placementStrategy = `send button parent (${selector})`;
        break;
      }
    }
  }
  
  // Strategy 3: Find compose window containers
  if (!targetElement) {
    const composeContainerSelectors = [
      'div[data-app-section="ComposeContainer"]',
      'div[data-app-section="MessageContainer"]',
      'div[role="dialog"]',
      'div[role="main"]',
      '.compose-container',
      'div[class*="compose"]',
      'div[aria-label*="compose"]'
    ];
    
    for (const selector of composeContainerSelectors) {
      const container = composeArea.closest(selector);
      if (container) {
        // Create our own toolbar area
        const customToolbar = document.createElement('div');
        customToolbar.style.cssText = `
          padding: 6px 8px;
          border-top: 1px solid #e1e1e1;
          background: #faf9f8;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          margin-top: 4px;
          max-width: 100%;
          overflow: hidden;
          box-sizing: border-box;
        `;
        container.appendChild(customToolbar);
        targetElement = customToolbar;
        placementStrategy = `custom toolbar in ${selector}`;
        break;
      }
    }
  }
  
  // Strategy 4: Place above or below compose area
  if (!targetElement) {
    const fallbackContainer = document.createElement('div');
    fallbackContainer.style.cssText = `
      position: relative;
      margin: 8px 0;
      text-align: center;
      padding: 8px;
      background: #faf9f8;
      border-radius: 4px;
      border: 1px solid #e1e1e1;
      border-left: 3px solid #0078d4;
      z-index: 1000;
      max-width: 100%;
      overflow: hidden;
      box-sizing: border-box;
    `;
    
    if (composeArea.parentElement) {
      composeArea.parentElement.insertBefore(fallbackContainer, composeArea.nextSibling);
      targetElement = fallbackContainer;
      placementStrategy = 'fallback container after compose area';
    } else {
      composeArea.insertAdjacentElement('afterend', fallbackContainer);
      targetElement = fallbackContainer;
      placementStrategy = 'fallback container adjacent to compose area';
    }
  }
  
  // Strategy 5: Last resort - floating positioning
  if (!targetElement) {
    const rect = composeArea.getBoundingClientRect();
    const floatingContainer = document.createElement('div');
    floatingContainer.style.cssText = `
      position: absolute;
      top: ${rect.bottom + 10}px;
      left: ${rect.left}px;
      z-index: 10000;
      background: white;
      padding: 8px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;
    document.body.appendChild(floatingContainer);
    targetElement = floatingContainer;
    placementStrategy = 'floating position';
  }
  
  console.log(`AI Email Assistant: Using placement strategy: ${placementStrategy}`);
  
  if (targetElement) {
    // Create container for AI buttons
    const aiContainer = document.createElement('div');
    aiContainer.id = 'ai-email-container-outlook';
    aiContainer.style.cssText = `
      display: inline-flex;
      align-items: center;
      margin: 4px;
      flex-wrap: nowrap;
      max-width: fit-content;
      box-sizing: border-box;
      position: relative;
      height: 36px;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
    `;
    
    // Main AI button
    aiButton = document.createElement('button');
    aiButton.id = 'ai-email-button-outlook';
    aiButton.innerHTML = '🤖 Generate AI Reply';
    aiButton.style.cssText = `
      background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%);
      color: white;
      border: none;
      padding: 0 16px;
      border-radius: 4px 0 0 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      font-family: 'Segoe UI', 'Segoe UI Web', Arial, sans-serif;
      transition: all 0.2s ease;
      position: relative;
      z-index: 1000;
      height: 36px;
      min-width: 140px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      box-sizing: border-box;
      border-right: 1px solid rgba(255,255,255,0.2);
    `;
    
    // Dropdown button for more options
    const dropdownButton = document.createElement('button');
    dropdownButton.id = 'ai-options-button-outlook';
    dropdownButton.innerHTML = '▲';
    dropdownButton.style.cssText = `
      background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%);
      color: white;
      border: none;
      padding: 0 10px;
      border-radius: 0 4px 4px 0;
      cursor: pointer;
      font-size: 10px;
      font-weight: 600;
      font-family: 'Segoe UI', 'Segoe UI Web', Arial, sans-serif;
      transition: all 0.2s ease;
      position: relative;
      z-index: 1000;
      height: 36px;
      width: 36px;
      box-sizing: border-box;
    `;
    
    // Options menu
    const optionsMenu = document.createElement('div');
    optionsMenu.id = 'ai-options-menu-outlook';
    optionsMenu.style.cssText = `
      display: none;
      position: absolute;
      bottom: 100%;
      right: 0;
      background: white;
      border: 1px solid #d1d1d1;
      border-radius: 8px;
      box-shadow: 0 8px 28px rgba(0,0,0,0.28), 0 0 8px rgba(0,0,0,0.12);
      z-index: 1001;
      min-width: 200px;
      margin-bottom: 8px;
      overflow: hidden;
      box-sizing: border-box;
      backdrop-filter: blur(8px);
    `;
    
    const options = [
      { text: '🎯 Formal Response', tone: 'formal' },
      { text: '💬 Casual Response', tone: 'casual' },
      { text: '📝 Brief Response', tone: 'brief' },
      { text: '📋 Detailed Response', tone: 'detailed' },
      { text: '🤝 Diplomatic Response', tone: 'diplomatic' }
    ];
    
    options.forEach((option, index) => {
      const optionItem = document.createElement('div');
      optionItem.style.cssText = `
        padding: 12px 16px;
        cursor: pointer;
        ${index < options.length - 1 ? 'border-bottom: 1px solid #f3f2f1;' : ''}
        font-size: 13px;
        font-family: 'Segoe UI', 'Segoe UI Web', Arial, sans-serif;
        transition: all 0.15s ease;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: flex;
        align-items: center;
        color: #323130;
      `;
      optionItem.textContent = option.text;
      
      optionItem.addEventListener('mouseenter', () => {
        optionItem.style.backgroundColor = '#f3f2f1';
        optionItem.style.color = '#0078d4';
      });
      
      optionItem.addEventListener('mouseleave', () => {
        optionItem.style.backgroundColor = 'transparent';
        optionItem.style.color = '#323130';
      });
      
      optionItem.addEventListener('click', () => {
        generateAIResponse(composeArea, option.tone);
        optionsMenu.style.display = 'none';
      });
      
      optionsMenu.appendChild(optionItem);
    });
    
    aiContainer.appendChild(aiButton);
    aiContainer.appendChild(dropdownButton);
    aiContainer.appendChild(optionsMenu);
    
    // Add hover effects to container instead of individual buttons
    aiContainer.addEventListener('mouseenter', () => {
      const mainBtn = document.getElementById('ai-email-button-outlook');
      const dropBtn = document.getElementById('ai-options-button-outlook');
      
      if (mainBtn) {
        mainBtn.style.background = 'linear-gradient(135deg, #005a9e 0%, #004578 100%)';
      }
      if (dropBtn) {
        dropBtn.style.background = 'linear-gradient(135deg, #005a9e 0%, #004578 100%)';
      }
      aiContainer.style.transform = 'translateY(-1px)';
      aiContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });
    
    aiContainer.addEventListener('mouseleave', () => {
      const mainBtn = document.getElementById('ai-email-button-outlook');
      const dropBtn = document.getElementById('ai-options-button-outlook');
      
      if (mainBtn) {
        mainBtn.style.background = 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)';
      }
      if (dropBtn) {
        dropBtn.style.background = 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)';
      }
      aiContainer.style.transform = 'translateY(0)';
      aiContainer.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)';
    });
    
    // Main button click
    aiButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      generateAIResponse(composeArea);
    });
    
    // Dropdown button click
    dropdownButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const menu = document.getElementById('ai-options-menu-outlook');
      if (menu) {
        const isVisible = menu.style.display === 'block';
        menu.style.display = isVisible ? 'none' : 'block';
      }
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      const container = document.getElementById('ai-email-container-outlook');
      const menu = document.getElementById('ai-options-menu-outlook');
      
      if (container && menu && !container.contains(e.target)) {
        menu.style.display = 'none';
      }
    });
    
    targetElement.appendChild(aiContainer);
    
    // Add a subtle animation to draw attention
    aiContainer.animate([
      { transform: 'scale(1)', opacity: '0.8' },
      { transform: 'scale(1.05)', opacity: '1' },
      { transform: 'scale(1)', opacity: '1' }
    ], {
      duration: 600,
      easing: 'ease-out'
    });
    
    console.log('AI Email Assistant: Outlook button with options added successfully');
  } else {
    console.error('AI Email Assistant: Failed to find target element for Outlook button');
    
    // Emergency fallback - create a very visible notification
    createEmergencyButton(composeArea);
  }
}

function createEmergencyButton(composeArea) {
  if (document.getElementById('ai-emergency-button-outlook')) {
    return;
  }
  
  console.log('AI Email Assistant: Creating emergency Outlook button');
  
  const emergencyButton = document.createElement('div');
  emergencyButton.id = 'ai-emergency-button-outlook';
  emergencyButton.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: bold;
      text-align: center;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(255,107,53,0.3);
      margin: 16px 0;
      font-family: 'Segoe UI', 'Segoe UI Web', Arial, sans-serif;
    ">
      🤖 AI EMAIL ASSISTANT - CLICK TO GENERATE RESPONSE
    </div>
  `;
  
  emergencyButton.addEventListener('click', () => {
    generateAIResponse(composeArea);
  });
  
  // Try to place it in various locations
  if (composeArea.parentElement) {
    composeArea.parentElement.insertBefore(emergencyButton, composeArea);
  } else {
    composeArea.insertAdjacentElement('beforebegin', emergencyButton);
  }
  
  // Add pulsing animation to make it very obvious
  emergencyButton.animate([
    { transform: 'scale(1)', opacity: '1' },
    { transform: 'scale(1.05)', opacity: '0.9' },
    { transform: 'scale(1)', opacity: '1' }
  ], {
    duration: 2000,
    iterations: Infinity
  });
}

async function generateAIResponse(composeArea, tone = 'professional') {
  try {
    // Find any available button to update
    const buttonElement = aiButton || 
                         document.getElementById('ai-email-button-outlook') ||
                         document.getElementById('ai-floating-button-outlook') ||
                         document.getElementById('ai-emergency-button-outlook');
    
    if (buttonElement) {
      buttonElement.disabled = true;
      const originalHTML = buttonElement.innerHTML;
      buttonElement.innerHTML = '🔄 Regenerate';
      buttonElement.style.pointerEvents = 'none';
    }
    
    const emailChain = extractEmailChain();
    const attachments = extractAttachments();
    
    console.log('Sending Outlook email chain to AI:', emailChain.substring(0, 200) + '...');
    
    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      throw new Error('Extension context invalidated. Please refresh the page.');
    }
    
    const response = await sendMessageWithRetry({
      action: 'generateResponse',
      data: {
        emailChain,
        attachments,
        tone
      }
    });
    
    if (response.success) {
      composeArea.innerHTML = response.data;
      composeArea.focus();
      
      // Show success feedback
      if (buttonElement) {
        buttonElement.innerHTML = '✅ Generated!';
        buttonElement.style.background = 'linear-gradient(135deg, #107c10 0%, #0e4b0e 100%)';
        
        // Also update dropdown button if it exists
        const dropdownBtn = document.getElementById('ai-options-button-outlook');
        if (dropdownBtn) {
          dropdownBtn.style.background = 'linear-gradient(135deg, #107c10 0%, #0e4b0e 100%)';
        }
        
        setTimeout(() => {
          if (buttonElement && buttonElement.parentNode) {
            buttonElement.innerHTML = '🤖 Generate AI Reply';
            buttonElement.style.background = buttonElement.id.includes('emergency') ? 
              'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)' :
              'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)';
            buttonElement.style.pointerEvents = 'auto';
          }
          
          const dropdownBtnLater = document.getElementById('ai-options-button-outlook');
          if (dropdownBtnLater) {
            dropdownBtnLater.style.background = 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)';
          }
        }, 2000);
      }
    } else {
      alert('Error generating response: ' + response.error);
    }
  } catch (error) {
    handleExtensionError(error);
  } finally {
    const currentButtonElement = aiButton || 
                                document.getElementById('ai-email-button-outlook') ||
                                document.getElementById('ai-floating-button-outlook') ||
                                document.getElementById('ai-emergency-button-outlook');
    
    if (currentButtonElement) {
      currentButtonElement.disabled = false;
      currentButtonElement.style.pointerEvents = 'auto';
      if (currentButtonElement.innerHTML === '🔄 Regenerate') {
        currentButtonElement.innerHTML = '🤖 Generate AI Reply';
      }
    }
  }
}

async function sendMessageWithRetry(message, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check if chrome.runtime is available
      if (!chrome.runtime?.id) {
        throw new Error('Extension context invalidated');
      }
      
      const response = await chrome.runtime.sendMessage(message);
      return response;
    } catch (error) {
      console.log(`AI Email Assistant Outlook: Attempt ${attempt} failed:`, error.message);
      
      if (error.message.includes('Extension context invalidated') || 
          error.message.includes('message port closed') ||
          error.message.includes('receiving end does not exist')) {
        
        if (attempt === maxRetries) {
          throw new Error('Extension needs to be reloaded. Please refresh the page and try again.');
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      // Non-context errors, rethrow immediately
      throw error;
    }
  }
}

function handleExtensionError(error) {
  console.error('AI Email Assistant Outlook error:', error);
  
  if (error.message.includes('Extension context invalidated') ||
      error.message.includes('Extension needs to be reloaded') ||
      error.message.includes('refresh the page')) {
    
    // Show user-friendly error with instructions
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fff4ce;
      color: #8a6d00;
      border: 1px solid #ffeaa7;
      border-radius: 4px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      z-index: 10000;
      max-width: 350px;
      font-family: 'Segoe UI', 'Segoe UI Web', Arial, sans-serif;
      font-size: 14px;
    `;
    
    errorDiv.innerHTML = `
      <strong>Extension Needs Refresh</strong><br>
      The AI Email Assistant was updated. Please refresh this page to continue using it.
      <br><br>
      <button onclick="window.location.reload()" style="
        background: #0078d4;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 8px;
      ">Refresh Page</button>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 10000);
  } else {
    // Regular error handling
    alert('Error: ' + error.message);
  }
}

function extractEmailChain() {
  console.log('AI Email Assistant: Starting Outlook email chain extraction');
  const emails = [];
  
  // Try multiple strategies to find conversation container
  const conversationContainer = document.querySelector('div[data-app-section="ConversationContainer"]') ||
                               document.querySelector('div[role="main"]') ||
                               document.querySelector('.wide-content-host') ||
                               document.querySelector('div[data-app-section="ReadingPaneContainer"]') ||
                               document.querySelector('.scrollable-pane') ||
                               document.body;
  
  if (!conversationContainer) {
    console.log('AI Email Assistant: No Outlook conversation container found');
    return 'No conversation container found';
  }
  
  // Enhanced selectors for Outlook email messages
  const emailSelectors = [
    'div[data-convid]',
    '.ItemPart-container',
    'div[role="listitem"]',
    'div[data-app-section="MessageContainer"]',
    'div[data-app-section="ItemContainer"]',
    '.message-item',
    'div[aria-label*="message"]'
  ];
  
  let emailElements = [];
  for (const selector of emailSelectors) {
    emailElements = conversationContainer.querySelectorAll(selector);
    if (emailElements.length > 0) {
      console.log(`AI Email Assistant: Found ${emailElements.length} Outlook emails using selector: ${selector}`);
      break;
    }
  }
  
  if (emailElements.length === 0) {
    // Fallback: try to extract from current view
    console.log('AI Email Assistant: No Outlook email elements found, trying fallback extraction');
    const fallbackContent = extractOutlookFallbackContent();
    return fallbackContent || 'No email content could be extracted from the current Outlook view';
  }
  
  emailElements.forEach((emailEl, index) => {
    try {
      // Extract sender information with multiple strategies
      const senderSelectors = [
        'span[title*="@"]',
        'button[aria-label*="@"]',
        '.sender-name',
        'div[data-app-section="SenderContainer"] span',
        'button[data-app-section="PersonaButton"]',
        '.persona-name',
        'span[data-automation-id="sender-name"]'
      ];
      
      let sender = 'Unknown Sender';
      for (const selector of senderSelectors) {
        const senderEl = emailEl.querySelector(selector);
        if (senderEl) {
          sender = senderEl.textContent || 
                  senderEl.getAttribute('title') || 
                  senderEl.getAttribute('aria-label') || 
                  sender;
          break;
        }
      }
      
      // Extract timestamp
      const timestampSelectors = [
        'span[data-app-section="TimeStamp"]',
        '.timestamp',
        'span[title*="20"]',
        'time',
        'span[data-automation-id="date-time"]'
      ];
      
      let timestamp = '';
      for (const selector of timestampSelectors) {
        const timestampEl = emailEl.querySelector(selector);
        if (timestampEl) {
          timestamp = timestampEl.textContent || 
                     timestampEl.getAttribute('title') || 
                     timestampEl.getAttribute('datetime') || 
                     '';
          break;
        }
      }
      
      // Extract subject (usually at thread level)
      const subjectSelectors = [
        'span[data-app-section="SubjectContainer"]',
        'h1',
        '.subject',
        'div[data-app-section="Subject"] span',
        'span[data-automation-id="subject"]'
      ];
      
      let subject = 'No Subject';
      for (const selector of subjectSelectors) {
        const subjectEl = document.querySelector(selector);
        if (subjectEl && subjectEl.textContent.trim()) {
          subject = subjectEl.textContent.trim();
          break;
        }
      }
      
      // Extract email body with multiple strategies
      const bodySelectors = [
        'div[data-app-section="BodyContainer"]',
        '.email-body',
        'div[role="document"]',
        'div[data-app-section="MessageBody"]',
        '.message-body',
        'div[contenteditable="false"]',
        '.rps_e7b5'
      ];
      
      let body = '';
      for (const selector of bodySelectors) {
        const bodyEl = emailEl.querySelector(selector);
        if (bodyEl) {
          // Get text content and clean it up
          const textContent = bodyEl.innerText || bodyEl.textContent || '';
          if (textContent.trim().length > 10) {
            body = textContent.trim();
            break;
          }
        }
      }
      
      // If no body found, try getting all text from the email element
      if (!body) {
        const allText = emailEl.innerText || emailEl.textContent || '';
        // Filter out common Outlook UI text
        const filteredText = allText
          .replace(/^(Reply|Reply All|Forward|Delete|Archive).*/, '')
          .replace(/Show more.*/, '')
          .replace(/^\d{1,2}:\d{2}\s*(AM|PM).*/, '')
          .replace(/Microsoft Outlook.*/, '')
          .trim();
        
        if (filteredText.length > 20) {
          body = filteredText;
        }
      }
      
      if (body && body.length > 10) {
        const emailData = `Email ${index + 1}:
From: ${sender}
${timestamp ? `Date: ${timestamp}` : ''}
Subject: ${subject}
Body: ${body}
---`;
        
        emails.push(emailData);
        console.log(`AI Email Assistant: Extracted Outlook email ${index + 1} from ${sender}`);
      }
    } catch (error) {
      console.log(`AI Email Assistant: Error extracting Outlook email ${index + 1}:`, error);
    }
  });
  
  const result = emails.length > 0 ? emails.join('\n\n') : 'No readable email content found';
  console.log(`AI Email Assistant: Extracted ${emails.length} Outlook emails total`);
  console.log('Outlook email chain preview:', result.substring(0, 200) + '...');
  
  return result;
}

function extractOutlookFallbackContent() {
  // Try to extract from visible content in the main Outlook area
  const mainContent = document.querySelector('div[data-app-section="ConversationContainer"]') ||
                     document.querySelector('div[role="main"]') ||
                     document.querySelector('.wide-content-host') ||
                     document.querySelector('body');
  
  if (!mainContent) return null;
  
  // Look for any visible email-like content
  const contentElements = mainContent.querySelectorAll('div, span, p');
  let visibleText = '';
  
  contentElements.forEach(el => {
    const text = el.innerText || el.textContent || '';
    if (text.trim().length > 20 && 
        !text.includes('Outlook') && 
        !text.includes('Compose') &&
        !text.includes('Inbox') &&
        !text.includes('Microsoft') &&
        el.offsetHeight > 0) {
      visibleText += text.trim() + '\n';
    }
  });
  
  return visibleText.length > 50 ? `Fallback Outlook Content:\n${visibleText}` : null;
}

function extractAttachments() {
  const attachments = [];
  const attachmentElements = document.querySelectorAll('button[aria-label*="attachment"]') ||
                           document.querySelectorAll('div[data-app-section="AttachmentWell"] button') ||
                           document.querySelectorAll('.attachment-item');
  
  attachmentElements.forEach(el => {
    const fileName = el.textContent || el.getAttribute('aria-label') || el.getAttribute('title') || 'Unknown file';
    attachments.push(fileName);
  });
  
  return attachments.length > 0 ? attachments.join(', ') : null;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}