# minimal-x

```text
 /\_/\\
(=^.^=)
 (")(")

minimal.x
```

A cross-browser WebExtension for Firefox and Chrome that makes X less chaotic while keeping the currently working feed filter intact.

## What it does

- filters content on `x.com` and `twitter.com`
- keeps the existing content-filtering behavior that is currently working for you
- adds a cat/fastfetch-style popup and in-page status UI
- removes some of the more app-like visual chrome in favor of a terminal-ish look
- includes a popup toggle and a per-page escape hatch
- stores settings locally only
- ships with no telemetry, remote APIs, or external code

## UI direction

The extension now leans into a restrained terminal feel:
- monospace-first
- fastfetch-style status blocks
- ASCII cat mascot
- less glossy overlay/empty-state styling

## Install for development

### Firefox
1. Open `about:debugging`
2. Click `This Firefox`
3. Click `Load Temporary Add-on`
4. Select `minimal-x/manifest.json`

### Chrome
1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select the `minimal-x` folder

## Package

From repo root:

```bash
./scripts/package-extension.sh minimal-x
```

Artifacts are written to `dist/` as `.zip` and `.xpi`.

## Use

1. Open X Home
2. Click the extension icon
3. Toggle filtering on or off
4. If the page looks wrong, use `Show everything on this page`

## Permissions

- `storage` — persist settings locally
- `tabs` — send popup actions to the active X tab
- host permissions for `x.com` and `twitter.com` only

## Security

See [SECURITY.md](SECURITY.md).

## Known limitations

- filtering behavior is intentionally left close to the currently working baseline
- detection depends on X DOM structure and labels
- X can ship UI changes that break parts of the filter
