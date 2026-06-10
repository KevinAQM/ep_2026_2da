import React, { useEffect, useRef } from 'react';
import LineChart from '../Charts/LineChart';
import { IconClose } from '../ui/Icons';

export default function DetailModal({ selectedRegion, currentTab, isExtrap, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (selectedRegion && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    } else if (!selectedRegion && dialogRef.current && dialogRef.current.open) {
      dialogRef.current.close();
    }
  }, [selectedRegion]);

  const handleClose = () => {
    if (dialogRef.current) {
      dialogRef.current.close();
    }
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (dialogRef.current && e.target === dialogRef.current) {
      handleClose();
    }
  };

  if (!selectedRegion) return null;

  return (
    <dialog 
      ref={dialogRef}
      className="native-dialog"
      onClick={handleBackdropClick}
      onClose={handleClose}
    >
      <div className="modal-card glass-card">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <h2>{selectedRegion.nombre}</h2>
            <span className="mono-font">
              {currentTab === 'peru' ? `Ubigeo: ${selectedRegion.ubigeo}` : `Código: ${selectedRegion.ubigeo}`}
            </span>
          </div>
          <form method="dialog">
            <button className="modal-close-btn" aria-label="Cerrar modal" title="Cerrar" onClick={onClose}>
              <IconClose />
            </button>
          </form>
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
          
          {/* Non-valid votes breakdown */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '-16px', marginBottom: '24px', padding: '0 4px' }}>
            <span>Votos en Blanco: <strong style={{ color: 'var(--text-secondary)' }} className="mono-font">{(selectedRegion.blank_votos || 0).toLocaleString('es-PE')}</strong></span>
            <span>Votos Nulos: <strong style={{ color: 'var(--text-secondary)' }} className="mono-font">{(selectedRegion.null_votos || 0).toLocaleString('es-PE')}</strong></span>
            <span>Votos Emitidos: <strong style={{ color: 'var(--text-secondary)' }} className="mono-font">{(selectedRegion.totalVotos || 0).toLocaleString('es-PE')}</strong></span>
          </div>
          
          {/* Regional evolution line chart */}
          <div className="modal-chart-section">
            <h3 className="modal-chart-title">Evolución de la Votación Histórica</h3>
            <div className="modal-canvas-wrapper">
              <LineChart serie={selectedRegion.serie} />
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
