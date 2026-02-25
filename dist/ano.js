var Ano = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.js
  var src_exports = {};
  __export(src_exports, {
    clear: () => clear,
    destroy: () => destroy2,
    endSession: () => endSession,
    export: () => exportJSON2,
    getAll: () => getAll,
    import: () => importJSON,
    importFile: () => importFile,
    init: () => init2,
    setMode: () => setMode,
    startSession: () => startSession,
    toJSON: () => toJSON
  });

  // src/core/config.js
  var DEFAULTS = {
    theme: "light",
    mode: "navigate",
    highlightColor: "#fde047",
    pinColor: "#3b82f6",
    drawColor: "#ef4444",
    drawWidth: 3,
    shortcuts: true,
    recordMaxDuration: 3e4,
    recordFrameRate: 30,
    sessionMaxDuration: 3e5,
    videoRecording: false
  };
  function createConfig(overrides = {}) {
    return { ...DEFAULTS, ...overrides };
  }

  // src/core/events.js
  function createEventBus() {
    const listeners = /* @__PURE__ */ new Map();
    return {
      on(event, fn) {
        if (!listeners.has(event)) listeners.set(event, /* @__PURE__ */ new Set());
        listeners.get(event).add(fn);
        return () => listeners.get(event)?.delete(fn);
      },
      off(event, fn) {
        listeners.get(event)?.delete(fn);
      },
      emit(event, ...args) {
        listeners.get(event)?.forEach((fn) => fn(...args));
      },
      clear() {
        listeners.clear();
      }
    };
  }

  // src/core/id.js
  var ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
  var ID_LENGTH = 8;
  function nanoid() {
    let id = "";
    const bytes = crypto.getRandomValues(new Uint8Array(ID_LENGTH));
    for (let i = 0; i < ID_LENGTH; i++) {
      id += ALPHABET[bytes[i] % ALPHABET.length];
    }
    return id;
  }

  // src/core/store.js
  function createStore() {
    const annotations = /* @__PURE__ */ new Map();
    const bus = createEventBus();
    let annotationCounter = 0;
    const COUNTED_TYPES = /* @__PURE__ */ new Set(["highlight", "pin", "drawing"]);
    function add(data) {
      const id = data.id || nanoid();
      const annotation = {
        ...data,
        id,
        createdAt: data.createdAt || Date.now()
      };
      if (COUNTED_TYPES.has(annotation.type)) {
        if (annotation.index == null) {
          annotationCounter++;
          annotation.index = annotationCounter;
        } else if (annotation.index > annotationCounter) {
          annotationCounter = annotation.index;
        }
      }
      annotations.set(id, annotation);
      bus.emit("add", annotation);
      bus.emit("change", { type: "add", annotation });
      return annotation;
    }
    function update(id, changes) {
      const existing = annotations.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...changes, id };
      annotations.set(id, updated);
      bus.emit("update", updated);
      bus.emit("change", { type: "update", annotation: updated });
      return updated;
    }
    function remove(id) {
      const annotation = annotations.get(id);
      if (!annotation) return false;
      annotations.delete(id);
      bus.emit("remove", annotation);
      bus.emit("change", { type: "remove", annotation });
      return true;
    }
    function get(id) {
      return annotations.get(id) || null;
    }
    function getAll2() {
      return Array.from(annotations.values());
    }
    function getByType(type) {
      return getAll2().filter((a) => a.type === type);
    }
    function clear2() {
      const all = getAll2();
      annotations.clear();
      annotationCounter = 0;
      bus.emit("clear", all);
      bus.emit("change", { type: "clear", annotations: all });
    }
    function resetCounter() {
      const counted = getAll2().filter((a) => COUNTED_TYPES.has(a.type) && a.index != null);
      annotationCounter = counted.length > 0 ? Math.max(...counted.map((a) => a.index)) : 0;
    }
    return {
      add,
      update,
      remove,
      get,
      getAll: getAll2,
      getByType,
      clear: clear2,
      resetCounter,
      on: bus.on,
      off: bus.off,
      emit: bus.emit,
      destroy: bus.clear
    };
  }

  // src/anchoring/text-quote.js
  var CONTEXT_LENGTH = 32;
  function createTextQuoteSelector(range) {
    const exact = range.toString();
    if (!exact) return null;
    const body = document.body;
    const textContent = body.textContent || "";
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
      type: "TextQuoteSelector",
      exact,
      prefix,
      suffix
    };
  }
  function resolveTextQuoteSelector(selector) {
    if (!selector || !selector.exact) return null;
    const body = document.body;
    const text = body.textContent || "";
    const { exact, prefix, suffix } = selector;
    const candidates = [];
    let searchFrom = 0;
    while (true) {
      const idx = text.indexOf(exact, searchFrom);
      if (idx === -1) break;
      candidates.push(idx);
      searchFrom = idx + 1;
    }
    if (candidates.length === 0) return null;
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

  // src/anchoring/text-position.js
  function createTextPositionSelector(range) {
    const body = document.body;
    const beforeRange = document.createRange();
    beforeRange.setStart(body, 0);
    beforeRange.setEnd(range.startContainer, range.startOffset);
    const start = beforeRange.toString().length;
    const end = start + range.toString().length;
    return {
      type: "TextPositionSelector",
      start,
      end
    };
  }
  function resolveTextPositionSelector(selector) {
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

  // src/anchoring/selector.js
  function generateCSSSelector(element) {
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
    if (path[0] && !path[0].startsWith("#")) {
      path.unshift("body");
    }
    const selector = path.join(" > ");
    if (isUnique(selector)) return selector;
    return selector;
  }
  function getTargetMeta(element) {
    return {
      tagName: element.tagName,
      textContent: (element.textContent || "").trim().slice(0, 100),
      className: element.className || ""
    };
  }
  function resolveTarget(selector, meta) {
    try {
      const el2 = document.querySelector(selector);
      if (el2) return el2;
    } catch {
    }
    if (meta) {
      const candidates = document.querySelectorAll(meta.tagName?.toLowerCase() || "*");
      for (const el2 of candidates) {
        const text = (el2.textContent || "").trim().slice(0, 100);
        if (text === meta.textContent) return el2;
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

  // src/anchoring/resolver.js
  function resolveHighlight(selectors) {
    if (!selectors) return null;
    if (selectors.textPosition) {
      const range = resolveTextPositionSelector(selectors.textPosition);
      if (range && validateRange(range, selectors.textQuote?.exact)) return range;
    }
    if (selectors.textQuote) {
      const range = resolveTextQuoteSelector(selectors.textQuote);
      if (range) return range;
    }
    return null;
  }
  function validateRange(range, expectedText) {
    if (!expectedText) return true;
    const actual = range.toString();
    return actual === expectedText;
  }

  // src/annotations/highlight.js
  function createHighlightManager(ctx) {
    const { store, config } = ctx;
    let active = false;
    const markElements = /* @__PURE__ */ new Map();
    function enable() {
      if (active) return;
      active = true;
      document.addEventListener("mouseup", onMouseUp, true);
    }
    function disable() {
      active = false;
      document.removeEventListener("mouseup", onMouseUp, true);
    }
    function onMouseUp(e) {
      if (isAnoElement(e.target)) return;
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      const text = range.toString().trim();
      if (!text) return;
      const selectors = {
        textQuote: createTextQuoteSelector(range),
        textPosition: createTextPositionSelector(range)
      };
      const context = captureHighlightContext(range, text);
      const marks = wrapRange(range);
      if (marks.length === 0) return;
      const annotation = store.add({
        type: "highlight",
        text,
        comment: "",
        selectors,
        context,
        color: config.highlightColor
      });
      markElements.set(annotation.id, marks);
      marks.forEach((mark, i) => {
        mark.dataset.anoId = annotation.id;
        if (i === 0 && annotation.index != null) mark.dataset.anoIndex = annotation.index;
      });
      selection.removeAllRanges();
      ctx.events.emit("highlight:created", annotation);
    }
    function wrapRange(range) {
      const marks = [];
      const textNodes = getTextNodesInRange(range);
      if (textNodes.length === 0) return marks;
      for (let i = 0; i < textNodes.length; i++) {
        const node = textNodes[i];
        let startOffset = 0;
        let endOffset = node.textContent.length;
        if (i === 0) startOffset = node === range.startContainer ? range.startOffset : 0;
        if (i === textNodes.length - 1) endOffset = node === range.endContainer ? range.endOffset : node.textContent.length;
        if (startOffset === endOffset) continue;
        let targetNode = node;
        if (startOffset > 0) {
          targetNode = node.splitText(startOffset);
          endOffset -= startOffset;
        }
        if (endOffset < targetNode.textContent.length) {
          targetNode.splitText(endOffset);
        }
        const mark = document.createElement("mark");
        mark.className = "ano-highlight";
        targetNode.parentNode.insertBefore(mark, targetNode);
        mark.appendChild(targetNode);
        marks.push(mark);
      }
      return marks;
    }
    function getTextNodesInRange(range) {
      const nodes = [];
      const walker = document.createTreeWalker(
        range.commonAncestorContainer.nodeType === Node.TEXT_NODE ? range.commonAncestorContainer.parentNode : range.commonAncestorContainer,
        NodeFilter.SHOW_TEXT
      );
      let started = false;
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node === range.startContainer || range.startContainer.nodeType !== Node.TEXT_NODE && range.startContainer.contains(node)) {
          started = true;
        }
        if (started && !isAnoElement(node.parentNode)) {
          nodes.push(node);
        }
        if (node === range.endContainer || range.endContainer.nodeType !== Node.TEXT_NODE && range.endContainer.contains(node)) {
          break;
        }
      }
      return nodes;
    }
    function applyHighlight(annotation) {
      if (markElements.has(annotation.id)) return true;
      const range = resolveHighlight(annotation.selectors);
      if (!range) return false;
      const marks = wrapRange(range);
      if (marks.length === 0) return false;
      markElements.set(annotation.id, marks);
      marks.forEach((mark, i) => {
        mark.dataset.anoId = annotation.id;
        if (i === 0 && annotation.index != null) mark.dataset.anoIndex = annotation.index;
        if (annotation.color) {
          mark.style.setProperty("--ano-hl-color", annotation.color);
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
      let container = range.commonAncestorContainer;
      if (container.nodeType === Node.TEXT_NODE) container = container.parentElement;
      const semantic = findSemanticParent(container);
      const containerInfo = {
        selector: generateCSSSelector(semantic),
        tagName: semantic.tagName,
        text: truncate3(getDirectText(semantic), 200)
      };
      const path = [];
      let walk = semantic;
      while (walk && walk !== document.body) {
        const tag = walk.tagName.toLowerCase();
        const id = walk.id ? `#${walk.id}` : "";
        const landmark = walk.getAttribute("role") || "";
        let label = tag + id;
        if (landmark) label += `[role=${landmark}]`;
        path.unshift(label);
        walk = walk.parentElement;
      }
      const fullText = semantic.textContent || "";
      const idx = fullText.indexOf(text);
      let surroundingText = "";
      if (idx !== -1) {
        const before = fullText.slice(Math.max(0, idx - 80), idx).trim();
        const after = fullText.slice(idx + text.length, idx + text.length + 80).trim();
        surroundingText = (before ? "..." + before + " " : "") + "[" + truncate3(text, 100) + "]" + (after ? " " + after + "..." : "");
      }
      return {
        element: containerInfo,
        pagePath: path,
        surroundingText
      };
    }
    function findSemanticParent(el2) {
      const semanticTags = /* @__PURE__ */ new Set([
        "P",
        "H1",
        "H2",
        "H3",
        "H4",
        "H5",
        "H6",
        "LI",
        "TD",
        "TH",
        "BLOCKQUOTE",
        "FIGCAPTION",
        "CAPTION",
        "LABEL",
        "A",
        "BUTTON",
        "ARTICLE",
        "SECTION",
        "NAV",
        "HEADER",
        "FOOTER",
        "MAIN",
        "ASIDE",
        "DETAILS",
        "SUMMARY"
      ]);
      let node = el2;
      while (node && node !== document.body) {
        if (semanticTags.has(node.tagName) || node.id || node.getAttribute("role")) {
          return node;
        }
        node = node.parentElement;
      }
      return el2;
    }
    function getDirectText(el2) {
      if (el2.children.length === 0) return (el2.textContent || "").trim();
      let text = "";
      for (const child of el2.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          text += child.textContent;
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const display = getComputedStyle(child).display;
          if (display === "inline" || display === "inline-block") {
            text += child.textContent;
          }
        }
      }
      return text.trim() || (el2.textContent || "").trim().slice(0, 200);
    }
    function truncate3(str, max) {
      return str.length > max ? str.slice(0, max) + "..." : str;
    }
    function destroy3() {
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
      destroy: destroy3
    };
  }
  function isAnoElement(el2) {
    if (!el2) return false;
    if (el2.closest && el2.closest("[data-ano]")) return true;
    let node = el2;
    while (node) {
      if (node.host && node.host.dataset && node.host.dataset.ano !== void 0) return true;
      if (node.dataset && node.dataset.ano !== void 0) return true;
      node = node.parentNode;
    }
    return false;
  }

  // src/annotations/pin.js
  function createPinManager(ctx) {
    const { store, config } = ctx;
    let active = false;
    const pinElements = /* @__PURE__ */ new Map();
    let hoverOutline = null;
    let overlay = null;
    let lastHoveredIframe = null;
    function enable() {
      if (active) return;
      active = true;
      createOverlay();
      document.addEventListener("mousemove", onMouseMove, true);
    }
    function disable() {
      active = false;
      removeOverlay();
      document.removeEventListener("mousemove", onMouseMove, true);
    }
    function createOverlay() {
      overlay = document.createElement("div");
      overlay.className = "ano-pin-overlay active";
      overlay.dataset.ano = "";
      overlay.addEventListener("click", onOverlayClick, true);
      overlay.addEventListener("mousemove", onOverlayMouseMove);
      document.body.appendChild(overlay);
      hoverOutline = document.createElement("div");
      hoverOutline.className = "ano-pin-hover-outline";
      hoverOutline.dataset.ano = "";
      document.body.appendChild(hoverOutline);
    }
    function removeOverlay() {
      if (overlay) {
        overlay.removeEventListener("click", onOverlayClick, true);
        overlay.removeEventListener("mousemove", onOverlayMouseMove);
        overlay.remove();
        overlay = null;
      }
      if (hoverOutline) {
        hoverOutline.remove();
        hoverOutline = null;
      }
    }
    function onOverlayMouseMove(e) {
      overlay.style.pointerEvents = "none";
      const target = document.elementFromPoint(e.clientX, e.clientY);
      overlay.style.pointerEvents = "auto";
      if (target && target.tagName === "IFRAME") {
        const rect = target.getBoundingClientRect();
        try {
          target.contentWindow?.postMessage({
            source: "ano-parent",
            type: "pin:hover",
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          }, "*");
        } catch {
        }
        hoverOutline.style.display = "none";
        lastHoveredIframe = target;
        return;
      }
      if (lastHoveredIframe) {
        try {
          lastHoveredIframe.contentWindow?.postMessage({ source: "ano-parent", type: "pin:hover:clear" }, "*");
        } catch {
        }
        lastHoveredIframe = null;
      }
      if (target && target !== document.body && target !== document.documentElement && !isAnoElement2(target)) {
        const rect = target.getBoundingClientRect();
        hoverOutline.style.display = "block";
        hoverOutline.style.left = `${rect.left + window.scrollX}px`;
        hoverOutline.style.top = `${rect.top + window.scrollY}px`;
        hoverOutline.style.width = `${rect.width}px`;
        hoverOutline.style.height = `${rect.height}px`;
      } else {
        hoverOutline.style.display = "none";
      }
    }
    function onMouseMove() {
    }
    function onOverlayClick(e) {
      e.preventDefault();
      e.stopPropagation();
      overlay.style.pointerEvents = "none";
      const target = document.elementFromPoint(e.clientX, e.clientY);
      overlay.style.pointerEvents = "auto";
      if (target && target.tagName === "IFRAME") {
        const rect = target.getBoundingClientRect();
        try {
          target.contentWindow?.postMessage({
            source: "ano-parent",
            type: "pin:click",
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          }, "*");
        } catch {
        }
        ctx.setMode("navigate");
        return;
      }
      if (!target || target === document.body || target === document.documentElement || isAnoElement2(target)) {
        return;
      }
      const targetSelector = generateCSSSelector(target);
      const targetMeta = getTargetMeta(target);
      const context = capturePinContext(target);
      const annotation = store.add({
        type: "pin",
        comment: "",
        targetSelector,
        targetMeta,
        context
      });
      createPinMarker(annotation, target);
      ctx.events.emit("pin:created", annotation);
    }
    function createPinMarker(annotation, target) {
      const marker = document.createElement("div");
      marker.className = "ano-pin-marker";
      marker.dataset.ano = "";
      marker.dataset.anoId = annotation.id;
      marker.textContent = annotation.index;
      marker.style.setProperty("--ano-pin-color", config.pinColor);
      document.body.appendChild(marker);
      positionMarker(marker, target);
      pinElements.set(annotation.id, { marker, target });
      marker.addEventListener("click", (e) => {
        e.stopPropagation();
        ctx.events.emit("pin:click", annotation);
      });
    }
    function positionMarker(marker, target) {
      const rect = target.getBoundingClientRect();
      marker.style.left = `${rect.left + window.scrollX - 12}px`;
      marker.style.top = `${rect.top + window.scrollY - 12}px`;
    }
    function repositionAll() {
      for (const [id, { marker, target }] of pinElements) {
        if (document.body.contains(target)) {
          positionMarker(marker, target);
        }
      }
    }
    function applyPin(annotation) {
      if (pinElements.has(annotation.id)) return true;
      const target = resolveTarget(annotation.targetSelector, annotation.targetMeta);
      if (!target) return false;
      createPinMarker(annotation, target);
      return true;
    }
    function removePin(id) {
      const entry = pinElements.get(id);
      if (!entry) return;
      entry.marker.remove();
      pinElements.delete(id);
    }
    function removeAll() {
      for (const [id] of [...pinElements]) {
        removePin(id);
      }
    }
    function hoverAt(x, y) {
      if (!active || !hoverOutline) return;
      if (overlay) overlay.style.pointerEvents = "none";
      const target = document.elementFromPoint(x, y);
      if (overlay) overlay.style.pointerEvents = "auto";
      if (target && target !== document.body && target !== document.documentElement && !isAnoElement2(target)) {
        const rect = target.getBoundingClientRect();
        hoverOutline.style.display = "block";
        hoverOutline.style.left = `${rect.left + window.scrollX}px`;
        hoverOutline.style.top = `${rect.top + window.scrollY}px`;
        hoverOutline.style.width = `${rect.width}px`;
        hoverOutline.style.height = `${rect.height}px`;
      } else {
        hoverOutline.style.display = "none";
      }
    }
    function clickAt(x, y) {
      if (!active) return;
      if (overlay) overlay.style.pointerEvents = "none";
      const target = document.elementFromPoint(x, y);
      if (overlay) overlay.style.pointerEvents = "auto";
      if (!target || target === document.body || target === document.documentElement || isAnoElement2(target)) return;
      const targetSelector = generateCSSSelector(target);
      const targetMeta = getTargetMeta(target);
      const context = capturePinContext(target);
      const annotation = store.add({ type: "pin", comment: "", targetSelector, targetMeta, context });
      createPinMarker(annotation, target);
      ctx.events.emit("pin:created", annotation);
    }
    function clearHover() {
      if (hoverOutline) hoverOutline.style.display = "none";
    }
    function scrollToPin(id) {
      const entry = pinElements.get(id);
      if (!entry) return;
      entry.target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    function capturePinContext(target) {
      const tag = target.tagName.toLowerCase();
      const attrs = {};
      const useful = [
        "href",
        "src",
        "action",
        "type",
        "name",
        "placeholder",
        "value",
        "alt",
        "title",
        "role",
        "aria-label",
        "aria-describedby",
        "data-testid",
        "for",
        "method"
      ];
      for (const name of useful) {
        const val = target.getAttribute(name);
        if (val) attrs[name] = val.length > 120 ? val.slice(0, 120) + "..." : val;
      }
      const visibleText = getVisibleText(target);
      const path = [];
      let walk = target;
      while (walk && walk !== document.body) {
        let label = walk.tagName.toLowerCase();
        if (walk.id) label += `#${walk.id}`;
        else if (walk.className && typeof walk.className === "string") {
          const cls = walk.className.trim().split(/\s+/).slice(0, 2).join(".");
          if (cls) label += `.${cls}`;
        }
        if (walk.getAttribute("role")) label += `[role=${walk.getAttribute("role")}]`;
        path.unshift(label);
        walk = walk.parentElement;
      }
      const siblings = [];
      const parent = target.parentElement;
      if (parent) {
        for (const child of parent.children) {
          if (child === target) continue;
          const sib = child.tagName.toLowerCase();
          const sibText = truncate3((child.textContent || "").trim(), 60);
          if (sibText) siblings.push(`${sib}("${sibText}")`);
          if (siblings.length >= 4) break;
        }
      }
      let desc = `${tag}`;
      if (visibleText) desc += `("${truncate3(visibleText, 80)}")`;
      if (attrs.type) desc += `[type=${attrs.type}]`;
      if (attrs.href) desc += `[href=${truncate3(attrs.href, 60)}]`;
      if (attrs.role) desc += `[role=${attrs.role}]`;
      const parentTag = parent ? parent.tagName.toLowerCase() : "";
      if (parentTag) desc += ` inside ${parentTag}`;
      if (parent?.id) desc += `#${parent.id}`;
      return {
        description: desc,
        attributes: Object.keys(attrs).length > 0 ? attrs : void 0,
        visibleText: visibleText || void 0,
        pagePath: path,
        siblings: siblings.length > 0 ? siblings : void 0
      };
    }
    function getVisibleText(el2) {
      const aria = el2.getAttribute("aria-label");
      if (aria) return aria.trim();
      const alt = el2.getAttribute("alt");
      if (alt) return alt.trim();
      const title = el2.getAttribute("title");
      if (title) return title.trim();
      let text = "";
      for (const child of el2.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) text += child.textContent;
      }
      text = text.trim();
      if (text) return text;
      return (el2.textContent || "").trim().slice(0, 150);
    }
    function truncate3(str, max) {
      return str.length > max ? str.slice(0, max) + "..." : str;
    }
    function destroy3() {
      disable();
      removeAll();
    }
    return {
      enable,
      disable,
      applyPin,
      removePin,
      removeAll,
      repositionAll,
      scrollToPin,
      hoverAt,
      clickAt,
      clearHover,
      destroy: destroy3
    };
  }
  function isAnoElement2(el2) {
    if (!el2) return false;
    let node = el2;
    while (node) {
      if (node.dataset && node.dataset.ano !== void 0) return true;
      if (node.host && node.host.dataset && node.host.dataset.ano !== void 0) return true;
      node = node.parentNode;
    }
    return false;
  }

  // src/ui/styles.js
  var THEME = {
    light: {
      "--ano-bg": "#ffffff",
      "--ano-bg-secondary": "#f8fafc",
      "--ano-bg-hover": "#f1f5f9",
      "--ano-border": "#e2e8f0",
      "--ano-text": "#1e293b",
      "--ano-text-secondary": "#64748b",
      "--ano-accent": "#3b82f6",
      "--ano-accent-hover": "#2563eb",
      "--ano-highlight": "#fde047",
      "--ano-pin": "#3b82f6",
      "--ano-draw": "#ef4444",
      "--ano-danger": "#ef4444",
      "--ano-danger-hover": "#dc2626",
      "--ano-shadow": "0 4px 24px rgba(0,0,0,0.12)",
      "--ano-shadow-sm": "0 2px 8px rgba(0,0,0,0.08)"
    },
    dark: {
      "--ano-bg": "#1e293b",
      "--ano-bg-secondary": "#0f172a",
      "--ano-bg-hover": "#334155",
      "--ano-border": "#475569",
      "--ano-text": "#f1f5f9",
      "--ano-text-secondary": "#94a3b8",
      "--ano-accent": "#60a5fa",
      "--ano-accent-hover": "#3b82f6",
      "--ano-highlight": "#fbbf24",
      "--ano-pin": "#60a5fa",
      "--ano-draw": "#f87171",
      "--ano-danger": "#f87171",
      "--ano-danger-hover": "#ef4444",
      "--ano-shadow": "0 4px 24px rgba(0,0,0,0.4)",
      "--ano-shadow-sm": "0 2px 8px rgba(0,0,0,0.3)"
    }
  };
  var toolbarCSS = `
  :host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .ano-toolbar {
    position: fixed;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 2px;
    padding: 4px;
    background: var(--ano-bg);
    border: 1px solid var(--ano-border);
    border-radius: 10px;
    box-shadow: var(--ano-shadow);
    z-index: 2147483646;
    user-select: none;
  }
  .ano-toolbar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--ano-text-secondary);
    cursor: pointer;
    transition: all 0.15s;
    font-size: 18px;
    position: relative;
  }
  .ano-toolbar-btn:hover {
    background: var(--ano-bg-hover);
    color: var(--ano-text);
  }
  .ano-toolbar-btn.active {
    background: var(--ano-accent);
    color: #fff;
  }
  .ano-toolbar-btn .tooltip {
    position: absolute;
    bottom: -30px;
    left: 50%;
    transform: translateX(-50%);
    padding: 3px 8px;
    background: var(--ano-text);
    color: var(--ano-bg);
    font-size: 11px;
    border-radius: 4px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s;
  }
  .ano-toolbar-btn:hover .tooltip {
    opacity: 1;
  }
  .ano-toolbar-divider {
    width: 1px;
    margin: 6px 3px;
    background: var(--ano-border);
    flex-shrink: 0;
  }
  .ano-start-session {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 8px;
    border: none;
    background: var(--ano-accent);
    color: #fff;
    cursor: pointer;
    transition: all 0.15s;
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
    white-space: nowrap;
  }
  .ano-start-session:hover {
    background: var(--ano-accent-hover);
  }
  .ano-video-toggle {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 0 8px;
    font-size: 12px;
    color: var(--ano-text-secondary);
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
  }
  .ano-video-toggle input {
    margin: 0;
    cursor: pointer;
  }
  .ano-session-status {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  @keyframes ano-pulse-dot { 0%,100%{opacity:1} 50%{opacity:.3} }
  .ano-session-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    animation: ano-pulse-dot 1s ease-in-out infinite;
    flex-shrink: 0;
  }
  .ano-session-timer {
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--ano-text);
    min-width: 36px;
  }
  .ano-session-count {
    font-size: 12px;
    color: var(--ano-text-secondary);
    white-space: nowrap;
  }
  .ano-end-session {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border-radius: 8px;
    border: none;
    background: var(--ano-danger);
    color: #fff;
    cursor: pointer;
    transition: all 0.15s;
    font-size: 12px;
    font-weight: 600;
    font-family: inherit;
    white-space: nowrap;
  }
  .ano-end-session:hover {
    background: var(--ano-danger-hover);
  }
  .ano-btn-label {
    font-family: inherit;
  }
`;
  var popoverCSS = `
  :host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    color: var(--ano-text);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .ano-popover {
    position: fixed;
    width: 280px;
    background: var(--ano-bg);
    border: 1px solid var(--ano-border);
    border-radius: 10px;
    box-shadow: var(--ano-shadow);
    z-index: 2147483647;
    overflow: hidden;
  }
  .ano-popover-body {
    padding: 12px;
  }
  .ano-popover textarea {
    width: 100%;
    min-height: 60px;
    padding: 8px;
    border: 1px solid var(--ano-border);
    border-radius: 6px;
    background: var(--ano-bg-secondary);
    color: var(--ano-text);
    font-family: inherit;
    font-size: 13px;
    resize: vertical;
    outline: none;
    transition: border-color 0.15s;
  }
  .ano-popover textarea:focus {
    border-color: var(--ano-accent);
  }
  .ano-popover-actions {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
    padding: 8px 12px;
    border-top: 1px solid var(--ano-border);
    background: var(--ano-bg-secondary);
  }
  .ano-popover-btn {
    padding: 5px 12px;
    border-radius: 6px;
    border: 1px solid var(--ano-border);
    background: var(--ano-bg);
    color: var(--ano-text);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .ano-popover-btn:hover {
    background: var(--ano-bg-hover);
  }
  .ano-popover-btn.save {
    background: var(--ano-accent);
    color: #fff;
    border-color: var(--ano-accent);
  }
  .ano-popover-btn.save:hover {
    background: var(--ano-accent-hover);
  }
  .ano-popover-btn.delete {
    color: var(--ano-danger);
    border-color: var(--ano-danger);
  }
  .ano-popover-btn.delete:hover {
    background: var(--ano-danger);
    color: #fff;
  }
  .ano-popover-arrow {
    position: absolute;
    width: 12px;
    height: 12px;
    background: var(--ano-bg);
    border: 1px solid var(--ano-border);
    transform: rotate(45deg);
  }
  .ano-popover-arrow.top {
    bottom: -7px;
    border-top: none;
    border-left: none;
  }
  .ano-popover-arrow.bottom {
    top: -7px;
    border-bottom: none;
    border-right: none;
  }
`;
  var canvasCSS = `
  :host {
    all: initial;
  }
  .ano-canvas-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 2147483645;
    pointer-events: none;
  }
  .ano-canvas-overlay.active {
    pointer-events: auto;
    cursor: crosshair;
  }
`;
  var highlightCSS = `
  .ano-highlight {
    background-color: var(--ano-hl-color, #fde047);
    cursor: pointer;
    border-radius: 2px;
    transition: background-color 0.15s;
  }
  .ano-highlight:hover {
    filter: brightness(0.9);
  }
  .ano-highlight[data-ano-index]::before {
    content: attr(data-ano-index);
    display: inline-block;
    min-width: 14px;
    height: 14px;
    border-radius: 7px;
    background: rgba(0,0,0,0.6);
    color: #fff;
    font-size: 9px;
    font-weight: 700;
    padding: 0 3px;
    margin-right: 2px;
    text-align: center;
    line-height: 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-style: normal;
    box-sizing: border-box;
    vertical-align: middle;
  }
`;
  var pinCSS = `
  .ano-pin-marker {
    position: absolute;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--ano-pin-color, #3b82f6);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 2147483644;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    transition: transform 0.15s;
    pointer-events: auto;
    user-select: none;
  }
  .ano-pin-marker:hover {
    transform: scale(1.2);
  }
  .ano-pin-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 2147483643;
    pointer-events: none;
  }
  .ano-pin-overlay.active {
    pointer-events: auto;
    cursor: crosshair;
  }
  .ano-pin-hover-outline {
    position: absolute;
    border: 2px dashed #3b82f6;
    background: rgba(59, 130, 246, 0.08);
    border-radius: 3px;
    pointer-events: none;
    z-index: 2147483643;
    transition: all 0.1s;
  }
`;
  var endDialogCSS = `
  :host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    color: var(--ano-text);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .ano-end-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.4);
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ano-end-dialog {
    background: var(--ano-bg);
    border: 1px solid var(--ano-border);
    border-radius: 14px;
    box-shadow: var(--ano-shadow);
    width: 400px;
    max-width: 90vw;
    overflow: hidden;
  }
  .ano-end-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--ano-border);
  }
  .ano-end-header h2 {
    font-size: 16px;
    font-weight: 700;
    color: var(--ano-text);
  }
  .ano-end-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: var(--ano-text-secondary);
    cursor: pointer;
    transition: all 0.15s;
    font-size: 18px;
  }
  .ano-end-close:hover {
    background: var(--ano-bg-hover);
    color: var(--ano-text);
  }
  .ano-end-summary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 20px;
  }
  .ano-end-stat {
    padding: 12px;
    border-radius: 10px;
    background: var(--ano-bg-secondary);
    border: 1px solid var(--ano-border);
    text-align: center;
  }
  .ano-end-stat-value {
    font-size: 22px;
    font-weight: 700;
    color: var(--ano-text);
    font-variant-numeric: tabular-nums;
  }
  .ano-end-stat-label {
    font-size: 11px;
    color: var(--ano-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 2px;
  }
  .ano-end-badge {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px;
    border-radius: 8px;
    background: var(--ano-bg-secondary);
    border: 1px solid var(--ano-border);
    font-size: 12px;
    color: var(--ano-text-secondary);
  }
  .ano-end-actions {
    display: flex;
    gap: 8px;
    padding: 16px 20px;
    border-top: 1px solid var(--ano-border);
    justify-content: flex-end;
  }
  .ano-end-actions button {
    padding: 7px 16px;
    border-radius: 8px;
    border: 1px solid var(--ano-border);
    background: var(--ano-bg);
    color: var(--ano-text);
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s;
  }
  .ano-end-actions button:hover {
    background: var(--ano-bg-hover);
  }
  .ano-end-actions button.primary {
    background: var(--ano-accent);
    color: #fff;
    border-color: var(--ano-accent);
  }
  .ano-end-actions button.primary:hover {
    background: var(--ano-accent-hover);
  }
  .ano-end-actions button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .ano-end-link-result {
    display: flex;
    gap: 6px;
    padding: 0 20px 16px;
  }
  .ano-end-link-input {
    flex: 1;
    padding: 7px 10px;
    border-radius: 8px;
    border: 1px solid var(--ano-border);
    background: var(--ano-bg-secondary);
    color: var(--ano-text);
    font-size: 12px;
    font-family: monospace;
    outline: none;
  }
  .ano-end-link-copy {
    padding: 7px 14px;
    border-radius: 8px;
    border: 1px solid var(--ano-accent);
    background: var(--ano-accent);
    color: #fff;
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .ano-end-link-copy:hover {
    background: var(--ano-accent-hover);
  }
  .ano-end-annotations {
    padding: 0 20px 16px;
  }
  .ano-end-annotations h3 {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--ano-text-secondary);
    margin-bottom: 8px;
  }
  .ano-end-ann-list {
    max-height: 280px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ano-end-ann-card {
    padding: 8px 10px;
    border: 1px solid var(--ano-border);
    border-radius: 8px;
    background: var(--ano-bg-secondary);
  }
  .ano-end-ann-type {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 3px;
  }
  .ano-end-ann-type .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .ano-end-ann-type.highlight { color: #ca8a04; }
  .ano-end-ann-type.highlight .dot { background: var(--ano-highlight); }
  .ano-end-ann-type.pin { color: var(--ano-pin); }
  .ano-end-ann-type.pin .dot { background: var(--ano-pin); }
  .ano-end-ann-type.drawing { color: var(--ano-draw); }
  .ano-end-ann-type.drawing .dot { background: var(--ano-draw); }
  .ano-end-ann-text {
    font-size: 13px;
    color: var(--ano-text);
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .ano-end-ann-comment {
    font-size: 12px;
    color: var(--ano-text-secondary);
    font-style: italic;
    line-height: 1.4;
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
`;
  function injectHostStyles() {
    const id = "ano-host-styles";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = highlightCSS + pinCSS;
    document.head.appendChild(style);
  }
  function removeHostStyles() {
    document.getElementById("ano-host-styles")?.remove();
  }
  function applyTheme(host, theme) {
    const vars = THEME[theme] || THEME.light;
    for (const [key, value] of Object.entries(vars)) {
      host.style.setProperty(key, value);
    }
  }

  // src/annotations/drawing.js
  function createDrawingManager(ctx) {
    const { store, config } = ctx;
    let host = null;
    let shadow = null;
    let canvas = null;
    let canvasCtx = null;
    let active = false;
    let isDrawing = false;
    let currentStroke = null;
    const drawnAnnotations = /* @__PURE__ */ new Set();
    function init3() {
      if (host) return;
      host = document.createElement("div");
      host.dataset.ano = "";
      shadow = host.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = canvasCSS;
      shadow.appendChild(style);
      canvas = document.createElement("canvas");
      canvas.className = "ano-canvas-overlay";
      shadow.appendChild(canvas);
      document.body.appendChild(host);
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
      window.addEventListener("scroll", redrawAll);
    }
    function resizeCanvas() {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      canvasCtx = canvas.getContext("2d");
      canvasCtx.scale(dpr, dpr);
      redrawAll();
    }
    function enable() {
      if (active) return;
      init3();
      active = true;
      canvas.classList.add("active");
      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointermove", onPointerMove);
      canvas.addEventListener("pointerup", onPointerUp);
      canvas.addEventListener("pointerleave", onPointerUp);
    }
    function disable() {
      active = false;
      if (canvas) {
        canvas.classList.remove("active");
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("pointerleave", onPointerUp);
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
        width: config.drawWidth
      };
      canvasCtx.beginPath();
      canvasCtx.strokeStyle = currentStroke.color;
      canvasCtx.lineWidth = currentStroke.width;
      canvasCtx.lineCap = "round";
      canvasCtx.lineJoin = "round";
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
      const prev = host.style.display;
      host.style.display = "none";
      const el2 = document.elementFromPoint(centerX, centerY);
      host.style.display = prev;
      if (!el2 || el2 === document.documentElement) return null;
      const rect = el2.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return null;
      return {
        selector: generateCSSSelector(el2),
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
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
        const relPoints = currentStroke.points.map((pt) => ({
          x: (pt.x - rect.x) / rect.width,
          y: (pt.y - rect.y) / rect.height
        }));
        strokes = [{ ...currentStroke, points: relPoints }];
      } else {
        strokes = [currentStroke];
      }
      const annotation = store.add({
        type: "drawing",
        comment: "",
        strokes,
        context,
        anchor,
        viewport: {
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          width: window.innerWidth,
          height: window.innerHeight
        }
      });
      drawnAnnotations.add(annotation.id);
      const rawPoints = currentStroke ? currentStroke.points : [];
      currentStroke = null;
      ctx.events.emit("drawing:created", annotation, rawPoints);
    }
    function captureStrokeContext(stroke) {
      const points = stroke.points;
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
        height: Math.round(maxY - minY)
      };
      const prevDisplay = host.style.display;
      host.style.display = "none";
      const seen = /* @__PURE__ */ new Set();
      const elements = [];
      const sampleCount = Math.min(points.length, 20);
      const step = Math.max(1, Math.floor(points.length / sampleCount));
      for (let i = 0; i < points.length; i += step) {
        const p = points[i];
        const el2 = document.elementFromPoint(p.x, p.y);
        if (!el2 || el2 === document.body || el2 === document.documentElement) continue;
        if (el2.dataset?.ano !== void 0) continue;
        const selector = generateCSSSelector(el2);
        if (seen.has(selector)) continue;
        seen.add(selector);
        const text = getReadableText(el2);
        elements.push({
          selector,
          tagName: el2.tagName,
          text,
          role: el2.getAttribute("role") || void 0,
          ariaLabel: el2.getAttribute("aria-label") || void 0
        });
      }
      host.style.display = prevDisplay;
      const parts = elements.map((e) => {
        const tag = e.tagName.toLowerCase();
        const label = e.text ? `${tag}("${truncate3(e.text, 60)}")` : tag;
        return label;
      });
      const description = parts.length > 0 ? `Drawing over: ${parts.join(", ")}` : "Drawing on empty area";
      return { boundingBox, elements, description };
    }
    function getReadableText(el2) {
      const aria = el2.getAttribute("aria-label");
      if (aria) return aria.trim();
      const alt = el2.getAttribute("alt");
      if (alt) return alt.trim();
      let text = "";
      for (const child of el2.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          text += child.textContent;
        }
      }
      text = text.trim();
      if (text) return text;
      const full = (el2.textContent || "").trim();
      return full.slice(0, 120);
    }
    function truncate3(str, max) {
      return str.length > max ? str.slice(0, max) + "..." : str;
    }
    function redrawAll() {
      if (!canvasCtx) return;
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      const drawings = store.getByType("drawing");
      for (const annotation of drawings) {
        drawAnnotation(annotation);
      }
    }
    function drawAnnotation(annotation) {
      if (!canvasCtx || !annotation.strokes) return;
      const { anchor, viewport } = annotation;
      let anchorRect = null;
      if (anchor) {
        try {
          const el2 = document.querySelector(anchor.selector);
          if (el2) anchorRect = el2.getBoundingClientRect();
        } catch {
        }
      }
      let firstPtX = null;
      let firstPtY = null;
      for (const stroke of annotation.strokes) {
        if (stroke.points.length < 2) continue;
        canvasCtx.beginPath();
        canvasCtx.strokeStyle = stroke.color;
        canvasCtx.lineCap = "round";
        canvasCtx.lineJoin = "round";
        if (anchorRect) {
          const scaleW = anchorRect.width / anchor.rect.width;
          const scaleH = anchorRect.height / anchor.rect.height;
          canvasCtx.lineWidth = stroke.width * Math.min(scaleW, scaleH);
          const first = stroke.points[0];
          const fx = first.x * anchorRect.width + anchorRect.x;
          const fy = first.y * anchorRect.height + anchorRect.y;
          if (firstPtX === null) {
            firstPtX = fx;
            firstPtY = fy;
          }
          canvasCtx.moveTo(fx, fy);
          for (let i = 1; i < stroke.points.length; i++) {
            const pt = stroke.points[i];
            canvasCtx.lineTo(
              pt.x * anchorRect.width + anchorRect.x,
              pt.y * anchorRect.height + anchorRect.y
            );
          }
        } else {
          const scrollDx = viewport ? window.scrollX - viewport.scrollX : 0;
          const scrollDy = viewport ? window.scrollY - viewport.scrollY : 0;
          canvasCtx.lineWidth = stroke.width;
          const first = stroke.points[0];
          const fx = first.x - scrollDx;
          const fy = first.y - scrollDy;
          if (firstPtX === null) {
            firstPtX = fx;
            firstPtY = fy;
          }
          canvasCtx.moveTo(fx, fy);
          for (let i = 1; i < stroke.points.length; i++) {
            const pt = stroke.points[i];
            canvasCtx.lineTo(pt.x - scrollDx, pt.y - scrollDy);
          }
        }
        canvasCtx.stroke();
      }
      if (annotation.index != null && firstPtX !== null) {
        const r = 9;
        canvasCtx.save();
        canvasCtx.beginPath();
        canvasCtx.arc(firstPtX, firstPtY, r, 0, Math.PI * 2);
        canvasCtx.fillStyle = "rgba(0,0,0,0.6)";
        canvasCtx.fill();
        canvasCtx.fillStyle = "#fff";
        canvasCtx.font = "bold 10px -apple-system, BlinkMacSystemFont, sans-serif";
        canvasCtx.textAlign = "center";
        canvasCtx.textBaseline = "middle";
        canvasCtx.fillText(String(annotation.index), firstPtX, firstPtY);
        canvasCtx.restore();
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
    function hitTest(x, y) {
      const drawings = store.getByType("drawing");
      for (let i = drawings.length - 1; i >= 0; i--) {
        const ann = drawings[i];
        const box = getViewportBox(ann);
        if (!box) continue;
        const pad2 = 10;
        if (x >= box.x - pad2 && x <= box.x + box.width + pad2 && y >= box.y - pad2 && y <= box.y + box.height + pad2) {
          return ann;
        }
      }
      return null;
    }
    function getViewportBox(annotation) {
      const { anchor, viewport, strokes } = annotation;
      if (!strokes || strokes.length === 0) return null;
      let anchorRect = null;
      if (anchor) {
        try {
          const el2 = document.querySelector(anchor.selector);
          if (el2) anchorRect = el2.getBoundingClientRect();
        } catch {
        }
      }
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const stroke of strokes) {
        for (const pt of stroke.points) {
          let vx, vy;
          if (anchorRect) {
            vx = pt.x * anchorRect.width + anchorRect.x;
            vy = pt.y * anchorRect.height + anchorRect.y;
          } else {
            const scrollDx = viewport ? window.scrollX - viewport.scrollX : 0;
            const scrollDy = viewport ? window.scrollY - viewport.scrollY : 0;
            vx = pt.x - scrollDx;
            vy = pt.y - scrollDy;
          }
          if (vx < minX) minX = vx;
          if (vy < minY) minY = vy;
          if (vx > maxX) maxX = vx;
          if (vy > maxY) maxY = vy;
        }
      }
      if (!isFinite(minX)) return null;
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    function destroy3() {
      disable();
      removeAll();
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("scroll", redrawAll);
      if (host) {
        host.remove();
        host = null;
        shadow = null;
        canvas = null;
        canvasCtx = null;
      }
    }
    return {
      init: init3,
      enable,
      disable,
      applyDrawing,
      removeDrawing,
      removeAll,
      redrawAll,
      hitTest,
      destroy: destroy3
    };
  }

  // src/annotations/recording.js
  var canRecord = !!navigator.mediaDevices?.getDisplayMedia && !!window.MediaRecorder && typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported("video/webm") && !!window.BroadcastChannel;
  var RECORDER_HTML = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Ano Recording</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;background:#1e293b;color:#f1f5f9;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:12px}
.wrap{display:flex;align-items:center;gap:10px}
.dot{width:10px;height:10px;border-radius:50%;background:#ef4444;animation:p 1s ease-in-out infinite;flex-shrink:0}
@keyframes p{0%,100%{opacity:1}50%{opacity:.3}}
.timer{font-weight:600;font-variant-numeric:tabular-nums;font-size:15px;min-width:44px}
button{padding:5px 14px;border-radius:6px;border:1px solid rgba(255,255,255,.25);background:transparent;color:#fff;cursor:pointer;font-size:13px;transition:background .15s}
button:hover{background:rgba(255,255,255,.12)}
#start{background:#ef4444;border-color:#ef4444;font-weight:600;padding:8px 20px;font-size:14px}
#start:hover{background:#dc2626}
.msg{color:#94a3b8;font-size:12px;text-align:center}
</style></head><body>
<div id="app"><button id="start">Share Tab &amp; Record</button></div>
<script>
var ch=new BroadcastChannel('ano-recording');
var rec,chunks=[],startTime=0,stream,timerIv;
ch.onmessage=function(e){
if(e.data.type==='stop')doStop();
if(e.data.type==='ping'&&rec&&rec.state==='recording')ch.postMessage({type:'pong',startTime:startTime});
};
document.getElementById('start').onclick=function(){startCapture()};
function startCapture(){
navigator.mediaDevices.getDisplayMedia({video:{frameRate:30}}).then(function(s){
stream=s;
var mime='video/webm';
if(typeof MediaRecorder.isTypeSupported==='function'&&MediaRecorder.isTypeSupported('video/webm;codecs=vp9'))mime='video/webm;codecs=vp9';
rec=new MediaRecorder(stream,{mimeType:mime});
chunks=[];
rec.ondataavailable=function(e){if(e.data.size>0)chunks.push(e.data)};
rec.onstop=onStop;
rec.start(500);
startTime=Date.now();
stream.getVideoTracks()[0].onended=function(){doStop()};
document.getElementById('app').innerHTML='<div class="wrap"><span class="dot"></span><span class="timer" id="t">0:00</span><button id="stopbtn">Stop</button></div>';
document.getElementById('stopbtn').onclick=function(){doStop()};
timerIv=setInterval(function(){
var sec=Math.floor((Date.now()-startTime)/1000);
var el=document.getElementById('t');
if(el)el.textContent=Math.floor(sec/60)+':'+(sec%60).toString().padStart(2,'0');
},250);
ch.postMessage({type:'started',startTime:startTime});
}).catch(function(){
ch.postMessage({type:'cancelled'});
try{window.close()}catch(e){}
});
}
function doStop(){if(!rec||rec.state==='inactive')return;rec.stop()}
function onStop(){
clearInterval(timerIv);
if(stream)stream.getTracks().forEach(function(t){t.stop()});
var blob=new Blob(chunks,{type:'video/webm'});
var duration=Date.now()-startTime;
ch.postMessage({type:'stopped',duration:duration,blob:blob});
document.getElementById('app').innerHTML='<div class="msg">Recording saved. Closing\\u2026</div>';
setTimeout(function(){try{window.close()}catch(e){}},2000);
}
window.onbeforeunload=function(){if(rec&&rec.state==='recording')doStop()};
<\/script></body></html>`;
  function createRecordingManager(ctx) {
    const channel = new BroadcastChannel("ano-recording");
    let active = false;
    let popupWindow = null;
    let startTime = 0;
    let storedBlob = null;
    let storedBlobUrl = null;
    let storedDuration = 0;
    channel.onmessage = (e) => {
      const { data } = e;
      if (data.type === "started") {
        active = true;
        startTime = data.startTime;
        ctx.events.emit("recording:started");
      } else if (data.type === "stopped") {
        onRecordingStopped(data);
      } else if (data.type === "pong") {
        if (!active) {
          active = true;
          startTime = data.startTime;
        }
      } else if (data.type === "cancelled") {
        ctx.events.emit("recording:cancelled");
      }
    };
    function startRecording() {
      if (active) return;
      openPopup();
    }
    function stopRecording() {
      channel.postMessage({ type: "stop" });
    }
    function isRecording() {
      return active;
    }
    function openPopup() {
      popupWindow = window.open(
        "",
        "ano-recorder",
        "width=460,height=600,top=60,left=60"
      );
      if (!popupWindow) {
        console.warn("[Ano] Popup blocked \u2014 allow popups for screen recording.");
        ctx.events.emit("recording:cancelled");
        return;
      }
      popupWindow.document.open();
      popupWindow.document.write(RECORDER_HTML);
      popupWindow.document.close();
    }
    function onRecordingStopped(data) {
      active = false;
      if (data.blob) {
        storedBlob = data.blob;
        storedBlobUrl = URL.createObjectURL(data.blob);
        storedDuration = data.duration || 0;
      }
      ctx.events.emit("recording:stopped", {
        blob: storedBlob,
        blobUrl: storedBlobUrl,
        duration: storedDuration
      });
      popupWindow = null;
    }
    function getBlob() {
      return storedBlob;
    }
    function getBlobUrl() {
      return storedBlobUrl;
    }
    function clearBlob() {
      if (storedBlobUrl) {
        URL.revokeObjectURL(storedBlobUrl);
      }
      storedBlob = null;
      storedBlobUrl = null;
      storedDuration = 0;
    }
    function removeRecording(id) {
      const ann = ctx.store.get(id);
      if (ann && ann.blobUrl) URL.revokeObjectURL(ann.blobUrl);
    }
    function destroy3() {
      if (active) stopRecording();
      clearBlob();
      try {
        channel.close();
      } catch {
      }
      const recordings = ctx.store.getByType("recording");
      for (const r of recordings) {
        if (r.blobUrl) URL.revokeObjectURL(r.blobUrl);
      }
    }
    setTimeout(() => channel.postMessage({ type: "ping" }), 100);
    return {
      startRecording,
      stopRecording,
      isRecording,
      getBlob,
      getBlobUrl,
      clearBlob,
      removeRecording,
      destroy: destroy3
    };
  }

  // src/annotations/session.js
  var STORAGE_KEY = "ano-session";
  var SENSITIVE_PATTERNS = /password|cc-|cvv|ssn|secret|token/i;
  var idCounter = 0;
  function nanoid2() {
    return "ses_" + Date.now().toString(36) + (idCounter++).toString(36) + Math.random().toString(36).slice(2, 6);
  }
  function createSessionManager(ctx) {
    let active = false;
    let sessionId = null;
    let startTime = 0;
    let actions = [];
    let pages = [];
    let persistTimer = null;
    let inputTimers = /* @__PURE__ */ new WeakMap();
    let lastScrollY = 0;
    let scrollTimer = null;
    const originalConsole = {};
    const CONSOLE_METHODS = ["log", "warn", "error", "info"];
    function describeElement(el2) {
      if (!el2) return "unknown";
      const tag = el2.tagName.toLowerCase();
      if (tag === "button" || tag === "input" && el2.type === "submit") {
        const text2 = el2.textContent?.trim() || el2.value || "";
        return text2 ? `button("${truncate(text2, 40)}")` : "button";
      }
      if (tag === "a") {
        const text2 = el2.textContent?.trim() || "";
        return text2 ? `link("${truncate(text2, 40)}")` : `link(${el2.href || ""})`;
      }
      if (tag === "input") {
        const name = el2.name || el2.id || el2.type;
        return `input[name="${name}"]`;
      }
      if (tag === "textarea") {
        const name = el2.name || el2.id || "textarea";
        return `textarea[name="${name}"]`;
      }
      if (tag === "select") {
        const name = el2.name || el2.id || "select";
        return `select${name !== "select" ? `[name="${name}"]` : ""}`;
      }
      if (tag === "label") {
        const text2 = el2.textContent?.trim() || "";
        return text2 ? `label("${truncate(text2, 40)}")` : "label";
      }
      if (tag === "img") {
        return `img(${el2.alt || el2.src?.split("/").pop() || ""})`;
      }
      const text = el2.textContent?.trim();
      if (text && text.length < 60 && el2.children.length === 0) {
        return `${tag}("${truncate(text, 40)}")`;
      }
      if (el2.id) return `${tag}#${el2.id}`;
      if (el2.className && typeof el2.className === "string") {
        const cls = el2.className.split(/\s+/).filter(Boolean).slice(0, 2).join(".");
        if (cls) return `${tag}.${cls}`;
      }
      return tag;
    }
    function isSensitive(el2) {
      if (el2.type === "password") return true;
      const ac = el2.autocomplete || "";
      return SENSITIVE_PATTERNS.test(ac);
    }
    function isAnoElement3(el2) {
      if (!el2) return false;
      if (el2.closest?.("[data-ano]")) return true;
      let node = el2;
      while (node) {
        if (node.host && node.host.dataset && node.host.dataset.ano !== void 0) return true;
        node = node.parentNode;
      }
      return false;
    }
    function recordAction(action, target, selector, value, url) {
      const entry = {
        time: Date.now() - startTime,
        action,
        target: target || null,
        selector: selector || null,
        value: value ?? null,
        url: url || window.location.href
      };
      actions.push(entry);
      debouncedPersist();
      ctx.events.emit("session:action", actions.length);
    }
    function onSessionClick(e) {
      if (isAnoElement3(e.target)) return;
      const el2 = e.target;
      let selector = null;
      try {
        selector = generateCSSSelector(el2);
      } catch {
      }
      recordAction("click", describeElement(el2), selector, null);
    }
    function onSessionInput(e) {
      if (isAnoElement3(e.target)) return;
      const el2 = e.target;
      const prev = inputTimers.get(el2);
      if (prev) clearTimeout(prev);
      const timer = setTimeout(() => {
        inputTimers.delete(el2);
        const value = isSensitive(el2) ? "[redacted]" : el2.value;
        let selector = null;
        try {
          selector = generateCSSSelector(el2);
        } catch {
        }
        recordAction("type", describeElement(el2), selector, value);
      }, 500);
      inputTimers.set(el2, timer);
    }
    function onSessionChange(e) {
      if (isAnoElement3(e.target)) return;
      const el2 = e.target;
      const tag = el2.tagName.toLowerCase();
      const type = el2.type?.toLowerCase();
      if (tag === "select") {
        const value = el2.options?.[el2.selectedIndex]?.text || el2.value;
        let selector = null;
        try {
          selector = generateCSSSelector(el2);
        } catch {
        }
        recordAction("select", describeElement(el2), selector, value);
      } else if (type === "checkbox" || type === "radio") {
        const value = el2.checked ? "checked" : "unchecked";
        let selector = null;
        try {
          selector = generateCSSSelector(el2);
        } catch {
        }
        recordAction("check", describeElement(el2), selector, value);
      }
    }
    function onSessionScroll() {
      if (scrollTimer) return;
      scrollTimer = setTimeout(() => {
        scrollTimer = null;
        const currentY = window.scrollY;
        if (Math.abs(currentY - lastScrollY) < 100) return;
        lastScrollY = currentY;
        recordAction("scroll", null, null, `y=${Math.round(currentY)}`);
      }, 300);
    }
    function onSessionSubmit(e) {
      if (isAnoElement3(e.target)) return;
      const form = e.target;
      let selector = null;
      try {
        selector = generateCSSSelector(form);
      } catch {
      }
      recordAction("submit", describeElement(form), selector, null);
    }
    function onSessionError(e) {
      const msg = e.message || "Unknown error";
      const src = e.filename ? ` at ${e.filename}:${e.lineno}:${e.colno}` : "";
      recordAction("error", null, null, `${msg}${src}`);
    }
    function onSessionUnhandledRejection(e) {
      const reason = e.reason;
      let msg;
      if (reason instanceof Error) {
        msg = `${reason.name}: ${reason.message}`;
      } else {
        try {
          msg = JSON.stringify(reason);
        } catch {
          msg = String(reason);
        }
      }
      recordAction("error", "unhandledrejection", null, truncate(msg, 300));
    }
    function onSessionBeforeUnload() {
      flushInputTimers();
      persistToStorage();
    }
    function flushInputTimers() {
      if (persistTimer) {
        clearTimeout(persistTimer);
        persistTimer = null;
      }
    }
    function patchConsole() {
      for (const method of CONSOLE_METHODS) {
        originalConsole[method] = console[method];
        console[method] = (...args) => {
          originalConsole[method].apply(console, args);
          if (typeof args[0] === "string" && args[0].startsWith("[Ano]")) return;
          const value = serializeConsoleArgs(args);
          recordAction(`console.${method}`, null, null, value);
        };
      }
    }
    function restoreConsole() {
      for (const method of CONSOLE_METHODS) {
        if (originalConsole[method]) {
          console[method] = originalConsole[method];
          delete originalConsole[method];
        }
      }
    }
    function serializeConsoleArgs(args) {
      const parts = args.map((arg) => {
        if (arg === null) return "null";
        if (arg === void 0) return "undefined";
        if (typeof arg === "string") return arg;
        if (typeof arg === "number" || typeof arg === "boolean") return String(arg);
        if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
        try {
          const json = JSON.stringify(arg);
          return json.length > 200 ? json.slice(0, 200) + "..." : json;
        } catch {
          return String(arg);
        }
      });
      return truncate(parts.join(" "), 500);
    }
    function persistToStorage() {
      if (!active) return;
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          active: true,
          sessionId,
          startTime,
          actions,
          pages
        }));
      } catch {
      }
    }
    function debouncedPersist() {
      if (persistTimer) clearTimeout(persistTimer);
      persistTimer = setTimeout(persistToStorage, 200);
    }
    function clearStorage() {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
      }
    }
    function attachListeners() {
      document.addEventListener("click", onSessionClick, true);
      document.addEventListener("input", onSessionInput, true);
      document.addEventListener("change", onSessionChange, true);
      document.addEventListener("scroll", onSessionScroll, { capture: true, passive: true });
      document.addEventListener("submit", onSessionSubmit, true);
      window.addEventListener("beforeunload", onSessionBeforeUnload);
      window.addEventListener("error", onSessionError);
      window.addEventListener("unhandledrejection", onSessionUnhandledRejection);
    }
    function detachListeners() {
      document.removeEventListener("click", onSessionClick, true);
      document.removeEventListener("input", onSessionInput, true);
      document.removeEventListener("change", onSessionChange, true);
      document.removeEventListener("scroll", onSessionScroll, { capture: true });
      document.removeEventListener("submit", onSessionSubmit, true);
      window.removeEventListener("beforeunload", onSessionBeforeUnload);
      window.removeEventListener("error", onSessionError);
      window.removeEventListener("unhandledrejection", onSessionUnhandledRejection);
    }
    function start() {
      active = true;
      sessionId = nanoid2();
      startTime = Date.now();
      actions = [];
      pages = [window.location.href];
      lastScrollY = window.scrollY;
      persistToStorage();
      attachListeners();
      patchConsole();
      return sessionId;
    }
    function resume(saved) {
      active = true;
      sessionId = saved.sessionId;
      startTime = saved.startTime;
      actions = saved.actions || [];
      pages = saved.pages || [];
      lastScrollY = window.scrollY;
      const currentUrl = window.location.href;
      if (!pages.includes(currentUrl)) {
        pages.push(currentUrl);
      }
      recordAction("navigate", document.title, null, currentUrl, currentUrl);
      attachListeners();
      patchConsole();
    }
    function stop() {
      if (!active) return null;
      active = false;
      flushInputTimers();
      detachListeners();
      restoreConsole();
      clearStorage();
      if (scrollTimer) {
        clearTimeout(scrollTimer);
        scrollTimer = null;
      }
      const duration = Date.now() - startTime;
      const description = buildDescription(duration, actions, pages);
      const data = {
        sessionId,
        duration,
        actions: actions.slice(),
        pages: pages.slice(),
        description
      };
      const stoppedId = sessionId;
      actions = [];
      pages = [];
      startTime = 0;
      sessionId = null;
      return data;
    }
    function buildDescription(duration, actionList, pageList) {
      const secs = Math.round(duration / 1e3);
      const lines = [`Session (${secs}s, ${actionList.length} actions, ${pageList.length} pages):`];
      for (let i = 0; i < actionList.length; i++) {
        const a = actionList[i];
        const t = (a.time / 1e3).toFixed(1);
        let line;
        switch (a.action) {
          case "click":
            line = `Clicked ${a.target}`;
            break;
          case "type":
            line = `Typed "${truncate(a.value || "", 40)}" in ${a.target}`;
            break;
          case "select":
            line = `Selected "${a.value}" in ${a.target}`;
            break;
          case "check":
            line = `${a.value === "checked" ? "Checked" : "Unchecked"} ${a.target}`;
            break;
          case "scroll":
            line = `Scrolled to ${a.value}`;
            break;
          case "submit":
            line = `Submitted ${a.target}`;
            break;
          case "navigate":
            line = `Navigated to ${a.value}`;
            break;
          case "console.log":
            line = `console.log: ${truncate(a.value || "", 80)}`;
            break;
          case "console.warn":
            line = `console.warn: ${truncate(a.value || "", 80)}`;
            break;
          case "console.error":
            line = `console.error: ${truncate(a.value || "", 80)}`;
            break;
          case "console.info":
            line = `console.info: ${truncate(a.value || "", 80)}`;
            break;
          case "error":
            line = `ERROR: ${truncate(a.value || "", 80)}`;
            break;
          default:
            line = `${a.action} ${a.target || ""}`;
        }
        lines.push(`${i + 1}. [${t}s] ${line}`);
      }
      return lines.join("\n");
    }
    function isActive() {
      return active;
    }
    function getSessionId() {
      return sessionId;
    }
    function getStartTime() {
      return startTime;
    }
    function getActionCount() {
      return actions.length;
    }
    function removeSession(id) {
    }
    function destroy3() {
      if (active) {
        active = false;
        detachListeners();
        restoreConsole();
        clearStorage();
        if (scrollTimer) {
          clearTimeout(scrollTimer);
          scrollTimer = null;
        }
        if (persistTimer) {
          clearTimeout(persistTimer);
          persistTimer = null;
        }
      }
      actions = [];
      pages = [];
      sessionId = null;
    }
    function checkResume() {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (saved && saved.active) {
          resume(saved);
          ctx.events.emit("session:resumed", {
            sessionId: saved.sessionId,
            startTime: saved.startTime
          });
        }
      } catch {
      }
    }
    setTimeout(checkResume, 50);
    return {
      start,
      stop,
      isActive,
      getSessionId,
      getStartTime,
      getActionCount,
      checkResume,
      removeSession,
      destroy: destroy3
    };
  }
  function truncate(str, max) {
    if (!str) return "";
    return str.length > max ? str.slice(0, max) + "..." : str;
  }

  // src/ui/components.js
  function el(tag, attrs = {}, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (key === "className") {
        element.className = value;
      } else if (key === "style" && typeof value === "object") {
        Object.assign(element.style, value);
      } else if (key.startsWith("on") && typeof value === "function") {
        element.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (key === "html") {
        element.innerHTML = value;
      } else {
        element.setAttribute(key, value);
      }
    }
    for (const child of children) {
      if (child == null) continue;
      if (typeof child === "string") {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    }
    return element;
  }
  function svg(name) {
    const icons = {
      highlight: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
      pin: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
      draw: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/></svg>',
      navigate: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>',
      close: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      download: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
      upload: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
      trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
      chevron: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>',
      record: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/></svg>',
      stop: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" stroke="none"/></svg>',
      session: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
      annotation: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
      link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>'
    };
    const wrapper = document.createElement("span");
    wrapper.innerHTML = icons[name] || "";
    wrapper.style.display = "inline-flex";
    wrapper.style.alignItems = "center";
    return wrapper;
  }

  // src/ui/toolbar.js
  var ANNOTATE_MODES = [
    { id: "highlight", label: "Highlight", icon: "highlight", shortcut: "Alt+H" },
    { id: "pin", label: "Pin", icon: "pin", shortcut: "Alt+P" },
    { id: "draw", label: "Draw", icon: "draw", shortcut: "Alt+D" },
    { id: "navigate", label: "Navigate", icon: "navigate", shortcut: "Alt+N" }
  ];
  function createToolbar(ctx) {
    let host = null;
    let shadow = null;
    let toolbarEl = null;
    let buttons = {};
    let timerEl = null;
    let countEl = null;
    let timerInterval = null;
    let videoCheckbox = null;
    function render() {
      host = document.createElement("div");
      host.dataset.ano = "";
      shadow = host.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = toolbarCSS;
      shadow.appendChild(style);
      applyTheme(host, ctx.config.theme);
      toolbarEl = el("div", { className: "ano-toolbar" });
      shadow.appendChild(toolbarEl);
      document.body.appendChild(host);
      renderIdle();
    }
    function renderIdle() {
      clearTimer();
      buttons = {};
      toolbarEl.innerHTML = "";
      const startBtn = el(
        "button",
        {
          className: "ano-start-session",
          onClick: () => ctx.events.emit("session:start")
        },
        svg("session"),
        el("span", { className: "ano-btn-label" }, "Start Session")
      );
      toolbarEl.appendChild(startBtn);
      if (canRecord) {
        const label = el("label", { className: "ano-video-toggle" });
        videoCheckbox = document.createElement("input");
        videoCheckbox.type = "checkbox";
        videoCheckbox.checked = ctx.config.videoRecording;
        label.appendChild(videoCheckbox);
        label.appendChild(svg("record"));
        label.appendChild(document.createTextNode("Video"));
        toolbarEl.appendChild(label);
      }
    }
    function renderActive(startTime) {
      clearTimer();
      buttons = {};
      toolbarEl.innerHTML = "";
      for (const mode of ANNOTATE_MODES) {
        const btn = el(
          "button",
          {
            className: "ano-toolbar-btn",
            title: mode.label,
            onClick: () => ctx.setMode(mode.id)
          },
          svg(mode.icon),
          el("span", { className: "tooltip" }, `${mode.label} (${mode.shortcut})`)
        );
        buttons[mode.id] = btn;
        toolbarEl.appendChild(btn);
      }
      toolbarEl.appendChild(el("div", { className: "ano-toolbar-divider" }));
      const status = el("div", { className: "ano-session-status" });
      status.appendChild(el("span", { className: "ano-session-dot" }));
      timerEl = el("span", { className: "ano-session-timer" }, "0:00");
      status.appendChild(timerEl);
      countEl = el("span", { className: "ano-session-count" }, "(0)");
      status.appendChild(countEl);
      const endBtn = el(
        "button",
        {
          className: "ano-end-session",
          onClick: () => ctx.events.emit("session:end")
        },
        svg("stop"),
        el("span", { className: "ano-btn-label" }, "End")
      );
      status.appendChild(endBtn);
      toolbarEl.appendChild(status);
      const updateTimerFn = () => {
        if (!timerEl) return;
        const elapsed = Date.now() - startTime;
        const secs = Math.floor(elapsed / 1e3);
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        timerEl.textContent = `${m}:${s.toString().padStart(2, "0")}`;
      };
      updateTimerFn();
      timerInterval = setInterval(updateTimerFn, 250);
    }
    function updateCount(n) {
      if (countEl) countEl.textContent = `(${n})`;
    }
    function getVideoToggleState() {
      return videoCheckbox ? videoCheckbox.checked : false;
    }
    function setActive(modeId) {
      for (const [id, btn] of Object.entries(buttons)) {
        btn.classList.toggle("active", id === modeId);
      }
    }
    function clearTimer() {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      timerEl = null;
      countEl = null;
    }
    function updateTheme(theme) {
      if (host) applyTheme(host, theme);
    }
    function destroy3() {
      clearTimer();
      if (host) {
        host.remove();
        host = null;
        shadow = null;
        toolbarEl = null;
        buttons = {};
        videoCheckbox = null;
      }
    }
    return { render, renderIdle, renderActive, setActive, updateCount, getVideoToggleState, updateTheme, destroy: destroy3 };
  }

  // src/ui/popover.js
  function createPopoverManager(ctx) {
    const { store } = ctx;
    let host = null;
    let shadow = null;
    let currentId = null;
    let cleanupClickOutside = null;
    function init3() {
      if (host) return;
      host = document.createElement("div");
      host.dataset.ano = "";
      shadow = host.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = popoverCSS;
      shadow.appendChild(style);
      applyTheme(host, ctx.config.theme);
      document.body.appendChild(host);
    }
    function show(annotationId, anchorRect) {
      init3();
      if (currentId === annotationId) return;
      hide();
      currentId = annotationId;
      const annotation = store.get(annotationId);
      if (!annotation) return;
      const popover = el("div", { className: "ano-popover" });
      const body = el("div", { className: "ano-popover-body" });
      const textarea = el("textarea", {
        placeholder: "Add a comment..."
      });
      textarea.value = annotation.comment || "";
      body.appendChild(textarea);
      popover.appendChild(body);
      const actions = el("div", { className: "ano-popover-actions" });
      const deleteBtn = el("button", {
        className: "ano-popover-btn delete",
        onClick: () => {
          ctx.events.emit("annotation:delete", annotationId);
          hide();
        }
      }, "Delete");
      const cancelBtn = el("button", {
        className: "ano-popover-btn",
        onClick: () => hide()
      }, "Cancel");
      const saveBtn = el("button", {
        className: "ano-popover-btn save",
        onClick: () => {
          store.update(annotationId, { comment: textarea.value });
          hide();
        }
      }, "Save");
      actions.appendChild(deleteBtn);
      actions.appendChild(cancelBtn);
      actions.appendChild(saveBtn);
      popover.appendChild(actions);
      const arrow = el("div", { className: "ano-popover-arrow" });
      popover.appendChild(arrow);
      shadow.appendChild(popover);
      requestAnimationFrame(() => {
        positionPopover(popover, arrow, anchorRect);
        textarea.focus();
        function onClickOutside(e) {
          if (host && !host.shadowRoot.contains(e.target) && !host.contains(e.target)) {
            store.update(annotationId, { comment: textarea.value });
            hide();
          }
        }
        document.addEventListener("click", onClickOutside, true);
        cleanupClickOutside = () => {
          document.removeEventListener("click", onClickOutside, true);
        };
      });
      textarea.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          store.update(annotationId, { comment: textarea.value });
          hide();
        }
        if (e.key === "Escape") {
          store.update(annotationId, { comment: textarea.value });
          hide();
        }
        e.stopPropagation();
      });
    }
    function positionPopover(popover, arrow, anchor) {
      const popRect = popover.getBoundingClientRect();
      const viewW = window.innerWidth;
      const viewH = window.innerHeight;
      let top, left;
      let arrowPos = "top";
      top = anchor.bottom + 8;
      if (top + popRect.height > viewH) {
        top = anchor.top - popRect.height - 8;
        arrowPos = "bottom";
      }
      left = anchor.left + anchor.width / 2 - popRect.width / 2;
      left = Math.max(8, Math.min(left, viewW - popRect.width - 8));
      popover.style.top = `${top}px`;
      popover.style.left = `${left}px`;
      arrow.className = `ano-popover-arrow ${arrowPos}`;
      const arrowLeft = anchor.left + anchor.width / 2 - left - 6;
      arrow.style.left = `${Math.max(12, Math.min(arrowLeft, popRect.width - 24))}px`;
    }
    function hide() {
      if (cleanupClickOutside) {
        cleanupClickOutside();
        cleanupClickOutside = null;
      }
      if (!shadow) return;
      const existing = shadow.querySelector(".ano-popover");
      if (existing) existing.remove();
      currentId = null;
    }
    function isOpen() {
      return currentId !== null;
    }
    function getCurrentId() {
      return currentId;
    }
    function updateTheme(theme) {
      if (host) applyTheme(host, theme);
    }
    function destroy3() {
      hide();
      if (host) {
        host.remove();
        host = null;
        shadow = null;
      }
    }
    return { init: init3, show, hide, isOpen, getCurrentId, updateTheme, destroy: destroy3 };
  }

  // src/ui/end-dialog.js
  function createEndDialog(ctx) {
    let host = null;
    let shadow = null;
    function show(summary) {
      hide();
      host = document.createElement("div");
      host.dataset.ano = "";
      shadow = host.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = endDialogCSS;
      shadow.appendChild(style);
      applyTheme(host, ctx.config.theme);
      const overlay = el("div", { className: "ano-end-overlay" });
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) dismiss();
      });
      const dialog = el("div", { className: "ano-end-dialog" });
      const closeBtn = el("button", {
        className: "ano-end-close",
        onClick: () => dismiss()
      });
      closeBtn.appendChild(svg("close"));
      dialog.appendChild(el(
        "div",
        { className: "ano-end-header" },
        el("h2", {}, "Report Ready"),
        closeBtn
      ));
      const grid = el("div", { className: "ano-end-summary" });
      grid.appendChild(statCard(formatDuration(summary.duration), "Duration"));
      grid.appendChild(statCard(String(summary.actionCount), "Actions"));
      grid.appendChild(statCard(String(summary.pageCount), "Pages"));
      grid.appendChild(statCard(String(summary.annotationCount), "Annotations"));
      if (summary.hasRecording) {
        const badge = el("div", { className: "ano-end-badge" });
        badge.appendChild(svg("record"));
        badge.appendChild(document.createTextNode("Video recorded"));
        grid.appendChild(badge);
      }
      dialog.appendChild(grid);
      if (summary.annotations && summary.annotations.length > 0) {
        const section = el("div", { className: "ano-end-annotations" });
        section.appendChild(el("h3", {}, "Annotations"));
        const list = el("div", { className: "ano-end-ann-list" });
        let pinIndex = 0;
        for (const ann of summary.annotations) {
          if (ann.type === "session" || ann.type === "recording") continue;
          const card = el("div", { className: "ano-end-ann-card" });
          if (ann.type === "highlight") {
            card.appendChild(typeLabel("highlight", "Highlight"));
            if (ann.quote) card.appendChild(el("div", { className: "ano-end-ann-text" }, `"${truncate3(ann.quote, 120)}"`));
          } else if (ann.type === "pin") {
            pinIndex++;
            card.appendChild(typeLabel("pin", `Pin #${pinIndex}`));
            if (ann.target?.description) card.appendChild(el("div", { className: "ano-end-ann-text" }, ann.target.description));
          } else if (ann.type === "drawing") {
            card.appendChild(typeLabel("drawing", "Drawing"));
          }
          if (ann.comment) {
            card.appendChild(el("div", { className: "ano-end-ann-comment" }, ann.comment));
          }
          list.appendChild(card);
        }
        section.appendChild(list);
        dialog.appendChild(section);
      }
      const actions = el("div", { className: "ano-end-actions" });
      const dismissBtn = el("button", {
        onClick: () => dismiss()
      }, "Dismiss");
      const linkBtn = el("button", {
        onClick: () => {
          linkBtn.textContent = "Uploading\u2026";
          linkBtn.disabled = true;
          ctx.events.emit("share");
        }
      }, "Get Link");
      const linkResult = el("div", { className: "ano-end-link-result" });
      linkResult.style.display = "none";
      const linkInput = el("input", { readOnly: true, className: "ano-end-link-input" });
      const copyBtn = el("button", {
        className: "ano-end-link-copy",
        onClick: () => {
          navigator.clipboard.writeText(linkInput.value).then(() => {
            copyBtn.textContent = "Copied!";
            setTimeout(() => {
              copyBtn.textContent = "Copy";
            }, 2e3);
          });
        }
      }, "Copy");
      linkResult.appendChild(linkInput);
      linkResult.appendChild(copyBtn);
      const offComplete = ctx.events.on("share:complete", (url) => {
        linkBtn.style.display = "none";
        linkInput.value = url;
        linkResult.style.display = "";
      });
      const offError = ctx.events.on("share:error", () => {
        linkBtn.textContent = "Failed \u2014 retry";
        linkBtn.disabled = false;
      });
      const origHide = hide;
      hide = function() {
        offComplete();
        offError();
        origHide();
      };
      const exportJsonBtn = el("button", {
        className: "primary",
        onClick: () => {
          ctx.events.emit("export:json");
          dismiss();
        }
      }, "Export JSON");
      actions.appendChild(dismissBtn);
      actions.appendChild(linkBtn);
      if (summary.hasRecording) {
        const exportVideoBtn = el("button", {
          onClick: () => {
            ctx.events.emit("export:video");
            dismiss();
          }
        }, "Export Video");
        actions.appendChild(exportVideoBtn);
      }
      actions.appendChild(exportJsonBtn);
      dialog.appendChild(actions);
      dialog.appendChild(linkResult);
      overlay.appendChild(dialog);
      shadow.appendChild(overlay);
      document.body.appendChild(host);
    }
    function statCard(value, label) {
      return el(
        "div",
        { className: "ano-end-stat" },
        el("div", { className: "ano-end-stat-value" }, value),
        el("div", { className: "ano-end-stat-label" }, label)
      );
    }
    function typeLabel(type, text) {
      const label = el("div", { className: `ano-end-ann-type ${type}` });
      label.appendChild(el("span", { className: "dot" }));
      label.appendChild(document.createTextNode(text));
      return label;
    }
    function truncate3(str, max) {
      if (!str || str.length <= max) return str || "";
      return str.slice(0, max) + "\u2026";
    }
    function formatDuration(ms) {
      const secs = Math.floor((ms || 0) / 1e3);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${m}:${s.toString().padStart(2, "0")}`;
    }
    function dismiss() {
      hide();
      ctx.events.emit("session:dismissed");
    }
    function hide() {
      if (host) {
        host.remove();
        host = null;
        shadow = null;
      }
    }
    function isOpen() {
      return host !== null;
    }
    function destroy3() {
      hide();
    }
    return { show, hide, dismiss, isOpen, destroy: destroy3 };
  }

  // src/shortcuts.js
  function createShortcutManager(ctx) {
    let active = false;
    const shortcuts = {
      "alt+h": () => {
        if (ctx.sessionState === "active") ctx.setMode("highlight");
      },
      "alt+p": () => {
        if (ctx.sessionState === "active") ctx.setMode("pin");
      },
      "alt+d": () => {
        if (ctx.sessionState === "active") ctx.setMode("draw");
      },
      "alt+n": () => {
        if (ctx.sessionState === "active") ctx.setMode("navigate");
      },
      "alt+s": () => {
        if (ctx.sessionState === "idle") {
          ctx.events.emit("session:start");
        } else if (ctx.sessionState === "active") {
          ctx.events.emit("session:end");
        }
      },
      "alt+e": () => ctx.events.emit("export"),
      "escape": () => {
        if (ctx.popover.isOpen()) {
          ctx.popover.hide();
        } else if (ctx.sessionState === "active") {
          ctx.events.emit("session:end");
        } else if (ctx.endDialog && ctx.endDialog.isOpen()) {
          ctx.endDialog.dismiss();
        }
      }
    };
    function onKeyDown(e) {
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        if (e.key === "Escape") {
          const isAnoElement3 = e.target.closest?.("[data-ano]") || isInShadow(e.target);
          if (isAnoElement3) {
            shortcuts["escape"]();
            return;
          }
        }
        return;
      }
      const key = buildKey(e);
      if (shortcuts[key]) {
        e.preventDefault();
        e.stopPropagation();
        shortcuts[key]();
      }
    }
    function buildKey(e) {
      const parts = [];
      if (e.altKey) parts.push("alt");
      if (e.ctrlKey) parts.push("ctrl");
      if (e.metaKey) parts.push("meta");
      if (e.shiftKey) parts.push("shift");
      parts.push(e.key.toLowerCase());
      return parts.join("+");
    }
    function isInShadow(el2) {
      let node = el2;
      while (node) {
        if (node.host && node.host.dataset && node.host.dataset.ano !== void 0) return true;
        node = node.parentNode;
      }
      return false;
    }
    function enable() {
      if (active) return;
      active = true;
      document.addEventListener("keydown", onKeyDown, true);
    }
    function disable() {
      active = false;
      document.removeEventListener("keydown", onKeyDown, true);
    }
    function destroy3() {
      disable();
    }
    return { enable, disable, destroy: destroy3 };
  }

  // src/io/export.js
  function exportAnnotations(store, crossPageAnnotations = []) {
    const data = buildExportData(store, crossPageAnnotations);
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `annotations-${formatDate()}.json`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 100);
    const recordings = store.getByType("recording");
    for (const rec of recordings) {
      if (rec.blob) {
        downloadBlob(rec.blob, `recording-${rec.id}.webm`);
      }
    }
    const sessions = store.getByType("session");
    for (const ses of sessions) {
      if (ses.blob) {
        downloadBlob(ses.blob, `session-${ses.sessionId || ses.id}.webm`);
      }
    }
    return data;
  }
  function exportJSON(store, crossPageAnnotations = []) {
    const data = buildExportData(store, crossPageAnnotations);
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `annotations-${formatDate()}.json`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 100);
    return data;
  }
  function exportVideo(store) {
    const recordings = store.getByType("recording");
    for (const rec of recordings) {
      if (rec.blob) {
        downloadBlob(rec.blob, `recording-${rec.id}.webm`);
      }
    }
    const sessions = store.getByType("session");
    for (const ses of sessions) {
      if (ses.blob) {
        downloadBlob(ses.blob, `session-${ses.sessionId || ses.id}.webm`);
      }
    }
  }
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 100);
  }
  function buildExportData(store, crossPageAnnotations = []) {
    const currentAnnotations = store.getAll().map((a) => {
      const c = cleanAnnotation(a);
      c.pageUrl = c.pageUrl || window.location.href;
      c.pageTitle = c.pageTitle || document.title;
      return c;
    });
    const otherAnnotations = crossPageAnnotations.map((a) => {
      const c = cleanAnnotation(a);
      c.pageUrl = c.pageUrl || a.pageUrl || "unknown";
      c.pageTitle = c.pageTitle || a.pageTitle || "";
      return c;
    });
    const seen = new Set(currentAnnotations.map((a) => a.id));
    const merged = [...currentAnnotations];
    for (const a of otherAnnotations) {
      if (!seen.has(a.id)) {
        seen.add(a.id);
        merged.push(a);
      }
    }
    merged.sort((a, b) => a.createdAt - b.createdAt);
    return {
      version: "1.0",
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      pageUrl: window.location.href,
      pageTitle: document.title,
      environment: collectEnvironment(),
      annotations: merged,
      summary: buildSummary(merged)
    };
  }
  function collectEnvironment() {
    const nav = navigator;
    const scr = screen;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    const env = {
      userAgent: nav.userAgent,
      platform: nav.platform,
      language: nav.language,
      languages: nav.languages ? [...nav.languages] : [nav.language],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: (/* @__PURE__ */ new Date()).getTimezoneOffset(),
      screen: {
        width: scr.width,
        height: scr.height,
        devicePixelRatio: window.devicePixelRatio,
        colorDepth: scr.colorDepth,
        orientation: scr.orientation?.type || null
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      deviceMemory: nav.deviceMemory || null,
      hardwareConcurrency: nav.hardwareConcurrency || null,
      touchSupport: nav.maxTouchPoints > 0,
      cookiesEnabled: nav.cookieEnabled,
      doNotTrack: nav.doNotTrack || null
    };
    if (conn) {
      env.connection = {
        effectiveType: conn.effectiveType || null,
        downlink: conn.downlink || null,
        rtt: conn.rtt || null,
        saveData: conn.saveData || false
      };
    }
    return env;
  }
  function cleanAnnotation(a) {
    const clean = {};
    clean.id = a.id;
    clean.type = a.type;
    clean.comment = a.comment || "";
    clean.createdAt = a.createdAt;
    if (a.type === "highlight") {
      clean.text = a.text;
      clean.context = a.context || null;
      clean._anchoring = { selectors: a.selectors };
      if (a.color) clean.color = a.color;
    } else if (a.type === "pin") {
      clean.index = a.index;
      clean.context = a.context || null;
      clean._anchoring = {
        targetSelector: a.targetSelector,
        targetMeta: a.targetMeta
      };
    } else if (a.type === "drawing") {
      clean.context = a.context || null;
      clean._anchoring = {
        strokes: a.strokes,
        viewport: a.viewport
      };
    } else if (a.type === "recording") {
      clean.duration = a.duration;
      clean.region = a.region;
      clean.context = a.context || null;
      clean._anchoring = {
        viewport: a.viewport,
        file: `recording-${a.id}.webm`
      };
    } else if (a.type === "session") {
      clean.duration = a.duration;
      clean.pages = a.pages;
      clean.context = a.context || null;
      clean.sessionId = a.sessionId || null;
      clean.annotationIds = a.annotationIds || [];
      clean.hasRecording = a.hasRecording || false;
      clean._anchoring = {
        actions: a.actions
      };
      if (a.blob) {
        clean._anchoring.file = `session-${a.sessionId || a.id}.webm`;
      }
    }
    if (a.pageUrl) clean.pageUrl = a.pageUrl;
    if (a.pageTitle) clean.pageTitle = a.pageTitle;
    if (a._orphaned) clean.orphaned = true;
    return clean;
  }
  function buildSummary(annotations) {
    const byPage = /* @__PURE__ */ new Map();
    for (const a of annotations) {
      const page = a.pageUrl || "unknown";
      if (!byPage.has(page)) byPage.set(page, []);
      byPage.get(page).push(a);
    }
    const lines = [];
    for (const [page, anns] of byPage) {
      if (byPage.size > 1) {
        lines.push(`
--- ${page} ---`);
      }
      for (const a of anns) {
        const comment = a.comment ? ` \u2014 "${a.comment}"` : "";
        if (a.type === "highlight") {
          const where = a.context?.element ? ` in <${a.context.element.tagName?.toLowerCase() || "element"}>` : "";
          const path = a.context?.pagePath ? ` (${a.context.pagePath.join(" > ")})` : "";
          lines.push(`[Highlight] "${truncate2(a.text, 80)}"${where}${path}${comment}`);
        } else if (a.type === "pin") {
          const desc = a.context?.description || `element #${a.index}`;
          lines.push(`[Pin #${a.index}] ${desc}${comment}`);
        } else if (a.type === "drawing") {
          const desc = a.context?.description || "freehand drawing";
          lines.push(`[Drawing] ${desc}${comment}`);
        } else if (a.type === "recording") {
          const secs = Math.round((a.duration || 0) / 1e3);
          const desc = a.context?.description || "screen recording";
          lines.push(`[Recording ${secs}s] ${desc}${comment}`);
        } else if (a.type === "session") {
          const secs = Math.round((a.duration || 0) / 1e3);
          const desc = a.context?.description || "session recording";
          lines.push(`[Session ${secs}s] ${desc}${comment}`);
        }
      }
    }
    return lines.join("\n").trim();
  }
  function truncate2(str, max) {
    if (!str) return "";
    return str.length > max ? str.slice(0, max) + "..." : str;
  }
  function formatDate() {
    const d = /* @__PURE__ */ new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
  }
  function pad(n) {
    return n.toString().padStart(2, "0");
  }

  // src/io/import.js
  function importFromFile(ctx) {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.style.display = "none";
      document.body.appendChild(input);
      input.addEventListener("change", async () => {
        const file = input.files[0];
        if (!file) {
          input.remove();
          resolve({ success: false, error: "No file selected" });
          return;
        }
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          const result = importData(ctx, data);
          resolve(result);
        } catch (err) {
          resolve({ success: false, error: err.message });
        } finally {
          input.remove();
        }
      });
      input.click();
    });
  }
  function importData(ctx, data) {
    if (!data || !data.annotations || !Array.isArray(data.annotations)) {
      return { success: false, error: "Invalid annotation data" };
    }
    const { store, highlightManager, pinManager, drawingManager } = ctx;
    const results = { imported: 0, orphaned: 0, orphans: [] };
    for (const raw of data.annotations) {
      const ann = { ...raw };
      if (ann._anchoring) {
        Object.assign(ann, ann._anchoring);
        delete ann._anchoring;
      }
      const annotation = store.add(ann);
      let anchored = false;
      if (annotation.type === "highlight") {
        anchored = highlightManager.applyHighlight(annotation);
      } else if (annotation.type === "pin") {
        anchored = pinManager.applyPin(annotation);
      } else if (annotation.type === "drawing") {
        anchored = drawingManager.applyDrawing(annotation);
      } else if (annotation.type === "recording") {
        anchored = true;
      } else if (annotation.type === "session") {
        anchored = true;
      }
      if (anchored) {
        results.imported++;
      } else {
        results.orphaned++;
        results.orphans.push(annotation.id);
        store.update(annotation.id, { _orphaned: true });
      }
    }
    return { success: true, ...results };
  }

  // src/io/share.js
  var TUS_BASE = "https://share.mk/files/";
  async function tusUpload(bytes, metadata) {
    const createRes = await fetch(TUS_BASE, {
      method: "POST",
      headers: {
        "Tus-Resumable": "1.0.0",
        "Upload-Length": String(bytes.byteLength),
        "Upload-Metadata": metadata.map(([k, v]) => `${k} ${btoa(v)}`).join(",")
      }
    });
    if (!createRes.ok) throw new Error(`Upload failed: ${createRes.status}`);
    const location2 = createRes.headers.get("Location");
    if (!location2) throw new Error("No Location header in response");
    const fileUrl = location2.startsWith("http") ? location2 : new URL(location2, TUS_BASE).href;
    const patchRes = await fetch(fileUrl, {
      method: "PATCH",
      headers: {
        "Tus-Resumable": "1.0.0",
        "Upload-Offset": "0",
        "Content-Type": "application/offset+octet-stream"
      },
      body: bytes
    });
    if (!patchRes.ok) throw new Error(`Patch failed: ${patchRes.status}`);
    return fileUrl;
  }
  async function shareAnnotations(store, crossPageAnnotations, events) {
    try {
      events.emit("share:uploading");
      const data = buildExportData(store, crossPageAnnotations);
      const blobs = [];
      for (const ann of store.getAll()) {
        if ((ann.type === "recording" || ann.type === "session") && ann.blob) {
          const filename = ann.type === "recording" ? `recording-${ann.id}.webm` : `session-${ann.sessionId || ann.id}.webm`;
          blobs.push({ id: ann.id, type: ann.type, sessionId: ann.sessionId, blob: ann.blob, filename });
        }
      }
      const videoUrls = /* @__PURE__ */ new Map();
      for (const entry of blobs) {
        const bytes = new Uint8Array(await entry.blob.arrayBuffer());
        const url = await tusUpload(bytes, [
          ["filename", entry.filename],
          ["content-type", "video/webm"],
          ["expires-in", "7d"]
        ]);
        videoUrls.set(entry.filename, url);
      }
      if (videoUrls.size > 0) {
        for (const ann of data.annotations) {
          if (ann._anchoring?.file && videoUrls.has(ann._anchoring.file)) {
            ann._anchoring.file = videoUrls.get(ann._anchoring.file);
          }
        }
      }
      const json = JSON.stringify(data, null, 2);
      const jsonBytes = new TextEncoder().encode(json);
      const fileUrl = await tusUpload(jsonBytes, [
        ["filename", "annotations.json"],
        ["content-type", "application/json"],
        ["expires-in", "7d"]
      ]);
      try {
        await navigator.clipboard.writeText(fileUrl);
      } catch {
      }
      events.emit("share:complete", fileUrl);
      return fileUrl;
    } catch (err) {
      events.emit("share:error", err);
      return null;
    }
  }

  // src/api.js
  var STORAGE_PREFIX = "ano:";
  var instance = null;
  function init(options = {}) {
    if (instance) {
      console.warn("[Ano] Already initialized. Call Ano.destroy() first.");
      return instance.api;
    }
    const isChildFrame = window !== window.top;
    const config = createConfig(options);
    const store = createStore();
    const events = createEventBus();
    const ctx = {
      config,
      store,
      events,
      mode: "navigate",
      sessionState: "idle",
      // 'idle' | 'active' | 'ending'
      currentSessionId: null,
      toolbar: null,
      popover: null,
      endDialog: null,
      highlightManager: null,
      pinManager: null,
      drawingManager: null,
      recordingManager: null,
      sessionManager: null,
      shortcutManager: null,
      setMode: null
    };
    ctx.highlightManager = createHighlightManager(ctx);
    ctx.pinManager = createPinManager(ctx);
    ctx.drawingManager = createDrawingManager(ctx);
    if (canRecord) {
      ctx.recordingManager = createRecordingManager(ctx);
    }
    ctx.sessionManager = createSessionManager(ctx);
    const nullToolbar = {
      render: () => {
      },
      renderIdle: () => {
      },
      renderActive: () => {
      },
      setActive: () => {
      },
      updateCount: () => {
      },
      getVideoToggleState: () => false,
      destroy: () => {
      }
    };
    const nullDialog = { show: () => {
    }, destroy: () => {
    } };
    ctx.toolbar = isChildFrame ? nullToolbar : createToolbar(ctx);
    ctx.popover = createPopoverManager(ctx);
    ctx.endDialog = isChildFrame ? nullDialog : createEndDialog(ctx);
    ctx.shortcutManager = createShortcutManager(ctx);
    ctx.setMode = (mode) => {
      if (!isChildFrame && ctx.sessionState !== "active" && mode !== "navigate") return;
      disableMode(ctx, ctx.mode);
      ctx.mode = mode;
      enableMode(ctx, mode);
      if (!isChildFrame) {
        ctx.toolbar.setActive(mode);
        for (const iframe of document.querySelectorAll("iframe")) {
          try {
            iframe.contentWindow?.postMessage({ source: "ano-parent", type: "mode:set", payload: mode }, "*");
          } catch {
          }
        }
      }
    };
    wireEvents(ctx);
    injectHostStyles();
    ctx.drawingManager.init();
    ctx.toolbar.render();
    ctx.popover.init();
    if (config.shortcuts && !isChildFrame) {
      ctx.shortcutManager.enable();
    }
    let persistTimer = null;
    let unsubPersist = null;
    if (!isChildFrame) {
      restoreStore(ctx);
      unsubPersist = store.on("change", () => {
        if (persistTimer) clearTimeout(persistTimer);
        persistTimer = setTimeout(() => persistStore(store), 500);
      });
    }
    store.on("add", (annotation) => {
      if (ctx.sessionState === "active" && ctx.currentSessionId && annotation.type !== "session" && !annotation.sessionId) {
        store.update(annotation.id, { sessionId: ctx.currentSessionId });
      }
    });
    const repositionHandler = () => ctx.pinManager.repositionAll();
    window.addEventListener("scroll", repositionHandler, { passive: true });
    window.addEventListener("resize", repositionHandler, { passive: true });
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.removedNodes) {
          if (node.classList?.contains("ano-highlight") && node.dataset?.anoId) {
            const id = node.dataset.anoId;
            if (store.get(id)) {
              store.update(id, { _orphaned: true });
            }
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    if (isChildFrame) {
      let onParentMessage = function(e) {
        if (!e.data || e.data.source !== "ano-parent") return;
        if (e.data.type === "mode:set") ctx.setMode(e.data.payload);
        else if (e.data.type === "pin:hover") ctx.pinManager.hoverAt(e.data.x, e.data.y);
        else if (e.data.type === "pin:hover:clear") ctx.pinManager.clearHover();
        else if (e.data.type === "pin:click") ctx.pinManager.clickAt(e.data.x, e.data.y);
        else if (e.data.type === "destroy") destroyInstance();
      };
      store.on("add", (a) => window.parent.postMessage(
        { source: "ano-frame", type: "annotation:add", payload: cleanForStorage(a), frameUrl: location.href },
        "*"
      ));
      store.on("update", (a) => window.parent.postMessage(
        { source: "ano-frame", type: "annotation:update", payload: cleanForStorage(a), frameUrl: location.href },
        "*"
      ));
      store.on("remove", (id) => window.parent.postMessage(
        { source: "ano-frame", type: "annotation:remove", payload: id, frameUrl: location.href },
        "*"
      ));
      window.addEventListener("message", onParentMessage);
      ctx._cleanupChildMessage = () => window.removeEventListener("message", onParentMessage);
    }
    if (!isChildFrame) {
      let onFrameMessage = function(e) {
        if (!e.data || e.data.source !== "ano-frame") return;
        const { type, payload, frameUrl } = e.data;
        if (type === "annotation:add") store.add({ ...payload, frameUrl });
        else if (type === "annotation:update") store.update(payload.id, { ...payload, frameUrl });
        else if (type === "annotation:remove") store.remove(payload);
      };
      window.addEventListener("message", onFrameMessage);
      ctx._cleanupFrameMessage = () => window.removeEventListener("message", onFrameMessage);
    }
    const api = {
      getAll: () => store.getAll(),
      toJSON: () => buildExportData(store, getCrossPageAnnotations()),
      export: () => exportAnnotations(store, getCrossPageAnnotations()),
      importFile: () => importFromFile(ctx),
      import: (data) => importData(ctx, data),
      setMode: (mode) => ctx.setMode(mode),
      share: () => events.emit("share"),
      clear: () => clearInstance(),
      destroy: () => destroyInstance(),
      startSession: () => events.emit("session:start"),
      endSession: () => events.emit("session:end")
    };
    instance = {
      ctx,
      api,
      repositionHandler,
      observer,
      unsubPersist,
      persistTimer,
      isChildFrame
    };
    return api;
  }
  function destroy() {
    destroyInstance();
  }
  function clearInstance() {
    if (!instance) return;
    const { ctx } = instance;
    const { store, highlightManager, pinManager, drawingManager, sessionManager } = ctx;
    for (const ann of store.getAll()) {
      if (ann.type === "highlight") highlightManager.removeHighlight(ann.id);
      else if (ann.type === "pin") pinManager.removePin(ann.id);
      else if (ann.type === "drawing") drawingManager.removeDrawing(ann.id);
      else if (ann.type === "session") sessionManager.removeSession(ann.id);
      else if (ann.type === "recording" && ctx.recordingManager) ctx.recordingManager.removeRecording(ann.id);
    }
    store.clear();
    drawingManager.redrawAll();
    clearStoredAnnotations();
  }
  function destroyInstance() {
    if (!instance) return;
    const { ctx, repositionHandler, observer, unsubPersist, persistTimer, isChildFrame } = instance;
    if (!isChildFrame) {
      for (const iframe of document.querySelectorAll("iframe")) {
        try {
          iframe.contentWindow?.postMessage({ source: "ano-parent", type: "destroy" }, "*");
        } catch {
        }
      }
    }
    if (unsubPersist) unsubPersist();
    if (persistTimer) clearTimeout(persistTimer);
    observer.disconnect();
    window.removeEventListener("scroll", repositionHandler);
    window.removeEventListener("resize", repositionHandler);
    ctx.shortcutManager.destroy();
    ctx.popover.destroy();
    ctx.endDialog.destroy();
    ctx.toolbar.destroy();
    ctx.highlightManager.destroy();
    ctx.pinManager.destroy();
    ctx.drawingManager.destroy();
    if (ctx.recordingManager) ctx.recordingManager.destroy();
    ctx.sessionManager.destroy();
    if (ctx._cleanupHighlightClick) ctx._cleanupHighlightClick();
    if (ctx._cleanupFrameMessage) ctx._cleanupFrameMessage();
    if (ctx._cleanupChildMessage) ctx._cleanupChildMessage();
    if (!isChildFrame) persistStore(ctx.store);
    ctx.store.clear();
    ctx.store.destroy();
    ctx.events.clear();
    removeHostStyles();
    instance = null;
  }
  function enableMode(ctx, mode) {
    switch (mode) {
      case "highlight":
        ctx.highlightManager.enable();
        break;
      case "pin":
        ctx.pinManager.enable();
        break;
      case "draw":
        ctx.drawingManager.enable();
        break;
      case "navigate":
        break;
    }
  }
  function disableMode(ctx, mode) {
    switch (mode) {
      case "highlight":
        ctx.highlightManager.disable();
        break;
      case "pin":
        ctx.pinManager.disable();
        break;
      case "draw":
        ctx.drawingManager.disable();
        break;
    }
  }
  function waitForRecordingBlob(recordingManager, timeoutMs = 5e3) {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        const blob = recordingManager.getBlob();
        if (blob) {
          resolve(blob);
          return;
        }
        if (Date.now() - start >= timeoutMs) {
          resolve(null);
          return;
        }
        setTimeout(check, 100);
      };
      check();
    });
  }
  function storageKey() {
    return STORAGE_PREFIX + location.pathname;
  }
  function persistStore(store) {
    try {
      const annotations = store.getAll().map(cleanForStorage);
      localStorage.setItem(storageKey(), JSON.stringify(annotations));
    } catch {
    }
  }
  function cleanForStorage(a) {
    const c = { ...a };
    delete c.blob;
    delete c.blobUrl;
    delete c._marks;
    if (!c.pageUrl) c.pageUrl = window.location.href;
    if (!c.pageTitle) c.pageTitle = document.title;
    return c;
  }
  function getCrossPageAnnotations() {
    const currentKey = storageKey();
    const results = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key.startsWith(STORAGE_PREFIX) || key === currentKey) continue;
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const saved = JSON.parse(raw);
        if (Array.isArray(saved)) {
          results.push(...saved);
        }
      }
    } catch {
    }
    return results;
  }
  function restoreStore(ctx) {
    try {
      const raw = localStorage.getItem(storageKey());
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved) && saved.length > 0) {
          importData(ctx, { annotations: saved });
        }
      }
    } catch {
    }
    const cross = getCrossPageAnnotations();
    const global = cross.filter((a) => a.type === "session" || a.type === "recording");
    if (global.length > 0) {
      const seen = new Set(ctx.store.getAll().map((a) => a.id));
      const fresh = global.filter((a) => !seen.has(a.id));
      if (fresh.length > 0) {
        importData(ctx, { annotations: fresh });
      }
    }
  }
  function clearStoredAnnotations() {
    try {
      localStorage.removeItem(storageKey());
    } catch {
    }
  }
  function wireEvents(ctx) {
    const { store, events, popover, highlightManager, pinManager, drawingManager } = ctx;
    events.on("session:start", () => {
      if (ctx.sessionState !== "idle") return;
      const sessionId = ctx.sessionManager.start();
      ctx.sessionState = "active";
      ctx.currentSessionId = sessionId;
      if (ctx.toolbar.getVideoToggleState() && ctx.recordingManager) {
        ctx.recordingManager.startRecording();
      }
      ctx.toolbar.renderActive(ctx.sessionManager.getStartTime());
      ctx.setMode("navigate");
    });
    events.on("session:end", async () => {
      if (ctx.sessionState !== "active") return;
      const wasRecording = ctx.recordingManager?.isRecording();
      const sessionData = ctx.sessionManager.stop();
      if (!sessionData) return;
      if (wasRecording) {
        ctx.recordingManager.stopRecording();
      }
      ctx.setMode("navigate");
      ctx.sessionState = "ending";
      ctx.toolbar.renderIdle();
      let blob = null;
      let blobUrl = null;
      if (wasRecording) {
        blob = await waitForRecordingBlob(ctx.recordingManager);
        if (blob) {
          blobUrl = ctx.recordingManager.getBlobUrl();
        }
      }
      const allAnnotations = store.getAll();
      const sessionAnnotations = allAnnotations.filter((a) => a.sessionId === sessionData.sessionId && a.type !== "session");
      const annotationIds = sessionAnnotations.map((a) => a.id);
      const sessionAnnotation = {
        type: "session",
        sessionId: sessionData.sessionId,
        comment: "",
        duration: sessionData.duration,
        actions: sessionData.actions,
        pages: sessionData.pages,
        context: { description: sessionData.description },
        annotationIds,
        hasRecording: !!blob
      };
      if (blob) {
        sessionAnnotation.blob = blob;
        sessionAnnotation.blobUrl = blobUrl;
      }
      store.add(sessionAnnotation);
      ctx.endDialog.show({
        duration: sessionData.duration,
        actionCount: sessionData.actions.length,
        pageCount: sessionData.pages.length,
        annotationCount: annotationIds.length,
        hasRecording: !!blob,
        annotations: sessionAnnotations
      });
    });
    events.on("session:dismissed", () => {
      ctx.sessionState = "idle";
      ctx.currentSessionId = null;
      if (ctx.recordingManager) {
        ctx.recordingManager.clearBlob();
      }
      clearInstance();
    });
    events.on("session:action", (count) => {
      ctx.toolbar.updateCount(count);
    });
    events.on("session:resumed", (data) => {
      ctx.sessionState = "active";
      ctx.currentSessionId = data.sessionId;
      ctx.toolbar.renderActive(data.startTime);
    });
    events.on("recording:stopped", (data) => {
      if (ctx.sessionState === "ending" || ctx.sessionState === "idle") {
        const sessions = store.getByType("session");
        for (let i = sessions.length - 1; i >= 0; i--) {
          const s = sessions[i];
          if (!s.blob && s.hasRecording === false && data.blob) {
            store.update(s.id, {
              blob: data.blob,
              blobUrl: data.blobUrl,
              hasRecording: true
            });
            break;
          }
        }
      }
    });
    events.on("session:maxDuration", () => {
      events.emit("session:end");
    });
    events.on("highlight:created", (annotation) => {
      const marks = highlightManager.getMarksForAnnotation(annotation.id);
      if (marks.length > 0) {
        const rect = marks[0].getBoundingClientRect();
        popover.show(annotation.id, rect);
      }
    });
    events.on("pin:created", (annotation) => {
      ctx.setMode("navigate");
      const el2 = document.querySelector(`[data-ano-id="${annotation.id}"]`);
      if (el2) {
        const rect = el2.getBoundingClientRect();
        popover.show(annotation.id, rect);
      }
    });
    events.on("drawing:created", (annotation, rawPoints) => {
      ctx.setMode("navigate");
      if (rawPoints && rawPoints.length > 0) {
        const last = rawPoints[rawPoints.length - 1];
        const rect = {
          x: last.x,
          y: last.y,
          top: last.y,
          left: last.x,
          bottom: last.y + 1,
          right: last.x + 1,
          width: 1,
          height: 1
        };
        popover.show(annotation.id, rect);
      }
    });
    events.on("pin:click", (annotation) => {
      const el2 = document.querySelector(`[data-ano-id="${annotation.id}"]`);
      if (el2) {
        const rect = el2.getBoundingClientRect();
        popover.show(annotation.id, rect);
      }
    });
    events.on("annotation:focus", (annotation) => {
      if (annotation.frameUrl) return;
      if (annotation.type === "highlight") {
        const marks = highlightManager.getMarksForAnnotation(annotation.id);
        if (marks.length > 0) {
          marks[0].scrollIntoView({ behavior: "smooth", block: "center" });
          const rect = marks[0].getBoundingClientRect();
          setTimeout(() => popover.show(annotation.id, rect), 300);
        }
      } else if (annotation.type === "pin") {
        pinManager.scrollToPin(annotation.id);
        setTimeout(() => {
          const el2 = document.querySelector(`[data-ano-id="${annotation.id}"]`);
          if (el2) {
            const rect = el2.getBoundingClientRect();
            popover.show(annotation.id, rect);
          }
        }, 300);
      }
    });
    events.on("annotation:delete", (id) => {
      const annotation = store.get(id);
      if (!annotation) return;
      if (annotation.type === "highlight") {
        highlightManager.removeHighlight(id);
      } else if (annotation.type === "pin") {
        pinManager.removePin(id);
      } else if (annotation.type === "drawing") {
        drawingManager.removeDrawing(id);
      } else if (annotation.type === "recording" && ctx.recordingManager) {
        ctx.recordingManager.removeRecording(id);
      } else if (annotation.type === "session") {
        ctx.sessionManager.removeSession(id);
      }
      store.remove(id);
    });
    events.on("export", () => {
      exportAnnotations(store, getCrossPageAnnotations());
    });
    events.on("export:json", () => {
      exportJSON(store, getCrossPageAnnotations());
    });
    events.on("export:video", () => {
      exportVideo(store);
    });
    events.on("import", () => {
      importFromFile(ctx);
    });
    events.on("share", () => {
      shareAnnotations(store, getCrossPageAnnotations(), events);
    });
    function onHighlightClick(e) {
      const mark = e.target.closest?.(".ano-highlight");
      if (mark && mark.dataset.anoId) {
        e.stopPropagation();
        const rect = mark.getBoundingClientRect();
        popover.show(mark.dataset.anoId, rect);
        return;
      }
      if (ctx.mode === "navigate") {
        const drawing = drawingManager.hitTest(e.clientX, e.clientY);
        if (drawing) {
          e.stopPropagation();
          const rect = {
            x: e.clientX,
            y: e.clientY,
            top: e.clientY,
            left: e.clientX,
            bottom: e.clientY + 1,
            right: e.clientX + 1,
            width: 1,
            height: 1
          };
          popover.show(drawing.id, rect);
        }
      }
    }
    document.addEventListener("click", onHighlightClick, true);
    ctx._cleanupHighlightClick = () => {
      document.removeEventListener("click", onHighlightClick, true);
    };
  }

  // src/index.js
  var currentApi = null;
  function init2(options = {}) {
    currentApi = init(options);
    return currentApi;
  }
  function clear() {
    if (currentApi) currentApi.clear();
  }
  function destroy2() {
    destroy();
    currentApi = null;
  }
  function getAll() {
    return currentApi ? currentApi.getAll() : [];
  }
  function toJSON() {
    return currentApi ? currentApi.toJSON() : null;
  }
  function exportJSON2() {
    if (currentApi) return currentApi.export();
  }
  function importFile() {
    if (currentApi) return currentApi.importFile();
  }
  function importJSON(data) {
    if (currentApi) return currentApi.import(data);
  }
  function setMode(mode) {
    if (currentApi) currentApi.setMode(mode);
  }
  function startSession() {
    if (currentApi) currentApi.startSession();
  }
  function endSession() {
    if (currentApi) currentApi.endSession();
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=ano.js.map
