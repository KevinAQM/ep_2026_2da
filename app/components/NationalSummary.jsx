import React from 'react';
import DoughnutChart from './Charts/DoughnutChart';
import { IconInfo } from './ui/Icons';

export default function NationalSummary({ isExtrap, currentTab, nat, natData }) {
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
        </div>

        {/* Doughnut Votes Distribution Card — second */}
        <div className="glass-card doughnut-card">
          <h3 className="card-title">
            {isExtrap ? 'Distribución de Votos Proyectados' : 'Distribución de Votos Válidos'}
          </h3>
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
        </div>
      </div>
    </section>
  );
}
