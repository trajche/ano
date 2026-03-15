import { endDialogCSS } from './styles.js';
import { el, svg } from './components.js';
import { applyTheme } from './styles.js';
import { truncate } from '../utils.js';

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
      el('h2', {}, 'Report Ready'),
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

      for (const ann of summary.annotations) {
        if (ann.type === 'session' || ann.type === 'recording') continue;

        const card = el('div', { className: 'ano-end-ann-card' });

        if (ann.type === 'highlight') {
          card.appendChild(typeLabel('highlight', `#${ann.index} Highlight`));
          if (ann.text) card.appendChild(el('div', { className: 'ano-end-ann-text' }, `"${truncate(ann.text, 120)}"`));
        } else if (ann.type === 'pin') {
          card.appendChild(typeLabel('pin', `#${ann.index} Pin`));
          if (ann.context?.description) card.appendChild(el('div', { className: 'ano-end-ann-text' }, ann.context.description));
        } else if (ann.type === 'drawing') {
          card.appendChild(typeLabel('drawing', `#${ann.index} Drawing`));
        }

        if (ann.comment) {
          card.appendChild(el('div', { className: 'ano-end-ann-comment' }, ann.comment));
        }

        list.appendChild(card);
      }

      section.appendChild(list);
      dialog.appendChild(section);
    }

    // Share result — defined first so makeShareBtn can close over it
    const linkResult = el('div', { className: 'ano-end-link-result' });
    linkResult.style.display = 'none';

    const linkInput = document.createElement('input');
    linkInput.readOnly = true;
    linkInput.className = 'ano-end-link-input';

    const copyBtn = el('button', {
      className: 'ano-end-link-copy',
      onClick: () => {
        navigator.clipboard.writeText(linkInput.value).then(() => {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
        });
      },
    }, 'Copy');

    linkResult.appendChild(linkInput);
    linkResult.appendChild(copyBtn);

    // Track all event unsubs so we can clean up if dialog closes mid-upload
    const cleanups = [];

    function makeShareBtn(eventName) {
      const btn = el('button', { className: 'ano-end-export-share' });
      btn.appendChild(svg('link'));
      btn.addEventListener('click', () => {
        btn.disabled = true;
        let off1, off2;
        off1 = ctx.events.on('share:complete', (url) => {
          off1(); off2();
          btn.disabled = false;
          linkInput.value = url;
          linkResult.style.display = '';
        });
        off2 = ctx.events.on('share:error', () => {
          off1(); off2();
          btn.disabled = false;
        });
        cleanups.push(off1, off2);
        ctx.events.emit(eventName);
      });
      return btn;
    }

    function makeCopyBtn(eventName) {
      const btn = el('button', { className: 'ano-end-export-share' });
      btn.appendChild(svg('clipboard'));
      btn.addEventListener('click', () => {
        ctx.events.emit(eventName);
        btn.innerHTML = '';
        btn.appendChild(svg('check'));
        setTimeout(() => { btn.innerHTML = ''; btn.appendChild(svg('clipboard')); }, 2000);
      });
      return btn;
    }

    // Actions — one row per format
    const actions = el('div', { className: 'ano-end-actions' });

    const mdRow = el('div', { className: 'ano-end-export-row' });
    mdRow.appendChild(el('button', { className: 'ano-end-export-dl', onClick: () => ctx.events.emit('export:markdown') },
      svg('download'), 'Markdown'));
    mdRow.appendChild(makeShareBtn('share:markdown'));
    mdRow.appendChild(makeCopyBtn('copy:markdown'));
    actions.appendChild(mdRow);

    const jsonRow = el('div', { className: 'ano-end-export-row' });
    jsonRow.appendChild(el('button', { className: 'ano-end-export-dl', onClick: () => ctx.events.emit('export:json') },
      svg('download'), 'JSON'));
    jsonRow.appendChild(makeShareBtn('share:json'));
    jsonRow.appendChild(makeCopyBtn('copy:json'));
    actions.appendChild(jsonRow);

    if (summary.hasRecording) {
      const videoRow = el('div', { className: 'ano-end-export-row' });
      videoRow.appendChild(el('button', { className: 'ano-end-export-dl', onClick: () => ctx.events.emit('export:video') },
        svg('download'), 'Video'));
      videoRow.appendChild(makeShareBtn('share:video'));
      actions.appendChild(videoRow);
    }

    dialog.appendChild(actions);
    dialog.appendChild(linkResult);

    // Clean up share listeners when dialog closes
    const origHide = hide;
    hide = function () {
      for (const c of cleanups) c();
      origHide();
    };

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
