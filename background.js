// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'append-to-gdoc',
    title: 'Append to Google Doc',
    contexts: ['selection']
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'append-to-gdoc') {
    const selectedText = info.selectionText;
    const pageUrl = tab.url;
    const pageTitle = tab.title || pageUrl;

    await appendToGoogleDoc(selectedText, pageUrl, pageTitle, tab.id);
  }
});

async function appendToGoogleDoc(text, sourceUrl, pageTitle, tabId) {
  try {
    // Get saved document ID
    const { docId } = await chrome.storage.sync.get(['docId']);

    if (!docId) {
      showToast(tabId, 'error', 'No Google Doc configured');
      return;
    }

    // Get auth token from storage
    const { accessToken } = await chrome.storage.local.get(['accessToken']);

    if (!accessToken) {
      showToast(tabId, 'error', 'Not signed in');
      return;
    }

    // Get document to find the end index
    const doc = await getDocument(docId, accessToken);
    const endIndex = doc.body.content[doc.body.content.length - 1].endIndex - 1;

    // Append text with hyperlink
    await appendTextWithLink(docId, accessToken, text, sourceUrl, pageTitle, endIndex);

    showToast(tabId, 'success', 'Appended to Google Doc!');

  } catch (error) {
    console.error('Error appending to doc:', error);

    // Check if token expired
    if (error.message.includes('401') || error.message.includes('Invalid Credentials')) {
      await chrome.storage.local.remove(['accessToken']);
      showToast(tabId, 'error', 'Session expired. Please sign in again.');
    } else {
      showToast(tabId, 'error', error.message || 'Failed to append');
    }
  }
}

async function getDocument(docId, token) {
  const response = await fetch(
    `https://docs.googleapis.com/v1/documents/${docId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `Failed to access document (${response.status})`);
  }

  return response.json();
}

async function appendTextWithLink(docId, token, selectedText, sourceUrl, pageTitle, index) {
  // Build the text parts
  const prefix = `\n${selectedText}\nSource: ${pageTitle}: `;
  const suffix = `\n---\n`;
  const fullText = prefix + sourceUrl + suffix;

  // Calculate the URL position after insertion
  const urlStartIndex = index + prefix.length;
  const urlEndIndex = urlStartIndex + sourceUrl.length;

  const response = await fetch(
    `https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          // First: insert the text
          {
            insertText: {
              location: {
                index: index
              },
              text: fullText
            }
          },
          // Second: apply hyperlink style to the URL
          {
            updateTextStyle: {
              range: {
                startIndex: urlStartIndex,
                endIndex: urlEndIndex
              },
              textStyle: {
                link: {
                  url: sourceUrl
                }
              },
              fields: 'link'
            }
          }
        ]
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `Failed to append text (${response.status})`);
  }

  return response.json();
}

function showToast(tabId, status, text) {
  chrome.tabs.sendMessage(tabId, {
    type: 'SHOW_TOAST',
    status: status,
    text: text
  }).catch(err => {
    // Fallback to notification if content script not available
    console.log('Toast fallback to notification:', err);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: status === 'success' ? 'Success' : 'Error',
      message: text
    });
  });
}
