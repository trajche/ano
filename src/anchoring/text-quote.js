const CONTEXT_LENGTH = 32;

export function createTextQuoteSelector(range) {
  const exact = range.toString();
  if (!exact) return null;

  const body = document.body;
  const textContent = body.textContent || '';

  // Find position of exact match in full text
  const beforeRange = document.createRange();
  beforeRange.setStart(body, 0);
  beforeRange.setEnd(range.startContainer, range.startOffset);
  const beforeText = beforeRange.toString();

  const prefixStart = Math.max(0, beforeText.length - CONTEXT_LENGTH);
  const prefix = beforeText.slice(prefixStart);

  const afterRange = document.createRange();
  afterRange.setStart(range.endContainer, range.endOffset);
  afterRange.setEnd(body, body.childNodes.length);
  const afterText = afterRange.toString();
  const suffix = afterText.slice(0, CONTEXT_LENGTH);

  return {
    type: 'TextQuoteSelector',
    exact,
    prefix,
    suffix,
  };
}

export function resolveTextQuoteSelector(selector) {
  if (!selector || !selector.exact) return null;

  const body = document.body;
  const text = body.textContent || '';
  const { exact, prefix, suffix } = selector;

  // Try exact + prefix/suffix match first
  const candidates = [];
  let searchFrom = 0;
  while (true) {
    const idx = text.indexOf(exact, searchFrom);
    if (idx === -1) break;
    candidates.push(idx);
    searchFrom = idx + 1;
  }

  if (candidates.length === 0) return null;

  // Score candidates by context match
  let bestIdx = candidates[0];
  let bestScore = -1;

  for (const idx of candidates) {
    let score = 0;
    if (prefix) {
      const beforeSlice = text.slice(Math.max(0, idx - prefix.length), idx);
      if (beforeSlice === prefix) score += 2;
      else if (beforeSlice.endsWith(prefix.slice(-8))) score += 1;
    }
    if (suffix) {
      const afterSlice = text.slice(idx + exact.length, idx + exact.length + suffix.length);
      if (afterSlice === suffix) score += 2;
      else if (afterSlice.startsWith(suffix.slice(0, 8))) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestIdx = idx;
    }
  }

  return textPositionToRange(bestIdx, bestIdx + exact.length);
}

function textPositionToRange(start, end) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let pos = 0;
  let startNode = null, startOffset = 0;
  let endNode = null, endOffset = 0;

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const len = node.textContent.length;

    if (!startNode && pos + len > start) {
      startNode = node;
      startOffset = start - pos;
    }
    if (pos + len >= end) {
      endNode = node;
      endOffset = end - pos;
      break;
    }
    pos += len;
  }

  if (!startNode || !endNode) return null;

  try {
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    return range;
  } catch {
    return null;
  }
}
