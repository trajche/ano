import * as api from './api.js';

let currentApi = null;

function init(options = {}) {
  currentApi = api.init(options);
  return currentApi;
}

function clear() {
  if (currentApi) currentApi.clear();
}

function destroy() {
  api.destroy();
  currentApi = null;
}

function getAll() {
  return currentApi ? currentApi.getAll() : [];
}

function toJSON() {
  return currentApi ? currentApi.toJSON() : null;
}

function exportJSON() {
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

// Use object export so we can use reserved words as property names
// esbuild IIFE with globalName will expose this as window.Ano
export {
  init,
  clear,
  destroy,
  getAll,
  toJSON,
  exportJSON as export,
  importFile,
  importJSON as import,
  setMode,
  startSession,
  endSession,
};
