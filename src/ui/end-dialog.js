import { endDialogCSS } from './styles.js';
import { el, svg } from './components.js';
import { applyTheme } from './styles.js';

export function createEndDialog(ctx) {
  let host = null;
  let shadow = null;

  function show(summary) {
    hide();

    host = document.createElement('div');
    host.dataset.ano = '';
    shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = endDialogCSS;
    shadow.appendChild(style);

    applyTheme(host, ctx.config.theme);

    // Overlay
    const overlay = el('div', { className: 'ano-end-overlay' });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) dismiss();
    });

    // Dialog
    const dialog = el('div', { className: 'ano-end-dialog' });

    // Header
    const closeBtn = el('button', {
      className: 'ano-end-close',
      onClick: () => dismiss(),
    });
    closeBtn.appendChild(svg('close'));
    dialog.appendChild(el('div', { className: 'ano-end-header' },
      el('h2', {}, 'Session Complete'),
      closeBtn,
    ));

    // Summary grid
    const grid = el('div', { className: 'ano-end-summary' });

    grid.appendChild(statCard(formatDuration(summary.duration), 'Duration'));
    grid.appendChild(statCard(String(summary.actionCount), 'Actions'));
    grid.appendChild(statCard(String(summary.pageCount), 'Pages'));
    grid.appendChild(statCard(String(summary.annotationCount), 'Annotations'));

    if (summary.hasRecording) {
      const badge = el('div', { className: 'ano-end-badge' });
      badge.appendChild(svg('record'));
      badge.appendChild(document.createTextNode('Video recorded'));
      grid.appendChild(badge);
    }

    dialog.appendChild(grid);

    // Annotation list
    if (summary.annotations && summary.annotations.length > 0) {
      const section = el('div', { className: 'ano-end-annotations' });
      section.appendChild(el('h3', {}, 'Annotations'));

      const list = el('div', { className: 'ano-end-ann-list' });

      let pinIndex = 0;
      for (const ann of summary.annotations) {
        if (ann.type === 'session' || ann.type === 'recording') continue;

        const card = el('div', { className: 'ano-end-ann-card' });

        if (ann.type === 'highlight') {
          card.appendChild(typeLabel('highlight', 'Highlight'));
          if (ann.quote) card.appendChild(el('div', { className: 'ano-end-ann-text' }, `"${truncate(ann.quote, 120)}"`));
        } else if (ann.type === 'pin') {
          pinIndex++;
          card.appendChild(typeLabel('pin', `Pin #${pinIndex}`));
          if (ann.target?.description) card.appendChild(el('div', { className: 'ano-end-ann-text' }, ann.target.description));
        } else if (ann.type === 'drawing') {
          card.appendChild(typeLabel('drawing', 'Drawing'));
        }

        if (ann.comment) {
          card.appendChild(el('div', { className: 'ano-end-ann-comment' }, ann.comment));
        }

        list.appendChild(card);
      }

      section.appendChild(list);
      dialog.appendChild(section);
    }

    // Actions
    const actions = el('div', { className: 'ano-end-actions' });

    const dismissBtn = el('button', {
      onClick: () => dismiss(),
    }, 'Dismiss');

    const linkBtn = el('button', {
      onClick: () => {
        ctx.events.emit('share');
        dismiss();
      },
    }, 'Get Link');

    const exportBtn = el('button', {
      className: 'primary',
      onClick: () => {
        ctx.events.emit('export');
        dismiss();
      },
    }, 'Export JSON');

    actions.appendChild(dismissBtn);
    actions.appendChild(linkBtn);
    actions.appendChild(exportBtn);
    dialog.appendChild(actions);

    overlay.appendChild(dialog);
    shadow.appendChild(overlay);
    document.body.appendChild(host);
  }

  function statCard(value, label) {
    return el('div', { className: 'ano-end-stat' },
      el('div', { className: 'ano-end-stat-value' }, value),
      el('div', { className: 'ano-end-stat-label' }, label),
    );
  }

  function typeLabel(type, text) {
    const label = el('div', { className: `ano-end-ann-type ${type}` });
    label.appendChild(el('span', { className: 'dot' }));
    label.appendChild(document.createTextNode(text));
    return label;
  }

  function truncate(str, max) {
    if (!str || str.length <= max) return str || '';
    return str.slice(0, max) + '…';
  }

  function formatDuration(ms) {
    const secs = Math.floor((ms || 0) / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function dismiss() {
    hide();
    ctx.events.emit('session:dismissed');
  }

  function hide() {
    if (host) {
      host.remove();
      host = null;
      shadow = null;
    }
  }

  function isOpen() {
    return host !== null;
  }

  function destroy() {
    hide();
  }

  return { show, hide, dismiss, isOpen, destroy };
}
