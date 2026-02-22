export function generateCSSSelector(element) {
  if (element.id) {
    const sel = `#${CSS.escape(element.id)}`;
    if (isUnique(sel)) return sel;
  }

  const path = [];
  let current = element;

  while (current && current !== document.body && current !== document.documentElement) {
    let seg = current.tagName.toLowerCase();

    if (current.id) {
      seg = `#${CSS.escape(current.id)}`;
      path.unshift(seg);
      break;
    }

    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (c) => c.tagName === current.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        seg += `:nth-of-type(${index})`;
      }
    }

    path.unshift(seg);
    current = parent;
  }

  if (path[0] && !path[0].startsWith('#')) {
    path.unshift('body');
  }

  const selector = path.join(' > ');

  if (isUnique(selector)) return selector;
  return selector;
}

export function getTargetMeta(element) {
  return {
    tagName: element.tagName,
    textContent: (element.textContent || '').trim().slice(0, 100),
    className: element.className || '',
  };
}

export function resolveTarget(selector, meta) {
  // Try CSS selector first
  try {
    const el = document.querySelector(selector);
    if (el) return el;
  } catch { /* invalid selector */ }

  // Fallback: find by tag + text content
  if (meta) {
    const candidates = document.querySelectorAll(meta.tagName?.toLowerCase() || '*');
    for (const el of candidates) {
      const text = (el.textContent || '').trim().slice(0, 100);
      if (text === meta.textContent) return el;
    }
  }

  return null;
}

function isUnique(selector) {
  try {
    return document.querySelectorAll(selector).length === 1;
  } catch {
    return false;
  }
}
