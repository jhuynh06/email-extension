let aiButton = null;

function init() {
  if (window.location.href.includes('outlook.')) {
    observeOutlookChanges();
  }
}

function observeOutlookChanges() {
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
  // Multiple selectors to catch different Outlook compose modes
  const composeSelectors = [
    'div[contenteditable="true"][role="textbox"]',
    'div[data-app-section="ConversationContainer"] div[contenteditable="true"]',
    'div[aria-label*="Message body"]',
    'div[contenteditable="true"][aria-label*="body"]',
    'div[data-app-section="ComposeBodyContainer"] div[contenteditable="true"]',
    'div.compose-body-container div[contenteditable="true"]',
    'div[role="textbox"][contenteditable="true"]'
  ];
  
  let composeArea = null;
  for (const selector of composeSelectors) {
    composeArea = document.querySelector(selector);
    if (composeArea) {
      console.log(`AI Email Assistant: Found Outlook compose area with selector: ${selector}`);
      break;
    }
  }
  
  if (composeArea && !document.getElementById('ai-email-button-outlook')) {
    console.log('AI Email Assistant: Adding AI button to Outlook compose area');
    addAIButton(composeArea);
  }
  
  // Also check for reply scenarios
  const replyContainers = document.querySelectorAll('div[data-app-section="ComposeContainer"]');
  replyContainers.forEach(container => {
    const textbox = container.querySelector('div[contenteditable="true"]');
    if (textbox && !document.getElementById('ai-email-button-outlook')) {
      console.log('AI Email Assistant: Adding AI button to Outlook reply container');
      addAIButton(textbox);
    }
  });
}

function addAIButton(composeArea) {
  if (document.getElementById('ai-email-button-outlook')) {
    return; // Button already exists
  }

  // Try multiple placement strategies for Outlook
  let targetElement = null;
  
  // Strategy 1: Find toolbar near compose area
  const toolbar = composeArea.closest('div').querySelector('div[role="toolbar"]') ||
                 composeArea.parentElement.querySelector('button[aria-label*="Send"]')?.parentElement ||
                 composeArea.parentElement.querySelector('div[data-app-section="ToolbarHost"]') ||
                 composeArea.closest('div').querySelector('div[data-app-section="ToolbarHost"]');
  
  // Strategy 2: Find send button and place near it
  const sendButton = document.querySelector('button[aria-label*="Send"]') ||
                    document.querySelector('button[data-app-section="SendButton"]') ||
                    document.querySelector('button[title*="Send"]');
  
  // Strategy 3: Find compose window
  const composeWindow = composeArea.closest('div[data-app-section="ComposeContainer"]') ||
                       composeArea.closest('div[role="dialog"]') ||
                       composeArea.closest('.compose-container');
  
  if (toolbar) {
    targetElement = toolbar;
  } else if (sendButton && sendButton.parentElement) {
    targetElement = sendButton.parentElement;
  } else if (composeWindow) {
    // Create our own toolbar area
    const customToolbar = document.createElement('div');
    customToolbar.style.cssText = `
      padding: 12px;
      border-top: 1px solid #e1e1e1;
      background: #faf9f8;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      margin-top: 8px;
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
      padding: 12px;
      background: #f3f2f1;
      border-radius: 6px;
      border-left: 4px solid #0078d4;
    `;
    composeArea.parentElement.insertBefore(fallbackContainer, composeArea.nextSibling);
    targetElement = fallbackContainer;
  }
  
  if (targetElement) {
    aiButton = document.createElement('button');
    aiButton.id = 'ai-email-button-outlook';
    aiButton.innerHTML = '🤖 Generate AI Reply';
    aiButton.style.cssText = `
      background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%);
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      margin: 4px;
      font-family: 'Segoe UI', 'Segoe UI Web', Arial, sans-serif;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
      position: relative;
      z-index: 1000;
      min-width: 140px;
    `;
    
    // Add hover effects
    aiButton.addEventListener('mouseenter', () => {
      aiButton.style.background = 'linear-gradient(135deg, #005a9e 0%, #004578 100%)';
      aiButton.style.transform = 'translateY(-1px)';
      aiButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
    });
    
    aiButton.addEventListener('mouseleave', () => {
      aiButton.style.background = 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)';
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
    
    console.log('AI Email Assistant: Outlook button added successfully');
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
  
  const conversationContainer = document.querySelector('div[data-app-section="ConversationContainer"]') ||
                               document.querySelector('div[role="main"]') ||
                               document.querySelector('.wide-content-host');
  
  if (!conversationContainer) return '';
  
  const emailElements = conversationContainer.querySelectorAll('div[data-convid]') ||
                       conversationContainer.querySelectorAll('.ItemPart-container') ||
                       conversationContainer.querySelectorAll('div[role="listitem"]');
  
  emailElements.forEach((emailEl, index) => {
    const senderEl = emailEl.querySelector('span[title*="@"]') ||
                    emailEl.querySelector('button[aria-label*="@"]') ||
                    emailEl.querySelector('.sender-name');
    
    const sender = senderEl ? (senderEl.textContent || senderEl.getAttribute('title') || senderEl.getAttribute('aria-label')) : 'Unknown Sender';
    
    const subjectEl = document.querySelector('span[data-app-section="SubjectContainer"]') ||
                     document.querySelector('h1') ||
                     emailEl.querySelector('.subject');
    
    const subject = subjectEl ? subjectEl.textContent : 'No Subject';
    
    const bodyEl = emailEl.querySelector('div[data-app-section="BodyContainer"]') ||
                  emailEl.querySelector('.email-body') ||
                  emailEl.querySelector('div[role="document"]');
    
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