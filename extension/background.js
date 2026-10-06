const BADGE_COLOR = '#6366f1';

function setBadge(tabId, on) {
  chrome.action.setBadgeText({ tabId, text: on ? 'ON' : '' });
  if (on) chrome.action.setBadgeBackgroundColor({ tabId, color: BADGE_COLOR });
}

chrome.action.onClicked.addListener(async (tab) => {
  // Check if Ano is active by looking for its DOM elements (top frame only).
  // Throws on restricted pages (browser settings, extension stores, PDF viewer).
  let active;
  try {
    const [check] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      func: () => !!document.querySelector('[data-ano]'),
    });
    active = !!check?.result;
  } catch (e) {
    console.warn('[Ano] Cannot run on this page:', e);
    return;
  }

  if (active) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        world: 'MAIN',
        func: () => { if (typeof window.Ano !== 'undefined') window.Ano.destroy(); },
      });
    } catch (e) {
      console.warn('[Ano] Frame teardown error:', e);
    }
    setBadge(tab.id, false);
    return;
  }

  // Inject into ALL frames (cross-origin frames require host_permissions in manifest)
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      world: 'MAIN',
      files: ['ano.min.js'],
    });

    // Init in ALL frames — each frame auto-detects child vs parent.
    // Guard: frames where injection was blocked have no Ano global.
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      world: 'MAIN',
      func: () => { if (typeof window.Ano !== 'undefined') window.Ano.init({ mode: 'navigate' }); },
    });
  } catch (e) {
    console.warn('[Ano] Frame injection error:', e);
  }

  setBadge(tab.id, true);
});

// Ano does not survive navigation/reload — clear the stale badge
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') setBadge(tabId, false);
});
