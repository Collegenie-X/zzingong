'use client';

// "나 vs 반 평균 비교" 섹션: 추이 차트 / 과목별 막대 / 레이더 / 반 내 위치

import { useMemo } from 'react';
import type { ChartConfiguration } from 'chart.js/auto';
import { dateLabel } from '@/lib/format';
import type { DailyStat, DashboardData } from '@/lib/types';
import ChartCanvas from './ChartCanvas';
import { getClassAvg, getClassTop, myPeriodMinutes } from './utils';

interface Props {
  data: DashboardData;
  sliced: DailyStat[];
  dates: string[];
  curSubj: string;
  curPeriod: number;
  onSelectSubj: (name: string) => void;
  onSelectPeriod: (days: number) => void;
}

const PERIODS = [
  { d: 1, l: '1일' },
  { d: 7, l: '1주' },
  { d: 30, l: '1달' },
  { d: 90, l: '3달' },
];

export default function CompareSection({
  data,
  sliced,
  dates,
  curSubj,
  curPeriod,
  onSelectSubj,
  onSelectPeriod,
}: Props) {
  const { subjects, class_avg: ca } = data;

  // ── 일별 나 vs 반 평균 (기간 짧으면 막대, 길면 라인) ──
  const compareConfig = useMemo<ChartConfiguration>(() => {
    const isAll = curSubj === 'all';
    const myData = sliced.map((d) =>
      isAll
        ? Math.round(d.total_study_seconds / 60)
        : Math.round((d.by_subject[curSubj]?.study_seconds ?? 0) / 60),
    );
    const avgData = getClassAvg(ca, dates, curSubj);
    const labels = dates.map(dateLabel);
    const useBar = curPeriod <= 7;
    return {
      type: useBar ? 'bar' : 'line',
      data: {
        labels,
        datasets: [
          {
            label: '나', data: myData,
            backgroundColor: '#e9456099', borderColor: '#e94560',
            borderWidth: useBar ? 0 : 2, borderRadius: useBar ? 4 : 0,
            fill: !useBar && 'origin', tension: 0.3,
            pointRadius: useBar ? 0 : curPeriod <= 30 ? 3 : 0,
            pointBackgroundColor: '#e94560', order: 1,
          },
          {
            label: '반 평균', data: avgData,
            backgroundColor: '#3b82f655', borderColor: '#3b82f6',
            borderWidth: useBar ? 0 : 2, borderRadius: useBar ? 4 : 0,
            fill: !useBar && 'origin', tension: 0.3,
            pointRadius: useBar ? 0 : curPeriod <= 30 ? 3 : 0,
            pointBackgroundColor: '#3b82f6', borderDash: useBar ? [] : [5, 5], order: 2,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.raw}분` } },
        },
        scales: {
          x: { ticks: { color: '#475569', maxRotation: 0, autoSkip: true, maxTicksLimit: curPeriod <= 7 ? 7 : 10 }, grid: { display: false } },
          y: { beginAtZero: true, ticks: { color: '#475569', callback: (v) => `${v}분` }, grid: { color: 'rgba(255,255,255,.04)' } },
        },
      },
    };
  }, [ca, curPeriod, curSubj, dates, sliced]);

  // ── 과목별 나 vs 반 평균 막대 ──
  const subjBarConfig = useMemo<ChartConfiguration>(() => {
    const myMins = subjects.map((s) => myPeriodMinutes(sliced, s.name));
    const avgMins = subjects.map((s) =>
      Math.round(getClassAvg(ca, dates, s.name).reduce((a, b) => a + b, 0)),
    );
    return {
      type: 'bar',
      data: {
        labels: subjects.map((s) => s.name),
        datasets: [
          { label: '나', data: myMins, backgroundColor: subjects.map((s) => s.color + 'cc'), borderRadius: 4 },
          { label: '반 평균', data: avgMins, backgroundColor: '#3b82f666', borderRadius: 4 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } },
          tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.raw}분` } },
        },
        scales: {
          x: { beginAtZero: true, ticks: { color: '#475569', callback: (v) => `${v}분` }, grid: { color: 'rgba(255,255,255,.04)' } },
          y: { ticks: { color: '#cbd5e1' }, grid: { display: false } },
        },
      },
    };
  }, [ca, dates, sliced, subjects]);

  // ── 과목 균형 레이더 ──
  const radarConfig = useMemo<ChartConfiguration | null>(() => {
    if (subjects.length < 3) return null;
    const myPct = subjects.map((s) => {
      const t = myPeriodMinutes(sliced, s.name);
      return Math.min(Math.round((t / (s.goal_minutes * curPeriod)) * 100), 100);
    });
    const avgPct = subjects.map((s) => {
      const t = Math.round(getClassAvg(ca, dates, s.name).reduce((a, b) => a + b, 0));
      return Math.min(Math.round((t / (s.goal_minutes * curPeriod)) * 100), 100);
    });
    return {
      type: 'radar',
      data: {
        labels: subjects.map((s) => s.name),
        datasets: [
          { label: '나', data: myPct, backgroundColor: 'rgba(233,69,96,.15)', borderColor: '#e94560', pointBackgroundColor: '#e94560', borderWidth: 2 },
          { label: '반 평균', data: avgPct, backgroundColor: 'rgba(59,130,246,.1)', borderColor: '#3b82f6', pointBackgroundColor: '#3b82f6', borderWidth: 2, borderDash: [4, 4] },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true, max: 100,
            grid: { color: 'rgba(255,255,255,.06)' }, angleLines: { color: 'rgba(255,255,255,.06)' },
            pointLabels: { color: '#cbd5e1', font: { size: 11 } }, ticks: { display: false },
          },
        },
        plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } } },
      },
    };
  }, [ca, curPeriod, dates, sliced, subjects]);

  // ── 반 내 위치 랭크 바 ──
  const cs = ca.class_size || 20;
  const rankItems = [{ name: '전체', color: '#e94560' }, ...subjects.map((s) => ({ name: s.name, color: s.color }))];

  return (
    <div className="section">
      <div className="section-title">나 vs 반 평균 비교</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        <div className="subj-tabs">
          <button
            className={`subj-tab all${curSubj === 'all' ? ' active' : ''}`}
            onClick={() => onSelectSubj('all')}
          >
            전체
          </button>
          {subjects.map((s) => (
            <button
              key={s.name}
              className={`subj-tab${curSubj === s.name ? ' active' : ''}`}
              style={{ '--sc': s.color } as React.CSSProperties}
              onClick={() => onSelectSubj(s.name)}
            >
              {s.name}
            </button>
          ))}
        </div>
        <div className="period-tabs">
          {PERIODS.map((p) => (
            <button
              key={p.d}
              className={`period-tab${curPeriod === p.d ? ' active' : ''}`}
              onClick={() => onSelectPeriod(p.d)}
            >
              {p.l}
            </button>
          ))}
        </div>
      </div>

      <div className="dash-card">
        <div className="legend-row">
          <div className="legend-item"><div className="legend-dot" style={{ background: '#e94560' }} />나</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: '#3b82f6' }} />반 평균</div>
        </div>
        <div className="chart-area"><ChartCanvas config={compareConfig} /></div>
      </div>

      <div className="compare-grid">
        <div className="dash-card">
          <div style={{ fontSize: '.8rem', color: '#94a3b8', marginBottom: 10 }}>과목별 나 vs 반 평균 (분)</div>
          <div className="compare-chart"><ChartCanvas config={subjBarConfig} /></div>
        </div>
        <div className="dash-card">
          <div style={{ fontSize: '.8rem', color: '#94a3b8', marginBottom: 10 }}>과목 균형 비교</div>
          <div className="compare-chart">{radarConfig && <ChartCanvas config={radarConfig} />}</div>
        </div>
      </div>

      <div className="dash-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: '.85rem', color: '#94a3b8', fontWeight: 600 }}>반 {cs}명 중 나의 위치</div>
          <div style={{ display: 'flex', gap: 10, fontSize: '.6rem', color: '#64748b' }}>
            {[
              ['#22c55e', '상위'], ['#3b82f6', '중상'], ['#f59e0b', '중하'], ['#ef4444', '하위'],
            ].map(([c, l]) => (
              <span key={l}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: c, marginRight: 3 }} />
                {l}
              </span>
            ))}
            <span>
              <span style={{ display: 'inline-block', width: 8, height: 2, background: '#fbbf24', marginRight: 3, verticalAlign: 'middle' }} />
              평균
            </span>
          </div>
        </div>
        <div style={{ paddingTop: 6 }}>
          {rankItems.map((item) => {
            const isAll = item.name === '전체';
            const myMin = myPeriodMinutes(sliced, isAll ? 'all' : item.name);
            const avgMin = isAll
              ? Math.round(dates.reduce((a, d) => a + (ca.daily?.[d]?.avg_study_minutes ?? 0), 0))
              : Math.round(getClassAvg(ca, dates, item.name).reduce((a, b) => a + b, 0));
            const topMin = isAll
              ? Math.round(dates.reduce((a, d) => a + (ca.daily?.[d]?.top_study_minutes ?? 0), 0))
              : Math.round(getClassTop(ca, dates, item.name).reduce((a, b) => a + b, 0));
            const rank =
              myMin >= topMin ? 1
                : myMin >= avgMin ? Math.round(cs * 0.4)
                  : Math.min(Math.round(cs * (1 - (myMin / Math.max(avgMin, 1)) * 0.5)), cs);
            const pos = Math.round(((rank - 1) / (cs - 1)) * 100);
            const mePct = 100 - pos;
            const avgPos = Math.round(((Math.round(cs * 0.5) - 1) / (cs - 1)) * 100);
            const avgPct = 100 - avgPos;
            const diff = myMin - avgMin;
            const topZoneW = Math.round((100 * 5) / cs);
            const midZoneW = Math.round((100 * 10) / cs);
            return (
              <div className="rank-bar" key={item.name}>
                <div className="rb-label" style={{ color: item.color }}>{item.name}</div>
                <div className="rb-track">
                  <div
                    className="rb-fill"
                    style={{
                      width: '100%',
                      background: `linear-gradient(90deg,#22c55e22 0%,#22c55e22 ${topZoneW}%,#3b82f622 ${topZoneW}%,#3b82f622 ${topZoneW + midZoneW}%,#f59e0b15 ${topZoneW + midZoneW}%,#f59e0b15 70%,#ef444422 70%,#ef444422 100%)`,
                    }}
                  />
                  <div className="rb-avg-line" style={{ left: `${avgPct}%` }} />
                  <div className="rb-avg-label" style={{ left: `${avgPct}%` }}>평균</div>
                  <div
                    className="rb-me"
                    style={{ left: `calc(${mePct}% - 15px)` }}
                    title={`${rank}등/${cs}명 | 나: ${myMin}분 | 평균: ${avgMin}분`}
                  >
                    {rank}
                  </div>
                </div>
                <div className="rb-diff" style={{ color: diff >= 0 ? '#22c55e' : '#ef4444' }}>
                  {diff >= 0 ? '+' : ''}{diff}분
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
