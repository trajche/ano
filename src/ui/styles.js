export const THEME = {
  light: {
    '--ano-bg': '#ffffff',
    '--ano-bg-secondary': '#f8fafc',
    '--ano-bg-hover': '#f1f5f9',
    '--ano-border': '#e2e8f0',
    '--ano-text': '#1e293b',
    '--ano-text-secondary': '#64748b',
    '--ano-accent': '#3b82f6',
    '--ano-accent-hover': '#2563eb',
    '--ano-highlight': '#fde047',
    '--ano-pin': '#3b82f6',
    '--ano-draw': '#ef4444',
    '--ano-danger': '#ef4444',
    '--ano-danger-hover': '#dc2626',
    '--ano-shadow': '0 4px 24px rgba(0,0,0,0.12)',
    '--ano-shadow-sm': '0 2px 8px rgba(0,0,0,0.08)',
  },
  dark: {
    '--ano-bg': '#1e293b',
    '--ano-bg-secondary': '#0f172a',
    '--ano-bg-hover': '#334155',
    '--ano-border': '#475569',
    '--ano-text': '#f1f5f9',
    '--ano-text-secondary': '#94a3b8',
    '--ano-accent': '#60a5fa',
    '--ano-accent-hover': '#3b82f6',
    '--ano-highlight': '#fbbf24',
    '--ano-pin': '#60a5fa',
    '--ano-draw': '#f87171',
    '--ano-danger': '#f87171',
    '--ano-danger-hover': '#ef4444',
    '--ano-shadow': '0 4px 24px rgba(0,0,0,0.4)',
    '--ano-shadow-sm': '0 2px 8px rgba(0,0,0,0.3)',
  },
};

export const sidebarCSS = `
  :host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    color: var(--ano-text);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .ano-sidebar {
    position: fixed;
    top: 0;
    right: 0;
    width: var(--ano-sidebar-width, 320px);
    height: 100vh;
    background: var(--ano-bg);
    border-left: 1px solid var(--ano-border);
    box-shadow: var(--ano-shadow);
    z-index: 2147483646;
    display: flex;
    flex-direction: column;
    transform: translateX(100%);
    transition: transform 0.25s ease;
  }
  .ano-sidebar.open {
    transform: translateX(0);
  }
  .ano-sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--ano-border);
    background: var(--ano-bg-secondary);
  }
  .ano-sidebar-header h2 {
    font-size: 15px;
    font-weight: 600;
    color: var(--ano-text);
  }
  .ano-sidebar-actions {
    display: flex;
    gap: 4px;
  }
  .ano-filter-bar {
    display: flex;
    gap: 4px;
    padding: 8px 16px;
    border-bottom: 1px solid var(--ano-border);
    background: var(--ano-bg-secondary);
  }
  .ano-filter-btn {
    padding: 4px 10px;
    border-radius: 12px;
    border: 1px solid var(--ano-border);
    background: var(--ano-bg);
    color: var(--ano-text-secondary);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .ano-filter-btn:hover {
    background: var(--ano-bg-hover);
  }
  .ano-filter-btn.active {
    background: var(--ano-accent);
    color: #fff;
    border-color: var(--ano-accent);
  }
  .ano-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }
  .ano-list-empty {
    padding: 32px 16px;
    text-align: center;
    color: var(--ano-text-secondary);
    font-size: 13px;
    line-height: 1.5;
  }
  .ano-card {
    padding: 12px;
    margin-bottom: 8px;
    border-radius: 8px;
    border: 1px solid var(--ano-border);
    background: var(--ano-bg);
    cursor: pointer;
    transition: background 0.15s;
  }
  .ano-card:hover {
    background: var(--ano-bg-hover);
  }
  .ano-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .ano-card-type {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .ano-card-type.highlight { color: #ca8a04; }
  .ano-card-type.pin { color: var(--ano-pin); }
  .ano-card-type.drawing { color: var(--ano-draw); }
  .ano-card-type.recording { color: #ef4444; }
  .ano-card-type.session { color: #8b5cf6; }
  .ano-card-meta {
    font-size: 12px;
    color: var(--ano-text-secondary);
    margin-bottom: 4px;
  }
  .ano-card-delete {
    opacity: 0;
    transition: opacity 0.15s;
  }
  .ano-card:hover .ano-card-delete {
    opacity: 1;
  }
  .ano-card-text {
    font-size: 13px;
    color: var(--ano-text);
    margin-bottom: 4px;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .ano-card-comment {
    font-size: 12px;
    color: var(--ano-text-secondary);
    font-style: italic;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .ano-card-time {
    font-size: 11px;
    color: var(--ano-text-secondary);
    margin-top: 4px;
  }
  .ano-icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: var(--ano-text-secondary);
    cursor: pointer;
    transition: all 0.15s;
    font-size: 16px;
  }
  .ano-icon-btn:hover {
    background: var(--ano-bg-hover);
    color: var(--ano-text);
  }
  .ano-icon-btn.danger:hover {
    background: #fef2f2;
    color: var(--ano-danger);
  }
  .ano-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 6px;
    border: 1px solid var(--ano-border);
    background: var(--ano-bg);
    color: var(--ano-text);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .ano-btn:hover {
    background: var(--ano-bg-hover);
  }
  .ano-btn.primary {
    background: var(--ano-accent);
    color: #fff;
    border-color: var(--ano-accent);
  }
  .ano-btn.primary:hover {
    background: var(--ano-accent-hover);
  }
  .ano-sidebar-footer {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    border-top: 1px solid var(--ano-border);
    background: var(--ano-bg-secondary);
  }
  .ano-tab-toggle {
    position: fixed;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 28px;
    height: 64px;
    background: var(--ano-accent);
    color: #fff;
    border: none;
    border-radius: 6px 0 0 6px;
    cursor: pointer;
    z-index: 2147483646;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    box-shadow: var(--ano-shadow-sm);
    transition: right 0.25s ease, background 0.15s;
  }
  .ano-tab-toggle:hover {
    background: var(--ano-accent-hover);
  }
  .ano-tab-toggle.shifted {
    right: var(--ano-sidebar-width, 320px);
  }
  .ano-btn:disabled {
    opacity: 0.5;
    cursor: default;
    pointer-events: none;
  }
  .ano-toast {
    position: absolute;
    bottom: 60px;
    left: 16px;
    right: 16px;
    padding: 10px 14px;
    border-radius: 8px;
    background: var(--ano-bg-secondary);
    border: 1px solid var(--ano-border);
    font-size: 13px;
    opacity: 0;
    transform: translateY(8px);
    transition: all 0.2s;
    pointer-events: none;
    z-index: 1;
  }
  .ano-toast.visible { opacity: 1; transform: translateY(0); pointer-events: auto; }
  .ano-toast.error { border-color: var(--ano-danger); }
  .ano-toast a { color: var(--ano-accent); word-break: break-all; }
`;

export const toolbarCSS = `
  :host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .ano-toolbar {
    position: fixed;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 2px;
    padding: 4px;
    background: var(--ano-bg);
    border: 1px solid var(--ano-border);
    border-radius: 10px;
    box-shadow: var(--ano-shadow);
    z-index: 2147483646;
    user-select: none;
  }
  .ano-toolbar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--ano-text-secondary);
    cursor: pointer;
    transition: all 0.15s;
    font-size: 18px;
    position: relative;
  }
  .ano-toolbar-btn:hover {
    background: var(--ano-bg-hover);
    color: var(--ano-text);
  }
  .ano-toolbar-btn.active {
    background: var(--ano-accent);
    color: #fff;
  }
  .ano-toolbar-btn .tooltip {
    position: absolute;
    bottom: -30px;
    left: 50%;
    transform: translateX(-50%);
    padding: 3px 8px;
    background: var(--ano-text);
    color: var(--ano-bg);
    font-size: 11px;
    border-radius: 4px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s;
  }
  .ano-toolbar-btn:hover .tooltip {
    opacity: 1;
  }
  .ano-toolbar-divider {
    width: 1px;
    margin: 6px 3px;
    background: var(--ano-border);
    flex-shrink: 0;
  }
  .ano-start-session {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 8px;
    border: none;
    background: var(--ano-accent);
    color: #fff;
    cursor: pointer;
    transition: all 0.15s;
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
    white-space: nowrap;
  }
  .ano-start-session:hover {
    background: var(--ano-accent-hover);
  }
  .ano-video-toggle {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 0 8px;
    font-size: 12px;
    color: var(--ano-text-secondary);
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
  }
  .ano-video-toggle input {
    margin: 0;
    cursor: pointer;
  }
  .ano-session-status {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  @keyframes ano-pulse-dot { 0%,100%{opacity:1} 50%{opacity:.3} }
  .ano-session-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    animation: ano-pulse-dot 1s ease-in-out infinite;
    flex-shrink: 0;
  }
  .ano-session-timer {
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--ano-text);
    min-width: 36px;
  }
  .ano-session-count {
    font-size: 12px;
    color: var(--ano-text-secondary);
    white-space: nowrap;
  }
  .ano-end-session {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border-radius: 8px;
    border: none;
    background: var(--ano-danger);
    color: #fff;
    cursor: pointer;
    transition: all 0.15s;
    font-size: 12px;
    font-weight: 600;
    font-family: inherit;
    white-space: nowrap;
  }
  .ano-end-session:hover {
    background: var(--ano-danger-hover);
  }
  .ano-btn-label {
    font-family: inherit;
  }
`;

export const popoverCSS = `
  :host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    color: var(--ano-text);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .ano-popover {
    position: fixed;
    width: 280px;
    background: var(--ano-bg);
    border: 1px solid var(--ano-border);
    border-radius: 10px;
    box-shadow: var(--ano-shadow);
    z-index: 2147483647;
    overflow: hidden;
  }
  .ano-popover-body {
    padding: 12px;
  }
  .ano-popover textarea {
    width: 100%;
    min-height: 60px;
    padding: 8px;
    border: 1px solid var(--ano-border);
    border-radius: 6px;
    background: var(--ano-bg-secondary);
    color: var(--ano-text);
    font-family: inherit;
    font-size: 13px;
    resize: vertical;
    outline: none;
    transition: border-color 0.15s;
  }
  .ano-popover textarea:focus {
    border-color: var(--ano-accent);
  }
  .ano-popover-actions {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
    padding: 8px 12px;
    border-top: 1px solid var(--ano-border);
    background: var(--ano-bg-secondary);
  }
  .ano-popover-btn {
    padding: 5px 12px;
    border-radius: 6px;
    border: 1px solid var(--ano-border);
    background: var(--ano-bg);
    color: var(--ano-text);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .ano-popover-btn:hover {
    background: var(--ano-bg-hover);
  }
  .ano-popover-btn.save {
    background: var(--ano-accent);
    color: #fff;
    border-color: var(--ano-accent);
  }
  .ano-popover-btn.save:hover {
    background: var(--ano-accent-hover);
  }
  .ano-popover-btn.delete {
    color: var(--ano-danger);
    border-color: var(--ano-danger);
  }
  .ano-popover-btn.delete:hover {
    background: var(--ano-danger);
    color: #fff;
  }
  .ano-popover-arrow {
    position: absolute;
    width: 12px;
    height: 12px;
    background: var(--ano-bg);
    border: 1px solid var(--ano-border);
    transform: rotate(45deg);
  }
  .ano-popover-arrow.top {
    bottom: -7px;
    border-top: none;
    border-left: none;
  }
  .ano-popover-arrow.bottom {
    top: -7px;
    border-bottom: none;
    border-right: none;
  }
`;

export const canvasCSS = `
  :host {
    all: initial;
  }
  .ano-canvas-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 2147483645;
    pointer-events: none;
  }
  .ano-canvas-overlay.active {
    pointer-events: auto;
    cursor: crosshair;
  }
`;

export const highlightCSS = `
  .ano-highlight {
    background-color: var(--ano-hl-color, #fde047);
    cursor: pointer;
    border-radius: 2px;
    transition: background-color 0.15s;
  }
  .ano-highlight:hover {
    filter: brightness(0.9);
  }
`;

export const pinCSS = `
  .ano-pin-marker {
    position: absolute;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--ano-pin-color, #3b82f6);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 2147483644;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    transition: transform 0.15s;
    pointer-events: auto;
    user-select: none;
  }
  .ano-pin-marker:hover {
    transform: scale(1.2);
  }
  .ano-highlight-marker, .ano-drawing-marker {
    position: absolute;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--ano-pin-color, #3b82f6);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 2147483644;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    transition: transform 0.15s;
    pointer-events: auto;
    user-select: none;
  }
  .ano-highlight-marker:hover, .ano-drawing-marker:hover {
    transform: scale(1.2);
  }
  .ano-pin-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 2147483643;
    pointer-events: none;
  }
  .ano-pin-overlay.active {
    pointer-events: auto;
    cursor: crosshair;
  }
  .ano-pin-hover-outline {
    position: absolute;
    border: 2px dashed #3b82f6;
    background: rgba(59, 130, 246, 0.08);
    border-radius: 3px;
    pointer-events: none;
    z-index: 2147483643;
    transition: all 0.1s;
  }
`;

export const endDialogCSS = `
  :host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    color: var(--ano-text);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .ano-end-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.4);
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ano-end-dialog {
    background: var(--ano-bg);
    border: 1px solid var(--ano-border);
    border-radius: 14px;
    box-shadow: var(--ano-shadow);
    width: 400px;
    max-width: 90vw;
    overflow: hidden;
  }
  .ano-end-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--ano-border);
  }
  .ano-end-header h2 {
    font-size: 16px;
    font-weight: 700;
    color: var(--ano-text);
  }
  .ano-end-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: var(--ano-text-secondary);
    cursor: pointer;
    transition: all 0.15s;
    font-size: 18px;
  }
  .ano-end-close:hover {
    background: var(--ano-bg-hover);
    color: var(--ano-text);
  }
  .ano-end-summary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 20px;
  }
  .ano-end-stat {
    padding: 12px;
    border-radius: 10px;
    background: var(--ano-bg-secondary);
    border: 1px solid var(--ano-border);
    text-align: center;
  }
  .ano-end-stat-value {
    font-size: 22px;
    font-weight: 700;
    color: var(--ano-text);
    font-variant-numeric: tabular-nums;
  }
  .ano-end-stat-label {
    font-size: 11px;
    color: var(--ano-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 2px;
  }
  .ano-end-badge {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px;
    border-radius: 8px;
    background: var(--ano-bg-secondary);
    border: 1px solid var(--ano-border);
    font-size: 12px;
    color: var(--ano-text-secondary);
  }
  .ano-end-actions {
    display: flex;
    gap: 8px;
    padding: 16px 20px;
    border-top: 1px solid var(--ano-border);
    justify-content: flex-end;
  }
  .ano-end-actions button {
    padding: 7px 16px;
    border-radius: 8px;
    border: 1px solid var(--ano-border);
    background: var(--ano-bg);
    color: var(--ano-text);
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s;
  }
  .ano-end-actions button:hover {
    background: var(--ano-bg-hover);
  }
  .ano-end-actions button.primary {
    background: var(--ano-accent);
    color: #fff;
    border-color: var(--ano-accent);
  }
  .ano-end-actions button.primary:hover {
    background: var(--ano-accent-hover);
  }
  .ano-end-actions button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .ano-end-link-result {
    display: flex;
    gap: 6px;
    padding: 0 20px 16px;
  }
  .ano-end-link-input {
    flex: 1;
    padding: 7px 10px;
    border-radius: 8px;
    border: 1px solid var(--ano-border);
    background: var(--ano-bg-secondary);
    color: var(--ano-text);
    font-size: 12px;
    font-family: monospace;
    outline: none;
  }
  .ano-end-link-copy {
    padding: 7px 14px;
    border-radius: 8px;
    border: 1px solid var(--ano-accent);
    background: var(--ano-accent);
    color: #fff;
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .ano-end-link-copy:hover {
    background: var(--ano-accent-hover);
  }
  .ano-end-annotations {
    padding: 0 20px 16px;
  }
  .ano-end-annotations h3 {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--ano-text-secondary);
    margin-bottom: 8px;
  }
  .ano-end-ann-list {
    max-height: 280px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ano-end-ann-card {
    padding: 8px 10px;
    border: 1px solid var(--ano-border);
    border-radius: 8px;
    background: var(--ano-bg-secondary);
  }
  .ano-end-ann-type {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 3px;
  }
  .ano-end-ann-type .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .ano-end-ann-type.highlight { color: #ca8a04; }
  .ano-end-ann-type.highlight .dot { background: var(--ano-highlight); }
  .ano-end-ann-type.pin { color: var(--ano-pin); }
  .ano-end-ann-type.pin .dot { background: var(--ano-pin); }
  .ano-end-ann-type.drawing { color: var(--ano-draw); }
  .ano-end-ann-type.drawing .dot { background: var(--ano-draw); }
  .ano-end-ann-text {
    font-size: 13px;
    color: var(--ano-text);
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .ano-end-ann-comment {
    font-size: 12px;
    color: var(--ano-text-secondary);
    font-style: italic;
    line-height: 1.4;
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
`;

export function injectHostStyles() {
  const id = 'ano-host-styles';
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = highlightCSS + pinCSS;
  document.head.appendChild(style);
}

export function removeHostStyles() {
  document.getElementById('ano-host-styles')?.remove();
}

export function applyTheme(host, theme) {
  const vars = THEME[theme] || THEME.light;
  for (const [key, value] of Object.entries(vars)) {
    host.style.setProperty(key, value);
  }
}
