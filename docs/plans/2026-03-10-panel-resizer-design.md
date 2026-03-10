# Panel Resizer Design

**Date:** 2026-03-10
**Status:** Approved

## Goal

Add a draggable handle between the sidebar panel and the map on mobile, letting the user resize how much screen space each takes.

## Approach

DOM resizer element + touch/mouse events. No new dependencies.

## Implementation

### HTML (`index.html`)

Add between `.panel` and `.mapWrap`:

```html
<div class="panel-resizer" id="panelResizer"></div>
```

### CSS (`styles.css`)

Desktop: hidden (panel is always visible at fixed width, no resize needed).

Mobile, default (panel closed): hidden.

Mobile, when `panel--open`:

```css
.app.panel--open .panel-resizer {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 100%;
  flex-shrink: 0;
  background: var(--panel2);
  border-right: 1px solid var(--border);
  cursor: col-resize;
  color: var(--muted);
  font-size: 10px;
  user-select: none;
  touch-action: none;
}
```

### JS (`app.js`)

New `initPanelResizer()` function, called from `main()`:

- Track `panelWidth` variable (default 300, persists within session)
- `touchstart` / `mousedown` on `#panelResizer` → begin drag
- `touchmove` / `mousemove` → `newWidth = clientX` clamped to `[160, window.innerWidth - 80]` → `panel.style.width = newWidth + 'px'` → `map.invalidateSize()`
- `touchend` / `mouseup` → save width to `panelWidth`, stop drag
- When hamburger opens the panel: apply `panelWidth` to `panel.style.width`
- When panel closes (`closePanelOnMobile` / landscape rotation): clear `panel.style.width` (let CSS control it)

## Design Decisions

- **`touch-action: none`** on resizer — prevents browser scroll/zoom interfering with the drag gesture
- **Min width 160px** — keeps the panel usable (search input, controls visible)
- **Max width `window.innerWidth - 80px`** — always leaves at least 80px of map visible
- **Session persistence** — last dragged width is remembered so reopening the panel restores it
- **Hidden on desktop** — desktop layout is a CSS grid with a fixed 360px panel; resize not needed there
- **`map.invalidateSize()` on every move** — keeps Leaflet tile/overlay rendering correct as the container changes width
