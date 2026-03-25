(function () {
  const api = typeof browser !== 'undefined' ? browser : chrome;
  const defaultSettings = {
    enabled: true
  };

  async function getSettings() {
    const stored = await api.storage.local.get(defaultSettings);
    return { ...defaultSettings, ...stored };
  }

  async function setSettings(settings) {
    await api.storage.local.set(settings);
    return getSettings();
  }

  window.MinimalYoutubeStorage = {
    api,
    defaultSettings,
    getSettings,
    setSettings
  };
})();
