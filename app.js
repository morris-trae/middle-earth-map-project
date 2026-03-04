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

let currentAge = "third"; // "third" | "first"

const state = {
  query: "",
  era: "all",     // "all" | "first" | "second" | "third" (you can extend)
  year: 999999,   // timeline cutoff
  activeJourneys: new Set(),
  selectedLocationId: null
};

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
  if (appEl) appEl.classList.remove("panel--open");
  if (toggle) {
    toggle.innerHTML = "&#9776;";
    toggle.setAttribute("aria-expanded", "false");
  }
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

function getSelectedYear() {
  const el = document.getElementById("year");
  if (!el) return state.year;
  const v = Number(el.value);
  return Number.isFinite(v) ? v : state.year;
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

  // Year cutoff (<= selected)
  const y = Number(loc.year);
  const cutoff = Number(getSelectedYear());
  if (Number.isFinite(y) && Number.isFinite(cutoff)) {
    if (y > cutoff) return false;
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

function initTimeline() {
  const yearEl = document.getElementById("year");
  if (!yearEl) return;

  const years = (DATA.locations || [])
    .map((loc) => Number(loc.year))
    .filter((y) => Number.isFinite(y));
  const min = years.length ? Math.min(...years) : 0;
  const max = years.length ? Math.max(...years) : 1;

  yearEl.min = String(min);
  yearEl.max = String(max);
  yearEl.step = "1";
  yearEl.value = String(max);
  state.year = max;

  const minEl = document.getElementById("minYear");
  const maxEl = document.getElementById("maxYear");
  const labelEl = document.getElementById("timelineLabel");
  if (minEl) minEl.textContent = String(min);
  if (maxEl) maxEl.textContent = String(max);
  if (labelEl) labelEl.textContent = `Showing up to year ${max}`;
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
    });
  }

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

  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.addEventListener("input", () => {
      state.year = Number(yearEl.value) || state.year;
      const labelEl = document.getElementById("timelineLabel");
      if (labelEl) labelEl.textContent = `Showing up to year ${getSelectedYear()}`;
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
      renderMarkers();
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
    initTimeline();
    bindUI();
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
