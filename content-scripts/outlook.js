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
    // Create container for AI buttons
    const aiContainer = document.createElement('div');
    aiContainer.id = 'ai-email-container-outlook';
    aiContainer.style.cssText = `
      display: flex;
      gap: 8px;
      align-items: center;
      margin: 4px;
      flex-wrap: wrap;
    `;
    
    // Main AI button
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
      font-family: 'Segoe UI', 'Segoe UI Web', Arial, sans-serif;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
      position: relative;
      z-index: 1000;
      min-width: 140px;
    `;
    
    // Dropdown button for more options
    const dropdownButton = document.createElement('button');
    dropdownButton.id = 'ai-options-button-outlook';
    dropdownButton.innerHTML = '▼';
    dropdownButton.style.cssText = `
      background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%);
      color: white;
      border: none;
      padding: 12px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      font-family: 'Segoe UI', 'Segoe UI Web', Arial, sans-serif;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
      position: relative;
      z-index: 1000;
    `;
    
    // Options menu
    const optionsMenu = document.createElement('div');
    optionsMenu.id = 'ai-options-menu-outlook';
    optionsMenu.style.cssText = `
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      background: white;
      border: 1px solid #d1d1d1;
      border-radius: 4px;
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
        font-family: 'Segoe UI', 'Segoe UI Web', Arial, sans-serif;
        transition: background-color 0.2s ease;
      `;
      optionItem.textContent = option.text;
      
      optionItem.addEventListener('mouseenter', () => {
        optionItem.style.backgroundColor = '#f3f2f1';
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
        btn.style.background = 'linear-gradient(135deg, #005a9e 0%, #004578 100%)';
        btn.style.transform = 'translateY(-1px)';
        btn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
      });
      
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)';
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
    
    console.log('AI Email Assistant: Outlook button with options added successfully');
  }
}

async function generateAIResponse(composeArea, tone = 'professional') {
  try {
    aiButton.disabled = true;
    aiButton.innerHTML = '🔄 Generating...';
    
    const emailChain = extractEmailChain();
    const attachments = extractAttachments();
    
    console.log('Sending Outlook email chain to AI:', emailChain.substring(0, 200) + '...');
    
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
      aiButton.style.background = 'linear-gradient(135deg, #107c10 0%, #0e4b0e 100%)';
      
      setTimeout(() => {
        aiButton.innerHTML = originalText;
        aiButton.style.background = 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)';
      }, 2000);
    } else {
      alert('Error generating response: ' + response.error);
    }
  } catch (error) {
    alert('Error: ' + error.message);
    console.error('AI Email Assistant Outlook error:', error);
  } finally {
    aiButton.disabled = false;
    if (aiButton.innerHTML === '🔄 Generating...') {
      aiButton.innerHTML = '🤖 Generate AI Reply';
    }
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