import { buildExportData } from './export.js';

const TUS_BASE = 'https://share.mk/files/';

export async function shareAnnotations(store, crossPageAnnotations, events) {
  try {
    events.emit('share:uploading');

    const data = buildExportData(store, crossPageAnnotations);
    const json = JSON.stringify(data, null, 2);
    const bytes = new TextEncoder().encode(json);

    // TUS creation request
    const createRes = await fetch(TUS_BASE, {
      method: 'POST',
      headers: {
        'Tus-Resumable': '1.0.0',
        'Upload-Length': String(bytes.byteLength),
        'Upload-Metadata': [
          `filename ${btoa('annotations.json')}`,
          `content-type ${btoa('application/json')}`,
          `expires-in ${btoa('7d')}`,
        ].join(','),
      },
    });

    if (!createRes.ok) throw new Error(`Upload failed: ${createRes.status}`);

    const location = createRes.headers.get('Location');
    if (!location) throw new Error('No Location header in response');

    // Resolve to absolute URL
    const fileUrl = location.startsWith('http')
      ? location
      : new URL(location, TUS_BASE).href;

    // TUS patch — send the bytes
    const patchRes = await fetch(fileUrl, {
      method: 'PATCH',
      headers: {
        'Tus-Resumable': '1.0.0',
        'Upload-Offset': '0',
        'Content-Type': 'application/offset+octet-stream',
      },
      body: bytes,
    });

    if (!patchRes.ok) throw new Error(`Patch failed: ${patchRes.status}`);

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(fileUrl);
    } catch { /* clipboard may be blocked */ }

    events.emit('share:complete', fileUrl);
    return fileUrl;
  } catch (err) {
    events.emit('share:error', err);
    return null;
  }
}
