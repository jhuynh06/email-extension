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
  const composeArea = document.querySelector('div[role="textbox"][aria-label*="Message Body"]') || 
                     document.querySelector('div[contenteditable="true"][role="textbox"]');
  
  if (composeArea && !aiButton) {
    addAIButton(composeArea);
  }
}

function addAIButton(composeArea) {
  const toolbar = composeArea.closest('div').querySelector('div[role="toolbar"]') ||
                 composeArea.parentElement.querySelector('div[data-tooltip*="Send"]')?.parentElement;
  
  if (toolbar && !document.getElementById('ai-email-button')) {
    aiButton = document.createElement('button');
    aiButton.id = 'ai-email-button';
    aiButton.innerHTML = '🤖 AI Reply';
    aiButton.style.cssText = `
      background: #1a73e8;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin-left: 8px;
      font-family: 'Google Sans', sans-serif;
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