# Mobile Responsive Design

**Date:** 2026-03-03
**Goal:** Make the Middle-earth Atlas website fully usable on mobile and tablet browsers without introducing new dependencies or a build system.

---

## Approach

CSS media query + JS toggle (Approach A). The desktop layout is untouched. A single `@media (max-width: 768px)` block switches the layout to a collapsible side panel driven by a CSS class toggle.

---

## Architecture

- No new dependencies. No build step. No changes to data loading, markers, routes, or filters.
- At `max-width: 768px`, the layout switches from a 2-column grid to a flex column layout.
- The `.panel` is positioned off-screen left (`transform: translateX(-100%)`) by default on mobile.
- A `panel--open` class on `.app` slides the panel in and pushes the map right via flex layout.
- A `≡` hamburger button (fixed, top-left of map) toggles `panel--open`.
- Selecting a location auto-closes the panel so the map becomes the focus.

**Files changed:**
| File | Change |
|---|---|
| `index.html` | Add `<button id="menuToggle">` |
| `styles.css` | Add one `@media` block (~60 lines) |
| `app.js` | Add hamburger toggle handler + auto-close on marker select (~15 lines) |

---

## UI Details

**Hamburger button**
- Fixed, `top: 10px; left: 10px`, matches existing dark `.btn` style
- Shows `≡` when closed, `✕` when open
- Hidden on desktop via `display: none` above 768px

**Panel on mobile**
- Width: `300px` (narrower than desktop 360px — leaves a sliver of map visible)
- Full viewport height, internally scrollable
- Slides in with `0.25s ease` CSS transition
- z-index above the map

**Backdrop**
- `rgba(0,0,0,0.45)` overlay behind panel, over map
- Tapping backdrop closes panel

**Touch targets**
- Buttons and selects: `min-height: 44px` on mobile
- Timeline slider: taller hit area on mobile

**Map interactions**
- Leaflet handles pinch-to-zoom and touch panning natively — no changes needed

---

## Edge Cases

| Case | Handling |
|---|---|
| Phone rotated to landscape | Panel stays collapsed; hamburger still accessible |
| Marker tapped on mobile | Panel auto-closes after lore loads |
| Reset button | No change needed; panel stays in current open/closed state |
| Very small screens (320px) | 300px panel leaves 20px map sliver visible — intentional |

---

## Out of Scope (YAGNI)

- Tablet-specific breakpoint (768px covers it)
- Swipe gesture to open/close panel
- Backdrop fade animation
- localStorage panel state persistence

---

## Testing Plan

1. Resize browser devtools to 375px (iPhone SE) and 390px (iPhone 14)
2. Open/close panel — verify map resizes correctly
3. Tap a marker — verify panel auto-closes, lore visible when re-opened
4. Verify desktop layout (1440px) is completely unchanged
5. Test on actual phone (Chrome Android or Safari iOS)
