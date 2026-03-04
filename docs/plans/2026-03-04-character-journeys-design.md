# Character Journey Toggling — Design

**Date:** 2026-03-04
**Status:** Approved

## Summary

Add a Journeys section to the sidebar with checkboxes that let viewers toggle individual character journey paths on the map. Each active journey is drawn as a distinct-colored polyline. Multiple journeys can be active simultaneously. The existing Route dropdown is removed and replaced by this system.

## Data Model

A new top-level `journeys` array replaces the existing `routes` array in `data.json`.

```json
{
  "id": "frodo_sam",
  "name": "Frodo & Sam",
  "color": "#4a90d9",
  "points": ["shire", "bree", "weathertop", "rivendell", "moria", "lothlorien", "amon_hen", "emyn_muil", "dead_marshes", "mordor", "mount_doom"]
}
```

`points` is an ordered array of existing location `id` values. Paths are rough (key waypoints only) at launch, refinable over time.

### Five launch journeys

| Journey | Color |
|---|---|
| Frodo & Sam | `#4a90d9` (blue) |
| Aragorn | `#2ecc71` (green) |
| Gandalf | `#bdc3c7` (light grey) |
| Legolas & Gimli | `#f1c40f` (gold) |
| Merry & Pippin | `#e67e22` (orange) |

The existing `routes` array and the `frodo` route entry are removed. The `frodo_sam` journey entry absorbs/replaces that data.

## UI

The existing "Route" `<label>` + `<select id="route">` elements are removed from `index.html`.

A new "Journeys" `<section>` is added to the panel controls, rendered dynamically from `DATA.journeys`:

```
Journeys
  ● [checkbox] Frodo & Sam
  ● [checkbox] Aragorn
  ● [checkbox] Gandalf
  ● [checkbox] Legolas & Gimli
  ● [checkbox] Merry & Pippin
```

Each row: a small colored dot (`<span>` with inline `background-color` from `journey.color`) + a `<label>` + `<input type="checkbox">`. Generated entirely from data — adding a new journey to `data.json` makes it appear automatically with no HTML changes.

## App Logic

### State

`state.route` (string) is removed and replaced by:

```js
state.activeJourneys = new Set(); // Set<journeyId>
```

### New / changed functions

**`initJourneys()`** (new, called from `main()` after data load):
- Finds or creates a `#journeys` container in the sidebar
- Iterates `DATA.journeys`, creates checkbox + colored dot + label per entry
- Each checkbox `change` event: adds or removes the journey ID from `state.activeJourneys`, then calls `renderJourneys()`

**`renderJourneys()`** (replaces `renderRoutes()`):
- Clears `routesLayer`
- Loops `DATA.journeys`; skips entries not in `state.activeJourneys`
- For active entries: resolves `points` → location `lat`/`lng` coordinates → draws `L.polyline` with `color`, weight 4, opacity 0.85

**Reset button**: Clears `state.activeJourneys`, unchecks all journey checkboxes, calls `renderJourneys()`.

### Unchanged

- `matchesFilters()`, `renderMarkers()`, timeline, map overlay switching — no changes.
- `buildRouteLatLng()` is removed (logic absorbed into `renderJourneys()`).
- `initRouteSelector()` is removed.

## Out of Scope

- Animated/dashed line effects
- Clicking a journey line to show character info
- Non-Fellowship characters at launch
- Detailed waypoint paths (can be refined by editing data.json)
