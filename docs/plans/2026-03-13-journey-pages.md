# Journey Pages Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `/journeys/` section to the site with a Frodo & Sam interactive reference page — full Middle-earth map on the left, book-accurate narrative on the right, with bidirectional map/text linking.

**Architecture:** Three new files under `journeys/` (index page, Frodo & Sam page, shared CSS). The journey page fetches `../data.json` to draw the route and place markers, then uses `IntersectionObserver` for scroll→map sync and click handlers for map→text sync. No build step — vanilla HTML/CSS/JS + Leaflet same as the main app.

**Tech Stack:** Leaflet 1.9.4 (CDN), vanilla JS, CSS custom properties matching the main app's design tokens.

---

## Task 1: Create `journeys/journeys.css`

**Files:**
- Create: `journeys/journeys.css`

**Step 1: Create the file with layout and component styles**

```css
/* journeys/journeys.css */

:root {
  --bg: #0b0f14;
  --panel: #111823;
  --panel2: #0f1620;
  --text: #e8eef6;
  --muted: #93a4b8;
  --accent: #7dd3fc;
  --border: rgba(255,255,255,0.08);
  --shadow: rgba(0,0,0,0.35);
  --radius: 18px;
}

* { box-sizing: border-box; }
html, body {
  height: 100%;
  margin: 0;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto;
  background: var(--bg);
  color: var(--text);
}

/* ---- Index page ---- */

.journeys-index {
  max-width: 720px;
  margin: 0 auto;
  padding: 48px 24px;
}

.journeys-index__back {
  display: inline-block;
  color: var(--accent);
  text-decoration: none;
  font-size: 14px;
  margin-bottom: 32px;
}
.journeys-index__back:hover { text-decoration: underline; }

.journeys-index__title {
  font-size: 28px;
  font-weight: 750;
  margin: 0 0 8px;
}

.journeys-index__subtitle {
  color: var(--muted);
  font-size: 15px;
  margin: 0 0 40px;
}

.journey-card {
  display: block;
  padding: 20px 24px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--panel);
  text-decoration: none;
  color: var(--text);
  margin-bottom: 16px;
  transition: border-color 0.15s, background 0.15s;
}
.journey-card:hover {
  border-color: var(--accent);
  background: var(--panel2);
}
.journey-card__name {
  font-size: 17px;
  font-weight: 650;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}
.journey-card__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.journey-card__teaser {
  font-size: 14px;
  color: var(--muted);
  margin: 0;
}
.journey-card--soon {
  opacity: 0.45;
  pointer-events: none;
}

/* ---- Journey detail page ---- */

.journey-page {
  display: grid;
  grid-template-columns: 40% 1fr;
  height: 100vh;
  overflow: hidden;
}

/* Left column: map */
.journey-map-col {
  position: relative;
  border-right: 1px solid var(--border);
}

.journey-map-col__back {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 1000;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 6px 14px;
  color: var(--accent);
  text-decoration: none;
  font-size: 13px;
}
.journey-map-col__back:hover { background: var(--panel2); }

#journey-map {
  width: 100%;
  height: 100%;
}

/* Shire duplicate tooltip */
.shire-tooltip {
  position: absolute;
  z-index: 2000;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 14px;
  box-shadow: 0 4px 20px var(--shadow);
  display: none;
  min-width: 200px;
}
.shire-tooltip.visible { display: block; }
.shire-tooltip__title {
  font-size: 11px;
  color: var(--muted);
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.shire-tooltip__btn {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  color: var(--text);
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}
.shire-tooltip__btn:hover { background: rgba(255,255,255,0.06); color: var(--accent); }

/* Right column: narrative text */
.journey-text-col {
  overflow-y: auto;
  padding: 48px 52px 80px;
}

.journey-text-col__title {
  font-size: 26px;
  font-weight: 750;
  margin: 0 0 4px;
}
.journey-text-col__subtitle {
  font-size: 13px;
  color: var(--muted);
  margin: 0 0 48px;
}

.journey-section {
  margin-bottom: 48px;
  scroll-margin-top: 24px;
}

.journey-section__heading {
  font-size: 18px;
  font-weight: 650;
  margin: 0 0 14px;
  color: var(--text);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
  transition: color 0.3s;
}
.journey-section__heading.highlight {
  color: var(--accent);
}

.journey-section p {
  font-size: 15px;
  line-height: 1.75;
  color: #c8d4e2;
  margin: 0 0 16px;
}
.journey-section p:last-child { margin-bottom: 0; }

/* Mobile: stack vertically */
@media (max-width: 768px) {
  .journey-page {
    grid-template-columns: 1fr;
    grid-template-rows: 40vh 1fr;
    height: auto;
    overflow: visible;
  }
  .journey-text-col {
    padding: 28px 20px 60px;
    overflow-y: visible;
    height: auto;
  }
  .journey-map-col {
    height: 40vh;
  }
}
```

**Step 2: Verify the file exists**

Open the file and confirm it saved correctly. No browser test needed yet.

**Step 3: Commit**

```bash
git add journeys/journeys.css
git commit -m "feat: add journey pages CSS"
```

---

## Task 2: Create `journeys/index.html`

**Files:**
- Create: `journeys/index.html`

**Step 1: Create the index page**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Journeys — Middle-earth Atlas</title>
  <link rel="stylesheet" href="./journeys.css" />
</head>
<body>
  <div class="journeys-index">
    <a href="../index.html" class="journeys-index__back">← Back to map</a>
    <h1 class="journeys-index__title">Journeys</h1>
    <p class="journeys-index__subtitle">
      Book-accurate interactive references for the great journeys of Middle-earth.
    </p>

    <a href="./frodo-sam.html" class="journey-card">
      <div class="journey-card__name">
        <span class="journey-card__dot" style="background: #5b8dd9;"></span>
        Frodo &amp; Sam
      </div>
      <p class="journey-card__teaser">From the Shire to Mount Doom and back again.</p>
    </a>

    <div class="journey-card journey-card--soon">
      <div class="journey-card__name">
        <span class="journey-card__dot" style="background: #3cb371;"></span>
        Aragorn
      </div>
      <p class="journey-card__teaser">Coming soon.</p>
    </div>

    <div class="journey-card journey-card--soon">
      <div class="journey-card__name">
        <span class="journey-card__dot" style="background: #f0c040;"></span>
        Gandalf
      </div>
      <p class="journey-card__teaser">Coming soon.</p>
    </div>

    <div class="journey-card journey-card--soon">
      <div class="journey-card__name">
        <span class="journey-card__dot" style="background: #c084fc;"></span>
        Legolas &amp; Gimli
      </div>
      <p class="journey-card__teaser">Coming soon.</p>
    </div>
  </div>
</body>
</html>
```

**Step 2: Open `journeys/index.html` in a browser**

Expected: Dark background, title "Journeys", Frodo & Sam card is clickable (blue), the others are dimmed/disabled.

**Step 3: Commit**

```bash
git add journeys/index.html
git commit -m "feat: add journeys index page"
```

---

## Task 3: Add "Journeys" link to the main map

**Files:**
- Modify: `index.html`

**Step 1: Read `index.html` to find the panel footer**

The panel footer is at line ~61:
```html
<footer class="panel__footer muted">
  Local-only nerd project • Leaflet image overlay
</footer>
```

**Step 2: Replace the panel footer with a version that includes the Journeys link**

Replace:
```html
      <footer class="panel__footer muted">
        Local-only nerd project • Leaflet image overlay
      </footer>
```

With:
```html
      <footer class="panel__footer muted">
        <a href="./journeys/index.html" style="color: var(--accent); text-decoration: none; font-size: 13px;">Journeys</a>
        <span style="margin: 0 8px; opacity: 0.4;">•</span>
        Local-only nerd project • Leaflet image overlay
      </footer>
```

**Step 3: Open `index.html` in a browser**

Expected: "Journeys" link appears in the panel footer in accent blue. Clicking it navigates to `journeys/index.html`.

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add Journeys nav link to main panel footer"
```

---

## Task 4: Create `journeys/frodo-sam.html` — page skeleton + map init

**Files:**
- Create: `journeys/frodo-sam.html`

**Step 1: Create the file with the HTML skeleton and Leaflet map setup**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Frodo &amp; Sam — Middle-earth Atlas</title>

  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    crossorigin=""
  />
  <script
    src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    crossorigin=""
    defer
  ></script>

  <link rel="stylesheet" href="./journeys.css" />
  <script src="./frodo-sam.js" defer></script>
</head>
<body>
  <div class="journey-page">

    <!-- Left: map -->
    <div class="journey-map-col">
      <a href="./index.html" class="journey-map-col__back">← Journeys</a>
      <div id="journey-map"></div>
      <!-- Shire duplicate tooltip (hidden by default) -->
      <div class="shire-tooltip" id="shire-tooltip">
        <div class="shire-tooltip__title">Jump to…</div>
        <button class="shire-tooltip__btn" data-section="shire-start">The Long Shadow Over the Shire</button>
        <button class="shire-tooltip__btn" data-section="shire-scouring">The Return to the Shire — and the Scouring</button>
      </div>
    </div>

    <!-- Right: narrative -->
    <div class="journey-text-col" id="journey-text">

      <h1 class="journey-text-col__title">Frodo &amp; Sam</h1>
      <p class="journey-text-col__subtitle">The Fellowship of the Ring · The Two Towers · The Return of the King</p>

      <section class="journey-section" id="shire-start">
        <h2 class="journey-section__heading">The Long Shadow Over the Shire</h2>
        <p>At Bilbo's 111th birthday party in the Shire, Bilbo departs unexpectedly, leaving the Ring to Frodo. Gandalf, suspicious of the Ring, urges Frodo to keep it secret and safe, then disappears for seventeen years to research its origins. During this time Frodo lives quietly at Bag End, growing no older, the Ring sitting in his pocket largely forgotten.</p>
        <p>When Gandalf finally returns, he confirms the worst: the Ring is the One Ring of Sauron, and the Dark Lord's servants — the Nazgûl — are already abroad searching for it. Frodo must leave the Shire, and soon. He sells Bag End, and under the pretense of retiring to a house in Buckland, he and Sam (along with Pippin) set off on foot, taking a slow and meandering route to avoid the roads. Merry goes ahead to prepare the house at Crickhollow.</p>
      </section>

      <section class="journey-section" id="old-forest">
        <h2 class="journey-section__heading">The Old Forest and the Barrow-downs</h2>
        <p>Rather than taking the main road, the hobbits cut through the Old Forest, an ancient and unsettling wood at the edge of Buckland. There the malevolent tree-spirit Old Man Willow nearly kills Frodo and Pippin by drawing them into his roots, and only the timely arrival of the strange and joyful Tom Bombadil saves them. They stay with Tom and his wife Goldberry for several days — a warmly detailed interlude the films omit entirely.</p>
        <p>Departing Tom's house, the hobbits are caught on the Barrow-downs in a fog and captured by a Barrow-wight, an evil spirit haunting the ancient burial mounds. Frodo alone keeps his wits, cuts his friends free, and calls for Tom Bombadil, who banishes the wight. From the barrow's treasure, the hobbits each take a short Númenórean blade — a detail that pays off later when Merry uses his to wound the Witch-king.</p>
      </section>

      <section class="journey-section" id="bree">
        <h2 class="journey-section__heading">Bree and the Arrival of Strider</h2>
        <p>At the village of Bree the hobbits take shelter at the inn of the Prancing Pony, where Frodo foolishly slips on the Ring in front of a crowd and vanishes, drawing dangerous attention. They are approached by a weathered Ranger called Strider, who reveals he has been watching over them and offers to guide them safely. A letter from Gandalf — left years earlier with the innkeeper Butterbur, who forgot to send it — confirms Strider is trustworthy. His true name is Aragorn, son of Arathorn.</p>
        <p>That night the Nazgûl ransack the hobbits' rooms, but find them empty — Strider had wisely moved the party elsewhere.</p>
      </section>

      <section class="journey-section" id="weathertop">
        <h2 class="journey-section__heading">Weathertop and the Wound That Would Not Heal</h2>
        <p>Strider leads the hobbits cross-country toward Rivendell. On the ancient watchtower of Weathertop, the group is attacked at night by five Nazgûl. Frodo, overcome by the Ring's pull, puts it on — and in that half-world of the wraiths, the Witch-king stabs him in the shoulder with a Morgul-blade. The shard of the blade begins working its way toward his heart, slowly turning him into a wraith himself.</p>
        <p>The desperate journey to Rivendell follows, with Frodo growing weaker by the hour. At the Ford of Bruinen, pursued by all nine Nazgûl, the Elf-lord Glorfindel (not Arwen, as in the films) puts Frodo on his horse and sends him ahead. The Nazgûl are swept away by a flood conjured by Elrond and Gandalf.</p>
      </section>

      <section class="journey-section" id="rivendell">
        <h2 class="journey-section__heading">Rivendell and the Fellowship</h2>
        <p>Healed by Elrond in Rivendell, Frodo is reunited with Bilbo, now very old and frail, who gives him the coat of mithril mail and the short Elvish blade Sting. The Council of Elrond assembles representatives of all free peoples, and the full history of the Ring is laid out. Frodo, feeling the weight of necessity, volunteers to carry the Ring to Mordor. The Fellowship of nine is formed.</p>
      </section>

      <section class="journey-section" id="moria-lorien">
        <h2 class="journey-section__heading">Moria, Lothlórien, and the Breaking of the Fellowship</h2>
        <p>After the failed attempt to cross the Misty Mountains via Caradhras, the Fellowship descends into Moria. Deep within they find the tomb of Balin and evidence of the dwarves' fate. They are attacked by orcs and a cave-troll, and at the Bridge of Khazad-dûm, Gandalf confronts the Balrog, falling into the abyss with it.</p>
        <p>The grieving Fellowship is sheltered in Lothlórien by Galadriel and Celeborn. Frodo offers the Ring to Galadriel, who refuses it with one of the most powerful moments in the book — acknowledging what she would become if she accepted it. The Fellowship departs by boat down the Anduin.</p>
        <p>At Amon Hen, Boromir — long pressured by the Ring — attempts to take it from Frodo. Frodo puts on the Ring and flees to the Seat of Seeing atop the hill, where he feels Sauron's eye nearly find him. He makes his choice: he must go to Mordor alone. Sam, who has known Frodo's heart all along, runs to the riverbank and refuses to be left behind, nearly drowning until Frodo hauls him into the boat. The two set off for the eastern shore. The Fellowship is broken.</p>
      </section>

      <section class="journey-section" id="emyn-muil">
        <h2 class="journey-section__heading">The Emyn Muil, the Dead Marshes, and Gollum</h2>
        <p>Lost in the Emyn Muil, Frodo and Sam are found — or rather, they catch — Gollum, who has been following them since Moria. Frodo, moved by pity and by Gandalf's earlier words that Gollum still had a part to play, spares him and makes him swear by the Ring to serve as guide. Sam is deeply wary throughout.</p>
        <p>Gollum leads them through the haunted Dead Marshes, where the lights of corpse-candles flicker over the faces of warriors from a battle of the Second Age, preserved in the murk. Frodo is transfixed and nearly drowned when he follows a light, only Sam pulling him back.</p>
        <p>At the Black Gate of Mordor, the direct way proves impassable — armies are marching through. Gollum, wheedling and desperate to keep them from entering that way, reveals a secret path: Cirith Ungol, a pass in the mountains above Minas Morgul. Frodo decides to trust him.</p>
      </section>

      <section class="journey-section" id="ithilien">
        <h2 class="journey-section__heading">Ithilien, Faramir, and the Road to Cirith Ungol</h2>
        <p>In the fair land of Ithilien, Frodo and Sam are captured by Faramir, younger son of the Steward of Gondor. Here the books diverge sharply from the films: book-Faramir is a man of genuine wisdom and restraint. When he learns what Frodo carries, he states plainly that he would not pick up the Ring if he found it lying in the road. He lets them go freely, with provisions and good counsel — warning Frodo gravely about Gollum's treachery.</p>
        <p>Gollum, meanwhile, is caught by Faramir's rangers while fishing in the forbidden Pool of Henneth Annûn. Frodo, to save Gollum's life, is forced to call him forward and essentially hand him over — an act Gollum experiences as a betrayal, the moment that finally extinguishes whatever loyalty he felt toward Frodo.</p>
      </section>

      <section class="journey-section" id="cirith-ungol">
        <h2 class="journey-section__heading">Shelob's Lair and the Pass of Cirith Ungol</h2>
        <p>Gollum leads them up through the winding passages of Cirith Ungol, past the abandoned outpost of Minas Morgul, and into the tunnels of Shelob — an ancient, monstrous spider, last child of Ungoliant, who has lurked in those passes since before Sauron came to Mordor. Gollum has deliberately led them to her, hoping she will devour them and he can take the Ring from her leavings.</p>
        <p>Frodo uses the Phial of Galadriel and Sting to drive Shelob back, but emerging from the tunnel he is stung and paralyzed. Sam, believing Frodo dead, takes the Ring. When orcs arrive and carry Frodo into the tower of Cirith Ungol, Sam overhears them and realizes Frodo is alive — only stunned — and follows.</p>
      </section>

      <section class="journey-section" id="gorgoroth">
        <h2 class="journey-section__heading">The Tower of Cirith Ungol and the Plains of Gorgoroth</h2>
        <p>Sam, bearing the Ring, infiltrates the tower and finds Frodo stripped and imprisoned. He gives the Ring back to Frodo, and together they escape in stolen orc-gear, disguised in cloaks and helmets. They cross the terrible plain of Gorgoroth under the shadow of Mount Doom, which looms ever closer. Their food and water are nearly gone. Frodo grows increasingly unable to speak of anything but the weight of the Ring. Sam, with quiet and unshakeable love, offers to carry it — an offer Frodo refuses, not from selfishness but because he knows the Ring would corrupt even Sam.</p>
        <p>Near the end, Frodo can barely walk. Sam carries him on his back up the slopes of Orodruin.</p>
      </section>

      <section class="journey-section" id="crack-of-doom">
        <h2 class="journey-section__heading">The Crack of Doom</h2>
        <p>At the Sammath Naur — the Crack of Doom — Frodo stands at the edge of the fire. And then, after everything, he refuses to destroy the Ring. He claims it for himself, puts it on, and vanishes.</p>
        <p>Gollum, who has tracked them across Mordor, attacks the invisible Frodo, bites off his finger, and in his mad dance of triumph topples into the fire with the Ring. It is destroyed. Sauron is unmade. The mountain erupts.</p>
        <p>Frodo and Sam are rescued from the slopes of Mount Doom by Gandalf — returned as Gandalf the White — and the great Eagles. They are brought to Ithilien and reunited with Aragorn, Merry, Pippin, and the assembled armies of the West.</p>
      </section>

      <section class="journey-section" id="shire-scouring">
        <h2 class="journey-section__heading">The Return to the Shire — and the Scouring</h2>
        <p>The long journey home is warm and bittersweet — through Rohan, through Rivendell, where Frodo and Bilbo say a quiet farewell, and at last back to the borders of the Shire. But in one of the most important chapters the films cut entirely — The Scouring of the Shire — they find their home occupied and ruined. The wizard Saruman, degraded and vengeful, has taken over the Shire with his ruffians, cutting trees, building ugly factories, and grinding the hobbits under petty tyranny.</p>
        <p>Merry and Pippin, hardened by war, organize a hobbit uprising. Saruman is driven out and killed by his own servant Gríma Wormtongue, who is then shot by hobbit archers. The Shire is freed, and the four companions set about its restoration.</p>
        <p>This chapter matters enormously in the books. It is the proof that the hobbits grew into genuine heroes — that their journey changed them — and it gives the return home a moral weight that is absent from the films.</p>
      </section>

      <section class="journey-section" id="grey-havens">
        <h2 class="journey-section__heading">The Grey Havens</h2>
        <p>But Frodo cannot heal. The wound from the Morgul-blade, the burden of the Ring, the spiritual damage of carrying it so far — these do not leave him. He is fading in a world that has moved on.</p>
        <p>On September 22nd — his and Bilbo's shared birthday — Frodo departs with Gandalf, Bilbo, Galadriel, Elrond, and other Ring-bearers for the Grey Havens, where a ship waits to carry them to the Undying Lands in the West. Sam, Merry, and Pippin ride with him to the shore and say farewell. Sam watches the ship disappear and rides home to his wife Rosie and his daughter Elanor, and the final line of the book belongs to him:</p>
        <p><em>"Well, I'm back."</em></p>
      </section>

    </div><!-- .journey-text-col -->
  </div><!-- .journey-page -->
</body>
</html>
```

**Step 2: Open `journeys/frodo-sam.html` in a browser**

Expected: Two-column layout. Left column is empty (map not wired yet). Right column shows all 13 narrative sections, scrollable. "← Journeys" back link visible top-left of the map column.

**Step 3: Commit**

```bash
git add journeys/frodo-sam.html
git commit -m "feat: add Frodo & Sam journey page HTML skeleton"
```

---

## Task 5: Create `journeys/frodo-sam.js` — map init and route drawing

**Files:**
- Create: `journeys/frodo-sam.js`

This script:
1. Fetches `../data.json`
2. Inits a Leaflet map with the Third Age image overlay
3. Draws the full Frodo & Sam route as a polyline
4. Places named story-location markers (not internal waypoints)

**Step 1: Create the file**

```js
"use strict";

/* ---- Story marker config ----
   Maps data.json location IDs → narrative section IDs.
   sectionId is an array for locations that appear more than once. */
const STORY_MARKERS = [
  { locationId: "shire",                   sectionId: ["shire-start", "shire-scouring"], label: "The Shire" },
  { locationId: "bree",                    sectionId: ["bree"],                           label: "Bree" },
  { locationId: "amon_sul_weathertop",     sectionId: ["weathertop"],                    label: "Weathertop" },
  { locationId: "rivendell",               sectionId: ["rivendell"],                      label: "Rivendell" },
  { locationId: "khazad_dum",              sectionId: ["moria-lorien"],                   label: "Moria" },
  { locationId: "lothlorien",              sectionId: ["moria-lorien"],                   label: "Lothlórien" },
  { locationId: "emyn_muil",               sectionId: ["emyn-muil"],                      label: "Emyn Muil" },
  { locationId: "morannon_the_black_gate", sectionId: ["emyn-muil"],                      label: "Black Gate" },
  { locationId: "mt_doom_orodruin",        sectionId: ["crack-of-doom"],                  label: "Mount Doom" },
];

const JOURNEY_COLOR = "#5b8dd9";
const MAP_WIDTH  = 7348;
const MAP_HEIGHT = 4320;
const MAP_BOUNDS = [[0, 0], [MAP_HEIGHT, MAP_WIDTH]];

let map = null;

// marker element → { config, circleMarker } for use by IntersectionObserver
const sectionToMarkers = new Map(); // sectionId → CircleMarker[]

async function init() {
  const res = await fetch("../data.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load data.json");
  const data = await res.json();

  initMap();
  drawRoute(data);
  placeMarkers(data);
  bindScrollObserver();
}

function initMap() {
  map = L.map("journey-map", {
    crs: L.CRS.Simple,
    zoomControl: true,
    minZoom: -2,
    maxZoom: 5,
    zoomSnap: 0.25,
    zoomDelta: 0.5,
    wheelPxPerZoomLevel: 120,
    bounceAtZoomLimits: false
  });

  L.imageOverlay("../map.jpg", MAP_BOUNDS).addTo(map);
  map.fitBounds(MAP_BOUNDS, { animate: false });
  map.setMaxBounds(MAP_BOUNDS);
  map.setMinZoom(map.getZoom());
}

function drawRoute(data) {
  const journey = (data.journeys || []).find(j => j.id === "frodo_sam");
  if (!journey) return;

  const latLngs = (journey.points || [])
    .map(id => (data.locations || []).find(l => l.id === id))
    .filter(Boolean)
    .map(loc => [loc.lat, loc.lng]);

  L.polyline(latLngs, {
    color: JOURNEY_COLOR,
    weight: 2.5,
    opacity: 0.85
  }).addTo(map);
}

function placeMarkers(data) {
  const locations = data.locations || [];

  for (const config of STORY_MARKERS) {
    const loc = locations.find(l => l.id === config.locationId);
    if (!loc) continue;

    const marker = L.circleMarker([loc.lat, loc.lng], {
      radius: 6,
      color: "#fff",
      weight: 2,
      fillColor: JOURNEY_COLOR,
      fillOpacity: 1
    }).addTo(map);

    marker.bindTooltip(config.label, { permanent: false, direction: "top" });

    // Store reverse lookup: sectionId → markers[]
    for (const sid of config.sectionId) {
      if (!sectionToMarkers.has(sid)) sectionToMarkers.set(sid, []);
      sectionToMarkers.get(sid).push({ marker, config });
    }

    marker.on("click", () => handleMarkerClick(config));
  }
}

function handleMarkerClick(config) {
  if (config.sectionId.length > 1) {
    // Shire: show the duplicate tooltip
    showShireTooltip(config);
  } else {
    scrollToSection(config.sectionId[0]);
  }
}

function showShireTooltip(config) {
  const tooltip = document.getElementById("shire-tooltip");
  if (!tooltip) return;
  tooltip.classList.add("visible");

  // Position near the top-left of the map col
  tooltip.style.top = "56px";
  tooltip.style.left = "14px";

  // Wire buttons
  tooltip.querySelectorAll(".shire-tooltip__btn").forEach(btn => {
    btn.onclick = () => {
      scrollToSection(btn.dataset.section);
      tooltip.classList.remove("visible");
    };
  });

  // Close on outside click
  const close = (e) => {
    if (!tooltip.contains(e.target)) {
      tooltip.classList.remove("visible");
      document.removeEventListener("click", close);
    }
  };
  setTimeout(() => document.addEventListener("click", close), 0);
}

function scrollToSection(sectionId) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  highlightHeading(el);
}

function highlightHeading(sectionEl) {
  const heading = sectionEl.querySelector(".journey-section__heading");
  if (!heading) return;
  heading.classList.add("highlight");
  setTimeout(() => heading.classList.remove("highlight"), 1800);
}

/* ---- Scroll → map sync ----
   IntersectionObserver watches each .journey-section.
   When a section is ≥30% visible, pulse its marker(s). */
function bindScrollObserver() {
  let activeSectionId = null;

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const sectionId = entry.target.id;
      if (sectionId === activeSectionId) continue;
      activeSectionId = sectionId;
      pulseMarkers(sectionId);
    }
  }, { threshold: 0.3 });

  document.querySelectorAll(".journey-section").forEach(el => observer.observe(el));
}

function pulseMarkers(sectionId) {
  // Reset all markers to default style
  for (const entries of sectionToMarkers.values()) {
    for (const { marker } of entries) {
      marker.setStyle({ radius: 6, weight: 2, fillOpacity: 1 });
    }
  }

  // Enlarge active markers
  const active = sectionToMarkers.get(sectionId) || [];
  for (const { marker } of active) {
    marker.setStyle({ radius: 9, weight: 3, fillOpacity: 1 });
  }
}

document.addEventListener("DOMContentLoaded", init);
```

**Step 2: Open `journeys/frodo-sam.html` in a browser**

Expected:
- Left column shows the full Middle-earth map
- Blue route line traces Frodo & Sam's path across the map
- Named location markers (small blue dots with white border) appear along the route
- Hovering a marker shows a tooltip with the location name
- Scrolling the right column causes the corresponding map marker to enlarge

**Step 3: Commit**

```bash
git add journeys/frodo-sam.js
git commit -m "feat: add Frodo & Sam journey page map and interactivity"
```

---

## Task 6: Verify map→text and Shire tooltip

**Step 1: Test marker clicks in the browser**

- Click **Bree** marker → text column scrolls to "Bree and the Arrival of Strider", heading flashes blue
- Click **Moria** marker → scrolls to "Moria, Lothlórien…"
- Click **Lothlórien** marker → scrolls to same "Moria, Lothlórien…" section
- Click **The Shire** marker → tooltip appears with two options
  - Click "The Long Shadow Over the Shire" → scrolls to first Shire section
  - Click "The Return to the Shire — and the Scouring" → scrolls to scouring section

**Step 2: Test text→map sync**

Scroll slowly through the narrative. When each section becomes dominant in the viewport, the corresponding map marker(s) should enlarge. Scrolling to "Bree" → Bree marker enlarges. Scrolling to "Moria…" → both Moria and Lothlórien markers enlarge.

**Step 3: Fix any issues found, then commit**

```bash
git add journeys/frodo-sam.js journeys/journeys.css
git commit -m "fix: correct any marker click or scroll sync issues"
```

---

## Task 7: Verify mobile layout

**Step 1: Open browser DevTools → toggle device toolbar → select a mobile size (e.g. 375px wide)**

Expected:
- Map stacks above text (40vh height)
- Text column scrolls normally below
- "← Journeys" back link still visible on map

**Step 2: Fix any layout issues in `journeys/journeys.css`, then commit**

```bash
git add journeys/journeys.css
git commit -m "fix: mobile layout for journey page"
```

---

## Task 8: End-to-end navigation check + push

**Step 1: Full navigation flow**

1. Open `index.html` (main map) → click "Journeys" in footer → lands on `journeys/index.html`
2. Click "Frodo & Sam" card → lands on `journeys/frodo-sam.html`
3. Click "← Journeys" back link → returns to index
4. Verify "← Back to map" on index returns to `index.html`

**Step 2: Push to GitHub**

```bash
git push origin main
```
