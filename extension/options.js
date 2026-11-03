const video = document.getElementById('video');
const webhook = document.getElementById('webhook');
const status = document.getElementById('status');

function isValidWebhook(value) {
  if (!value) return true;
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function showStatus(text, isError = false) {
  status.textContent = text;
  status.classList.toggle('error', isError);
}

async function save() {
  const webhookUrl = webhook.value.trim();
  if (!isValidWebhook(webhookUrl)) {
    showStatus('Enter a valid http(s) URL', true);
    return;
  }
  await chrome.storage.local.set({ videoRecording: video.checked, webhookUrl });
  showStatus('Saved');
}

chrome.storage.local.get(['videoRecording', 'webhookUrl']).then((settings) => {
  video.checked = !!settings.videoRecording;
  webhook.value = settings.webhookUrl || '';
});

video.addEventListener('change', save);
webhook.addEventListener('input', save);
