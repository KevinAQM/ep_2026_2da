"use client";

import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function LineChart({ serie }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!serie || !chartRef.current) return;
    
    const ctx = chartRef.current.getContext('2d');
    
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    if (serie.length === 0) {
      ctx.clearRect(0, 0, 300, 200);
      ctx.font = '14px Roboto';
      ctx.fillStyle = '#6b7280';
      ctx.textAlign = 'center';
      ctx.fillText('No hay datos históricos grabados todavía.', 150, 100);
      return;
    }
    
    const labels = serie.map(s => s.t);
    const robertoData = serie.map(s => s.a);
    const keikoData = serie.map(s => s.b);
    
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Keiko Fujimori',
            data: keikoData,
            borderColor: '#ff7c44',
            backgroundColor: 'rgba(255, 124, 68, 0.03)',
            borderWidth: 3,
            tension: 0.25,
            pointRadius: 4,
            pointBackgroundColor: '#ff7c44',
            fill: true
          },
          {
            label: 'Roberto Sánchez',
            data: robertoData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.03)',
            borderWidth: 3,
            tension: 0.25,
            pointRadius: 4,
            pointBackgroundColor: '#10b981',
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.02)' },
            ticks: { color: '#9ca3af', font: { family: 'Roboto', size: 9 } }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.02)' },
            ticks: {
              color: '#9ca3af',
              font: { family: 'Roboto' },
              callback: function(val) { return val.toFixed(3) + '%'; }
            }
          }
        },
        plugins: {
          legend: {
            labels: { color: '#f3f4f6', font: { family: 'Open Sans', weight: '600' } }
          },
          tooltip: {
            backgroundColor: '#0c1222',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            padding: 12,
            titleFont: { family: 'Open Sans', weight: '700' },
            bodyFont: { family: 'Roboto' },
            callbacks: {
              label: function(context) {
                return ` ${context.dataset.label}: ${context.raw.toFixed(3)}%`;
              }
            }
          }
        }
      }
    });
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [serie]);

  return <canvas ref={chartRef}></canvas>;
}
