(function () {
  const { api, getSettings, setSettings } = window.XArticleFilterStorage;
  const els = {};

  function setPressed(button, pressed) {
    button.setAttribute('aria-pressed', String(pressed));
  }

  function render(settings) {
    const networkSelected = settings.feedMode === 'network' || settings.feedMode === 'quality';
    setPressed(els.enabledButton, settings.enabled);
    els.enabledButton.textContent = settings.enabled ? 'On' : 'Off';
    setPressed(els.articlesMode, settings.feedMode === 'articles');
    setPressed(els.networkMode, networkSelected);
  }

  async function withActiveTab(callback) {
    const tabs = await api.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) await callback(tabs[0].id);
  }

  async function notifyContent(action) {
    try {
      await withActiveTab((tabId) => api.tabs.sendMessage(tabId, {
        type: 'X_ARTICLE_FILTER_ACTION',
        action
      }));
    } catch (_error) {
      // Ignore when popup is opened outside x.com.
    }
  }

  async function save() {
    const settings = {
      enabled: els.enabledButton.getAttribute('aria-pressed') === 'true',
      mode: 'hide',
      feedMode: els.articlesMode.getAttribute('aria-pressed') === 'true' ? 'articles' : 'network'
    };
    await setSettings(settings);
    els.status.textContent = 'Saved.';
    await notifyContent('refresh');
  }

  async function init() {
    els.enabledButton = document.getElementById('enabledButton');
    els.articlesMode = document.getElementById('articlesMode');
    els.networkMode = document.getElementById('networkMode');
    els.showAllButton = document.getElementById('showAllButton');
    els.saveButton = document.getElementById('saveButton');
    els.status = document.getElementById('status');

    render(await getSettings());

    els.enabledButton.addEventListener('click', () => {
      const next = els.enabledButton.getAttribute('aria-pressed') !== 'true';
      setPressed(els.enabledButton, next);
      els.enabledButton.textContent = next ? 'On' : 'Off';
      els.status.textContent = '';
    });

    els.articlesMode.addEventListener('click', () => {
      setPressed(els.articlesMode, true);
      setPressed(els.networkMode, false);
      els.status.textContent = '';
    });

    els.networkMode.addEventListener('click', () => {
      setPressed(els.articlesMode, false);
      setPressed(els.networkMode, true);
      els.status.textContent = '';
    });

    els.showAllButton.addEventListener('click', async () => {
      await notifyContent('showAllOnPage');
      els.status.textContent = 'Showing all posts on this page.';
    });

    els.saveButton.addEventListener('click', save);
  }

  document.addEventListener('DOMContentLoaded', init, { once: true });
})();
