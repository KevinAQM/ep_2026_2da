import React from 'react';
import RegionCard from './RegionCard';

export default function RegionGrid({ sortedList, searchQuery, isExtrap, onCardClick }) {
  if (sortedList.length === 0) {
    return (
      <section className="regions-grid" aria-label="Tarjetas departamentales">
        <div className="glass-card" style={{ gridColumn: '1 / -1', padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No se encontraron elementos con el término de búsqueda "{searchQuery}".
        </div>
      </section>
    );
  }

  return (
    <section className="regions-grid stagger-animation" aria-label="Tarjetas departamentales">
      {sortedList.map((r, index) => (
        <RegionCard 
          key={r.ubigeo} 
          r={r} 
          isExtrap={isExtrap} 
          onClick={onCardClick} 
          style={{ animationDelay: `${index * 0.05}s` }}
        />
      ))}
    </section>
  );
}
