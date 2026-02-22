import { createEventBus } from './events.js';
import { nanoid } from './id.js';

export function createStore() {
  const annotations = new Map();
  const bus = createEventBus();
  let pinCounter = 0;

  function add(data) {
    const id = data.id || nanoid();
    const annotation = {
      ...data,
      id,
      createdAt: data.createdAt || Date.now(),
    };
    if (annotation.type === 'pin' && annotation.index == null) {
      pinCounter++;
      annotation.index = pinCounter;
    }
    annotations.set(id, annotation);
    bus.emit('add', annotation);
    bus.emit('change', { type: 'add', annotation });
    return annotation;
  }

  function update(id, changes) {
    const existing = annotations.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...changes, id };
    annotations.set(id, updated);
    bus.emit('update', updated);
    bus.emit('change', { type: 'update', annotation: updated });
    return updated;
  }

  function remove(id) {
    const annotation = annotations.get(id);
    if (!annotation) return false;
    annotations.delete(id);
    bus.emit('remove', annotation);
    bus.emit('change', { type: 'remove', annotation });
    return true;
  }

  function get(id) {
    return annotations.get(id) || null;
  }

  function getAll() {
    return Array.from(annotations.values());
  }

  function getByType(type) {
    return getAll().filter((a) => a.type === type);
  }

  function clear() {
    const all = getAll();
    annotations.clear();
    pinCounter = 0;
    bus.emit('clear', all);
    bus.emit('change', { type: 'clear', annotations: all });
  }

  function resetPinCounter() {
    const pins = getByType('pin');
    pinCounter = pins.length > 0 ? Math.max(...pins.map((p) => p.index)) : 0;
  }

  return {
    add,
    update,
    remove,
    get,
    getAll,
    getByType,
    clear,
    resetPinCounter,
    on: bus.on,
    off: bus.off,
    emit: bus.emit,
    destroy: bus.clear,
  };
}
