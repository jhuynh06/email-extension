let aiButton = null;
let overlayContainer = null;
let currentComposeArea = null;
let isGenerating = false;
let hasGenerated = false;
let positionUpdateInterval = null;

function init() {
  if (window.location.href.includes('outlook.')) {
    console.log('AI Email Assistant: Initializing for Outlook');
    createOverlaySystem();
    observeOutlookChanges();
    
    // Also run checks periodically for dynamic content
    setInterval(() => {
      checkForComposeWindow();
    }, 2000);
  }
}

function createOverlaySystem() {
  // Create the main overlay container
  overlayContainer = document.createElement('div');
  overlayContainer.id = 'ai-email-overlay-outlook';
  overlayContainer.style.cssText = `
    position: fixed;
    z-index: 10000;
    display: none;
    pointer-events: auto;
    font-family: 'Segoe UI', 'Segoe UI Web', Arial, sans-serif;
    contain: layout style;
    isolation: isolate;
  `;
  
  document.body.appendChild(overlayContainer);
  
  // Add overlay styles
  const overlayStyle = document.createElement('style');
  overlayStyle.id = 'ai-overlay-styles-outlook';
  overlayStyle.textContent = `
    #ai-email-overlay-outlook {
      filter: drop-shadow(0 4px 12px rgba(0,0,0,0.15));
    }
    
    #ai-email-overlay-outlook * {
      box-sizing: border-box !important;
      transform: none !important;
    }
    
    #ai-email-overlay-outlook:hover {
      filter: drop-shadow(0 6px 16px rgba(0,0,0,0.2));
    }
    
    @keyframes ai-pulse-outlook {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    
    .ai-generating-outlook {
      animation: ai-pulse-outlook 1.5s ease-in-out infinite;
    }
  `;
  
  if (!document.getElementById('ai-overlay-styles-outlook')) {
    document.head.appendChild(overlayStyle);
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
  
  if (composeArea) {
    if (currentComposeArea !== composeArea) {
      currentComposeArea = composeArea;
      showOverlay(composeArea);
      // Reset state for new compose area
      hasGenerated = false;
      isGenerating = false;
    }
  } else {
    if (currentComposeArea) {
      currentComposeArea = null;
      hideOverlay();
    }
  }
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
  
  // Check if it's visible and in viewport
  return hasComposeContext && rect.top >= 0 && rect.left >= 0 && 
         rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
}

// Remove aggressive button placement as we're using overlay system

// Remove floating button as we're using overlay system

function showOverlay(composeArea) {
  if (!overlayContainer) return;
  
  // Create the overlay content
  overlayContainer.innerHTML = '';
  
  const overlayContent = document.createElement('div');
  overlayContent.style.cssText = `
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    border: 1px solid #d1d1d1;
    padding: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 180px;
    max-width: 280px;
  `;
  
  // Main AI button
  aiButton = document.createElement('button');
  aiButton.id = 'ai-email-button-outlook';
  updateButtonState();
  aiButton.style.cssText = `
    background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%);
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    font-family: 'Segoe UI', 'Segoe UI Web', Arial, sans-serif;
    transition: all 0.2s ease;
    flex: 1;
    min-width: 120px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `;
  
  // Dropdown button for more options
  const dropdownButton = document.createElement('button');
  dropdownButton.id = 'ai-options-button-outlook';
  dropdownButton.innerHTML = '▼';
  dropdownButton.style.cssText = `
    background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%);
    color: white;
    border: none;
    padding: 10px 8px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 600;
    font-family: 'Segoe UI', 'Segoe UI Web', Arial, sans-serif;
    transition: all 0.2s ease;
  `;
  
  // Options menu
  const optionsMenu = document.createElement('div');
  optionsMenu.id = 'ai-options-menu-outlook';
  optionsMenu.style.cssText = `
    display: none;
    position: absolute;
    background: white;
    border: 1px solid #d1d1d1;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    z-index: 10001;
    min-width: 200px;
    overflow: hidden;
  `;
  
  const options = [
    { text: '🎯 Formal Response', tone: 'formal' },
    { text: '💬 Casual Response', tone: 'casual' },
    { text: '📝 Brief Response', tone: 'brief' },
    { text: '📋 Detailed Response', tone: 'detailed' },
    { text: '🤝 Diplomatic Response', tone: 'diplomatic' }
  ];
  
  options.forEach(option => {
    const optionItem = document.createElement('div');
    optionItem.style.cssText = `
      padding: 12px 16px;
      cursor: pointer;
      border-bottom: 1px solid #f3f2f1;
      font-size: 13px;
      font-family: 'Segoe UI', 'Segoe UI Web', Arial, sans-serif;
      transition: background-color 0.15s ease;
      white-space: nowrap;
    `;
    optionItem.textContent = option.text;
    
    optionItem.addEventListener('mouseenter', () => {
      optionItem.style.backgroundColor = '#f8f9fa';
    });
    
    optionItem.addEventListener('mouseleave', () => {
      optionItem.style.backgroundColor = 'white';
    });
    
    optionItem.addEventListener('click', () => {
      generateAIResponse(composeArea, option.tone);
      optionsMenu.style.display = 'none';
    });
    
    optionsMenu.appendChild(optionItem);
  });
  
  // Remove the last border
  if (options.length > 0) {
    optionsMenu.lastChild.style.borderBottom = 'none';
  }
  
  overlayContent.appendChild(aiButton);
  overlayContent.appendChild(dropdownButton);
  overlayContent.appendChild(optionsMenu);
  
  overlayContainer.appendChild(overlayContent);
  
  // Add hover effects
  [aiButton, dropdownButton].forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'linear-gradient(135deg, #005a9e 0%, #004578 100%)';
      btn.style.transform = 'translateY(-1px)';
    });
    
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)';
      btn.style.transform = 'translateY(0)';
    });
  });
  
  // Main button click
  aiButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasGenerated && !isGenerating) {
      // Regenerate
      hasGenerated = false;
      generateAIResponse(composeArea);
    } else if (!isGenerating) {
      // Generate
      generateAIResponse(composeArea);
    }
  });
  
  // Dropdown button click
  dropdownButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleOptionsMenu(optionsMenu);
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!overlayContainer.contains(e.target)) {
      optionsMenu.style.display = 'none';
    }
  });
  
  // Position and show overlay
  positionOverlay(composeArea);
  overlayContainer.style.display = 'block';
  
  // Start position monitoring
  if (positionUpdateInterval) {
    clearInterval(positionUpdateInterval);
  }
  positionUpdateInterval = setInterval(() => {
    if (currentComposeArea && overlayContainer.style.display === 'block') {
      positionOverlay(currentComposeArea);
    }
  }, 500);
  
  console.log('AI Email Assistant: Grammarly-style Outlook overlay shown');
}

function hideOverlay() {
  if (overlayContainer) {
    overlayContainer.style.display = 'none';
  }
  if (positionUpdateInterval) {
    clearInterval(positionUpdateInterval);
    positionUpdateInterval = null;
  }
}

function positionOverlay(composeArea) {
  if (!overlayContainer || !composeArea) return;
  
  const rect = composeArea.getBoundingClientRect();
  const overlayRect = overlayContainer.getBoundingClientRect();
  
  // Position to the right of the compose area, with some margin
  let left = rect.right + 12;
  let top = rect.top;
  
  // Ensure it doesn't go off-screen
  if (left + overlayRect.width > window.innerWidth) {
    left = rect.left - overlayRect.width - 12; // Position to the left instead
  }
  
  if (left < 0) {
    left = 12; // Fallback to left edge with margin
  }
  
  if (top + overlayRect.height > window.innerHeight) {
    top = window.innerHeight - overlayRect.height - 12;
  }
  
  if (top < 0) {
    top = 12;
  }
  
  overlayContainer.style.left = `${left}px`;
  overlayContainer.style.top = `${top}px`;
}

function toggleOptionsMenu(optionsMenu) {
  const isVisible = optionsMenu.style.display === 'block';
  
  if (isVisible) {
    optionsMenu.style.display = 'none';
    return;
  }
  
  // Smart positioning to avoid scrolling
  const overlayRect = overlayContainer.getBoundingClientRect();
  const menuWidth = 200;
  const menuHeight = 250; // Approximate height
  
  let menuLeft = 0;
  let menuTop = '100%';
  
  // Check if menu would go off right edge
  if (overlayRect.right + menuWidth > window.innerWidth) {
    menuLeft = -(menuWidth - overlayRect.width);
  }
  
  // Check if menu would go off bottom edge
  if (overlayRect.bottom + menuHeight > window.innerHeight) {
    menuTop = `-${menuHeight}px`; // Show above instead
  }
  
  optionsMenu.style.left = `${menuLeft}px`;
  optionsMenu.style.top = menuTop;
  optionsMenu.style.display = 'block';
}

function updateButtonState() {
  if (!aiButton) return;
  
  if (isGenerating) {
    aiButton.innerHTML = '🔄 Generating...';
    aiButton.classList.add('ai-generating-outlook');
    aiButton.disabled = true;
  } else if (hasGenerated) {
    aiButton.innerHTML = '🔄 Regenerate';
    aiButton.classList.remove('ai-generating-outlook');
    aiButton.disabled = false;
  } else {
    aiButton.innerHTML = '🤖 Generate AI Reply';
    aiButton.classList.remove('ai-generating-outlook');
    aiButton.disabled = false;
  }
}

// Remove emergency button as we're using overlay system

async function generateAIResponse(composeArea, tone = 'professional') {
  try {
    isGenerating = true;
    updateButtonState();
    
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
      
      // Update state to show regenerate option
      hasGenerated = true;
      isGenerating = false;
      updateButtonState();
      
      // Show brief success feedback
      const originalBackground = aiButton.style.background;
      aiButton.style.background = 'linear-gradient(135deg, #107c10 0%, #0e4b0e 100%)';
      
      setTimeout(() => {
        aiButton.style.background = originalBackground;
      }, 1000);
    } else {
      throw new Error(response.error || 'Unknown error occurred');
    }
  } catch (error) {
    handleExtensionError(error);
  } finally {
    isGenerating = false;
    updateButtonState();
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

// Cleanup on page navigation
window.addEventListener('beforeunload', () => {
  if (positionUpdateInterval) {
    clearInterval(positionUpdateInterval);
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}