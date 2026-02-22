export function importFromFile(ctx) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) {
        input.remove();
        resolve({ success: false, error: 'No file selected' });
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

export function importData(ctx, data) {
  if (!data || !data.annotations || !Array.isArray(data.annotations)) {
    return { success: false, error: 'Invalid annotation data' };
  }

  const { store, highlightManager, pinManager, drawingManager } = ctx;
  const results = { imported: 0, orphaned: 0, orphans: [] };

  for (const raw of data.annotations) {
    // Unpack _anchoring back onto top-level fields for re-anchoring
    const ann = { ...raw };
    if (ann._anchoring) {
      Object.assign(ann, ann._anchoring);
      delete ann._anchoring;
    }
    const annotation = store.add(ann);

    let anchored = false;
    if (annotation.type === 'highlight') {
      anchored = highlightManager.applyHighlight(annotation);
    } else if (annotation.type === 'pin') {
      anchored = pinManager.applyPin(annotation);
    } else if (annotation.type === 'drawing') {
      anchored = drawingManager.applyDrawing(annotation);
    } else if (annotation.type === 'recording') {
      // Recordings are always considered anchored (region-based, no DOM target)
      anchored = true;
    } else if (annotation.type === 'session') {
      // Sessions are always anchored (no DOM target)
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
