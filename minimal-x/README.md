# minimal-x

A cross-browser WebExtension for Firefox and Chrome that reduces noise on X by showing **X built-in Articles** and **posts from your network**.

## Features

- Filters content across `x.com` and `twitter.com`
- Filters timeline rows directly to avoid leaving empty post shells behind
- Watches newly loaded posts and classifies them silently in batches
- Shows a clean empty state when no matching posts are available
- Uses a loading overlay on initial load/navigation
- Popup toggle for enabling/disabling filtering
- **Show all on this page** escape hatch in popup
- Floating **Scroll to top** button while scrolling
- Local-only settings storage
- No telemetry, no remote APIs, no external code

## How detection works

### Articles
The extension classifies content conservatively:
1. Looks for explicit built-in X Article markers
2. Falls back to structural heuristics
3. If uncertain, treats the item as **not** an article

### Network posts
Regular posts are shown when they are from accounts you follow or posts marked as followed by people you follow. Posts from accounts that only follow you are not included.

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
3. If something looks wrong, click **Show all on this page**

## Permissions

- `storage`: persist settings locally
- `tabs`: send popup actions to the active X tab
- Host permissions for `x.com` and `twitter.com` only

## Security

See [SECURITY.md](SECURITY.md).

## Known limitations

- Detection relies on X DOM structure and labels
- X may ship UI changes that break article detection
- Network label parsing on X is heuristic, so network mode is best-effort
