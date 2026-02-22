import { resolveTextQuoteSelector } from './text-quote.js';
import { resolveTextPositionSelector } from './text-position.js';
import { resolveTarget } from './selector.js';

export function resolveHighlight(selectors) {
  if (!selectors) return null;

  // Try TextPosition first (fast, exact)
  if (selectors.textPosition) {
    const range = resolveTextPositionSelector(selectors.textPosition);
    if (range && validateRange(range, selectors.textQuote?.exact)) return range;
  }

  // Fall back to TextQuote (handles DOM changes)
  if (selectors.textQuote) {
    const range = resolveTextQuoteSelector(selectors.textQuote);
    if (range) return range;
  }

  return null;
}

export function resolvePin(annotation) {
  return resolveTarget(annotation.targetSelector, annotation.targetMeta);
}

function validateRange(range, expectedText) {
  if (!expectedText) return true;
  const actual = range.toString();
  return actual === expectedText;
}
