(function () {
  const FILTERED_ATTR = 'data-x-article-filtered';
  const PENDING_ATTR = 'data-x-article-pending';
  const STYLE_ID = 'x-article-filter-style';
  const OVERLAY_ID = 'x-article-filter-overlay';
  const EMPTY_STATE_ID = 'x-article-filter-empty-state';

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      [${PENDING_ATTR}="true"] {
        display: none !important;
      }
      [${FILTERED_ATTR}="hide"] {
        visibility: hidden !important;
        pointer-events: none !important;
      }
      .x-article-filter-control {
        position: fixed;
        right: 16px;
        bottom: 16px;
        z-index: 2147483647;
      }
      .x-article-filter-control button {
        border: none;
        border-radius: 999px;
        padding: 10px 14px;
        background: #1d9bf0;
        color: white;
        font: 600 13px/1 system-ui, sans-serif;
        box-shadow: 0 6px 20px rgba(0,0,0,0.25);
        cursor: pointer;
      }
      #${OVERLAY_ID} {
        position: fixed;
        inset: 0;
        z-index: 2147483646;
        display: none;
        align-items: center;
        justify-content: center;
        background: color-mix(in srgb, Canvas 82%, transparent);
        backdrop-filter: blur(6px);
      }
      #${OVERLAY_ID}[data-visible="true"] {
        display: flex;
      }
      #${OVERLAY_ID} .x-article-filter-overlay-card,
      #${EMPTY_STATE_ID} {
        --minimal-x-fg: #0f1115;
        --minimal-x-link: #3a5a7a;
        min-width: 220px;
        padding: 0;
        background: transparent;
        font: 13px/1.35 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        color: var(--minimal-x-fg);
        text-align: center;
      }
      @media (prefers-color-scheme: dark) {
        #${OVERLAY_ID} .x-article-filter-overlay-card,
        #${EMPTY_STATE_ID} {
          --minimal-x-fg: #f3f4f6;
          --minimal-x-link: #9fc7ea;
        }
      }
      #${OVERLAY_ID} .x-article-filter-frame,
      #${EMPTY_STATE_ID} .x-article-filter-frame {
        display: inline-grid;
        grid-template-columns: auto auto;
        gap: 16px;
        align-items: start;
        text-align: left;
      }
      #${OVERLAY_ID} .x-article-filter-logo,
      #${OVERLAY_ID} .x-article-filter-meta,
      #${EMPTY_STATE_ID} .x-article-filter-logo,
      #${EMPTY_STATE_ID} .x-article-filter-meta,
      #${EMPTY_STATE_ID} .x-article-filter-empty-copy {
        margin: 0;
        white-space: pre;
        color: var(--minimal-x-fg);
      }
      #${EMPTY_STATE_ID} {
        display: none;
        margin: 24px auto;
        max-width: 560px;
      }
      #${EMPTY_STATE_ID} .x-article-filter-empty-copy {
        display: block;
        margin-top: 10px;
        color: var(--minimal-x-link);
      }
      @media (max-width: 720px) {
        #${OVERLAY_ID} .x-article-filter-frame,
        #${EMPTY_STATE_ID} .x-article-filter-frame {
          grid-template-columns: 1fr;
          justify-items: center;
          gap: 10px;
        }
      }
      #${EMPTY_STATE_ID}[data-visible="true"] {
        display: block;
      }
    `;
    document.documentElement.appendChild(style);
  }

  function ensureOverlay() {
    let overlay = document.getElementById(OVERLAY_ID);
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.setAttribute('data-visible', 'false');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="x-article-filter-overlay-card" role="status" aria-live="polite">
        <div class="x-article-filter-frame">
          <pre class="x-article-filter-logo"> /\\_/\\
(=^.^=)
 (")(")</pre>
          <pre class="x-article-filter-meta">minimal.x
──────────
site:     x.com
module:   home feed
filter:   current rules
status:   scanning</pre>
        </div>
      </div>
    `;
    document.documentElement.appendChild(overlay);
    return overlay;
  }

  function ensureEmptyState(parent) {
    if (!parent) return null;
    let empty = document.getElementById(EMPTY_STATE_ID);
    if (!empty) {
      empty = document.createElement('div');
      empty.id = EMPTY_STATE_ID;
      empty.setAttribute('data-visible', 'false');
      empty.innerHTML = `
        <div class="x-article-filter-frame">
          <pre class="x-article-filter-logo"> /\\_/\\
(=^.^=)
 (")(")</pre>
          <pre class="x-article-filter-meta">minimal.x
──────────
site:     x.com
module:   home feed
filter:   current rules
status:   none found</pre>
        </div>
        <span class="x-article-filter-empty-copy">scroll a little or use show everything on this page</span>
      `;
    }
    if (!empty.parentElement || empty.parentElement !== parent) {
      parent.prepend(empty);
    }
    return empty;
  }

  function showOverlay() {
    ensureOverlay().setAttribute('data-visible', 'true');
  }

  function hideOverlay() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay) overlay.setAttribute('data-visible', 'false');
  }

  function showEmptyState(parent) {
    const empty = ensureEmptyState(parent);
    if (empty) empty.setAttribute('data-visible', 'true');
  }

  function hideEmptyState() {
    const empty = document.getElementById(EMPTY_STATE_ID);
    if (empty) empty.setAttribute('data-visible', 'false');
  }

  function markPending(container) {
    if (!container) return;
    container.setAttribute(PENDING_ATTR, 'true');
  }

  function applyToContainer(container) {
    if (!container) return;
    container.removeAttribute(PENDING_ATTR);
    container.setAttribute(FILTERED_ATTR, 'hide');
  }

  function clearContainer(container) {
    if (!container) return;
    container.removeAttribute(PENDING_ATTR);
    container.removeAttribute(FILTERED_ATTR);
  }

  function clearAll() {
    document.querySelectorAll(`[${FILTERED_ATTR}], [${PENDING_ATTR}]`).forEach(clearContainer);
    hideEmptyState();
  }

  window.XArticleFilterDOM = {
    ensureStyles,
    ensureOverlay,
    ensureEmptyState,
    showOverlay,
    hideOverlay,
    showEmptyState,
    hideEmptyState,
    markPending,
    applyToContainer,
    clearContainer,
    clearAll,
    FILTERED_ATTR,
    PENDING_ATTR
  };
})();
