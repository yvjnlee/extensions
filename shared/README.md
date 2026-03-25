# Shared UI Notes

This folder is the source-of-truth for cross-extension ASCII/UI direction.

Why this is not imported directly at runtime:
- Firefox/Chrome unpacked extensions are loaded from each extension folder (`minimal-x/`, `minimal-youtube/`)
- content scripts and popups cannot safely reference files outside that folder without introducing a build/sync step

So for now this folder is a shared design/source folder, not a runtime dependency.

## Current shared direction

- fastfetch/neofetch-style status layouts
- monospace-first UI
- no floating SaaS cards for in-page interruption states
- cute but restrained cat mascot
- one clear action line

## Shared cat

```text
 /\\_/\\
(=^.^=)
 (")(")
```

## Shared status layout

```text
minimal.name
────────────
site:     example.com
module:   home feed
status:   paused
next:     subscriptions
```
