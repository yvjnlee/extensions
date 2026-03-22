(function () {
  const ARTICLE_HINT_TEXT = [
    'article',
    'read article',
    'open article',
    'view article'
  ];

  const ARTICLE_URL_PATTERNS = [
    /\/i\/articles\//i,
    /\/articles\//i
  ];

  function getPostContainer(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return null;
    return node.closest('article,[data-testid="tweet"]');
  }

  function getCandidateContainers(root = document) {
    const seen = new Set();
    return Array.from(root.querySelectorAll('article,[data-testid="tweet"]')).filter((node) => {
      if (!(node instanceof Element)) return false;
      if (seen.has(node)) return false;
      seen.add(node);
      return isFeedPost(node);
    });
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
      if (text.length < 140) return false;
      if (el.querySelector('time')) return false;
      return true;
    });

    return headings.length >= 1 && longBlocks.length >= 2;
  }

  function isPromoted(container) {
    return /(^|\s)promoted(\s|$)/i.test(getVisibleText(container));
  }

  function getClassificationSignature(container) {
    const hrefs = Array.from(container.querySelectorAll('a[href]'))
      .slice(0, 5)
      .map((link) => link.getAttribute('href'))
      .join('|');
    const text = getVisibleText(container).slice(0, 200);
    return `${hrefs}::${text}`;
  }

  function isArticle(container) {
    if (!container || !isFeedPost(container)) return false;
    if (isPromoted(container)) return false;

    if (hasArticleUrl(container)) return true;
    if (hasExplicitArticleLabel(container) && hasArticleStructure(container)) return true;

    return false;
  }

  window.XArticleFilterDetector = {
    getPostContainer,
    getCandidateContainers,
    getClassificationSignature,
    isArticle
  };
})();
