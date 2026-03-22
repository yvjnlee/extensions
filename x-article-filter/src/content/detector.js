(function () {
  const ARTICLE_HINT_TEXT = [
    'article',
    'read article',
    'open article'
  ];

  function getPostContainer(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return null;
    return node.closest('article,[data-testid="cellInnerDiv"],[data-testid="tweet"]');
  }

  function getPostText(container) {
    const textRoot = container.querySelector('[data-testid="tweetText"], div[lang]');
    return (textRoot?.innerText || '').trim();
  }

  function hasArticleLabel(container) {
    const text = (container.innerText || '').toLowerCase();
    return ARTICLE_HINT_TEXT.some((hint) => text.includes(hint));
  }

  function hasArticleUrl(container) {
    return Array.from(container.querySelectorAll('a[href]')).some((link) => {
      const href = link.getAttribute('href') || '';
      return /\/i\/articles\//.test(href) || /\/articles\//.test(href);
    });
  }

  function hasArticleStructure(container) {
    const headingCount = container.querySelectorAll('h1,h2,h3,[role="heading"]').length;
    const paragraphishBlocks = Array.from(container.querySelectorAll('div,span,p')).filter((el) => {
      const text = (el.innerText || '').trim();
      return text.length > 120;
    }).length;

    return headingCount >= 1 && paragraphishBlocks >= 2;
  }

  function isPromoted(container) {
    return /promoted/i.test(container.innerText || '');
  }

  function isArticle(container) {
    if (!container) return false;
    if (isPromoted(container)) return false;
    if (hasArticleUrl(container)) return true;
    if (hasArticleLabel(container) && hasArticleStructure(container)) return true;

    const text = getPostText(container);
    if (!text) return false;

    return false;
  }

  window.XArticleFilterDetector = {
    getPostContainer,
    isArticle
  };
})();
