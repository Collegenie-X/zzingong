'use client';

// 대시보드 페이지 — 개인 기록보다 "반 친구들 사이에서 나의 위치"를 한눈에 보여줍니다.

import { useCallback, useEffect, useMemo, useState } from 'react';
import StudentBar from '@/components/StudentBar';
import AiReport from '@/components/dashboard/AiReport';
import CoachTips from '@/components/dashboard/CoachTips';
import RankHero from '@/components/dashboard/RankHero';
import StandingList, { type StandingRow } from '@/components/dashboard/StandingList';
import WeekRanks from '@/components/dashboard/WeekRanks';
import { standing, type Metric } from '@/components/dashboard/rank';
import { useSelectedStudent } from '@/hooks/useSelectedStudent';
import { api } from '@/lib/api';
import type { DashboardData } from '@/lib/types';
import '@/styles/dashboard.css';

const PERIODS = [
  { d: 1, l: '오늘' },
  { d: 7, l: '1주' },
  { d: 30, l: '1달' },
  { d: 90, l: '3달' },
];

export default function DashboardPage() {
  const [studentId, setStudentId] = useSelectedStudent();
  const [data, setData] = useState<DashboardData | null>(null);
  const [period, setPeriod] = useState(7);

  const load = useCallback(async () => {
    setData(await api.getDashboard(90, studentId));
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  // 대시보드 페이지에서는 어두운 배경 톤 적용
  useEffect(() => {
    document.body.classList.add('dash-body');
    return () => document.body.classList.remove('dash-body');
  }, []);

  const view = useMemo(() => {
    if (!data) return null;
    const dates = data.daily.slice(-period).map((d) => d.date);
    const row = (key: string, label: string, metric: Metric, unit: StandingRow['unit'], color?: string): StandingRow | null => {
      const st = standing(data.peers, dates, metric);
      return st ? { key, label, unit, color, st } : null;
    };
    const total = row('study', '순공 시간', 'study', 'min');
    if (!total) return null;
    const habits = [
      total,
      row('focus', '집중률', 'focus', 'pct'),
      period > 1 ? row('days', '공부한 날', 'days', 'day') : null,
    ].filter((r): r is StandingRow => !!r);
    const subjects = data.subjects
      .map((s) => row(s.name, s.name, { subj: s.name }, 'min', s.color))
      .filter((r): r is StandingRow => !!r);
    return { total, habits, subjects, dates, week: data.daily.slice(-7).map((d) => d.date) };
  }, [data, period]);

  return (
    <>
      <StudentBar studentId={studentId} onChange={setStudentId} onMutate={load} />
      <div className="dash-main">
        {!data ? (
          <div className="dash-empty">불러오는 중...</div>
        ) : !view ? (
          <div className="dash-empty">학생을 선택하면 반 친구들과 비교한 나의 위치를 보여드려요.</div>
        ) : (
          <>
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
            <RankHero st={view.total.st} periodLabel={PERIODS.find((p) => p.d === period)!.l} days={period} />
            <CoachTips total={view.total} subjects={view.subjects} days={period} />
            <StandingList title="공부 습관 순위" rows={view.habits} />
            <StandingList title="과목별 순위" rows={view.subjects} />
            <WeekRanks peers={data.peers} dates={view.week} />
            <AiReport
              data={data}
              dates={view.dates}
              periodLabel={PERIODS.find((p) => p.d === period)!.l}
              total={view.total}
              subjects={view.subjects}
            />
          </>
        )}
      </div>
    </>
  );
}
