// ── 더미 데이터 생성 (generate_dummy.py 포팅) ──
// 반 평균 비교 대시보드를 테스트하기 위해 20명의 가상 학생과
// 최근 30일 세션을 생성합니다. 시드 고정으로 항상 같은 패턴이 나옵니다.
// 명단의 type이 'me'인 학생이 '나'이며, 1주·1달은 반 me_rank등, 오늘은 me_today_rank등이 되고
// 이번 주 공부량이 쭉 오르는 흐름이 되도록 보정합니다.

import dummyConfig from '@/data/dummy-students.json';
import { createRng, shortId } from './random';
import { daysAgoStr } from './format';
import type { SessionRecord, Student, Subject } from './types';

interface Profile {
  effort: number[];
  consistency: number[];
  weekend_drop: number;
  /** 과목 순서별 공부량 배율 (강한 과목·약한 과목 표현) */
  subject_bias?: number[];
}

export function generateDummyData(subjects: Subject[]): {
  students: Student[];
  sessions: SessionRecord[];
  /** 기본 선택할 '나' 학생 ID */
  meId: string;
} {
  const days: number = dummyConfig.days;
  const profiles = dummyConfig.profiles as Record<string, Profile>;
  const students: Student[] = [];
  const sessions: SessionRecord[] = [];
  let sessionId = 1;
  let meId = '';

  dummyConfig.students.forEach((st, si) => {
    const id = shortId(`${st.name}_${si}`);
    students.push({ id, name: st.name, created_at: new Date().toISOString() });
    if (st.type === 'me') meId = id;

    const rng = createRng(42 + si * 100);
    const prof = profiles[st.type];
    const effort = rng.uniform(prof.effort[0], prof.effort[1]);
    const consistency = rng.uniform(prof.consistency[0], prof.consistency[1]);

    for (let offset = 0; offset < days; offset++) {
      const ds = daysAgoStr(days - 1 - offset);
      const weekday = new Date(ds + 'T00:00:00').getDay();
      const isWeekend = weekday === 0 || weekday === 6;
      let hour = rng.randint(7, 10);
      const dayMood = rng.uniform(0.6, 1.4);

      for (const [subjIdx, subj] of subjects.entries()) {
        const threshold = consistency * (isWeekend ? 1.0 - prof.weekend_drop : 1.0);
        if (rng.next() > threshold * dayMood) continue;

        let numSessions = 1;
        if ((st.type === 'top' || st.type === 'me') && rng.next() < 0.4) numSessions = 2;
        else if (st.type === 'avg' && rng.next() < 0.2) numSessions = 2;

        for (let k = 0; k < numSessions; k++) {
          const baseDur = subj.goal_minutes * 60 * effort * dayMood * (prof.subject_bias?.[subjIdx] ?? 1);
          const dur = Math.max(300, Math.floor(baseDur * rng.uniform(0.5, 1.3)));
          const pc = rng.randint(0, st.type === 'lazy' || st.type === 'ghost' ? 4 : 2);
          const ps = pc * rng.randint(30, 120);
          const endSec = hour * 3600 + dur + ps;
          const eh = Math.min(Math.floor(endSec / 3600), 23);
          const em = Math.floor((endSec % 3600) / 60);
          sessions.push({
            id: sessionId++,
            student_id: id,
            subject: subj.name,
            start_time: `${ds}T${String(hour).padStart(2, '0')}:00:00.000Z`,
            end_time: `${ds}T${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}:00.000Z`,
            duration_seconds: dur,
            pause_count: pc,
            pause_seconds: ps,
            distraction_seconds: 0,
            distraction_phone: 0,
            distraction_spacing: 0,
            distraction_away: 0,
            distraction_drowsy: 0,
            date: ds,
            created_at: new Date().toISOString(),
          });
          hour = Math.min(eh + 1, 22);
        }
      }
    }
  });

  if (meId) calibrateRank(sessions, meId, dummyConfig.me_rank, dummyConfig.me_today_rank, days);
  return { students, sessions, meId };
}

/**
 * '나'의 하루 공부량을 "꾸준하다가 이번 주에 쭉 오르는" 모양으로 다시 배분합니다.
 *   첫날 A(=B×0.9) → 7일 전 B → 오늘 H 로 이어지는 꺾은선
 * - 최근 7일 · 전체 기간 순공 합계는 반 rank등, 오늘은 반 todayRank등 구간 안에 들어가게 하고
 * - 그 조건 안에서 B를 최대한 낮게 잡아 이번 주 상승폭을 키웁니다.
 */
function calibrateRank(sessions: SessionRecord[], meId: string, rank: number, todayRank: number, days: number): void {
  const rng = createRng(7);
  // 기간별 "그 순위가 되는 합계 구간" [lo, hi] (분)
  const range = (span: number, r: number) => {
    const from = daysAgoStr(span - 1);
    const totals = new Map<string, number>();
    for (const s of sessions) {
      if (s.student_id !== meId && s.date >= from) totals.set(s.student_id, (totals.get(s.student_id) ?? 0) + s.duration_seconds / 60);
    }
    const others = [...totals.values()].sort((a, b) => b - a);
    const lo = others[r - 1] ?? 0;
    const hi = others[r - 2] ?? lo * 1.5 + 60;
    return { lo, hi, need: lo + (hi - lo) * 0.05 };
  };
  const today = range(1, todayRank);
  const week = range(7, rank);
  const month = range(days, rank);
  if (today.hi - today.lo < 2 || week.hi - week.lo < 2 || month.hi - month.lo < 2) return;

  // 내 세션이 있는 날만 목표를 맞출 수 있으므로 그 날들로 합계를 계산
  const mine = sessions.filter((s) => s.student_id === meId);
  const offsets = Array.from({ length: days }, (_, o) => o).filter((o) => mine.some((s) => s.date === daysAgoStr(days - 1 - o)));
  const k = days - 7; // 7일 전 = 꺾이는 지점
  // 하루 목표 = B * wB(o) + H * wH(o)
  const wB = (o: number) => (o <= k ? 0.9 + (0.1 * o) / Math.max(k, 1) : 1 - (o - k) / 6);
  const wH = (o: number) => (o <= k ? 0 : (o - k) / 6);
  const H = today.lo + (today.hi - today.lo) * 0.8;
  const minB = (need: number, from: number) => {
    const os = offsets.filter((o) => o >= from);
    const b = os.reduce((a, o) => a + wB(o), 0);
    return b > 0 ? (need - H * os.reduce((a, o) => a + wH(o), 0)) / b : 0;
  };
  const B = Math.min(Math.max(minB(week.need, k + 1), minB(month.need, 0)), H);

  for (const o of offsets) {
    const ds = daysAgoStr(days - 1 - o);
    const daySess = mine.filter((s) => s.date === ds);
    const sum = daySess.reduce((a, s) => a + s.duration_seconds, 0);
    // 오늘은 그대로, 이번 주는 ±2%, 그 전은 ±6% 흔들어 자연스럽게
    const jitter = o === days - 1 ? 1 : o > k ? rng.uniform(0.98, 1.02) : rng.uniform(0.94, 1.06);
    const f = ((B * wB(o) + H * wH(o)) * 60 * jitter) / sum;
    for (const s of daySess) s.duration_seconds = Math.max(300, Math.round(s.duration_seconds * f));
  }
}
