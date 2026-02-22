export function createShortcutManager(ctx) {
  let active = false;

  const shortcuts = {
    'alt+h': () => {
      if (ctx.sessionState === 'active') ctx.setMode('highlight');
    },
    'alt+p': () => {
      if (ctx.sessionState === 'active') ctx.setMode('pin');
    },
    'alt+d': () => {
      if (ctx.sessionState === 'active') ctx.setMode('draw');
    },
    'alt+n': () => {
      if (ctx.sessionState === 'active') ctx.setMode('navigate');
    },
    'alt+s': () => {
      if (ctx.sessionState === 'idle') {
        ctx.events.emit('session:start');
      } else if (ctx.sessionState === 'active') {
        ctx.events.emit('session:end');
      }
    },
    'alt+e': () => ctx.events.emit('export'),
    'escape': () => {
      if (ctx.popover.isOpen()) {
        ctx.popover.hide();
      } else if (ctx.sessionState === 'active') {
        ctx.events.emit('session:end');
      } else if (ctx.endDialog && ctx.endDialog.isOpen()) {
        ctx.endDialog.dismiss();
      }
    },
  };

  function onKeyDown(e) {
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      if (e.key === 'Escape') {
        const isAnoElement = e.target.closest?.('[data-ano]') || isInShadow(e.target);
        if (isAnoElement) {
          shortcuts['escape']();
          return;
        }
      }
      return;
    }

    const key = buildKey(e);
    if (shortcuts[key]) {
      e.preventDefault();
      e.stopPropagation();
      shortcuts[key]();
    }
  }

  function buildKey(e) {
    const parts = [];
    if (e.altKey) parts.push('alt');
    if (e.ctrlKey) parts.push('ctrl');
    if (e.metaKey) parts.push('meta');
    if (e.shiftKey) parts.push('shift');
    parts.push(e.key.toLowerCase());
    return parts.join('+');
  }

  function isInShadow(el) {
    let node = el;
    while (node) {
      if (node.host && node.host.dataset && node.host.dataset.ano !== undefined) return true;
      node = node.parentNode;
    }
    return false;
  }

  function enable() {
    if (active) return;
    active = true;
    document.addEventListener('keydown', onKeyDown, true);
  }

  function disable() {
    active = false;
    document.removeEventListener('keydown', onKeyDown, true);
  }

  function destroy() {
    disable();
  }

  return { enable, disable, destroy };
}
