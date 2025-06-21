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
      margin: 4px;
      font-family: 'Google Sans', 'Segoe UI', Arial, sans-serif;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
      position: relative;
      z-index: 1000;
      min-width: 140px;
    `;
    
    // Add hover effects
    aiButton.addEventListener('mouseenter', () => {
      aiButton.style.background = 'linear-gradient(135deg, #1a73e8 0%, #1557b0 100%)';
      aiButton.style.transform = 'translateY(-1px)';
      aiButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
    });
    
    aiButton.addEventListener('mouseleave', () => {
      aiButton.style.background = 'linear-gradient(135deg, #4285f4 0%, #1a73e8 100%)';
      aiButton.style.transform = 'translateY(0)';
      aiButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    });
    
    aiButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      generateAIResponse(composeArea);
    });
    
    targetElement.appendChild(aiButton);
    
    // Add a subtle animation to draw attention
    aiButton.animate([
      { transform: 'scale(1)', opacity: '0.8' },
      { transform: 'scale(1.05)', opacity: '1' },
      { transform: 'scale(1)', opacity: '1' }
    ], {
      duration: 600,
      easing: 'ease-out'
    });
    
    console.log('AI Email Assistant: Button added successfully');
  }
}

async function generateAIResponse(composeArea) {
  try {
    aiButton.disabled = true;
    aiButton.innerHTML = '🔄 Generating...';
    
    const emailChain = extractEmailChain();
    const attachments = extractAttachments();
    
    const response = await chrome.runtime.sendMessage({
      action: 'generateResponse',
      data: {
        emailChain,
        attachments
      }
    });
    
    if (response.success) {
      composeArea.innerHTML = response.data;
      composeArea.focus();
    } else {
      alert('Error generating response: ' + response.error);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    aiButton.disabled = false;
    aiButton.innerHTML = '🤖 AI Reply';
  }
}

function extractEmailChain() {
  const emails = [];
  
  const conversationContainer = document.querySelector('div[role="main"]');
  if (!conversationContainer) return '';
  
  const emailElements = conversationContainer.querySelectorAll('div[data-message-id]') ||
                       conversationContainer.querySelectorAll('.ii.gt');
  
  emailElements.forEach((emailEl, index) => {
    const sender = emailEl.querySelector('span[email]')?.getAttribute('email') ||
                  emailEl.querySelector('.go span')?.textContent ||
                  'Unknown Sender';
    
    const subject = document.querySelector('h2')?.textContent || 'No Subject';
    
    const bodyEl = emailEl.querySelector('div[dir="ltr"]') ||
                  emailEl.querySelector('.ii.gt div') ||
                  emailEl;
    
    const body = bodyEl ? bodyEl.innerText.trim() : '';
    
    if (body && body.length > 10) {
      emails.push(`Email ${index + 1}:
From: ${sender}
Subject: ${subject}
Body: ${body}
---`);
    }
  });
  
  return emails.join('\n\n') || 'No email content found';
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