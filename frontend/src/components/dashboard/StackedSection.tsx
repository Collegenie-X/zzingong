'use client';

// "과목별 일별 누적" 스택 막대 차트 섹션

import { useMemo, useState } from 'react';
import type { ChartConfiguration } from 'chart.js/auto';
import { WEEKDAYS, dateLabel } from '@/lib/format';
import type { DashboardData } from '@/lib/types';
import ChartCanvas from './ChartCanvas';

const PERIODS = [
  { d: 1, l: '일별' },
  { d: 7, l: '주별' },
  { d: 30, l: '월별' },
];

export default function StackedSection({ data }: { data: DashboardData }) {
  const [period, setPeriod] = useState(7);
  const { subjects, daily } = data;

  const config = useMemo<ChartConfiguration>(() => {
    const sliced = daily.slice(-Math.max(period, 1));
    const labels =
      period === 7
        ? sliced.map((d) => {
            const dt = new Date(d.date + 'T00:00:00');
            return `${dt.getMonth() + 1}/${dt.getDate()}(${WEEKDAYS[dt.getDay()]})`;
          })
        : sliced.map((d) => dateLabel(d.date));
    return {
      type: 'bar',
      data: {
        labels,
        datasets: subjects.map((s) => ({
          label: s.name,
          data: sliced.map((d) => Math.round((d.by_subject[s.name]?.study_seconds ?? 0) / 60)),
          backgroundColor: s.color + 'cc',
          borderRadius: 2,
        })),
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            callbacks: {
              label: (c) => `${c.dataset.label}: ${c.raw}분`,
              footer: (items) => `합계: ${items.reduce((a, i) => a + (i.raw as number), 0)}분`,
            },
          },
        },
        scales: {
          x: { stacked: true, ticks: { color: '#475569', maxRotation: 45, font: { size: period === 30 ? 8 : 10 } }, grid: { display: false } },
          y: { stacked: true, beginAtZero: true, ticks: { color: '#475569', callback: (v) => `${v}분` }, grid: { color: 'rgba(255,255,255,.04)' } },
        },
      },
    };
  }, [daily, period, subjects]);

  return (
    <div className="section">
      <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>과목별 일별 누적</span>
        <div className="period-tabs">
          {PERIODS.map((p) => (
            <button
              key={p.d}
              className={`period-tab${period === p.d ? ' active' : ''}`}
              onClick={() => setPeriod(p.d)}
            >
              {p.l}
            </button>
          ))}
        </div>
      </div>
      <div className="dash-card">
        <div className="legend-row">
          {subjects.map((s) => (
            <div className="legend-item" key={s.name}>
              <div className="legend-dot" style={{ background: s.color }} />
              {s.name}
            </div>
          ))}
        </div>
        <div className="chart-area" style={{ height: 300 }}>
          <ChartCanvas config={config} />
        </div>
      </div>
    </div>
  );
}
