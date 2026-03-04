# Character Journey Toggling — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the single-select Route dropdown with a Journeys section (checkboxes) that lets viewers toggle multiple character journey paths simultaneously, each drawn as a distinct-colored polyline on the map.

**Architecture:** `data.json` gains a `journeys` array (replacing `routes`). `app.js` replaces `state.route` string with `state.activeJourneys` Set, replaces `renderRoutes()` with `renderJourneys()`, and adds `initJourneys()` to dynamically build checkboxes from the data. No HTML or CSS changes needed for adding future journeys — just add to data.json.

**Tech Stack:** Vanilla JS, Leaflet.js (L.polyline), no build step. Verify JSON with `python3 -c "import json; json.load(open('data.json')); print('valid')"`.

---

## Reference: Existing location IDs in data.json (Third Age)

Use these IDs for journey `points` arrays. All are `era: "third"`:
```
shire, bree, amon_sul_weathertop, rivendell, khazad_dum, lothlorien,
emyn_muil, morannon_the_black_gate, mordor, mt_doom_orodruin,
edoras, helms_deep, isengard, fangorn_forest, stone_of_erech,
pelargir, minas_tirith, minas_morgul, barad_dur, osgiliath
```

---

### Task 1: Replace `routes` with `journeys` in data.json

**Files:**
- Modify: `data.json`

**Step 1: Locate the routes block**

In `data.json`, find the `"routes"` key (currently at the top level with one entry: `frodo`).

**Step 2: Replace with journeys array**

Delete the entire `"routes": [...]` block and replace it with:

```json
"journeys": [
  {
    "id": "frodo_sam",
    "name": "Frodo & Sam",
    "color": "#5b8dd9",
    "points": [
      "shire", "bree", "amon_sul_weathertop", "rivendell",
      "khazad_dum", "lothlorien", "emyn_muil",
      "morannon_the_black_gate", "mordor", "mt_doom_orodruin"
    ]
  },
  {
    "id": "aragorn",
    "name": "Aragorn",
    "color": "#3cb371",
    "points": [
      "shire", "bree", "amon_sul_weathertop", "rivendell",
      "khazad_dum", "lothlorien", "emyn_muil",
      "edoras", "helms_deep", "isengard",
      "stone_of_erech", "pelargir", "minas_tirith"
    ]
  },
  {
    "id": "gandalf",
    "name": "Gandalf",
    "color": "#c0c0c0",
    "points": [
      "shire", "bree", "rivendell", "khazad_dum",
      "edoras", "helms_deep", "minas_tirith",
      "morannon_the_black_gate"
    ]
  },
  {
    "id": "legolas_gimli",
    "name": "Legolas & Gimli",
    "color": "#daa520",
    "points": [
      "rivendell", "khazad_dum", "lothlorien", "emyn_muil",
      "fangorn_forest", "isengard", "edoras", "helms_deep",
      "stone_of_erech", "pelargir", "minas_tirith"
    ]
  },
  {
    "id": "merry_pippin",
    "name": "Merry & Pippin",
    "color": "#e07820",
    "points": [
      "shire", "bree", "rivendell", "khazad_dum",
      "lothlorien", "emyn_muil", "fangorn_forest",
      "isengard", "edoras", "helms_deep", "minas_tirith"
    ]
  }
]
```

**Step 3: Validate JSON**

```bash
python3 -c "import json; json.load(open('data.json')); print('valid')"
```

Expected: `valid`

**Step 4: Commit**

```bash
git add data.json
git commit -m "feat: replace routes with journeys array in data.json"
```

---

### Task 2: Update index.html — remove Route control, add journeys container

**Files:**
- Modify: `index.html`

**Step 1: Remove the Route column from the `.row` div**

Find this block in `index.html` (inside `.controls`):

```html
<div class="row">
  <div class="col">
    <label class="label" for="era">Era</label>
    <select id="era" class="select">
      <option value="all">All eras</option>
      <option value="first">First Age</option>
      <option value="second">Second Age</option>
      <option value="third">Third Age</option>
      <option value="fourth">Fourth Age</option>
    </select>
  </div>
  <div class="col">
    <label class="label" for="route">Route</label>
    <select id="route" class="select">
      <option value="none">None</option>
    </select>
  </div>
</div>
```

Replace the entire block with (removes the Route col and the `.row`/`.col` wrappers — Era now sits inline like the search input):

```html
<label class="label" for="era">Era</label>
<select id="era" class="select">
  <option value="all">All eras</option>
  <option value="first">First Age</option>
  <option value="second">Second Age</option>
  <option value="third">Third Age</option>
  <option value="fourth">Fourth Age</option>
</select>
```

**Step 2: Add journeys container**

Immediately after the Era select (before the `.timeline` div), add:

```html
<div id="journeys-container"></div>
```

**Step 3: Verify structure**

Open `index.html` in a browser. The sidebar controls section should now show: Search → Era → (empty journeys area) → Timeline. No "Route" label or dropdown visible.

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: remove route dropdown, add journeys container to sidebar"
```

---

### Task 3: Remove old route code from app.js

**Files:**
- Modify: `app.js`

Remove the following — in order, one at a time. After each removal, save the file and confirm the file is still syntactically valid (look for mismatched braces).

**Step 1: Remove `state.route` from the state object**

Find:
```js
const state = {
  query: "",
  era: "all",
  year: 999999,
  route: "none",
  selectedLocationId: null
};
```

Remove the `route: "none",` line. Result:
```js
const state = {
  query: "",
  era: "all",
  year: 999999,
  selectedLocationId: null
};
```

**Step 2: Remove `buildRouteLatLng()` function**

Delete the entire function (lines ~261–273):
```js
function buildRouteLatLng(route) {
  const points = Array.isArray(route.points) ? route.points : [];
  const latLngs = [];

  for (const pointId of points) {
    const loc = (DATA.locations || []).find((item) => item.id === pointId);
    if (!loc) continue;
    if (!matchesFilters(loc)) continue;
    latLngs.push([loc.lat, loc.lng]);
  }

  return latLngs;
}
```

**Step 3: Remove `renderRoutes()` function**

Delete the entire function (lines ~275–293):
```js
function renderRoutes() {
  if (!routesLayer) return;
  routesLayer.clearLayers();

  if (state.route === "none") return;

  const route = (DATA.routes || []).find((r) => r.id === state.route);
  if (!route) return;

  const latLngs = buildRouteLatLng(route);
  if (latLngs.length < 2) return;

  const style = route.style || {};
  L.polyline(latLngs, {
    color: style.color || "#e4572e",
    weight: Number(style.weight) || 4,
    opacity: Number(style.opacity) || 0.9
  }).addTo(routesLayer);
}
```

**Step 4: Remove `initRouteSelector()` function**

Delete the entire function (lines ~319–333):
```js
function initRouteSelector() {
  const routeEl = document.getElementById("route");
  if (!routeEl) return;

  routeEl.innerHTML = `<option value="none">None</option>`;

  for (const route of DATA.routes || []) {
    const option = document.createElement("option");
    option.value = route.id;
    option.textContent = route.name || route.id;
    routeEl.appendChild(option);
  }

  routeEl.value = state.route;
}
```

**Step 5: Remove route listener from `bindUI()`**

In `bindUI()`, find and delete this block:
```js
const routeEl = document.getElementById("route");
if (routeEl) {
  routeEl.addEventListener("change", () => {
    state.route = routeEl.value || "none";
    renderRoutes();
  });
}
```

**Step 6: Remove route-related reset logic from the reset button handler**

In `bindUI()`, find the reset button click handler. Remove these lines inside it:
```js
state.route = "none";
```
and:
```js
if (routeEl) routeEl.value = "none";
```

The `const routeEl = ...` declaration in reset scope may have already been removed in step 5 — if `routeEl` was declared in an outer scope, ensure it's not left as a dangling reference.

**Step 7: Remove `renderRoutes()` and `initRouteSelector()` calls from `main()`**

In `main()`, find and remove:
```js
initRouteSelector();
```
and:
```js
renderRoutes();
```

**Step 8: Verify the site still loads**

Open the site in a browser. Open the browser console (F12). Confirm:
- No JavaScript errors in the console
- Markers render on the map
- Search, Era filter, and Timeline still work
- No Route dropdown visible in sidebar

**Step 9: Commit**

```bash
git add app.js
git commit -m "refactor: remove route dropdown system from app.js"
```

---

### Task 4: Add `state.activeJourneys` and `renderJourneys()`

**Files:**
- Modify: `app.js`

**Step 1: Add `activeJourneys` to state**

In the `state` object, add:
```js
const state = {
  query: "",
  era: "all",
  year: 999999,
  activeJourneys: new Set(),
  selectedLocationId: null
};
```

**Step 2: Add `renderJourneys()` function**

Add this function after the `renderMarkers()` function (around line 259):

```js
function renderJourneys() {
  if (!routesLayer) return;
  routesLayer.clearLayers();

  for (const journey of DATA.journeys || []) {
    if (!state.activeJourneys.has(journey.id)) continue;

    const latLngs = [];
    for (const pointId of journey.points || []) {
      const loc = (DATA.locations || []).find(l => l.id === pointId);
      if (loc) latLngs.push([loc.lat, loc.lng]);
    }

    if (latLngs.length < 2) continue;

    L.polyline(latLngs, {
      color: journey.color || "#e4572e",
      weight: 4,
      opacity: 0.85
    }).addTo(routesLayer);
  }
}
```

**Step 3: Add `renderJourneys()` call to `main()`**

In `main()`, after `renderMarkers()`, add:
```js
renderJourneys();
```

**Step 4: Verify in browser**

Open the console. `state.activeJourneys` should be an empty Set. No polylines drawn yet. No errors.

**Step 5: Commit**

```bash
git add app.js
git commit -m "feat: add state.activeJourneys and renderJourneys() to app.js"
```

---

### Task 5: Add `initJourneys()` to build sidebar checkboxes

**Files:**
- Modify: `app.js`

**Step 1: Add `initJourneys()` function**

Add this function after `initTimeline()` (around line 317):

```js
function initJourneys() {
  const container = document.getElementById("journeys-container");
  if (!container || !(DATA.journeys || []).length) return;

  const label = document.createElement("div");
  label.className = "label";
  label.textContent = "Journeys";
  container.appendChild(label);

  for (const journey of DATA.journeys) {
    const row = document.createElement("label");
    row.className = "journey-row";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "journey-checkbox";
    checkbox.dataset.journeyId = journey.id;
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        state.activeJourneys.add(journey.id);
      } else {
        state.activeJourneys.delete(journey.id);
      }
      renderJourneys();
    });

    const dot = document.createElement("span");
    dot.className = "journey-dot";
    dot.style.background = journey.color || "#888";

    const name = document.createElement("span");
    name.textContent = journey.name;

    row.appendChild(checkbox);
    row.appendChild(dot);
    row.appendChild(name);
    container.appendChild(row);
  }
}
```

**Step 2: Call `initJourneys()` from `main()`**

In `main()`, after `initTimeline()`, add:
```js
initJourneys();
```

**Step 3: Verify in browser**

The sidebar should now show a "Journeys" label followed by 5 checkbox rows: Frodo & Sam, Aragorn, Gandalf, Legolas & Gimli, Merry & Pippin. Each row should have a colored dot.

Tick "Frodo & Sam" — a blue polyline should appear tracing the rough path across the map. Tick "Aragorn" — a green polyline should also appear. Untick one — it disappears.

**Step 4: Commit**

```bash
git add app.js
git commit -m "feat: add initJourneys() to build sidebar checkboxes from data"
```

---

### Task 6: Update the reset button to clear journeys

**Files:**
- Modify: `app.js`

**Step 1: Find the reset button handler in `bindUI()`**

It looks like:
```js
const resetEl = document.getElementById("reset");
if (resetEl) {
  resetEl.addEventListener("click", () => {
    state.query = "";
    state.era = "all";
    if (searchEl) searchEl.value = "";
    if (eraEl) eraEl.value = "all";
    renderMarkers();
    renderRoutes(); // <-- this line was removed in Task 3; ensure it's gone
  });
}
```

**Step 2: Add journey reset logic**

Inside the click handler, add:
```js
state.activeJourneys.clear();
document.querySelectorAll(".journey-checkbox").forEach(cb => {
  cb.checked = false;
});
renderJourneys();
```

The full handler should now look like:
```js
const resetEl = document.getElementById("reset");
if (resetEl) {
  resetEl.addEventListener("click", () => {
    state.query = "";
    state.era = "all";
    if (searchEl) searchEl.value = "";
    if (eraEl) eraEl.value = "all";
    state.activeJourneys.clear();
    document.querySelectorAll(".journey-checkbox").forEach(cb => {
      cb.checked = false;
    });
    renderMarkers();
    renderJourneys();
  });
}
```

**Step 3: Verify in browser**

Toggle on a journey or two. Click Reset. Confirm all journey polylines disappear and all checkboxes become unchecked.

**Step 4: Commit**

```bash
git add app.js
git commit -m "feat: reset button clears active journeys and unchecks checkboxes"
```

---

### Task 7: Style the journeys section

**Files:**
- Modify: `styles.css`

**Step 1: Add journey styles**

Append to the end of `styles.css` (before the `@media` block, or at the very end):

```css
/* ===========================
   Journeys
=========================== */
#journeys-container {
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px dashed var(--border);
}

.journey-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  cursor: pointer;
  font-size: 13px;
  color: var(--text);
  user-select: none;
}

.journey-row:hover {
  color: var(--accent);
}

.journey-checkbox {
  accent-color: var(--accent);
  width: 15px;
  height: 15px;
  cursor: pointer;
  flex-shrink: 0;
}

.journey-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
```

**Step 2: Verify visuals in browser**

- Journeys section should have a dashed top border (matching the timeline section style)
- Each row is a flex row: checkbox → colored dot → character name
- Hovering a row tints the name to the accent color

**Step 3: Commit**

```bash
git add styles.css
git commit -m "feat: style journey checkboxes in sidebar"
```

---

### Task 8: Push to GitHub

**Step 1:**

```bash
git push origin main
```

**Step 2: Verify on GitHub**

Check `https://github.com/morris-trae/middle-earth-map-project` — confirm all 5+ commits from this feature appear.
