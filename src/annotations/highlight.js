import { createTextQuoteSelector } from '../anchoring/text-quote.js';
import { createTextPositionSelector } from '../anchoring/text-position.js';
import { resolveHighlight } from '../anchoring/resolver.js';
import { generateCSSSelector } from '../anchoring/selector.js';

export function createHighlightManager(ctx) {
  const { store, config } = ctx;
  let active = false;
  const markElements = new Map(); // annotationId → [mark elements]

  function enable() {
    if (active) return;
    active = true;
    document.addEventListener('mouseup', onMouseUp, true);
  }

  function disable() {
    active = false;
    document.removeEventListener('mouseup', onMouseUp, true);
  }

  function onMouseUp(e) {
    // Don't capture if clicking inside Ano UI
    if (isAnoElement(e.target)) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const text = range.toString().trim();
    if (!text) return;

    // Generate selectors before modifying DOM
    const selectors = {
      textQuote: createTextQuoteSelector(range),
      textPosition: createTextPositionSelector(range),
    };

    // Capture context before DOM modification
    const context = captureHighlightContext(range, text);

    // Wrap the range
    const marks = wrapRange(range);
    if (marks.length === 0) return;

    // Create annotation
    const annotation = store.add({
      type: 'highlight',
      text,
      comment: '',
      selectors,
      context,
      color: config.highlightColor,
    });

    // Store mark element references
    markElements.set(annotation.id, marks);
    marks.forEach((mark, i) => {
      mark.dataset.anoId = annotation.id;
      if (i === 0 && annotation.index != null) mark.dataset.anoIndex = annotation.index;
    });

    selection.removeAllRanges();

    // Show popover for comment
    ctx.events.emit('highlight:created', annotation);
  }

  function wrapRange(range) {
    const marks = [];

    // Get all text nodes in the range
    const textNodes = getTextNodesInRange(range);
    if (textNodes.length === 0) return marks;

    for (let i = 0; i < textNodes.length; i++) {
      const node = textNodes[i];
      let startOffset = 0;
      let endOffset = node.textContent.length;

      if (i === 0) startOffset = (node === range.startContainer) ? range.startOffset : 0;
      if (i === textNodes.length - 1) endOffset = (node === range.endContainer) ? range.endOffset : node.textContent.length;

      if (startOffset === endOffset) continue;

      // Split text node if needed
      let targetNode = node;
      if (startOffset > 0) {
        targetNode = node.splitText(startOffset);
        endOffset -= startOffset;
      }
      if (endOffset < targetNode.textContent.length) {
        targetNode.splitText(endOffset);
      }

      const mark = document.createElement('mark');
      mark.className = 'ano-highlight';
      targetNode.parentNode.insertBefore(mark, targetNode);
      mark.appendChild(targetNode);
      marks.push(mark);
    }

    return marks;
  }

  function getTextNodesInRange(range) {
    const nodes = [];
    const walker = document.createTreeWalker(
      range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? range.commonAncestorContainer.parentNode
        : range.commonAncestorContainer,
      NodeFilter.SHOW_TEXT,
    );

    let started = false;
    while (walker.nextNode()) {
      const node = walker.currentNode;

      if (node === range.startContainer || (range.startContainer.nodeType !== Node.TEXT_NODE && range.startContainer.contains(node))) {
        started = true;
      }

      if (started && !isAnoElement(node.parentNode)) {
        nodes.push(node);
      }

      if (node === range.endContainer || (range.endContainer.nodeType !== Node.TEXT_NODE && range.endContainer.contains(node))) {
        break;
      }
    }

    return nodes;
  }

  function applyHighlight(annotation) {
    if (markElements.has(annotation.id)) return true; // Already rendered

    const range = resolveHighlight(annotation.selectors);
    if (!range) return false;

    const marks = wrapRange(range);
    if (marks.length === 0) return false;

    markElements.set(annotation.id, marks);
    marks.forEach((mark, i) => {
      mark.dataset.anoId = annotation.id;
      if (i === 0 && annotation.index != null) mark.dataset.anoIndex = annotation.index;
      if (annotation.color) {
        mark.style.setProperty('--ano-hl-color', annotation.color);
      }
    });

    return true;
  }

  function removeHighlight(id) {
    const marks = markElements.get(id);
    if (!marks) return;

    for (const mark of marks) {
      const parent = mark.parentNode;
      if (!parent) continue;
      while (mark.firstChild) {
        parent.insertBefore(mark.firstChild, mark);
      }
      parent.removeChild(mark);
      parent.normalize();
    }

    markElements.delete(id);
  }

  function removeAll() {
    for (const id of [...markElements.keys()]) {
      removeHighlight(id);
    }
  }

  function getMarksForAnnotation(id) {
    return markElements.get(id) || [];
  }

  function captureHighlightContext(range, text) {
    // Find the nearest meaningful container element
    let container = range.commonAncestorContainer;
    if (container.nodeType === Node.TEXT_NODE) container = container.parentElement;

    // Walk up to find a semantically meaningful element (not just a span/div wrapper)
    const semantic = findSemanticParent(container);

    const containerInfo = {
      selector: generateCSSSelector(semantic),
      tagName: semantic.tagName,
      text: truncate(getDirectText(semantic), 200),
    };

    // Build ancestor path for page-structure context: e.g. ["main", "article", "section", "p"]
    const path = [];
    let walk = semantic;
    while (walk && walk !== document.body) {
      const tag = walk.tagName.toLowerCase();
      const id = walk.id ? `#${walk.id}` : '';
      const landmark = walk.getAttribute('role') || '';
      let label = tag + id;
      if (landmark) label += `[role=${landmark}]`;
      path.unshift(label);
      walk = walk.parentElement;
    }

    // Grab surrounding text for context window
    const fullText = semantic.textContent || '';
    const idx = fullText.indexOf(text);
    let surroundingText = '';
    if (idx !== -1) {
      const before = fullText.slice(Math.max(0, idx - 80), idx).trim();
      const after = fullText.slice(idx + text.length, idx + text.length + 80).trim();
      surroundingText = (before ? '...' + before + ' ' : '') +
        '[' + truncate(text, 100) + ']' +
        (after ? ' ' + after + '...' : '');
    }

    return {
      element: containerInfo,
      pagePath: path,
      surroundingText,
    };
  }

  function findSemanticParent(el) {
    const semanticTags = new Set([
      'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
      'LI', 'TD', 'TH', 'BLOCKQUOTE', 'FIGCAPTION', 'CAPTION',
      'LABEL', 'A', 'BUTTON', 'ARTICLE', 'SECTION', 'NAV',
      'HEADER', 'FOOTER', 'MAIN', 'ASIDE', 'DETAILS', 'SUMMARY',
    ]);
    let node = el;
    while (node && node !== document.body) {
      if (semanticTags.has(node.tagName) || node.id || node.getAttribute('role')) {
        return node;
      }
      node = node.parentElement;
    }
    return el; // fall back to original
  }

  function getDirectText(el) {
    // Get text without going too deep — avoids grabbing entire section text
    if (el.children.length === 0) return (el.textContent || '').trim();

    let text = '';
    for (const child of el.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        text += child.textContent;
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        // Include inline elements, skip block-level children
        const display = getComputedStyle(child).display;
        if (display === 'inline' || display === 'inline-block') {
          text += child.textContent;
        }
      }
    }
    return text.trim() || (el.textContent || '').trim().slice(0, 200);
  }

  function truncate(str, max) {
    return str.length > max ? str.slice(0, max) + '...' : str;
  }

  function destroy() {
    disable();
    removeAll();
  }

  return {
    enable,
    disable,
    applyHighlight,
    removeHighlight,
    removeAll,
    getMarksForAnnotation,
    destroy,
  };
}

function isAnoElement(el) {
  if (!el) return false;
  if (el.closest && el.closest('[data-ano]')) return true;
  // Check shadow DOM hosts
  let node = el;
  while (node) {
    if (node.host && node.host.dataset && node.host.dataset.ano !== undefined) return true;
    if (node.dataset && node.dataset.ano !== undefined) return true;
    node = node.parentNode;
  }
  return false;
}
