// ── 공부 계획 시간 계산 (원본 index.html calcTimes 포팅) ──
// 현재 시각부터 과목 목표 시간을 순서대로 누적해
// 각 과목의 예상 시작/종료 시각을 구합니다.

import { hm } from './format';
import type { Subject } from './types';

export interface PlanTime {
  start: string;
  end: string;
  overMidnight: boolean;
  skipped: boolean;
}

export function calcTimes(subjects: Subject[], now: Date = new Date()): PlanTime[] {
  let cursor = now.getTime();
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
