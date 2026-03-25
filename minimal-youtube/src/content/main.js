(function () {
  const { api, getSettings } = window.MinimalYoutubeStorage;

  const STYLE_ID = 'minimal-youtube-style';
  const HIDDEN_ATTR = 'data-minimal-youtube-hidden';
  const SPLASH_ID = 'minimal-youtube-home-splash';

  let settings = { enabled: true };
  let observer = null;
  let applyTimer = null;
  let allowAllOnPage = false;

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      [${HIDDEN_ATTR}="true"] {
        display: none !important;
      }
      #${SPLASH_ID} {
        --minimal-youtube-fg: #0f1115;
        --minimal-youtube-link: #3a3d45;
        display: none;
        max-width: 560px;
        margin: 0;
        padding: 0 16px;
        background: transparent;
        color: var(--minimal-youtube-fg);
        text-align: center;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: min(92vw, 560px);
        z-index: 2147483647;
      }
      @media (prefers-color-scheme: dark) {
        #${SPLASH_ID} {
          --minimal-youtube-fg: #f3f4f6;
          --minimal-youtube-link: #c9ccd3;
        }
      }
      #${SPLASH_ID}[data-visible="true"] {
        display: block;
      }
      #${SPLASH_ID} .frame {
        display: inline-grid;
        grid-template-columns: auto auto;
        gap: 18px;
        align-items: start;
        text-align: left;
        max-width: 100%;
      }
      #${SPLASH_ID} .logo,
      #${SPLASH_ID} .meta,
      #${SPLASH_ID} .cta {
        font: 13px/1.35 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      }
      #${SPLASH_ID} .logo {
        margin: 0;
        white-space: pre;
        color: var(--minimal-youtube-fg);
      }
      #${SPLASH_ID} .meta {
        margin: 0;
        white-space: pre;
        color: var(--minimal-youtube-fg);
      }
      #${SPLASH_ID} .cta {
        display: inline-block;
        margin-top: 12px;
        color: var(--minimal-youtube-link);
        text-decoration: none;
      }
      #${SPLASH_ID} .cta:hover {
        text-decoration: underline;
      }
      @media (max-width: 720px) {
        #${SPLASH_ID} .frame {
          grid-template-columns: 1fr;
          gap: 10px;
          justify-items: center;
        }
        #${SPLASH_ID} .meta {
          text-align: left;
        }
      }
    `;
    document.documentElement.appendChild(style);
  }

  function isHomeRoute() {
    const path = (location.pathname || '').toLowerCase();
    return path === '/' || path === '/feed/recommended';
  }

  function clearHidden(root = document) {
    root.querySelectorAll(`[${HIDDEN_ATTR}="true"]`).forEach((el) => {
      el.removeAttribute(HIDDEN_ATTR);
    });
  }

  function ensureHomeSplash() {
    let splash = document.getElementById(SPLASH_ID);
    if (splash) return splash;

    splash = document.createElement('section');
    splash.id = SPLASH_ID;
    splash.setAttribute('data-visible', 'false');
    splash.innerHTML = `
      <div class="frame" role="img" aria-label="minimal-youtube status display">
        <pre class="logo"> /\_/\\
(=^.^=)
 (")(")</pre>
        <pre class="meta">minimal.youtube
────────────────
site:     youtube.com
module:   home feed
shorts:   hidden
status:   paused
next:     subscriptions</pre>
      </div>
      <a class="cta" href="/feed/subscriptions" aria-label="Open Subscriptions">> open /feed/subscriptions</a>
    `;

    const target = document.querySelector('ytd-page-manager, #content') || document.body;
    target.prepend(splash);
    return splash;
  }

  function setHomeSplashVisible(visible) {
    const splash = ensureHomeSplash();
    splash.setAttribute('data-visible', visible ? 'true' : 'false');
  }

  function hideHomeFeed(root = document) {
    if (!isHomeRoute()) {
      setHomeSplashVisible(false);
      return;
    }

    const homeContainers = root.querySelectorAll(
      'ytd-rich-grid-renderer, ytd-two-column-browse-results-renderer, ytd-browse[page-subtype="home"], ytd-browse'
    );
    homeContainers.forEach((container) => {
      container.setAttribute(HIDDEN_ATTR, 'true');
    });

    setHomeSplashVisible(true);
  }

  function hideShortsSurfaces(root = document) {
    const selectors = [
      'a[href^="/shorts/"]',
      'a[href="/shorts"]',
      'ytd-reel-shelf-renderer',
      'ytd-rich-shelf-renderer',
      'ytd-guide-entry-renderer a[href^="/shorts"]',
      'ytd-mini-guide-entry-renderer a[href^="/shorts"]',
      'yt-chip-cloud-chip-renderer a[href*="shorts"]'
    ];

    root.querySelectorAll(selectors.join(',')).forEach((node) => {
      const container = node.closest(
        'ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-rich-shelf-renderer, ytd-reel-shelf-renderer, ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer, yt-chip-cloud-chip-renderer'
      ) || node;
      if (container instanceof Element) {
        container.setAttribute(HIDDEN_ATTR, 'true');
      }
    });
  }

  function apply(root = document) {
    if (!settings.enabled || allowAllOnPage) {
      clearHidden(root);
      setHomeSplashVisible(false);
      return;
    }

    hideHomeFeed(document);
    hideShortsSurfaces(root);
  }

  function scheduleApply(root = document) {
    if (applyTimer) {
      window.clearTimeout(applyTimer);
      applyTimer = null;
    }
    apply(root);
  }

  function resetOnNavigation() {
    allowAllOnPage = false;
    clearHidden(document);
    scheduleApply(document);
  }

  function attachObserver() {
    observer?.disconnect();
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) {
            scheduleApply(node);
            return;
          }
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  async function refreshSettings() {
    settings = await getSettings();
    scheduleApply(document);
  }

  function listen() {
    api.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if (changes.enabled) refreshSettings();
    });

    api.runtime.onMessage.addListener((message) => {
      if (!message || message.type !== 'MINIMAL_YOUTUBE_ACTION') return;
      if (message.action === 'showAllOnPage') {
        allowAllOnPage = true;
        clearHidden(document);
        setHomeSplashVisible(false);
      }
      if (message.action === 'refresh') {
        allowAllOnPage = false;
        refreshSettings();
      }
    });

    window.addEventListener('yt-navigate-finish', resetOnNavigation);
    window.addEventListener('yt-page-data-updated', resetOnNavigation);
    window.addEventListener('popstate', resetOnNavigation);
  }

  async function init() {
    ensureStyles();
    ensureHomeSplash();
    await refreshSettings();
    attachObserver();
    listen();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
