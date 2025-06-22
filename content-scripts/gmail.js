let aiButton = null;

function init() {
  if (window.location.href.includes('mail.google.com')) {
    observeGmailChanges();
  }
}

function observeGmailChanges() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        checkForComposeWindow();
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  checkForComposeWindow();
}

function checkForComposeWindow() {
  // Multiple selectors to catch different Gmail compose modes
  const composeSelectors = [
    'div[role="textbox"][aria-label*="Message Body"]',
    'div[contenteditable="true"][role="textbox"]',
    'div[contenteditable="true"][aria-label*="Message Body"]',
    'div[contenteditable="true"][data-message-id]',
    'div.Am.Al.editable',
    'div[g_editable="true"]',
    'div.editable[role="textbox"]'
  ];
  
  let composeArea = null;
  for (const selector of composeSelectors) {
    composeArea = document.querySelector(selector);
    if (composeArea) {
      console.log(`AI Email Assistant: Found compose area with selector: ${selector}`);
      break;
    }
  }
  
  if (composeArea && !document.getElementById('ai-email-button')) {
    console.log('AI Email Assistant: Adding AI button to Gmail compose area');
    addAIButton(composeArea);
  }
  
  // Also check for reply/forward scenarios
  const replyArea = document.querySelector('div[aria-label*="Reply"]') ||
                   document.querySelector('div[aria-label*="Forward"]');
  if (replyArea && !document.getElementById('ai-email-button')) {
    const textbox = replyArea.querySelector('div[contenteditable="true"]');
    if (textbox) {
      console.log('AI Email Assistant: Adding AI button to Gmail reply area');
      addAIButton(textbox);
    }
  }
}

function addAIButton(composeArea) {
  if (document.getElementById('ai-email-button')) {
    return; // Button already exists
  }

  // Find Gmail's specific table structure to avoid dC div conflicts
  let targetElement = null;
  
  // Strategy 1: Find the btC tr element and look for gU Up td
  const btcRow = document.querySelector('tr.btC');
  if (btcRow) {
    const guUpTd = btcRow.querySelector('td.gU.Up');
    const ocGuTd = btcRow.querySelector('td.oc.gU');
    
    if (guUpTd && ocGuTd) {
      // Create a new td element to insert between gU Up and oc gU
      const aiTd = document.createElement('td');
      aiTd.className = 'gU ai-button-cell';
      aiTd.style.cssText = `
        vertical-align: middle;
        padding: 0 4px;
        white-space: nowrap;
      `;
      
      // Insert the new td after gU Up and before oc gU
      btcRow.insertBefore(aiTd, ocGuTd);
      targetElement = aiTd;
      console.log('AI Email Assistant: Placed button in btC row between gU Up and oc gU');
    }
  }
  
  // Strategy 2: Look for compose toolbar outside dC div
  if (!targetElement) {
    const composeForm = composeArea.closest('div[role="dialog"]') || composeArea.closest('form');
    if (composeForm) {
      // Look for table with btC class
      const btcTable = composeForm.querySelector('table');
      if (btcTable) {
        const existingRow = btcTable.querySelector('tr.btC');
        if (existingRow) {
          // Create new td at the end of existing row
          const aiTd = document.createElement('td');
          aiTd.className = 'gU ai-button-cell';
          aiTd.style.cssText = `
            vertical-align: middle;
            padding: 0 4px;
            white-space: nowrap;
          `;
          existingRow.appendChild(aiTd);
          targetElement = aiTd;
          console.log('AI Email Assistant: Added button to end of btC row');
        }
      }
    }
  }
  
  // Strategy 3: Create our own row in the table structure
  if (!targetElement) {
    const composeForm = composeArea.closest('div[role="dialog"]') || composeArea.closest('form');
    if (composeForm) {
      const table = composeForm.querySelector('table') || composeForm.querySelector('tbody')?.parentElement;
      if (table) {
        const newRow = document.createElement('tr');
        newRow.className = 'ai-button-row';
        
        const aiTd = document.createElement('td');
        aiTd.colSpan = 10; // Span multiple columns
        aiTd.style.cssText = `
          text-align: right;
          padding: 4px 8px;
          vertical-align: middle;
        `;
        
        newRow.appendChild(aiTd);
        table.appendChild(newRow);
        targetElement = aiTd;
        console.log('AI Email Assistant: Created new row in table structure');
      }
    }
  }
  
  // Strategy 4: Fallback outside any dC div
  if (!targetElement) {
    const composeDialog = composeArea.closest('div[role="dialog"]');
    if (composeDialog) {
      const fallbackContainer = document.createElement('div');
      fallbackContainer.style.cssText = `
        position: relative;
        margin: 8px 0;
        text-align: right;
        padding: 8px;
        background: transparent;
        max-width: 100%;
        overflow: hidden;
        box-sizing: border-box;
      `;
      composeDialog.appendChild(fallbackContainer);
      targetElement = fallbackContainer;
      console.log('AI Email Assistant: Used fallback placement outside dC div');
    }
  }
  
  if (targetElement) {
    // Inject CSS to prevent overflow issues globally
    const overflowFixStyle = document.createElement('style');
    overflowFixStyle.textContent = `
      #ai-email-button, #ai-options-button {
        transform: none !important;
        box-shadow: none !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
      }
      
      #ai-email-button:hover, #ai-options-button:hover {
        transform: none !important;
        box-shadow: none !important;
      }
      
      #ai-email-button::before, #ai-email-button::after,
      #ai-options-button::before, #ai-options-button::after {
        display: none !important;
      }
      
      #ai-email-container {
        overflow: visible;
        contain: layout;
      }
    `;
    
    if (!document.getElementById('ai-overflow-fix-styles')) {
      overflowFixStyle.id = 'ai-overflow-fix-styles';
      document.head.appendChild(overflowFixStyle);
    }
    // Create container for AI buttons - optimized for table cell placement
    const aiContainer = document.createElement('div');
    aiContainer.id = 'ai-email-container';
    aiContainer.style.cssText = `
      display: inline-flex;
      gap: 2px;
      align-items: center;
      margin: 0;
      flex-wrap: nowrap;
      box-sizing: border-box;
      position: relative;
      overflow: visible;
      contain: layout;
      transform: none;
      vertical-align: middle;
    `;
    
    // Main AI button
    aiButton = document.createElement('button');
    aiButton.id = 'ai-email-button';
    aiButton.innerHTML = '🤖 Generate AI Reply';
    aiButton.style.cssText = `
      background: linear-gradient(135deg, #4285f4 0%, #1a73e8 100%);
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      font-family: 'Google Sans', 'Segoe UI', Arial, sans-serif;
      box-shadow: none;
      transition: background-color 0.2s ease, opacity 0.2s ease;
      position: relative;
      z-index: 1;
      min-width: 120px;
      max-width: 150px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      box-sizing: border-box;
      transform: none;
    `;
    
    // Dropdown button for more options
    const dropdownButton = document.createElement('button');
    dropdownButton.id = 'ai-options-button';
    dropdownButton.innerHTML = '▼';
    dropdownButton.style.cssText = `
      background: linear-gradient(135deg, #4285f4 0%, #1a73e8 100%);
      color: white;
      border: none;
      padding: 10px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 500;
      font-family: 'Google Sans', 'Segoe UI', Arial, sans-serif;
      box-shadow: none;
      transition: background-color 0.2s ease, opacity 0.2s ease;
      position: relative;
      z-index: 1;
      box-sizing: border-box;
      transform: none;
    `;
    
    // Options menu
    const optionsMenu = document.createElement('div');
    optionsMenu.id = 'ai-options-menu';
    optionsMenu.style.cssText = `
      display: none;
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border: 1px solid #dadce0;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 1001;
      min-width: 180px;
      max-width: 220px;
      margin-top: 2px;
      overflow: hidden;
      box-sizing: border-box;
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
        padding: 10px 12px;
        cursor: pointer;
        border-bottom: 1px solid #f1f3f4;
        font-size: 13px;
        font-family: 'Google Sans', 'Segoe UI', Arial, sans-serif;
        transition: background-color 0.15s ease;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      `;
      optionItem.textContent = option.text;
      
      optionItem.addEventListener('mouseenter', () => {
        optionItem.style.backgroundColor = '#f5f5f5';
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
    
    aiContainer.appendChild(aiButton);
    aiContainer.appendChild(dropdownButton);
    aiContainer.appendChild(optionsMenu);
    
    // Add overflow-safe hover effects - only color and opacity changes
    [aiButton, dropdownButton].forEach(btn => {
      // Remove any problematic attributes that might cause overflow
      btn.removeAttribute('data-tooltip');
      btn.removeAttribute('aria-describedby');
      
      btn.addEventListener('mouseenter', (e) => {
        // Prevent any default behavior that might cause overflow
        e.preventDefault();
        
        // Force safe styles
        btn.style.transform = 'none';
        btn.style.boxShadow = 'none';
        btn.style.background = 'linear-gradient(135deg, #1a73e8 0%, #1557b0 100%)';
        btn.style.opacity = '0.9';
      });
      
      btn.addEventListener('mouseleave', (e) => {
        // Prevent any default behavior that might cause overflow
        e.preventDefault();
        
        // Reset to safe styles
        btn.style.transform = 'none';
        btn.style.boxShadow = 'none';
        btn.style.background = 'linear-gradient(135deg, #4285f4 0%, #1a73e8 100%)';
        btn.style.opacity = '1';
      });
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
      const isVisible = optionsMenu.style.display === 'block';
      optionsMenu.style.display = isVisible ? 'none' : 'block';
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!aiContainer.contains(e.target)) {
        optionsMenu.style.display = 'none';
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
    
    console.log('AI Email Assistant: Button with options added successfully');
  }
}

async function generateAIResponse(composeArea, tone = 'professional') {
  try {
    aiButton.disabled = true;
    aiButton.innerHTML = '🔄 Generating...';
    
    const emailChain = extractEmailChain();
    const attachments = extractAttachments();
    
    console.log('Sending email chain to AI:', emailChain.substring(0, 200) + '...');
    
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
      const originalText = aiButton.innerHTML;
      aiButton.innerHTML = '✅ Generated!';
      aiButton.style.background = 'linear-gradient(135deg, #34a853 0%, #137333 100%)';
      
      setTimeout(() => {
        aiButton.innerHTML = originalText;
        aiButton.style.background = 'linear-gradient(135deg, #4285f4 0%, #1a73e8 100%)';
      }, 2000);
    } else {
      alert('Error generating response: ' + response.error);
    }
  } catch (error) {
    handleExtensionError(error);
  } finally {
    aiButton.disabled = false;
    if (aiButton.innerHTML === '🔄 Generating...') {
      aiButton.innerHTML = '🤖 Generate AI Reply';
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
      console.log(`AI Email Assistant: Attempt ${attempt} failed:`, error.message);
      
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
  console.error('AI Email Assistant error:', error);
  
  if (error.message.includes('Extension context invalidated') ||
      error.message.includes('Extension needs to be reloaded') ||
      error.message.includes('refresh the page')) {
    
    // Show user-friendly error with instructions
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
      border-radius: 6px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      z-index: 10000;
      max-width: 350px;
      font-family: 'Google Sans', 'Segoe UI', Arial, sans-serif;
      font-size: 14px;
    `;
    
    errorDiv.innerHTML = `
      <strong>Extension Needs Refresh</strong><br>
      The AI Email Assistant was updated. Please refresh this page to continue using it.
      <br><br>
      <button onclick="window.location.reload()" style="
        background: #dc3545;
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
  console.log('AI Email Assistant: Starting email chain extraction');
  const emails = [];
  
  // Try multiple strategies to find conversation container
  const conversationContainer = document.querySelector('div[role="main"]') ||
                               document.querySelector('.nH.if') ||
                               document.querySelector('div[gh="tl"]') ||
                               document.body;
  
  if (!conversationContainer) {
    console.log('AI Email Assistant: No conversation container found');
    return 'No conversation container found';
  }
  
  // Enhanced selectors for Gmail email messages
  const emailSelectors = [
    'div[data-message-id]',
    '.ii.gt',
    'div[role="listitem"]',
    '.adn.ads',
    'div.h7'
  ];
  
  let emailElements = [];
  for (const selector of emailSelectors) {
    emailElements = conversationContainer.querySelectorAll(selector);
    if (emailElements.length > 0) {
      console.log(`AI Email Assistant: Found ${emailElements.length} emails using selector: ${selector}`);
      break;
    }
  }
  
  if (emailElements.length === 0) {
    // Fallback: try to extract from current view
    console.log('AI Email Assistant: No email elements found, trying fallback extraction');
    const fallbackContent = extractFallbackContent();
    return fallbackContent || 'No email content could be extracted from the current view';
  }
  
  emailElements.forEach((emailEl, index) => {
    try {
      // Extract sender information
      const senderSelectors = [
        'span[email]',
        '.go span',
        '.gD span',
        'span[data-hovercard-id]',
        '.cf.gJ span'
      ];
      
      let sender = 'Unknown Sender';
      for (const selector of senderSelectors) {
        const senderEl = emailEl.querySelector(selector);
        if (senderEl) {
          sender = senderEl.getAttribute('email') || senderEl.textContent || sender;
          break;
        }
      }
      
      // Extract timestamp
      const timestampSelectors = [
        'span[title*="20"]',
        '.g3 span',
        'span[data-tooltip*="20"]'
      ];
      
      let timestamp = '';
      for (const selector of timestampSelectors) {
        const timestampEl = emailEl.querySelector(selector);
        if (timestampEl) {
          timestamp = timestampEl.getAttribute('title') || timestampEl.textContent || '';
          break;
        }
      }
      
      // Extract subject (usually at thread level)
      const subject = document.querySelector('h2')?.textContent ||
                     document.querySelector('.hP')?.textContent ||
                     document.querySelector('span[data-thread-id]')?.textContent ||
                     'No Subject';
      
      // Extract email body with multiple strategies
      const bodySelectors = [
        'div[dir="ltr"]',
        '.ii.gt div',
        '.a3s.aiL',
        'div.gmail_quote',
        '.im'
      ];
      
      let body = '';
      for (const selector of bodySelectors) {
        const bodyEl = emailEl.querySelector(selector);
        if (bodyEl) {
          // Get both text content and preserve some HTML structure
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
        // Filter out common Gmail UI text
        const filteredText = allText
          .replace(/^(Reply|Forward|Delete|Archive|Mark as unread).*/, '')
          .replace(/Show trimmed content.*/, '')
          .replace(/^\d{1,2}:\d{2}\s*(AM|PM).*/, '')
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
        console.log(`AI Email Assistant: Extracted email ${index + 1} from ${sender}`);
      }
    } catch (error) {
      console.log(`AI Email Assistant: Error extracting email ${index + 1}:`, error);
    }
  });
  
  const result = emails.length > 0 ? emails.join('\n\n') : 'No readable email content found';
  console.log(`AI Email Assistant: Extracted ${emails.length} emails total`);
  console.log('Email chain preview:', result.substring(0, 200) + '...');
  
  return result;
}

function extractFallbackContent() {
  // Try to extract from visible content in the main area
  const mainContent = document.querySelector('div[role="main"]') ||
                     document.querySelector('.nH.if') ||
                     document.querySelector('body');
  
  if (!mainContent) return null;
  
  // Look for any visible email-like content
  const contentElements = mainContent.querySelectorAll('div, span, p');
  let visibleText = '';
  
  contentElements.forEach(el => {
    const text = el.innerText || el.textContent || '';
    if (text.trim().length > 20 && 
        !text.includes('Gmail') && 
        !text.includes('Compose') &&
        !text.includes('Inbox') &&
        el.offsetHeight > 0) {
      visibleText += text.trim() + '\n';
    }
  });
  
  return visibleText.length > 50 ? `Fallback Content:\n${visibleText}` : null;
}

function extractAttachments() {
  const attachments = [];
  const attachmentElements = document.querySelectorAll('span[data-tooltip*="attachment"]') ||
                           document.querySelectorAll('.aZo');
  
  attachmentElements.forEach(el => {
    const fileName = el.textContent || el.getAttribute('data-tooltip') || 'Unknown file';
    attachments.push(fileName);
  });
  
  return attachments.length > 0 ? attachments.join(', ') : null;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}