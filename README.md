# Preference Ranker — A or B?

A fun, colorful one-page web app to rank any list of items via A/B choices.

## Features
- Enter items (one per line), min 2, duplicates auto-removed
- A-or-B interactive comparisons with keyboard support (Left/A and Right/B)
- Live progress indicator and comparison count
- Confetti celebration and final ranked list
- Download your choice log as JSON
- Restart anytime to rank a new list

## Getting Started
This is a static site. Open `index.html` directly in your browser:

- macOS: double-click `index.html` or run: `open /Users/viveks/pref-rank/index.html`
- Or serve locally with any static server (optional):
  - `python3 -m http.server 8000` then visit `http://localhost:8000/`

## How The Ranking Works
The app uses an interactive binary insertion: each new item is placed into your current ranking via a short A/B search. This yields O(n log n) comparisons in the worst case and is intuitive for users.

## Keyboard Shortcuts
- Choose left: Left Arrow or `A`
- Choose right: Right Arrow or `B`

## Notes
- Your choices never leave your browser.
- The downloadable JSON includes the items and each comparison decision you made.

Enjoy ranking!
