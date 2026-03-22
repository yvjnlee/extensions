(function () {
  const { api, getSettings } = window.XArticleFilterStorage;
  const {
    getPostContainer,
    getCandidateContainers,
    getClassificationSignature,
    isArticle,
    isQualityPost
  } = window.XArticleFilterDetector;
  const { ensureStyles, applyToContainer, clearContainer, clearAll } = window.XArticleFilterDOM;
  const { ensurePageControl } = window.XArticleFilterPageControls;

  let settings = { enabled: true, mode: 'hide', feedMode: 'articles' };
  let pageBypass = false;
  let observer = null;
  let scanTimer = null;
  let pendingRoots = new Set();
  let lastPath = location.pathname + location.search;
  let processed = new WeakMap();

  function shouldShow(container) {
    if (isArticle(container)) return true;
    if (settings.feedMode === 'quality' && isQualityPost(container)) return true;
    return false;
  }

  function processContainer(container) {
    if (!(container instanceof Element)) return;

    const signature = getClassificationSignature(container);
    const cacheKey = `${signature}::${settings.enabled}:${settings.mode}:${settings.feedMode}:${pageBypass}`;
    if (processed.get(container) === cacheKey) return;
    processed.set(container, cacheKey);

    if (pageBypass || !settings.enabled) {
      clearContainer(container);
      return;
    }

    if (shouldShow(container)) {
      clearContainer(container);
      return;
    }

    applyToContainer(container, settings.mode);
  }

  function flushScan() {
    scanTimer = null;
    const roots = pendingRoots.size ? Array.from(pendingRoots) : [document];
    pendingRoots = new Set();

    for (const root of roots) {
      getCandidateContainers(root).forEach(processContainer);
    }
  }

  function scheduleScan(root = document) {
    pendingRoots.add(root instanceof Element || root instanceof Document ? root : document);
    if (scanTimer) window.clearTimeout(scanTimer);
    scanTimer = window.setTimeout(flushScan, 180);
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
          if (container) pendingRoots.add(container);
          pendingRoots.add(node);
        }
      }
      if (pendingRoots.size) scheduleScan();
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function resetBypassOnNavigation() {
    window.setInterval(() => {
      const current = location.pathname + location.search;
      if (current !== lastPath) {
        lastPath = current;
        pageBypass = false;
        processed = new WeakMap();
        scheduleScan(document);
      }
    }, 500);
  }

  async function refreshSettings() {
    settings = await getSettings();
    if (!settings.enabled) clearAll();
    scheduleScan(document);
  }

  function listenForChanges() {
    api.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if (changes.enabled || changes.mode || changes.feedMode) refreshSettings();
    });

    api.runtime.onMessage.addListener((message) => {
      if (!message || message.type !== 'X_ARTICLE_FILTER_ACTION') return;
      if (message.action === 'showAllOnPage') showAllOnPage();
      if (message.action === 'refresh') refreshSettings();
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
