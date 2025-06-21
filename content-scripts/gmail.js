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

  // Try multiple placement strategies
  let targetElement = null;
  
  // Strategy 1: Find toolbar near compose area
  const toolbar = composeArea.closest('div').querySelector('div[role="toolbar"]') ||
                 composeArea.parentElement.querySelector('div[data-tooltip*="Send"]')?.parentElement ||
                 composeArea.closest('div').querySelector('div[data-tooltip*="Send"]')?.parentElement;
  
  // Strategy 2: Find send button and place near it
  const sendButton = document.querySelector('div[data-tooltip*="Send"]') ||
                    document.querySelector('div[role="button"][aria-label*="Send"]') ||
                    document.querySelector('div[data-tooltip="Send ⌘+Enter"]');
  
  // Strategy 3: Find compose window bottom area
  const composeWindow = composeArea.closest('div[role="dialog"]') ||
                       composeArea.closest('div.T-I-J3');
  
  if (toolbar) {
    targetElement = toolbar;
  } else if (sendButton && sendButton.parentElement) {
    targetElement = sendButton.parentElement;
  } else if (composeWindow) {
    // Create our own toolbar area
    const customToolbar = document.createElement('div');
    customToolbar.style.cssText = `
      padding: 8px;
      border-top: 1px solid #e8eaed;
      background: #f8f9fa;
      display: flex;
      justify-content: flex-end;
      align-items: center;
    `;
    composeWindow.appendChild(customToolbar);
    targetElement = customToolbar;
  } else {
    // Fallback: Place relative to compose area
    const fallbackContainer = document.createElement('div');
    fallbackContainer.style.cssText = `
      position: relative;
      margin: 10px 0;
      text-align: center;
      padding: 10px;
      background: #f1f3f4;
      border-radius: 8px;
    `;
    composeArea.parentElement.insertBefore(fallbackContainer, composeArea.nextSibling);
    targetElement = fallbackContainer;
  }
  
  if (targetElement) {
    // Create container for AI buttons
    const aiContainer = document.createElement('div');
    aiContainer.id = 'ai-email-container';
    aiContainer.style.cssText = `
      display: flex;
      gap: 8px;
      align-items: center;
      margin: 4px;
      flex-wrap: wrap;
    `;
    
    // Main AI button
    aiButton = document.createElement('button');
    aiButton.id = 'ai-email-button';
    aiButton.innerHTML = '🤖 Generate AI Reply';
    aiButton.style.cssText = `
      background: linear-gradient(135deg, #4285f4 0%, #1a73e8 100%);
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      font-family: 'Google Sans', 'Segoe UI', Arial, sans-serif;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
      position: relative;
      z-index: 1000;
      min-width: 140px;
    `;
    
    // Dropdown button for more options
    const dropdownButton = document.createElement('button');
    dropdownButton.id = 'ai-options-button';
    dropdownButton.innerHTML = '▼';
    dropdownButton.style.cssText = `
      background: linear-gradient(135deg, #4285f4 0%, #1a73e8 100%);
      color: white;
      border: none;
      padding: 12px 8px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      font-family: 'Google Sans', 'Segoe UI', Arial, sans-serif;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
      position: relative;
      z-index: 1000;
    `;
    
    // Options menu
    const optionsMenu = document.createElement('div');
    optionsMenu.id = 'ai-options-menu';
    optionsMenu.style.cssText = `
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      z-index: 1001;
      min-width: 200px;
      margin-top: 4px;
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
        border-bottom: 1px solid #f0f0f0;
        font-size: 14px;
        font-family: 'Google Sans', 'Segoe UI', Arial, sans-serif;
        transition: background-color 0.2s ease;
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
    
    // Add hover effects
    [aiButton, dropdownButton].forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'linear-gradient(135deg, #1a73e8 0%, #1557b0 100%)';
        btn.style.transform = 'translateY(-1px)';
        btn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
      });
      
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'linear-gradient(135deg, #4285f4 0%, #1a73e8 100%)';
        btn.style.transform = 'translateY(0)';
        btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
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
    
    const response = await chrome.runtime.sendMessage({
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
    alert('Error: ' + error.message);
    console.error('AI Email Assistant error:', error);
  } finally {
    aiButton.disabled = false;
    if (aiButton.innerHTML === '🔄 Generating...') {
      aiButton.innerHTML = '🤖 Generate AI Reply';
    }
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