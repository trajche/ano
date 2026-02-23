<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ano — Annotate, Export, Fix Faster</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            accent: { 500: '#3b82f6', 600: '#2563eb' },
          }
        }
      }
    }
  </script>
  <style>
    [data-copy] { position: relative; }
    .copy-btn {
      position: absolute; top: 12px; right: 12px;
      background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
      color: #a1a1aa; border-radius: 6px; padding: 4px 10px; font-size: 13px;
      cursor: pointer; transition: all 0.15s;
    }
    .copy-btn:hover { background: rgba(255,255,255,0.15); color: #e4e4e7; }
    .copy-btn.copied { color: #4ade80; }
  </style>
</head>
<body class="bg-zinc-50 text-zinc-900 antialiased">

  <!-- Hero -->
  <section class="py-24 px-6 text-center">
    <div class="max-w-3xl mx-auto">
      <h1 class="text-5xl font-bold tracking-tight mb-4">Ano</h1>
      <p class="text-xl text-zinc-500 mb-4 max-w-xl mx-auto">Annotate any webpage. Export structured context that developers and LLMs can act on — fix bugs faster.</p>
      <p class="text-sm text-zinc-400 mb-10 max-w-lg mx-auto">Highlights, pins, drawings, video recording, and sessions — all in a single zero-dependency script. The output is structured JSON designed to be pasted into a ticket or an LLM chat.</p>
      <div class="flex gap-4 justify-center flex-wrap">
        <a href="#bookmarklet" class="inline-flex items-center px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white font-medium rounded-lg transition-colors">Get Started</a>
        <a href="https://github.com/trajche/ano" target="_blank" class="inline-flex items-center px-6 py-3 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-700 font-medium rounded-lg transition-colors shadow-sm">GitHub</a>
      </div>
    </div>
  </section>

  <!-- How to integrate -->
  <section class="py-16 px-6">
    <div class="max-w-3xl mx-auto">
      <h2 class="text-2xl font-semibold text-center mb-3">Three Ways to Use Ano</h2>
      <p class="text-center text-zinc-500 mb-12 max-w-lg mx-auto">Choose the integration that fits your workflow. All three produce the same structured JSON output.</p>
    </div>
  </section>

  <!-- 1. Bookmarklet -->
  <section id="bookmarklet" class="py-16 px-6 bg-white border-y border-zinc-200">
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center gap-3 mb-2">
        <span class="flex items-center justify-center w-8 h-8 rounded-full bg-accent-500 text-white text-sm font-bold">1</span>
        <h2 class="text-2xl font-semibold">Bookmarklet</h2>
      </div>
      <p class="text-zinc-500 mb-8">Use Ano on any website — no code changes needed. Drag the button to your bookmarks bar, or paste the code in your browser console.</p>

      <label class="block text-sm font-medium text-zinc-700 mb-2" for="bm-url">ano.min.js URL</label>
      <input
        id="bm-url"
        type="url"
        value="https://ano.phpless.digitalno.de/dist/ano.min.js"
        spellcheck="false"
        class="w-full px-4 py-2.5 border border-zinc-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 mb-6"
      >

      <div class="flex items-center gap-4 mb-6">
        <a id="bm-link" class="inline-flex items-center px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white font-medium rounded-lg transition-colors cursor-grab active:cursor-grabbing shadow-sm" href="#">Ano</a>
        <span class="text-sm text-zinc-400">Drag this to your bookmarks bar</span>
      </div>

      <label class="block text-sm font-medium text-zinc-700 mb-2">Or copy and paste into your browser console</label>
      <div class="flex gap-2 mb-6">
        <input
          id="bm-code"
          type="text"
          readonly
          class="flex-1 px-4 py-2.5 border border-zinc-300 rounded-lg font-mono text-xs bg-zinc-50 text-zinc-600 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
        >
        <button onclick="copyBookmarklet()" id="bm-copy-btn" class="px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap">Copy</button>
      </div>

      <div class="bg-zinc-50 border border-zinc-200 rounded-lg p-5">
        <h4 class="font-medium mb-3">How it works</h4>
        <ol class="list-decimal list-inside text-sm text-zinc-600 space-y-2">
          <li>Drag the <strong>Ano</strong> button to your bookmarks bar, or copy the code above</li>
          <li>Visit any page and click the bookmarklet (or paste the code in DevTools console)</li>
          <li>Annotate the issue — highlight text, pin elements, draw, record video</li>
          <li>Export JSON or get a shareable link to hand off to a developer or paste into an LLM</li>
          <li>Click the bookmarklet again to remove Ano from the page</li>
        </ol>
      </div>
    </div>
  </section>

  <!-- 2. Embed -->
  <section id="embed" class="py-16 px-6">
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center gap-3 mb-2">
        <span class="flex items-center justify-center w-8 h-8 rounded-full bg-accent-500 text-white text-sm font-bold">2</span>
        <h2 class="text-2xl font-semibold">Embed in Your Website</h2>
      </div>
      <p class="text-zinc-500 mb-8">Add Ano to your site behind a secret URL parameter. Regular users never see it — QA, testers, or support can activate it by appending <code class="bg-zinc-200 px-1.5 py-0.5 rounded text-xs">?ano=1</code> to any page.</p>

      <h3 class="font-medium text-lg mb-3">Add this snippet to your layout</h3>
      <div class="relative mb-8" data-copy>
        <pre class="bg-zinc-900 text-zinc-100 rounded-lg p-5 text-sm overflow-x-auto leading-relaxed"><code>&lt;script&gt;
if (new URLSearchParams(location.search).has('ano')) {
  var s = document.createElement('script');
  s.src = 'https://ano.phpless.digitalno.de/dist/ano.min.js';
  s.onload = function () { Ano.init(); };
  document.head.appendChild(s);
}
&lt;/script&gt;</code></pre>
        <button class="copy-btn" onclick="copySnippet(this)">Copy</button>
      </div>

      <div class="bg-zinc-50 border border-zinc-200 rounded-lg p-5 mb-8">
        <h4 class="font-medium mb-3">How it works</h4>
        <ol class="list-decimal list-inside text-sm text-zinc-600 space-y-2">
          <li>The snippet checks for <code class="bg-zinc-200 px-1.5 py-0.5 rounded text-xs">?ano=1</code> in the URL — if absent, nothing loads</li>
          <li>Share a link like <code class="bg-zinc-200 px-1.5 py-0.5 rounded text-xs">https://yoursite.com/page?ano=1</code> with your team</li>
          <li>They annotate the issue and export or share the structured report</li>
          <li>Use a different param name for extra obscurity, e.g. <code class="bg-zinc-200 px-1.5 py-0.5 rounded text-xs">?debug</code> or <code class="bg-zinc-200 px-1.5 py-0.5 rounded text-xs">?feedback</code></li>
        </ol>
      </div>

      <h3 class="font-medium text-lg mb-3">Or always-on (for internal/staging sites)</h3>
      <div class="relative mb-8" data-copy>
        <pre class="bg-zinc-900 text-zinc-100 rounded-lg p-5 text-sm overflow-x-auto leading-relaxed"><code>&lt;script src="https://ano.phpless.digitalno.de/dist/ano.min.js"&gt;&lt;/script&gt;
&lt;script&gt;Ano.init();&lt;/script&gt;</code></pre>
        <button class="copy-btn" onclick="copySnippet(this)">Copy</button>
      </div>

      <h3 class="font-medium text-lg mb-4">Options</h3>
      <div class="border border-zinc-200 rounded-lg shadow-sm bg-white overflow-hidden mb-10">
        <table class="w-full text-sm">
          <thead class="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th class="text-left px-5 py-3 font-medium text-zinc-600">Option</th>
              <th class="text-left px-5 py-3 font-medium text-zinc-600">Default</th>
              <th class="text-left px-5 py-3 font-medium text-zinc-600">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100">
            <tr>
              <td class="px-5 py-3"><code class="text-sm bg-zinc-100 px-1.5 py-0.5 rounded">highlightColor</code></td>
              <td class="px-5 py-3 text-zinc-500"><code>#fde047</code></td>
              <td class="px-5 py-3 text-zinc-500">Default highlight color</td>
            </tr>
            <tr>
              <td class="px-5 py-3"><code class="text-sm bg-zinc-100 px-1.5 py-0.5 rounded">pinColor</code></td>
              <td class="px-5 py-3 text-zinc-500"><code>#3b82f6</code></td>
              <td class="px-5 py-3 text-zinc-500">Default pin color</td>
            </tr>
            <tr>
              <td class="px-5 py-3"><code class="text-sm bg-zinc-100 px-1.5 py-0.5 rounded">drawColor</code></td>
              <td class="px-5 py-3 text-zinc-500"><code>#ef4444</code></td>
              <td class="px-5 py-3 text-zinc-500">Drawing stroke color</td>
            </tr>
            <tr>
              <td class="px-5 py-3"><code class="text-sm bg-zinc-100 px-1.5 py-0.5 rounded">drawWidth</code></td>
              <td class="px-5 py-3 text-zinc-500"><code>3</code></td>
              <td class="px-5 py-3 text-zinc-500">Drawing stroke width in pixels</td>
            </tr>
            <tr>
              <td class="px-5 py-3"><code class="text-sm bg-zinc-100 px-1.5 py-0.5 rounded">shortcuts</code></td>
              <td class="px-5 py-3 text-zinc-500"><code>true</code></td>
              <td class="px-5 py-3 text-zinc-500">Enable keyboard shortcuts</td>
            </tr>
            <tr>
              <td class="px-5 py-3"><code class="text-sm bg-zinc-100 px-1.5 py-0.5 rounded">videoRecording</code></td>
              <td class="px-5 py-3 text-zinc-500"><code>false</code></td>
              <td class="px-5 py-3 text-zinc-500">Enable video recording during sessions</td>
            </tr>
            <tr>
              <td class="px-5 py-3"><code class="text-sm bg-zinc-100 px-1.5 py-0.5 rounded">sessionMaxDuration</code></td>
              <td class="px-5 py-3 text-zinc-500"><code>300000</code></td>
              <td class="px-5 py-3 text-zinc-500">Max session duration in ms (5 min)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="font-medium text-lg mb-4">API Reference</h3>
      <div class="border border-zinc-200 rounded-lg shadow-sm bg-white overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th class="text-left px-5 py-3 font-medium text-zinc-600">Method</th>
              <th class="text-left px-5 py-3 font-medium text-zinc-600">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100">
            <tr>
              <td class="px-5 py-3"><code class="text-sm bg-zinc-100 px-1.5 py-0.5 rounded">Ano.init(options)</code></td>
              <td class="px-5 py-3 text-zinc-500">Initialize Ano with optional config. Returns the API object.</td>
            </tr>
            <tr>
              <td class="px-5 py-3"><code class="text-sm bg-zinc-100 px-1.5 py-0.5 rounded">Ano.destroy()</code></td>
              <td class="px-5 py-3 text-zinc-500">Remove Ano entirely from the page and clean up all listeners.</td>
            </tr>
            <tr>
              <td class="px-5 py-3"><code class="text-sm bg-zinc-100 px-1.5 py-0.5 rounded">Ano.setMode(mode)</code></td>
              <td class="px-5 py-3 text-zinc-500">Switch mode: <code>'highlight'</code>, <code>'pin'</code>, <code>'draw'</code>, or <code>'navigate'</code>.</td>
            </tr>
            <tr>
              <td class="px-5 py-3"><code class="text-sm bg-zinc-100 px-1.5 py-0.5 rounded">Ano.startSession()</code></td>
              <td class="px-5 py-3 text-zinc-500">Start a new annotation session.</td>
            </tr>
            <tr>
              <td class="px-5 py-3"><code class="text-sm bg-zinc-100 px-1.5 py-0.5 rounded">Ano.endSession()</code></td>
              <td class="px-5 py-3 text-zinc-500">End the current session and show the report dialog.</td>
            </tr>
            <tr>
              <td class="px-5 py-3"><code class="text-sm bg-zinc-100 px-1.5 py-0.5 rounded">Ano.getAll()</code></td>
              <td class="px-5 py-3 text-zinc-500">Return all annotations as an array.</td>
            </tr>
            <tr>
              <td class="px-5 py-3"><code class="text-sm bg-zinc-100 px-1.5 py-0.5 rounded">Ano.toJSON()</code></td>
              <td class="px-5 py-3 text-zinc-500">Return structured export object — paste into an LLM or save to a file.</td>
            </tr>
            <tr>
              <td class="px-5 py-3"><code class="text-sm bg-zinc-100 px-1.5 py-0.5 rounded">Ano.export()</code></td>
              <td class="px-5 py-3 text-zinc-500">Download annotations as JSON + video files.</td>
            </tr>
            <tr>
              <td class="px-5 py-3"><code class="text-sm bg-zinc-100 px-1.5 py-0.5 rounded">Ano.share()</code></td>
              <td class="px-5 py-3 text-zinc-500">Upload annotations and video to a shareable link.</td>
            </tr>
            <tr>
              <td class="px-5 py-3"><code class="text-sm bg-zinc-100 px-1.5 py-0.5 rounded">Ano.import(data)</code></td>
              <td class="px-5 py-3 text-zinc-500">Import annotations from a JSON object.</td>
            </tr>
            <tr>
              <td class="px-5 py-3"><code class="text-sm bg-zinc-100 px-1.5 py-0.5 rounded">Ano.importFile()</code></td>
              <td class="px-5 py-3 text-zinc-500">Open a file picker to import a JSON file.</td>
            </tr>
            <tr>
              <td class="px-5 py-3"><code class="text-sm bg-zinc-100 px-1.5 py-0.5 rounded">Ano.clear()</code></td>
              <td class="px-5 py-3 text-zinc-500">Remove all annotations from the current page.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- 3. Chrome Extension -->
  <section id="extension" class="py-16 px-6 bg-white border-y border-zinc-200">
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center gap-3 mb-2">
        <span class="flex items-center justify-center w-8 h-8 rounded-full bg-accent-500 text-white text-sm font-bold">3</span>
        <h2 class="text-2xl font-semibold">Chrome Extension</h2>
      </div>
      <p class="text-zinc-500 mb-8">One-click toggle on any page. Click the icon to activate Ano, click again to remove it. Badge shows when active.</p>

      <div class="border border-zinc-200 rounded-lg shadow-sm bg-white p-6 mb-6">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-zinc-500"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M14 9h3"/><path d="M14 13h3"/></svg>
          </div>
          <div class="flex-1">
            <h3 class="font-semibold mb-1">Ano for Chrome</h3>
            <p class="text-sm text-zinc-500 mb-4">Toggle annotations on any tab. No setup needed — works instantly on every page.</p>
            <div class="flex gap-3 flex-wrap">
              <a href="https://github.com/trajche/ano/tree/main/extension" target="_blank" class="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                View on GitHub
              </a>
              <span class="inline-flex items-center px-4 py-2 bg-zinc-100 text-zinc-500 text-sm rounded-lg">Chrome Web Store — coming soon</span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-zinc-50 border border-zinc-200 rounded-lg p-5">
        <h4 class="font-medium mb-3">Install from source</h4>
        <ol class="list-decimal list-inside text-sm text-zinc-600 space-y-2">
          <li>Clone the repo and open <code class="bg-zinc-200 px-1.5 py-0.5 rounded text-xs">chrome://extensions</code></li>
          <li>Enable <strong>Developer mode</strong> (top-right toggle)</li>
          <li>Click <strong>Load unpacked</strong> and select the <code class="bg-zinc-200 px-1.5 py-0.5 rounded text-xs">extension/</code> folder</li>
          <li>Click the extension icon on any page to toggle Ano on/off</li>
        </ol>
      </div>
    </div>
  </section>

  <!-- Features -->
  <section class="py-16 px-6">
    <div class="max-w-5xl mx-auto">
      <h2 class="text-2xl font-semibold text-center mb-3">What Gets Captured</h2>
      <p class="text-center text-zinc-500 mb-12 max-w-lg mx-auto">Every annotation captures structured context — selectors, DOM info, viewport, environment — so a developer or LLM has everything needed to reproduce and fix the issue.</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="border border-zinc-200 rounded-lg shadow-sm bg-white p-6">
          <h3 class="font-semibold mb-1">Highlights</h3>
          <p class="text-sm text-zinc-500">Select the exact text that's wrong. Export includes the quote, text-position selectors, and surrounding context.</p>
        </div>
        <div class="border border-zinc-200 rounded-lg shadow-sm bg-white p-6">
          <h3 class="font-semibold mb-1">Pins</h3>
          <p class="text-sm text-zinc-500">Pin any element with a note. Captures the CSS selector and DOM metadata so a dev or LLM can locate it.</p>
        </div>
        <div class="border border-zinc-200 rounded-lg shadow-sm bg-white p-6">
          <h3 class="font-semibold mb-1">Drawings</h3>
          <p class="text-sm text-zinc-500">Circle areas or draw arrows. Stroke data and viewport dimensions are included in the export.</p>
        </div>
        <div class="border border-zinc-200 rounded-lg shadow-sm bg-white p-6">
          <h3 class="font-semibold mb-1">Video Recording</h3>
          <p class="text-sm text-zinc-500">Record the issue as a video. Upload it alongside the JSON when sharing, or export as a separate .webm file.</p>
        </div>
        <div class="border border-zinc-200 rounded-lg shadow-sm bg-white p-6">
          <h3 class="font-semibold mb-1">Sessions</h3>
          <p class="text-sm text-zinc-500">Group annotations into timed sessions that track clicks, navigation, console errors, and page transitions.</p>
        </div>
        <div class="border border-zinc-200 rounded-lg shadow-sm bg-white p-6">
          <h3 class="font-semibold mb-1">Environment</h3>
          <p class="text-sm text-zinc-500">Browser, OS, screen resolution, viewport size, timezone, language, connection speed — captured automatically.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Keyboard Shortcuts -->
  <section class="py-16 px-6 bg-white border-y border-zinc-200">
    <div class="max-w-3xl mx-auto">
      <h2 class="text-2xl font-semibold mb-8">Keyboard Shortcuts</h2>
      <div class="border border-zinc-200 rounded-lg shadow-sm bg-white overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th class="text-left px-5 py-3 font-medium text-zinc-600">Shortcut</th>
              <th class="text-left px-5 py-3 font-medium text-zinc-600">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100">
            <tr>
              <td class="px-5 py-3"><kbd class="bg-zinc-100 border border-zinc-200 rounded px-2 py-0.5 text-xs font-mono">Alt + H</kbd></td>
              <td class="px-5 py-3 text-zinc-500">Highlight mode</td>
            </tr>
            <tr>
              <td class="px-5 py-3"><kbd class="bg-zinc-100 border border-zinc-200 rounded px-2 py-0.5 text-xs font-mono">Alt + P</kbd></td>
              <td class="px-5 py-3 text-zinc-500">Pin mode</td>
            </tr>
            <tr>
              <td class="px-5 py-3"><kbd class="bg-zinc-100 border border-zinc-200 rounded px-2 py-0.5 text-xs font-mono">Alt + D</kbd></td>
              <td class="px-5 py-3 text-zinc-500">Drawing mode</td>
            </tr>
            <tr>
              <td class="px-5 py-3"><kbd class="bg-zinc-100 border border-zinc-200 rounded px-2 py-0.5 text-xs font-mono">Alt + N</kbd></td>
              <td class="px-5 py-3 text-zinc-500">Navigate mode (deselect tool)</td>
            </tr>
            <tr>
              <td class="px-5 py-3"><kbd class="bg-zinc-100 border border-zinc-200 rounded px-2 py-0.5 text-xs font-mono">Alt + S</kbd></td>
              <td class="px-5 py-3 text-zinc-500">Start / end session</td>
            </tr>
            <tr>
              <td class="px-5 py-3"><kbd class="bg-zinc-100 border border-zinc-200 rounded px-2 py-0.5 text-xs font-mono">Alt + E</kbd></td>
              <td class="px-5 py-3 text-zinc-500">Export annotations</td>
            </tr>
            <tr>
              <td class="px-5 py-3"><kbd class="bg-zinc-100 border border-zinc-200 rounded px-2 py-0.5 text-xs font-mono">Esc</kbd></td>
              <td class="px-5 py-3 text-zinc-500">Close popover / end session / dismiss dialog</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="py-10 px-6">
    <div class="max-w-3xl mx-auto text-center text-sm text-zinc-400">
      Ano — annotate, export, fix faster
    </div>
  </footer>

  <script>
    // Bookmarklet URL updater
    (function () {
      var urlInput = document.getElementById('bm-url');
      var link = document.getElementById('bm-link');
      var codeInput = document.getElementById('bm-code');

      function buildBookmarklet(url) {
        return "javascript:void((function(){if(window.Ano){Ano.destroy();return}var s=document.createElement('script');s.src='" + encodeURI(url) + "';s.onload=function(){Ano.init({mode:'navigate'})};document.head.appendChild(s)})())";
      }

      function update() {
        var bm = buildBookmarklet(urlInput.value.trim());
        link.href = bm;
        codeInput.value = bm;
      }

      urlInput.addEventListener('input', update);
      update();
    })();

    function copyBookmarklet() {
      var codeInput = document.getElementById('bm-code');
      var btn = document.getElementById('bm-copy-btn');
      navigator.clipboard.writeText(codeInput.value).then(function () {
        btn.textContent = 'Copied!';
        setTimeout(function () { btn.textContent = 'Copy'; }, 2000);
      });
    }

    // Copy snippet buttons
    function copySnippet(btn) {
      var code = btn.closest('[data-copy]').querySelector('code');
      var text = code.textContent;
      navigator.clipboard.writeText(text).then(function () {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(function () {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 2000);
      });
    }
  </script>
</body>
</html>
