// YouTube Floating Player - content script
// Keeps the main video player fixed at the top of the viewport while scrolling.

(() => {
  "use strict";

  const FLOATING_CLASS = "ytfp-floating-enabled";
  const PLACEHOLDER_ID = "ytfp-player-placeholder";
  const PLAYER_SELECTOR = "#movie_player";

  let scrollHandler = null;
  let resizeObserver = null;
  let currentPlayer = null;

  function log(...args) {
    console.log("[YT Floating Player]", ...args);
  }

  function getPlaceholder() {
    return document.getElementById(PLACEHOLDER_ID);
  }

  function cleanup() {
    if (scrollHandler) {
      window.removeEventListener("scroll", scrollHandler);
      scrollHandler = null;
    }

    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }

    document.documentElement.classList.remove(FLOATING_CLASS);

    const placeholder = getPlaceholder();
    if (placeholder) {
      placeholder.remove();
    }

    currentPlayer = null;
  }

  function syncPlaceholderHeight(player, placeholder) {
    const height = player.offsetHeight;
    if (height > 0) {
      placeholder.style.height = `${height}px`;
    }
  }

  function createPlaceholder(player) {
    let placeholder = getPlaceholder();
    if (!placeholder) {
      placeholder = document.createElement("div");
      placeholder.id = PLACEHOLDER_ID;
      placeholder.style.width = "100%";
      player.parentNode.insertBefore(placeholder, player);
    }
    syncPlaceholderHeight(player, placeholder);
    return placeholder;
  }

  function setupFloating(player) {
    const placeholder = createPlaceholder(player);

    // Keep placeholder height in sync when the player resizes (e.g. theater mode toggle).
    resizeObserver = new ResizeObserver(() => {
      syncPlaceholderHeight(player, placeholder);
    });
    resizeObserver.observe(player);

    scrollHandler = () => {
      const shouldFloat = placeholder.getBoundingClientRect().top < 0;

      if (shouldFloat) {
        document.documentElement.classList.add(FLOATING_CLASS);
      } else {
        document.documentElement.classList.remove(FLOATING_CLASS);
      }
    };

    window.addEventListener("scroll", scrollHandler, { passive: true });
    scrollHandler(); // run once in case the page loads already scrolled
  }

  function init() {
    if (!location.pathname.startsWith("/watch")) return;

    const player = document.querySelector(PLAYER_SELECTOR);
    if (!player) return false;

    // Already tracking this player — nothing to do.
    if (currentPlayer === player) return true;

    cleanup();
    currentPlayer = player;
    log("Floating enabled for", location.href);
    setupFloating(player);
    return true;
  }

  // Retry until the player element appears in the DOM.
  function waitForPlayer() {
    const MAX_WAIT = 8000;
    const INTERVAL = 300;
    const start = Date.now();

    const timer = setInterval(() => {
      if (init() || Date.now() - start > MAX_WAIT) {
        if (!currentPlayer) log("Timed out waiting for player.");
        clearInterval(timer);
      }
    }, INTERVAL);

    // Also try immediately.
    init();
  }

  // YouTube is a SPA — detect navigation by watching the URL.
  function observeNavigation() {
    let lastUrl = location.href;

    const observer = new MutationObserver(() => {
      if (location.href === lastUrl) return;
      lastUrl = location.href;

      cleanup();

      if (location.pathname.startsWith("/watch")) {
        // Small delay to let the new page render.
        setTimeout(waitForPlayer, 400);
      }
    });

    observer.observe(document.body, { subtree: true, childList: true });
  }

  // Entry point.
  if (location.pathname.startsWith("/watch")) {
    waitForPlayer();
  }
  observeNavigation();
})();
