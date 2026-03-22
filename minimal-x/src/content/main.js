(function () {
  const { api, getSettings } = window.XArticleFilterStorage;
  const {
    getPostContainer,
    getCandidateContainers,
    getClassificationSignature,
    isArticle,
    isQualityPost
  } = window.XArticleFilterDetector;
  const {
    ensureStyles,
    ensureOverlay,
    showOverlay,
    hideOverlay,
    applyToContainer,
    clearContainer,
    clearAll
  } = window.XArticleFilterDOM;
  const { ensurePageControl } = window.XArticleFilterPageControls;

  let settings = { enabled: true, mode: 'hide', feedMode: 'articles' };
  let pageBypass = false;
  let observer = null;
  let quietTimer = null;
  let batchTimer = null;
  let pendingRoots = new Set();
  let lastPath = location.pathname + location.search;
  let processed = new WeakMap();
  let isBatching = false;
  let batchStartedAt = 0;

  const QUIET_WINDOW_MS = 320;
  const MAX_BATCH_WAIT_MS = 1200;

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

  function flushBatch() {
    quietTimer = null;
    batchTimer = null;

    const roots = pendingRoots.size ? Array.from(pendingRoots) : [document];
    pendingRoots = new Set();

    try {
      for (const root of roots) {
        getCandidateContainers(root).forEach(processContainer);
      }
    } finally {
      isBatching = false;
      hideOverlay();
    }
  }

  function beginBatch() {
    if (!settings.enabled || pageBypass) return;
    if (!isBatching) {
      isBatching = true;
      batchStartedAt = Date.now();
      showOverlay();
    }
  }

  function scheduleBatch(root = document) {
    pendingRoots.add(root instanceof Element || root instanceof Document ? root : document);
    beginBatch();

    if (quietTimer) window.clearTimeout(quietTimer);
    quietTimer = window.setTimeout(flushBatch, QUIET_WINDOW_MS);

    if (!batchTimer) {
      batchTimer = window.setTimeout(flushBatch, MAX_BATCH_WAIT_MS);
    } else if (Date.now() - batchStartedAt >= MAX_BATCH_WAIT_MS) {
      window.clearTimeout(batchTimer);
      flushBatch();
    }
  }

  function showAllOnPage() {
    pageBypass = true;
    if (quietTimer) window.clearTimeout(quietTimer);
    if (batchTimer) window.clearTimeout(batchTimer);
    quietTimer = null;
    batchTimer = null;
    isBatching = false;
    hideOverlay();
    clearAll();
  }

  function attachObserver() {
    observer?.disconnect();
    observer = new MutationObserver((mutations) => {
      let sawRelevantMutation = false;

      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) continue;
          const container = getPostContainer(node);
          if (container) pendingRoots.add(container);
          pendingRoots.add(node);
          sawRelevantMutation = true;
        }
      }

      if (sawRelevantMutation) scheduleBatch(document);
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
        scheduleBatch(document);
      }
    }, 500);
  }

  async function refreshSettings() {
    settings = await getSettings();
    if (!settings.enabled) {
      clearAll();
      hideOverlay();
      return;
    }
    scheduleBatch(document);
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
    ensureOverlay();
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
