// 대시보드 공용 계산 헬퍼 (원본 dashboard.js 의 getClassAvg/getClassTop 등)

import type { ClassAvg, DailyStat } from '@/lib/types';

export function getClassAvg(ca: ClassAvg | undefined, dates: string[], subjName: string): number[] {
  if (!ca || !ca.daily) return dates.map(() => 0);
  if (subjName === 'all') return dates.map((d) => ca.daily[d]?.avg_study_minutes ?? 0);
  return dates.map((d) => ca.subject_daily?.[subjName]?.[d]?.avg_study_minutes ?? 0);
}

export function getClassTop(ca: ClassAvg | undefined, dates: string[], subjName: string): number[] {
  if (!ca || !ca.daily) return dates.map(() => 0);
  if (subjName === 'all') return dates.map((d) => ca.daily[d]?.top_study_minutes ?? 0);
  return dates.map((d) => ca.subject_daily?.[subjName]?.[d]?.top_study_minutes ?? 0);
}

/** 기간 내 내 공부 시간(분) 합계 */
export function myPeriodMinutes(sliced: DailyStat[], subjName: string): number {
  if (subjName === 'all')
    return Math.round(sliced.reduce((a, d) => a + d.total_study_seconds, 0) / 60);
  return Math.round(
    sliced.reduce((a, d) => a + (d.by_subject[subjName]?.study_seconds ?? 0), 0) / 60,
  );
}
