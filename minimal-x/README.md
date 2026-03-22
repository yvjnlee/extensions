# minimal-x

A cross-browser WebExtension for Firefox and Chrome that reduces noise on X by showing only **X built-in Articles** or, optionally, **strict high-signal posts**.

## Features

- Filters content across `x.com` and `twitter.com`
- Feed modes:
  - **Articles only**
  - **Articles + quality posts**
- Fully hides filtered posts
- Aggressively pre-hides feed rows until classified, then reveals only allowed content
- Filters the outer timeline row so X does not leave large empty post shells behind
- Once a post is filtered, it stays hidden for the page session unless you click **Show all on this page**
- After the initial pass, new filtering batches only run when you use X's own “show more posts” style controls or navigate to a new page
- Shows a clean empty state when no matching posts are available
- Uses a loading overlay on initial load/navigation to reduce scrollbar jitter during X re-renders
- Popup toggle for enabling/disabling filtering
- **Show all on this page** escape hatch
- Local-only settings storage
- No telemetry, no remote APIs, no external code

## How detection works

### Articles
The extension classifies content conservatively:
1. Looks for explicit built-in X Article markers
2. Falls back to structural heuristics
3. If uncertain, treats the item as **not** an article

### Quality posts
In quality mode, regular posts must pass a strict score based on:
- substance and length
- engagement signals
- source quality hints
- penalties for replies and spammy patterns

## Install for development

### Firefox
1. Open `about:debugging`
2. Click **This Firefox**
3. Click **Load Temporary Add-on**
4. Select `minimal-x/manifest.json`

### Chrome
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `minimal-x` folder

## Package it

From repo root:

```bash
./scripts/package-extension.sh minimal-x
```

Artifacts are written to `dist/` as `.zip` and `.xpi`.

## Use

1. Open X
2. Click the extension icon
3. Choose **Articles only** or **+ Quality posts**
4. If something looks wrong, click **Show all on this page**

## Permissions

- `storage`: persist settings locally
- `tabs`: send popup actions to the active X tab
- Host permissions for `x.com` and `twitter.com` only

## Security

See [SECURITY.md](SECURITY.md).

## Known limitations

- Detection relies on X DOM structure and labels
- X may ship UI changes that break article detection
- Engagement parsing on X is heuristic, so quality mode is best-effort
