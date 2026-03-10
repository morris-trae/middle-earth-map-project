/* app.js - Middle-earth Atlas (Leaflet Image Map) */

"use strict";

/* ----------------------------
   Globals
----------------------------- */
let DATA = null;

let map = null;
let imageOverlay = null;
let markersLayer = null;
let routesLayer = null;
const journeyPolylines = new Map(); // journey.id → L.polyline

let currentAge = "third"; // "third" | "first"

const state = {
  query: "",
  era: "all",     // "all" | "first" | "second" | "third" (you can extend)
  activeJourneys: new Set(),
  selectedLocationId: null
};

let panelWidth = 300; // last-used panel width; persists within session

/* ----------------------------
   Utilities
----------------------------- */
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugifyId(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function closePanelOnMobile() {
  if (window.innerWidth > 768) return;
  const appEl = document.querySelector(".app");
  const toggle = document.getElementById("menuToggle");
  const panel = document.querySelector(".panel");
  if (appEl) appEl.classList.remove("panel--open");
  if (toggle) {
    toggle.innerHTML = "&#9776;";
    toggle.setAttribute("aria-expanded", "false");
  }
  if (panel) panel.style.width = "";
}

function initPanelResizer() {
  const resizer = document.getElementById("panelResizer");
  const panel = document.querySelector(".panel");
  if (!resizer || !panel) return;

  let dragging = false;

  function startDrag() {
    dragging = true;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  }

  function onDrag(clientX) {
    if (!dragging) return;
    // clientX equals new panel width because panel is flush with left viewport edge (x=0)
    const min = 160;
    const max = window.innerWidth - 80;
    const newWidth = Math.min(Math.max(clientX, min), max);
    panel.style.width = newWidth + "px";
    if (map) map.invalidateSize();
  }

  function stopDrag() {
    if (!dragging) return;
    dragging = false;
    panelWidth = parseInt(panel.style.width, 10) || 300;
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  }

  // Touch: attach move/end to window only during an active drag so passive:false
  // doesn't penalise all touch scrolling globally.
  function onTouchMove(e) {
    onDrag(e.touches[0].clientX);
    e.preventDefault();
  }

  function onTouchEnd() {
    stopDrag();
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", onTouchEnd);
  }

  resizer.addEventListener("touchstart", (e) => {
    startDrag();
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    e.preventDefault();
  }, { passive: false });

  // Mouse events (desktop testing)
  resizer.addEventListener("mousedown", (e) => {
    startDrag();
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    onDrag(e.clientX);
  });

  window.addEventListener("mouseup", () => stopDrag());
}

function getActiveMapMeta() {
  const defaultsByAge = {
    third: { image: "map.jpg", width: 7348, height: 4320 },
    first: { image: "beleriand.jpg", width: 7348, height: 4320 },
    second: { image: "numenor.jpg", width: 7348, height: 4320 }
  };
  const fallback = defaultsByAge[currentAge] || defaultsByAge.third;
  const fromData = (DATA && DATA.maps && DATA.maps[currentAge]) || null;

  if (!fromData) return fallback;

  return {
    image: fromData.image || fallback.image,
    width: Number(fromData.width) || fallback.width,
    height: Number(fromData.height) || fallback.height
  };
}

function getDetailsEl() {
  return document.getElementById("details");
}

/* ----------------------------
   Data loading
----------------------------- */
async function loadData() {
  const res = await fetch("data.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load data.json: ${res.status}`);
  const json = await res.json();
  return json;
}

/* ----------------------------
   Map overlay switching
----------------------------- */
function loadMapOverlay() {
  if (!map) return;
  const meta = getActiveMapMeta();
  const img = meta.image;

  const w = meta.width;
  const h = meta.height;
  const bounds = [[0, 0], [h, w]];

  if (imageOverlay) {
    map.removeLayer(imageOverlay);
    imageOverlay = null;
  }

  imageOverlay = L.imageOverlay(img, bounds).addTo(map);

  // Fit and constrain map
  map.fitBounds(bounds);
  map.setMaxBounds(bounds);
}

/* ----------------------------
   Map init
----------------------------- */
function initMap() {
  if (map) return;

  map = L.map("map", {
    crs: L.CRS.Simple,
    zoomControl: false,
    minZoom: -2,
    maxZoom: 5,
    zoomSnap: 0.25,
    zoomDelta: 0.5,
    wheelPxPerZoomLevel: 120
  });

  loadMapOverlay();

  markersLayer = L.layerGroup().addTo(map);
  routesLayer = L.layerGroup().addTo(map);

  // SHIFT+CLICK generator (location builder)
  map.on("click", async (e) => {
    if (!e.originalEvent.shiftKey) return;

    const lat = Math.round(e.latlng.lat);
    const lng = Math.round(e.latlng.lng);

    const name = prompt("Location name?");
    if (!name) return;

    const summary = prompt("Short sidebar summary?") || "";
    const loreInput =
      prompt("Lore bullets separated by | (Example: Founded | Fell to Angmar)") || "";

    const loreLines = loreInput
      .split("|")
      .map(x => x.trim())
      .filter(Boolean);

    const id = slugifyId(name) || "new_location";

    const obj = {
      id,
      name,
      era: currentAge,
      year: 3019,
      tags: [],
      lat,
      lng,
      summary,
      lore: loreLines.length ? loreLines : [""]
    };

    const snippet = JSON.stringify(obj, null, 2);

    console.log("\n=== NEW LOCATION JSON ===\n" + snippet + ",\n=========================\n");

    try {
      await navigator.clipboard.writeText(snippet + ",");
      alert("Copied JSON to clipboard ✅\nPaste inside data.json -> locations array.");
    } catch {
      alert("Could not auto-copy. JSON printed in Console.");
    }
  });

  // Normal click debug (optional): prints coords
  map.on("click", (e) => {
    if (e.originalEvent.shiftKey) return;
    console.log("lat:", Math.round(e.latlng.lat), "lng:", Math.round(e.latlng.lng));
    closePanelOnMobile();
  });
}

/* ----------------------------
   Filtering + markers
----------------------------- */
function matchesFilters(loc) {
  // Map age gating: only show markers that match selected map age
  const locEra = String(loc.era || "").toLowerCase();
  if (locEra !== currentAge) return false;

  // Search
  const q = (state.query || "").trim().toLowerCase();
  if (q) {
    const hay = `${loc.name || ""} ${(loc.summary || "")} ${(loc.tags || []).join(" ")}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }

  // Era
  if (state.era !== "all") {
    if ((loc.era || "").toLowerCase() !== state.era) return false;
  }

  return true;
}

function makeMarker(loc) {
  // Default Leaflet marker (visible + clickable)
  const marker = L.marker([loc.lat, loc.lng]);

  marker.bindTooltip(escapeHtml(loc.name), {
    permanent: false,
    direction: "top",
    offset: [0, -10],
    opacity: 0.9
  });

  marker.bindPopup(
    `${loc.image ? `<img src="${escapeHtml(loc.image)}" style="width:100%;max-height:140px;object-fit:cover;border-radius:6px;display:block;margin-bottom:6px;">` : ""}` +
    `<strong>${escapeHtml(loc.name)}</strong><br>${escapeHtml(loc.summary || "")}`,
    { maxWidth: 260 }
  );

  marker.on("click", () => {
    state.selectedLocationId = loc.id;
    renderDetails(loc);
    marker.openPopup();
  });

  return marker;
}

function renderMarkers() {
  if (!markersLayer) return;
  markersLayer.clearLayers();

  for (const loc of DATA.locations || []) {
    if (!matchesFilters(loc)) continue;
    const m = makeMarker(loc);
    markersLayer.addLayer(m);
  }
}

function catmullRomSpline(points, segments) {
  if (points.length < 2) return points;
  const pts = [points[0], ...points, points[points.length - 1]];
  const result = [];
  for (let i = 0; i < pts.length - 3; i++) {
    const [p0, p1, p2, p3] = [pts[i], pts[i+1], pts[i+2], pts[i+3]];
    for (let j = 0; j < segments; j++) {
      const t = j / segments, t2 = t * t, t3 = t2 * t;
      result.push([
        0.5 * ((2*p1[0]) + (-p0[0]+p2[0])*t + (2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2 + (-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
        0.5 * ((2*p1[1]) + (-p0[1]+p2[1])*t + (2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2 + (-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)
      ]);
    }
  }
  result.push(points[points.length - 1]);
  return result;
}

function cancelJourneyAnim(polyline) {
  polyline._cancelled = true;
  if (polyline._animTimeout) clearTimeout(polyline._animTimeout);
  const el = polyline.getElement ? polyline.getElement() : null;
  if (el) el.style.transition = "none";
}

function animateJourney(journey, latLngs) {
  // Cancel any existing animation for this journey
  const existing = journeyPolylines.get(journey.id);
  if (existing) {
    cancelJourneyAnim(existing);
    routesLayer.removeLayer(existing);
    journeyPolylines.delete(journey.id);
  }

  if (latLngs.length < 2) return;

  // Draw the full path immediately — CSS will animate the reveal
  const polyline = L.polyline(latLngs, {
    color: journey.color || "#e4572e",
    weight: 4,
    opacity: 0.85
  }).addTo(routesLayer);

  journeyPolylines.set(journey.id, polyline);

  const DURATION = 1400; // ms

  // One RAF ensures Leaflet has rendered the SVG <path> element
  requestAnimationFrame(() => {
    if (polyline._cancelled) return;
    const el = polyline.getElement();
    if (!el) return;

    const len = el.getTotalLength();

    // Set up: one giant dash hides the entire path via offset
    el.style.strokeDasharray = len + " " + len;
    el.style.strokeDashoffset = String(len);
    el.style.transition = "none";

    // Force layout so the initial hidden state is committed before animating
    void el.getBoundingClientRect();

    // Animate offset to 0 → path draws itself from start to end
    el.style.transition = `stroke-dashoffset ${DURATION}ms ease-in-out`;
    el.style.strokeDashoffset = "0";

    // After draw completes, switch to dashed style
    polyline._animTimeout = setTimeout(() => {
      if (polyline._cancelled) return;
      el.style.transition = "none";
      el.style.strokeDasharray = "10 8";
      el.style.strokeDashoffset = "";
    }, DURATION + 50);
  });
}

function renderJourneys() {
  if (!routesLayer) return;

  // Cancel any in-progress animations and clear
  journeyPolylines.forEach(p => cancelJourneyAnim(p));
  journeyPolylines.clear();
  routesLayer.clearLayers();

  for (const journey of DATA.journeys || []) {
    if (!state.activeJourneys.has(journey.id)) continue;

    const latLngs = [];
    for (const pointId of journey.points || []) {
      const loc = (DATA.locations || []).find(l => l.id === pointId);
      if (loc) latLngs.push([loc.lat, loc.lng]);
    }

    if (latLngs.length < 2) continue;

    const polyline = L.polyline(catmullRomSpline(latLngs, 20), {
      color: journey.color || "#e4572e",
      weight: 4,
      opacity: 0.85,
      dashArray: "10, 8"
    }).addTo(routesLayer);

    journeyPolylines.set(journey.id, polyline);
  }
}

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
        const latLngs = [];
        for (const pointId of journey.points || []) {
          const loc = (DATA.locations || []).find(l => l.id === pointId);
          if (loc) latLngs.push([loc.lat, loc.lng]);
        }
        animateJourney(journey, catmullRomSpline(latLngs, 20));
      } else {
        state.activeJourneys.delete(journey.id);
        const existing = journeyPolylines.get(journey.id);
        if (existing) {
          cancelJourneyAnim(existing);
          routesLayer.removeLayer(existing);
          journeyPolylines.delete(journey.id);
        }
      }
    });

    const dot = document.createElement("span");
    dot.className = "journey-dot";
    dot.style.background = journey.color || "#888";

    const nameEl = document.createElement("span");
    nameEl.textContent = journey.name;

    row.appendChild(checkbox);
    row.appendChild(dot);
    row.appendChild(nameEl);
    container.appendChild(row);
  }
}


/* ----------------------------
   Sidebar renderer (with image)
----------------------------- */
function renderDetails(loc) {
  closePanelOnMobile();
  const detailsEl = getDetailsEl();
  if (!detailsEl) return;

  const tagsHtml = (loc.tags || [])
    .map(t => `<span class="tag">${escapeHtml(t)}</span>`)
    .join("");

  const loreHtml = (loc.lore || [])
    .map(x => `<li>${escapeHtml(x)}</li>`)
    .join("");

  detailsEl.innerHTML = `
    <h2>${escapeHtml(loc.name)}</h2>

    ${loc.image ? `<img src="${escapeHtml(loc.image)}" class="location-img">` : ""}

    <p class="summary">${escapeHtml(loc.summary || "")}</p>

    ${tagsHtml ? `<div class="tags">${tagsHtml}</div>` : ""}

    ${loreHtml ? `<ul class="lore">${loreHtml}</ul>` : ""}
  `;
}

/* ----------------------------
   UI wiring
----------------------------- */
function bindUI() {
  const menuToggle = document.getElementById("menuToggle");
  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      const appEl = document.querySelector(".app");
      if (!appEl) return;
      const isOpen = appEl.classList.toggle("panel--open");
      menuToggle.innerHTML = isOpen ? "&#10005;" : "&#9776;";
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      const panel = document.querySelector(".panel");
      if (panel) panel.style.width = isOpen ? panelWidth + "px" : "";
    });
  }

  // Auto-close panel on rotation to landscape.
  // iOS Safari fires 'resize' before window.innerWidth has updated, so we use
  // 'orientationchange' + matchMedia instead — both are accurate at fire time.
  function closePanelForLandscape() {
    if (!window.matchMedia("(orientation: landscape)").matches) return;
    const appEl = document.querySelector(".app");
    const toggle = document.getElementById("menuToggle");
    const panel = document.querySelector(".panel");
    if (appEl) appEl.classList.remove("panel--open");
    if (toggle) {
      toggle.innerHTML = "&#9776;";
      toggle.setAttribute("aria-expanded", "false");
    }
    if (panel) panel.style.width = "";
  }
  window.addEventListener("orientationchange", closePanelForLandscape);
  // Fallback for desktop browsers that don't fire orientationchange
  window.matchMedia("(orientation: landscape)").addEventListener("change", closePanelForLandscape);

  // Always invalidate Leaflet size so the map fills its container after resize
  window.addEventListener("resize", () => { if (map) map.invalidateSize(); });

  const searchEl = document.getElementById("search");
  if (searchEl) {
    searchEl.addEventListener("input", () => {
      state.query = searchEl.value || "";
      renderMarkers();
    });
  }

  const eraEl = document.getElementById("era");
  if (eraEl) {
    eraEl.addEventListener("change", () => {
      state.era = eraEl.value || "all";
      renderMarkers();
    });
  }

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

  // Map selector dropdown (must exist in index.html)
  const ageSelector = document.getElementById("ageSelector");
  if (ageSelector) {
    ageSelector.value = currentAge;
    ageSelector.addEventListener("change", (event) => {
      currentAge = event.target.value;
      loadMapOverlay();
      renderMarkers();
      renderJourneys();
    });
  }
}

/* ----------------------------
   Main
----------------------------- */
async function main() {
  try {
    DATA = await loadData();
    initMap();
    initJourneys();
    bindUI();
    initPanelResizer();
    renderMarkers();
    renderJourneys();

    const detailsEl = getDetailsEl();
    if (detailsEl) {
      detailsEl.innerHTML = `<p class="muted">Click a marker to see lore.</p>`;
    }
  } catch (err) {
    console.error(err);
    const detailsEl = getDetailsEl();
    if (detailsEl) {
      detailsEl.innerHTML = `<div class="error">Error loading data. Check console.</div>`;
    }
  }
}

main();
