(function () {
  const FILTERED_ATTR = 'data-x-article-filtered';
  const PENDING_ATTR = 'data-x-article-pending';
  const STYLE_ID = 'x-article-filter-style';
  const OVERLAY_ID = 'x-article-filter-overlay';

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      [${PENDING_ATTR}="true"],
      [${FILTERED_ATTR}="hide"] {
        display: none !important;
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
      #${OVERLAY_ID} .x-article-filter-overlay-card {
        min-width: 220px;
        padding: 14px 16px;
        border-radius: 14px;
        background: color-mix(in srgb, Canvas 92%, transparent);
        border: 1px solid color-mix(in srgb, CanvasText 10%, transparent);
        box-shadow: 0 12px 40px rgba(0,0,0,0.18);
        font: 13px/1.4 system-ui, sans-serif;
        color: CanvasText;
        text-align: center;
      }
      #${OVERLAY_ID} .x-article-filter-overlay-title {
        display: block;
        margin-bottom: 4px;
        font-weight: 600;
      }
      #${OVERLAY_ID} .x-article-filter-overlay-copy {
        color: GrayText;
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
        <span class="x-article-filter-overlay-title">minimal-x is filtering your feed</span>
        <span class="x-article-filter-overlay-copy">Finding articles and high-signal posts…</span>
      </div>
    `;
    document.documentElement.appendChild(overlay);
    return overlay;
  }

  function showOverlay() {
    ensureOverlay().setAttribute('data-visible', 'true');
  }

  function hideOverlay() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay) overlay.setAttribute('data-visible', 'false');
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
  }

  window.XArticleFilterDOM = {
    ensureStyles,
    ensureOverlay,
    showOverlay,
    hideOverlay,
    markPending,
    applyToContainer,
    clearContainer,
    clearAll,
    FILTERED_ATTR,
    PENDING_ATTR
  };
})();
