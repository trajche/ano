import { toolbarCSS } from './styles.js';
import { el, svg } from './components.js';
import { applyTheme } from './styles.js';
import { canRecord } from '../annotations/recording.js';

const ANNOTATE_MODES = [
  { id: 'highlight', label: 'Highlight', icon: 'highlight', shortcut: 'Alt+H' },
  { id: 'pin', label: 'Pin', icon: 'pin', shortcut: 'Alt+P' },
  { id: 'draw', label: 'Draw', icon: 'draw', shortcut: 'Alt+D' },
  { id: 'navigate', label: 'Navigate', icon: 'navigate', shortcut: 'Alt+N' },
];

export function createToolbar(ctx) {
  let host = null;
  let shadow = null;
  let toolbarEl = null;
  let buttons = {};
  let timerEl = null;
  let countEl = null;
  let timerInterval = null;
  let videoCheckbox = null;

  function render() {
    host = document.createElement('div');
    host.dataset.ano = '';
    shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = toolbarCSS;
    shadow.appendChild(style);

    applyTheme(host, ctx.config.theme);

    toolbarEl = el('div', { className: 'ano-toolbar' });
    shadow.appendChild(toolbarEl);
    document.body.appendChild(host);

    renderIdle();
  }

  function renderIdle() {
    clearTimer();
    buttons = {};
    toolbarEl.innerHTML = '';

    // Start Session button
    const startBtn = el('button', {
      className: 'ano-start-session',
      onClick: () => ctx.events.emit('session:start'),
    },
      svg('session'),
      el('span', { className: 'ano-btn-label' }, 'Start Session'),
    );
    toolbarEl.appendChild(startBtn);

    // Video toggle (only if recording is supported)
    if (canRecord) {
      const label = el('label', { className: 'ano-video-toggle' });
      videoCheckbox = document.createElement('input');
      videoCheckbox.type = 'checkbox';
      videoCheckbox.checked = ctx.config.videoRecording;
      label.appendChild(videoCheckbox);
      label.appendChild(svg('record'));
      label.appendChild(document.createTextNode('Video'));
      toolbarEl.appendChild(label);
    }
  }

  function renderActive(startTime) {
    clearTimer();
    buttons = {};
    toolbarEl.innerHTML = '';

    // Annotation tool buttons
    for (const mode of ANNOTATE_MODES) {
      const btn = el('button', {
        className: 'ano-toolbar-btn',
        title: mode.label,
        onClick: () => ctx.setMode(mode.id),
      },
        svg(mode.icon),
        el('span', { className: 'tooltip' }, `${mode.label} (${mode.shortcut})`),
      );
      buttons[mode.id] = btn;
      toolbarEl.appendChild(btn);
    }

    // Divider
    toolbarEl.appendChild(el('div', { className: 'ano-toolbar-divider' }));

    // Session status area
    const status = el('div', { className: 'ano-session-status' });

    status.appendChild(el('span', { className: 'ano-session-dot' }));

    timerEl = el('span', { className: 'ano-session-timer' }, '0:00');
    status.appendChild(timerEl);

    countEl = el('span', { className: 'ano-session-count' }, '(0)');
    status.appendChild(countEl);

    const endBtn = el('button', {
      className: 'ano-end-session',
      onClick: () => ctx.events.emit('session:end'),
    },
      svg('stop'),
      el('span', { className: 'ano-btn-label' }, 'End'),
    );
    status.appendChild(endBtn);

    toolbarEl.appendChild(status);

    // Start timer
    const updateTimerFn = () => {
      if (!timerEl) return;
      const elapsed = Date.now() - startTime;
      const secs = Math.floor(elapsed / 1000);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      timerEl.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    };
    updateTimerFn();
    timerInterval = setInterval(updateTimerFn, 250);
  }

  function updateCount(n) {
    if (countEl) countEl.textContent = `(${n})`;
  }

  function getVideoToggleState() {
    return videoCheckbox ? videoCheckbox.checked : false;
  }

  function setActive(modeId) {
    for (const [id, btn] of Object.entries(buttons)) {
      btn.classList.toggle('active', id === modeId);
    }
  }

  function clearTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    timerEl = null;
    countEl = null;
  }

  function updateTheme(theme) {
    if (host) applyTheme(host, theme);
  }

  function destroy() {
    clearTimer();
    if (host) {
      host.remove();
      host = null;
      shadow = null;
      toolbarEl = null;
      buttons = {};
      videoCheckbox = null;
    }
  }

  return { render, renderIdle, renderActive, setActive, updateCount, getVideoToggleState, updateTheme, destroy };
}
