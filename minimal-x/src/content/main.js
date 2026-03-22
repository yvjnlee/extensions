(function () {
  const { api, getSettings } = window.XArticleFilterStorage;
  const {
    getPostContainer,
    getFeedRowContainer,
    getTimelineRoot,
    getCandidateContainers,
    getCandidateRows,
    getClassificationSignature,
    isArticle,
    isQualityPost
  } = window.XArticleFilterDetector;
  const {
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
  let manualBatchArmed = false;

  const QUIET_WINDOW_MS = 220;
  const MAX_BATCH_WAIT_MS = 900;

  function shouldShow(container) {
    if (isArticle(container)) return true;
    if (settings.feedMode === 'quality' && isQualityPost(container)) return true;
    return false;
  }

  function hideCandidates(root = document) {
    getCandidateRows(root).forEach((row) => {
      if (!pageBypass && settings.enabled) markPending(row);
    });
  }

  function processContainer(container) {
    if (!(container instanceof Element)) return false;
    const row = getFeedRowContainer(container) || container;

    if (pageBypass || !settings.enabled) {
      clearContainer(row);
      return true;
    }

    if (row.getAttribute('data-x-article-filtered') === 'hide') {
      row.removeAttribute('data-x-article-pending');
      return false;
    }

    const signature = getClassificationSignature(container);
    const cacheKey = `${signature}::${settings.enabled}:${settings.feedMode}:${pageBypass}`;
    if (processed.get(row) === cacheKey) {
      return row.getAttribute('data-x-article-filtered') !== 'hide';
    }
    processed.set(row, cacheKey);

    if (shouldShow(container)) {
      clearContainer(row);
      return true;
    }

    applyToContainer(row);
    return false;
  }

  function updateEmptyState() {
    const timelineRoot = getTimelineRoot(document);
    if (!timelineRoot || pageBypass || !settings.enabled) {
      hideEmptyState();
      return;
    }

    ensureEmptyState(timelineRoot);
    const rows = getCandidateRows(timelineRoot);
    const hasVisibleMatch = rows.some((row) => row.getAttribute('data-x-article-filtered') !== 'hide');

    if (rows.length > 0 && !hasVisibleMatch) {
      showEmptyState(timelineRoot);
    } else {
      hideEmptyState();
    }
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
      updateEmptyState();
    } finally {
      hideOverlay();
      manualBatchArmed = false;
    }
  }

  function scheduleBatch(root = document, options = {}) {
    const validRoot = root instanceof Element || root instanceof Document ? root : document;
    pendingRoots.add(validRoot);

    if (settings.enabled && !pageBypass) {
      hideCandidates(validRoot);
    }

    if (options.withOverlay && settings.enabled && !pageBypass) {
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
    manualBatchArmed = false;
    if (quietTimer) window.clearTimeout(quietTimer);
    if (batchTimer) window.clearTimeout(batchTimer);
    quietTimer = null;
    batchTimer = null;
    hideOverlay();
    clearAll();
  }

  function armManualBatch() {
    if (pageBypass || !settings.enabled) return;
    manualBatchArmed = true;
    const timelineRoot = getTimelineRoot(document) || document;
    hideCandidates(timelineRoot);
    scheduleBatch(timelineRoot, { withOverlay: false });
  }

  function isManualLoadMoreTrigger(target) {
    const trigger = target?.closest?.('button,a,[role="button"]');
    if (!trigger) return false;

    const text = [
      trigger.textContent,
      trigger.getAttribute('aria-label'),
      trigger.getAttribute('title')
    ]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    return /show\s+(more|new|\d+)\s+posts?/.test(text) || /load\s+more/.test(text);
  }

  function attachObserver() {
    observer?.disconnect();
    observer = new MutationObserver((mutations) => {
      if (!manualBatchArmed) return;

      let sawRelevantMutation = false;

      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) continue;
          const row = getFeedRowContainer(node);
          if (row) {
            markPending(row);
            pendingRoots.add(row);
            sawRelevantMutation = true;
          }

          const nestedRows = getCandidateRows(node);
          if (nestedRows.length) {
            nestedRows.forEach(markPending);
            pendingRoots.add(node);
            sawRelevantMutation = true;
          }
        }
      }

      if (sawRelevantMutation) {
        scheduleBatch(getTimelineRoot(document) || document, { withOverlay: false });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function attachClickListener() {
    document.addEventListener('click', (event) => {
      if (isManualLoadMoreTrigger(event.target)) {
        window.setTimeout(() => {
          armManualBatch();
        }, 0);
      }
    }, true);
  }

  function resetBypassOnNavigation() {
    window.setInterval(() => {
      const current = location.pathname + location.search;
      if (current !== lastPath) {
        lastPath = current;
        pageBypass = false;
        processed = new WeakMap();
        const timelineRoot = getTimelineRoot(document) || document;
        hideCandidates(timelineRoot);
        scheduleBatch(timelineRoot, { withOverlay: true });
      }
    }, 500);
  }

  async function refreshSettings() {
    settings = await getSettings();
    processed = new WeakMap();

    if (!settings.enabled) {
      clearAll();
      hideOverlay();
      manualBatchArmed = false;
      return;
    }

    scheduleBatch(getTimelineRoot(document) || document, { withOverlay: false });
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

    const timelineRoot = getTimelineRoot(document);
    if (timelineRoot) ensureEmptyState(timelineRoot);

    await refreshSettings();
    hideCandidates(timelineRoot || document);
    scheduleBatch(timelineRoot || document, { withOverlay: true });
    attachObserver();
    attachClickListener();
    listenForChanges();
    resetBypassOnNavigation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
