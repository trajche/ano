import { canvasCSS } from '../ui/styles.js';
import { generateCSSSelector } from '../anchoring/selector.js';

export function createDrawingManager(ctx) {
  const { store, config } = ctx;
  let host = null;
  let shadow = null;
  let canvas = null;
  let canvasCtx = null;
  let active = false;
  let isDrawing = false;
  let currentStroke = null;
  const drawnAnnotations = new Set();

  function init() {
    if (host) return;

    host = document.createElement('div');
    host.dataset.ano = '';
    shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = canvasCSS;
    shadow.appendChild(style);

    canvas = document.createElement('canvas');
    canvas.className = 'ano-canvas-overlay';
    shadow.appendChild(canvas);

    document.body.appendChild(host);

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', redrawAll);
  }

  function resizeCanvas() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    canvasCtx = canvas.getContext('2d');
    canvasCtx.scale(dpr, dpr);
    redrawAll();
  }

  function enable() {
    if (active) return;
    init();
    active = true;
    canvas.classList.add('active');
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerUp);
  }

  function disable() {
    active = false;
    if (canvas) {
      canvas.classList.remove('active');
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerUp);
    }
    if (isDrawing) {
      finishStroke();
    }
  }

  function onPointerDown(e) {
    if (e.button !== 0) return;
    isDrawing = true;
    canvas.setPointerCapture(e.pointerId);

    currentStroke = {
      points: [{ x: e.clientX, y: e.clientY }],
      color: config.drawColor,
      width: config.drawWidth,
    };

    canvasCtx.beginPath();
    canvasCtx.strokeStyle = currentStroke.color;
    canvasCtx.lineWidth = currentStroke.width;
    canvasCtx.lineCap = 'round';
    canvasCtx.lineJoin = 'round';
    canvasCtx.moveTo(e.clientX, e.clientY);
  }

  function onPointerMove(e) {
    if (!isDrawing || !currentStroke) return;

    currentStroke.points.push({ x: e.clientX, y: e.clientY });
    canvasCtx.lineTo(e.clientX, e.clientY);
    canvasCtx.stroke();
    canvasCtx.beginPath();
    canvasCtx.moveTo(e.clientX, e.clientY);
  }

  function onPointerUp() {
    if (!isDrawing) return;
    finishStroke();
  }

  function captureAnchor(stroke) {
    const points = stroke.points;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const prev = host.style.pointerEvents;
    host.style.pointerEvents = 'none';
    const el = document.elementFromPoint(centerX, centerY);
    host.style.pointerEvents = prev;

    if (!el || el === document.documentElement) return null;

    const rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return null;

    return {
      selector: generateCSSSelector(el),
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    };
  }

  function finishStroke() {
    isDrawing = false;
    if (!currentStroke || currentStroke.points.length < 2) {
      currentStroke = null;
      return;
    }

    const context = captureStrokeContext(currentStroke);
    const anchor = captureAnchor(currentStroke);

    let strokes;
    if (anchor) {
      const { rect } = anchor;
      const relPoints = currentStroke.points.map(pt => ({
        x: (pt.x - rect.x) / rect.width,
        y: (pt.y - rect.y) / rect.height,
      }));
      strokes = [{ ...currentStroke, points: relPoints }];
    } else {
      strokes = [currentStroke];
    }

    const annotation = store.add({
      type: 'drawing',
      comment: '',
      strokes,
      context,
      anchor,
      viewport: {
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        width: window.innerWidth,
        height: window.innerHeight,
      },
    });

    drawnAnnotations.add(annotation.id);
    currentStroke = null;
    ctx.events.emit('drawing:created', annotation);
  }

  function captureStrokeContext(stroke) {
    const points = stroke.points;

    // Compute bounding box (viewport coords)
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }

    const boundingBox = {
      x: Math.round(minX + window.scrollX),
      y: Math.round(minY + window.scrollY),
      width: Math.round(maxX - minX),
      height: Math.round(maxY - minY),
    };

    // Sample points along the stroke and hit-test for elements underneath
    // Temporarily hide our canvas overlay so elementFromPoint sees through it
    const prevPointerEvents = host.style.pointerEvents;
    host.style.pointerEvents = 'none';

    const seen = new Set();
    const elements = [];
    const sampleCount = Math.min(points.length, 20);
    const step = Math.max(1, Math.floor(points.length / sampleCount));

    for (let i = 0; i < points.length; i += step) {
      const p = points[i];
      const el = document.elementFromPoint(p.x, p.y);
      if (!el || el === document.body || el === document.documentElement) continue;
      if (el.dataset?.ano !== undefined) continue;

      const selector = generateCSSSelector(el);
      if (seen.has(selector)) continue;
      seen.add(selector);

      const text = getReadableText(el);
      elements.push({
        selector,
        tagName: el.tagName,
        text,
        role: el.getAttribute('role') || undefined,
        ariaLabel: el.getAttribute('aria-label') || undefined,
      });
    }

    host.style.pointerEvents = prevPointerEvents;

    // Build human/AI-readable description
    const parts = elements.map((e) => {
      const tag = e.tagName.toLowerCase();
      const label = e.text ? `${tag}("${truncate(e.text, 60)}")` : tag;
      return label;
    });
    const description = parts.length > 0
      ? `Drawing over: ${parts.join(', ')}`
      : 'Drawing on empty area';

    return { boundingBox, elements, description };
  }

  function getReadableText(el) {
    // Prefer aria-label, then alt, then direct text content
    const aria = el.getAttribute('aria-label');
    if (aria) return aria.trim();

    const alt = el.getAttribute('alt');
    if (alt) return alt.trim();

    // Get direct text, not deeply nested text
    // Walk immediate children to avoid grabbing too much
    let text = '';
    for (const child of el.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        text += child.textContent;
      }
    }
    text = text.trim();
    if (text) return text;

    // Fall back to full textContent for leaf-like elements
    const full = (el.textContent || '').trim();
    return full.slice(0, 120);
  }

  function truncate(str, max) {
    return str.length > max ? str.slice(0, max) + '...' : str;
  }

  function redrawAll() {
    if (!canvasCtx) return;
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    const drawings = store.getByType('drawing');
    for (const annotation of drawings) {
      drawAnnotation(annotation);
    }
  }

  function drawAnnotation(annotation) {
    if (!canvasCtx || !annotation.strokes) return;

    const { anchor, viewport } = annotation;

    // Try to resolve the anchor element for element-relative rendering
    let anchorRect = null;
    if (anchor) {
      try {
        const el = document.querySelector(anchor.selector);
        if (el) anchorRect = el.getBoundingClientRect();
      } catch { /* invalid selector */ }
    }

    for (const stroke of annotation.strokes) {
      if (stroke.points.length < 2) continue;

      canvasCtx.beginPath();
      canvasCtx.strokeStyle = stroke.color;
      canvasCtx.lineCap = 'round';
      canvasCtx.lineJoin = 'round';

      if (anchorRect) {
        // Anchored mode: points are fractions of the anchor element's rect
        const scaleW = anchorRect.width / anchor.rect.width;
        const scaleH = anchorRect.height / anchor.rect.height;
        canvasCtx.lineWidth = stroke.width * Math.min(scaleW, scaleH);

        const first = stroke.points[0];
        canvasCtx.moveTo(
          first.x * anchorRect.width + anchorRect.x,
          first.y * anchorRect.height + anchorRect.y
        );

        for (let i = 1; i < stroke.points.length; i++) {
          const pt = stroke.points[i];
          canvasCtx.lineTo(
            pt.x * anchorRect.width + anchorRect.x,
            pt.y * anchorRect.height + anchorRect.y
          );
        }
      } else {
        // Legacy fallback: scroll-delta compensation
        const scrollDx = viewport ? window.scrollX - viewport.scrollX : 0;
        const scrollDy = viewport ? window.scrollY - viewport.scrollY : 0;
        canvasCtx.lineWidth = stroke.width;

        const first = stroke.points[0];
        canvasCtx.moveTo(first.x - scrollDx, first.y - scrollDy);

        for (let i = 1; i < stroke.points.length; i++) {
          const pt = stroke.points[i];
          canvasCtx.lineTo(pt.x - scrollDx, pt.y - scrollDy);
        }
      }

      canvasCtx.stroke();
    }
  }

  function applyDrawing(annotation) {
    drawnAnnotations.add(annotation.id);
    redrawAll();
    return true;
  }

  function removeDrawing(id) {
    drawnAnnotations.delete(id);
    redrawAll();
  }

  function removeAll() {
    drawnAnnotations.clear();
    if (canvasCtx) {
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function destroy() {
    disable();
    removeAll();
    window.removeEventListener('resize', resizeCanvas);
    window.removeEventListener('scroll', redrawAll);
    if (host) {
      host.remove();
      host = null;
      shadow = null;
      canvas = null;
      canvasCtx = null;
    }
  }

  return {
    init,
    enable,
    disable,
    applyDrawing,
    removeDrawing,
    removeAll,
    redrawAll,
    destroy,
  };
}
