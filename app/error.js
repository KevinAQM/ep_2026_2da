"use client";

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container" style={{ paddingTop: '120px', textAlign: 'center' }}>
      <div className="glass-card" style={{ maxWidth: '480px', margin: '0 auto', padding: '64px 24px' }}>
        <p style={{ color: 'var(--color-keiko)', fontSize: '20px', fontWeight: '800', marginBottom: '12px' }}>Algo salió mal</p>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
          Ocurrió un error inesperado al cargar el dashboard.
        </p>
        <button 
          onClick={() => reset()}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '10px 20px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Intentar de nuevo
        </button>
      </div>
    </main>
  );
}
