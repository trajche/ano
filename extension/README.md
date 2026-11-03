# Ano Browser Extension

A Chrome and Firefox extension that toggles [Ano](https://github.com/trajche/ano) on any page — testers report bugs visually, devs and AI get structured context to fix issues faster.

## Build

```bash
npm run build:ext
```

Outputs `dist/extension/chrome/`, `dist/extension/firefox/`, a zip for each, and `ano-source-<version>.zip` for AMO review. Other files in `dist/extension/` (e.g. signed `.xpi`) are kept. `extension/` is the Chrome source; the Firefox manifest is generated from it by `scripts/build-extension.mjs`.

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

- **Click the extension icon** on any page to activate Ano and start a session right away (video off)
- **End the session** and close the report to turn Ano off; click the icon again to start a new one
- **Click the icon during a session** to deactivate immediately (`Ano.destroy()`), without a report
- **Settings** (add-on Preferences/Options page): turn video on or off, and set a webhook URL
- Badge shows **ON** while active on the current tab; it clears when Ano turns off or the page navigates

## How it works

The extension injects the bundled `ano.min.js` (included in the package — no remote code) into every frame of the active tab via `scripting.executeScript()` and calls `Ano.init()` with `closeOnDismiss` on, then `Ano.startSession()` in the top frame. A click while Ano is active detects its DOM and calls `Ano.destroy()` in every frame. Closing the report destroys Ano and fires `ano:closed` on `window`, which a small relay in the isolated world forwards to the background script to clear the badge.

### Webhook

If a webhook URL is set, each session that ends with a video is POSTed there as `multipart/form-data`: `video` (.webm file) and `report` (the export JSON as a text field). The upload runs in the background script, so the site's CSP and CORS rules don't apply. The report dialog shows whether it succeeded.

### Permissions

- **activeTab** — access to the current tab only when you click the icon
- **scripting** — inject the Ano script into the page
- **storage** — save your settings
- **host_permissions `<all_urls>`** — needed to inject into cross-origin iframes on the page. In Firefox the user can revoke this in the add-on's settings; Ano then only runs in the top frame.

## Publishing to Firefox (AMO)

`ano.min.js` is minified, so AMO requires the source: upload `dist/extension/ano-source-<version>.zip` with build steps `npm ci && npm run build:ext`. Bump `version` in `extension/manifest.json` first — AMO rejects duplicates. Or sign from the CLI with `npx web-ext sign -s dist/extension/firefox --channel listed --upload-source-code dist/extension/ano-source-<version>.zip --api-key … --api-secret …`.
