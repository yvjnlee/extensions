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
    markPending,
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
  let overlayAllowed = true;

  const QUIET_WINDOW_MS = 220;
  const MAX_BATCH_WAIT_MS = 900;

  function shouldShow(container) {
    if (isArticle(container)) return true;
    if (settings.feedMode === 'quality' && isQualityPost(container)) return true;
    return false;
  }

  function hideCandidates(root = document) {
    getCandidateContainers(root).forEach((container) => {
      if (!pageBypass && settings.enabled) markPending(container);
    });
  }

  function processContainer(container) {
    if (!(container instanceof Element)) return;

    const signature = getClassificationSignature(container);
    const cacheKey = `${signature}::${settings.enabled}:${settings.feedMode}:${pageBypass}`;
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

    applyToContainer(container);
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
      hideOverlay();
      overlayAllowed = false;
    }
  }

  function scheduleBatch(root = document, options = {}) {
    const validRoot = root instanceof Element || root instanceof Document ? root : document;
    pendingRoots.add(validRoot);

    if (settings.enabled && !pageBypass) {
      hideCandidates(validRoot);
    }

    if (options.withOverlay && settings.enabled && !pageBypass && overlayAllowed) {
      showOverlay();
    }

    if (quietTimer) window.clearTimeout(quietTimer);
    quietTimer = window.setTimeout(flushBatch, QUIET_WINDOW_MS);

    if (!batchTimer) {
      batchTimer = window.setTimeout(flushBatch, MAX_BATCH_WAIT_MS);
    }
  }

  function showAllOnPage() {
    pageBypass = true;
    overlayAllowed = false;
    if (quietTimer) window.clearTimeout(quietTimer);
    if (batchTimer) window.clearTimeout(batchTimer);
    quietTimer = null;
    batchTimer = null;
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
          if (container) {
            markPending(container);
            pendingRoots.add(container);
            sawRelevantMutation = true;
          }

          const nested = getCandidateContainers(node);
          if (nested.length) {
            nested.forEach(markPending);
            pendingRoots.add(node);
            sawRelevantMutation = true;
          }
        }
      }

      if (sawRelevantMutation) {
        scheduleBatch(document, { withOverlay: false });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function resetBypassOnNavigation() {
    window.setInterval(() => {
      const current = location.pathname + location.search;
      if (current !== lastPath) {
        lastPath = current;
        pageBypass = false;
        overlayAllowed = true;
        processed = new WeakMap();
        scheduleBatch(document, { withOverlay: true });
      }
    }, 500);
  }

  async function refreshSettings() {
    settings = await getSettings();
    processed = new WeakMap();

    if (!settings.enabled) {
      clearAll();
      hideOverlay();
      overlayAllowed = false;
      return;
    }

    scheduleBatch(document, { withOverlay: false });
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
    overlayAllowed = true;
    hideCandidates(document);
    scheduleBatch(document, { withOverlay: true });
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
