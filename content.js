// YouTube Floating Player - content script
// Keeps the main video player fixed at the top of the viewport while scrolling.

(() => {
  "use strict";

  const PLACEHOLDER_ID = "ytfp-player-placeholder";
  const STYLE_ID = "ytfp-injected-styles";

  let scrollHandler = null;
  let currentTarget = null;
  let isFloating = false;
  let navObserver = null;

  function log(...args) {
    console.log("[YT Floating Player]", ...args);
  }

  function getPlaceholder() {
    return document.getElementById(PLACEHOLDER_ID);
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    // We inject styles via JS so we can use !important and target dynamic elements.
    // The key insight: we target #full-bleed-container (the outermost player wrapper)
    // and neutralize stacking contexts on ALL ancestors up to <body>.
    style.textContent = `
      #ytfp-player-placeholder {
        background: #000;
      }
    `;
    document.head.appendChild(style);
  }

  function cleanup() {
    if (scrollHandler) {
      window.removeEventListener("scroll", scrollHandler);
      scrollHandler = null;
    }

    unfloat();

    const placeholder = getPlaceholder();
    if (placeholder) {
      placeholder.remove();
    }

    currentTarget = null;
    isFloating = false;
  }

  function neutralizeAncestors(el) {
    let node = el.parentElement;
    while (node && node !== document.documentElement) {
      node.style.setProperty("contain", "none", "important");
      node.style.setProperty("transform", "none", "important");
      node.style.setProperty("will-change", "auto", "important");
      node.style.setProperty("filter", "none", "important");
      node.style.setProperty("perspective", "none", "important");
      node.style.setProperty("clip-path", "none", "important");
      node.style.setProperty("overflow", "visible", "important");
      node = node.parentElement;
    }
  }

  function restoreAncestors(el) {
    let node = el.parentElement;
    while (node && node !== document.documentElement) {
      node.style.removeProperty("contain");
      node.style.removeProperty("transform");
      node.style.removeProperty("will-change");
      node.style.removeProperty("filter");
      node.style.removeProperty("perspective");
      node.style.removeProperty("clip-path");
      node.style.removeProperty("overflow");
      node = node.parentElement;
    }
  }

  function floatTarget(target, height) {
    if (isFloating) return;

    // Create placeholder only when we actually float.
    let placeholder = getPlaceholder();
    if (!placeholder) {
      placeholder = document.createElement("div");
      placeholder.id = PLACEHOLDER_ID;
      placeholder.style.width = "100%";
      placeholder.style.background = "#000";
      target.parentNode.insertBefore(placeholder, target);
    }
    placeholder.style.height = height + "px";

    neutralizeAncestors(target);

    target.style.setProperty("position", "fixed", "important");
    target.style.setProperty("top", "0", "important");
    target.style.setProperty("left", "0", "important");
    target.style.setProperty("width", "100vw", "important");
    target.style.setProperty("z-index", "2147483647", "important");
    target.style.setProperty("background", "#000", "important");
    target.style.setProperty("height", height + "px", "important");

    // Hide the masthead so it doesn't compete.
    const masthead = document.querySelector("#masthead-container");
    if (masthead) {
      masthead.style.setProperty("z-index", "0", "important");
    }

    isFloating = true;
  }

  function unfloat() {
    if (!isFloating || !currentTarget) return;

    restoreAncestors(currentTarget);

    currentTarget.style.removeProperty("position");
    currentTarget.style.removeProperty("top");
    currentTarget.style.removeProperty("left");
    currentTarget.style.removeProperty("width");
    currentTarget.style.removeProperty("z-index");
    currentTarget.style.removeProperty("background");
    currentTarget.style.removeProperty("height");

    const masthead = document.querySelector("#masthead-container");
    if (masthead) {
      masthead.style.removeProperty("z-index");
    }

    // Remove placeholder when unfloating.
    const placeholder = getPlaceholder();
    if (placeholder) {
      placeholder.remove();
    }

    isFloating = false;
  }

  function setupFloating(target) {
    const height = target.offsetHeight;
    // Record the target's absolute Y position on the page at setup time.
    const triggerY = target.getBoundingClientRect().top + window.scrollY;

    scrollHandler = () => {
      if (!isFloating) {
        // Float when the top of the target would scroll off-screen.
        if (window.scrollY > triggerY) {
          floatTarget(target, height);
        }
      } else {
        // Unfloat when scrolling back above the trigger point.
        // Use placeholder position if it exists.
        const placeholder = getPlaceholder();
        if (placeholder && placeholder.getBoundingClientRect().top >= 0) {
          unfloat();
        }
      }
    };

    window.addEventListener("scroll", scrollHandler, { passive: true });
  }

  function init() {
    if (!location.pathname.startsWith("/watch")) return false;

    // Target the outermost player container — fewer ancestors to neutralize.
    const target = document.querySelector("#full-bleed-container");
    if (!target) return false;
    if (!target.offsetHeight) return false; // Not rendered yet.

    if (currentTarget === target) return true;

    cleanup();
    currentTarget = target;
    injectStyles();
    log("Floating enabled for", location.href);
    setupFloating(target);
    return true;
  }

  function waitForPlayer() {
    const MAX_WAIT = 8000;
    const INTERVAL = 300;
    const start = Date.now();

    const timer = setInterval(() => {
      if (init() || Date.now() - start > MAX_WAIT) {
        if (!currentTarget) log("Timed out waiting for player.");
        clearInterval(timer);
      }
    }, INTERVAL);

    init();
  }

  function observeNavigation() {
    let lastUrl = location.href;

    navObserver = new MutationObserver(() => {
      if (location.href === lastUrl) return;
      lastUrl = location.href;

      cleanup();

      if (location.pathname.startsWith("/watch")) {
        setTimeout(waitForPlayer, 400);
      }
    });

    // Observe <title> changes instead of body to avoid conflicts
    // with our own DOM mutations.
    const title = document.querySelector("title");
    if (title) {
      navObserver.observe(title, { childList: true });
    }
    // Also observe yt-navigate-finish event which YouTube fires on SPA navigation.
    window.addEventListener("yt-navigate-finish", () => {
      if (location.href === lastUrl) return;
      lastUrl = location.href;
      cleanup();
      if (location.pathname.startsWith("/watch")) {
        setTimeout(waitForPlayer, 400);
      }
    });
  }

  if (location.pathname.startsWith("/watch")) {
    waitForPlayer();
  }
  observeNavigation();
})();
