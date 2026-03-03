# Mobile Responsive Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the Middle-earth Atlas collapsible-panel responsive on phones and tablets using only CSS media queries and a small JS toggle — no new dependencies.

**Architecture:** A single `@media (max-width: 768px)` block switches `.app` from a CSS grid to a flex row. The `.panel` collapses to `width: 0` by default and expands to `300px` when `.app` has the `panel--open` class, naturally pushing the map. A hamburger `<button id="menuToggle">` in the top-left of the map toggles this class. The panel closes when a marker is selected or when the map is clicked.

**Tech Stack:** Vanilla HTML/CSS/JS + Leaflet.js. No build step. No new files.

---

### Task 1: Replace age-selector inline style with a CSS class

The existing age selector `<div>` uses an inline `style="position:absolute; top:10px; left:10px; z-index:999;"`. Inline styles block CSS override — we need to remove it so we can reposition it on mobile.

**Files:**
- Modify: `index.html`
- Modify: `styles.css`

**Step 1: Remove inline style from age selector div in `index.html`**

Find this block (lines 92–98):
```html
<div style="position:absolute; top:10px; left:10px; z-index:999;">
  <select id="ageSelector">
    <option value="third">Third Age</option>
    <option value="first">First Age (Beleriand)</option>
    <option value="second">Second Age (Númenor)</option>
  </select>
</div>
```

Replace with:
```html
<div class="age-selector-wrap">
  <select id="ageSelector">
    <option value="third">Third Age</option>
    <option value="first">First Age (Beleriand)</option>
    <option value="second">Second Age (Númenor)</option>
  </select>
</div>
```

**Step 2: Add `.age-selector-wrap` to `styles.css`**

Append after the existing `.leaflet-popup-pane` rule (around line 128):
```css
.age-selector-wrap {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 999;
}
```

**Step 3: Verify in browser**

Open `index.html`. The age selector should still appear top-left of the map. No visual change expected.

**Step 4: Commit**
```bash
git add index.html styles.css
git commit -m "refactor: move age-selector inline style to CSS class"
```

---

### Task 2: Add hamburger button to HTML

**Files:**
- Modify: `index.html`

**Step 1: Add the button inside `.mapWrap`**

In `index.html`, add the button immediately after the `age-selector-wrap` div and before `<div id="map">`:

```html
<button id="menuToggle" class="menu-toggle" aria-label="Toggle menu" aria-expanded="false">&#9776;</button>
```

The full `.mapWrap` block should now read:
```html
<main class="mapWrap">
  <div class="age-selector-wrap">
    <select id="ageSelector">
      <option value="third">Third Age</option>
      <option value="first">First Age (Beleriand)</option>
      <option value="second">Second Age (Númenor)</option>
    </select>
  </div>
  <button id="menuToggle" class="menu-toggle" aria-label="Toggle menu" aria-expanded="false">&#9776;</button>
  <div id="map"></div>
</main>
```

**Step 2: Add base style to hide button on desktop**

Append to `styles.css` (after `.age-selector-wrap`):
```css
.menu-toggle {
  display: none; /* shown only on mobile via @media */
}
```

**Step 3: Verify in browser at desktop width**

Open `index.html` at normal desktop size. The hamburger button must NOT be visible. If it is, the `display: none` rule is not being applied — check for typos.

**Step 4: Commit**
```bash
git add index.html styles.css
git commit -m "feat: add hamburger menu button (hidden on desktop)"
```

---

### Task 3: Add mobile CSS

**Files:**
- Modify: `styles.css`

**Step 1: Append the full mobile media query block to `styles.css`**

Add this entire block at the very end of `styles.css`:

```css
/* ===========================
   Mobile (max-width: 768px)
=========================== */
@media (max-width: 768px) {
  /* Switch from CSS grid to flex row so panel push works */
  .app {
    display: flex;
    flex-direction: row;
  }

  /* Panel collapses to zero width when closed */
  .panel {
    width: 0;
    min-width: 0;
    overflow: hidden;
    flex-shrink: 0;
    transition: width 0.25s ease;
    border-right: none;
  }

  /* Panel expands to 300px when open, restoring its border */
  .app.panel--open .panel {
    width: 300px;
    border-right: 1px solid var(--border);
  }

  /* Map fills remaining space */
  .mapWrap {
    flex: 1;
    min-width: 0;
  }

  /* Move age selector to top-right so hamburger can own top-left */
  .age-selector-wrap {
    left: auto;
    right: 10px;
  }

  /* Show and style hamburger button */
  .menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 1000;
    width: 40px;
    height: 40px;
    padding: 0;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: rgba(11, 15, 20, 0.85);
    color: var(--text);
    cursor: pointer;
    font-size: 18px;
    backdrop-filter: blur(4px);
  }

  .menu-toggle:hover {
    border-color: rgba(125, 211, 252, 0.45);
    box-shadow: 0 0 0 3px rgba(125, 211, 252, 0.12);
  }

  /* Larger touch targets for interactive controls */
  .btn,
  .select,
  .input {
    min-height: 44px;
  }

  input[type="range"] {
    height: 32px;
    cursor: pointer;
  }
}
```

**Step 2: Verify panel collapse at mobile width**

Open `index.html`. In browser devtools, set viewport to **375px wide** (iPhone SE).

Expected:
- Panel is NOT visible (collapsed to zero width)
- Map fills the full screen
- Hamburger `≡` button appears top-left
- Age selector appears top-right

If the panel is still visible, check that `.app { display: flex }` inside the media query is overriding the top-level `display: grid`.

**Step 3: Verify desktop is unchanged**

Switch devtools to **1440px wide**.

Expected:
- Panel is visible on the left (360px wide)
- Map fills the right
- Hamburger button is NOT visible
- Age selector is top-left of map (as before)

**Step 4: Commit**
```bash
git add styles.css
git commit -m "feat: add mobile responsive layout with collapsible panel"
```

---

### Task 4: Add JS toggle logic

**Files:**
- Modify: `app.js`

**Step 1: Add `closePanelOnMobile` helper**

In `app.js`, find the Utilities section (after `slugifyId`, around line 44). Add this function:

```javascript
function closePanelOnMobile() {
  if (window.innerWidth > 768) return;
  const appEl = document.querySelector(".app");
  const toggle = document.getElementById("menuToggle");
  if (appEl) appEl.classList.remove("panel--open");
  if (toggle) {
    toggle.innerHTML = "&#9776;";
    toggle.setAttribute("aria-expanded", "false");
  }
}
```

**Step 2: Wire hamburger button in `bindUI()`**

In `app.js`, find `bindUI()`. Add this block at the top of the function (before the `searchEl` wiring):

```javascript
const menuToggle = document.getElementById("menuToggle");
if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    const appEl = document.querySelector(".app");
    if (!appEl) return;
    const isOpen = appEl.classList.toggle("panel--open");
    menuToggle.innerHTML = isOpen ? "&#10005;" : "&#9776;";
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}
```

**Step 3: Close panel on map click**

In `app.js`, find `initMap()`. Locate the existing normal-click debug handler (around line 176):

```javascript
map.on("click", (e) => {
  if (e.originalEvent.shiftKey) return;
  console.log("lat:", Math.round(e.latlng.lat), "lng:", Math.round(e.latlng.lng));
});
```

Add `closePanelOnMobile()` to this handler:

```javascript
map.on("click", (e) => {
  if (e.originalEvent.shiftKey) return;
  console.log("lat:", Math.round(e.latlng.lat), "lng:", Math.round(e.latlng.lng));
  closePanelOnMobile();
});
```

**Step 4: Auto-close panel when a location is selected**

In `app.js`, find `renderDetails()` (around line 324). Add `closePanelOnMobile()` as the very first line of the function body:

```javascript
function renderDetails(loc) {
  closePanelOnMobile(); // ← add this line
  const detailsEl = getDetailsEl();
  // ... rest of function unchanged
```

**Step 5: Verify toggle works at mobile width**

Open `index.html` in devtools at **375px wide**.

1. Click `≡` → panel slides in, map shrinks, button shows `✕`
2. Click `✕` → panel collapses, map expands, button shows `≡`
3. Click a map marker → lore appears in panel, panel auto-closes, map expands
4. Re-open panel with `≡` → lore is still shown from last selected location
5. Click directly on the map (not a marker) → panel closes

**Step 6: Verify desktop is unaffected**

Switch devtools to **1440px wide**. Click markers, use search, change era — everything should work exactly as before. The hamburger button must not appear.

**Step 7: Commit**
```bash
git add app.js
git commit -m "feat: wire hamburger toggle and auto-close panel on mobile"
```

---

### Task 5: Final cross-device verification

**Step 1: Test at key breakpoints in devtools**

| Width | Expected |
|---|---|
| 320px (iPhone SE old) | Panel collapsed, hamburger visible, age selector top-right |
| 375px (iPhone SE) | Same |
| 390px (iPhone 14) | Same |
| 768px (iPad portrait) | Mobile layout active — panel collapsed |
| 769px | Desktop layout — panel always visible, hamburger hidden |
| 1440px | Desktop layout unchanged |

**Step 2: Test on real phone (if available)**

Open the file via a local server (e.g. `python3 -m http.server 8080`) and visit on phone.

Verify:
- Pinch-to-zoom works on map
- Panel open/close feels snappy
- Tapping markers selects them and closes panel
- All buttons are comfortably tappable

**Step 3: Commit if any fixes were needed**
```bash
git add -p
git commit -m "fix: mobile cross-device polish"
```
