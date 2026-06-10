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

  // Automatically reset map tab if switching to extranjero
  useEffect(() => {
    if (currentTab === 'extranjero' && activeVisualTab === 'map') {
      setActiveVisualTab('doughnut');
    }
  }, [currentTab, activeVisualTab]);

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
              Diferencia: <span className={`mono-font ${natData.leader === 'Keiko Fujimori' ? 'orange-text' : 'green-text'}`} style={{ fontWeight: 800 }}>{natData.margin.toLocaleString('es-PE')}</span> <span className={natData.leader === 'Keiko Fujimori' ? 'orange-text' : 'green-text'}>votos</span> (<span className={`mono-font ${natData.leader === 'Keiko Fujimori' ? 'orange-text' : 'green-text'}`} style={{ fontWeight: 800 }}>{natData.marginPct.toFixed(3)}%</span>) a favor de <span className={natData.leader === 'Keiko Fujimori' ? 'orange-text' : 'green-text'} style={{ fontWeight: 800 }}>{natData.leader}</span>
            </div>
          </div>
          
          {/* Candidates Head to Head */}
          <div className="candidate-vs-container">
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

          {/* Non-valid votes breakdown */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '20px', borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}>
            <span>Votos en Blanco: <strong style={{ color: 'var(--text-secondary)' }} className="mono-font">{(natData.blank || 0).toLocaleString('es-PE')}</strong></span>
            <span>Votos Nulos: <strong style={{ color: 'var(--text-secondary)' }} className="mono-font">{(natData.null || 0).toLocaleString('es-PE')}</strong></span>
            <span>Participación Est.: <strong style={{ color: 'var(--text-secondary)' }} className="mono-font">{(natData.emitidos || 0).toLocaleString('es-PE')} emitidos</strong></span>
          </div>
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
      </div>
    </section>
  );
}
