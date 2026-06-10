"use client";

import React, { useEffect, useState, useMemo } from 'react';

// Maps ISO amCharts IDs to ONPE Ubigeo codes
const SVG_TO_UBIGEO = {
  'PE-AMA': '010000', // Amazonas
  'PE-ANC': '020000', // Ancash
  'PE-APU': '030000', // Apurímac
  'PE-ARE': '040000', // Arequipa
  'PE-AYA': '050000', // Ayacucho
  'PE-CAJ': '060000', // Cajamarca
  'PE-CAL': '240000', // Callao
  'PE-CUS': '070000', // Cusco
  'PE-HUV': '080000', // Huancavelica
  'PE-HUC': '090000', // Huánuco
  'PE-ICA': '100000', // Ica
  'PE-JUN': '110000', // Junín
  'PE-LAL': '120000', // La Libertad
  'PE-LAM': '130000', // Lambayeque
  'PE-LIM': '140000', // Lima (department)
  'PE-LMA': '140000', // Lima Metropolitana (mapped to unified Lima)
  'PE-LOR': '150000', // Loreto
  'PE-MDD': '160000', // Madre de Dios
  'PE-MOQ': '170000', // Moquegua
  'PE-PAS': '180000', // Pasco
  'PE-PIU': '190000', // Piura
  'PE-PUN': '200000', // Puno
  'PE-SAM': '210000', // San Martín
  'PE-TAC': '220000', // Tacna
  'PE-TUM': '230000', // Tumbes
  'PE-UCA': '250000', // Ucayali
};

export default function PeruMap({ regiones, isExtrap, onRegionClick }) {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });

  // Load SVG paths from client fetch
  useEffect(() => {
    fetch('/peruLow.svg')
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar el mapa SVG");
        return res.text();
      })
      .then((text) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'image/svg+xml');
        const pathNodes = doc.querySelectorAll('path');
        const parsed = Array.from(pathNodes).map((node) => ({
          id: node.getAttribute('id'),
          title: node.getAttribute('title') || node.getAttribute('id'),
          d: node.getAttribute('d'),
        }));
        setPaths(parsed);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error cargando mapa de Perú:", err);
        setError(true);
        setLoading(false);
      });
  }, []);

  // Quick lookup map of ubigeo to region data
  const regionDataMap = useMemo(() => {
    const map = {};
    if (!regiones) return map;
    regiones.forEach((r) => {
      map[r.ubigeo] = r;
    });
    return map;
  }, [regiones]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '320px', color: 'var(--text-secondary)' }}>
        <div className="live-pulse" style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-roberto)', marginBottom: '16px' }}></div>
        <p style={{ fontSize: '13px', fontWeight: '600' }}>Cargando mapa interactivo...</p>
      </div>
    );
  }

  if (error || paths.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '320px', color: 'var(--color-keiko)', fontSize: '13px', textAlign: 'center', padding: '16px' }}>
        No se pudo inicializar el mapa geográfico.
      </div>
    );
  }

  // Calculate fill color and opacity for a path ID
  const getPathStyle = (id) => {
    if (id === 'PE-LKT') {
      // Lake Titicaca
      return { fill: '#142035', stroke: 'rgba(255,255,255,0.06)', strokeWidth: '0.5' };
    }

    const ubigeo = SVG_TO_UBIGEO[id];
    const data = regionDataMap[ubigeo];

    if (!data) {
      return { fill: 'rgba(255, 255, 255, 0.05)', stroke: 'rgba(255,255,255,0.1)', strokeWidth: '0.5' };
    }

    const kPct = isExtrap ? data.calc.kPctExtrap : data.calc.kPct;
    const rPct = isExtrap ? data.calc.rPctExtrap : data.calc.rPct;
    const isKeikoLeading = kPct > rPct;
    const margin = Math.abs(kPct - rPct);

    // Leader color
    const baseColor = isKeikoLeading ? 'var(--color-keiko)' : 'var(--color-roberto)';
    
    // Opacity based on margin (competitive regions are softer, strongholds are bright)
    // Range: 0.35 opacity at 0% margin, to 1.0 opacity at 35% margin or more.
    const opacity = Math.min(1.0, 0.35 + (margin / 35) * 0.65);

    const isHovered = hoveredRegion === id;

    return {
      fill: baseColor,
      fillOpacity: opacity,
      stroke: isHovered ? '#ffffff' : 'rgba(3,3,3,0.8)',
      strokeWidth: isHovered ? '2.0' : '0.8',
      filter: isHovered ? 'drop-shadow(0px 0px 8px rgba(255,255,255,0.3))' : 'none',
      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      cursor: 'pointer',
    };
  };

  const handleMouseMove = (e, path) => {
    const ubigeo = SVG_TO_UBIGEO[path.id];
    const data = regionDataMap[ubigeo];
    
    if (!data) return;

    setTooltip({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      data: {
        nombre: data.nombre,
        actas: data.actasContabilizadas,
        kPct: isExtrap ? data.calc.kPctExtrap : data.calc.kPct,
        rPct: isExtrap ? data.calc.rPctExtrap : data.calc.rPct,
        kVotes: isExtrap ? data.keiko_projected : data.keiko_votos,
        rVotes: isExtrap ? data.roberto_projected : data.roberto_votos,
        valid: isExtrap ? data.calc.validExtrap : data.calc.valid,
      }
    });
  };

  const handleMouseLeave = () => {
    setHoveredRegion(null);
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const handlePathClick = (id) => {
    const ubigeo = SVG_TO_UBIGEO[id];
    if (ubigeo && onRegionClick) {
      onRegionClick(ubigeo);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {/* SVG Map Container */}
      <svg 
        viewBox="80 30 460 760" 
        width="100%" 
        height="390px" 
        style={{ overflow: 'visible', maxWidth: '320px' }}
      >
        <g>
          {paths.map((p) => (
            <path
              key={p.id}
              d={p.d}
              style={getPathStyle(p.id)}
              onMouseEnter={() => setHoveredRegion(p.id)}
              onMouseMove={(e) => handleMouseMove(e, p)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handlePathClick(p.id)}
            />
          ))}
        </g>
      </svg>

      {/* Floating Tooltip Component */}
      {tooltip.visible && tooltip.data && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 18,
          top: tooltip.y - 45,
          pointerEvents: 'none',
          zIndex: 99999,
          background: '#090d16',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
          fontFamily: 'var(--font-body)',
          transform: 'translateY(-50%)',
          minWidth: '220px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px', marginBottom: '8px' }}>
            <span style={{ fontWeight: '800', fontSize: '13px', color: '#f3f4f6' }}>{tooltip.data.nombre}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700' }}>
              {isExtrap ? 'Avance Real: ' : ''}{tooltip.data.actas.toFixed(2)}%{isExtrap ? '' : ' actas'}
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ color: 'var(--color-keiko)', fontWeight: '700' }}>Keiko Fujimori:</span>
            <span style={{ fontWeight: '800', color: 'var(--color-keiko)' }} className="mono-font">
              {tooltip.data.kPct.toFixed(3)}%
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', paddingLeft: '8px' }}>
            <span>Votos:</span>
            <span className="mono-font">{tooltip.data.kVotes.toLocaleString('es-PE')}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ color: 'var(--color-roberto)', fontWeight: '700' }}>Roberto Sánchez:</span>
            <span style={{ fontWeight: '800', color: 'var(--color-roberto)' }} className="mono-font">
              {tooltip.data.rPct.toFixed(3)}%
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', paddingLeft: '8px', marginBottom: isExtrap ? '8px' : '0px' }}>
            <span>Votos:</span>
            <span className="mono-font">{tooltip.data.rVotes.toLocaleString('es-PE')}</span>
          </div>

          {isExtrap && (
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: '8px',
              marginTop: '4px',
              fontSize: '10px',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              textAlign: 'center'
            }}>
              Proyección estimada al 100%
            </div>
          )}
        </div>
      )}
    </div>
  );
}
