import React from 'react';

export default function Header({ rawData }) {
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

  return (
    <header>
      <div className="container header-inner">
        <div className="brand">
          <div className="brand-avatar" aria-hidden="true" style={{ cursor: 'pointer' }} onClick={() => window.location.reload()}>
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
  );
}
