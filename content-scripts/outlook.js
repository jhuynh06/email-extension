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
  const composeArea = document.querySelector('div[contenteditable="true"][role="textbox"]') ||
                     document.querySelector('div[data-app-section="ConversationContainer"] div[contenteditable="true"]') ||
                     document.querySelector('div[aria-label*="Message body"]');
  
  if (composeArea && !aiButton) {
    addAIButton(composeArea);
  }
}

function addAIButton(composeArea) {
  const toolbar = composeArea.closest('div').querySelector('div[role="toolbar"]') ||
                 composeArea.parentElement.querySelector('button[aria-label*="Send"]')?.parentElement ||
                 composeArea.parentElement.querySelector('div[data-app-section="ToolbarHost"]');
  
  if (toolbar && !document.getElementById('ai-email-button-outlook')) {
    aiButton = document.createElement('button');
    aiButton.id = 'ai-email-button-outlook';
    aiButton.innerHTML = '🤖 AI Reply';
    aiButton.style.cssText = `
      background: #0078d4;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 2px;
      cursor: pointer;
      font-size: 14px;
      margin-left: 8px;
      font-family: 'Segoe UI', sans-serif;
    `;
    
    aiButton.addEventListener('click', () => generateAIResponse(composeArea));
    toolbar.appendChild(aiButton);
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