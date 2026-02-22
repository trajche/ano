import { generateCSSSelector } from '../anchoring/selector.js';

const STORAGE_KEY = 'ano-session';
const SENSITIVE_PATTERNS = /password|cc-|cvv|ssn|secret|token/i;

let idCounter = 0;
function nanoid() {
  return 'ses_' + Date.now().toString(36) + (idCounter++).toString(36) + Math.random().toString(36).slice(2, 6);
}

export function createSessionManager(ctx) {
  let active = false;
  let sessionId = null;
  let startTime = 0;
  let actions = [];
  let pages = [];
  let persistTimer = null;
  let inputTimers = new WeakMap();
  let lastScrollY = 0;
  let scrollTimer = null;

  // Console interception
  const originalConsole = {};
  const CONSOLE_METHODS = ['log', 'warn', 'error', 'info'];

  // ── Element description ──

  function describeElement(el) {
    if (!el) return 'unknown';
    const tag = el.tagName.toLowerCase();

    if (tag === 'button' || (tag === 'input' && el.type === 'submit')) {
      const text = el.textContent?.trim() || el.value || '';
      return text ? `button("${truncate(text, 40)}")` : 'button';
    }
    if (tag === 'a') {
      const text = el.textContent?.trim() || '';
      return text ? `link("${truncate(text, 40)}")` : `link(${el.href || ''})`;
    }
    if (tag === 'input') {
      const name = el.name || el.id || el.type;
      return `input[name="${name}"]`;
    }
    if (tag === 'textarea') {
      const name = el.name || el.id || 'textarea';
      return `textarea[name="${name}"]`;
    }
    if (tag === 'select') {
      const name = el.name || el.id || 'select';
      return `select${name !== 'select' ? `[name="${name}"]` : ''}`;
    }
    if (tag === 'label') {
      const text = el.textContent?.trim() || '';
      return text ? `label("${truncate(text, 40)}")` : 'label';
    }
    if (tag === 'img') {
      return `img(${el.alt || el.src?.split('/').pop() || ''})`;
    }

    // Generic element with text
    const text = el.textContent?.trim();
    if (text && text.length < 60 && el.children.length === 0) {
      return `${tag}("${truncate(text, 40)}")`;
    }

    // With id or class
    if (el.id) return `${tag}#${el.id}`;
    if (el.className && typeof el.className === 'string') {
      const cls = el.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.');
      if (cls) return `${tag}.${cls}`;
    }
    return tag;
  }

  function isSensitive(el) {
    if (el.type === 'password') return true;
    const ac = el.autocomplete || '';
    return SENSITIVE_PATTERNS.test(ac);
  }

  function isAnoElement(el) {
    if (!el) return false;
    if (el.closest?.('[data-ano]')) return true;
    let node = el;
    while (node) {
      if (node.host && node.host.dataset && node.host.dataset.ano !== undefined) return true;
      node = node.parentNode;
    }
    return false;
  }

  // ── Record action ──

  function recordAction(action, target, selector, value, url) {
    const entry = {
      time: Date.now() - startTime,
      action,
      target: target || null,
      selector: selector || null,
      value: value ?? null,
      url: url || window.location.href,
    };
    actions.push(entry);
    debouncedPersist();
    ctx.events.emit('session:action', actions.length);
  }

  // ── Event handlers (named for cleanup) ──

  function onSessionClick(e) {
    if (isAnoElement(e.target)) return;
    const el = e.target;
    let selector = null;
    try { selector = generateCSSSelector(el); } catch { /* skip */ }
    recordAction('click', describeElement(el), selector, null);
  }

  function onSessionInput(e) {
    if (isAnoElement(e.target)) return;
    const el = e.target;

    const prev = inputTimers.get(el);
    if (prev) clearTimeout(prev);

    const timer = setTimeout(() => {
      inputTimers.delete(el);
      const value = isSensitive(el) ? '[redacted]' : el.value;
      let selector = null;
      try { selector = generateCSSSelector(el); } catch { /* skip */ }
      recordAction('type', describeElement(el), selector, value);
    }, 500);
    inputTimers.set(el, timer);
  }

  function onSessionChange(e) {
    if (isAnoElement(e.target)) return;
    const el = e.target;
    const tag = el.tagName.toLowerCase();
    const type = el.type?.toLowerCase();

    if (tag === 'select') {
      const value = el.options?.[el.selectedIndex]?.text || el.value;
      let selector = null;
      try { selector = generateCSSSelector(el); } catch { /* skip */ }
      recordAction('select', describeElement(el), selector, value);
    } else if (type === 'checkbox' || type === 'radio') {
      const value = el.checked ? 'checked' : 'unchecked';
      let selector = null;
      try { selector = generateCSSSelector(el); } catch { /* skip */ }
      recordAction('check', describeElement(el), selector, value);
    }
  }

  function onSessionScroll() {
    if (scrollTimer) return;
    scrollTimer = setTimeout(() => {
      scrollTimer = null;
      const currentY = window.scrollY;
      if (Math.abs(currentY - lastScrollY) < 100) return;
      lastScrollY = currentY;
      recordAction('scroll', null, null, `y=${Math.round(currentY)}`);
    }, 300);
  }

  function onSessionSubmit(e) {
    if (isAnoElement(e.target)) return;
    const form = e.target;
    let selector = null;
    try { selector = generateCSSSelector(form); } catch { /* skip */ }
    recordAction('submit', describeElement(form), selector, null);
  }

  function onSessionError(e) {
    const msg = e.message || 'Unknown error';
    const src = e.filename ? ` at ${e.filename}:${e.lineno}:${e.colno}` : '';
    recordAction('error', null, null, `${msg}${src}`);
  }

  function onSessionUnhandledRejection(e) {
    const reason = e.reason;
    let msg;
    if (reason instanceof Error) {
      msg = `${reason.name}: ${reason.message}`;
    } else {
      try { msg = JSON.stringify(reason); } catch { msg = String(reason); }
    }
    recordAction('error', 'unhandledrejection', null, truncate(msg, 300));
  }

  function onSessionBeforeUnload() {
    flushInputTimers();
    persistToStorage();
  }

  function flushInputTimers() {
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
  }

  // ── Console interception ──

  function patchConsole() {
    for (const method of CONSOLE_METHODS) {
      originalConsole[method] = console[method];
      console[method] = (...args) => {
        originalConsole[method].apply(console, args);
        if (typeof args[0] === 'string' && args[0].startsWith('[Ano]')) return;
        const value = serializeConsoleArgs(args);
        recordAction(`console.${method}`, null, null, value);
      };
    }
  }

  function restoreConsole() {
    for (const method of CONSOLE_METHODS) {
      if (originalConsole[method]) {
        console[method] = originalConsole[method];
        delete originalConsole[method];
      }
    }
  }

  function serializeConsoleArgs(args) {
    const parts = args.map((arg) => {
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';
      if (typeof arg === 'string') return arg;
      if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
      if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
      try {
        const json = JSON.stringify(arg);
        return json.length > 200 ? json.slice(0, 200) + '...' : json;
      } catch {
        return String(arg);
      }
    });
    return truncate(parts.join(' '), 500);
  }

  // ── SessionStorage persistence ──

  function persistToStorage() {
    if (!active) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        active: true,
        sessionId,
        startTime,
        actions,
        pages,
      }));
    } catch { /* storage full — graceful fail */ }
  }

  function debouncedPersist() {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(persistToStorage, 200);
  }

  function clearStorage() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ok */ }
  }

  // ── Attach / detach event listeners ──

  function attachListeners() {
    document.addEventListener('click', onSessionClick, true);
    document.addEventListener('input', onSessionInput, true);
    document.addEventListener('change', onSessionChange, true);
    document.addEventListener('scroll', onSessionScroll, { capture: true, passive: true });
    document.addEventListener('submit', onSessionSubmit, true);
    window.addEventListener('beforeunload', onSessionBeforeUnload);
    window.addEventListener('error', onSessionError);
    window.addEventListener('unhandledrejection', onSessionUnhandledRejection);
  }

  function detachListeners() {
    document.removeEventListener('click', onSessionClick, true);
    document.removeEventListener('input', onSessionInput, true);
    document.removeEventListener('change', onSessionChange, true);
    document.removeEventListener('scroll', onSessionScroll, { capture: true });
    document.removeEventListener('submit', onSessionSubmit, true);
    window.removeEventListener('beforeunload', onSessionBeforeUnload);
    window.removeEventListener('error', onSessionError);
    window.removeEventListener('unhandledrejection', onSessionUnhandledRejection);
  }

  // ── Start / stop ──

  function start() {
    active = true;
    sessionId = nanoid();
    startTime = Date.now();
    actions = [];
    pages = [window.location.href];
    lastScrollY = window.scrollY;

    persistToStorage();
    attachListeners();
    patchConsole();

    return sessionId;
  }

  function resume(saved) {
    active = true;
    sessionId = saved.sessionId;
    startTime = saved.startTime;
    actions = saved.actions || [];
    pages = saved.pages || [];
    lastScrollY = window.scrollY;

    const currentUrl = window.location.href;
    if (!pages.includes(currentUrl)) {
      pages.push(currentUrl);
    }
    recordAction('navigate', document.title, null, currentUrl, currentUrl);

    attachListeners();
    patchConsole();
  }

  function stop() {
    if (!active) return null;
    active = false;

    flushInputTimers();
    detachListeners();
    restoreConsole();
    clearStorage();

    if (scrollTimer) {
      clearTimeout(scrollTimer);
      scrollTimer = null;
    }

    const duration = Date.now() - startTime;
    const description = buildDescription(duration, actions, pages);

    const data = {
      sessionId,
      duration,
      actions: actions.slice(),
      pages: pages.slice(),
      description,
    };

    // Reset
    const stoppedId = sessionId;
    actions = [];
    pages = [];
    startTime = 0;
    sessionId = null;

    return data;
  }

  // ── Context description ──

  function buildDescription(duration, actionList, pageList) {
    const secs = Math.round(duration / 1000);
    const lines = [`Session (${secs}s, ${actionList.length} actions, ${pageList.length} pages):`];

    for (let i = 0; i < actionList.length; i++) {
      const a = actionList[i];
      const t = (a.time / 1000).toFixed(1);
      let line;

      switch (a.action) {
        case 'click':
          line = `Clicked ${a.target}`;
          break;
        case 'type':
          line = `Typed "${truncate(a.value || '', 40)}" in ${a.target}`;
          break;
        case 'select':
          line = `Selected "${a.value}" in ${a.target}`;
          break;
        case 'check':
          line = `${a.value === 'checked' ? 'Checked' : 'Unchecked'} ${a.target}`;
          break;
        case 'scroll':
          line = `Scrolled to ${a.value}`;
          break;
        case 'submit':
          line = `Submitted ${a.target}`;
          break;
        case 'navigate':
          line = `Navigated to ${a.value}`;
          break;
        case 'console.log':
          line = `console.log: ${truncate(a.value || '', 80)}`;
          break;
        case 'console.warn':
          line = `console.warn: ${truncate(a.value || '', 80)}`;
          break;
        case 'console.error':
          line = `console.error: ${truncate(a.value || '', 80)}`;
          break;
        case 'console.info':
          line = `console.info: ${truncate(a.value || '', 80)}`;
          break;
        case 'error':
          line = `ERROR: ${truncate(a.value || '', 80)}`;
          break;
        default:
          line = `${a.action} ${a.target || ''}`;
      }

      lines.push(`${i + 1}. [${t}s] ${line}`);
    }

    return lines.join('\n');
  }

  // ── Public API ──

  function isActive() {
    return active;
  }

  function getSessionId() {
    return sessionId;
  }

  function getStartTime() {
    return startTime;
  }

  function getActionCount() {
    return actions.length;
  }

  function removeSession(id) {
    // No blob cleanup needed for sessions
  }

  // ── Destroy ──

  function destroy() {
    if (active) {
      active = false;
      detachListeners();
      restoreConsole();
      clearStorage();
      if (scrollTimer) {
        clearTimeout(scrollTimer);
        scrollTimer = null;
      }
      if (persistTimer) {
        clearTimeout(persistTimer);
        persistTimer = null;
      }
    }
    actions = [];
    pages = [];
    sessionId = null;
  }

  // ── Check for active session from previous page ──

  function checkResume() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved && saved.active) {
        resume(saved);
        ctx.events.emit('session:resumed', {
          sessionId: saved.sessionId,
          startTime: saved.startTime,
        });
      }
    } catch { /* corrupt data — ignore */ }
  }

  // Auto-check on creation
  setTimeout(checkResume, 50);

  return {
    start,
    stop,
    isActive,
    getSessionId,
    getStartTime,
    getActionCount,
    checkResume,
    removeSession,
    destroy,
  };
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '...' : str;
}
