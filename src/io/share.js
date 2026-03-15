import { buildExportData, buildMarkdown } from './export.js';

const TUS_BASE = 'https://share.mk/files/';

async function tusUpload(bytes, metadata) {
  const createRes = await fetch(TUS_BASE, {
    method: 'POST',
    headers: {
      'Tus-Resumable': '1.0.0',
      'Upload-Length': String(bytes.byteLength),
      'Upload-Metadata': metadata
        .map(([k, v]) => `${k} ${btoa(v)}`)
        .join(','),
    },
  });

  if (!createRes.ok) throw new Error(`Upload failed: ${createRes.status}`);

  const location = createRes.headers.get('Location');
  if (!location) throw new Error('No Location header in response');

  const fileUrl = location.startsWith('http')
    ? location
    : new URL(location, TUS_BASE).href;

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

  return fileUrl;
}

export async function shareJSON(store, crossPageAnnotations, events) {
  try {
    events.emit('share:uploading');
    const data = buildExportData(store, crossPageAnnotations);
    const bytes = new TextEncoder().encode(JSON.stringify(data, null, 2));
    const url = await tusUpload(bytes, [
      ['filename', 'annotations.json'],
      ['content-type', 'application/json'],
      ['expires-in', '7d'],
    ]);
    try { await navigator.clipboard.writeText(url); } catch { /* clipboard may be blocked */ }
    events.emit('share:complete', url);
    return url;
  } catch (err) {
    events.emit('share:error', err);
    return null;
  }
}

export async function shareVideo(store, events) {
  try {
    events.emit('share:uploading');
    let blob = null;
    let filename = null;
    for (const ann of store.getAll()) {
      if ((ann.type === 'recording' || ann.type === 'session') && ann.blob) {
        blob = ann.blob;
        filename = ann.type === 'recording'
          ? `recording-${ann.id}.webm`
          : `session-${ann.sessionId || ann.id}.webm`;
        break;
      }
    }
    if (!blob) throw new Error('No video recording found');
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const url = await tusUpload(bytes, [
      ['filename', filename],
      ['content-type', 'video/webm'],
      ['expires-in', '7d'],
    ]);
    try { await navigator.clipboard.writeText(url); } catch { /* clipboard may be blocked */ }
    events.emit('share:complete', url);
    return url;
  } catch (err) {
    events.emit('share:error', err);
    return null;
  }
}

export async function shareMarkdown(store, crossPageAnnotations, events) {
  try {
    events.emit('share:uploading');
    const data = buildExportData(store, crossPageAnnotations);
    const bytes = new TextEncoder().encode(buildMarkdown(data));
    const url = await tusUpload(bytes, [
      ['filename', 'annotations.md'],
      ['content-type', 'text/markdown'],
      ['expires-in', '7d'],
    ]);
    try { await navigator.clipboard.writeText(url); } catch { /* clipboard may be blocked */ }
    events.emit('share:complete', url);
    return url;
  } catch (err) {
    events.emit('share:error', err);
    return null;
  }
}

export async function shareAnnotations(store, crossPageAnnotations, events) {
  try {
    events.emit('share:uploading');

    const data = buildExportData(store, crossPageAnnotations);

    // Collect video blobs from store
    const blobs = [];
    for (const ann of store.getAll()) {
      if ((ann.type === 'recording' || ann.type === 'session') && ann.blob) {
        const filename = ann.type === 'recording'
          ? `recording-${ann.id}.webm`
          : `session-${ann.sessionId || ann.id}.webm`;
        blobs.push({ id: ann.id, type: ann.type, sessionId: ann.sessionId, blob: ann.blob, filename });
      }
    }

    // Upload each video blob and build a map of id/sessionId → URL
    const videoUrls = new Map();
    for (const entry of blobs) {
      const bytes = new Uint8Array(await entry.blob.arrayBuffer());
      const url = await tusUpload(bytes, [
        ['filename', entry.filename],
        ['content-type', 'video/webm'],
        ['expires-in', '7d'],
      ]);
      videoUrls.set(entry.filename, url);
    }

    // Patch _anchoring.file fields with share URLs
    if (videoUrls.size > 0) {
      for (const ann of data.annotations) {
        if (ann._anchoring?.file && videoUrls.has(ann._anchoring.file)) {
          ann._anchoring.file = videoUrls.get(ann._anchoring.file);
        }
      }
    }

    // Upload the final JSON
    const json = JSON.stringify(data, null, 2);
    const jsonBytes = new TextEncoder().encode(json);
    const fileUrl = await tusUpload(jsonBytes, [
      ['filename', 'annotations.json'],
      ['content-type', 'application/json'],
      ['expires-in', '7d'],
    ]);

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
