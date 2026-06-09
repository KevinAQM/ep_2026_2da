import React from 'react';

export default function RegionCard({ r, isExtrap, onClick, style = {} }) {
  const kPct = isExtrap ? r.calc.kPctExtrap : r.calc.kPct;
  const rPct = isExtrap ? r.calc.rPctExtrap : r.calc.rPct;
  const isKeikoLeading = kPct > rPct;
  const margin = Math.abs(kPct - rPct);
  
  return (
    <div 
      className="glass-card region-card" 
      onClick={() => onClick(r.ubigeo)}
      style={style}
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
}
