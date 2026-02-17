## YouTube Floating Player (Chrome Extension)

Keeps the YouTube video fixed at the top of the screen so you can scroll through the description and comments without losing sight of the video.

### How to load the extension in Chrome

1. Open Chrome and go to `chrome://extensions`.
2. Turn on **Developer mode** (top-right corner).
3. Click **Load unpacked**.
4. Select the `YouTube Floating` folder (this project directory).
5. Open a YouTube video page (`https://www.youtube.com/watch?...`) and scroll down — the player should stay fixed at the top.

### Notes

- Works on standard YouTube watch pages (desktop).
- Handles YouTube SPA navigation — the floating behavior re-initializes when navigating between videos.
- The placeholder element preserves layout height so the page doesn't jump when the player becomes fixed.
- If something stops working, check the DevTools console for messages prefixed with `[YT Floating Player]`.
