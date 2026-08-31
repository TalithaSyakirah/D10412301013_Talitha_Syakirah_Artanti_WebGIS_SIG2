/* global L, REGIONS, DEFAULT_REGION, DEFAULT_FLOOD_OPACITY, ShpReader */

"use strict";

/* ================================================================
   MAP & BASEMAP
   ================================================================ */

const initialRegion =
  REGIONS[DEFAULT_REGION];

const map =
  L.map("map", {
    zoomControl: true,
    preferCanvas: true
  }).setView(
    initialRegion.center,
    initialRegion.zoom
  );

const osm =
  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 20,
      attribution: "&copy; OpenStreetMap contributors"
    }
  );

const osmHot =
  L.tileLayer(
    "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    {
      maxZoom: 20,
      attribution:
        "&copy; OpenStreetMap contributors, HOT"
    }
  );

osm.addTo(map);

/*
 * Jika satu tile OSM gagal, hanya tile itu yang dicoba
 * menggunakan HOT. Mekanisme Leaflet tetap standar.
 */
osm.on("tileerror", (event) => {
  const tile = event.tile;
  const coords = event.coords;

  if (
    !tile ||
    !coords ||
    tile.dataset.fallbackTried === "1"
  ) {
    return;
  }

  tile.dataset.fallbackTried = "1";

  tile.src =
    `https://a.tile.openstreetmap.fr/hot/` +
    `${coords.z}/${coords.x}/${coords.y}.png`;
});

/* ================================================================
   PANE ORDER
   4m TERDALAM = PALING BAWAH
   ================================================================ */

const FLOOD_Z_INDEX = {
  4: 410,
  3.5: 420,
  3: 430,
  2.5: 440,
  2: 450,
  1.5: 460,
  1: 470
};

Object.entries(FLOOD_Z_INDEX)
  .forEach(([value, zIndex]) => {
    const pane =
      map.createPane(
        `flood-${value}`
      );

    pane.style.zIndex =
      String(zIndex);

    pane.style.pointerEvents =
      "auto";
  });

const supportAreaPane =
  map.createPane("support-area");

supportAreaPane.style.zIndex = "395";

const supportPolygonPane =
  map.createPane("support-polygon");

supportPolygonPane.style.zIndex = "500";

const supportLinePane =
  map.createPane("support-line");

supportLinePane.style.zIndex = "520";

/* ================================================================
   STATE
   ================================================================ */

const state = {
  regionKey: DEFAULT_REGION,

  floodOpacity:
    DEFAULT_FLOOD_OPACITY,

  /*
   * Default semua layer genangan ON.
   */
  visibleFloods:
    new Set(
      initialRegion.floodLayers.map(
        (item) => item.value
      )
    ),

  visibleSupports:
    new Set(
      initialRegion.supportLayers
        .filter(
          (item) =>
            item.defaultVisible
        )
        .map(
          (item) => item.id
        )
    ),

  floodLeafletLayers:
    new Map(),

  supportLeafletLayers:
    new Map(),

  dataCache:
    new Map(),

  baseLayer: "osm",

  simulationToken: 0,
  simulationRunning: false,

  fitBounds: null
};

/* ================================================================
   DOM
   ================================================================ */

const regionSelect =
  document.getElementById("regionSelect");

const floodLayerControls =
  document.getElementById("floodLayerControls");

const supportLayerControls =
  document.getElementById("supportLayerControls");

const opacityRange =
  document.getElementById("opacityRange");

const opacityValue =
  document.getElementById("opacityValue");

const simulationButton =
  document.getElementById("simulationButton");

const simulationIcon =
  document.getElementById("simulationIcon");

const simulationText =
  document.getElementById("simulationText");

const showAllButton =
  document.getElementById("showAllButton");

const hideAllButton =
  document.getElementById("hideAllButton");

const mapRegionName =
  document.getElementById("mapRegionName");

const mapLayerStatus =
  document.getElementById("mapLayerStatus");

const sidebarRegionFooter =
  document.getElementById("sidebarRegionFooter");

const activeScenarioRegion =
  document.getElementById("activeScenarioRegion");

const activeScenarioValue =
  document.getElementById("activeScenarioValue");

const activeScenarioLayer =
  document.getElementById("activeScenarioLayer");

const activeScenarioStatus =
  document.getElementById("activeScenarioStatus");

const basemapSelect =
  document.getElementById("basemapSelect");

const focusButton =
  document.getElementById("focusButton");

const floodLegendRows =
  document.getElementById("floodLegendRows");

const supportLegendRows =
  document.getElementById("supportLegendRows");

const areaStats =
  document.getElementById("areaStats");

const legendToggle =
  document.getElementById("legendToggle");

const legendContent =
  document.getElementById("legendContent");

const cursorLat =
  document.getElementById("cursorLat");

const cursorLng =
  document.getElementById("cursorLng");

const zoomBadge =
  document.getElementById("zoomBadge");

const loadingOverlay =
  document.getElementById("loadingOverlay");

const loadingTitle =
  document.getElementById("loadingTitle");

const loadingDetail =
  document.getElementById("loadingDetail");

const toast =
  document.getElementById("toast");

const toastTitle =
  document.getElementById("toastTitle");

const toastMessage =
  document.getElementById("toastMessage");

/* ================================================================
   HELPERS
   ================================================================ */

function getRegion() {
  return REGIONS[state.regionKey];
}

function getFloodConfig(value) {
  return getRegion().floodLayers.find(
    (item) =>
      Number(item.value) ===
      Number(value)
  );
}

function formatArea(value) {
  return Number(value).toLocaleString(
    "id-ID",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );
}

function showLoading(
  show,
  title = "Memuat layer",
  detail = "Mohon tunggu..."
) {
  loadingTitle.textContent = title;
  loadingDetail.textContent = detail;

  loadingOverlay.classList.toggle(
    "hidden",
    !show
  );
}

function showToast(
  title,
  message,
  type = "info"
) {
  toastTitle.textContent = title;
  toastMessage.textContent = message;

  toast.dataset.type = type;
  toast.classList.remove("hidden");

  clearTimeout(showToast.timer);

  showToast.timer =
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 4200);
}

function currentVisibleFloodCount() {
  return state.visibleFloods.size;
}

function updateActiveScenarioCard() {
  const region = getRegion();

  const visibleConfigs =
    region.floodLayers
      .filter(
        (item) =>
          state.visibleFloods.has(item.value)
      )
      .sort(
        (a, b) =>
          a.value - b.value
      );

  activeScenarioRegion.textContent =
    region.name;

  if (!visibleConfigs.length) {
    activeScenarioValue.textContent = "—";
    activeScenarioLayer.textContent = "Tidak ada layer";
    activeScenarioStatus.textContent =
      state.simulationRunning
        ? "Simulasi berjalan"
        : "Nonaktif";

    return;
  }

  if (visibleConfigs.length === 1) {
    activeScenarioValue.textContent =
      visibleConfigs[0].label.replace(" m", "");
  } else {
    const lowest =
      visibleConfigs[0].label.replace(" m", "");

    const highest =
      visibleConfigs[
        visibleConfigs.length - 1
      ].label.replace(" m", "");

    activeScenarioValue.textContent =
      `${lowest}–${highest}`;
  }

  activeScenarioLayer.textContent =
    `${visibleConfigs.length} layer genangan`;

  activeScenarioStatus.textContent =
    state.simulationRunning
      ? "Simulasi berjalan"
      : "Aktif";
}

function updateMapHeader() {
  const region = getRegion();

  const count =
    currentVisibleFloodCount();

  mapRegionName.textContent =
    `${region.typeLabel} ${region.name}`;

  mapLayerStatus.textContent =
    `${count} layer genangan aktif`;

  sidebarRegionFooter.textContent =
    `${region.name} · ${region.province}`;

  updateActiveScenarioCard();
}

function paneForSupport(config) {
  const style =
    config.style || {};

  if (
    Number(style.fillOpacity || 0) > 0.08
  ) {
    return "support-area";
  }

  /*
   * Polygon administrasi dengan fill tipis.
   */
  if (
    Number(style.fillOpacity || 0) > 0
  ) {
    return "support-polygon";
  }

  return "support-line";
}

function setFloodStyle(
  leafletLayer,
  config
) {
  leafletLayer.setStyle({
    color: config.color,
    weight: 0.85,
    opacity: 0.92,
    fillColor: config.color,
    fillOpacity:
      state.floodOpacity
  });
}

/* ================================================================
   REGION SELECT
   ================================================================ */

function renderRegionSelect() {
  regionSelect.innerHTML = "";

  Object.entries(REGIONS)
    .forEach(([key, region]) => {
      const option =
        document.createElement("option");

      option.value = key;
      option.textContent =
        `${region.typeLabel} ${region.name} — ${region.province}`;

      regionSelect.appendChild(option);
    });

  regionSelect.value =
    state.regionKey;
}

/* ================================================================
   FLOOD CONTROLS
   ================================================================ */

function renderFloodControls() {
  floodLayerControls.innerHTML = "";

  getRegion()
    .floodLayers
    .forEach((config) => {
      const row =
        document.createElement("label");

      row.className =
        "layer-toggle-row";

      const checked =
        state.visibleFloods.has(
          config.value
        );

      row.innerHTML = `
        <span class="layer-name-wrap">
          <span
            class="layer-color-dot"
            style="background:${config.color}; box-shadow:0 0 14px ${config.color}88"
          ></span>

          <span>
            <strong>${config.label}</strong>
            <small>${formatArea(config.areaKm2)} km²</small>
          </span>
        </span>

        <span class="switch">
          <input
            type="checkbox"
            data-flood-value="${config.value}"
            ${checked ? "checked" : ""}
          >
          <span class="switch-track"></span>
        </span>
      `;

      floodLayerControls.appendChild(row);
    });

  floodLayerControls
    .querySelectorAll(
      "input[data-flood-value]"
    )
    .forEach((input) => {
      input.addEventListener(
        "change",
        async () => {
          stopSimulation();

          const value =
            Number(
              input.dataset.floodValue
            );

          await setFloodVisibility(
            value,
            input.checked
          );

          renderLegend();
          updateMapHeader();
        }
      );
    });
}

/* ================================================================
   SUPPORT CONTROLS
   Dinamis: hanya muncul jika region punya file tersebut.
   ================================================================ */

function renderSupportControls() {
  supportLayerControls.innerHTML = "";

  const layers =
    getRegion().supportLayers;

  if (!layers.length) {
    supportLayerControls.innerHTML =
      `<p class="empty-layer">Tidak ada layer pendukung.</p>`;

    return;
  }

  layers.forEach((config) => {
    const row =
      document.createElement("label");

    row.className =
      "support-toggle-row";

    const checked =
      state.visibleSupports.has(
        config.id
      );

    row.innerHTML = `
      <span>${config.label}</span>

      <span class="switch">
        <input
          type="checkbox"
          data-support-id="${config.id}"
          ${checked ? "checked" : ""}
        >
        <span class="switch-track"></span>
      </span>
    `;

    supportLayerControls.appendChild(row);
  });

  supportLayerControls
    .querySelectorAll(
      "input[data-support-id]"
    )
    .forEach((input) => {
      input.addEventListener(
        "change",
        async () => {
          const id =
            input.dataset.supportId;

          await setSupportVisibility(
            id,
            input.checked
          );

          renderLegend();
        }
      );
    });
}

/* ================================================================
   LEGEND & AREA STATS
   ================================================================ */

function renderLegend() {
  const region = getRegion();

  floodLegendRows.innerHTML = "";
  areaStats.innerHTML = "";
  supportLegendRows.innerHTML = "";

  region.floodLayers
    .forEach((config, index) => {
      const visible =
        state.visibleFloods.has(
          config.value
        );

      const row =
        document.createElement("div");

      row.className =
        `flood-legend-row ${visible ? "" : "legend-disabled"}`;

      let suffix = "";

      if (index === 0) {
        suffix = " — Dangkal";
      } else if (
        index ===
        region.floodLayers.length - 1
      ) {
        suffix = " — Terdalam";
      }

      row.innerHTML = `
        <span
          class="legend-square"
          style="background:${config.color}; box-shadow:0 0 13px ${config.color}88"
        ></span>

        <span>${config.label}${suffix}</span>
      `;

      floodLegendRows.appendChild(row);
    });

  const maxArea =
    Math.max(
      ...region.floodLayers.map(
        (config) => config.areaKm2
      )
    );

  region.floodLayers
    .forEach((config) => {
      const visible =
        state.visibleFloods.has(
          config.value
        );

      const width =
        Math.max(
          8,
          config.areaKm2 /
            maxArea *
            100
        );

      const row =
        document.createElement("div");

      row.className =
        `stat-row ${visible ? "" : "legend-disabled"}`;

      row.innerHTML = `
        <span
          class="stat-dot"
          style="background:${config.color}; box-shadow:0 0 11px ${config.color}88"
        ></span>

        <strong>${config.label}</strong>

        <span class="stat-track">
          <span
            class="stat-fill"
            style="width:${width}%; background:${config.color}"
          ></span>
        </span>

        <span class="stat-value">
          ${formatArea(config.areaKm2)} km²
        </span>
      `;

      areaStats.appendChild(row);
    });

  region.supportLayers
    .forEach((config) => {
      const visible =
        state.visibleSupports.has(
          config.id
        );

      const style =
        config.style || {};

      const row =
        document.createElement("div");

      row.className =
        `support-legend-row ${visible ? "" : "legend-disabled"}`;

      if (
        Number(style.fillOpacity || 0) > 0.08
      ) {
        row.innerHTML = `
          <span
            class="legend-area"
            style="
              background:${style.fillColor || style.color};
              border-color:${style.color};
            "
          ></span>
          <span>${config.legendLabel}</span>
        `;
      } else {
        row.innerHTML = `
          <span
            class="legend-line"
            style="
              background:${style.color};
            "
          ></span>
          <span>${config.legendLabel}</span>
        `;
      }

      supportLegendRows.appendChild(row);
    });
}

/* ================================================================
   SHP LOADERS
   ================================================================ */

async function getShpData(
  file,
  projection
) {
  const projectionKey =
    JSON.stringify(
      projection || {
        type: "wgs84"
      }
    );

  const key =
    `${file}|${projectionKey}`;

  if (state.dataCache.has(key)) {
    return state.dataCache.get(key);
  }

  const data =
    await ShpReader.loadShapefile(
      file,
      {
        projection
      }
    );

  state.dataCache.set(
    key,
    data
  );

  return data;
}

async function ensureFloodLayer(
  value
) {
  if (
    state.floodLeafletLayers.has(value)
  ) {
    return state.floodLeafletLayers.get(value);
  }

  const config =
    getFloodConfig(value);

  if (!config) {
    throw new Error(
      `Konfigurasi genangan ${value} m tidak ditemukan.`
    );
  }

  const data =
    await getShpData(
      config.file,
      {
        type: "wgs84"
      }
    );

  const layer =
    L.geoJSON(
      data,
      {
        pane:
          `flood-${config.value}`,

        style: () => ({
          color: config.color,
          weight: 0.85,
          opacity: 0.92,
          fillColor: config.color,
          fillOpacity:
            state.floodOpacity
        }),

        onEachFeature:
          (_feature, featureLayer) => {
            featureLayer.bindTooltip(
              `<strong>${getRegion().name}</strong><br>` +
              `Genangan ${config.label}<br>` +
              `${formatArea(config.areaKm2)} km²`,
              {
                sticky: true,
                className: "map-tooltip"
              }
            );
          }
      }
    );

  state.floodLeafletLayers.set(
    value,
    layer
  );

  return layer;
}

async function setFloodVisibility(
  value,
  visible
) {
  if (visible) {
    state.visibleFloods.add(value);

    const config =
      getFloodConfig(value);

    showLoading(
      true,
      "Memuat layer genangan",
      `${getRegion().name} · ${config.label}`
    );

    try {
      const layer =
        await ensureFloodLayer(value);

      if (!map.hasLayer(layer)) {
        layer.addTo(map);
      }

      setFloodStyle(
        layer,
        config
      );

      updateFitBounds();
    } catch (error) {
      state.visibleFloods.delete(value);

      showToast(
        "Layer gagal dimuat",
        error.message,
        "error"
      );

      throw error;
    } finally {
      showLoading(false);
    }
  } else {
    state.visibleFloods.delete(value);

    const layer =
      state.floodLeafletLayers.get(value);

    if (
      layer &&
      map.hasLayer(layer)
    ) {
      map.removeLayer(layer);
    }

    updateFitBounds();
  }
}

async function ensureSupportLayer(
  config
) {
  if (
    state.supportLeafletLayers.has(
      config.id
    )
  ) {
    return state.supportLeafletLayers.get(
      config.id
    );
  }

  const data =
    await getShpData(
      config.file,
      config.projection
    );

  const pane =
    paneForSupport(config);

  const layer =
    L.geoJSON(
      data,
      {
        pane,

        style: () => ({
          ...config.style,
          pane
        }),

        onEachFeature:
          (_feature, featureLayer) => {
            featureLayer.bindTooltip(
              `<strong>${config.label}</strong><br>` +
              `${getRegion().name}`,
              {
                sticky: true,
                className: "map-tooltip"
              }
            );
          }
      }
    );

  state.supportLeafletLayers.set(
    config.id,
    layer
  );

  return layer;
}

async function setSupportVisibility(
  id,
  visible
) {
  const config =
    getRegion().supportLayers.find(
      (item) =>
        item.id === id
    );

  if (!config) {
    return;
  }

  if (visible) {
    state.visibleSupports.add(id);

    showLoading(
      true,
      "Memuat layer pendukung",
      `${getRegion().name} · ${config.label}`
    );

    try {
      const layer =
        await ensureSupportLayer(
          config
        );

      if (!map.hasLayer(layer)) {
        layer.addTo(map);
      }
    } catch (error) {
      state.visibleSupports.delete(id);

      showToast(
        "Layer pendukung gagal",
        `${config.label}: ${error.message}`,
        "error"
      );
    } finally {
      showLoading(false);
    }
  } else {
    state.visibleSupports.delete(id);

    const layer =
      state.supportLeafletLayers.get(id);

    if (
      layer &&
      map.hasLayer(layer)
    ) {
      map.removeLayer(layer);
    }
  }
}

/* ================================================================
   SHOW / HIDE ALL
   ================================================================ */

async function showAllFloods(
  options = {}
) {
  const {
    fit = false
  } = options;

  stopSimulation();

  const region =
    getRegion();

  /*
   * Load dari 4 m -> 1 m.
   * Pane z-index tetap memastikan 4m paling bawah.
   */
  const ordered =
    [...region.floodLayers]
      .sort(
        (a, b) =>
          b.value - a.value
      );

  showLoading(
    true,
    "Memuat semua genangan",
    `${region.name} · 0/${ordered.length}`
  );

  state.visibleFloods =
    new Set(
      region.floodLayers.map(
        (item) => item.value
      )
    );

  try {
    for (
      let index = 0;
      index < ordered.length;
      index += 1
    ) {
      const config =
        ordered[index];

      loadingDetail.textContent =
        `${region.name} · ${index + 1}/${ordered.length} · ${config.label}`;

      const layer =
        await ensureFloodLayer(
          config.value
        );

      if (!map.hasLayer(layer)) {
        layer.addTo(map);
      }

      setFloodStyle(
        layer,
        config
      );
    }

    updateFitBounds();

    if (
      fit &&
      state.fitBounds &&
      state.fitBounds.isValid()
    ) {
      map.fitBounds(
        state.fitBounds,
        {
          paddingTopLeft: [50, 100],
          paddingBottomRight: [50, 55],
          maxZoom: 13
        }
      );
    }
  } catch (error) {
    showToast(
      "Sebagian layer gagal dimuat",
      error.message,
      "error"
    );
  } finally {
    showLoading(false);

    renderFloodControls();
    renderLegend();
    updateMapHeader();
  }
}

function hideAllFloods() {
  stopSimulation();

  state.visibleFloods.clear();

  state.floodLeafletLayers
    .forEach((layer) => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

  updateFitBounds();
  renderFloodControls();
  renderLegend();
  updateMapHeader();
}

/* ================================================================
   SUPPORT DEFAULT
   ================================================================ */

async function loadDefaultSupportLayers() {
  const region =
    getRegion();

  for (
    const config of
    region.supportLayers
  ) {
    if (
      state.visibleSupports.has(
        config.id
      )
    ) {
      await setSupportVisibility(
        config.id,
        true
      );
    }
  }

  renderSupportControls();
  renderLegend();
}

/* ================================================================
   TRANSPARENCY
   ================================================================ */

function applyFloodOpacity() {
  state.floodLeafletLayers
    .forEach(
      (layer, value) => {
        const config =
          getFloodConfig(value);

        if (config) {
          setFloodStyle(
            layer,
            config
          );
        }
      }
    );
}

/* ================================================================
   SIMULATION
   ================================================================ */

function sleep(milliseconds) {
  return new Promise(
    (resolve) =>
      setTimeout(
        resolve,
        milliseconds
      )
  );
}

function setSimulationUi(running) {
  state.simulationRunning =
    running;

  if (running) {
    simulationIcon.textContent = "■";
    simulationText.textContent =
      "HENTIKAN SIMULASI";
    simulationButton.classList.add(
      "running"
    );
  } else {
    simulationIcon.textContent = "▶";
    simulationText.textContent =
      "SIMULASI KENAIKAN AIR";
    simulationButton.classList.remove(
      "running"
    );
  }

  updateActiveScenarioCard();
}

function stopSimulation() {
  state.simulationToken += 1;

  if (state.simulationRunning) {
    setSimulationUi(false);
  }
}

async function runSimulation() {
  if (state.simulationRunning) {
    stopSimulation();
    return;
  }

  const token =
    ++state.simulationToken;

  setSimulationUi(true);

  /*
   * Mulai dari kondisi kosong.
   */
  state.visibleFloods.clear();

  state.floodLeafletLayers
    .forEach((layer) => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

  renderFloodControls();
  renderLegend();
  updateMapHeader();

  const ordered =
    [...getRegion().floodLayers]
      .sort(
        (a, b) =>
          a.value - b.value
      );

  for (
    const config of ordered
  ) {
    if (
      token !==
      state.simulationToken
    ) {
      return;
    }

    showLoading(
      true,
      "Simulasi kenaikan air",
      `${getRegion().name} · ${config.label}`
    );

    try {
      state.visibleFloods.add(
        config.value
      );

      const layer =
        await ensureFloodLayer(
          config.value
        );

      if (!map.hasLayer(layer)) {
        layer.addTo(map);
      }

      setFloodStyle(
        layer,
        config
      );

      renderFloodControls();
      renderLegend();
      updateMapHeader();
    } catch (error) {
      showToast(
        "Simulasi terhenti",
        error.message,
        "error"
      );

      break;
    } finally {
      showLoading(false);
    }

    await sleep(900);
  }

  if (
    token ===
    state.simulationToken
  ) {
    setSimulationUi(false);

    updateFitBounds();

    showToast(
      "Simulasi selesai",
      `Kenaikan air 1,0 m hingga 4,0 m untuk ${getRegion().name} telah ditampilkan.`,
      "success"
    );
  }
}

/* ================================================================
   FIT BOUNDS
   ================================================================ */

function updateFitBounds() {
  let bounds = null;

  state.visibleFloods
    .forEach((value) => {
      const layer =
        state.floodLeafletLayers.get(
          value
        );

      if (
        !layer ||
        !map.hasLayer(layer)
      ) {
        return;
      }

      const layerBounds =
        layer.getBounds();

      if (!layerBounds.isValid()) {
        return;
      }

      if (!bounds) {
        bounds =
          L.latLngBounds(
            layerBounds.getSouthWest(),
            layerBounds.getNorthEast()
          );
      } else {
        bounds.extend(
          layerBounds
        );
      }
    });

  state.fitBounds = bounds;
}

/* ================================================================
   REGION CHANGE
   ================================================================ */

function clearCurrentRegionLayers() {
  state.floodLeafletLayers
    .forEach((layer) => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

  state.supportLeafletLayers
    .forEach((layer) => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

  state.floodLeafletLayers.clear();
  state.supportLeafletLayers.clear();

  state.fitBounds = null;
}

async function changeRegion(
  regionKey
) {
  if (!REGIONS[regionKey]) {
    return;
  }

  stopSimulation();
  clearCurrentRegionLayers();

  state.regionKey =
    regionKey;

  const region =
    getRegion();

  /*
   * Setiap pindah daerah:
   * semua genangan kembali aktif.
   */
  state.visibleFloods =
    new Set(
      region.floodLayers.map(
        (item) => item.value
      )
    );

  /*
   * Support layer hanya yang defaultVisible.
   */
  state.visibleSupports =
    new Set(
      region.supportLayers
        .filter(
          (item) =>
            item.defaultVisible
        )
        .map(
          (item) => item.id
        )
    );

  map.setView(
    region.center,
    region.zoom
  );

  cursorLat.textContent =
    Number(
      region.center[0]
    ).toFixed(6);

  cursorLng.textContent =
    Number(
      region.center[1]
    ).toFixed(6);

  zoomBadge.textContent =
    `Z${map.getZoom()}`;

  renderFloodControls();
  renderSupportControls();
  renderLegend();
  updateMapHeader();

  await showAllFloods({
    fit: true
  });

  await loadDefaultSupportLayers();
}

/* ================================================================
   LIVE CURSOR
   ================================================================ */

map.on(
  "mousemove",
  (event) => {
    cursorLat.textContent =
      event.latlng.lat.toFixed(6);

    cursorLng.textContent =
      event.latlng.lng.toFixed(6);
  }
);

map.on(
  "zoomend",
  () => {
    zoomBadge.textContent =
      `Z${map.getZoom()}`;
  }
);

/* ================================================================
   BASEMAP
   ================================================================ */

function setBasemap(value) {
  if (value === "hot") {
    if (map.hasLayer(osm)) {
      map.removeLayer(osm);
    }

    if (!map.hasLayer(osmHot)) {
      osmHot.addTo(map);
    }

    state.baseLayer = "hot";
  } else {
    if (map.hasLayer(osmHot)) {
      map.removeLayer(osmHot);
    }

    if (!map.hasLayer(osm)) {
      osm.addTo(map);
    }

    state.baseLayer = "osm";
  }

  /*
   * Vector pane punya z-index sendiri,
   * sehingga tetap di atas basemap.
   */
}

/* ================================================================
   EVENTS
   ================================================================ */

regionSelect.addEventListener(
  "change",
  async (event) => {
    await changeRegion(
      event.target.value
    );
  }
);

opacityRange.addEventListener(
  "input",
  () => {
    const percent =
      Number(
        opacityRange.value
      );

    opacityValue.textContent =
      `${percent}%`;

    state.floodOpacity =
      percent / 100;

    applyFloodOpacity();
  }
);

simulationButton.addEventListener(
  "click",
  runSimulation
);

showAllButton.addEventListener(
  "click",
  async () => {
    await showAllFloods();
  }
);

hideAllButton.addEventListener(
  "click",
  hideAllFloods
);

focusButton.addEventListener(
  "click",
  () => {
    if (
      state.fitBounds &&
      state.fitBounds.isValid()
    ) {
      map.fitBounds(
        state.fitBounds,
        {
          paddingTopLeft: [50, 100],
          paddingBottomRight: [50, 55],
          maxZoom: 13
        }
      );
    } else {
      const region =
        getRegion();

      map.setView(
        region.center,
        region.zoom
      );
    }
  }
);

basemapSelect.addEventListener(
  "change",
  () => {
    setBasemap(
      basemapSelect.value
    );
  }
);

legendToggle.addEventListener(
  "click",
  () => {
    const isHidden =
      legendContent.classList.toggle(
        "legend-content-hidden"
      );

    legendToggle.textContent =
      isHidden ? "⌃" : "⌄";

    legendToggle.setAttribute(
      "aria-expanded",
      String(!isHidden)
    );
  }
);

window.addEventListener(
  "resize",
  () => {
    setTimeout(
      () =>
        map.invalidateSize(),
      100
    );
  }
);

/* ================================================================
   INIT
   ================================================================ */

async function init() {
  renderRegionSelect();
  renderFloodControls();
  renderSupportControls();
  renderLegend();
  updateMapHeader();

  opacityRange.value =
    String(
      Math.round(
        state.floodOpacity * 100
      )
    );

  opacityValue.textContent =
    `${opacityRange.value}%`;

  cursorLat.textContent =
    initialRegion.center[0].toFixed(6);

  cursorLng.textContent =
    initialRegion.center[1].toFixed(6);

  zoomBadge.textContent =
    `Z${map.getZoom()}`;

  /*
   * Recalculate size after CSS grid/sidebar is ready.
   */
  setTimeout(
    () =>
      map.invalidateSize(),
    90
  );

  /*
   * Default Singkawang:
   * load semua flood + Batas Administrasi.
   */
  await showAllFloods({
    fit: true
  });

  await loadDefaultSupportLayers();
}

init();
