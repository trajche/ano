const CDN_URL = 'https://ano.phpless.digitalno.de/dist/ano.min.js';

chrome.action.onClicked.addListener(async (tab) => {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: toggleAno,
    args: [CDN_URL],
  });

  const isOn = result.result;

  chrome.action.setBadgeText({
    tabId: tab.id,
    text: isOn ? 'ON' : '',
  });

  chrome.action.setBadgeBackgroundColor({
    tabId: tab.id,
    color: '#6366f1',
  });
});

function toggleAno(cdnUrl) {
  return new Promise((resolve) => {
    if (window.Ano) {
      Ano.destroy();
      resolve(false);
      return;
    }

    const script = document.createElement('script');
    script.src = cdnUrl;
    script.onload = () => {
      Ano.init({ mode: 'navigate' });
      resolve(true);
    };
    document.head.appendChild(script);
  });
}
