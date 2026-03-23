(function () {
  const CONTROL_ID = 'x-article-filter-page-control';

  let onScrollTop = null;
  let syncVisibility = () => {};

  function ensurePageControl(onScrollToTop) {
    if (document.getElementById(CONTROL_ID)) return;
    onScrollTop = onScrollToTop;

    const wrapper = document.createElement('div');
    wrapper.id = CONTROL_ID;
    wrapper.className = 'x-article-filter-control';

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Scroll to top';
    button.addEventListener('click', () => {
      if (onScrollTop) onScrollTop();
    });

    wrapper.appendChild(button);
    document.documentElement.appendChild(wrapper);

    syncVisibility = () => {
      button.style.display = window.scrollY > 240 ? '' : 'none';
    };
    window.addEventListener('scroll', syncVisibility, { passive: true });
    syncVisibility();
  }

  function updatePageControlCount() {
    syncVisibility();
  }

  window.XArticleFilterPageControls = {
    ensurePageControl,
    updatePageControlCount
  };
})();
