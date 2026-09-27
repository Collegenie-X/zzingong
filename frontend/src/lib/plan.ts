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
  /** 예정 시각이 이미 지나서 뒤로 밀린 과목 */
  rolled: boolean;
  /** 원래 계획대로라면 이미 시작했어야 하는 미완료 과목 */
  overdue: boolean;
}

/**
 * 과목별 예상 시작·종료 시각을 계산합니다.
 *
 * 아직 손대지 않은(done === 0) 첫 과목의 시작 시각은 `max(계획 시작, 현재 시각)`으로
 * 잡고, 뒤 과목들은 거기서부터 차례로 누적합니다. 계획표가 과거에 고정돼 있으면
 * 예상 종료 시각이 실제와 계속 어긋나기 때문입니다.
 *
 * 타이머가 도는 동안에는 시각이 1초마다 떨리지 않도록 호출하는 쪽에서 `now`를
 * 고정해 넘겨줍니다(PlanList 의 앵커 참고).
 */
export function calcTimes(subjects: Subject[], now: Date = new Date()): PlanTime[] {
  const nowMs = now.getTime();
  const base = planStart(now).getTime();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);

  let cursor = base; // 실제로 보여줄 커서(밀린 시각 반영)
  let planned = base; // 원래 계획 커서(밀기 전)
  let anchored = false;

  return subjects.map((s) => {
    const skipped = s.done === 2;
    const pending = s.done === 0;
    const plannedStart = planned;

    // 미완료 과목 중 첫 번째에서 현재 시각으로 한 번만 앵커링합니다.
    if (pending && !anchored) {
      anchored = true;
      cursor = Math.max(cursor, nowMs);
    }

    const st = new Date(cursor);
    const rolled = !skipped && cursor > plannedStart;
    const overdue = pending && plannedStart < nowMs;

    if (!skipped) {
      cursor += s.goal_minutes * 60000;
      planned += s.goal_minutes * 60000;
    }
    const en = new Date(cursor);

    return {
      start: skipped ? '-' : hm(st),
      end: skipped ? '-' : hm(en),
      overMidnight: !skipped && cursor > midnight.getTime(),
      skipped,
      rolled,
      overdue,
    };
  });
}

/** 건너뛰기를 제외한 계획 총 시간(분) */
export function planTotalMinutes(subjects: Subject[]): number {
  return subjects.reduce((a, s) => a + (s.done === 2 ? 0 : s.goal_minutes), 0);
}
