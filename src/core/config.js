const DEFAULTS = {
  theme: 'light',
  mode: 'navigate',
  highlightColor: '#fde047',
  pinColor: '#3b82f6',
  drawColor: '#ef4444',
  drawWidth: 3,
  shortcuts: true,
  recordMaxDuration: 30000,
  recordFrameRate: 30,
  sessionMaxDuration: 300000,
  videoRecording: false,
};

export function createConfig(overrides = {}) {
  return { ...DEFAULTS, ...overrides };
}
