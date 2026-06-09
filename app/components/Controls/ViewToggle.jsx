import React from 'react';
import { IconPeru, IconExtranjero } from '../ui/Icons';

export default function ViewToggle({ currentViewMode, setCurrentViewMode, currentTab, handleTabChange }) {
  return (
    <div className="sticky-buttons-bar">
      <div className="container sticky-buttons-inner">
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

        {/* MAIN TAB NAVIGATION */}
        <div className="tabs-wrapper">
          <div className="tabs-container">
            <button 
              className={`tab-btn ${currentTab === 'peru' ? 'active' : ''}`}
              onClick={() => handleTabChange('peru')}
              title="Ver votos de territorio nacional"
            >
              <IconPeru className="tab-icon" />
              PERÚ
            </button>
            <button 
              className={`tab-btn ${currentTab === 'extranjero' ? 'active' : ''}`}
              onClick={() => handleTabChange('extranjero')}
              title="Ver votos del exterior por continente"
            >
              <IconExtranjero className="tab-icon" />
              EXTRANJERO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
