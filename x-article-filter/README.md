# X Article Filter

A cross-browser WebExtension for Firefox and Chrome that filters X so only **X built-in Articles** remain visible.

## Status

This is a v1 heuristic implementation. X changes its DOM frequently, so selectors may need periodic updates.

## Features

- Filters content across `x.com` and `twitter.com`
- Keeps only posts detected as **X Articles**
- Hides or collapses non-article posts
- Popup toggle for enabling/disabling filtering
- **Show all on this page** escape hatch
- Local-only settings storage
- No telemetry, no remote APIs, no external code

## How detection works

The extension classifies content conservatively:

1. Looks for explicit built-in X Article markers
2. Falls back to simple structural heuristics
3. If uncertain, treats the item as **not** an article

That means v1 prioritizes precision over recall: it may miss some real articles, but it should avoid letting many non-articles through.

## Install for development

### Firefox

1. Open `about:debugging`
2. Click **This Firefox**
3. Click **Load Temporary Add-on**
4. Select `x-article-filter/manifest.json`

### Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `x-article-filter` folder

## Use

1. Open X
2. Click the extension icon
3. Turn filtering on/off
4. Choose **Hide** or **Collapse** for non-article posts
5. If something looks wrong, click **Show all on this page**

## Permissions

- `storage`: persist settings locally
- `tabs`: send popup actions to the active X tab
- Host permissions for `x.com` and `twitter.com` only

## Security

See [SECURITY.md](SECURITY.md).

## Known limitations

- Detection relies on X DOM structure and labels
- X may ship UI changes that break article detection
- Some pages may render content differently than the main timeline

## Project structure

- `manifest.json` — extension manifest
- `popup.html` — popup UI
- `src/popup/popup.js` — popup logic
- `src/shared/storage.js` — storage helpers
- `src/content/detector.js` — article detection
- `src/content/filter.js` — hide/collapse logic
- `src/content/page-controls.js` — floating page control
- `src/content/main.js` — observer and orchestration
