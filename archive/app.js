// app.js - Client-Side Extrapolation Dashboard Engine

let currentData = null;
let currentSortKey = 'name';
let currentSortDir = 'asc';
let currentViewMode = 'current'; // 'current' or 'extrapolated'
let currentTab = 'peru'; // 'peru' or 'extranjero'
let searchQuery = '';

// Chart.js references
let nationalChartInstance = null;
let modalChartInstance = null;

// DOM Elements
const elements = {
  lastUpdate: 'last-update',
  nationalChart: 'nationalChart',
  centerActsPct: 'center-acts-pct',
  modeDisplayTitle: 'mode-display-title',
  natMarginVal: 'nat-margin-val',

  natKeikoPct: 'nat-keiko-pct',
  natKeikoVotes: 'nat-keiko-votes',
  natRobertoPct: 'nat-roberto-pct',
  natRobertoVotes: 'nat-roberto-votes',

  barKeiko: 'bar-keiko',
  barRoberto: 'bar-roberto',

  natLeaderName: 'nat-leader-name',
  natMarginPct: 'nat-margin-pct',

  lblActsWidget: 'lbl-acts-widget',
  valActsWidget: 'val-acts-widget',
  lblVotesWidget: 'lbl-votes-widget',
  valVotesWidget: 'val-votes-widget',

  regionsGrid: 'regions-grid',
  searchInput: 'search-input',
  sortSelect: 'sort-select',
  sortDirBtn: 'sort-dir-btn',
  sortIcon: 'sort-icon',

  btnViewCurrent: 'btn-view-current',
  btnViewExtrap: 'btn-view-extrapolated',

  tabPeru: 'tab-peru',
  tabExtranjero: 'tab-extranjero',
  nationalSummaryTitle: 'national-summary-title',

  modalOverlay: 'modal-overlay',
  modalClose: 'modal-close',
  modalTitle: 'modal-title',
  modalUbigeo: 'modal-ubigeo',
  mActsVal: 'm-acts-val',
  mValidVal: 'm-valid-val',
  mKeikoPct: 'm-keiko-pct',
  mKeikoVotes: 'm-keiko-votes',
  mRobertoPct: 'm-roberto-pct',
  mRobertoVotes: 'm-roberto-votes',
  modalChart: 'modalChart'
};

// Initialize Dashboard
window.addEventListener('DOMContentLoaded', () => {
  initDashboard();
  setupEventListeners();
});

async function initDashboard() {
  renderLoadingState();

  // Try fetching dynamic local JSON
  const fetched = await fetchLocalData();
  if (fetched) {
    currentData = fetched;
    console.log("Loaded dynamic data.json successfully.");
  } else if (typeof ELECTION_DATA !== 'undefined') {
    currentData = JSON.parse(JSON.stringify(ELECTION_DATA));
    console.log("Loaded static fallback ELECTION_DATA successfully.");
  } else {
    renderErrorMessage();
    return;
  }

  processData();
  renderDashboard();
}

async function fetchLocalData() {
  try {
    const response = await fetch('data.json', { cache: 'no-store' });
    if (!response.ok) throw new Error("Local data.json fetch failed");
    return await response.json();
  } catch (err) {
    console.warn("Fallback to static data due to error:", err);
    return null;
  }
}

function computeMetricsForList(list) {
  let currentKeiko = 0;
  let currentRoberto = 0;
  let currentValid = 0;

  let extrapKeiko = 0;
  let extrapRoberto = 0;
  let extrapValid = 0;

  let totalActs = 0;
  let contabilizadas = 0;

  const processed = list.map(r => {
    const kVotes = r.keiko_votos || 0;
    const rVotes = r.roberto_votos || 0;
    const valid = kVotes + rVotes;

    const kProj = r.keiko_projected || 0;
    const rProj = r.roberto_projected || 0;
    const validProj = kProj + rProj;

    currentKeiko += kVotes;
    currentRoberto += rVotes;
    currentValid += valid;

    extrapKeiko += kProj;
    extrapRoberto += rProj;
    extrapValid += validProj;

    totalActs += r.totalActas || 0;
    contabilizadas += r.contabilizadas || 0;

    return {
      ...r,
      calc: {
        // Current values
        kPct: valid > 0 ? (kVotes / valid * 100) : 50.0,
        rPct: valid > 0 ? (rVotes / valid * 100) : 50.0,
        valid: valid,

        // Extrapolated values
        kPctExtrap: validProj > 0 ? (kProj / validProj * 100) : 50.0,
        rPctExtrap: validProj > 0 ? (rProj / validProj * 100) : 50.0,
        validExtrap: validProj,

        winner: kVotes > rVotes ? 'keiko' : (rVotes > kVotes ? 'roberto' : 'tie')
      }
    };
  });

  const actsPct = totalActs > 0 ? (contabilizadas / totalActs * 100) : 0.0;

  const national = {
    actsPct: actsPct,
    totalActs: totalActs,
    contabilizadas: contabilizadas,
    current: {
      keiko: currentKeiko,
      keikoPct: currentValid > 0 ? (currentKeiko / currentValid * 100) : 50.0,
      roberto: currentRoberto,
      robertoPct: currentValid > 0 ? (currentRoberto / currentValid * 100) : 50.0,
      valid: currentValid,
      margin: Math.abs(currentKeiko - currentRoberto),
      marginPct: currentValid > 0 ? Math.abs((currentKeiko / currentValid * 100) - (currentRoberto / currentValid * 100)) : 0.0,
      leader: currentKeiko > currentRoberto ? 'Keiko Fujimori' : 'Roberto Sánchez'
    },
    extrapolated: {
      keiko: extrapKeiko,
      keikoPct: extrapValid > 0 ? (extrapKeiko / extrapValid * 100) : 50.0,
      roberto: extrapRoberto,
      robertoPct: extrapValid > 0 ? (extrapRoberto / extrapValid * 100) : 50.0,
      valid: extrapValid,
      margin: Math.abs(extrapKeiko - extrapRoberto),
      marginPct: extrapValid > 0 ? Math.abs((extrapKeiko / extrapValid * 100) - (extrapRoberto / extrapValid * 100)) : 0.0,
      leader: extrapKeiko > extrapRoberto ? 'Keiko Fujimori' : 'Roberto Sánchez'
    }
  };

  return { processed, national };
}

// Math Process & Consolidation logic
function processData() {
  if (!currentData) return;

  // 1. Process Peru (Nacional)
  const peRegiones = currentData.regiones || [];
  const peRes = computeMetricsForList(peRegiones);
  currentData.regiones = peRes.processed;

  // 2. Process Extranjero (Exterior)
  const exContinentes = currentData.extranjero || [];
  const exRes = computeMetricsForList(exContinentes);
  currentData.extranjero = exRes.processed;

  // 3. Consolidate national references
  currentData.national = {
    peru: peRes.national,
    extranjero: exRes.national
  };
}

// Render Dashboard
function renderDashboard() {
  renderNationalSummary();
  renderRegionsGrid();
  initNationalChart();

  // Render time display
  const lastUpdateEl = document.getElementById(elements.lastUpdate);
  if (lastUpdateEl && currentData.latest && currentData.latest.fechaActualizacion) {
    const date = new Date(currentData.latest.fechaActualizacion);
    lastUpdateEl.innerText = date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } else if (lastUpdateEl) {
    lastUpdateEl.innerText = new Date().toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }
}

function renderNationalSummary() {
  const nat = currentData.national[currentTab];
  const isExtrap = currentViewMode === 'extrapolated';
  const data = isExtrap ? nat.extrapolated : nat.current;

  // Show or hide extrapolation explanation box
  const infoBox = document.getElementById('extrapolation-info-box');
  if (infoBox) {
    if (isExtrap) {
      infoBox.classList.add('show');
    } else {
      infoBox.classList.remove('show');
    }
  }

  // Section headers
  const summaryTitleEl = document.getElementById(elements.nationalSummaryTitle);
  if (summaryTitleEl) {
    summaryTitleEl.innerHTML = currentTab === 'peru'
      ? `<svg class="title-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> Consolidado Nacional (25 Regiones)`
      : `<svg class="title-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg> Consolidado Extranjero (5 Continentes)`;
  }

  // Center doughnut label
  document.getElementById(elements.centerActsPct).innerText = nat.actsPct.toFixed(3) + '%';

  // Titles and Widgets
  document.getElementById(elements.modeDisplayTitle).innerText = isExtrap
    ? (currentTab === 'peru' ? 'Proyección al 100% de Actas (Perú)' : 'Proyección al 100% de Actas (Extranjero)')
    : (currentTab === 'peru' ? 'Resultados Oficiales ONPE (Perú)' : 'Resultados Oficiales ONPE (Extranjero)');

  document.getElementById(elements.natMarginVal).innerText = data.margin.toLocaleString('es-PE') + ' v.';
  document.getElementById(elements.natKeikoPct).innerText = data.keikoPct.toFixed(3) + '%';
  document.getElementById(elements.natKeikoVotes).innerText = data.keiko.toLocaleString('es-PE') + ' votos';

  document.getElementById(elements.natRobertoPct).innerText = data.robertoPct.toFixed(3) + '%';
  document.getElementById(elements.natRobertoVotes).innerText = data.roberto.toLocaleString('es-PE') + ' votos';

  // Split Progress Bar
  document.getElementById(elements.barKeiko).style.width = data.keikoPct + '%';
  document.getElementById(elements.barRoberto).style.width = data.robertoPct + '%';

  document.getElementById(elements.natLeaderName).innerText = data.leader;
  document.getElementById(elements.natMarginPct).innerText = data.marginPct.toFixed(3) + '%';

  // Bottom Widgets
  document.getElementById(elements.lblActsWidget).innerText = isExtrap ? 'Actas Proyectadas' : 'Actas Contabilizadas';
  document.getElementById(elements.valActsWidget).innerText = isExtrap ? '100.000%' : nat.actsPct.toFixed(3) + '%';

  document.getElementById(elements.lblVotesWidget).innerText = isExtrap ? 'Votos Válidos Proyectados' : 'Votos Válidos Actuales';
  document.getElementById(elements.valVotesWidget).innerText = data.valid.toLocaleString('es-PE');
}

function renderRegionsGrid() {
  const grid = document.getElementById(elements.regionsGrid);
  const isExtrap = currentViewMode === 'extrapolated';

  // Get active list based on selected tab
  const activeList = currentTab === 'peru' ? currentData.regiones : currentData.extranjero;

  // 1. Filter
  let filtered = activeList.filter(r =>
    r.nombre.toLowerCase().includes(searchQuery) ||
    r.ubigeo.includes(searchQuery)
  );

  // 2. Sort
  filtered.sort((a, b) => {
    let valA, valB;
    switch (currentSortKey) {
      case 'acts':
        valA = a.actasContabilizadas;
        valB = b.actasContabilizadas;
        break;
      case 'keiko':
        valA = isExtrap ? a.calc.kPctExtrap : a.calc.kPct;
        valB = isExtrap ? b.calc.kPctExtrap : b.calc.kPct;
        break;
      case 'roberto':
        valA = isExtrap ? a.calc.rPctExtrap : a.calc.rPct;
        valB = isExtrap ? b.calc.rPctExtrap : b.calc.rPct;
        break;
      case 'margin':
        valA = isExtrap ? Math.abs(a.calc.kPctExtrap - a.calc.rPctExtrap) : Math.abs(a.calc.kPct - a.calc.rPct);
        valB = isExtrap ? Math.abs(b.calc.kPctExtrap - b.calc.rPctExtrap) : Math.abs(b.calc.kPct - b.calc.rPct);
        break;
      case 'name':
      default:
        const comp = a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
        return currentSortDir === 'asc' ? comp : -comp;
    }

    if (valA < valB) return currentSortDir === 'asc' ? -1 : 1;
    if (valA > valB) return currentSortDir === 'asc' ? 1 : -1;
    return 0;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="glass-card" style="grid-column: 1 / -1; padding: 48px; text-align: center; color: var(--text-secondary);">
        No se encontraron elementos con el término de búsqueda "${searchQuery}".
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(r => {
    const kPct = isExtrap ? r.calc.kPctExtrap : r.calc.kPct;
    const rPct = isExtrap ? r.calc.rPctExtrap : r.calc.rPct;
    const isKeikoLeading = kPct > rPct;
    const margin = Math.abs(kPct - rPct);

    return `
      <div class="glass-card region-card" onclick="openModal('${r.ubigeo}')">
        <div class="card-hdr">
          <h3 class="region-name">${r.nombre}</h3>
          <span class="acts-badge">${r.actasContabilizadas.toFixed(3)}% actas</span>
        </div>
        
        <div class="region-cand-line ${!isKeikoLeading ? 'winner roberto-lead' : ''}">
          <span>Roberto Sánchez</span>
          <span class="mono-font">${rPct.toFixed(3)}%</span>
        </div>
        
        <div class="region-cand-line ${isKeikoLeading ? 'winner keiko-lead' : ''}">
          <span>Keiko Fujimori</span>
          <span class="mono-font">${kPct.toFixed(3)}%</span>
        </div>
        
        <div class="progress-bar-wrapper" style="margin-top: 8px;">
          <div class="split-bar" style="height: 6px;">
            <div class="bar-fill green-bg" style="width: ${rPct}%"></div>
            <div class="bar-fill orange-bg" style="width: ${kPct}%"></div>
          </div>
        </div>
        
        <div class="card-ftr">
          <span class="adv-badge">Ventaja: <span class="${isKeikoLeading ? 'orange-text' : 'green-text'}">${margin.toFixed(3)}%</span></span>
          <span>${isExtrap ? 'Proyectado' : `Faltan: ${(100 - r.actasContabilizadas).toFixed(3)}%`}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Chart 1: National doughnut chart
function initNationalChart() {
  const ctx = document.getElementById(elements.nationalChart).getContext('2d');
  const nat = currentData.national[currentTab];
  const isExtrap = currentViewMode === 'extrapolated';
  const data = isExtrap ? nat.extrapolated : nat.current;

  if (nationalChartInstance) {
    nationalChartInstance.destroy();
  }

  nationalChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Keiko Fujimori', 'Roberto Sánchez'],
      datasets: [{
        data: [data.keikoPct, data.robertoPct],
        backgroundColor: ['#ff7c44', '#10b981'],
        borderWidth: 2,
        borderColor: '#060913',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '76%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0c1222',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          padding: 12,
          titleFont: { family: 'Outfit', weight: '700' },
          bodyFont: { family: 'Inter' },
          callbacks: {
            label: function (context) {
              const val = context.raw.toFixed(3);
              const label = context.label;
              const votes = context.dataIndex === 0 ? data.keiko : data.roberto;
              return ` ${label}: ${val}% (${votes.toLocaleString('es-PE')} v.)`;
            }
          }
        }
      }
    }
  });
}

function updateNationalChart() {
  if (!nationalChartInstance) return;
  const nat = currentData.national[currentTab];
  const isExtrap = currentViewMode === 'extrapolated';
  const data = isExtrap ? nat.extrapolated : nat.current;

  nationalChartInstance.data.datasets[0].data = [data.keikoPct, data.robertoPct];
  nationalChartInstance.update();
}

// Modal logic
function openModal(ubigeo) {
  const list = currentTab === 'peru' ? currentData.regiones : currentData.extranjero;
  const r = list.find(reg => reg.ubigeo === ubigeo);
  if (!r) return;

  const isExtrap = currentViewMode === 'extrapolated';
  const kPct = isExtrap ? r.calc.kPctExtrap : r.calc.kPct;
  const rPct = isExtrap ? r.calc.rPctExtrap : r.calc.rPct;
  const kVotes = isExtrap ? r.keiko_projected : r.keiko_votos;
  const rVotes = isExtrap ? r.roberto_projected : r.roberto_votos;
  const valid = isExtrap ? r.calc.validExtrap : r.calc.valid;

  document.getElementById(elements.modalTitle).innerText = r.nombre;
  document.getElementById(elements.modalUbigeo).innerText = currentTab === 'peru' ? `Ubigeo: ${r.ubigeo}` : `Código: ${r.ubigeo}`;

  document.getElementById(elements.mActsVal).innerText = r.actasContabilizadas.toFixed(3) + '%';
  document.getElementById(elements.mValidVal).innerText = valid.toLocaleString('es-PE');

  document.getElementById(elements.mKeikoPct).innerText = kPct.toFixed(3) + '%';
  document.getElementById(elements.mKeikoVotes).innerText = kVotes.toLocaleString('es-PE') + ' votos';

  document.getElementById(elements.mRobertoPct).innerText = rPct.toFixed(3) + '%';
  document.getElementById(elements.mRobertoVotes).innerText = rVotes.toLocaleString('es-PE') + ' votos';

  // Show Modal
  const overlay = document.getElementById(elements.modalOverlay);
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Init modal series line chart
  initModalChart(r);
}

function closeModal() {
  const overlay = document.getElementById(elements.modalOverlay);
  overlay.classList.remove('active');
  document.body.style.overflow = '';

  if (modalChartInstance) {
    modalChartInstance.destroy();
    modalChartInstance = null;
  }
}

// Chart 3: Regional historical timeline graph inside the modal
function initModalChart(region) {
  const ctx = document.getElementById(elements.modalChart).getContext('2d');
  const serie = region.serie || [];

  if (modalChartInstance) {
    modalChartInstance.destroy();
    modalChartInstance = null;
  }

  if (serie.length === 0) {
    ctx.clearRect(0, 0, 300, 200);
    ctx.font = '14px Inter';
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center';
    ctx.fillText('No hay datos históricos grabados todavía.', 150, 100);
    return;
  }

  const labels = serie.map(s => s.t);
  const robertoData = serie.map(s => s.a);
  const keikoData = serie.map(s => s.b);

  modalChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Keiko Fujimori',
          data: keikoData,
          borderColor: '#ff7c44',
          backgroundColor: 'rgba(255, 124, 68, 0.03)',
          borderWidth: 3,
          tension: 0.25,
          pointRadius: 4,
          pointBackgroundColor: '#ff7c44',
          fill: true
        },
        {
          label: 'Roberto Sánchez',
          data: robertoData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.03)',
          borderWidth: 3,
          tension: 0.25,
          pointRadius: 4,
          pointBackgroundColor: '#10b981',
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.02)' },
          ticks: { color: '#9ca3af', font: { family: 'Inter', size: 9 } }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.02)' },
          ticks: {
            color: '#9ca3af',
            font: { family: 'Inter' },
            callback: function (val) { return val.toFixed(3) + '%'; }
          }
        }
      },
      plugins: {
        legend: {
          labels: { color: '#f3f4f6', font: { family: 'Outfit', weight: '600' } }
        },
        tooltip: {
          backgroundColor: '#0c1222',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          padding: 12,
          titleFont: { family: 'Outfit', weight: '700' },
          bodyFont: { family: 'Inter' },
          callbacks: {
            label: function (context) {
              return ` ${context.dataset.label}: ${context.raw.toFixed(3)}%`;
            }
          }
        }
      }
    }
  });
}

// User Interactions and event listeners
function setupEventListeners() {
  // Tabs Navigation
  document.getElementById(elements.tabPeru).addEventListener('click', () => {
    switchTab('peru');
  });
  document.getElementById(elements.tabExtranjero).addEventListener('click', () => {
    switchTab('extranjero');
  });

  // Search
  document.getElementById(elements.searchInput).addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderRegionsGrid();
  });

  // Sort Category
  document.getElementById(elements.sortSelect).addEventListener('change', (e) => {
    currentSortKey = e.target.value;
    renderRegionsGrid();
  });

  // Sort Direction
  document.getElementById(elements.sortDirBtn).addEventListener('click', () => {
    const sortIcon = document.getElementById(elements.sortIcon);
    if (currentSortDir === 'asc') {
      currentSortDir = 'desc';
      sortIcon.innerHTML = '<path d="m3 8 4-4 4 4"/><path d="M7 4v16"/><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/>';
    } else {
      currentSortDir = 'asc';
      sortIcon.innerHTML = '<path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/>';
    }
    renderRegionsGrid();
  });

  // View mode switches
  document.getElementById(elements.btnViewCurrent).addEventListener('click', () => {
    setViewMode('current');
  });
  document.getElementById(elements.btnViewExtrap).addEventListener('click', () => {
    setViewMode('extrapolated');
  });

  // Close modal click listeners
  document.getElementById(elements.modalClose).addEventListener('click', closeModal);
  document.getElementById(elements.modalOverlay).addEventListener('click', (e) => {
    if (e.target.id === elements.modalOverlay) closeModal();
  });

  // ESC modal close
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

function switchTab(tabName) {
  if (currentTab === tabName) return;
  currentTab = tabName;

  document.getElementById(elements.tabPeru).classList.toggle('active', tabName === 'peru');
  document.getElementById(elements.tabExtranjero).classList.toggle('active', tabName === 'extranjero');

  // Reset search input
  document.getElementById(elements.searchInput).value = '';
  searchQuery = '';

  // Reset view mode to 'current' (official ONPE votes) on tab switch
  currentViewMode = 'current';
  document.getElementById(elements.btnViewCurrent).classList.add('active');
  document.getElementById(elements.btnViewExtrap).classList.remove('active');

  renderNationalSummary();
  renderRegionsGrid();
  initNationalChart();
}

function setViewMode(mode) {
  if (currentViewMode === mode) return;
  currentViewMode = mode;

  document.getElementById(elements.btnViewCurrent).classList.toggle('active', mode === 'current');
  document.getElementById(elements.btnViewExtrap).classList.toggle('active', mode === 'extrapolated');

  renderNationalSummary();
  renderRegionsGrid();
  updateNationalChart();
}

// Skeletons rendering
function renderLoadingState() {
  const grid = document.getElementById(elements.regionsGrid);
  grid.innerHTML = Array(8).fill(0).map(() => `
    <div class="glass-card skeleton-card" style="padding: 20px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 18px;">
        <div class="skeleton-box" style="height: 18px; width: 60%;"></div>
        <div class="skeleton-box" style="height: 16px; width: 25%;"></div>
      </div>
      <div class="skeleton-box" style="height: 12px; width: 85%; margin-bottom: 12px;"></div>
      <div class="skeleton-box" style="height: 12px; width: 75%; margin-bottom: 16px;"></div>
      <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.03); padding-top: 12px;">
        <div class="skeleton-box" style="height: 11px; width: 40%;"></div>
        <div class="skeleton-box" style="height: 11px; width: 30%;"></div>
      </div>
    </div>
  `).join('');
}

function renderErrorMessage() {
  const grid = document.getElementById(elements.regionsGrid);
  grid.innerHTML = `
    <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 64px 24px;">
      <p style="color: var(--color-keiko); font-size: 20px; font-weight: 800; margin-bottom: 12px;">Error de Conexión</p>
      <p style="color: var(--text-secondary); max-width: 460px; margin: 0 auto; line-height: 1.6;">No se pudo conectar a los servidores de datos ni cargar la base de datos estática local. Por favor, asegúrate de estar ejecutando el servidor de desarrollo y actualiza la página.</p>
    </div>
  `;
}
