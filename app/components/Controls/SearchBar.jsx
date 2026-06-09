import React from 'react';
import { IconSearch, IconSortAsc, IconSortDesc } from '../ui/Icons';

export default function SearchBar({ 
  currentTab, 
  searchQuery, 
  setSearchQuery, 
  sortKey, 
  setSortKey, 
  sortDir, 
  toggleSortDir 
}) {
  return (
    <section className="search-sort-section" aria-label="Búsqueda y ordenamiento">
      {/* Search Input */}
      <div className="search-box">
        <IconSearch className="search-icon" />
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
          {sortDir === 'asc' ? <IconSortAsc /> : <IconSortDesc />}
        </button>
      </div>
    </section>
  );
}
