chrome.action.onClicked.addListener(async (tab) => {
  // Check if Ano is active by looking for its DOM elements
  const [check] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: 'MAIN',
    func: () => !!document.querySelector('[data-ano]'),
  });

  if (check.result) {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      func: () => Ano.destroy(),
    });

    chrome.action.setBadgeText({ tabId: tab.id, text: '' });
    return;
  }

  // Inject bundled script if not already loaded
  if (!(await isScriptLoaded(tab.id))) {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      files: ['ano.min.js'],
    });
  }

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: 'MAIN',
    func: () => Ano.init({ mode: 'navigate' }),
  });

  chrome.action.setBadgeText({ tabId: tab.id, text: 'ON' });
  chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#6366f1' });
});

async function isScriptLoaded(tabId) {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    world: 'MAIN',
    func: () => typeof window.Ano !== 'undefined',
  });
  return result.result;
}
