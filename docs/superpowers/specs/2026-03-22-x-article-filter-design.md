# X Article Filter Design

## Goal
Build a Firefox + Chrome extension that filters x.com so only X built-in Articles remain visible.

## Scope
Version 1 will:
- run everywhere on x.com where post items appear
- detect X Articles using explicit markers first, then fallback DOM heuristics
- hide or collapse non-article posts
- provide popup controls for enable/disable and hide/collapse mode
- provide a page-level "show all on this page" escape hatch
- persist settings locally

## Non-goals
- filtering based on quality metrics such as likes, length, or links
- server-side classification
- external APIs or telemetry

## Architecture
- `manifest.json`: MV3 WebExtension manifest with minimal permissions
- `src/content/main.js`: bootstrap, observer setup, SPA navigation handling
- `src/content/detector.js`: article classification logic
- `src/content/filter.js`: hide/collapse/apply/reset behavior
- `src/content/page-controls.js`: inject page-level show-all control
- `src/popup/*`: popup UI and settings wiring
- `src/shared/*`: storage and constants

## Detection strategy
Classifier order:
1. explicit X Article markers
2. resilient structural heuristics
3. fail closed when uncertain

Selectors and heuristics will be centralized to simplify maintenance when X changes markup.

## UX
Popup:
- filtering on/off
- mode: hide or collapse
- show all on this page

Page:
- non-articles are hidden or collapsed
- page-level bypass restores all filtered content for current page session

## Security
- minimal permissions only
- no remote requests
- no eval or dynamic remote code
- local storage only
- defensive DOM operations

## Testing
- manual checklist across home, profiles, search, lists, and replies
- detector testing against representative DOM fixtures where practical
- smoke-test in Firefox and Chrome
