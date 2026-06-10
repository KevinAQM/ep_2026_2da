"use client";

import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function NationalTrendChart({ history, currentTab }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!history || !chartRef.current) return;
    const ctx = chartRef.current.getContext('2d');

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    if (history.length === 0) {
      ctx.clearRect(0, 0, 300, 200);
      ctx.font = '14px Roboto';
      ctx.fillStyle = '#6b7280';
      ctx.textAlign = 'center';
      ctx.fillText('No hay historial de proyecciones grabado aún.', 150, 100);
      return;
    }

    // Process history data points based on selected tab
    const labels = history.map(h => h.time_display);
    
    let keikoProj = [];
    let robertoProj = [];
    let keikoCurr = [];
    let robertoCurr = [];

    if (currentTab === 'peru') {
      keikoProj = history.map(h => h.projected_keiko_pct ?? 50.0);
      robertoProj = history.map(h => h.projected_roberto_pct ?? 50.0);
      keikoCurr = history.map(h => h.current_keiko_pct ?? 50.0);
      robertoCurr = history.map(h => h.current_roberto_pct ?? 50.0);
    } else {
      // Extranjero
      history.forEach(h => {
        const projVal = (h.ex_projected_keiko || 0) + (h.ex_projected_roberto || 0);
        const currVal = (h.ex_current_keiko || 0) + (h.ex_current_roberto || 0);
        
        keikoProj.push(projVal > 0 ? (h.ex_projected_keiko / projVal * 100) : 50.0);
        robertoProj.push(projVal > 0 ? (h.ex_projected_roberto / projVal * 100) : 50.0);
        
        keikoCurr.push(currVal > 0 ? (h.ex_current_keiko / currVal * 100) : 50.0);
        robertoCurr.push(currVal > 0 ? (h.ex_current_roberto / currVal * 100) : 50.0);
      });
    }

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Keiko Proyectado (EMA)',
            data: keikoProj,
            borderColor: '#ff7c44',
            backgroundColor: 'transparent',
            borderWidth: 3,
            tension: 0.2,
            pointRadius: 3,
            pointBackgroundColor: '#ff7c44',
          },
          {
            label: 'Keiko Oficial ONPE',
            data: keikoCurr,
            borderColor: 'rgba(255, 124, 68, 0.45)',
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderDash: [5, 5],
            tension: 0.2,
            pointRadius: 2,
            pointBackgroundColor: 'rgba(255, 124, 68, 0.6)',
          },
          {
            label: 'Roberto Proyectado (EMA)',
            data: robertoProj,
            borderColor: '#10b981',
            backgroundColor: 'transparent',
            borderWidth: 3,
            tension: 0.2,
            pointRadius: 3,
            pointBackgroundColor: '#10b981',
          },
          {
            label: 'Roberto Oficial ONPE',
            data: robertoCurr,
            borderColor: 'rgba(16, 185, 129, 0.45)',
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderDash: [5, 5],
            tension: 0.2,
            pointRadius: 2,
            pointBackgroundColor: 'rgba(16, 185, 129, 0.6)',
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
              callback: function(val) { return val.toFixed(2) + '%'; }
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#f3f4f6',
              boxWidth: 12,
              font: { family: 'Open Sans', weight: '600', size: 10 }
            }
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
  }, [history, currentTab]);

  return <canvas ref={chartRef}></canvas>;
}
