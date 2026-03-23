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
    isNetworkPost
  } = window.XArticleFilterDetector;
  const {
    ensureStyles,
    ensureOverlay,
    ensureEmptyState,
    showOverlay,
    hideOverlay,
    showEmptyState,
    hideEmptyState,
    applyToContainer,
    clearContainer,
    clearAll
  } = window.XArticleFilterDOM;
  const { ensurePageControl, updatePageControlCount } = window.XArticleFilterPageControls;

  const USER_VISIBLE_ATTR = 'data-x-article-user-visible';
  const QUIET_WINDOW_MS = 140;
  const MAX_BATCH_WAIT_MS = 700;

  let settings = { enabled: true, mode: 'hide', feedMode: 'articles' };
  let observer = null;
  let quietTimer = null;
  let batchTimer = null;
  let pendingRoots = new Set();
  let lastPath = location.pathname + location.search;
  let processed = new WeakMap();

  function shouldShow(container) {
    if (isArticle(container)) return true;
    if (settings.feedMode === 'network' && isNetworkPost(container)) return true;
    return false;
  }

  function clearUserVisible(root = document) {
    root.querySelectorAll(`[${USER_VISIBLE_ATTR}="true"]`).forEach((el) => {
      el.removeAttribute(USER_VISIBLE_ATTR);
    });
  }

  function getContainersForRoot(root) {
    if (root instanceof Element) {
      const ownContainer = getPostContainer(root);
      if (ownContainer) return [ownContainer];
    }
    return getCandidateContainers(root);
  }

  function processContainer(container) {
    if (!(container instanceof Element)) return false;
    const row = getFeedRowContainer(container) || container;

    if (!settings.enabled) {
      clearContainer(row);
      row.removeAttribute(USER_VISIBLE_ATTR);
      return true;
    }

    if (row.getAttribute(USER_VISIBLE_ATTR) === 'true') {
      row.removeAttribute('data-x-article-pending');
      return true;
    }

    const signature = getClassificationSignature(container);
    const cacheKey = `${signature}::${settings.enabled}:${settings.feedMode}`;
    if (processed.get(row) === cacheKey) {
      row.removeAttribute('data-x-article-pending');
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
    if (!timelineRoot || !settings.enabled) {
      hideEmptyState();
      updatePageControlCount();
      return;
    }

    ensureEmptyState(timelineRoot);
    const rows = getCandidateRows(timelineRoot);
    const hasVisibleMatch = rows.some((row) => row.getAttribute('data-x-article-filtered') !== 'hide');

    updatePageControlCount();

    if (rows.length > 0 && !hasVisibleMatch) {
      showEmptyState(timelineRoot);
      return;
    }
    hideEmptyState();
  }

  function flushBatch() {
    quietTimer = null;
    batchTimer = null;

    const roots = pendingRoots.size ? Array.from(pendingRoots) : [document];
    pendingRoots = new Set();

    try {
      for (const root of roots) {
        getContainersForRoot(root).forEach(processContainer);
      }
      updateEmptyState();
    } finally {
      hideOverlay();
    }
  }

  function scheduleBatch(root = document, options = {}) {
    const validRoot = root instanceof Element || root instanceof Document ? root : document;
    if (options.addRoot !== false) {
      pendingRoots.add(validRoot);
    }

    if (options.withOverlay && settings.enabled) {
      showOverlay();
    }

    if (quietTimer) window.clearTimeout(quietTimer);
    quietTimer = window.setTimeout(flushBatch, QUIET_WINDOW_MS);

    if (!batchTimer) {
      batchTimer = window.setTimeout(flushBatch, MAX_BATCH_WAIT_MS);
    }
  }

  function showMore(count = 35) {
    const timelineRoot = getTimelineRoot(document);
    if (!timelineRoot) return;

    const rows = getCandidateRows(timelineRoot)
      .filter((row) => row.getAttribute('data-x-article-filtered') === 'hide')
      .slice(0, count);

    rows.forEach((row) => {
      clearContainer(row);
      row.setAttribute(USER_VISIBLE_ATTR, 'true');
    });

    updateEmptyState();
  }

  function showAllOnPage() {
    showMore(Number.MAX_SAFE_INTEGER);
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function attachObserver() {
    observer?.disconnect();
    observer = new MutationObserver((mutations) => {
      if (!settings.enabled) return;
      const timelineRoot = getTimelineRoot(document);
      if (!timelineRoot) return;

      let sawRelevantMutation = false;

      for (const mutation of mutations) {
        const target = mutation.target;
        if (!(target instanceof Element)) continue;
        if (target !== timelineRoot && !timelineRoot.contains(target)) continue;

        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) continue;

          const row = getFeedRowContainer(node);
          if (row) {
            pendingRoots.add(row);
            sawRelevantMutation = true;
          }

          const nestedRows = getCandidateRows(node);
          if (nestedRows.length) {
            nestedRows.forEach((nestedRow) => pendingRoots.add(nestedRow));
            sawRelevantMutation = true;
          }
        }
      }

      if (sawRelevantMutation) {
        scheduleBatch(timelineRoot, { withOverlay: false, addRoot: false });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function runNavigationPass() {
    const current = location.pathname + location.search;
    if (current === lastPath) return;

    lastPath = current;
    processed = new WeakMap();
    clearUserVisible(document);

    const timelineRoot = getTimelineRoot(document) || document;
    scheduleBatch(timelineRoot, { withOverlay: true });
  }

  function attachNavigationListener() {
    const push = history.pushState;
    const replace = history.replaceState;

    history.pushState = function (...args) {
      push.apply(this, args);
      window.setTimeout(runNavigationPass, 0);
    };

    history.replaceState = function (...args) {
      replace.apply(this, args);
      window.setTimeout(runNavigationPass, 0);
    };

    window.addEventListener('popstate', runNavigationPass);
  }

  async function refreshSettings(options = {}) {
    settings = await getSettings();
    if (settings.feedMode === 'quality') settings.feedMode = 'network';
    processed = new WeakMap();

    if (!settings.enabled) {
      clearAll();
      clearUserVisible(document);
      hideOverlay();
      updatePageControlCount();
      return;
    }

    if (!options.skipBatch) {
      scheduleBatch(getTimelineRoot(document) || document, { withOverlay: false });
    }
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
    ensurePageControl(scrollToTop);

    const timelineRoot = getTimelineRoot(document);
    if (timelineRoot) ensureEmptyState(timelineRoot);

    await refreshSettings({ skipBatch: true });

    if (settings.enabled) {
      scheduleBatch(timelineRoot || document, { withOverlay: true });
    }

    attachObserver();
    attachNavigationListener();
    listenForChanges();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
