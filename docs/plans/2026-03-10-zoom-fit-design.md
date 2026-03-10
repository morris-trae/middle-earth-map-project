# Map Zoom Fit Design

**Date:** 2026-03-10
**Status:** Approved

## Problem

`minZoom: -2` in `initMap()` prevents the user from zooming out far enough to see the full map image on mobile. A 7348×4320px image requires approximately zoom −4.2 to fit a 390px-wide phone. Pinching past −2 causes Leaflet to snap back.

## Goal

Allow the user to zoom out until the full map image is visible on screen, but no further. Panning stays locked to the image bounds (`setMaxBounds` unchanged).

## Solution

After `map.setMaxBounds(bounds)` in `loadMapOverlay()`, call:

```javascript
map.setMinZoom(map.getBoundsZoom(bounds));
```

`getBoundsZoom(bounds)` returns the exact zoom level that fits the full image in the current viewport. Setting this as `minZoom` dynamically means:
- The user can always zoom out to see the full image
- The user cannot zoom out further (map stays locked, no empty dark space)
- Works correctly on every screen size
- Recalculates automatically each time `loadMapOverlay()` is called (era switches)

## Design Decisions

- **Dynamic over static**: A fixed `minZoom: -6` would work but would allow zooming out to a postage stamp on large screens. Dynamic is always correct.
- **`initMap()` `minZoom: -2` unchanged**: Serves as a pre-load fallback before any overlay is set. It is immediately overridden by `setMinZoom` once the overlay loads.
- **`setMaxBounds` unchanged**: Panning restriction stays in place at all zoom levels.
