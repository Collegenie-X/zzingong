// ── 공부 계획 시간 계산 ──
// 학원이 끝난 뒤의 "순공(자습)" 시간만 다룹니다.
// 시작 시각과 순공 목표 시간은 src/data/subjects.json 에서 평일/주말로 나눠 관리합니다.

import planConfig from '@/data/subjects.json';
import { hm } from './format';
import type { Subject } from './types';

export interface DayPlanConfig {
  label: string;
  /** 순공 시작 시각 "HH:MM" (학원 종료 이후) */
  start_time: string;
  /** 하루 순공 목표 시간(분) */
  target_minutes: number;
}

/** 토·일은 주말 설정, 그 외는 평일 설정 */
export function dayConfig(now: Date = new Date()): DayPlanConfig {
  const day = now.getDay();
  return (day === 0 || day === 6 ? planConfig.weekend : planConfig.weekday) as DayPlanConfig;
}

/** 오늘 계획이 시작되는 시각 (설정된 start_time 기준) */
export function planStart(now: Date = new Date()): Date {
  const [h, m] = dayConfig(now).start_time.split(':').map(Number);
  const start = new Date(now);
  start.setHours(h, m, 0, 0);
  return start;
}

export interface PlanTime {
  start: string;
  end: string;
  overMidnight: boolean;
  skipped: boolean;
}

export function calcTimes(subjects: Subject[], now: Date = new Date()): PlanTime[] {
  let cursor = planStart(now).getTime();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);

  return subjects.map((s) => {
    const skipped = s.done === 2;
    const st = new Date(cursor);
    if (!skipped) cursor += s.goal_minutes * 60000;
    const en = new Date(cursor);
    return {
      start: skipped ? '-' : hm(st),
      end: skipped ? '-' : hm(en),
      overMidnight: !skipped && cursor > midnight.getTime(),
      skipped,
    };
  });
}

/** 건너뛰기를 제외한 계획 총 시간(분) */
export function planTotalMinutes(subjects: Subject[]): number {
  return subjects.reduce((a, s) => a + (s.done === 2 ? 0 : s.goal_minutes), 0);
}
