# Append to Google Doc - Chrome Extension

A Chrome extension that allows you to quickly append selected text from any webpage to your Google Doc, with the source page title and URL.

## Features

- Right-click selected text to append to Google Doc
- Automatically includes page title and source URL as hyperlink
- Toast notifications for success/error feedback
- Simple popup UI for authentication and configuration

## Installation

### 1. Download the Extension

Download the latest release zip from [Releases](https://github.com/browny/chrome-extension-gdoc-appender/releases) and unzip it.

### 2. Set Up Google Cloud OAuth

Since this extension uses Google Docs API, you need to create your own OAuth credentials:

#### 2.1 Create a GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project selector at the top → **New Project**
3. Enter a project name (e.g., `gdoc-appender`) → **Create**

#### 2.2 Enable Google Docs API

1. Go to **APIs & Services** → **Library**
2. Search for `Google Docs API`
3. Click on it → **Enable**

#### 2.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** → **Create**
3. Fill in the required fields:
   - **App name:** `Append to Google Doc`
   - **User support email:** Your email
   - **Developer contact email:** Your email
4. Click **Save and Continue**
5. On the **Scopes** page:
   - Click **Add or Remove Scopes**
   - Search and select `https://www.googleapis.com/auth/documents`
   - Click **Update** → **Save and Continue**
6. On the **Test users** page:
   - Click **Add Users**
   - Add Gmail accounts that will use this extension (including yours)
   - **Save and Continue**

#### 2.4 Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Configure:
   - **Application type:** `Web application` (NOT Chrome extension)
   - **Name:** `Append to Google Doc Extension`
4. Under **Authorized redirect URIs**, add:
   ```
   https://<your-extension-id>.chromiumapp.org/
   ```
   (See section 2.5 for how to get your extension ID)
5. Click **Create** and copy the **Client ID**

#### 2.5 Get Your Extension ID and Redirect URI

1. Load the extension in Chrome first (see step 3 below)
2. Go to `chrome://extensions/`
3. Find your extension and copy the **ID** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)
4. Your redirect URI will be: `https://<extension-id>.chromiumapp.org/`

#### 2.6 Update manifest.json

Edit `manifest.json` and replace the `client_id` with your own:

```json
"oauth2": {
  "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
  "scopes": [
    "https://www.googleapis.com/auth/documents"
  ]
}
```

### 3. Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the unzipped extension folder

## Usage

1. Click the extension icon in Chrome toolbar
2. Sign in with your Google account
3. Paste your Google Doc URL and click **Save**
4. On any webpage, select text → right-click → **Append to Google Doc**
5. The selected text will be appended to your doc with the page title and source URL

## Output Format

When you append text, it will be added to your Google Doc in this format:

```
[Selected text]
Source: [Page Title]: [URL]
---
```

The URL is hyperlinked for easy navigation back to the source.

## Notes

- The OAuth consent screen in "Testing" status only allows test users you've added
- To make it publicly available, you need to submit for Google verification

## License

MIT
