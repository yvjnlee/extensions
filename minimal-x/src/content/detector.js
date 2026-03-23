(function () {
  const ARTICLE_HINT_TEXT = ['article', 'read article', 'open article', 'view article'];
  const ARTICLE_URL_PATTERNS = [/\/i\/articles\//i, /\/articles\//i];
  const trustedAuthors = new Set();

  function getPostContainer(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return null;
    return node.closest('article,[data-testid="tweet"]');
  }

  function getFeedRowContainer(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return null;
    const article = getPostContainer(node);
    const base = article || node;
    return base.closest('[data-testid="cellInnerDiv"]') || article || null;
  }

  function getTimelineRoot(root = document) {
    return root.querySelector('[aria-label^="Timeline:"],[data-testid="primaryColumn"] section') || null;
  }

  function getCandidateContainers(root = document) {
    const seen = new Set();
    return Array.from(root.querySelectorAll('article,[data-testid="tweet"]')).filter((node) => {
      if (!(node instanceof Element) || seen.has(node)) return false;
      seen.add(node);
      return isFeedPost(node);
    });
  }

  function getCandidateRows(root = document) {
    const rows = new Set();
    getCandidateContainers(root).forEach((container) => {
      const row = getFeedRowContainer(container);
      if (row) rows.add(row);
    });
    return Array.from(rows);
  }

  function isFeedPost(container) {
    if (!(container instanceof Element)) return false;
    const hasTime = !!container.querySelector('time');
    const hasPermalink = Array.from(container.querySelectorAll('a[href]')).some((link) => {
      const href = link.getAttribute('href') || '';
      return /^\/[A-Za-z0-9_]+\/status\//.test(href);
    });
    const hasTweetText = !!container.querySelector('[data-testid="tweetText"], div[lang]');
    return hasTime || hasPermalink || hasTweetText;
  }

  function getVisibleText(container) {
    return (container.innerText || '').replace(/\s+/g, ' ').trim();
  }

  function getAuthorHandle(container) {
    const permalink = Array.from(container.querySelectorAll('a[href]')).find((link) => {
      const href = link.getAttribute('href') || '';
      return /^\/[A-Za-z0-9_]+\/status\//.test(href);
    });
    if (!permalink) return null;
    const href = permalink.getAttribute('href') || '';
    const match = href.match(/^\/([A-Za-z0-9_]+)\/status\//);
    return match ? match[1].toLowerCase() : null;
  }

  function hasArticleUrl(container) {
    return Array.from(container.querySelectorAll('a[href]')).some((link) => {
      const href = link.getAttribute('href') || '';
      return ARTICLE_URL_PATTERNS.some((pattern) => pattern.test(href));
    });
  }

  function hasExplicitArticleLabel(container) {
    const nodes = container.querySelectorAll('[aria-label],[role="link"],[role="button"],span,div');
    return Array.from(nodes).some((node) => {
      const text = [node.getAttribute?.('aria-label'), node.textContent]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
      return ARTICLE_HINT_TEXT.some((hint) => text === hint || text.includes(` ${hint} `) || text.startsWith(`${hint} `) || text.endsWith(` ${hint}`));
    });
  }

  function hasArticleStructure(container) {
    const headings = container.querySelectorAll('h1,h2,h3,[role="heading"]');
    const longBlocks = Array.from(container.querySelectorAll('p,div,span')).filter((el) => {
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      return text.length >= 140 && !el.querySelector('time');
    });
    return headings.length >= 1 && longBlocks.length >= 2;
  }

  function isPromoted(container) {
    return /(^|\s)promoted(\s|$)/i.test(getVisibleText(container));
  }

  function getAuthorSignals(container) {
    const text = getVisibleText(container);
    return {
      following: /\bfollowing\b/i.test(text),
      followedByNetwork: /followed by/i.test(text) || /people you follow/i.test(text)
    };
  }

  function isFollowingTimeline(root = document) {
    if (/\/following(?:$|[/?#])/i.test(location.pathname)) return true;
    const searchParams = new URLSearchParams(location.search || '');
    if ((searchParams.get('filter') || '').toLowerCase() === 'following') return true;

    const selectedTabs = root.querySelectorAll('[role="tab"][aria-selected="true"], a[role="tab"][aria-selected="true"]');
    return Array.from(selectedTabs).some((tab) => /\bfollowing\b/i.test((tab.textContent || '').trim()));
  }

  function isNetworkPost(container) {
    if (!container || !isFeedPost(container)) return false;
    if (isPromoted(container) || isArticle(container)) return false;
    if (isFollowingTimeline(document)) return true;

    const author = getAuthorSignals(container);
    const handle = getAuthorHandle(container);

    if (handle && trustedAuthors.has(handle)) return true;

    const allowed = author.following || author.followedByNetwork;
    if (allowed && handle) trustedAuthors.add(handle);
    return allowed;
  }

  function getClassificationSignature(container) {
    const hrefs = Array.from(container.querySelectorAll('a[href]'))
      .slice(0, 8)
      .map((link) => link.getAttribute('href'))
      .join('|');
    const text = getVisibleText(container).slice(0, 280);
    return `${hrefs}::${text}`;
  }

  function isArticle(container) {
    if (!container || !isFeedPost(container)) return false;
    if (isPromoted(container)) return false;
    if (hasArticleUrl(container)) return true;
    if (hasExplicitArticleLabel(container) && hasArticleStructure(container)) return true;
    return false;
  }

  function isQualityPost(container) {
    return isNetworkPost(container);
  }

  window.XArticleFilterDetector = {
    getPostContainer,
    getFeedRowContainer,
    getTimelineRoot,
    getCandidateContainers,
    getCandidateRows,
    getClassificationSignature,
    isArticle,
    isNetworkPost,
    isQualityPost
  };
})();
