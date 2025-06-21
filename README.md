# AI Email Assistant Chrome Extension

A Chrome extension that uses Google's Gemini AI to generate professional email responses for Gmail and Outlook web clients.

## Features

- 🤖 AI-powered email response generation using Gemini AI
- 📧 Works with Gmail and Outlook web interfaces
- 📎 Optional attachment analysis and referencing
- 🔒 Secure API key storage
- ⚡ One-click response generation

## Installation and Testing

### Prerequisites

1. **Get a Gemini API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Save the key securely

### Installation Steps

1. **Load the Extension**:
   ```bash
   # Open Chrome and navigate to:
   chrome://extensions/
   
   # Enable "Developer mode" (toggle in top-right)
   # Click "Load unpacked"
   # Select this project folder (/home/json/extenstion)
   ```

2. **Configure the Extension**:
   - Click the extension icon in Chrome toolbar
   - Enter your Gemini API key
   - Optionally enable attachment analysis
   - Click "Save Configuration"
   - Test the API connection

### Testing the Extension

#### Gmail Testing

1. **Setup**:
   - Open [Gmail](https://mail.google.com)
   - Make sure you're logged in
   - Open an existing email thread or create a new conversation

2. **Test Scenario 1 - Reply to Email**:
   - Click "Reply" on any email
   - You should see a "🤖 AI Reply" button in the compose toolbar
   - Click the button to generate a response
   - The AI-generated text should appear in the compose area

3. **Test Scenario 2 - New Email**:
   - Click "Compose" to start a new email
   - Add recipient and subject
   - Click the "🤖 AI Reply" button
   - Should generate a professional email based on subject context

#### Outlook Testing

1. **Setup**:
   - Open [Outlook Web](https://outlook.live.com) or [Outlook 365](https://outlook.office.com)
   - Make sure you're logged in
   - Navigate to your inbox

2. **Test Scenario 1 - Reply to Email**:
   - Open an email thread
   - Click "Reply" or "Reply All"
   - Look for the "🤖 AI Reply" button in the compose area
   - Click to generate response

3. **Test Scenario 2 - New Email**:
   - Click "New message"
   - The AI button should appear in the compose toolbar
   - Test response generation

### Testing Attachment Analysis

1. **Enable Feature**:
   - Open extension popup
   - Check "Analyze email attachments"
   - Save configuration

2. **Test with Attachments**:
   - Find an email with attachments
   - Reply to the email
   - Click "🤖 AI Reply"
   - The generated response should reference the attachments appropriately

### Troubleshooting

#### Common Issues

1. **"API key not configured" Error**:
   - Open extension popup
   - Verify API key is entered correctly
   - Test API connection

2. **AI Button Not Appearing**:
   - Refresh the Gmail/Outlook page
   - Check browser console for errors (F12 → Console)
   - Verify extension is enabled in chrome://extensions/

3. **"Gemini API error" Messages**:
   - Check API key validity
   - Verify internet connection
   - Check if you've exceeded API quota

4. **Generated Response Not Inserting**:
   - Try clicking in the compose area first
   - Refresh the page and try again
   - Check browser console for JavaScript errors

#### Debug Mode

1. **Enable Console Logging**:
   ```javascript
   // Open browser console (F12) on Gmail/Outlook page
   // Check for extension-related messages
   ```

2. **Check Extension Background**:
   ```bash
   # Go to chrome://extensions/
   # Click "service worker" link under the extension
   # Check for error messages
   ```

### Supported Platforms

- ✅ Gmail (mail.google.com)
- ✅ Outlook Web (outlook.live.com)
- ✅ Outlook 365 (outlook.office.com, outlook.office365.com)

### Security Notes

- API keys are stored locally in Chrome's secure storage
- No email content is stored by the extension
- All communication with Gemini API uses HTTPS
- Extension only activates on supported email platforms

### Performance Tips

- The extension automatically detects compose windows
- Generated responses typically take 2-5 seconds
- Large email chains may take longer to process
- Enable attachment analysis only when needed for better performance

## File Structure

```
/
├── manifest.json              # Extension configuration
├── background.js             # Service worker and API integration
├── popup.html               # Extension popup interface
├── popup.js                 # Popup functionality
├── content-scripts/
│   ├── gmail.js            # Gmail integration
│   └── outlook.js          # Outlook integration
└── README.md               # This file
```

## API Usage

The extension uses Google's Gemini Pro model via the REST API. Each request includes:
- Email chain context
- Optional attachment information
- Professional tone instructions
- Response length limits (1024 tokens max)

## Development

To modify the extension:
1. Make changes to source files
2. Reload extension in chrome://extensions/
3. Test on Gmail/Outlook
4. Check console for errors

## Limitations

- Requires active internet connection
- Gemini API rate limits apply
- Works only with web versions of Gmail/Outlook
- Attachment content analysis is limited to file names/types
- Generated responses may need manual review before sending