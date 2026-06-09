"use client";

import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import ViewToggle from './components/Controls/ViewToggle';
import NationalSummary from './components/NationalSummary';
import SearchBar from './components/Controls/SearchBar';
import RegionGrid from './components/RegionList/RegionGrid';
import DetailModal from './components/Modal/DetailModal';
import Footer from './components/Footer';

export default function DashboardClient({ initialData, rawData }) {
  // processedData is passed down from page.js Server Component
  const processedData = initialData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  
  // States matching app.js engine
  const [currentTab, setCurrentTab] = useState('peru'); // 'peru' or 'extranjero'
  const [currentViewMode, setCurrentViewMode] = useState('current'); // 'current' or 'extrapolated'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  
  const [modalUbigeo, setModalUbigeo] = useState(null);

  // Tab switching — preserves current view mode selection
  const handleTabChange = (tab) => {
    if (currentTab === tab) return;
    setCurrentTab(tab);
    setSearchQuery('');
  };

  // Toggle direction of sort icon path
  const toggleSortDir = () => {
    setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // In App Router, loading and errors are better handled natively via loading.js and error.js
  if (error || !processedData) {
    return (
      <main className="container" style={{ paddingTop: '120px', textAlign: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '480px', margin: '0 auto', padding: '64px 24px' }}>
          <p style={{ color: 'var(--color-keiko)', fontSize: '20px', fontWeight: '800', marginBottom: '12px' }}>Error de Conexión</p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>No se pudo conectar a los servidores de datos de la ONPE. Por favor, recarga la página o inténtalo más tarde.</p>
        </div>
      </main>
    );
  }

  // Active list based on tab
  const activeList = currentTab === 'peru' ? processedData.regiones : processedData.extranjero;
  
  // Filter & Sort using useMemo for performance
  const sortedList = useMemo(() => {
    const filteredList = activeList.filter(r => 
      r.nombre.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      r.ubigeo.includes(searchQuery.trim())
    );
    
    return [...filteredList].sort((a, b) => {
      let valA, valB;
      const isExtrap = currentViewMode === 'extrapolated';
      switch (sortKey) {
        case 'name':
          valA = a.nombre;
          valB = b.nombre;
          break;
        case 'acts':
          valA = a.actasContabilizadas;
          valB = b.actasContabilizadas;
          break;
        case 'keiko':
          valA = isExtrap ? a.calc.kPctExtrap : a.calc.kPct;
          valB = isExtrap ? b.calc.kPctExtrap : b.calc.kPct;
          break;
        case 'roberto':
          valA = isExtrap ? a.calc.rPctExtrap : a.calc.rPct;
          valB = isExtrap ? b.calc.rPctExtrap : b.calc.rPct;
          break;
        case 'margin':
          valA = isExtrap ? Math.abs(a.calc.kPctExtrap - a.calc.rPctExtrap) : Math.abs(a.calc.kPct - a.calc.rPct);
          valB = isExtrap ? Math.abs(b.calc.kPctExtrap - b.calc.rPctExtrap) : Math.abs(b.calc.kPct - b.calc.rPct);
          break;
        default:
          valA = a.nombre;
          valB = b.nombre;
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [activeList, searchQuery, currentViewMode, sortKey, sortDir]);

  const nat = processedData.national[currentTab];
  const isExtrap = currentViewMode === 'extrapolated';
  const natData = isExtrap ? nat.extrapolated : nat.current;

  // Find modal region detailed data
  const selectedRegion = useMemo(() => {
    if (!modalUbigeo || !processedData) return null;
    const list = currentTab === 'peru' ? processedData.regiones : processedData.extranjero;
    return list.find(r => r.ubigeo === modalUbigeo) || null;
  }, [modalUbigeo, processedData, currentTab]);

  return (
    <>
      {/* BACKGROUND DECORATIONS */}
      <div className="blob blob-orange" aria-hidden="true"></div>
      <div className="blob blob-green" aria-hidden="true"></div>

      <Header rawData={rawData} />
      
      <ViewToggle 
        currentViewMode={currentViewMode} 
        setCurrentViewMode={setCurrentViewMode}
        currentTab={currentTab}
        handleTabChange={handleTabChange}
      />

      {/* MAIN CONTAINER */}
      <main className="container">
        <NationalSummary isExtrap={isExtrap} currentTab={currentTab} nat={nat} natData={natData} />
        
        <SearchBar 
          currentTab={currentTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortKey={sortKey}
          setSortKey={setSortKey}
          sortDir={sortDir}
          toggleSortDir={toggleSortDir}
        />
        
        <RegionGrid 
          sortedList={sortedList} 
          searchQuery={searchQuery} 
          isExtrap={isExtrap} 
          onCardClick={setModalUbigeo} 
        />
      </main>

      <Footer />

      <DetailModal 
        selectedRegion={selectedRegion}
        currentTab={currentTab}
        isExtrap={isExtrap}
        onClose={() => setModalUbigeo(null)}
      />
    </>
  );
}
