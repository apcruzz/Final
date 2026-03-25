(function() {
  // MAP STATE
  // ══════════════════════════════════════════════════════════════════
  let activeDataset = "visitors";
  let allLayers = [];
  let bubbleMarkers = [];
  const stateCenters = {};
  let highlightedState = null; // for quiz result highlight

  function ds() { return DATASETS[activeDataset]; }

  // ── Map init ──
  const mainMap = L.map("map", {
    zoomControl: false, attributionControl: false,
    preferCanvas: true, dragging: true, scrollWheelZoom: true,
    minZoom: 3, maxZoom: 7,
    zoomSnap: 0.25,
    zoomDelta: 0.25,
    wheelPxPerZoomLevel: 140,
    easeLinearity: 0.2
  });
  let hasAutoCenteredMainMap = false;
  const akMap = L.map("map-ak", {
    zoomControl: false, attributionControl: false, preferCanvas: true,
    dragging: false, scrollWheelZoom: false, doubleClickZoom: false,
    boxZoom: false, keyboard: false, tap: false
  });
  const hiMap = L.map("map-hi", {
    zoomControl: false, attributionControl: false, preferCanvas: true,
    dragging: false, scrollWheelZoom: false, doubleClickZoom: false,
    boxZoom: false, keyboard: false, tap: false
  });
  L.DomEvent.disableClickPropagation(document.getElementById("map-ak"));
  L.DomEvent.disableClickPropagation(document.getElementById("map-hi"));

  function getMapByKey(k) {
    if (k === "ak") return akMap;
    if (k === "hi") return hiMap;
    return mainMap;
  }


  // ── State name labels on map (from partner) ──
  function addStateLabels(layer, map) {
    layer.eachLayer(function(stateLayer) {
      const name = getStateName(stateLayer.feature);
      const bounds = stateLayer.getBounds && stateLayer.getBounds();
      if (!bounds || !bounds.isValid()) return;

      L.marker(bounds.getCenter(), {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: "state-name-label-wrap",
          html: '<span class="state-name-label">' + escHtml(name) + '</span>'
        })
      }).addTo(map);
    });
  }

  function cacheStateCenters(layer, mapKey) {
    layer.eachLayer(l => {
      const name = getStateName(l.feature);
      const bounds = l.getBounds?.();
      if (bounds?.isValid()) stateCenters[name] = { mapKey, center: bounds.getCenter() };
    });
  }

  // ── Styles ──
  function stateStyle(feature) {
    const name = getStateName(feature);
    const fill = ds().choroplethFn(name);
    // Highlight matched state from quiz
    if (highlightedState === name) return { color: "#ffd700", weight: 3, fillColor: fill || cssVar("--no-data"), fillOpacity: 0.95 };
    return { color: cssVar("--stroke"), weight: 1, fillColor: fill || cssVar("--no-data"), fillOpacity: 0.88 };
  }

  function hoverStyle(feature) {
    const name = getStateName(feature);
    return { color: "#fff", weight: 2, fillColor: cssVar("--hover"), fillOpacity: 1 };
  }

  function attachInteractions(feature, layer) {
    const name = getStateName(feature);
    layer.on("mouseover.map-study", () => layer.setStyle(hoverStyle(feature)));
    layer.on("mouseout.map-study",  () => layer.setStyle(stateStyle(feature)));
    bindTooltip(feature, layer);
  }

  function bindTooltip(feature, layer) {
    const name = getStateName(feature);
    const extra = ds().tooltipFn ? ds().tooltipFn(name) : "";
    const mapContainerId = layer._map?.getContainer?.().id;
    const isInsetMap = mapContainerId === "map-ak" || mapContainerId === "map-hi";
    layer.unbindTooltip();
    layer.bindTooltip(`<div class="tt-title">${name}</div>${extra||""}`, {
      sticky: true,
      direction: isInsetMap ? "top" : "auto",
      className: isInsetMap ? "state-tooltip state-tooltip-inset" : "state-tooltip"
    });
  }

  // ── Choropleth repaint ──
  function repaint() {
    allLayers.forEach(({feature, layer}) => layer.setStyle(stateStyle(feature)));
  }

  function refreshTooltips() {
    allLayers.forEach(({feature, layer}) => bindTooltip(feature, layer));
  }

  // ── Overlays ──
  function clearOverlays() {
    bubbleMarkers.forEach(({marker, mapKey}) => {
      const m = getMapByKey(mapKey);
      if (m.hasLayer(marker)) m.removeLayer(marker);
    });
    bubbleMarkers = [];
    allLayers.forEach(({layer}) => {
      layer.off(".map-study");
      layer.off(".overlay-hover");
      layer.on("mouseover.overlay-hover", evt => layer.setStyle(hoverStyle(evt.target.feature)));
      layer.on("mouseout.overlay-hover",  evt => layer.setStyle(stateStyle(evt.target.feature)));
    });
  }

  function buildPieSvg(slices, r) {
    const tot = slices.reduce((s,sl)=>s+sl.value,0);
    if (tot<=0) return `<circle cx="${r}" cy="${r}" r="${r}" fill="#ccc"/>`;
    let paths="", ang=-Math.PI/2;
    slices.forEach(sl => {
      const p=sl.value/tot; if(p<=0)return;
      const sw=p*2*Math.PI, ea=ang+sw;
      const x1=r+r*Math.cos(ang), y1=r+r*Math.sin(ang);
      const x2=r+r*Math.cos(ea),  y2=r+r*Math.sin(ea);
      const la=sw>Math.PI?1:0;
      if(p>=0.9999) paths+=`<circle cx="${r}" cy="${r}" r="${r}" fill="${sl.color}" opacity=".85"/>`;
      else paths+=`<path d="M${r},${r} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${la},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="${sl.color}" opacity=".85"/>`;
      ang=ea;
    });
    return `<svg width="${r*2}" height="${r*2}" viewBox="0 0 ${r*2} ${r*2}" xmlns="http://www.w3.org/2000/svg">${paths}<circle cx="${r}" cy="${r}" r="${r}" fill="none" stroke="rgba(255,255,255,.8)" stroke-width="1.5"/></svg>`;
  }

  function renderPieBubbles() {
    const d = ds();
    allLayers.forEach(({feature, layer}) => {
      const name = getStateName(feature);
      const rec = demogData()[name]?.["2022"];
      if (!rec) return;
      const val = rec[d.bubbleField];
      if (typeof val !== "number") return;
      const center = stateCenters[name]; if (!center) return;
      const norm = Math.max(0, Math.min(1, (val-(d.bubbleMin||0))/((d.bubbleMax||100)-(d.bubbleMin||0))));
      const r = Math.round(6 + norm*(40-6));
      const slices = [{value:rec.male||0,color:"#4292c6"},{value:rec.female||0,color:"#e05a8a"}];
      const mkIcon = (rr, shadow) => L.divIcon({ className:"", iconSize:[rr*2,rr*2], iconAnchor:[rr,rr],
        html:`<div style="width:${rr*2}px;height:${rr*2}px;border-radius:50%;overflow:hidden;box-shadow:${shadow};">${buildPieSvg(slices,rr)}</div>`});
      const marker = L.marker(center.center, {icon:mkIcon(r,"0 2px 10px rgba(0,0,0,.25)"), interactive:false, keyboard:false});
      marker.addTo(getMapByKey(center.mapKey));
      bubbleMarkers.push({marker, mapKey:center.mapKey});
      layer.on("mouseover.overlay-hover", ()=>{marker.setIcon(mkIcon(Math.round(r*2.2),"0 6px 22px rgba(0,0,0,.5)")); marker.setZIndexOffset(1000);});
      layer.on("mouseout.overlay-hover",  ()=>{marker.setIcon(mkIcon(r,"0 2px 10px rgba(0,0,0,.25)")); marker.setZIndexOffset(0);});
    });
  }

  function renderBarOverlay() {
    const d = ds();
    const groups = d.barGroups;
    const bW=5, maxH=46, gap=3;
    const totW = groups.length*(bW+gap)-gap;

    function getBarData(name) {
      if (activeDataset === "economy") {
        const econ = econData()[name]; if (!econ) return null;
        const obj = {};
        groups.forEach(g => {
          const sec = Object.values(econ.sectors||{}).find(s=>s.label===g.key);
          obj[g.key] = sec ? (sec.employees||0) : 0;
        });
        const tot = Object.values(obj).reduce((s,v)=>s+v,0);
        if (tot>0) groups.forEach(g => obj[g.key]=(obj[g.key]/tot)*100);
        return obj;
      }
      return demogData()[name]?.["2022"];
    }

    function mkBarIcon(data, scale) {
      const w=Math.round(totW*scale), mH=Math.round(maxH*scale);
      const bw=Math.round(bW*scale), gp=Math.round(gap*scale);
      const bars=groups.map((g,i)=>{
        const v=data[g.key]||0, h=Math.max(2,Math.round((v/100)*mH));
        return `<rect x="${i*(bw+gp)}" y="${mH-h}" width="${bw}" height="${h}" fill="${g.color}" opacity=".88" rx="1"/>`;
      }).join("");
      const shadow = scale>1 ? "0 4px 16px rgba(0,0,0,.5)" : "0 2px 8px rgba(0,0,0,.3)";
      return L.divIcon({ className:"", iconSize:[w,mH], iconAnchor:[Math.round(w/2),mH],
        html:`<div style="width:${w}px;filter:drop-shadow(${shadow});"><svg width="${w}" height="${mH}" viewBox="0 0 ${w} ${mH}" xmlns="http://www.w3.org/2000/svg">${bars}</svg></div>`});
    }

    allLayers.forEach(({feature, layer}) => {
      const name = getStateName(feature);
      const data = getBarData(name); if (!data) return;
      const center = stateCenters[name]; if (!center) return;
      const marker = L.marker(center.center, {icon:mkBarIcon(data,1.2), interactive:false, keyboard:false, zIndexOffset:0});
      marker.addTo(getMapByKey(center.mapKey));
      bubbleMarkers.push({marker, mapKey:center.mapKey});
      layer.on("mouseover.overlay-hover", ()=>{marker.setIcon(mkBarIcon(data,3.8)); marker.setZIndexOffset(1000);});
      layer.on("mouseout.overlay-hover",  ()=>{marker.setIcon(mkBarIcon(data,1.2)); marker.setZIndexOffset(0);});
    });
  }

  function renderOverlays() {
    clearOverlays();
    const type = ds().overlayType;
    if (type === "pie") renderPieBubbles();
    if (type === "bar") renderBarOverlay();
    // re-attach hover for choropleth-only datasets
    if (type === "none") {
      allLayers.forEach(({feature,layer}) => {
        layer.off(".overlay-hover");
        layer.on("mouseover.overlay-hover", ()=>layer.setStyle(hoverStyle(feature)));
        layer.on("mouseout.overlay-hover",  ()=>layer.setStyle(stateStyle(feature)));
      });
    }
  }

  // ── Legends ──
  let econLegendEl = null;
  let raceLegendEl = null;

  function updateMapLegends(key) {
    if (econLegendEl) { econLegendEl.remove(); econLegendEl = null; }
    if (raceLegendEl) { raceLegendEl.remove(); raceLegendEl = null; }

    if (key === "economy") {
      const colors = DATASETS.economy.SECTOR_CHORO_COLORS;
      const div = document.createElement("div");
      div.className = "econ-legend";
      div.innerHTML = `<div class="econ-legend-title">Dominant sector by employment</div>` +
        Object.entries(colors).map(([label, color]) =>
          `<div class="econ-legend-row"><span class="econ-swatch" style="background:${color}"></span>${label}</div>`
        ).join("") +
        `<div class="econ-legend-note">Hover any state for full breakdown</div>`;
      document.querySelector(".map-container").appendChild(div);
      econLegendEl = div;
      return;
    }

    if (key === "race") {
      const groups = DATASETS.race.barGroups || [];
      const div = document.createElement("div");
      div.className = "race-legend";
      div.innerHTML = `<div class="race-legend-title">Race bar colors</div>` +
        groups.map((group) =>
          `<div class="race-legend-row"><span class="race-swatch" style="background:${group.color}"></span>${group.label}</div>`
        ).join("") +
        `<div class="race-legend-note">Bar height shows each share within a state</div>`;
      document.querySelector(".map-container").appendChild(div);
      raceLegendEl = div;
    }
  }

  // ── Dataset switching ──
  function switchDataset(key) {
    activeDataset = key;
    // Update tab UI
    document.querySelectorAll(".ds-tab").forEach(b => b.classList.toggle("active", b.dataset.key===key));
    // Show/hide dataset legends
    updateMapLegends(key);
    // Update footer desc
    document.getElementById("map-footer").textContent = ds().desc();
    repaint();
    refreshTooltips();
    renderOverlays();
  }

  // ── Build dataset tabs ──
  function buildTabs() {
    const wrap = document.getElementById("dataset-tabs");
    wrap.innerHTML = Object.entries(DATASETS).map(([key,d]) => {
      const tabTitle = escAttr((d.desc && d.desc()) || d.label);
      return `<button type="button" class="ds-tab${key===activeDataset?" active":""}" data-key="${key}" title="${tabTitle}">${d.label}</button>`;
    }).join("");
    wrap.querySelectorAll(".ds-tab").forEach(b => b.addEventListener("click", ()=>switchDataset(b.dataset.key)));
  }

  // ── Highlight state on map (quiz result) ──
  function highlightState(name) {
    highlightedState = name;
    repaint();
    // Pan to state
    const c = stateCenters[name];
    if (c && c.mapKey === "main") mainMap.flyTo(c.center, 5, {duration:1.2});
  }

  function clearHighlight() {
    highlightedState = null;
    repaint();
  }

  // ── Load GeoJSON ──
  fetch("us-states.json")
    .then(r => r.json())
    .then(data => {
      const isAK = f => f?.properties?.name==="Alaska"  || f?.id==="02";
      const isHI = f => f?.properties?.name==="Hawaii"  || f?.id==="15";

      const lower48 = { type:"FeatureCollection", features: data.features.filter(f=>!isAK(f)&&!isHI(f)) };
      const alaska  = { type:"FeatureCollection", features: data.features.filter(isAK) };
      const hawaii  = { type:"FeatureCollection", features: data.features.filter(isHI) };

      const lowerLayer = L.geoJSON(lower48, {style:stateStyle, onEachFeature:attachInteractions}).addTo(mainMap);
      cacheStateCenters(lowerLayer, "main");
      addStateLabels(lowerLayer, mainMap);

      const akLayer = L.geoJSON(alaska, {style:stateStyle, onEachFeature:attachInteractions}).addTo(akMap);
      cacheStateCenters(akLayer, "ak");
      addStateLabels(akLayer, akMap);
      if (akLayer.getBounds().isValid()) akMap.fitBounds(akLayer.getBounds(), {padding:[8,8]});

      const hiLayer = L.geoJSON(hawaii, {style:stateStyle, onEachFeature:attachInteractions}).addTo(hiMap);
      cacheStateCenters(hiLayer, "hi");
      addStateLabels(hiLayer, hiMap);
      if (hiLayer.getBounds().isValid()) hiMap.fitBounds(hiLayer.getBounds(), {padding:[8,8]});

      // Wait for flexbox to fully paint, then tell Leaflet the real container size
      function fixMapSizes() {
        const priorView = hasAutoCenteredMainMap ? mainMap.getCenter() : null;
        const priorZoom = hasAutoCenteredMainMap ? mainMap.getZoom() : null;
        mainMap.invalidateSize({ animate: false });
        akMap.invalidateSize({ animate: false });
        hiMap.invalidateSize({ animate: false });
        if (!hasAutoCenteredMainMap && lowerLayer.getBounds().isValid()) {
          mainMap.fitBounds(lowerLayer.getBounds(), { padding: [24, 24], animate: false, maxZoom: 5 });
          mainMap.setView([38.0, -98.6], 5, { animate: false });
          hasAutoCenteredMainMap = true;
        } else if (priorView && Number.isFinite(priorZoom)) {
          mainMap.setView(priorView, priorZoom, { animate: false });
        }
        mainMap.setMaxBounds([[15,-170],[72,-50]]);
        if (akLayer.getBounds().isValid()) akMap.fitBounds(akLayer.getBounds(), { padding:[8,8], animate:false });
        if (hiLayer.getBounds().isValid()) hiMap.fitBounds(hiLayer.getBounds(), { padding:[8,8], animate:false });
      }
      // Three-pass: rAF + 0ms + 300ms ensures flexbox, fonts, and layout all settle
      requestAnimationFrame(() => { fixMapSizes(); setTimeout(fixMapSizes, 300); });

      // Collect all layers
      [lowerLayer, akLayer, hiLayer].forEach(gl =>
        gl.eachLayer(l => { if (l.feature) allLayers.push({feature:l.feature, layer:l}); })
      );

      buildTabs();
      document.getElementById("map-footer").textContent = ds().desc();
      setupAvatarControls();
      restoreAvatarsFromStorage();
      startRemoteAvatarSync();
    })
    .catch(err => console.error("GeoJSON load error:", err));


  // ══════════════════════════════════════════════════════════════════
  // AVATAR SYSTEM (from partner)
  // ══════════════════════════════════════════════════════════════════
  const AVATAR_IMAGE_SRC_BY_KEY = {
    default: "images/avatar.png",
    wahine:  "images/Wahine.png"
  };
  const AVATAR_STORAGE_KEY = "state-avatar-history-v1";
  const REMOTE_AVATAR_REFRESH_MS = 30000;
  const AVATAR_SLOT_SPACING = 18;
  const avatarMarkers = [];
  const knownAvatarIds = new Set();
  let avatarsVisible = true;
  let remoteAvatarPollTimer = null;

  function getInitials(name) {
    return String(name || "Traveler").trim().split(/\s+/).filter(Boolean)
      .slice(0, 2).map(function(p) { return p[0].toUpperCase(); }).join("") || "T";
  }

  function getAvatarOffsetForState(stateName) {
    const idx = avatarMarkers.filter(function(i) { return i.stateName === stateName; }).length;
    if (idx === 0) return 0;
    const step = Math.ceil(idx / 2);
    const dir = idx % 2 === 1 ? -1 : 1;
    return dir * step * AVATAR_SLOT_SPACING;
  }

  function saveAvatarsToStorage() {
    try {
      localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(
        avatarMarkers.map(function(i) {
          if (i.origin === "remote") return null;
          return {
            avatarId: i.avatarId || "",
            personName: i.personName,
            stateName: i.stateName,
            avatarKey: i.avatarKey || "default"
          };
        }).filter(Boolean)
      ));
    } catch(_) {}
  }

  function readAvatarsFromStorage() {
    try {
      const raw = localStorage.getItem(AVATAR_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function(i) { return i && i.personName && i.stateName; })
        .map(function(i) { return Object.assign({ avatarId: "", avatarKey: "default" }, i); });
    } catch(_) { return []; }
  }

  function setAvatarVisibility(visible) {
    avatarsVisible = visible;
    avatarMarkers.forEach(function(item) {
      const m = getMapByKey(item.mapKey);
      if (visible) { if (!m.hasLayer(item.marker)) item.marker.addTo(m); }
      else if (m.hasLayer(item.marker)) m.removeLayer(item.marker);
    });
    const btn = document.getElementById("avatar-toggle-btn");
    if (btn) btn.textContent = visible ? "Hide Avatars" : "Show Avatars";
  }

  function clearAllAvatars() {
    avatarMarkers.forEach(function(item) {
      const m = getMapByKey(item.mapKey);
      if (m.hasLayer(item.marker)) m.removeLayer(item.marker);
    });
    avatarMarkers.length = 0;
    knownAvatarIds.clear();
    try { localStorage.removeItem(AVATAR_STORAGE_KEY); } catch(_) {}
    syncRemoteAvatars();
  }

  function setupAvatarControls() {
    const toggleBtn = document.getElementById("avatar-toggle-btn");
    if (toggleBtn) toggleBtn.addEventListener("click", function() { setAvatarVisibility(!avatarsVisible); });
  }

  function submitAvatarMatchRemotely(record) {
    if (!record) return;
    submitAppResponse("avatar_match", record).catch(function(err) {
      console.error("Avatar match submission failed:", err);
    });
  }

  function fetchRemoteAvatars() {
    return loadAvatarMatches(250).then(function(rows) {
      return rows.map(function(row) {
        return {
          avatarId: String(row.match_id || ""),
          personName: row.person_name || "",
          stateName: row.state_name || "",
          avatarKey: row.avatar_key || "default",
          source: row.source || "supabase"
        };
      });
    });
  }

  function syncRemoteAvatars() {
    fetchRemoteAvatars()
      .then(function(rows) {
        rows.forEach(function(row) {
          if (!row.avatarId || knownAvatarIds.has(row.avatarId)) return;
          renderStateAvatar(row.personName, row.stateName, {
            persist: false,
            avatarKey: row.avatarKey,
            recordId: row.avatarId,
            source: row.source,
            origin: "remote"
          });
        });
      })
      .catch(function(err) {
        console.error("Avatar sync failed:", err);
      });
  }

  function startRemoteAvatarSync() {
    syncRemoteAvatars();
    if (remoteAvatarPollTimer) window.clearInterval(remoteAvatarPollTimer);
    remoteAvatarPollTimer = window.setInterval(syncRemoteAvatars, REMOTE_AVATAR_REFRESH_MS);
  }

  function renderStateAvatar(personName, stateName, options) {
    options = options || {};
    const target = stateCenters[stateName];
    if (!target) return false;
    const avatarId = String(options.recordId || Date.now());
    if (avatarId && knownAvatarIds.has(avatarId)) return false;
    const record = {
      id: avatarId,
      at: new Date().toISOString(),
      personName: String(personName || "Traveler"),
      stateName: stateName,
      avatarKey: options.avatarKey === "wahine" ? "wahine" : "default",
      source: options.source || "manual",
      mapKey: target.mapKey
    };
    const map = getMapByKey(target.mapKey);
    const rawName = String(personName || "Traveler");
    const initials = getInitials(personName);
    const xOffset  = getAvatarOffsetForState(stateName);
    const avatarKey = options.avatarKey === "wahine" ? "wahine" : "default";
    const avatarSrc = AVATAR_IMAGE_SRC_BY_KEY[avatarKey] || AVATAR_IMAGE_SRC_BY_KEY.default;

    const icon = L.divIcon({
      className: "state-avatar-wrap",
      html: '<div class="state-avatar-slot" style="transform:translateX(' + xOffset + 'px)" aria-hidden="true">'
          + '<div class="state-avatar-person">'
          + '<img class="state-avatar-image" src="' + avatarSrc + '" alt="Avatar" onerror="this.onerror=null;this.src=&quot;images/avatar.png&quot;;" />'
          + '<div class="person-label">' + escHtml(initials) + '</div>'
          + '</div></div>',
      iconSize: [220, 86],
      iconAnchor: [110, 78]
    });

    const marker = L.marker(target.center, { icon: icon, keyboard: false });
    if (avatarsVisible) marker.addTo(map);
    marker.bindTooltip(escHtml(rawName) + " matched with " + escHtml(stateName), {
      direction: "top", offset: [0, -14], className: "state-tooltip"
    });
    knownAvatarIds.add(avatarId);
    avatarMarkers.push({
      marker: marker,
      avatarId: avatarId,
      mapKey: target.mapKey,
      personName: rawName,
      stateName: stateName,
      avatarKey: avatarKey,
      origin: options.origin === "remote" ? "remote" : "local"
    });
    if (options.persist !== false) {
      saveAvatarsToStorage();
      submitAvatarMatchRemotely(record);
    }
    return true;
  }

  function restoreAvatarsFromStorage() {
    readAvatarsFromStorage().forEach(function(entry) {
      renderStateAvatar(entry.personName, entry.stateName, {
        persist: false,
        avatarKey: entry.avatarKey,
        recordId: entry.avatarId || "",
        source: "local_storage"
      });
    });
  }

  window.renderStateAvatar = renderStateAvatar;
  window.clearAllAvatars   = clearAllAvatars;
  window.setAvatarVisibility = setAvatarVisibility;

  window.addEventListener("resize", () => {
    mainMap.invalidateSize();
    akMap.invalidateSize();
    hiMap.invalidateSize();
  });

  // ══════════════════════════════════════════════════════════════════
  // LEFT PANEL COLLAPSE / EXPAND
  // ══════════════════════════════════════════════════════════════════
  (function() {
    const toggle = document.getElementById("panel-toggle");
    const panel = document.getElementById("left-panel");
    if (!toggle || !panel) return;

    const setCollapsed = (collapsed) => {
      const next = !!collapsed;
      document.body.classList.toggle("left-panel-collapsed", next);
      toggle.setAttribute("aria-expanded", String(!next));
      toggle.title = next ? "Show left panel" : "Collapse left panel";
      toggle.textContent = next ? "▶" : "◀";

      if (window.mainMap instanceof Object && typeof window.mainMap.invalidateSize === "function") {
        requestAnimationFrame(() => {
          mainMap.invalidateSize({ animate: false });
          akMap.invalidateSize({ animate: false });
          hiMap.invalidateSize({ animate: false });
        });
      }
    };

    // initialize from any persisted preference
    const saved = localStorage.getItem("left-panel-collapsed");
    const initial = saved === "1";
    setCollapsed(initial);

    toggle.addEventListener("click", () => {
      const isCollapsed = document.body.classList.contains("left-panel-collapsed");
      const next = !isCollapsed;
      localStorage.setItem("left-panel-collapsed", next ? "1" : "0");
      setCollapsed(next);
    });
  })();


  // ══════════════════════════════════════════════════════════════════
  // PANEL MODE SWITCHER
  // ══════════════════════════════════════════════════════════════════
  (function() {
    const tabStudy = document.getElementById("tab-study");
    const tabMatch = document.getElementById("tab-match");
    const viewStudy = document.getElementById("panel-study");
    const viewMatch = document.getElementById("panel-match");

    tabStudy.addEventListener("click", () => {
      tabStudy.classList.add("active"); tabMatch.classList.remove("active");
      viewStudy.style.display = ""; viewMatch.style.display = "none";
      clearHighlight();
    });
    tabMatch.addEventListener("click", () => {
      tabMatch.classList.add("active"); tabStudy.classList.remove("active");
      viewMatch.style.display = ""; viewStudy.style.display = "none";
    });
  })();
  window.mainMap = mainMap;
  window.akMap = akMap;
  window.hiMap = hiMap;
  window.switchDataset = switchDataset;
  window.highlightState = highlightState;
  window.clearHighlight = clearHighlight;
  window.renderStateAvatar = renderStateAvatar;
  window.clearAllAvatars = clearAllAvatars;
  window.setAvatarVisibility = setAvatarVisibility;
})();
