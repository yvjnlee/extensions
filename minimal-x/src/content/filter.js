(function () {
  const FILTERED_ATTR = 'data-x-article-filtered';
  const PLACEHOLDER_CLASS = 'x-article-filter-placeholder';
  const STYLE_ID = 'x-article-filter-style';

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      [${FILTERED_ATTR}="hide"] { display: none !important; }
      [${FILTERED_ATTR}="collapse"] { opacity: 0.45; }
      [${FILTERED_ATTR}="collapse"] > * { display: none !important; }
      [${FILTERED_ATTR}="collapse"] .${PLACEHOLDER_CLASS} {
        display: block !important;
        padding: 12px 16px;
        margin: 8px 0;
        border: 1px dashed rgba(120,120,120,0.5);
        border-radius: 12px;
        font: 13px/1.4 system-ui, sans-serif;
        color: inherit;
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
    `;
    document.documentElement.appendChild(style);
  }

  function addPlaceholder(container) {
    if (container.querySelector(`.${PLACEHOLDER_CLASS}`)) return;
    const placeholder = document.createElement('div');
    placeholder.className = PLACEHOLDER_CLASS;
    placeholder.textContent = 'Filtered non-article post';
    container.appendChild(placeholder);
  }

  function applyToContainer(container, mode) {
    if (!container) return;
    container.setAttribute(FILTERED_ATTR, mode);
    if (mode === 'collapse') addPlaceholder(container);
  }

  function clearContainer(container) {
    if (!container) return;
    container.removeAttribute(FILTERED_ATTR);
    container.querySelector(`.${PLACEHOLDER_CLASS}`)?.remove();
  }

  function clearAll() {
    document.querySelectorAll(`[${FILTERED_ATTR}]`).forEach(clearContainer);
  }

  window.XArticleFilterDOM = {
    ensureStyles,
    applyToContainer,
    clearContainer,
    clearAll,
    FILTERED_ATTR
  };
})();
