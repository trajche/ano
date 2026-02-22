export function createTextPositionSelector(range) {
  const body = document.body;
  const beforeRange = document.createRange();
  beforeRange.setStart(body, 0);
  beforeRange.setEnd(range.startContainer, range.startOffset);
  const start = beforeRange.toString().length;
  const end = start + range.toString().length;

  return {
    type: 'TextPositionSelector',
    start,
    end,
  };
}

export function resolveTextPositionSelector(selector) {
  if (!selector || selector.start == null || selector.end == null) return null;

  const { start, end } = selector;
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
