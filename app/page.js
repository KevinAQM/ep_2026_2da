"use client";

import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

// Math Process & Consolidation logic on client-side
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
        kPct: valid > 0 ? (kVotes / valid * 100) : 50.0,
        rPct: valid > 0 ? (rVotes / valid * 100) : 50.0,
        valid: valid,
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

function processData(raw) {
  if (!raw) return null;
  const peRes = computeMetricsForList(raw.regiones || []);
  const exRes = computeMetricsForList(raw.extranjero || []);
  return {
    ...raw,
    regiones: peRes.processed,
    extranjero: exRes.processed,
    national: {
      peru: peRes.national,
      extranjero: exRes.national
    }
  };
}

export default function Dashboard() {
  const [rawData, setRawData] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // States matching app.js engine
  const [currentTab, setCurrentTab] = useState('peru'); // 'peru' or 'extranjero'
  const [currentViewMode, setCurrentViewMode] = useState('current'); // 'current' or 'extrapolated'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  
  const [modalUbigeo, setModalUbigeo] = useState(null);
  
  // Canvas refs
  const nationalChartRef = useRef(null);
  const nationalChartInstance = useRef(null);
  
  const modalChartRef = useRef(null);
  const modalChartInstance = useRef(null);

  // Fetch data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/api/data', { cache: 'no-store' });
        if (!response.ok) throw new Error("Fetch failed");
        const json = await response.json();
        setRawData(json);
        setProcessedData(processData(json));
        setLoading(false);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setError(true);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Update Doughnut Chart
  useEffect(() => {
    if (!processedData || !nationalChartRef.current) return;
    
    const ctx = nationalChartRef.current.getContext('2d');
    const nat = processedData.national[currentTab];
    const isExtrap = currentViewMode === 'extrapolated';
    const data = isExtrap ? nat.extrapolated : nat.current;
    
    if (nationalChartInstance.current) {
      nationalChartInstance.current.destroy();
    }

    // External HTML tooltip — bypasses canvas completely, fully opaque
    const getOrCreateTooltip = () => {
      let el = document.getElementById('donut-tooltip-el');
      if (!el) {
        el = document.createElement('div');
        el.id = 'donut-tooltip-el';
        document.body.appendChild(el);
      }
      return el;
    };

    const externalTooltipHandler = (context) => {
      const { chart, tooltip } = context;
      const el = getOrCreateTooltip();

      if (tooltip.opacity === 0) {
        el.style.opacity = '0';
        return;
      }

      const dataIdx = tooltip.dataPoints?.[0]?.dataIndex ?? 0;
      const isKeiko = dataIdx === 0;
      const label = isKeiko ? 'Keiko Fujimori' : 'Roberto Sánchez';
      const pct = (isKeiko ? data.keikoPct : data.robertoPct).toFixed(3);
      const votes = (isKeiko ? data.keiko : data.roberto).toLocaleString('es-PE');
      const color = isKeiko ? '#ff7c44' : '#10b981';

      el.innerHTML = `
        <div style="font-family:'Open Sans',sans-serif;font-weight:700;font-size:12px;color:${color};margin-bottom:5px;text-transform:uppercase;letter-spacing:0.03em;">${label}</div>
        <div style="font-family:'Open Sans',sans-serif;font-weight:800;font-size:18px;color:#f9fafb;line-height:1;">${pct}%</div>
        <div style="font-family:'Roboto',sans-serif;font-size:12px;color:#9ca3af;margin-top:4px;">${votes} votos</div>
      `;

      const rect = chart.canvas.getBoundingClientRect();
      el.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 99999;
        opacity: 1;
        background: #080c14;
        border: 1px solid rgba(255,255,255,0.18);
        border-radius: 12px;
        padding: 14px 18px;
        white-space: nowrap;
        box-shadow: 0 12px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04);
        transition: opacity 0.12s ease;
        left: ${rect.left + tooltip.caretX}px;
        top: ${rect.top + tooltip.caretY}px;
        transform: translate(-50%, -115%);
      `;
    };
    
    nationalChartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Keiko Fujimori', 'Roberto Sánchez'],
        datasets: [{
          data: [data.keikoPct, data.robertoPct],
          backgroundColor: ['#ff7c44', '#10b981'],
          borderWidth: 2,
          borderColor: '#030303',
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
            enabled: false,
            external: externalTooltipHandler,
          }
        }
      }
    });
    
    return () => {
      if (nationalChartInstance.current) {
        nationalChartInstance.current.destroy();
        nationalChartInstance.current = null;
      }
      const el = document.getElementById('donut-tooltip-el');
      if (el) el.style.opacity = '0';
    };
  }, [processedData, currentTab, currentViewMode]);

  // Find modal region detailed data
  const selectedRegion = React.useMemo(() => {
    if (!modalUbigeo || !processedData) return null;
    const list = currentTab === 'peru' ? processedData.regiones : processedData.extranjero;
    return list.find(r => r.ubigeo === modalUbigeo) || null;
  }, [modalUbigeo, processedData, currentTab]);

  // Update Modal Chart
  useEffect(() => {
    if (!selectedRegion || !modalChartRef.current) return;
    
    const ctx = modalChartRef.current.getContext('2d');
    const serie = selectedRegion.serie || [];
    
    if (modalChartInstance.current) {
      modalChartInstance.current.destroy();
    }
    
    if (serie.length === 0) {
      ctx.clearRect(0, 0, 300, 200);
      ctx.font = '14px Roboto';
      ctx.fillStyle = '#6b7280';
      ctx.textAlign = 'center';
      ctx.fillText('No hay datos históricos grabados todavía.', 150, 100);
      return;
    }
    
    const labels = serie.map(s => s.t);
    const robertoData = serie.map(s => s.a);
    const keikoData = serie.map(s => s.b);
    
    modalChartInstance.current = new Chart(ctx, {
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
            ticks: { color: '#9ca3af', font: { family: 'Roboto', size: 9 } }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.02)' },
            ticks: {
              color: '#9ca3af',
              font: { family: 'Roboto' },
              callback: function(val) { return val.toFixed(3) + '%'; }
            }
          }
        },
        plugins: {
          legend: {
            labels: { color: '#f3f4f6', font: { family: 'Open Sans', weight: '600' } }
          },
          tooltip: {
            backgroundColor: '#0c1222',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            padding: 12,
            titleFont: { family: 'Open Sans', weight: '700' },
            bodyFont: { family: 'Roboto' },
            callbacks: {
              label: function(context) {
                return ` ${context.dataset.label}: ${context.raw.toFixed(3)}%`;
              }
            }
          }
        }
      }
    });
    
    return () => {
      if (modalChartInstance.current) {
        modalChartInstance.current.destroy();
        modalChartInstance.current = null;
      }
    };
  }, [selectedRegion]);

  // Tab switching — preserves current view mode selection
  const handleTabChange = (tab) => {
    if (currentTab === tab) return;
    setCurrentTab(tab);
    setSearchQuery('');
  };

  // Toggle direction of sort icon path
  const toggleSortDir = () => {
    setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Format date time update
  const formattedUpdateTime = () => {
    if (!rawData || !rawData.latest || !rawData.latest.fechaActualizacion) {
      return new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    }
    const date = new Date(rawData.latest.fechaActualizacion);
    return date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <main className="container" style={{ paddingTop: '80px' }}>
        <div className="tabs-container">
          <button className="tab-btn active">Cargando...</button>
        </div>
        <section className="regions-grid">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="glass-card skeleton-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div className="skeleton-box" style={{ height: '18px', width: '60%' }}></div>
                <div className="skeleton-box" style={{ height: '16px', width: '25%' }}></div>
              </div>
              <div className="skeleton-box" style={{ height: '12px', width: '85%', marginBottom: '12px' }}></div>
              <div className="skeleton-box" style={{ height: '12px', width: '75%', marginBottom: '16px' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '12px' }}>
                <div className="skeleton-box" style={{ height: '11px', width: '40%' }}></div>
                <div className="skeleton-box" style={{ height: '11px', width: '30%' }}></div>
              </div>
            </div>
          ))}
        </section>
      </main>
    );
  }

  if (error || !processedData) {
    return (
      <main className="container" style={{ paddingTop: '120px', textAlign: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '480px', margin: '0 auto', padding: '64px 24px' }}>
          <p style={{ color: 'var(--color-keiko)', fontSize: '20px', fontWeight: '800', marginBottom: '12px' }}>Error de Conexión</p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>No se pudo conectar a los servidores de datos de la ONPE. Por favor, recarga la página o inténtalo más tarde.</p>
        </div>
      </main>
    );
  }

  // Active list based on tab
  const activeList = currentTab === 'peru' ? processedData.regiones : processedData.extranjero;
  
  // Filter
  const filteredList = activeList.filter(r => 
    r.nombre.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    r.ubigeo.includes(searchQuery.trim())
  );
  
  // Sort
  const sortedList = [...filteredList].sort((a, b) => {
    let valA, valB;
    const isExtrap = currentViewMode === 'extrapolated';
    switch (sortKey) {
      case 'name':
        valA = a.nombre;
        valB = b.nombre;
        break;
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
      default:
        valA = a.nombre;
        valB = b.nombre;
    }
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const nat = processedData.national[currentTab];
  const isExtrap = currentViewMode === 'extrapolated';
  const natData = isExtrap ? nat.extrapolated : nat.current;

  return (
    <>
      {/* BACKGROUND DECORATIONS */}
      <div className="blob blob-orange" aria-hidden="true"></div>
      <div className="blob blob-green" aria-hidden="true"></div>

      {/* APPLICATION HEADER */}
      <header>
        <div className="container header-inner">
          <div className="brand">
            <div className="brand-avatar" aria-hidden="true">
              <img
                src="/FullLogo_Transparent.png"
                alt="QM Solutions Logo"
                className="brand-logo"
              />
            </div>
            <div className="brand-text">
              <h1>Elecciones Presidenciales 2026 - Segunda Vuelta</h1>
              <p>Resultados ONPE y Proyecciones.</p>
            </div>
          </div>
          
          <div className="live-status-badge">
            <span className="live-pulse" aria-hidden="true"></span>
            <span className="live-text">CONEXIÓN DIRECTA ONPE</span>
            <span className="live-divider" aria-hidden="true"></span>
            <span className="live-time">Actualización: <span className="mono-font">{formattedUpdateTime()}</span> (UTC-5)</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="container">
        
        {/* MAIN TAB NAVIGATION */}
        <div className="tabs-wrapper">
          <div className="tabs-container">
            <button 
              className={`tab-btn ${currentTab === 'peru' ? 'active' : ''}`}
              onClick={() => handleTabChange('peru')}
              title="Ver votos de territorio nacional"
            >
              <svg className="tab-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
              PERÚ (Voto Nacional)
            </button>
            <button 
              className={`tab-btn ${currentTab === 'extranjero' ? 'active' : ''}`}
              onClick={() => handleTabChange('extranjero')}
              title="Ver votos del exterior por continente"
            >
              <svg className="tab-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
              EXTRANJERO (Voto Exterior)
            </button>
          </div>
        </div>
        
        {/* HERO SECTION: NATIONAL SUMMARY */}
        <section className="summary-section">
          <h2 className="section-title">
            {currentTab === 'peru' ? (
              <>
                <svg className="title-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                {isExtrap ? 'Proyección Nacional al 100% — 25 Regiones' : 'Votos Oficiales ONPE — Territorio Nacional'}
              </>
            ) : (
              <>
                <svg className="title-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                {isExtrap ? 'Proyección Exterior al 100% — 5 Continentes' : 'Votos Oficiales ONPE — Voto Exterior'}
              </>
            )}
          </h2>
          
          {/* INTERACTION CONTROL BAR */}
          <section className="controls-section" aria-label="Controles de vista">
            <div className="btn-group-toggle">
              <button 
                className={`toggle-btn ${currentViewMode === 'current' ? 'active' : ''}`}
                onClick={() => setCurrentViewMode('current')}
              >
                Votos Oficiales ONPE
              </button>
              <button 
                id="btn-view-extrapolated"
                className={`toggle-btn ${currentViewMode === 'extrapolated' ? 'active' : ''}`}
                onClick={() => setCurrentViewMode('extrapolated')}
              >
                Proyección Estimada
              </button>
            </div>
          </section>

          {/* EXTRAPOLATION EXPLANATION BOX */}
          <div id="extrapolation-info-box" className={`info-box-container ${isExtrap ? 'show' : ''}`}>
            <div className="info-box-content">
              <svg className="info-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <div className="info-text">
                <strong>¿Cómo funciona la Proyección Extrapolada?</strong>
                <p>Es un modelo matemático que estima el resultado final al 100% de actas basándose en el comportamiento de votación local de cada región. En lugar de aplicar el promedio nacional a los votos faltantes (lo que sesgaría el resultado debido a que unas regiones procesan sus actas más rápido que otras), proyectamos cada departamento de forma independiente respetando su proporción actual de voto. Esto proporciona un análisis estadístico estable, objetivo y libre de sesgo geográfico.</p>
              </div>
            </div>
          </div>
          
          <div className="national-layout">
            {/* Comparison Statistics Card — first */}
            <div className="glass-card metrics-card">
              <div className="metrics-header">
                <div className="metrics-title-group">
                  <h3>
                    {isExtrap
                      ? (currentTab === 'peru'
                          ? 'Proyección al 100% de Actas — Territorio Nacional'
                          : 'Proyección al 100% de Actas — Voto Exterior')
                      : (currentTab === 'peru'
                          ? 'Resultados Oficiales ONPE — Territorio Nacional'
                          : 'Resultados Oficiales ONPE — Voto Exterior')}
                  </h3>
                  <p>
                    {isExtrap
                      ? (currentTab === 'peru'
                          ? 'Estimación ponderada por región al 100% de actas escrutadas'
                          : 'Estimación ponderada por continente al 100% de actas escrutadas')
                      : (currentTab === 'peru'
                          ? 'Votos válidos contabilizados oficialmente por la ONPE — 25 regiones'
                          : 'Votos válidos contabilizados oficialmente por la ONPE — 5 continentes')}
                  </p>
                </div>
                <div className="badge-margin">
                  Diferencia: <span className="mono-font">{natData.margin.toLocaleString('es-PE')}</span> votos (<span className="mono-font">{natData.marginPct.toFixed(3)}%</span>) a favor de <span className={natData.leader === 'Keiko Fujimori' ? 'orange-text' : 'green-text'} style={{ fontWeight: 800 }}>{natData.leader}</span>
                </div>
              </div>
              
              {/* Candidates Head to Head */}
              <div className="candidate-vs-container">
                {/* Keiko Fujimori */}
                <div className="cand-panel cand-keiko">
                  <div className="cand-meta">
                    <div className="avatar orange-bg" aria-label="K">K</div>
                    <div className="meta-names">
                      <span className="name">Keiko Fujimori</span>
                      <span className="party">Fuerza Popular</span>
                    </div>
                  </div>
                  <div className="cand-vals">
                    <span className="percentage orange-text mono-font">{natData.keikoPct.toFixed(3)}%</span>
                    <span className="votes mono-font">{natData.keiko.toLocaleString('es-PE')} votos</span>
                  </div>
                </div>
                
                {/* Roberto Sanchez */}
                <div className="cand-panel cand-roberto">
                  <div className="cand-meta">
                    <div className="avatar green-bg" aria-label="R">R</div>
                    <div className="meta-names">
                      <span className="name">Roberto Sánchez</span>
                      <span className="party">Juntos por el Perú</span>
                    </div>
                  </div>
                  <div className="cand-vals">
                    <span className="percentage green-text mono-font">{natData.robertoPct.toFixed(3)}%</span>
                    <span className="votes mono-font">{natData.roberto.toLocaleString('es-PE')} votos</span>
                  </div>
                </div>
              </div>
              
              {/* Split Progress Bar */}
              <div className="progress-bar-wrapper">
                <div className="split-bar">
                  <div className="bar-fill orange-bg" style={{ width: `${natData.keikoPct}%` }}></div>
                  <div className="bar-fill green-bg" style={{ width: `${natData.robertoPct}%` }}></div>
                </div>
              </div>

              {/* Bottom Widgets Grid */}
              <div className="stats-mini-grid">
                <div className="mini-widget">
                  <span className="mini-lbl">{isExtrap ? 'Actas Proyectadas' : 'Actas Contabilizadas'}</span>
                  <span className="mini-val mono-font">{isExtrap ? '100.000%' : `${nat.actsPct.toFixed(3)}%`}</span>
                </div>
                <div className="mini-widget">
                  <span className="mini-lbl">{isExtrap ? 'Votos Válidos Proyectados' : 'Votos Válidos Actuales'}</span>
                  <span className="mini-val mono-font">{natData.valid.toLocaleString('es-PE')}</span>
                </div>
              </div>
            </div>

            {/* Doughnut Votes Distribution Card — second */}
            <div className="glass-card doughnut-card">
              <h3 className="card-title">
                {isExtrap ? 'Distribución de Votos Proyectados' : 'Distribución de Votos Válidos'}
              </h3>
              <div className="doughnut-canvas-container">
                <canvas ref={nationalChartRef}></canvas>
                <div className="doughnut-center-lbl">
                  <span className="mono-font">
                    {isExtrap ? '100.000%' : `${nat.actsPct.toFixed(3)}%`}
                  </span>
                  <span className="center-sub">
                    {isExtrap ? 'Actas Proy.' : 'Actas'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH & SORT CONTROLS BAR */}
        <section className="search-sort-section" aria-label="Búsqueda y ordenamiento">
          {/* Search Input */}
          <div className="search-box">
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input 
              type="text" 
              className="search-input" 
              placeholder={currentTab === 'peru' ? 'Buscar departamento o código...' : 'Buscar continente o código...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off" 
              spellCheck="false"
            />
          </div>
          
          {/* Sorting */}
          <div className="sort-box">
            <label htmlFor="sort-select" className="sort-lbl">Ordenar:</label>
            <select 
              id="sort-select" 
              className="sort-select"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
            >
              <option value="name">Departamento</option>
              <option value="acts">Avance de Actas</option>
              <option value="keiko">Votos Keiko %</option>
              <option value="roberto">Votos Roberto %</option>
              <option value="margin">Ventaja %</option>
            </select>
            <button 
              className="sort-dir-btn" 
              onClick={toggleSortDir}
              title="Invertir Orden" 
              aria-label="Invertir Dirección de Orden"
            >
              <svg id="sort-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {sortDir === 'asc' ? (
                  <path d="m3 16 4 4 4-4M7 20V4m14 4-4-4-4 4m4-4v16"/>
                ) : (
                  <path d="m3 8 4-4 4 4M7 4v16m14-4-4 4-4-4m4 4V4"/>
                )}
              </svg>
            </button>
          </div>
        </section>

        {/* DYNAMIC REGIONS GRID */}
        <section className="regions-grid" aria-label="Tarjetas departamentales">
          {sortedList.length === 0 ? (
            <div className="glass-card" style={{ gridColumn: '1 / -1', padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No se encontraron elementos con el término de búsqueda "{searchQuery}".
            </div>
          ) : (
            sortedList.map(r => {
              const kPct = isExtrap ? r.calc.kPctExtrap : r.calc.kPct;
              const rPct = isExtrap ? r.calc.rPctExtrap : r.calc.rPct;
              const isKeikoLeading = kPct > rPct;
              const margin = Math.abs(kPct - rPct);
              
              return (
                <div 
                  key={r.ubigeo} 
                  className="glass-card region-card" 
                  onClick={() => setModalUbigeo(r.ubigeo)}
                >
                  <div className="card-hdr">
                    <h3 className="region-name">{r.nombre}</h3>
                    <span className="acts-badge">{r.actasContabilizadas.toFixed(3)}% actas</span>
                  </div>
                  
                  <div className={`region-cand-line ${isKeikoLeading ? 'winner keiko-lead' : ''}`}>
                    <span>Keiko Fujimori</span>
                    <span className="mono-font">{kPct.toFixed(3)}%</span>
                  </div>
                  
                  <div className={`region-cand-line ${!isKeikoLeading ? 'winner roberto-lead' : ''}`}>
                    <span>Roberto Sánchez</span>
                    <span className="mono-font">{rPct.toFixed(3)}%</span>
                  </div>
                  
                  <div className="progress-bar-wrapper" style={{ marginTop: '8px' }}>
                    <div className="split-bar" style={{ height: '6px' }}>
                      <div className="bar-fill orange-bg" style={{ width: `${kPct}%` }}></div>
                      <div className="bar-fill green-bg" style={{ width: `${rPct}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="card-ftr">
                    <span className="adv-badge">Ventaja: <span className={isKeikoLeading ? 'orange-text' : 'green-text'}>{margin.toFixed(3)}%</span></span>
                    <span>{isExtrap ? 'Proyectado' : `Faltan: ${(100 - r.actasContabilizadas).toFixed(3)}%`}</span>
                  </div>
                </div>
              );
            })
          )}
        </section>

      </main>

      {/* REGIONAL DETAIL MODAL */}
      <div 
        className={`modal-overlay ${selectedRegion ? 'active' : ''}`} 
        role="dialog" 
        aria-modal="true" 
        onClick={(e) => { if (e.target.className.includes('modal-overlay')) setModalUbigeo(null); }}
      >
        {selectedRegion && (
          <div className="modal-card glass-card">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <h2>{selectedRegion.nombre}</h2>
                <span className="mono-font">
                  {currentTab === 'peru' ? `Ubigeo: ${selectedRegion.ubigeo}` : `Código: ${selectedRegion.ubigeo}`}
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setModalUbigeo(null)} aria-label="Cerrar modal" title="Cerrar">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="modal-body">
              {/* Quick stats grid */}
              <div className="modal-grid">
                <div className="modal-widget">
                  <span className="m-lbl">Actas Contabilizadas</span>
                  <span className="m-val mono-font">{selectedRegion.actasContabilizadas.toFixed(3)}%</span>
                </div>
                <div className="modal-widget">
                  <span className="m-lbl">Votos Válidos</span>
                  <span className="m-val mono-font">{(isExtrap ? selectedRegion.calc.validExtrap : selectedRegion.calc.valid).toLocaleString('es-PE')}</span>
                </div>
                <div className="modal-widget orange-border">
                  <span className="m-lbl orange-text">Keiko Fujimori</span>
                  <span className="m-val orange-text mono-font">
                    {(isExtrap ? selectedRegion.calc.kPctExtrap : selectedRegion.calc.kPct).toFixed(3)}%
                  </span>
                  <span className="m-sub mono-font">
                    {(isExtrap ? selectedRegion.keiko_projected : selectedRegion.keiko_votos).toLocaleString('es-PE')} votos
                  </span>
                </div>
                <div className="modal-widget green-border">
                  <span className="m-lbl green-text">Roberto Sánchez</span>
                  <span className="m-val green-text mono-font">
                    {(isExtrap ? selectedRegion.calc.rPctExtrap : selectedRegion.calc.rPct).toFixed(3)}%
                  </span>
                  <span className="m-sub mono-font">
                    {(isExtrap ? selectedRegion.roberto_projected : selectedRegion.roberto_votos).toLocaleString('es-PE')} votos
                  </span>
                </div>
              </div>
              
              {/* Regional evolution line chart */}
              <div className="modal-chart-section">
                <h3 className="modal-chart-title">Evolución de la Votación Histórica</h3>
                <div className="modal-canvas-wrapper">
                  <canvas ref={modalChartRef}></canvas>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* APPLICATION FOOTER */}
      <footer>
        <div className="container footer-inner">
          <p>Dashboard de Análisis Independiente de Datos Electorales. Segunda Vuelta Presidencial Perú 2026.</p>
          <p>Los datos mostrados provienen directamente de los servidores oficiales de la <strong>Oficina Nacional de Procesos Electorales (ONPE)</strong>.</p>
          <p className="footer-copyright">&copy; 2026 QM Solutions - Data Analytics Department. Todos los derechos reservados.</p>
        </div>
      </footer>
    </>
  );
}
