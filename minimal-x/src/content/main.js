(function () {
  const { api, getSettings } = window.XArticleFilterStorage;
  const { getPostContainer, isArticle } = window.XArticleFilterDetector;
  const { ensureStyles, applyToContainer, clearContainer, clearAll } = window.XArticleFilterDOM;
  const { ensurePageControl } = window.XArticleFilterPageControls;

  let settings = { enabled: true, mode: 'hide' };
  let pageBypass = false;
  let observer = null;

  function isTimelineContainer(node) {
    if (!(node instanceof Element)) return false;
    return !!node.querySelector('article,[data-testid="cellInnerDiv"],[data-testid="tweet"]');
  }

  function getCandidates(root = document) {
    return Array.from(root.querySelectorAll('article,[data-testid="cellInnerDiv"],[data-testid="tweet"]'));
  }

  function processContainer(container) {
    if (!(container instanceof Element)) return;
    if (pageBypass || !settings.enabled) {
      clearContainer(container);
      return;
    }

    if (isArticle(container)) {
      clearContainer(container);
      return;
    }

    applyToContainer(container, settings.mode);
  }

  function scan(root = document) {
    getCandidates(root).forEach(processContainer);
  }

  function showAllOnPage() {
    pageBypass = true;
    clearAll();
  }

  function attachObserver() {
    observer?.disconnect();
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) continue;
          const container = getPostContainer(node);
          if (container) processContainer(container);
          if (isTimelineContainer(node)) scan(node);
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function resetBypassOnNavigation() {
    let lastPath = location.pathname + location.search;
    setInterval(() => {
      const current = location.pathname + location.search;
      if (current !== lastPath) {
        lastPath = current;
        pageBypass = false;
        scan();
      }
    }, 500);
  }

  async function refreshSettings() {
    settings = await getSettings();
    if (!settings.enabled) clearAll();
    scan();
  }

  function listenForChanges() {
    api.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if (changes.enabled || changes.mode) refreshSettings();
    });

    api.runtime.onMessage.addListener((message) => {
      if (!message || message.type !== 'X_ARTICLE_FILTER_ACTION') return;
      if (message.action === 'showAllOnPage') {
        showAllOnPage();
      }
      if (message.action === 'refresh') {
        refreshSettings();
      }
    });
  }

  async function init() {
    ensureStyles();
    ensurePageControl(showAllOnPage);
    await refreshSettings();
    attachObserver();
    listenForChanges();
    resetBypassOnNavigation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
