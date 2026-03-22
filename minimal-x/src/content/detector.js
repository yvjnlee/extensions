(function () {
  const ARTICLE_HINT_TEXT = ['article', 'read article', 'open article', 'view article'];
  const ARTICLE_URL_PATTERNS = [/\/i\/articles\//i, /\/articles\//i];
  const LOW_SIGNAL_PATTERNS = [
    /(^|\s)#\w+/g,
    /(^|\s)\$[A-Z]{1,5}\b/g,
    /(^|\s)@\w+/g
  ];

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

  function getPostText(container) {
    const textRoot = container.querySelector('[data-testid="tweetText"], div[lang]');
    return (textRoot?.innerText || '').replace(/\s+/g, ' ').trim();
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

  function isReply(container) {
    return /replying to/i.test(getVisibleText(container));
  }

  function hasVerifiedSignal(container) {
    return !!container.querySelector('[data-testid="icon-verified"],[aria-label*="Verified" i]');
  }

  function hasFollowSignal(container) {
    const text = getVisibleText(container);
    return /following/i.test(text) || /follows you/i.test(text);
  }

  function countMatches(text, pattern) {
    const matches = text.match(pattern);
    return matches ? matches.length : 0;
  }

  function extractNumericSignals(container) {
    const text = getVisibleText(container);
    const labels = Array.from(container.querySelectorAll('[aria-label]'))
      .map((node) => node.getAttribute('aria-label') || '')
      .join(' | ');
    const combined = `${text} | ${labels}`;

    const score = { likes: 0, reposts: 0, replies: 0, views: 0 };
    const patterns = [
      { key: 'likes', regex: /(\d[\d,.KMB]*)\s+likes?/ig },
      { key: 'reposts', regex: /(\d[\d,.KMB]*)\s+(reposts?|retweets?)/ig },
      { key: 'replies', regex: /(\d[\d,.KMB]*)\s+repl(?:y|ies)/ig },
      { key: 'views', regex: /(\d[\d,.KMB]*)\s+views?/ig }
    ];

    for (const { key, regex } of patterns) {
      const match = regex.exec(combined);
      if (match) score[key] = parseMetric(match[1]);
    }

    return score;
  }

  function parseMetric(value) {
    const normalized = String(value).replace(/,/g, '').trim().toUpperCase();
    const suffix = normalized.slice(-1);
    const number = parseFloat(normalized);
    if (Number.isNaN(number)) return 0;
    if (suffix === 'K') return Math.round(number * 1000);
    if (suffix === 'M') return Math.round(number * 1000000);
    if (suffix === 'B') return Math.round(number * 1000000000);
    return Math.round(number);
  }

  function getQualityScore(container) {
    const text = getPostText(container);
    if (!text) return -100;

    let score = 0;
    const metrics = extractNumericSignals(container);
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const hashtagCount = countMatches(text, /(^|\s)#\w+/g);
    const cashtagCount = countMatches(text, /(^|\s)\$[A-Z]{1,5}\b/g);
    const mentionCount = countMatches(text, /(^|\s)@\w+/g);
    const urlCount = countMatches(text, /https?:\/\//g);

    if (text.length >= 280) score += 5;
    if (text.length >= 500) score += 4;
    if (wordCount >= 40) score += 4;
    if (wordCount >= 80) score += 3;
    if (/[.;:!?]/.test(text)) score += 1;

    if (metrics.likes >= 50) score += 3;
    if (metrics.likes >= 250) score += 3;
    if (metrics.reposts >= 10) score += 2;
    if (metrics.reposts >= 50) score += 2;
    if (metrics.replies >= 5) score += 1;
    if (metrics.views >= 5000) score += 1;

    if (hasVerifiedSignal(container)) score += 2;
    if (hasFollowSignal(container)) score += 2;

    if (isReply(container)) score -= 4;
    if (hashtagCount >= 4) score -= 3;
    if (cashtagCount >= 2) score -= 3;
    if (mentionCount >= 5) score -= 2;
    if (urlCount >= 2) score -= 2;
    if (LOW_SIGNAL_PATTERNS.every((pattern) => countMatches(text, pattern) > 0) && text.length < 220) score -= 4;
    if (text.length < 180) score -= 5;

    return score;
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
    if (!container || !isFeedPost(container)) return false;
    if (isPromoted(container) || isArticle(container)) return false;
    return getQualityScore(container) >= 10;
  }

  window.XArticleFilterDetector = {
    getPostContainer,
    getFeedRowContainer,
    getTimelineRoot,
    getCandidateContainers,
    getCandidateRows,
    getClassificationSignature,
    isArticle,
    isQualityPost
  };
})();
