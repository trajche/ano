import { popoverCSS } from './styles.js';
import { el } from './components.js';
import { applyTheme } from './styles.js';

export function createPopoverManager(ctx) {
  const { store } = ctx;
  let host = null;
  let shadow = null;
  let currentId = null;
  let cleanupClickOutside = null;

  function init() {
    if (host) return;
    host = document.createElement('div');
    host.dataset.ano = '';
    shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = popoverCSS;
    shadow.appendChild(style);

    applyTheme(host, ctx.config.theme);
    document.body.appendChild(host);
  }

  function show(annotationId, anchorRect) {
    init();
    if (currentId === annotationId) return; // already showing for this annotation
    hide();
    currentId = annotationId;

    const annotation = store.get(annotationId);
    if (!annotation) return;

    const popover = el('div', { className: 'ano-popover' });

    const body = el('div', { className: 'ano-popover-body' });
    const textarea = el('textarea', {
      placeholder: 'Add a comment...',
    });
    textarea.value = annotation.comment || '';
    body.appendChild(textarea);
    popover.appendChild(body);

    const actions = el('div', { className: 'ano-popover-actions' });

    const deleteBtn = el('button', {
      className: 'ano-popover-btn delete',
      onClick: () => {
        ctx.events.emit('annotation:delete', annotationId);
        hide();
      },
    }, 'Delete');

    const cancelBtn = el('button', {
      className: 'ano-popover-btn',
      onClick: () => hide(),
    }, 'Cancel');

    const saveBtn = el('button', {
      className: 'ano-popover-btn save',
      onClick: () => {
        store.update(annotationId, { comment: textarea.value });
        hide();
      },
    }, 'Save');

    actions.appendChild(deleteBtn);
    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);
    popover.appendChild(actions);

    // Add arrow
    const arrow = el('div', { className: 'ano-popover-arrow' });
    popover.appendChild(arrow);

    shadow.appendChild(popover);

    // Position with flip logic
    requestAnimationFrame(() => {
      positionPopover(popover, arrow, anchorRect);
      textarea.focus();

      // Click outside → save and close
      function onClickOutside(e) {
        if (host && !host.shadowRoot.contains(e.target) && !host.contains(e.target)) {
          store.update(annotationId, { comment: textarea.value });
          hide();
        }
      }
      document.addEventListener('click', onClickOutside, true);
      cleanupClickOutside = () => {
        document.removeEventListener('click', onClickOutside, true);
      };
    });

    // Handle keyboard
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        store.update(annotationId, { comment: textarea.value });
        hide();
      }
      if (e.key === 'Escape') {
        store.update(annotationId, { comment: textarea.value });
        hide();
      }
      e.stopPropagation();
    });
  }

  function positionPopover(popover, arrow, anchor) {
    const popRect = popover.getBoundingClientRect();
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;

    let top, left;
    let arrowPos = 'top'; // popover is below anchor, arrow points up

    // Try positioning below
    top = anchor.bottom + 8;
    if (top + popRect.height > viewH) {
      // Flip above
      top = anchor.top - popRect.height - 8;
      arrowPos = 'bottom';
    }

    // Horizontal centering
    left = anchor.left + (anchor.width / 2) - (popRect.width / 2);
    left = Math.max(8, Math.min(left, viewW - popRect.width - 8));

    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;

    // Position arrow
    arrow.className = `ano-popover-arrow ${arrowPos}`;
    const arrowLeft = anchor.left + (anchor.width / 2) - left - 6;
    arrow.style.left = `${Math.max(12, Math.min(arrowLeft, popRect.width - 24))}px`;
  }

  function hide() {
    if (cleanupClickOutside) {
      cleanupClickOutside();
      cleanupClickOutside = null;
    }
    if (!shadow) return;
    const existing = shadow.querySelector('.ano-popover');
    if (existing) existing.remove();
    currentId = null;
  }

  function isOpen() {
    return currentId !== null;
  }

  function getCurrentId() {
    return currentId;
  }

  function updateTheme(theme) {
    if (host) applyTheme(host, theme);
  }

  function destroy() {
    hide();
    if (host) {
      host.remove();
      host = null;
      shadow = null;
    }
  }

  return { init, show, hide, isOpen, getCurrentId, updateTheme, destroy };
}
