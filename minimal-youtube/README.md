# minimal-youtube

```text
 /\_/\\
(=^.^=)
 (")(")

minimal.youtube
```

A cross-browser WebExtension for Firefox and Chrome that makes YouTube harder to drift through mindlessly.

## What it does

- replaces YouTube Home with a minimal pause screen and a Subscriptions link
- hides Shorts pages and Shorts surfaces across YouTube
- uses a cat/fastfetch-style in-page status view instead of a glossy modal card
- includes a popup toggle and a per-page escape hatch
- stores settings locally only
- ships with no telemetry, remote APIs, or external code

## UI direction

The extension aims for a restrained terminal feel:
- monospace-first
- low-noise copy
- ASCII mascot + status block
- no soft SaaS-style interruption cards

## Install for development

### Firefox
1. Open `about:debugging`
2. Click `This Firefox`
3. Click `Load Temporary Add-on`
4. Select `minimal-youtube/manifest.json`

### Chrome
1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select the `minimal-youtube` folder

## Package

From repo root:

```bash
./scripts/package-extension.sh minimal-youtube
```

Artifacts are written to `dist/` as `.zip` and `.xpi`.

## Use

1. Open YouTube
2. Click the extension icon
3. Toggle filtering on or off
4. If you need the full page temporarily, use `Show everything on this page`

## Permissions

- `storage` — persist settings locally
- `tabs` — send popup actions to the active YouTube tab
- host permissions for `youtube.com` only
