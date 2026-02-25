chrome.action.onClicked.addListener(async (tab) => {
  // Check if Ano is active by looking for its DOM elements (top frame only)
  const [check] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: 'MAIN',
    func: () => !!document.querySelector('[data-ano]'),
  });

  if (check.result) {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      world: 'MAIN',
      func: () => { if (typeof window.Ano !== 'undefined') window.Ano.destroy(); },
    });

    chrome.action.setBadgeText({ tabId: tab.id, text: '' });
    return;
  }

  // Inject into ALL frames (cross-origin frames require host_permissions in manifest)
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      world: 'MAIN',
      files: ['ano.min.js'],
    });

    // Init in ALL frames — each frame auto-detects child vs parent
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      world: 'MAIN',
      func: () => Ano.init({ mode: 'navigate' }),
    });
  } catch (e) {
    console.warn('[Ano] Frame injection error:', e);
  }

  chrome.action.setBadgeText({ tabId: tab.id, text: 'ON' });
  chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#6366f1' });
});
