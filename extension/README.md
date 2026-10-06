# Ano Browser Extension

A Chrome and Firefox extension that toggles [Ano](https://github.com/trajche/ano) on any page — testers report bugs visually, devs and AI get structured context to fix issues faster.

## Build

```bash
npm run build:ext
```

Outputs `dist/extension/chrome/`, `dist/extension/firefox/` and a zip for each. `extension/` is the Chrome source; the Firefox manifest is generated from it by `scripts/build-extension.mjs`.

## Install (development)

**Chrome**

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select `extension/` (or `dist/extension/chrome/`)

**Firefox** (140+)

1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…** → select `dist/extension/firefox/manifest.json`

Or run `npx web-ext run -s dist/extension/firefox`.

## Usage

- **Click the extension icon** on any page to activate Ano
- **Click again** to deactivate (`Ano.destroy()`)
- Badge shows **ON** when active on the current tab; it clears when the page navigates

## How it works

The extension injects the bundled `ano.min.js` (included in the package — no remote code) into every frame of the active tab via `scripting.executeScript()` and calls `Ano.init({ mode: 'navigate' })`. On subsequent clicks it detects Ano's DOM and calls `Ano.destroy()` in every frame.

### Permissions

- **activeTab** — access to the current tab only when you click the icon
- **scripting** — inject the Ano script into the page
- **host_permissions `<all_urls>`** — needed to inject into cross-origin iframes on the page. In Firefox the user can revoke this in the add-on's settings; Ano then only runs in the top frame.

## Publishing to Firefox (AMO)

`ano.min.js` is minified, so AMO requires the source: upload a zip of the repo (without `node_modules/`) with build steps `npm ci && npm run build:ext`. Or sign from the CLI with `npx web-ext sign -s dist/extension/firefox --channel listed --api-key … --api-secret …`.
