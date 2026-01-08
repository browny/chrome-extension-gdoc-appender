document.addEventListener('DOMContentLoaded', init);

const authBtn = document.getElementById('auth-btn');
const authStatus = document.getElementById('auth-status');
const docUrlInput = document.getElementById('doc-url');
const saveBtn = document.getElementById('save-btn');
const saveStatus = document.getElementById('save-status');
const docInfo = document.getElementById('doc-info');
const docIdDisplay = document.getElementById('doc-id-display');

// Get client_id from manifest
const manifest = chrome.runtime.getManifest();
const CLIENT_ID = manifest.oauth2.client_id;
const SCOPES = manifest.oauth2.scopes.join(' ');
const REDIRECT_URL = chrome.identity.getRedirectURL();

function init() {
  loadSavedSettings();
  checkAuthStatus();

  authBtn.addEventListener('click', handleAuth);
  saveBtn.addEventListener('click', saveDocUrl);
}

async function checkAuthStatus() {
  const { accessToken } = await chrome.storage.local.get(['accessToken']);
  if (accessToken) {
    // Verify token is still valid
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + accessToken);
      if (response.ok) {
        authStatus.textContent = 'Signed in';
        authStatus.classList.add('signed-in');
        authBtn.textContent = 'Sign out';
        return;
      }
    } catch (e) {
      // Token invalid, clear it
      await chrome.storage.local.remove(['accessToken']);
    }
  }
  authStatus.textContent = 'Not signed in';
  authStatus.classList.remove('signed-in');
  authBtn.textContent = 'Sign in with Google';
}

async function handleAuth() {
  const isSignedIn = authStatus.classList.contains('signed-in');

  if (isSignedIn) {
    // Sign out
    await chrome.storage.local.remove(['accessToken']);
    authStatus.textContent = 'Not signed in';
    authStatus.classList.remove('signed-in');
    authBtn.textContent = 'Sign in with Google';
  } else {
    // Sign in using launchWebAuthFlow
    try {
      authBtn.disabled = true;
      authBtn.textContent = 'Signing in...';

      const token = await launchGoogleAuth();
      if (token) {
        await chrome.storage.local.set({ accessToken: token });
        authStatus.textContent = 'Signed in';
        authStatus.classList.add('signed-in');
        authBtn.textContent = 'Sign out';
      }
    } catch (e) {
      console.error('Auth error:', e);
      authStatus.textContent = 'Sign in failed: ' + e.message;
      authStatus.className = 'status error';
      authBtn.textContent = 'Sign in with Google';
    } finally {
      authBtn.disabled = false;
    }
  }
}

function launchGoogleAuth() {
  return new Promise((resolve, reject) => {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URL);
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('scope', SCOPES);

    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl.toString(),
        interactive: true
      },
      (responseUrl) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!responseUrl) {
          reject(new Error('No response URL'));
          return;
        }

        // Extract access token from URL fragment
        const url = new URL(responseUrl);
        const params = new URLSearchParams(url.hash.substring(1));
        const accessToken = params.get('access_token');

        if (accessToken) {
          resolve(accessToken);
        } else {
          reject(new Error('No access token in response'));
        }
      }
    );
  });
}

function extractDocId(url) {
  const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

async function loadSavedSettings() {
  const result = await chrome.storage.sync.get(['docUrl', 'docId']);

  if (result.docUrl) {
    docUrlInput.value = result.docUrl;
  }

  if (result.docId) {
    docIdDisplay.textContent = result.docId;
    docInfo.classList.remove('hidden');
  }
}

async function saveDocUrl() {
  const url = docUrlInput.value.trim();

  if (!url) {
    saveStatus.textContent = 'Please enter a URL';
    saveStatus.className = 'status error';
    return;
  }

  const docId = extractDocId(url);

  if (!docId) {
    saveStatus.textContent = 'Invalid Google Docs URL';
    saveStatus.className = 'status error';
    return;
  }

  try {
    await chrome.storage.sync.set({ docUrl: url, docId: docId });

    saveStatus.textContent = 'Saved successfully!';
    saveStatus.className = 'status success';

    docIdDisplay.textContent = docId;
    docInfo.classList.remove('hidden');

    setTimeout(() => {
      saveStatus.textContent = '';
    }, 3000);
  } catch (e) {
    saveStatus.textContent = 'Failed to save: ' + e.message;
    saveStatus.className = 'status error';
  }
}
