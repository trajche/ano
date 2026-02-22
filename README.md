# Ano

Zero-dependency web annotation library. Highlights, pins, freehand drawing, sessions, and JSON export — all in a single script (~66 KB).

## Quick Start

```html
<script src="https://ano.phpless.digitalno.de/dist/ano.min.js"></script>
<script>
  Ano.init();
</script>
```

## Features

- **Highlights** — Select text to highlight with customizable colors
- **Pins** — Click anywhere to drop a pin with a comment
- **Freehand Drawing** — Draw on the page with an SVG canvas overlay
- **Sessions** — Group annotations into timed sessions with optional video recording
- **Export / Import** — Save and restore annotations as JSON
- **Zero Dependencies** — No frameworks, no build steps required

## Options

```js
Ano.init({
  highlightColor: '#fde047',
  pinColor: '#3b82f6',
  drawColor: '#ef4444',
  drawWidth: 3,
  shortcuts: true,
  videoRecording: false,
  sessionMaxDuration: 300000,
});
```

## API

| Method | Description |
|---|---|
| `Ano.init(options)` | Initialize with optional config |
| `Ano.destroy()` | Remove Ano and clean up |
| `Ano.setMode(mode)` | Switch to `'highlight'`, `'pin'`, `'draw'`, or `'navigate'` |
| `Ano.startSession()` | Start an annotation session |
| `Ano.endSession()` | End the current session |
| `Ano.getAll()` | Return all annotations as an array |
| `Ano.toJSON()` | Return annotations as a serializable object |
| `Ano.export()` | Download annotations as a JSON file |
| `Ano.import(data)` | Import annotations from a JSON object |
| `Ano.importFile()` | Open a file picker to import JSON |
| `Ano.clear()` | Remove all annotations |

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Alt + H` | Highlight mode |
| `Alt + P` | Pin mode |
| `Alt + D` | Drawing mode |
| `Alt + N` | Navigate mode |
| `Alt + S` | Start / end session |
| `Alt + E` | Export annotations |
| `Esc` | Close popover / end session |

## Bookmarklet

Use Ano on any website without embedding. Visit [ano.phpless.digitalno.de](https://ano.phpless.digitalno.de/#bookmarklet) to set up the bookmarklet.

## Build

```bash
npm install
npm run build    # dist/ano.js + dist/ano.min.js
npm run dev      # watch mode
```

## License

MIT
