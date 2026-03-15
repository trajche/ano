// Returns true if el is part of Ano's own UI (shadow DOM or data-ano element)
export function isAnoElement(el) {
  if (!el) return false;
  if (el.closest && el.closest('[data-ano]')) return true;
  let node = el;
  while (node) {
    if (node.host && node.host.dataset && node.host.dataset.ano !== undefined) return true;
    if (node.dataset && node.dataset.ano !== undefined) return true;
    node = node.parentNode;
  }
  return false;
}

export function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '...' : str;
}
