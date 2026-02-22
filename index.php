<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ano — Web Annotation Library</title>
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
      <p class="text-xl text-zinc-500 mb-10 max-w-xl mx-auto">A zero-dependency web annotation library. Highlights, pins, freehand drawing, sessions, and export — all in a single script.</p>
      <div class="flex gap-4 justify-center flex-wrap">
        <a href="#embed" class="inline-flex items-center px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white font-medium rounded-lg transition-colors">Get Started</a>
        <a href="#bookmarklet" class="inline-flex items-center px-6 py-3 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-700 font-medium rounded-lg transition-colors shadow-sm">Bookmarklet</a>
      </div>
    </div>
  </section>

  <!-- Features -->
  <section class="py-16 px-6">
    <div class="max-w-5xl mx-auto">
      <h2 class="text-2xl font-semibold text-center mb-12">Features</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="border border-zinc-200 rounded-lg shadow-sm bg-white p-6">
          <div class="text-2xl mb-3">🖍</div>
          <h3 class="font-semibold mb-1">Highlights</h3>
          <p class="text-sm text-zinc-500">Select text to highlight with customizable colors. Highlights persist and re-anchor on page reload.</p>
        </div>
        <div class="border border-zinc-200 rounded-lg shadow-sm bg-white p-6">
          <div class="text-2xl mb-3">📌</div>
          <h3 class="font-semibold mb-1">Pins</h3>
          <p class="text-sm text-zinc-500">Click anywhere to drop a pin with a comment. Pins attach to DOM elements and reposition on scroll.</p>
        </div>
        <div class="border border-zinc-200 rounded-lg shadow-sm bg-white p-6">
          <div class="text-2xl mb-3">✏️</div>
          <h3 class="font-semibold mb-1">Freehand Drawing</h3>
          <p class="text-sm text-zinc-500">Draw directly on the page with a full-screen SVG canvas overlay. Configurable color and stroke width.</p>
        </div>
        <div class="border border-zinc-200 rounded-lg shadow-sm bg-white p-6">
          <div class="text-2xl mb-3">⏱</div>
          <h3 class="font-semibold mb-1">Sessions</h3>
          <p class="text-sm text-zinc-500">Group annotations into timed sessions. Track actions, pages visited, and optionally record video.</p>
        </div>
        <div class="border border-zinc-200 rounded-lg shadow-sm bg-white p-6">
          <div class="text-2xl mb-3">📤</div>
          <h3 class="font-semibold mb-1">Export &amp; Import</h3>
          <p class="text-sm text-zinc-500">Export all annotations as JSON. Import them back on any page to restore highlights, pins, and drawings.</p>
        </div>
        <div class="border border-zinc-200 rounded-lg shadow-sm bg-white p-6">
          <div class="text-2xl mb-3">📦</div>
          <h3 class="font-semibold mb-1">Zero Dependencies</h3>
          <p class="text-sm text-zinc-500">~39 KB minified. No frameworks, no build steps required. Just a single script tag to get started.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Embed -->
  <section id="embed" class="py-16 px-6">
    <div class="max-w-3xl mx-auto">
      <h2 class="text-2xl font-semibold mb-8">Embed on Your Site</h2>

      <h3 class="font-medium text-lg mb-3">1. Add the script</h3>
      <div class="relative mb-8" data-copy>
        <pre class="bg-zinc-900 text-zinc-100 rounded-lg p-5 text-sm overflow-x-auto"><code>&lt;script src="https://ano.phpless.digitalno.de/dist/ano.min.js"&gt;&lt;/script&gt;</code></pre>
        <button class="copy-btn" onclick="copySnippet(this)">Copy</button>
      </div>

      <h3 class="font-medium text-lg mb-3">2. Initialize</h3>
      <div class="relative mb-8" data-copy>
        <pre class="bg-zinc-900 text-zinc-100 rounded-lg p-5 text-sm overflow-x-auto"><code>Ano.init({
  highlightColor: '#fde047',
  pinColor: '#3b82f6',
  drawColor: '#ef4444',
  drawWidth: 3,
  shortcuts: true,
});</code></pre>
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
              <td class="px-5 py-3 text-zinc-500">End the current session and show the summary dialog.</td>
            </tr>
            <tr>
              <td class="px-5 py-3"><code class="text-sm bg-zinc-100 px-1.5 py-0.5 rounded">Ano.getAll()</code></td>
              <td class="px-5 py-3 text-zinc-500">Return all annotations as an array.</td>
            </tr>
            <tr>
              <td class="px-5 py-3"><code class="text-sm bg-zinc-100 px-1.5 py-0.5 rounded">Ano.toJSON()</code></td>
              <td class="px-5 py-3 text-zinc-500">Return annotations as a JSON-serializable export object.</td>
            </tr>
            <tr>
              <td class="px-5 py-3"><code class="text-sm bg-zinc-100 px-1.5 py-0.5 rounded">Ano.export()</code></td>
              <td class="px-5 py-3 text-zinc-500">Download annotations as a JSON file.</td>
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

  <!-- Bookmarklet -->
  <section id="bookmarklet" class="py-16 px-6 bg-white border-y border-zinc-200">
    <div class="max-w-3xl mx-auto">
      <h2 class="text-2xl font-semibold mb-2">Bookmarklet</h2>
      <p class="text-zinc-500 mb-8">Use Ano on any website without embedding. Drag the button below to your bookmarks bar.</p>

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

      <label class="block text-sm font-medium text-zinc-700 mb-2">Or copy the bookmarklet code</label>
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
        <h4 class="font-medium mb-3">How to use</h4>
        <ol class="list-decimal list-inside text-sm text-zinc-600 space-y-2">
          <li>Optionally change the URL above if you self-host <code class="bg-zinc-200 px-1.5 py-0.5 rounded text-xs">ano.min.js</code></li>
          <li>Drag the <strong>Ano</strong> button to your bookmarks bar, or copy the code and paste it as a new bookmark URL</li>
          <li>Visit any page and click the bookmarklet to start annotating</li>
          <li>Click it again to remove Ano from the page</li>
        </ol>
      </div>
    </div>
  </section>

  <!-- Keyboard Shortcuts -->
  <section class="py-16 px-6">
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
  <footer class="py-10 px-6 border-t border-zinc-200">
    <div class="max-w-3xl mx-auto text-center text-sm text-zinc-400">
      Ano — zero-dependency web annotation library
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
