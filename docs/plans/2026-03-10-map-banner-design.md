# Map Banner Design

**Date:** 2026-03-10
**Status:** Approved

## Goal

Add a floating "Middle Earth Map Project" banner to the top-center of the map area without affecting existing layout, markers, or controls.

## Approach

Static HTML + CSS only. No JS changes required.

## Implementation

### HTML (`index.html`)

Add inside `.mapWrap`, before `#map`:

```html
<div class="map-banner">Middle Earth Map Project</div>
```

### CSS (`styles.css`)

Desktop (default):

```css
.map-banner {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 990;
  white-space: nowrap;
  padding: 8px 18px;
  border-radius: 12px;
  background: rgba(11, 15, 20, 0.80);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text);
  font-size: 14px;
  font-weight: 700;
  pointer-events: none;
}
```

Mobile (inside existing media query):

```css
.map-banner { display: none; }
```

## Design Decisions

- **z-index: 990** — below the age-selector (999) and hamburger (1000) so existing controls remain on top
- **pointer-events: none** — banner never intercepts map clicks or pan gestures
- **Hidden on mobile** — avoids overlap with hamburger (top-left) and age-selector (top-right) on narrow screens; the sidebar already shows "Middle-earth Atlas" as a title
- **Dark glass style** — matches the existing UI (dark theme, blurred panels, rounded corners)
