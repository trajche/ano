const BADGE_COLOR = '#6366f1';
const KEEPALIVE_MS = 20000; // service workers idle out at 30s

function setBadge(tabId, on) {
  chrome.action.setBadgeText({ tabId, text: on ? 'ON' : '' });
  if (on) chrome.action.setBadgeBackgroundColor({ tabId, color: BADGE_COLOR });
}

// Runs in the page (MAIN world). Must stay self-contained.
function initAno(options, token) {
  if (typeof window.Ano === 'undefined') return;
  if (token && window === window.top) {
    options.onRecording = ({ blob, filename, report }) => new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      window.addEventListener('message', function onResult(e) {
        if (e.source !== window || e.data?.source !== 'ano-upload-result' || e.data.id !== id) return;
        window.removeEventListener('message', onResult);
        if (e.data.ok) resolve();
        else reject(new Error(e.data.error));
      });
      window.postMessage({ source: 'ano-upload', token, id, blob, filename, report: JSON.stringify(report) }, '*');
    });
  }
  window.Ano.init(options);
}

// Runs in the isolated world. Must stay self-contained.
// The isolated world's window is not visible to the page, so the token
// (one upload per session) stops page scripts from posting to the webhook
// unless they intercept Ano's own message.
function installRelay(token) {
  window.__anoUploadToken = token;
  if (window.__anoRelay) return;
  window.__anoRelay = true;

  const CHUNK_BYTES = 4 * 1024 * 1024;

  const toBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

  window.addEventListener('ano:closed', () => chrome.runtime.sendMessage('ano:closed'));

  window.addEventListener('message', async (e) => {
    if (e.source !== window || e.data?.source !== 'ano-upload') return;
    if (!window.__anoUploadToken || e.data.token !== window.__anoUploadToken) return;
    window.__anoUploadToken = null;
    const { id, blob, filename, report } = e.data;
    const reply = (ok, error) => window.postMessage({ source: 'ano-upload-result', id, ok, error }, '*');

    // Chrome's message passing is JSON-only, so the video travels as base64 chunks
    try {
      const port = chrome.runtime.connect({ name: 'ano-upload' });
      port.onMessage.addListener(({ ok, error }) => {
        reply(ok, error);
        port.disconnect();
      });
      port.postMessage({ type: 'start', filename, report, mimeType: blob.type });
      for (let offset = 0; offset < blob.size; offset += CHUNK_BYTES) {
        port.postMessage({ type: 'chunk', data: await toBase64(blob.slice(offset, offset + CHUNK_BYTES)) });
      }
      port.postMessage({ type: 'end' });
    } catch (err) {
      reply(false, String(err));
    }
  });
}

async function postToWebhook({ filename, report, mimeType }, parts) {
  const { webhookUrl } = await chrome.storage.local.get('webhookUrl');
  if (!webhookUrl) throw new Error('No webhook URL configured');

  const form = new FormData();
  form.append('video', new Blob(parts, { type: mimeType }), filename);
  form.append('report', report);

  const keepalive = setInterval(() => chrome.runtime.getPlatformInfo(), KEEPALIVE_MS);
  try {
    const res = await fetch(webhookUrl, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
  } finally {
    clearInterval(keepalive);
  }
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'ano-upload') return;
  let meta = null;
  const parts = [];

  port.onMessage.addListener(async (message) => {
    if (message.type === 'start') {
      meta = message;
    } else if (message.type === 'chunk') {
      parts.push(Uint8Array.from(atob(message.data), (c) => c.charCodeAt(0)));
    } else if (message.type === 'end') {
      try {
        await postToWebhook(meta, parts);
        port.postMessage({ ok: true });
      } catch (e) {
        port.postMessage({ ok: false, error: String(e) });
      }
    }
  });
});

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

  const { videoRecording = false, webhookUrl = '' } = await chrome.storage.local.get(['videoRecording', 'webhookUrl']);
  const uploadToken = webhookUrl ? crypto.randomUUID() : null;

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
      args: [{ mode: 'navigate', videoRecording, closeOnDismiss: true }, uploadToken],
      func: initAno,
    });

    // Page scripts can't reach the extension — relay from the isolated world
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [uploadToken],
      func: installRelay,
    });

    // Start the session right away (top frame only — it broadcasts to child frames)
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      func: () => { if (typeof window.Ano !== 'undefined') window.Ano.startSession(); },
    });
  } catch (e) {
    console.warn('[Ano] Frame injection error:', e);
  }

  setBadge(tab.id, true);
});

// Report closed — Ano turned itself off, next click starts a new session
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message === 'ano:closed' && sender.tab) setBadge(sender.tab.id, false);
});

// Ano does not survive navigation/reload — clear the stale badge
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') setBadge(tabId, false);
});
