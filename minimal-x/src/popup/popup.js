(function () {
  const { api, getSettings, setSettings } = window.XArticleFilterStorage || {
    api: typeof browser !== 'undefined' ? browser : chrome,
    getSettings: async () => ({ enabled: true, mode: 'hide' }),
    setSettings: async (settings) => {
      const extApi = typeof browser !== 'undefined' ? browser : chrome;
      await extApi.storage.local.set(settings);
      return settings;
    }
  };

  const els = {};

  function setPressed(button, pressed) {
    button.setAttribute('aria-pressed', String(pressed));
  }

  function render(settings) {
    setPressed(els.enabledButton, settings.enabled);
    els.enabledButton.textContent = settings.enabled ? 'On' : 'Off';
    setPressed(els.hideMode, settings.mode === 'hide');
    setPressed(els.collapseMode, settings.mode === 'collapse');
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
      mode: els.hideMode.getAttribute('aria-pressed') === 'true' ? 'hide' : 'collapse'
    };
    await setSettings(settings);
    els.status.textContent = 'Saved.';
    await notifyContent('refresh');
  }

  async function init() {
    els.enabledButton = document.getElementById('enabledButton');
    els.hideMode = document.getElementById('hideMode');
    els.collapseMode = document.getElementById('collapseMode');
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

    els.hideMode.addEventListener('click', () => {
      setPressed(els.hideMode, true);
      setPressed(els.collapseMode, false);
      els.status.textContent = '';
    });

    els.collapseMode.addEventListener('click', () => {
      setPressed(els.hideMode, false);
      setPressed(els.collapseMode, true);
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
