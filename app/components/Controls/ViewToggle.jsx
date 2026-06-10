import React from 'react';
import { IconPeru, IconExtranjero, IconTodos } from '../ui/Icons';

export default function ViewToggle({ 
  currentViewMode, 
  setCurrentViewMode, 
  currentTab, 
  handleTabChange,
  autoPoll,
  setAutoPoll,
  isPolling
}) {
  return (
    <div className="sticky-buttons-bar">
      <div className="container sticky-buttons-inner">
        {/* INTERACTION CONTROL BAR */}
        <section className="controls-section" aria-label="Controles de vista" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '16px', width: '100%' }}>
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
        <div className="tabs-wrapper" style={{ gap: '12px' }}>
          <div className="tabs-container">
            <button 
              className={`tab-btn ${currentTab === 'todos' ? 'active' : ''}`}
              onClick={() => handleTabChange('todos')}
              title="Ver consolidado total (Nacional + Exterior)"
            >
              <IconTodos className="tab-icon" />
              TODOS
            </button>
          </div>
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
