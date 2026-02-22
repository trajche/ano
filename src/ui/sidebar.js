import { sidebarCSS } from './styles.js';
import { el, svg, formatTime } from './components.js';
import { applyTheme } from './styles.js';

export function createSidebar(ctx) {
  const { store } = ctx;
  let host = null;
  let shadow = null;
  let sidebar = null;
  let listEl = null;
  let tabToggle = null;
  let isOpen = false;
  let filter = 'all';
  let unsubStore = null;
  let shareBtnEl = null;
  let toastEl = null;
  let toastTimer = null;
  let unsubShareComplete = null;
  let unsubShareError = null;
  let unsubShareUploading = null;

  function render() {
    host = document.createElement('div');
    host.dataset.ano = '';
    shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = sidebarCSS;
    shadow.appendChild(style);

    applyTheme(host, ctx.config.theme);
    host.style.setProperty('--ano-sidebar-width', ctx.config.sidebarWidth + 'px');

    sidebar = el('div', { className: 'ano-sidebar' });

    // Header
    const header = el('div', { className: 'ano-sidebar-header' },
      el('h2', {}, 'Annotations'),
      el('div', { className: 'ano-sidebar-actions' },
        createIconBtn('close', () => toggle(false)),
      ),
    );
    sidebar.appendChild(header);

    // Filter bar
    const filterBar = el('div', { className: 'ano-filter-bar' });
    const filters = [
      { id: 'all', label: 'All' },
      { id: 'highlight', label: 'Highlights' },
      { id: 'pin', label: 'Pins' },
      { id: 'drawing', label: 'Drawings' },
      { id: 'session', label: 'Sessions' },
    ];
    for (const f of filters) {
      const btn = el('button', {
        className: `ano-filter-btn${filter === f.id ? ' active' : ''}`,
        onClick: () => setFilter(f.id),
      }, f.label);
      btn.dataset.filter = f.id;
      filterBar.appendChild(btn);
    }
    sidebar.appendChild(filterBar);

    // List
    listEl = el('div', { className: 'ano-list' });
    sidebar.appendChild(listEl);

    // Toast
    toastEl = el('div', { className: 'ano-toast' });

    // Footer
    shareBtnEl = el('button', {
      className: 'ano-btn',
      onClick: () => ctx.events.emit('share'),
    }, svg('link'), 'Get link');

    const footer = el('div', { className: 'ano-sidebar-footer' },
      el('button', {
        className: 'ano-btn',
        onClick: () => ctx.events.emit('export'),
      }, svg('download'), 'Export'),
      el('button', {
        className: 'ano-btn',
        onClick: () => ctx.events.emit('import'),
      }, svg('upload'), 'Import'),
      shareBtnEl,
    );
    sidebar.appendChild(footer);
    sidebar.appendChild(toastEl);

    // Share events
    unsubShareUploading = ctx.events.on('share:uploading', () => {
      shareBtnEl.disabled = true;
      shareBtnEl.textContent = 'Uploading\u2026';
    });
    unsubShareComplete = ctx.events.on('share:complete', (url) => {
      shareBtnEl.disabled = false;
      shareBtnEl.innerHTML = '';
      shareBtnEl.appendChild(svg('link'));
      shareBtnEl.appendChild(document.createTextNode('Get link'));
      showToast(`Link copied — paste into a ticket or LLM. Expires in 7 days.\n<a href="${url}" target="_blank">${url}</a>`);
    });
    unsubShareError = ctx.events.on('share:error', () => {
      shareBtnEl.disabled = false;
      shareBtnEl.innerHTML = '';
      shareBtnEl.appendChild(svg('link'));
      shareBtnEl.appendChild(document.createTextNode('Get link'));
      showToast('Upload failed. Please try again.', true);
    });

    shadow.appendChild(sidebar);

    // Tab toggle
    tabToggle = el('button', { className: 'ano-tab-toggle' });
    tabToggle.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    tabToggle.addEventListener('click', () => toggle());
    shadow.appendChild(tabToggle);

    document.body.appendChild(host);

    // Subscribe to store changes
    unsubStore = store.on('change', () => renderList());

    renderList();

    if (ctx.config.autoOpen) {
      requestAnimationFrame(() => toggle(true));
    }
  }

  function renderList() {
    if (!listEl) return;
    listEl.innerHTML = '';

    let annotations = store.getAll();
    if (filter !== 'all') {
      annotations = annotations.filter((a) => a.type === filter);
    }

    // Sort by creation time (newest first)
    annotations.sort((a, b) => b.createdAt - a.createdAt);

    if (annotations.length === 0) {
      listEl.appendChild(
        el('div', { className: 'ano-list-empty' },
          filter === 'all'
            ? 'No annotations yet. Highlight text, pin elements, or draw to capture what needs fixing.'
            : `No ${filter} annotations.`
        )
      );
      return;
    }

    for (const ann of annotations) {
      listEl.appendChild(createCard(ann));
    }
  }

  function createCard(annotation) {
    const card = el('div', { className: 'ano-card' });
    card.dataset.id = annotation.id;

    const header = el('div', { className: 'ano-card-header' });
    const typeLabel = el('span', { className: `ano-card-type ${annotation.type}` });

    if (annotation.type === 'highlight') {
      typeLabel.textContent = 'Highlight';
    } else if (annotation.type === 'pin') {
      typeLabel.textContent = `Pin #${annotation.index}`;
    } else if (annotation.type === 'drawing') {
      typeLabel.textContent = 'Drawing';
    } else if (annotation.type === 'recording') {
      typeLabel.textContent = 'Recording';
    } else if (annotation.type === 'session') {
      typeLabel.textContent = 'Session';
    }
    header.appendChild(typeLabel);

    const deleteBtn = createIconBtn('trash', (e) => {
      e.stopPropagation();
      ctx.events.emit('annotation:delete', annotation.id);
    }, 'ano-card-delete danger');
    header.appendChild(deleteBtn);
    card.appendChild(header);

    // Content
    if (annotation.type === 'highlight' && annotation.text) {
      card.appendChild(
        el('div', { className: 'ano-card-text' }, `"${annotation.text}"`)
      );
    } else if (annotation.type === 'pin' && annotation.targetMeta) {
      const desc = `<${annotation.targetMeta.tagName?.toLowerCase() || 'element'}>`;
      card.appendChild(
        el('div', { className: 'ano-card-text' }, desc)
      );
    } else if (annotation.type === 'recording') {
      const secs = Math.round((annotation.duration || 0) / 1000);
      const rgn = annotation.region;
      const meta = `${secs}s recording`;
      const dims = rgn ? ` \u2014 ${rgn.width}\u00d7${rgn.height}` : '';
      card.appendChild(
        el('div', { className: 'ano-card-meta' }, meta + dims)
      );
      if (annotation.context?.description) {
        card.appendChild(
          el('div', { className: 'ano-card-text' }, annotation.context.description)
        );
      }
    } else if (annotation.type === 'session') {
      const secs = Math.round((annotation.duration || 0) / 1000);
      const actionCount = annotation.actions?.length || 0;
      const pageCount = annotation.pages?.length || 0;
      const annCount = annotation.annotationIds?.length || 0;
      let meta = `${secs}s \u2014 ${actionCount} actions, ${pageCount} pages`;
      if (annCount > 0) meta += `, ${annCount} annotations`;
      if (annotation.hasRecording) meta += ' \u2022 Video';
      card.appendChild(
        el('div', { className: 'ano-card-meta' }, meta)
      );
      if (annotation.context?.description) {
        card.appendChild(
          el('div', { className: 'ano-card-text' }, annotation.context.description)
        );
      }
    }

    if (annotation.comment) {
      card.appendChild(
        el('div', { className: 'ano-card-comment' }, annotation.comment)
      );
    }

    card.appendChild(
      el('div', { className: 'ano-card-time' }, formatTime(annotation.createdAt))
    );

    card.addEventListener('click', () => {
      ctx.events.emit('annotation:focus', annotation);
    });

    return card;
  }

  function createIconBtn(icon, onClick, extraClass = '') {
    const btn = el('button', {
      className: `ano-icon-btn ${extraClass}`.trim(),
      onClick,
    });
    btn.appendChild(svg(icon));
    return btn;
  }

  function setFilter(f) {
    filter = f;
    if (!shadow) return;
    const btns = shadow.querySelectorAll('.ano-filter-btn');
    btns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.filter === f);
    });
    renderList();
  }

  function showToast(html, isError = false) {
    if (!toastEl) return;
    if (toastTimer) clearTimeout(toastTimer);
    toastEl.innerHTML = html;
    toastEl.className = 'ano-toast' + (isError ? ' error' : '');
    // Force reflow then show
    void toastEl.offsetWidth;
    toastEl.classList.add('visible');
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('visible');
    }, isError ? 4000 : 5000);
  }

  function toggle(state) {
    isOpen = state != null ? state : !isOpen;
    if (sidebar) sidebar.classList.toggle('open', isOpen);
    if (tabToggle) tabToggle.classList.toggle('shifted', isOpen);
  }

  function getIsOpen() {
    return isOpen;
  }

  function updateTheme(theme) {
    if (host) applyTheme(host, theme);
  }

  function destroy() {
    if (unsubStore) unsubStore();
    if (unsubShareComplete) unsubShareComplete();
    if (unsubShareError) unsubShareError();
    if (unsubShareUploading) unsubShareUploading();
    if (toastTimer) clearTimeout(toastTimer);
    unsubStore = null;
    unsubShareComplete = null;
    unsubShareError = null;
    unsubShareUploading = null;
    if (host) {
      host.remove();
      host = null;
      shadow = null;
      sidebar = null;
      listEl = null;
      tabToggle = null;
      shareBtnEl = null;
      toastEl = null;
    }
    isOpen = false;
  }

  return { render, renderList, toggle, getIsOpen, updateTheme, destroy };
}
