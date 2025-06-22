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
      .then(response => {
        try {
          sendResponse({ success: true, data: response });
        } catch (error) {
          console.error('Error sending response:', error);
        }
      })
      .catch(error => {
        console.error('Error in handleGenerateResponse:', error);
        try {
          sendResponse({ success: false, error: error.message });
        } catch (sendError) {
          console.error('Error sending error response:', sendError);
        }
      });
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

  // Handle different tone styles
  const tone = emailData.tone || 'professional';
  let toneInstructions = '';
  
  switch (tone) {
    case 'formal':
      toneInstructions = '- Use formal, business-appropriate language\n- Include proper salutations and closings\n- Be respectful and diplomatic';
      break;
    case 'casual':
      toneInstructions = '- Use friendly, conversational language\n- Be approachable and warm\n- Keep it relaxed but professional';
      break;
    case 'brief':
      toneInstructions = '- Keep the response very short and to the point\n- Use bullet points if helpful\n- Include only essential information';
      break;
    case 'detailed':
      toneInstructions = '- Provide comprehensive information\n- Include relevant background context\n- Address all points thoroughly';
      break;
    case 'diplomatic':
      toneInstructions = '- Use tactful and careful language\n- Address sensitive topics thoughtfully\n- Maintain a respectful and understanding tone';
      break;
    default:
      toneInstructions = '- Match the tone and formality level of the original emails\n- Be professional yet personable';
  }

  const prompt = `Please generate an email response based on the following email chain. 

Email Chain:
${emailData.emailChain}${attachmentContext}

Response Style: ${tone.charAt(0).toUpperCase() + tone.slice(1)}

Instructions:
- Generate only the email response content without signatures, headers, or additional formatting
${toneInstructions}
- Be appropriate to the context and conversation flow
- If replying to a request, be specific about next steps
- If attachments are mentioned and attachment analysis is enabled, reference them appropriately

Generate the email response now:`;

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