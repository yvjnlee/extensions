(function () {
  const { api, getSettings, setSettings } = window.MinimalYoutubeStorage;
  const els = {};

  function setPressed(button, pressed) {
    button.setAttribute('aria-pressed', String(pressed));
    button.textContent = pressed ? 'On' : 'Off';
  }

  async function withActiveTab(callback) {
    const tabs = await api.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) await callback(tabs[0].id);
  }

  async function notifyContent(action) {
    try {
      await withActiveTab((tabId) => api.tabs.sendMessage(tabId, {
        type: 'MINIMAL_YOUTUBE_ACTION',
        action
      }));
    } catch (_error) {
      // Ignore when popup is opened outside youtube.com.
    }
  }

  async function persist() {
    await setSettings({ enabled: els.enabledButton.getAttribute('aria-pressed') === 'true' });
    await notifyContent('refresh');
    els.status.textContent = 'Saved.';
  }

  async function init() {
    els.enabledButton = document.getElementById('enabledButton');
    els.showAllButton = document.getElementById('showAllButton');
    els.status = document.getElementById('status');

    const settings = await getSettings();
    setPressed(els.enabledButton, settings.enabled);

    els.enabledButton.addEventListener('click', async () => {
      const next = els.enabledButton.getAttribute('aria-pressed') !== 'true';
      setPressed(els.enabledButton, next);
      await persist();
    });

    els.showAllButton.addEventListener('click', async () => {
      await notifyContent('showAllOnPage');
      els.status.textContent = 'Showing all content on this page.';
    });
  }

  document.addEventListener('DOMContentLoaded', init, { once: true });
})();
