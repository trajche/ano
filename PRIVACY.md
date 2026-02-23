# Privacy Policy — Ano

**Last updated:** February 23, 2026

## Overview

Ano is a browser-based bug reporting tool. It runs entirely in your browser — no data is collected, stored, or transmitted to us.

## Data Collection

Ano does **not** collect, track, or transmit any personal data. Specifically:

- No analytics or telemetry
- No cookies set by Ano
- No user accounts or sign-ups
- No data sent to our servers

## What Stays in Your Browser

All annotations (highlights, pins, drawings, comments) are stored in your browser's `localStorage`. This data never leaves your device unless you explicitly choose to export or share it.

## Export and Share

When you use the **Export** feature, a JSON file is downloaded to your local machine. The file contains your annotations and basic environment metadata (browser, screen size, timezone) to help developers reproduce issues.

When you use the **Get Link** feature, your annotation data (and optional video recording) is uploaded to `share.mk` via the TUS protocol. The uploaded files expire after 7 days. We do not control or operate the share.mk service — refer to their privacy policy for details.

## Environment Metadata

When exporting, Ano captures technical context to help with debugging:

- Browser user agent and platform
- Screen resolution and viewport size
- Language and timezone
- Connection type (if available)

This data is included in the exported JSON only. It is not sent anywhere unless you explicitly share the export.

## Chrome Extension

The Ano Chrome extension requires two permissions:

- **activeTab** — to detect if Ano is active on the current tab when you click the icon
- **scripting** — to inject the bundled Ano script into the active tab

The extension does not access any tabs in the background, does not run persistently, and does not communicate with any external servers.

## Third Parties

Ano has zero dependencies and does not include any third-party tracking, analytics, or advertising libraries.

## Changes

If this policy changes, we will update the "Last updated" date above. Continued use of Ano after changes constitutes acceptance.

## Contact

For questions about this policy, open an issue at [github.com/trajche/ano](https://github.com/trajche/ano/issues).
