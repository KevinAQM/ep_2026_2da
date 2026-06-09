export default function Loading() {
  return (
    <main className="container" style={{ paddingTop: '80px' }}>
      <div className="tabs-container">
        <button className="tab-btn active">Cargando...</button>
      </div>
      <section className="regions-grid shimmer-wrapper">
        {Array(8).fill(0).map((_, i) => (
          <div key={i} className="glass-card skeleton-card shimmer" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div className="skeleton-box" style={{ height: '18px', width: '60%' }}></div>
              <div className="skeleton-box" style={{ height: '16px', width: '25%' }}></div>
            </div>
            <div className="skeleton-box" style={{ height: '12px', width: '85%', marginBottom: '12px' }}></div>
            <div className="skeleton-box" style={{ height: '12px', width: '75%', marginBottom: '16px' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '12px' }}>
              <div className="skeleton-box" style={{ height: '11px', width: '40%' }}></div>
              <div className="skeleton-box" style={{ height: '11px', width: '30%' }}></div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
