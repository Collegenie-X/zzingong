'use client';

// 상단 요약 카드 5개 (오늘 순공 / 집중률 / 목표달성 / 기간 합계 / 반 평균 합계)

import { fmtKorean, fmtMin } from '@/lib/format';
import type { DailyStat, DashboardData } from '@/lib/types';
import { getClassAvg, myPeriodMinutes } from './utils';

interface Props {
  data: DashboardData;
  sliced: DailyStat[];
  dates: string[];
  curSubj: string;
}

export default function OverviewRow({ data, sliced, dates, curSubj }: Props) {
  const { overview: ov, class_avg: ca } = data;

  const myPeriodMin = myPeriodMinutes(sliced, curSubj);
  const avgPeriodMin = Math.round(getClassAvg(ca, dates, curSubj).reduce((a, b) => a + b, 0));
  const diff = myPeriodMin - avgPeriodMin;
  const diffPct = avgPeriodMin > 0 ? Math.round((diff / avgPeriodMin) * 100) : 0;

  const todayMin = Math.round(ov.today_study_seconds / 60);
  const todayAvg = ca.daily?.[dates[dates.length - 1]]?.avg_study_minutes ?? 0;
  const todayDiff = todayMin - todayAvg;

  return (
    <div className="ov-row">
      <div className="ov">
        <div className="v" style={{ color: '#22c55e' }}>{fmtKorean(ov.today_study_seconds)}</div>
        <div className="l">오늘 순공</div>
        <div className="sub" style={{ color: todayDiff >= 0 ? '#22c55e' : '#ef4444' }}>
          {todayDiff >= 0 ? '+' : ''}{todayDiff}분 vs 반평균
        </div>
      </div>
      <div className="ov">
        <div className="v" style={{ color: '#f59e0b' }}>{ov.today_focus_rate}%</div>
        <div className="l">집중률</div>
      </div>
      <div className="ov">
        <div className="v" style={{ color: '#8b5cf6' }}>{ov.subjects_done}/{ov.subjects_total}</div>
        <div className="l">목표달성</div>
      </div>
      <div className="ov">
        <div className="v" style={{ color: '#e94560' }}>{fmtMin(myPeriodMin)}</div>
        <div className="l">기간 합계</div>
        <div className="sub" style={{ color: diff >= 0 ? '#22c55e' : '#ef4444' }}>
          {diff >= 0 ? '+' : ''}{diff}분 ({diffPct >= 0 ? '+' : ''}{diffPct}%)
        </div>
      </div>
      <div className="ov">
        <div className="v" style={{ color: '#3b82f6' }}>{fmtMin(avgPeriodMin)}</div>
        <div className="l">반 평균 합계</div>
      </div>
    </div>
  );
}
