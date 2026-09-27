'use client';

// "시간 분석" 섹션: 오늘 순공 vs 비공부 시간, 최근 7일 평균, 과목별 구성

import { fmtKorean, pct } from '@/lib/format';
import type { DashboardData } from '@/lib/types';

export default function GapSection({ data }: { data: DashboardData }) {
  const { overview: ov, subjects, daily } = data;

  const study = ov.today_study_seconds;
  const pause = ov.today_pause_seconds;
  const total = study + pause;
  const sp = pct(study, total);
  const pp = 100 - sp;

  const week7 = daily.slice(-8, -1);
  const avg7Study = week7.length
    ? Math.round(week7.reduce((a, d) => a + d.total_study_seconds, 0) / week7.length)
    : 0;
  const avg7Pause = week7.length
    ? Math.round(week7.reduce((a, d) => a + (d.total_pause_seconds || 0), 0) / week7.length)
    : 0;
  const avg7Total = avg7Study + avg7Pause;
  const avg7Sp = pct(avg7Study, avg7Total);
  const avg7Pp = 100 - avg7Sp;
  const studyDiff = Math.round(study / 60) - Math.round(avg7Study / 60);

  const activeSubjects = subjects.filter((s) => s.today_study_minutes > 0);

  return (
    <div className="section">
      <div className="section-title">시간 분석</div>
      <div className="dash-card">
        <div style={{ fontSize: '.8rem', color: '#94a3b8', marginBottom: 8 }}>오늘 순공 vs 비공부 시간</div>
        <div className="gap-bar">
          <div className="seg" style={{ width: `${sp}%`, background: '#22c55e' }}>{sp}% 순공</div>
          <div className="seg" style={{ width: `${pp}%`, background: '#334155' }}>{pp > 5 ? `${pp}% 갭` : ''}</div>
        </div>
        <div className="gap-legend">
          <div className="gl"><span className="gd" style={{ background: '#22c55e' }} />순공 {fmtKorean(study)}</div>
          <div className="gl"><span className="gd" style={{ background: '#334155' }} />쉬는시간 {fmtKorean(pause)}</div>
        </div>

        <div style={{ fontSize: '.8rem', color: '#94a3b8', margin: '14px 0 8px' }}>최근 7일 평균</div>
        <div className="gap-bar">
          <div className="seg" style={{ width: `${avg7Sp}%`, background: '#22c55e88' }}>{avg7Sp}% 순공</div>
          <div className="seg" style={{ width: `${avg7Pp}%`, background: '#334155' }}>{avg7Pp > 5 ? `${avg7Pp}% 갭` : ''}</div>
        </div>
        <div className="gap-legend">
          <div className="gl"><span className="gd" style={{ background: '#22c55e88' }} />순공 {fmtKorean(avg7Study)}</div>
          <div className="gl"><span className="gd" style={{ background: '#334155' }} />쉬는시간 {fmtKorean(avg7Pause)}</div>
          <div className="gl" style={{ color: studyDiff >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
            오늘 {studyDiff >= 0 ? '+' : ''}{studyDiff}분
          </div>
        </div>

        <div style={{ fontSize: '.8rem', color: '#94a3b8', margin: '14px 0 8px' }}>오늘 과목별 순공시간 구성</div>
        <div className="gap-bar">
          {activeSubjects.length === 0 ? (
            <div className="seg" style={{ width: '100%', background: '#1e293b', color: '#475569' }}>기록 없음</div>
          ) : (
            activeSubjects.map((s) => {
              const w = pct(s.today_study_minutes * 60, study);
              return (
                <div className="seg" key={s.name} style={{ width: `${w}%`, background: s.color }}>
                  {w > 8 ? s.name : ''}
                </div>
              );
            })
          )}
        </div>
        <div className="gap-legend">
          {activeSubjects.map((s) => (
            <div className="gl" key={s.name}>
              <span className="gd" style={{ background: s.color }} />
              {s.name} {s.today_study_minutes}분
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
