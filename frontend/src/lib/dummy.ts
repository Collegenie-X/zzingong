// ── 더미 데이터 생성 (generate_dummy.py 포팅) ──
// 반 평균 비교 대시보드를 테스트하기 위해 20명의 가상 학생과
// 최근 30일 세션을 생성합니다. 시드 고정으로 항상 같은 패턴이 나옵니다.

import dummyConfig from '@/data/dummy-students.json';
import { createRng, shortId } from './random';
import { daysAgoStr } from './format';
import type { SessionRecord, Student, Subject } from './types';

interface Profile {
  effort: number[];
  consistency: number[];
  weekend_drop: number;
}

export function generateDummyData(subjects: Subject[]): {
  students: Student[];
  sessions: SessionRecord[];
} {
  const days: number = dummyConfig.days;
  const profiles = dummyConfig.profiles as Record<string, Profile>;
  const students: Student[] = [];
  const sessions: SessionRecord[] = [];
  let sessionId = 1;

  dummyConfig.students.forEach((st, si) => {
    const id = shortId(`${st.name}_${si}`);
    students.push({ id, name: st.name, created_at: new Date().toISOString() });

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

      for (const subj of subjects) {
        const threshold = consistency * (isWeekend ? 1.0 - prof.weekend_drop : 1.0);
        if (rng.next() > threshold * dayMood) continue;

        let numSessions = 1;
        if (st.type === 'top' && rng.next() < 0.4) numSessions = 2;
        else if (st.type === 'avg' && rng.next() < 0.2) numSessions = 2;

        for (let k = 0; k < numSessions; k++) {
          const baseDur = subj.goal_minutes * 60 * effort * dayMood;
          const dur = Math.max(300, Math.floor(baseDur * rng.uniform(0.5, 1.3)));
          const pc = rng.randint(0, st.type === 'top' || st.type === 'avg' ? 2 : 4);
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

  return { students, sessions };
}
