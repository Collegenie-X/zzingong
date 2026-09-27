'use client';

// "AI 학습 보고서" 섹션 (원본 dashboard.js renderReport 포팅)

import { useMemo } from 'react';
import type { ChartConfiguration } from 'chart.js/auto';
import { WEEKDAYS, dateLabel, pct } from '@/lib/format';
import type { DailyStat, DashboardData } from '@/lib/types';
import ChartCanvas from './ChartCanvas';
import { getClassAvg } from './utils';

interface Props {
  data: DashboardData;
  sliced: DailyStat[];
  dates: string[];
  curPeriod: number;
}

export default function ReportSection({ data, sliced, dates, curPeriod }: Props) {
  const { overview: ov, subjects, class_avg: ca } = data;
  const cs = ca.class_size || 20;

  const studyMin = Math.round(ov.today_study_seconds / 60);
  const pauseMin = Math.round(ov.today_pause_seconds / 60);
  const focus = ov.today_focus_rate;
  const done = ov.subjects_done;

  const periodMyMin = Math.round(sliced.reduce((a, d) => a + d.total_study_seconds, 0) / 60);
  const periodAvgMin = Math.round(dates.reduce((a, d) => a + (ca.daily?.[d]?.avg_study_minutes ?? 0), 0));
  const periodTopMin = Math.round(dates.reduce((a, d) => a + (ca.daily?.[d]?.top_study_minutes ?? 0), 0));
  const rank =
    periodMyMin >= periodTopMin ? 1 : periodMyMin >= periodAvgMin ? Math.round(cs * 0.35) : Math.round(cs * 0.65);
  const topPct = Math.round((rank / cs) * 100);

  let grade: string, gradeColor: string, gradeEmoji: string;
  if (rank <= 3) [grade, gradeColor, gradeEmoji] = ['A+', '#22c55e', '🤩'];
  else if (rank <= cs * 0.3) [grade, gradeColor, gradeEmoji] = ['A', '#22c55e', '😎'];
  else if (rank <= cs * 0.5) [grade, gradeColor, gradeEmoji] = ['B', '#3b82f6', '💪'];
  else if (rank <= cs * 0.7) [grade, gradeColor, gradeEmoji] = ['C', '#f59e0b', '🤔'];
  else [grade, gradeColor, gradeEmoji] = ['D', '#ef4444', '😢'];

  const subjData = subjects.map((s) => {
    const myM = Math.round(
      sliced.reduce((a, d) => a + (d.by_subject[s.name]?.study_seconds ?? 0), 0) / 60,
    );
    const avgM = Math.round(getClassAvg(ca, dates, s.name).reduce((a, b) => a + b, 0));
    const diff = myM - avgM;
    const ratio = avgM > 0 ? Math.round((myM / avgM) * 100) : 0;
    const goalT = s.goal_minutes * curPeriod;
    const achv = goalT > 0 ? Math.round((myM / goalT) * 100) : 0;
    let status: string, sColor: string;
    if (ratio >= 150) [status, sColor] = ['최상', '#22c55e'];
    else if (ratio >= 100) [status, sColor] = ['양호', '#22c55e'];
    else if (ratio >= 70) [status, sColor] = ['부족', '#f59e0b'];
    else [status, sColor] = ['위험', '#ef4444'];
    return { name: s.name, color: s.color, myM, avgM, diff, ratio, achv, status, sColor };
  });

  const weakSubjs = subjData.filter((s) => s.ratio < 100);
  const strongSubjs = subjData.filter((s) => s.ratio >= 120);

  const week7 = sliced.slice(-7);
  const trend3 = week7.slice(-3).map((d) => Math.round(d.total_study_seconds / 60));
  const isUp = trend3.length >= 3 && trend3[2] >= trend3[0];
  const weekAvg = Math.round(week7.reduce((a, d) => a + d.total_study_seconds, 0) / 7 / 60);

  const today = new Date();
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 (${WEEKDAYS[today.getDay()]})`;

  // ── 보고서 차트 4종 ──
  const w7 = week7;
  const w7dates = w7.map((d) => d.date);
  const w7labels = w7dates.map(dateLabel);

  const smallScale = (unit: string) => ({
    x: { ticks: { color: '#475569', font: { size: 9 } }, grid: { display: false } },
    y: {
      beginAtZero: true,
      ticks: { color: '#475569', callback: (v: unknown) => `${v}${unit}`, font: { size: 9 } },
      grid: { color: 'rgba(255,255,255,.04)' },
    },
  });

  const trendConfig = useMemo<ChartConfiguration>(
    () => ({
      type: 'line',
      data: {
        labels: w7labels,
        datasets: [
          { label: '나', data: w7.map((d) => Math.round(d.total_study_seconds / 60)), borderColor: '#e94560', backgroundColor: 'rgba(233,69,96,.1)', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 3, pointBackgroundColor: '#e94560' },
          { label: '반 평균', data: getClassAvg(ca, w7dates, 'all'), borderColor: '#3b82f6', borderWidth: 2, borderDash: [5, 5], fill: false, tension: 0.3, pointRadius: 3, pointBackgroundColor: '#3b82f6' },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 }, padding: 8 } },
          tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.raw}분` } },
        },
        scales: smallScale('분'),
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, curPeriod],
  );

  const compareConfig = useMemo<ChartConfiguration>(
    () => ({
      type: 'bar',
      data: {
        labels: subjData.map((s) => s.name),
        datasets: [
          { label: '나', data: subjData.map((s) => s.myM), backgroundColor: subjData.map((s) => s.color + 'cc'), borderRadius: 4 },
          { label: '반 평균', data: subjData.map((s) => s.avgM), backgroundColor: '#3b82f666', borderRadius: 4 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 }, padding: 8 } },
          tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.raw}분` } },
        },
        scales: {
          x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { display: false } },
          y: { beginAtZero: true, ticks: { color: '#475569', callback: (v) => `${v}분`, font: { size: 9 } }, grid: { color: 'rgba(255,255,255,.04)' } },
        },
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, curPeriod],
  );

  const achieveConfig = useMemo<ChartConfiguration>(
    () => ({
      type: 'bar',
      data: {
        labels: subjData.map((s) => s.name),
        datasets: [
          {
            data: subjData.map((s) => Math.min(s.achv, 150)),
            backgroundColor: subjData.map((s) => (s.achv >= 100 ? '#22c55ecc' : s.achv >= 70 ? '#f59e0bcc' : '#ef4444cc')),
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${c.raw}% 달성` } } },
        scales: {
          x: { beginAtZero: true, max: 150, ticks: { color: '#475569', callback: (v) => `${v}%`, font: { size: 9 } }, grid: { color: 'rgba(255,255,255,.04)' } },
          y: { ticks: { color: '#cbd5e1', font: { size: 10 } }, grid: { display: false } },
        },
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, curPeriod],
  );

  const subjTrendConfig = useMemo<ChartConfiguration>(
    () => ({
      type: 'line',
      data: {
        labels: w7labels,
        datasets: subjects.map((s) => ({
          label: s.name,
          data: w7.map((d) => Math.round((d.by_subject[s.name]?.study_seconds ?? 0) / 60)),
          borderColor: s.color, borderWidth: 2, fill: false, tension: 0.3, pointRadius: 2, pointBackgroundColor: s.color,
        })),
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 }, padding: 8 } },
          tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.raw}분` } },
        },
        scales: smallScale('분'),
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, curPeriod],
  );

  return (
    <div className="section">
      <div className="section-title">AI 학습 보고서</div>
      <div className="report">
        <div className="rpt-hdr">
          <div className="rh-row">
            <div className="rh-title">AI 학습 분석 보고서</div>
            <div className="rh-date">{dateStr}</div>
          </div>
          <div className="rh-sub">반 {cs}명 기준 | 분석 기간: {curPeriod}일</div>
        </div>
        <div className="rpt-body">
          {/* 1. 종합 평가 */}
          <div className="rpt-sec">
            <div className="rpt-sec-title">1. 종합 평가</div>
            <div className="grade-banner">
              <div className="gb-left">
                <span className="gb-char">{gradeEmoji}</span>
                <div className="gb-grade" style={{ color: gradeColor }}>{grade}</div>
                <div className="gb-title">{cs}명 중 {rank}등 (상위 {topPct}%)</div>
              </div>
              <div className="gb-right">
                <div className="gb-rank" style={{ color: gradeColor }}>
                  {grade === 'A+' || grade === 'A'
                    ? '우수한 학습 성과'
                    : grade === 'B'
                      ? '평균 이상, 상위권 도전 가능'
                      : grade === 'C'
                        ? '분발이 필요한 시기'
                        : '즉각적인 학습량 개선 필요'}
                </div>
                <div className="gb-msg">
                  {curPeriod}일간 총 <strong>{periodMyMin}분</strong> 공부 (일 평균 {Math.round(periodMyMin / curPeriod)}분). 반 평균 {periodAvgMin}분 대비{' '}
                  <strong style={{ color: periodMyMin >= periodAvgMin ? '#22c55e' : '#ef4444' }}>
                    {periodMyMin >= periodAvgMin ? '+' : ''}{periodMyMin - periodAvgMin}분 (
                    {periodAvgMin > 0
                      ? `${periodMyMin >= periodAvgMin ? '+' : ''}${Math.round(((periodMyMin - periodAvgMin) / periodAvgMin) * 100)}%`
                      : '--'}
                    )
                  </strong>
                  . {isUp ? '최근 학습량 상승 추세로 긍정적입니다.' : '최근 학습량이 감소 추세이므로 학습 루틴 점검이 필요합니다.'}
                </div>
              </div>
            </div>
            <div className="kpi-row">
              {[
                { v: `${studyMin}분`, l: '오늘 순공', c: '#22c55e', w: Math.min((studyMin / 180) * 100, 100) },
                { v: `${pauseMin}분`, l: '비공부 시간', c: '#ef4444', w: Math.min((pauseMin / 60) * 100, 100) },
                { v: `${focus}%`, l: '집중률', c: '#f59e0b', w: focus },
                { v: `${done}/${ov.subjects_total}`, l: '목표 달성', c: '#8b5cf6', w: pct(done, ov.subjects_total) },
                { v: `${weekAvg}분`, l: '주간 일평균', c: '#06b6d4', w: Math.min((weekAvg / 120) * 100, 100) },
              ].map((k) => (
                <div className="kpi" key={k.l}>
                  <div className="kv" style={{ color: k.c }}>{k.v}</div>
                  <div className="kl">{k.l}</div>
                  <div className="kb"><div className="kf" style={{ width: `${k.w}%`, background: k.c }} /></div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. 학습 추이 그래프 */}
          <div className="rpt-sec">
            <div className="rpt-sec-title">2. 학습 추이 그래프</div>
            <div className="rpt-charts">
              {[
                { t: '일별 나 vs 반 평균 추이 (최근 7일)', cfg: trendConfig },
                { t: '과목별 나 vs 반 평균 비교', cfg: compareConfig },
                { t: '과목별 목표 달성률', cfg: achieveConfig },
                { t: '과목별 학습 추이 (최근 7일)', cfg: subjTrendConfig },
              ].map((c) => (
                <div className="rpt-chart-card" key={c.t}>
                  <div className="rcc-title">{c.t}</div>
                  <div className="rpt-chart-area"><ChartCanvas config={c.cfg} /></div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. 과목별 상세 분석 */}
          <div className="rpt-sec">
            <div className="rpt-sec-title">3. 과목별 상세 분석</div>
            <table className="rpt-table">
              <thead>
                <tr>
                  <th>과목</th><th>나</th><th>반 평균</th><th>차이</th><th>달성률</th>
                  <th className="prog">대비</th><th>상태</th>
                </tr>
              </thead>
              <tbody>
                {subjData.map((s) => (
                  <tr key={s.name}>
                    <td><span className="sd" style={{ background: s.color }} />{s.name}</td>
                    <td><strong>{s.myM}분</strong></td>
                    <td>{s.avgM}분</td>
                    <td style={{ color: s.diff >= 0 ? '#22c55e' : '#ef4444' }}>{s.diff >= 0 ? '+' : ''}{s.diff}분</td>
                    <td>{s.achv}%</td>
                    <td className="prog">
                      <div className="prog-bg">
                        <div className="prog-fill" style={{ width: `${Math.min(s.ratio, 100)}%`, background: s.ratio >= 100 ? '#22c55e' : '#ef4444' }} />
                      </div>
                      <div style={{ fontSize: '.6rem', color: '#64748b', marginTop: 2 }}>{s.ratio}%</div>
                    </td>
                    <td>
                      <span className="status-pill" style={{ background: `${s.sColor}22`, color: s.sColor }}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 4. AI 종합 코멘트 */}
          <div className="rpt-sec">
            <div className="rpt-sec-title">4. AI 종합 코멘트</div>
            <div className="ai-box">
              <div className="ai-title"><span style={{ fontSize: '.9rem' }}>AI 학습 코치</span></div>
              <div className="ai-p">
                <strong>종합 성적:</strong> 반 {cs}명 중 <strong style={{ color: gradeColor }}>{rank}등 ({grade})</strong>. {curPeriod}일간 총 <strong>{periodMyMin}분</strong> 공부하여 반 평균({periodAvgMin}분) 대비{' '}
                <span className={periodMyMin >= periodAvgMin ? 'up' : 'dn'}>
                  {periodMyMin >= periodAvgMin ? '+' : ''}{periodMyMin - periodAvgMin}분
                </span>.
              </div>
              {strongSubjs.length > 0 && (
                <div className="ai-p">
                  <strong>강점 과목:</strong>{' '}
                  {strongSubjs.map((s, i) => (
                    <span key={s.name}>
                      {i > 0 && ', '}
                      <strong style={{ color: s.color }}>{s.name}</strong>(반 평균의 {s.ratio}%)
                    </span>
                  ))}
                  . 해당 과목의 학습 방법을 약한 과목에도 적용하면 효과적입니다.
                </div>
              )}
              {weakSubjs.length > 0 && (
                <div className="ai-p">
                  <strong>보강 과목:</strong>{' '}
                  {weakSubjs.map((s, i) => (
                    <span key={s.name}>
                      {i > 0 && ', '}
                      <strong style={{ color: s.color }}>{s.name}</strong>({Math.abs(s.diff)}분 부족)
                    </span>
                  ))}
                  . {weakSubjs.length === 1 ? '해당 과목에' : '이 과목들에'} 하루 평균{' '}
                  <strong>
                    {Math.round(weakSubjs.reduce((a, s) => a + Math.abs(s.diff), 0) / weakSubjs.length / Math.max(curPeriod, 1))}분
                  </strong>
                  씩 추가 투자하면 반 평균에 도달할 수 있습니다.
                </div>
              )}
              <div className="ai-p">
                <strong>집중력:</strong>{' '}
                {focus >= 90 ? (
                  <>집중률 <span className="up">{focus}%</span>로 매우 우수합니다.</>
                ) : focus >= 70 ? (
                  <>집중률 {focus}%로 양호합니다. 휴식 관리를 개선하면 더 효율적인 학습이 가능합니다.</>
                ) : (
                  <>집중률 <span className="warn">{focus}%</span>로 개선이 필요합니다. 포모도로 기법(25분 공부 + 5분 휴식)을 권장합니다.</>
                )}
              </div>
              <div className="ai-p">
                <strong>추세:</strong>{' '}
                {isUp ? (
                  <>최근 학습량이 <span className="up">상승 추세</span>입니다. 현재 페이스를 유지하면 순위 상승이 기대됩니다.</>
                ) : (
                  <>최근 학습량이 <span className="dn">감소 추세</span>입니다. 고정된 학습 시간대를 설정하여 루틴을 만들어보세요.</>
                )}
              </div>
              <div className="ai-hr" />
              <div className="ai-p" style={{ fontStyle: 'italic', color: '#94a3b8' }}>
                &ldquo;
                {grade === 'A+' || grade === 'A'
                  ? '꾸준한 노력이 빛나고 있습니다. 약한 과목 보완에 집중하세요.'
                  : grade === 'B'
                    ? '평균 이상의 학습량입니다. 약한 과목에 10~15분만 더 투자하면 상위권 진입이 가능합니다.'
                    : grade === 'C'
                      ? '반 평균과의 격차를 좁히는 것이 우선입니다. 매일 꾸준히 하는 습관부터 만들어보세요.'
                      : '작은 목표부터 달성하며 자신감을 쌓아가세요. 하루 30분부터 시작해봅시다.'}
                &rdquo;
              </div>
            </div>
          </div>

          {/* 5. 맞춤 학습 제안 */}
          <div className="rpt-sec">
            <div className="rpt-sec-title">5. 맞춤 학습 제안</div>
            <div className="tip-grid">
              {weakSubjs.map((s) => (
                <div className="tip-card" key={`w-${s.name}`}>
                  <div className="tc-head" style={{ color: s.sColor }}>{s.name} 보강 필요</div>
                  <div className="tc-body">
                    반 평균 대비 <strong>{Math.abs(s.diff)}분</strong> 부족. 매일{' '}
                    <strong>{Math.round(Math.abs(s.diff) / Math.max(curPeriod, 1))}분</strong> 추가하면 평균에 도달합니다.
                  </div>
                </div>
              ))}
              {strongSubjs.map((s) => (
                <div className="tip-card" key={`s-${s.name}`}>
                  <div className="tc-head" style={{ color: '#22c55e' }}>{s.name} 우수</div>
                  <div className="tc-body">
                    반 평균의 <strong>{s.ratio}%</strong> 달성. 이 과목의 학습법을 다른 과목에 적용해보세요.
                  </div>
                </div>
              ))}
              {!isUp && (
                <div className="tip-card">
                  <div className="tc-head" style={{ color: '#f59e0b' }}>학습량 추세 관리</div>
                  <div className="tc-body">최근 3일 학습량 감소. 고정 시간대를 정하고 루틴을 만들어보세요.</div>
                </div>
              )}
              {pauseMin > studyMin * 0.15 && (
                <div className="tip-card">
                  <div className="tc-head" style={{ color: '#f59e0b' }}>휴식 관리</div>
                  <div className="tc-body">비공부 시간 비율이 높습니다. 포모도로 기법(25분 공부 + 5분 휴식)을 추천합니다.</div>
                </div>
              )}
              {weakSubjs.length === 0 && isUp && (
                <div className="tip-card">
                  <div className="tc-head" style={{ color: '#22c55e' }}>우수한 학습 패턴</div>
                  <div className="tc-body">모든 과목이 반 평균 이상이며 학습량도 상승 중입니다. 현재 페이스를 유지하세요.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
