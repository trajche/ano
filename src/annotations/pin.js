import { generateCSSSelector, getTargetMeta, resolveTarget } from '../anchoring/selector.js';

export function createPinManager(ctx) {
  const { store, config } = ctx;
  let active = false;
  const pinElements = new Map(); // annotationId → { marker, target }
  let hoverOutline = null;
  let overlay = null;

  function enable() {
    if (active) return;
    active = true;
    createOverlay();
    document.addEventListener('mousemove', onMouseMove, true);
  }

  function disable() {
    active = false;
    removeOverlay();
    document.removeEventListener('mousemove', onMouseMove, true);
  }

  function createOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'ano-pin-overlay active';
    overlay.dataset.ano = '';
    overlay.addEventListener('click', onOverlayClick, true);
    overlay.addEventListener('mousemove', onOverlayMouseMove);
    document.body.appendChild(overlay);

    hoverOutline = document.createElement('div');
    hoverOutline.className = 'ano-pin-hover-outline';
    hoverOutline.dataset.ano = '';
    document.body.appendChild(hoverOutline);
  }

  function removeOverlay() {
    if (overlay) {
      overlay.removeEventListener('click', onOverlayClick, true);
      overlay.removeEventListener('mousemove', onOverlayMouseMove);
      overlay.remove();
      overlay = null;
    }
    if (hoverOutline) {
      hoverOutline.remove();
      hoverOutline = null;
    }
  }

  function onOverlayMouseMove(e) {
    // Temporarily hide overlay to hit-test below
    overlay.style.pointerEvents = 'none';
    const target = document.elementFromPoint(e.clientX, e.clientY);
    overlay.style.pointerEvents = 'auto';

    if (target && target !== document.body && target !== document.documentElement && !isAnoElement(target)) {
      const rect = target.getBoundingClientRect();
      hoverOutline.style.display = 'block';
      hoverOutline.style.left = `${rect.left + window.scrollX}px`;
      hoverOutline.style.top = `${rect.top + window.scrollY}px`;
      hoverOutline.style.width = `${rect.width}px`;
      hoverOutline.style.height = `${rect.height}px`;
    } else {
      hoverOutline.style.display = 'none';
    }
  }

  function onMouseMove() {
    // Keep hover outline tracking when not using overlay approach
  }

  function onOverlayClick(e) {
    e.preventDefault();
    e.stopPropagation();

    overlay.style.pointerEvents = 'none';
    const target = document.elementFromPoint(e.clientX, e.clientY);
    overlay.style.pointerEvents = 'auto';

    if (!target || target === document.body || target === document.documentElement || isAnoElement(target)) {
      return;
    }

    const targetSelector = generateCSSSelector(target);
    const targetMeta = getTargetMeta(target);
    const context = capturePinContext(target);

    const annotation = store.add({
      type: 'pin',
      comment: '',
      targetSelector,
      targetMeta,
      context,
    });

    createPinMarker(annotation, target);
    ctx.events.emit('pin:created', annotation);
  }

  function createPinMarker(annotation, target) {
    const marker = document.createElement('div');
    marker.className = 'ano-pin-marker';
    marker.dataset.ano = '';
    marker.dataset.anoId = annotation.id;
    marker.textContent = annotation.index;
    marker.style.setProperty('--ano-pin-color', config.pinColor);
    document.body.appendChild(marker);

    positionMarker(marker, target);
    pinElements.set(annotation.id, { marker, target });

    marker.addEventListener('click', (e) => {
      e.stopPropagation();
      ctx.events.emit('pin:click', annotation);
    });
  }

  function positionMarker(marker, target) {
    const rect = target.getBoundingClientRect();
    marker.style.left = `${rect.left + window.scrollX - 12}px`;
    marker.style.top = `${rect.top + window.scrollY - 12}px`;
  }

  function repositionAll() {
    for (const [id, { marker, target }] of pinElements) {
      if (document.body.contains(target)) {
        positionMarker(marker, target);
      }
    }
  }

  function applyPin(annotation) {
    if (pinElements.has(annotation.id)) return true;

    const target = resolveTarget(annotation.targetSelector, annotation.targetMeta);
    if (!target) return false;

    createPinMarker(annotation, target);
    return true;
  }

  function removePin(id) {
    const entry = pinElements.get(id);
    if (!entry) return;
    entry.marker.remove();
    pinElements.delete(id);
  }

  function removeAll() {
    for (const [id] of [...pinElements]) {
      removePin(id);
    }
  }

  function scrollToPin(id) {
    const entry = pinElements.get(id);
    if (!entry) return;
    entry.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function capturePinContext(target) {
    const tag = target.tagName.toLowerCase();

    // Collect useful attributes
    const attrs = {};
    const useful = ['href', 'src', 'action', 'type', 'name', 'placeholder',
      'value', 'alt', 'title', 'role', 'aria-label', 'aria-describedby',
      'data-testid', 'for', 'method'];
    for (const name of useful) {
      const val = target.getAttribute(name);
      if (val) attrs[name] = val.length > 120 ? val.slice(0, 120) + '...' : val;
    }

    // Visible text content (direct, not deep)
    const visibleText = getVisibleText(target);

    // Parent chain for structural context: ["body", "main", "form", "div.form-group"]
    const path = [];
    let walk = target;
    while (walk && walk !== document.body) {
      let label = walk.tagName.toLowerCase();
      if (walk.id) label += `#${walk.id}`;
      else if (walk.className && typeof walk.className === 'string') {
        const cls = walk.className.trim().split(/\s+/).slice(0, 2).join('.');
        if (cls) label += `.${cls}`;
      }
      if (walk.getAttribute('role')) label += `[role=${walk.getAttribute('role')}]`;
      path.unshift(label);
      walk = walk.parentElement;
    }

    // Sibling context — what's next to this element
    const siblings = [];
    const parent = target.parentElement;
    if (parent) {
      for (const child of parent.children) {
        if (child === target) continue;
        const sib = child.tagName.toLowerCase();
        const sibText = truncate((child.textContent || '').trim(), 60);
        if (sibText) siblings.push(`${sib}("${sibText}")`);
        if (siblings.length >= 4) break;
      }
    }

    // Build description
    let desc = `${tag}`;
    if (visibleText) desc += `("${truncate(visibleText, 80)}")`;
    if (attrs.type) desc += `[type=${attrs.type}]`;
    if (attrs.href) desc += `[href=${truncate(attrs.href, 60)}]`;
    if (attrs.role) desc += `[role=${attrs.role}]`;
    const parentTag = parent ? parent.tagName.toLowerCase() : '';
    if (parentTag) desc += ` inside ${parentTag}`;
    if (parent?.id) desc += `#${parent.id}`;

    return {
      description: desc,
      attributes: Object.keys(attrs).length > 0 ? attrs : undefined,
      visibleText: visibleText || undefined,
      pagePath: path,
      siblings: siblings.length > 0 ? siblings : undefined,
    };
  }

  function getVisibleText(el) {
    // Prefer explicit labels
    const aria = el.getAttribute('aria-label');
    if (aria) return aria.trim();
    const alt = el.getAttribute('alt');
    if (alt) return alt.trim();
    const title = el.getAttribute('title');
    if (title) return title.trim();

    // Direct text nodes only
    let text = '';
    for (const child of el.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) text += child.textContent;
    }
    text = text.trim();
    if (text) return text;

    return (el.textContent || '').trim().slice(0, 150);
  }

  function truncate(str, max) {
    return str.length > max ? str.slice(0, max) + '...' : str;
  }

  function destroy() {
    disable();
    removeAll();
  }

  return {
    enable,
    disable,
    applyPin,
    removePin,
    removeAll,
    repositionAll,
    scrollToPin,
    destroy,
  };
}

function isAnoElement(el) {
  if (!el) return false;
  let node = el;
  while (node) {
    if (node.dataset && node.dataset.ano !== undefined) return true;
    if (node.host && node.host.dataset && node.host.dataset.ano !== undefined) return true;
    node = node.parentNode;
  }
  return false;
}
