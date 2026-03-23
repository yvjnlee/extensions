(function () {
  const api = typeof browser !== 'undefined' ? browser : chrome;
  const defaultSettings = {
    enabled: true,
    mode: 'hide'
  };

  async function getSettings() {
    const stored = await api.storage.local.get(defaultSettings);
    return { ...defaultSettings, ...stored };
  }

  async function setSettings(settings) {
    await api.storage.local.set(settings);
    return getSettings();
  }

  window.XArticleFilterStorage = {
    api,
    defaultSettings,
    getSettings,
    setSettings
  };
})();
