# iOS Orientation — Panel Auto-Close Design

**Date:** 2026-03-04

## Problem

On iOS, when the user rotates the device from portrait to landscape, the viewport width exceeds 768px. The desktop CSS layout kicks in: the panel becomes permanently visible and the hamburger toggle is hidden (`display: none`). If the panel was open in portrait, it stays open in landscape with no way to dismiss it.

## Solution

Add a single `resize` event listener in `app.js`, wired up during initialization.

- Track the previous viewport width (`lastWidth`).
- When the width crosses from `≤768px` → `>768px` (portrait→landscape transition), force-close the panel: remove `panel--open` from `.app`, reset the hamburger icon and `aria-expanded`.
- On every resize, call `map.invalidateSize()` so Leaflet re-renders correctly in the new dimensions.

## Scope

- **File changed:** `app.js` only
- **No CSS changes**
- **No new files**
- The existing `closePanelOnMobile()` function is unchanged; its guard (`innerWidth > 768` → return early) is correct for its own callers.

## Implementation Sketch

```js
let lastWidth = window.innerWidth;

window.addEventListener('resize', () => {
  const newWidth = window.innerWidth;

  if (newWidth > 768 && lastWidth <= 768) {
    const appEl = document.querySelector('.app');
    const toggle = document.getElementById('menuToggle');
    if (appEl) appEl.classList.remove('panel--open');
    if (toggle) {
      toggle.innerHTML = '&#9776;';
      toggle.setAttribute('aria-expanded', 'false');
    }
  }

  lastWidth = newWidth;
  if (map) map.invalidateSize();
});
```
