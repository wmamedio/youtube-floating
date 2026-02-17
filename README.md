# YouTube Floating Player

A Chrome extension that keeps the YouTube video player fixed at the top of your screen while you scroll — so you never lose sight of what you're watching.

## Why?

- **Read lyrics** in the video description while the music plays
- **Browse comments** without the video disappearing off-screen
- **Watch and scroll** freely — the player stays pinned at the top

When you scroll past the video, it locks to the top of the viewport and the YouTube top bar is hidden to give you maximum screen space. Scroll back up and everything returns to normal.

## Install (unpacked)

1. Clone or download this repo
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select this project folder
5. Open any YouTube video and scroll down

## How it works

When you scroll past the video on a YouTube watch page, the extension:

1. Pins the video player to the top of the viewport
2. Hides the YouTube top bar so the video gets full width
3. Inserts a placeholder to prevent the page from jumping
4. Restores everything when you scroll back up

The extension handles YouTube's SPA navigation, so it re-initializes automatically when you switch between videos.

## Troubleshooting

If something stops working, check the DevTools console for messages prefixed with `[YT Floating Player]`.
