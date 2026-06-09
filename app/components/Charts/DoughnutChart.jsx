"use client";

import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function DoughnutChart({ data }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!data || !chartRef.current) return;
    
    const ctx = chartRef.current.getContext('2d');
    
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // External HTML tooltip — bypasses canvas completely, fully opaque
    const getOrCreateTooltip = () => {
      let el = document.getElementById('donut-tooltip-el');
      if (!el) {
        el = document.createElement('div');
        el.id = 'donut-tooltip-el';
        document.body.appendChild(el);
      }
      return el;
    };

    const externalTooltipHandler = (context) => {
      const { chart, tooltip } = context;
      const el = getOrCreateTooltip();

      if (tooltip.opacity === 0) {
        el.style.opacity = '0';
        return;
      }

      const dataIdx = tooltip.dataPoints?.[0]?.dataIndex ?? 0;
      const isKeiko = dataIdx === 0;
      const label = isKeiko ? 'Keiko Fujimori' : 'Roberto Sánchez';
      const pct = (isKeiko ? data.keikoPct : data.robertoPct).toFixed(3);
      const votes = (isKeiko ? data.keiko : data.roberto).toLocaleString('es-PE');
      const color = isKeiko ? '#ff7c44' : '#10b981';

      el.innerHTML = `
        <div style="font-family:'Open Sans',sans-serif;font-weight:700;font-size:12px;color:${color};margin-bottom:5px;text-transform:uppercase;letter-spacing:0.03em;">${label}</div>
        <div style="font-family:'Open Sans',sans-serif;font-weight:800;font-size:18px;color:#f9fafb;line-height:1;">${pct}%</div>
        <div style="font-family:'Roboto',sans-serif;font-size:12px;color:#9ca3af;margin-top:4px;">${votes} votos</div>
      `;

      const rect = chart.canvas.getBoundingClientRect();
      el.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 99999;
        opacity: 1;
        background: #080c14;
        border: 1px solid rgba(255,255,255,0.18);
        border-radius: 12px;
        padding: 14px 18px;
        white-space: nowrap;
        box-shadow: 0 12px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04);
        transition: opacity 0.12s ease;
        left: ${rect.left + tooltip.caretX}px;
        top: ${rect.top + tooltip.caretY}px;
        transform: translate(-50%, -115%);
      `;
    };
    
    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Keiko Fujimori', 'Roberto Sánchez'],
        datasets: [{
          data: [data.keikoPct, data.robertoPct],
          backgroundColor: ['#ff7c44', '#10b981'],
          borderWidth: 2,
          borderColor: '#030303',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '76%',
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: false,
            external: externalTooltipHandler,
          }
        }
      }
    });
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
      const el = document.getElementById('donut-tooltip-el');
      if (el) el.style.opacity = '0';
    };
  }, [data]);

  return <canvas ref={chartRef}></canvas>;
}
