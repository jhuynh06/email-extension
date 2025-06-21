chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Email Assistant installed');
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes('mail.google.com') || 
      tab.url.includes('outlook.live.com') || 
      tab.url.includes('outlook.office.com') ||
      tab.url.includes('outlook.office365.com')) {
    chrome.action.openPopup();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateResponse') {
    handleGenerateResponse(request.data)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function handleGenerateResponse(emailData) {
  const { apiKey, selectedModel, analyzeAttachments } = await chrome.storage.local.get(['apiKey', 'selectedModel', 'analyzeAttachments']);
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  let attachmentContext = '';
  if (analyzeAttachments && emailData.attachments) {
    attachmentContext = `\n\nAttachments mentioned: ${emailData.attachments}
Please consider these attachments when crafting your response. If the attachments seem relevant to the conversation, acknowledge them appropriately in your reply.`;
  }

  const prompt = `Please generate a professional email response based on the following email chain. Be concise, professional, and appropriate to the context:

Email Chain:
${emailData.emailChain}${attachmentContext}

Instructions:
- Generate only the email response content without signatures, headers, or additional formatting
- Match the tone and formality level of the original emails
- Be concise but comprehensive
- If replying to a request, be specific about next steps
- If attachments are mentioned and attachment analysis is enabled, reference them appropriately`;

  const modelToUse = selectedModel || 'gemini-1.5-flash';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 1024
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Invalid response from Gemini API');
  }
  
  return data.candidates[0].content.parts[0].text;
}