export function exportAnnotations(store, crossPageAnnotations = []) {
  const data = buildExportData(store, crossPageAnnotations);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `annotations-${formatDate()}.json`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 100);

  // Export recording .webm files as separate downloads
  const recordings = store.getByType('recording');
  for (const rec of recordings) {
    if (rec.blob) {
      downloadBlob(rec.blob, `recording-${rec.id}.webm`);
    }
  }

  // Export session video blobs
  const sessions = store.getByType('session');
  for (const ses of sessions) {
    if (ses.blob) {
      downloadBlob(ses.blob, `session-${ses.sessionId || ses.id}.webm`);
    }
  }

  return data;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 100);
}

export function buildExportData(store, crossPageAnnotations = []) {
  // Current page's annotations (from in-memory store — freshest)
  const currentAnnotations = store.getAll().map((a) => {
    const c = cleanAnnotation(a);
    c.pageUrl = c.pageUrl || window.location.href;
    c.pageTitle = c.pageTitle || document.title;
    return c;
  });

  // Other pages' annotations (from localStorage via api.js)
  const otherAnnotations = crossPageAnnotations.map((a) => {
    const c = cleanAnnotation(a);
    c.pageUrl = c.pageUrl || a.pageUrl || 'unknown';
    c.pageTitle = c.pageTitle || a.pageTitle || '';
    return c;
  });

  // Merge and deduplicate by id (current page wins)
  const seen = new Set(currentAnnotations.map((a) => a.id));
  const merged = [...currentAnnotations];
  for (const a of otherAnnotations) {
    if (!seen.has(a.id)) {
      seen.add(a.id);
      merged.push(a);
    }
  }

  // Sort by creation time
  merged.sort((a, b) => a.createdAt - b.createdAt);

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    pageUrl: window.location.href,
    pageTitle: document.title,
    annotations: merged,
    summary: buildSummary(merged),
  };
}

function cleanAnnotation(a) {
  const clean = {};

  // Common fields
  clean.id = a.id;
  clean.type = a.type;
  clean.comment = a.comment || '';
  clean.createdAt = a.createdAt;

  if (a.type === 'highlight') {
    clean.text = a.text;
    clean.context = a.context || null;
    // Keep selectors for re-import, but nest under _anchoring
    clean._anchoring = { selectors: a.selectors };
    if (a.color) clean.color = a.color;
  } else if (a.type === 'pin') {
    clean.index = a.index;
    clean.context = a.context || null;
    // Keep target info for re-import
    clean._anchoring = {
      targetSelector: a.targetSelector,
      targetMeta: a.targetMeta,
    };
  } else if (a.type === 'drawing') {
    clean.context = a.context || null;
    // Keep strokes for re-import and rendering
    clean._anchoring = {
      strokes: a.strokes,
      viewport: a.viewport,
    };
  } else if (a.type === 'recording') {
    clean.duration = a.duration;
    clean.region = a.region;
    clean.context = a.context || null;
    clean._anchoring = {
      viewport: a.viewport,
      file: `recording-${a.id}.webm`,
    };
  } else if (a.type === 'session') {
    clean.duration = a.duration;
    clean.pages = a.pages;
    clean.context = a.context || null;
    clean.sessionId = a.sessionId || null;
    clean.annotationIds = a.annotationIds || [];
    clean.hasRecording = a.hasRecording || false;
    clean._anchoring = {
      actions: a.actions,
    };
    if (a.blob) {
      clean._anchoring.file = `session-${a.sessionId || a.id}.webm`;
    }
  }

  if (a.pageUrl) clean.pageUrl = a.pageUrl;
  if (a.pageTitle) clean.pageTitle = a.pageTitle;
  if (a._orphaned) clean.orphaned = true;

  return clean;
}

function buildSummary(annotations) {
  // Group by page for multi-page clarity
  const byPage = new Map();
  for (const a of annotations) {
    const page = a.pageUrl || 'unknown';
    if (!byPage.has(page)) byPage.set(page, []);
    byPage.get(page).push(a);
  }

  const lines = [];

  for (const [page, anns] of byPage) {
    if (byPage.size > 1) {
      lines.push(`\n--- ${page} ---`);
    }

    for (const a of anns) {
      const comment = a.comment ? ` — "${a.comment}"` : '';

      if (a.type === 'highlight') {
        const where = a.context?.element
          ? ` in <${a.context.element.tagName?.toLowerCase() || 'element'}>`
          : '';
        const path = a.context?.pagePath ? ` (${a.context.pagePath.join(' > ')})` : '';
        lines.push(`[Highlight] "${truncate(a.text, 80)}"${where}${path}${comment}`);
      } else if (a.type === 'pin') {
        const desc = a.context?.description || `element #${a.index}`;
        lines.push(`[Pin #${a.index}] ${desc}${comment}`);
      } else if (a.type === 'drawing') {
        const desc = a.context?.description || 'freehand drawing';
        lines.push(`[Drawing] ${desc}${comment}`);
      } else if (a.type === 'recording') {
        const secs = Math.round((a.duration || 0) / 1000);
        const desc = a.context?.description || 'screen recording';
        lines.push(`[Recording ${secs}s] ${desc}${comment}`);
      } else if (a.type === 'session') {
        const secs = Math.round((a.duration || 0) / 1000);
        const desc = a.context?.description || 'session recording';
        lines.push(`[Session ${secs}s] ${desc}${comment}`);
      }
    }
  }

  return lines.join('\n').trim();
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '...' : str;
}

function formatDate() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function pad(n) {
  return n.toString().padStart(2, '0');
}
