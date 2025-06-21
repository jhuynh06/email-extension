document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey');
  const analyzeAttachmentsCheckbox = document.getElementById('analyzeAttachments');
  const saveButton = document.getElementById('saveConfig');
  const testButton = document.getElementById('testApi');
  const statusDiv = document.getElementById('status');
  
  await loadConfig();
  
  saveButton.addEventListener('click', saveConfig);
  testButton.addEventListener('click', testApiConnection);
});

async function loadConfig() {
  try {
    const config = await chrome.storage.local.get(['apiKey', 'analyzeAttachments']);
    
    if (config.apiKey) {
      document.getElementById('apiKey').value = config.apiKey;
    }
    
    document.getElementById('analyzeAttachments').checked = config.analyzeAttachments || false;
  } catch (error) {
    showStatus('Error loading configuration', 'error');
  }
}

async function saveConfig() {
  const apiKey = document.getElementById('apiKey').value.trim();
  const analyzeAttachments = document.getElementById('analyzeAttachments').checked;
  
  if (!apiKey) {
    showStatus('Please enter a valid API key', 'error');
    return;
  }
  
  try {
    await chrome.storage.local.set({
      apiKey: apiKey,
      analyzeAttachments: analyzeAttachments
    });
    
    showStatus('Configuration saved successfully!', 'success');
  } catch (error) {
    showStatus('Error saving configuration: ' + error.message, 'error');
  }
}

async function testApiConnection() {
  const apiKey = document.getElementById('apiKey').value.trim();
  
  if (!apiKey) {
    showStatus('Please enter an API key first', 'error');
    return;
  }
  
  const testButton = document.getElementById('testApi');
  testButton.disabled = true;
  testButton.textContent = 'Testing...';
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Hello, this is a test message. Please respond with "API connection successful".'
          }]
        }]
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.candidates && data.candidates[0]) {
        showStatus('API connection successful!', 'success');
      } else {
        showStatus('API responded but with unexpected format', 'error');
      }
    } else {
      const errorText = await response.text();
      showStatus(`API connection failed: ${response.status} - ${errorText}`, 'error');
    }
  } catch (error) {
    showStatus('Connection error: ' + error.message, 'error');
  } finally {
    testButton.disabled = false;
    testButton.textContent = 'Test API Connection';
  }
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
  
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 5000);
}