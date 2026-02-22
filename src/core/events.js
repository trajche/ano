export function createEventBus() {
  const listeners = new Map();

  return {
    on(event, fn) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(fn);
      return () => listeners.get(event)?.delete(fn);
    },

    off(event, fn) {
      listeners.get(event)?.delete(fn);
    },

    emit(event, data) {
      listeners.get(event)?.forEach((fn) => fn(data));
    },

    clear() {
      listeners.clear();
    },
  };
}
