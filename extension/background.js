chrome.action.onClicked.addListener(async (tab) => {
  // Check if Ano is already active on this tab
  const [check] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: 'MAIN',
    func: () => !!window.Ano,
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

  // Inject bundled script directly — bypasses page CSP and CORS
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: 'MAIN',
    files: ['ano.min.js'],
  });

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: 'MAIN',
    func: () => Ano.init({ mode: 'navigate' }),
  });

  chrome.action.setBadgeText({ tabId: tab.id, text: 'ON' });
  chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#6366f1' });
});
