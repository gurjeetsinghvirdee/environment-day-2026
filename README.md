# Earth Is Dying

A stark, single-page climate awareness site built for World Environment Day 2026. The page combines live environmental counters, an interactive personal impact calculator, data-backed stat blocks, charts, and an English/Hindi language toggle.

## Features

- Live counters that update while the page is open
- Personal impact calculator for commute, AC usage, diet, and electricity
- Global data sections covering emissions, biodiversity loss, pollution, and forest loss
- Chart visualizations powered by Chart.js
- English and Hindi copy throughout the experience
- Fixed UI elements like the top status bar and back-to-top button

## Files

- `index.html` - Page structure and content
- `styles.css` - All layout, typography, and visual styling
- `script.js` - Counters, language switching, calculator logic, and charts
- `assets/` - Supporting images and media

## Run It

This project has no build step. Open `index.html` directly in a browser, or serve the folder with any static file server.

For example, with Python installed:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Dependencies

The page loads external assets from CDNs:

- Google Fonts
- Chart.js

An internet connection is required for those resources to load correctly.

## Notes

- The page is designed as a static campaign-style experience, not a framework app.
- If you change the HTML structure, keep the element IDs used by `script.js` in sync so the counters and charts continue working.
