# Journey Pages — Design Document

**Date:** 2026-03-13
**Feature:** Dedicated interactive journey reference pages
**Status:** Approved

---

## Overview

Add a Journeys section to the Middle-earth map site. Each character's journey gets a dedicated page with the full Middle-earth map on the left and a book-accurate narrative on the right. Clicking map waypoints scrolls the text; scrolling the text highlights the active waypoint on the map.

---

## Files

| File | Purpose |
|------|---------|
| `journeys/index.html` | Index page listing all character journeys with a one-line teaser and link to each page |
| `journeys/frodo-sam.html` | Frodo & Sam interactive reference page (first to be built) |
| `journeys/journeys.css` | Styles for all journey pages, separate from main map styles |

A "Journeys" nav link is added to the main map (`index.html`) to navigate to `journeys/index.html`.

---

## Page Layout

Side-by-side split, full viewport height:

- **Left column (~40%)** — Leaflet map, fixed/sticky. Displays the full Middle-earth map with only the character's route drawn on it. Named story locations appear as small markers (Shire, Bree, Weathertop, Rivendell, Moria, Lothlórien, Amon Hen, Emyn Muil, Dead Marshes, Black Gate, Ithilien, Cirith Ungol, Mount Doom, Grey Havens). Internal waypoints (e.g. `anduin_wp_1`) are not shown as markers.
- **Right column (~60%)** — Narrative text, scrollable. Each section has a heading and the full written narrative beneath it.

---

## Interactivity

### Map → Text
Clicking a named marker:
- Scrolls the right column to the corresponding section
- Briefly highlights the section heading (e.g. flash or color pulse)

### Text → Map
As the reader scrolls through the narrative, an `IntersectionObserver` detects which section is in view and pulses/highlights the corresponding marker on the map.

### Duplicate Location: The Shire
The Shire appears twice in Frodo & Sam's journey:
1. *"The Long Shadow Over the Shire"* — the beginning
2. *"The Return to the Shire — and the Scouring"* — the end

Clicking the Shire marker shows a small inline tooltip with two choices:
- "The Long Shadow Over the Shire"
- "The Return to the Shire — and the Scouring"

The reader selects which section to jump to.

---

## Narrative Sections (Frodo & Sam)

Each section maps to one or more named locations on the map:

| Section Heading | Primary Map Location(s) |
|----------------|------------------------|
| The Long Shadow Over the Shire | Shire |
| The Old Forest and the Barrow-downs | (no current marker — between Shire and Bree) |
| Bree and the Arrival of Strider | Bree |
| Weathertop and the Wound That Would Not Heal | Weathertop (Amon Sûl) |
| Rivendell and the Fellowship | Rivendell |
| Moria, Lothlórien, and the Breaking of the Fellowship | Moria, Lothlórien, Amon Hen |
| The Emyn Muil, the Dead Marshes, and Gollum | Emyn Muil, Dead Marshes, Black Gate |
| Ithilien, Faramir, and the Road to Cirith Ungol | Ithilien |
| Shelob's Lair and the Pass of Cirith Ungol | Cirith Ungol |
| The Tower of Cirith Ungol and the Plains of Gorgoroth | Cirith Ungol tower, Gorgoroth |
| The Crack of Doom | Mount Doom |
| The Return to the Shire — and the Scouring | Shire |
| The Grey Havens | Grey Havens |

---

## Data

Narrative text is written directly into `journeys/frodo-sam.html` as HTML. Each section is a `<section>` element with a unique `id` (e.g. `id="shire-start"`, `id="bree"`, `id="weathertop"`). This keeps the page self-contained and avoids JSON complexity for long-form prose.

Future journey pages follow the same pattern.

---

## Journeys Index Page

`journeys/index.html` lists all available journey pages with:
- Character name
- One-line teaser (e.g. "From the Shire to Mount Doom and back again.")
- Link to the individual journey page

---

## Navigation

A "Journeys" link is added to the header/nav area of `index.html` (the main map page), linking to `journeys/index.html`.
