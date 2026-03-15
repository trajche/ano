import { truncate } from '../utils.js';

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

export function exportJSON(store, crossPageAnnotations = []) {
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

  return data;
}

export function exportVideo(store) {
  const recordings = store.getByType('recording');
  for (const rec of recordings) {
    if (rec.blob) {
      downloadBlob(rec.blob, `recording-${rec.id}.webm`);
    }
  }

  const sessions = store.getByType('session');
  for (const ses of sessions) {
    if (ses.blob) {
      downloadBlob(ses.blob, `session-${ses.sessionId || ses.id}.webm`);
    }
  }
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
    environment: collectEnvironment(),
    annotations: merged,
    summary: buildSummary(merged),
  };
}

function collectEnvironment() {
  const nav = navigator;
  const scr = screen;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

  const env = {
    userAgent: nav.userAgent,
    platform: nav.platform,
    language: nav.language,
    languages: nav.languages ? [...nav.languages] : [nav.language],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    screen: {
      width: scr.width,
      height: scr.height,
      devicePixelRatio: window.devicePixelRatio,
      colorDepth: scr.colorDepth,
      orientation: scr.orientation?.type || null,
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    deviceMemory: nav.deviceMemory || null,
    hardwareConcurrency: nav.hardwareConcurrency || null,
    touchSupport: nav.maxTouchPoints > 0,
    cookiesEnabled: nav.cookieEnabled,
    doNotTrack: nav.doNotTrack || null,
  };

  if (conn) {
    env.connection = {
      effectiveType: conn.effectiveType || null,
      downlink: conn.downlink || null,
      rtt: conn.rtt || null,
      saveData: conn.saveData || false,
    };
  }

  return env;
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

export function exportMarkdown(store, crossPageAnnotations = []) {
  const data = buildExportData(store, crossPageAnnotations);
  const md = buildMarkdown(data);
  downloadBlob(new Blob([md], { type: 'text/markdown' }), `annotations-${formatDate()}.md`);
  return md;
}

export function buildMarkdown(data) {
  const lines = [];
  const { pageTitle, pageUrl, exportedAt, annotations, environment } = data;

  lines.push(`# Bug Report — ${pageTitle || pageUrl}`);
  lines.push(`**URL:** ${pageUrl}`);
  lines.push(`**Exported:** ${new Date(exportedAt).toLocaleString()}`);
  lines.push('');

  // Annotation counts
  const visible = annotations.filter((a) => a.type !== 'session' && a.type !== 'recording');
  const byType = {};
  for (const a of visible) byType[a.type] = (byType[a.type] || 0) + 1;
  const countParts = [];
  if (byType.highlight) countParts.push(`${byType.highlight} highlight${byType.highlight !== 1 ? 's' : ''}`);
  if (byType.pin) countParts.push(`${byType.pin} pin${byType.pin !== 1 ? 's' : ''}`);
  if (byType.drawing) countParts.push(`${byType.drawing} drawing${byType.drawing !== 1 ? 's' : ''}`);
  if (countParts.length) {
    lines.push(`**Annotations:** ${countParts.join(', ')}`);
    lines.push('');
  }

  // Session summary
  const session = annotations.find((a) => a.type === 'session');
  if (session) {
    const secs = Math.round((session.duration || 0) / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    const actionCount = session._anchoring?.actions?.length || 0;
    const pageCount = session.pages?.length || 0;
    lines.push(`**Session:** ${m}:${s.toString().padStart(2, '0')} · ${actionCount} action${actionCount !== 1 ? 's' : ''} · ${pageCount} page${pageCount !== 1 ? 's' : ''}`);
    lines.push('');
  }

  // Annotations section
  if (visible.length > 0) {
    lines.push('## Annotations');
    lines.push('');
    for (const a of visible) {
      if (a.type === 'highlight') {
        lines.push(`### #${a.index} Highlight`);
        if (a.text) lines.push(`> "${a.text}"`);
        if (a.context?.element) {
          const tag = (a.context.element.tagName || 'element').toLowerCase();
          const path = a.context.pagePath?.length ? ` · ${a.context.pagePath.join(' > ')}` : '';
          lines.push(`**In:** \`<${tag}>\`${path}`);
        }
      } else if (a.type === 'pin') {
        lines.push(`### #${a.index} Pin`);
        if (a.context?.description) lines.push(`**Element:** \`${a.context.description}\``);
      } else if (a.type === 'drawing') {
        lines.push(`### #${a.index} Drawing`);
        if (a.context?.description) {
          lines.push(`**Over:** ${a.context.description.replace('Drawing over: ', '')}`);
        }
      }
      if (a.comment) lines.push(`**Comment:** ${a.comment}`);
      lines.push('');
    }
  }

  // Session log
  const actions = session?._anchoring?.actions;
  if (actions?.length > 0) {
    lines.push('## Session Log');
    lines.push('');
    for (let i = 0; i < actions.length; i++) {
      const a = actions[i];
      const t = (a.time / 1000).toFixed(1);
      let desc;
      switch (a.action) {
        case 'click':    desc = `Clicked ${a.target}`; break;
        case 'type':     desc = `Typed "${truncate(a.value || '', 40)}" in ${a.target}`; break;
        case 'select':   desc = `Selected "${a.value}" in ${a.target}`; break;
        case 'check':    desc = `${a.value === 'checked' ? 'Checked' : 'Unchecked'} ${a.target}`; break;
        case 'scroll':   desc = `Scrolled to ${a.value}`; break;
        case 'submit':   desc = `Submitted ${a.target}`; break;
        case 'navigate': desc = `Navigated to ${a.value}`; break;
        case 'error':    desc = `ERROR: ${truncate(a.value || '', 80)}`; break;
        default:
          desc = a.action.startsWith('console.')
            ? `${a.action}: ${truncate(a.value || '', 60)}`
            : `${a.action}${a.target ? ' ' + a.target : ''}`;
      }
      lines.push(`${i + 1}. [${t}s] ${desc}`);
    }
    lines.push('');
  }

  // Environment
  if (environment) {
    lines.push('## Environment');
    lines.push('');
    lines.push(`- **User Agent:** ${environment.userAgent}`);
    lines.push(`- **Viewport:** ${environment.viewport?.width}×${environment.viewport?.height}`);
    lines.push(`- **Screen:** ${environment.screen?.width}×${environment.screen?.height} @ ${environment.screen?.devicePixelRatio}x`);
    lines.push(`- **Timezone:** ${environment.timezone}`);
    if (environment.connection?.effectiveType) {
      lines.push(`- **Connection:** ${environment.connection.effectiveType}`);
    }
  }

  return lines.join('\n');
}

function formatDate() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function pad(n) {
  return n.toString().padStart(2, '0');
}
