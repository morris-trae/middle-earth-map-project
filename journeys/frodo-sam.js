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
