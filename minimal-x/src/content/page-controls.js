(function () {
  const CONTROL_ID = 'x-article-filter-page-control';

  function ensurePageControl(onShowAll) {
    if (document.getElementById(CONTROL_ID)) return;
    const wrapper = document.createElement('div');
    wrapper.id = CONTROL_ID;
    wrapper.className = 'x-article-filter-control';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Show all on this page';
    button.addEventListener('click', onShowAll);
    wrapper.appendChild(button);
    document.documentElement.appendChild(wrapper);
  }

  window.XArticleFilterPageControls = {
    ensurePageControl
  };
})();
