// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SHOW_TOAST') {
    showToast(message.status, message.text);
  }
});

function showToast(status, text) {
  // Remove existing toast if any
  const existingToast = document.getElementById('gdoc-appender-toast');
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast container
  const toast = document.createElement('div');
  toast.id = 'gdoc-appender-toast';

  const isSuccess = status === 'success';

  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    background: ${isSuccess ? '#1e7e34' : '#c82333'};
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 2147483647;
    display: flex;
    align-items: center;
    gap: 8px;
    opacity: 0;
    transform: translateX(100%);
    transition: opacity 0.3s ease, transform 0.3s ease;
  `;

  // Icon
  const icon = document.createElement('span');
  icon.textContent = isSuccess ? '✓' : '✕';
  icon.style.cssText = `
    font-size: 16px;
    font-weight: bold;
  `;

  // Text
  const textSpan = document.createElement('span');
  textSpan.textContent = text;

  toast.appendChild(icon);
  toast.appendChild(textSpan);
  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  });

  // Auto remove after 2.5 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2500);
}
