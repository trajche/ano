# Ano Chrome Extension

A Chrome extension that toggles [Ano](https://ano.phpless.digitalno.de) on any page — testers report bugs visually, devs and AI get structured context to fix issues faster.

## Install

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select this `extension/` folder

## Usage

- **Click the extension icon** on any page to activate Ano
- **Click again** to deactivate (`Ano.destroy()`)
- Badge shows **ON** when active on the current tab

## How it works

The extension injects `ano.min.js` from the CDN into the active tab and calls `Ano.init({ mode: 'navigate' })`. On subsequent clicks it detects `window.Ano` and calls `Ano.destroy()` to tear down — simple toggle behavior, same as the bookmarklet.

### Permissions

- **activeTab** — access to the current tab only when you click the icon
- **scripting** — inject the Ano script into the page
