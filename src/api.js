import { createConfig } from './core/config.js';
import { createStore } from './core/store.js';
import { createEventBus } from './core/events.js';
import { createHighlightManager } from './annotations/highlight.js';
import { createPinManager } from './annotations/pin.js';
import { createDrawingManager } from './annotations/drawing.js';
import { createRecordingManager, canRecord } from './annotations/recording.js';
import { createSessionManager } from './annotations/session.js';
import { createToolbar } from './ui/toolbar.js';
import { createPopoverManager } from './ui/popover.js';
import { createEndDialog } from './ui/end-dialog.js';
import { createShortcutManager } from './shortcuts.js';
import { injectHostStyles, removeHostStyles } from './ui/styles.js';
import { exportAnnotations, exportJSON, exportVideo, buildExportData } from './io/export.js';
import { importFromFile, importData } from './io/import.js';
import { shareAnnotations } from './io/share.js';

const STORAGE_PREFIX = 'ano:';

let instance = null;

export function init(options = {}) {
  if (instance) {
    console.warn('[Ano] Already initialized. Call Ano.destroy() first.');
    return instance.api;
  }

  const config = createConfig(options);
  const store = createStore();
  const events = createEventBus();

  const ctx = {
    config,
    store,
    events,
    mode: 'navigate',
    sessionState: 'idle', // 'idle' | 'active' | 'ending'
    currentSessionId: null,
    toolbar: null,
    popover: null,
    endDialog: null,
    highlightManager: null,
    pinManager: null,
    drawingManager: null,
    recordingManager: null,
    sessionManager: null,
    shortcutManager: null,
    setMode: null,
  };

  // Create managers
  ctx.highlightManager = createHighlightManager(ctx);
  ctx.pinManager = createPinManager(ctx);
  ctx.drawingManager = createDrawingManager(ctx);
  if (canRecord) {
    ctx.recordingManager = createRecordingManager(ctx);
  }
  ctx.sessionManager = createSessionManager(ctx);

  // Create UI
  ctx.toolbar = createToolbar(ctx);
  ctx.popover = createPopoverManager(ctx);
  ctx.endDialog = createEndDialog(ctx);
  ctx.shortcutManager = createShortcutManager(ctx);

  // Mode switching — guarded by session state
  ctx.setMode = (mode) => {
    if (ctx.sessionState !== 'active' && mode !== 'navigate') return;
    disableMode(ctx, ctx.mode);
    ctx.mode = mode;
    enableMode(ctx, mode);
    ctx.toolbar.setActive(mode);
  };

  // Wire events
  wireEvents(ctx);

  // Inject host-page styles (highlights, pins)
  injectHostStyles();

  // Initialize drawing canvas (lazy)
  ctx.drawingManager.init();

  // Render UI
  ctx.toolbar.render();
  ctx.popover.init();

  // Enable shortcuts
  if (config.shortcuts) {
    ctx.shortcutManager.enable();
  }

  // Restore saved annotations from localStorage (before initial mode)
  restoreStore(ctx);

  // Auto-persist store changes to localStorage (debounced)
  let persistTimer = null;
  const unsubPersist = store.on('change', () => {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => persistStore(store), 500);
  });

  // Tag annotations with sessionId when added during active session
  store.on('add', (annotation) => {
    if (ctx.sessionState === 'active' && ctx.currentSessionId
        && annotation.type !== 'session' && !annotation.sessionId) {
      store.update(annotation.id, { sessionId: ctx.currentSessionId });
    }
  });

  // Do NOT enable initial mode — toolbar starts idle, no tools active

  // Setup scroll/resize handlers for pins
  const repositionHandler = () => ctx.pinManager.repositionAll();
  window.addEventListener('scroll', repositionHandler, { passive: true });
  window.addEventListener('resize', repositionHandler, { passive: true });

  // MutationObserver for removed highlights
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.removedNodes) {
        if (node.classList?.contains('ano-highlight') && node.dataset?.anoId) {
          const id = node.dataset.anoId;
          if (store.get(id)) {
            store.update(id, { _orphaned: true });
          }
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  const api = {
    getAll: () => store.getAll(),
    toJSON: () => buildExportData(store, getCrossPageAnnotations()),
    export: () => exportAnnotations(store, getCrossPageAnnotations()),
    importFile: () => importFromFile(ctx),
    import: (data) => importData(ctx, data),
    setMode: (mode) => ctx.setMode(mode),
    share: () => events.emit('share'),
    clear: () => clearInstance(),
    destroy: () => destroyInstance(),
    startSession: () => events.emit('session:start'),
    endSession: () => events.emit('session:end'),
  };

  instance = {
    ctx,
    api,
    repositionHandler,
    observer,
    unsubPersist,
    persistTimer,
  };

  return api;
}

export function destroy() {
  destroyInstance();
}

function clearInstance() {
  if (!instance) return;
  const { ctx } = instance;
  const { store, highlightManager, pinManager, drawingManager, sessionManager } = ctx;

  for (const ann of store.getAll()) {
    if (ann.type === 'highlight') highlightManager.removeHighlight(ann.id);
    else if (ann.type === 'pin') pinManager.removePin(ann.id);
    else if (ann.type === 'drawing') drawingManager.removeDrawing(ann.id);
    else if (ann.type === 'session') sessionManager.removeSession(ann.id);
    else if (ann.type === 'recording' && ctx.recordingManager) ctx.recordingManager.removeRecording(ann.id);
  }

  store.clear();
  drawingManager.redrawAll();
  clearStoredAnnotations();
}

function destroyInstance() {
  if (!instance) return;
  const { ctx, repositionHandler, observer, unsubPersist, persistTimer } = instance;

  if (unsubPersist) unsubPersist();
  if (persistTimer) clearTimeout(persistTimer);

  observer.disconnect();
  window.removeEventListener('scroll', repositionHandler);
  window.removeEventListener('resize', repositionHandler);

  ctx.shortcutManager.destroy();
  ctx.popover.destroy();
  ctx.endDialog.destroy();
  ctx.toolbar.destroy();
  ctx.highlightManager.destroy();
  ctx.pinManager.destroy();
  ctx.drawingManager.destroy();
  if (ctx.recordingManager) ctx.recordingManager.destroy();
  ctx.sessionManager.destroy();
  if (ctx._cleanupHighlightClick) ctx._cleanupHighlightClick();
  persistStore(ctx.store);
  ctx.store.clear();
  ctx.store.destroy();
  ctx.events.clear();
  removeHostStyles();

  instance = null;
}

function enableMode(ctx, mode) {
  switch (mode) {
    case 'highlight':
      ctx.highlightManager.enable();
      break;
    case 'pin':
      ctx.pinManager.enable();
      break;
    case 'draw':
      ctx.drawingManager.enable();
      break;
    case 'navigate':
      break;
  }
}

function disableMode(ctx, mode) {
  switch (mode) {
    case 'highlight':
      ctx.highlightManager.disable();
      break;
    case 'pin':
      ctx.pinManager.disable();
      break;
    case 'draw':
      ctx.drawingManager.disable();
      break;
  }
}

// ── Helper: wait for recording blob ──

function waitForRecordingBlob(recordingManager, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      const blob = recordingManager.getBlob();
      if (blob) {
        resolve(blob);
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        resolve(null);
        return;
      }
      setTimeout(check, 100);
    };
    check();
  });
}

// ── localStorage persistence ──

function storageKey() {
  return STORAGE_PREFIX + location.pathname;
}

function persistStore(store) {
  try {
    const annotations = store.getAll().map(cleanForStorage);
    localStorage.setItem(storageKey(), JSON.stringify(annotations));
  } catch { /* storage full — ok */ }
}

function cleanForStorage(a) {
  const c = { ...a };
  delete c.blob;
  delete c.blobUrl;
  delete c._marks;
  if (!c.pageUrl) c.pageUrl = window.location.href;
  if (!c.pageTitle) c.pageTitle = document.title;
  return c;
}

function getCrossPageAnnotations() {
  const currentKey = storageKey();
  const results = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key.startsWith(STORAGE_PREFIX) || key === currentKey) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const saved = JSON.parse(raw);
      if (Array.isArray(saved)) {
        results.push(...saved);
      }
    }
  } catch { /* corrupt — skip */ }
  return results;
}

function restoreStore(ctx) {
  try {
    const raw = localStorage.getItem(storageKey());
    if (raw) {
      const saved = JSON.parse(raw);
      if (Array.isArray(saved) && saved.length > 0) {
        importData(ctx, { annotations: saved });
      }
    }
  } catch { /* corrupt — ignore */ }

  const cross = getCrossPageAnnotations();
  const global = cross.filter((a) => a.type === 'session' || a.type === 'recording');
  if (global.length > 0) {
    const seen = new Set(ctx.store.getAll().map((a) => a.id));
    const fresh = global.filter((a) => !seen.has(a.id));
    if (fresh.length > 0) {
      importData(ctx, { annotations: fresh });
    }
  }
}

function clearStoredAnnotations() {
  try { localStorage.removeItem(storageKey()); } catch { /* ok */ }
}

function wireEvents(ctx) {
  const { store, events, popover, highlightManager, pinManager, drawingManager } = ctx;

  // ── Session lifecycle ──

  events.on('session:start', () => {
    if (ctx.sessionState !== 'idle') return;

    const sessionId = ctx.sessionManager.start();
    ctx.sessionState = 'active';
    ctx.currentSessionId = sessionId;

    // Start video recording if toggled on
    if (ctx.toolbar.getVideoToggleState() && ctx.recordingManager) {
      ctx.recordingManager.startRecording();
    }

    ctx.toolbar.renderActive(ctx.sessionManager.getStartTime());
    ctx.setMode('navigate');
  });

  events.on('session:end', async () => {
    if (ctx.sessionState !== 'active') return;

    const wasRecording = ctx.recordingManager?.isRecording();

    // Stop session — returns data object
    const sessionData = ctx.sessionManager.stop();
    if (!sessionData) return;

    // Stop video recording if active
    if (wasRecording) {
      ctx.recordingManager.stopRecording();
    }

    // Disable current annotation mode
    disableMode(ctx, ctx.mode);
    ctx.mode = 'navigate';
    ctx.sessionState = 'ending';
    ctx.toolbar.renderIdle();

    // Wait for recording blob if was recording
    let blob = null;
    let blobUrl = null;
    if (wasRecording) {
      blob = await waitForRecordingBlob(ctx.recordingManager);
      if (blob) {
        blobUrl = ctx.recordingManager.getBlobUrl();
      }
    }

    // Collect annotations for this session
    const allAnnotations = store.getAll();
    const sessionAnnotations = allAnnotations
      .filter((a) => a.sessionId === sessionData.sessionId && a.type !== 'session');
    const annotationIds = sessionAnnotations.map((a) => a.id);

    // Build session annotation
    const sessionAnnotation = {
      type: 'session',
      sessionId: sessionData.sessionId,
      comment: '',
      duration: sessionData.duration,
      actions: sessionData.actions,
      pages: sessionData.pages,
      context: { description: sessionData.description },
      annotationIds,
      hasRecording: !!blob,
    };

    if (blob) {
      sessionAnnotation.blob = blob;
      sessionAnnotation.blobUrl = blobUrl;
    }

    store.add(sessionAnnotation);

    // Show end dialog with annotation list
    ctx.endDialog.show({
      duration: sessionData.duration,
      actionCount: sessionData.actions.length,
      pageCount: sessionData.pages.length,
      annotationCount: annotationIds.length,
      hasRecording: !!blob,
      annotations: sessionAnnotations,
    });
  });

  events.on('session:dismissed', () => {
    ctx.sessionState = 'idle';
    ctx.currentSessionId = null;
    if (ctx.recordingManager) {
      ctx.recordingManager.clearBlob();
    }
    clearInstance();
  });

  events.on('session:action', (count) => {
    ctx.toolbar.updateCount(count);
  });

  events.on('session:resumed', (data) => {
    ctx.sessionState = 'active';
    ctx.currentSessionId = data.sessionId;
    ctx.toolbar.renderActive(data.startTime);
  });

  // Late-arriving recording blob — attach to most recent session
  events.on('recording:stopped', (data) => {
    if (ctx.sessionState === 'ending' || ctx.sessionState === 'idle') {
      // Find most recent session annotation without a blob
      const sessions = store.getByType('session');
      for (let i = sessions.length - 1; i >= 0; i--) {
        const s = sessions[i];
        if (!s.blob && s.hasRecording === false && data.blob) {
          store.update(s.id, {
            blob: data.blob,
            blobUrl: data.blobUrl,
            hasRecording: true,
          });
          break;
        }
      }
    }
  });

  // Max duration auto-stop
  events.on('session:maxDuration', () => {
    events.emit('session:end');
  });

  // ── Annotation events ──

  events.on('highlight:created', (annotation) => {
    const marks = highlightManager.getMarksForAnnotation(annotation.id);
    if (marks.length > 0) {
      const rect = marks[0].getBoundingClientRect();
      popover.show(annotation.id, rect);
    }
  });

  events.on('pin:created', (annotation) => {
    ctx.setMode('navigate');
    const el = document.querySelector(`[data-ano-id="${annotation.id}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      popover.show(annotation.id, rect);
    }
  });

  events.on('drawing:created', (annotation, rawPoints) => {
    ctx.setMode('navigate');
    if (rawPoints && rawPoints.length > 0) {
      const last = rawPoints[rawPoints.length - 1];
      const rect = {
        x: last.x, y: last.y,
        top: last.y, left: last.x,
        bottom: last.y + 1, right: last.x + 1,
        width: 1, height: 1,
      };
      popover.show(annotation.id, rect);
    }
  });

  events.on('pin:click', (annotation) => {
    const el = document.querySelector(`[data-ano-id="${annotation.id}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      popover.show(annotation.id, rect);
    }
  });

  events.on('annotation:focus', (annotation) => {
    if (annotation.type === 'highlight') {
      const marks = highlightManager.getMarksForAnnotation(annotation.id);
      if (marks.length > 0) {
        marks[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        const rect = marks[0].getBoundingClientRect();
        setTimeout(() => popover.show(annotation.id, rect), 300);
      }
    } else if (annotation.type === 'pin') {
      pinManager.scrollToPin(annotation.id);
      setTimeout(() => {
        const el = document.querySelector(`[data-ano-id="${annotation.id}"]`);
        if (el) {
          const rect = el.getBoundingClientRect();
          popover.show(annotation.id, rect);
        }
      }, 300);
    }
  });

  events.on('annotation:delete', (id) => {
    const annotation = store.get(id);
    if (!annotation) return;

    if (annotation.type === 'highlight') {
      highlightManager.removeHighlight(id);
    } else if (annotation.type === 'pin') {
      pinManager.removePin(id);
    } else if (annotation.type === 'drawing') {
      drawingManager.removeDrawing(id);
    } else if (annotation.type === 'recording' && ctx.recordingManager) {
      ctx.recordingManager.removeRecording(id);
    } else if (annotation.type === 'session') {
      ctx.sessionManager.removeSession(id);
    }

    store.remove(id);
  });

  // Export
  events.on('export', () => {
    exportAnnotations(store, getCrossPageAnnotations());
  });

  events.on('export:json', () => {
    exportJSON(store, getCrossPageAnnotations());
  });

  events.on('export:video', () => {
    exportVideo(store);
  });

  // Import
  events.on('import', () => {
    importFromFile(ctx);
  });

  // Share
  events.on('share', () => {
    shareAnnotations(store, getCrossPageAnnotations(), events);
  });

  // Click on highlight marks → show popover
  function onHighlightClick(e) {
    const mark = e.target.closest?.('.ano-highlight');
    if (mark && mark.dataset.anoId) {
      e.stopPropagation();
      const rect = mark.getBoundingClientRect();
      popover.show(mark.dataset.anoId, rect);
      return;
    }

    // Click on drawing strokes → show popover
    if (ctx.mode === 'navigate') {
      const drawing = drawingManager.hitTest(e.clientX, e.clientY);
      if (drawing) {
        e.stopPropagation();
        const rect = {
          x: e.clientX, y: e.clientY,
          top: e.clientY, left: e.clientX,
          bottom: e.clientY + 1, right: e.clientX + 1,
          width: 1, height: 1,
        };
        popover.show(drawing.id, rect);
      }
    }
  }
  document.addEventListener('click', onHighlightClick, true);
  ctx._cleanupHighlightClick = () => {
    document.removeEventListener('click', onHighlightClick, true);
  };
}
