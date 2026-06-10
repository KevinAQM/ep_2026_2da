"use client";

import React, { useState, useEffect } from 'react';
import DoughnutChart from './Charts/DoughnutChart';
import PeruMap from './Charts/PeruMap';
import { IconInfo } from './ui/Icons';

const miniTabStyle = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  fontSize: '11px',
  fontWeight: '700',
  padding: '6px 12px',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
};

const activeMiniTabStyle = {
  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
  color: '#ffffff',
  boxShadow: '0 2px 8px rgba(236, 72, 153, 0.3)',
};

export default function NationalSummary({
  isExtrap,
  currentTab,
  nat,
  natData,
  regiones,
  projectionsHistory,
  onRegionClick
}) {
  const [activeVisualTab, setActiveVisualTab] = useState('doughnut');

  // Automatically reset map tab if switching to foreign or todos
  useEffect(() => {
    if (currentTab !== 'peru' && activeVisualTab === 'map') {
      setActiveVisualTab('doughnut');
    }
  }, [currentTab, activeVisualTab]);

  const getUpdatesHistory = () => {
    if (!projectionsHistory || projectionsHistory.length === 0) return [];
    
    const N = projectionsHistory.length;
    const count = Math.min(20, N);
    const list = [];
    
    for (let i = N - 1; i >= N - count; i--) {
      const current = projectionsHistory[i];
      const previous = i > 0 ? projectionsHistory[i - 1] : null;
      
      let keikoVotes = 0;
      let robertoVotes = 0;
      let keikoPct = 50.0;
      let robertoPct = 50.0;
      let actsPct = 0;
      
      let prevKeikoVotes = 0;
      let prevRobertoVotes = 0;
      let prevKeikoPct = 50.0;
      let prevRobertoPct = 50.0;

      if (currentTab === 'peru') {
        keikoVotes = current.current_keiko;
        robertoVotes = current.current_roberto;
        keikoPct = current.current_keiko_pct;
        robertoPct = current.current_roberto_pct;
        actsPct = current.acts_pct;
        
        if (previous) {
          prevKeikoVotes = previous.current_keiko;
          prevRobertoVotes = previous.current_roberto;
          prevKeikoPct = previous.current_keiko_pct;
          prevRobertoPct = previous.current_roberto_pct;
        }
      } else if (currentTab === 'extranjero') {
        keikoVotes = current.ex_current_keiko;
        robertoVotes = current.ex_current_roberto;
        actsPct = current.ex_acts_pct;
        
        const currentTotal = keikoVotes + robertoVotes;
        keikoPct = currentTotal > 0 ? (keikoVotes / currentTotal * 100) : 50.0;
        robertoPct = currentTotal > 0 ? (robertoVotes / currentTotal * 100) : 50.0;
        
        if (previous) {
          prevKeikoVotes = previous.ex_current_keiko;
          prevRobertoVotes = previous.ex_current_roberto;
          const prevTotal = prevKeikoVotes + prevRobertoVotes;
          prevKeikoPct = prevTotal > 0 ? (prevKeikoVotes / prevTotal * 100) : 50.0;
          prevRobertoPct = prevTotal > 0 ? (prevRobertoVotes / prevTotal * 100) : 50.0;
        }
      } else { // todos
        keikoVotes = current.current_keiko + current.ex_current_keiko;
        robertoVotes = current.current_roberto + current.ex_current_roberto;
        
        const totalActsCombined = nat.totalActs || 1;
        const totalActsPeru = regiones.reduce((acc, r) => acc + (r.totalActas || 0), 0);
        const totalActsExtranjero = Math.max(0, totalActsCombined - totalActsPeru);
        
        const contabPeru = (current.acts_pct / 100) * totalActsPeru;
        const contabExtranjero = (current.ex_acts_pct / 100) * totalActsExtranjero;
        actsPct = ((contabPeru + contabExtranjero) / totalActsCombined) * 100;
        
        const currentTotal = keikoVotes + robertoVotes;
        keikoPct = currentTotal > 0 ? (keikoVotes / currentTotal * 100) : 50.0;
        robertoPct = currentTotal > 0 ? (robertoVotes / currentTotal * 100) : 50.0;
        
        if (previous) {
          prevKeikoVotes = previous.current_keiko + previous.ex_current_keiko;
          prevRobertoVotes = previous.current_roberto + previous.ex_current_roberto;
          const prevTotal = prevKeikoVotes + prevRobertoVotes;
          prevKeikoPct = prevTotal > 0 ? (prevKeikoVotes / prevTotal * 100) : 50.0;
          prevRobertoPct = prevTotal > 0 ? (prevRobertoVotes / prevTotal * 100) : 50.0;
        }
      }
      
      let keikoVotesVar = 0;
      let robertoVotesVar = 0;
      let keikoPctDiff = 0;
      let robertoPctDiff = 0;
      
      if (previous) {
        keikoVotesVar = keikoVotes - prevKeikoVotes;
        robertoVotesVar = robertoVotes - prevRobertoVotes;
        keikoPctDiff = keikoPct - prevKeikoPct;
        robertoPctDiff = robertoPct - prevRobertoPct;
      }
      
      list.push({
        timestamp: current.timestamp,
        timeDisplay: current.time_display,
        actsPct,
        keikoVotes,
        robertoVotes,
        keikoPct,
        robertoPct,
        keikoVotesVar,
        robertoVotesVar,
        keikoPctDiff,
        robertoPctDiff
      });
    }
    
    return list;
  };

  const formatDateOnly = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return timestamp;
    }
  };

  const formatDiff = (diff) => {
    if (diff > 0) return `+${diff.toFixed(3)}%`;
    if (diff < 0) return `${diff.toFixed(3)}%`;
    return `0.000%`;
  };

  const formatVotesVar = (votesVar) => {
    if (votesVar > 0) return `+${votesVar.toLocaleString('es-PE')}`;
    if (votesVar < 0) return `${votesVar.toLocaleString('es-PE')}`;
    return `0`;
  };

  return (
    <section className="summary-section">
      {/* EXTRAPOLATION EXPLANATION BOX */}
      <div id="extrapolation-info-box" className={`info-box-container ${isExtrap ? 'show' : ''}`}>
        <div className="info-box-content">
          <IconInfo className="info-icon" />
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
                    : currentTab === 'extranjero'
                      ? 'Proyección al 100% de Actas — Voto Exterior'
                      : 'Proyección al 100% de Actas — Consolidado General')
                  : (currentTab === 'peru'
                    ? 'Resultados Oficiales ONPE — Territorio Nacional'
                    : currentTab === 'extranjero'
                      ? 'Resultados Oficiales ONPE — Voto Exterior'
                      : 'Resultados Oficiales ONPE — Consolidado General')}
              </h3>
              <p>
                {isExtrap
                  ? (currentTab === 'peru'
                    ? 'Estimación ponderada por región al 100% de actas escrutadas'
                    : currentTab === 'extranjero'
                      ? 'Estimación ponderada por continente al 100% de actas escrutadas'
                      : 'Estimación consolidada al 100% de actas escrutadas (Nacional + Exterior)')
                  : (currentTab === 'peru'
                    ? 'Votos válidos contabilizados oficialmente por la ONPE — 25 regiones'
                    : currentTab === 'extranjero'
                      ? 'Votos válidos contabilizados oficialmente por la ONPE — 5 continentes'
                      : 'Votos válidos contabilizados oficialmente por la ONPE — Nacional + Exterior')}
              </p>
            </div>
            <div className="badge-margin">
              Diferencia: <span className={`mono-font ${natData.leader === 'Keiko Fujimori' ? 'orange-text' : 'green-text'}`} style={{ fontWeight: 800 }}>{natData.margin.toLocaleString('es-PE')}</span> <span className={natData.leader === 'Keiko Fujimori' ? 'orange-text' : 'green-text'}>votos</span> (<span className={`mono-font ${natData.leader === 'Keiko Fujimori' ? 'orange-text' : 'green-text'}`} style={{ fontWeight: 800 }}>{natData.marginPct.toFixed(3)}%</span>) a favor de <span className={natData.leader === 'Keiko Fujimori' ? 'orange-text' : 'green-text'} style={{ fontWeight: 800 }}>{natData.leader}</span>
            </div>
          </div>

          {/* Candidates Head to Head */}
          <div className="candidate-vs-container">
            {/* Roberto Sanchez */}
            <div className="cand-panel cand-roberto">
              <div className="cand-meta">
                <img className="avatar" src="/jp.png" alt="Juntos por el Perú Logo" />
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

            {/* Keiko Fujimori */}
            <div className="cand-panel cand-keiko">
              <div className="cand-meta">
                <img className="avatar" src="/k.png" alt="Fuerza Popular Logo" />
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
          </div>

          {/* Split Progress Bar */}
          <div className="progress-bar-wrapper">
            <div className="split-bar">
              <div className="bar-fill green-bg" style={{ width: `${natData.robertoPct}%` }}></div>
              <div className="bar-fill orange-bg" style={{ width: `${natData.keikoPct}%` }}></div>
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

          {/* Non-valid votes breakdown */}
          {!isExtrap && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '20px', borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}>
              <span>Votos en Blanco: <strong style={{ color: 'var(--text-secondary)' }} className="mono-font">{(natData.blank || 0).toLocaleString('es-PE')}</strong></span>
              <span>Votos Nulos: <strong style={{ color: 'var(--text-secondary)' }} className="mono-font">{(natData.null || 0).toLocaleString('es-PE')}</strong></span>
              <span>Votos Emitidos: <strong style={{ color: 'var(--text-secondary)' }} className="mono-font">{(natData.emitidos || 0).toLocaleString('es-PE')}</strong></span>
            </div>
          )}
        </div>

        {/* Visualizer Selector Card — second */}
        <div className="glass-card doughnut-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '390px' }}>
          {currentTab === 'peru' ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>
                Visualización
              </h3>
              <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '2px', borderRadius: '8px' }}>
                <button
                  onClick={() => setActiveVisualTab('doughnut')}
                  style={{ ...miniTabStyle, ...(activeVisualTab === 'doughnut' ? activeMiniTabStyle : {}) }}
                >
                  Rosca
                </button>
                <button
                  onClick={() => setActiveVisualTab('map')}
                  style={{ ...miniTabStyle, ...(activeVisualTab === 'map' ? activeMiniTabStyle : {}) }}
                >
                  Mapa
                </button>
              </div>
            </div>
          ) : (
            <h3 className="card-title" style={{ alignSelf: 'center', textAlign: 'center', marginBottom: '24px' }}>
              {isExtrap ? 'Distribución de Votos Proyectados' : 'Distribución de Votos Válidos'}
            </h3>
          )}

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            {activeVisualTab === 'doughnut' && (
              <div className="doughnut-canvas-container">
                <DoughnutChart data={natData} />
                <div className="doughnut-center-lbl">
                  <span className="mono-font">
                    {isExtrap ? '100.000%' : `${nat.actsPct.toFixed(3)}%`}
                  </span>
                  <span className="center-sub">
                    {isExtrap ? 'Actas Proy.' : 'Actas'}
                  </span>
                </div>
              </div>
            )}

            {activeVisualTab === 'map' && currentTab === 'peru' && (
              <PeruMap regiones={regiones} isExtrap={isExtrap} onRegionClick={onRegionClick} />
            )}
          </div>
        </div>

        {/* Historial de últimas 20 actualizaciones */}
        {!isExtrap && (currentTab === 'peru' || currentTab === 'extranjero' || currentTab === 'todos') && (
          <div className="glass-card updates-history-card">
            <div className="metrics-title-group" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>
                {currentTab === 'peru' 
                  ? 'Historial de Actualizaciones (ONPE Nacional)' 
                  : currentTab === 'extranjero'
                    ? 'Historial de Actualizaciones (ONPE Extranjero)'
                    : 'Historial de Actualizaciones (ONPE Consolidado)'}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
                {currentTab === 'peru'
                  ? 'Variación de votos oficiales absolutos y porcentaje acumulado de cada candidato en territorio nacional'
                  : currentTab === 'extranjero'
                    ? 'Variación de votos oficiales absolutos y porcentaje acumulado de cada candidato en el extranjero'
                    : 'Variación de votos oficiales absolutos y porcentaje acumulado de cada candidato a nivel consolidado (Nacional + Extranjero)'}
              </p>
            </div>
            
            <div className="updates-list-container">
              {getUpdatesHistory().map((update, idx) => (
                 <div key={idx} className="update-item">
                  <div className="update-item-header">
                    <div className="update-time-badge" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>📅 {formatDateOnly(update.timestamp)}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', paddingLeft: '20px' }}>{update.timeDisplay}</span>
                    </div>
                    <div className="update-progress-badge" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', textAlign: 'right' }}>
                      <span>Actas Contab.:</span>
                      <strong className="mono-font" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{update.actsPct.toFixed(3)}%</strong>
                    </div>
                  </div>
                  
                  <div className="update-grid-header update-grid">
                    <span>Candidato</span>
                    <span style={{ textAlign: 'right' }}>Votos</span>
                    <span style={{ textAlign: 'right' }}>% Acum.</span>
                    <span style={{ textAlign: 'right' }}>Dif. %</span>
                  </div>
                  
                  <div className="update-grid-row update-grid">
                    <span className="candidate-name-col">
                      <span className="candidate-color-dot roberto-dot"></span>
                      R. Sánchez
                    </span>
                    <span className="votes-col" style={{ textAlign: 'right', color: update.robertoVotesVar > 0 ? '#10b981' : update.robertoVotesVar < 0 ? '#ef4444' : 'var(--text-secondary)' }}>
                      {formatVotesVar(update.robertoVotesVar)}
                    </span>
                    <span className="pct-col green-text" style={{ textAlign: 'right' }}>
                      {update.robertoPct.toFixed(3)}%
                    </span>
                    <span className={`diff-col ${update.robertoPctDiff > 0 ? 'diff-positive' : update.robertoPctDiff < 0 ? 'diff-negative' : 'diff-neutral'}`} style={{ textAlign: 'right' }}>
                      {formatDiff(update.robertoPctDiff)}
                    </span>
                  </div>
                  
                  <div className="update-grid-row update-grid">
                    <span className="candidate-name-col">
                      <span className="candidate-color-dot keiko-dot"></span>
                      K. Fujimori
                    </span>
                    <span className="votes-col" style={{ textAlign: 'right', color: update.keikoVotesVar > 0 ? '#10b981' : update.keikoVotesVar < 0 ? '#ef4444' : 'var(--text-secondary)' }}>
                      {formatVotesVar(update.keikoVotesVar)}
                    </span>
                    <span className="pct-col orange-text" style={{ textAlign: 'right' }}>
                      {update.keikoPct.toFixed(3)}%
                    </span>
                    <span className={`diff-col ${update.keikoPctDiff > 0 ? 'diff-positive' : update.keikoPctDiff < 0 ? 'diff-negative' : 'diff-neutral'}`} style={{ textAlign: 'right' }}>
                      {formatDiff(update.keikoPctDiff)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
