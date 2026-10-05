// ── 더미 데이터 불러오기 ──
// 학생 20명의 세션 기록은 src/data/students/<id>.json 에 학생마다 따로 들어 있습니다.
// (scripts/generate-dummy-students.mjs 로 다시 만들 수 있고, JSON을 직접 고쳐도 됩니다)
// 파일의 날짜는 생성일(generated_on) 기준이므로, 오늘과의 차이만큼 밀어서 항상 "최근 90일"로 만듭니다.
// 용량이 커서 처음 시드할 때만 동적으로 불러옵니다.

import { hashString, shortId } from './random';
import { todayStr } from './format';
import type { SessionRecord, Student } from './types';

/** src/data/students/*.json 한 파일의 형식 */
export interface DummyStudentFile {
  id: string;
  name: string;
  is_me: boolean;
  persona: string;
  trend: string;
  note: string;
  /** 파일을 만든 날 (YYYY-MM-DD) */
  generated_on: string;
  /** 앱 가입일 (YYYY-MM-DD) */
  joined: string;
  sessions: {
    date: string;
    /** 시작 시각 HH:MM:SS (로컬) */
    start: string;
    subject: string;
    /** 순공 (초) */
    study: number;
    /** 일시정지 (초) */
    pause: number;
    /** 일시정지 횟수 */
    pauses: number;
    /** 딴짓 (초) [폰, 멍때림, 자리비움, 졸음] */
    dist: number[];
  }[];
}

/** 더미 학생 ID — 파일 id 로 고정 */
export const dummyStudentId = (fileId: string) => shortId(`dummy_${fileId}`);

/** 예전 버전(영문 이름 20명) 더미 학생 ID — 새 더미로 바꿀 때 지웁니다 */
export const LEGACY_DUMMY_IDS = ['Alice', 'Bob', 'Charlie', 'Diana', '나', 'Fiona', 'George', 'Hannah', 'Ian', 'Julia', 'Kevin', 'Luna', 'Mike', 'Nora', 'Oscar', 'Paul', 'Quinn', 'Rachel', 'Sam', 'Tina'].map(
  (name, i) => shortId(`${name}_${i}`),
);

/** 더미 데이터가 바뀌면 값이 달라져, 저장된 예전 더미를 새것으로 바꾸는 데 씁니다 */
let versionCache: string | null = null;
export async function dummyVersion(): Promise<string> {
  if (!versionCache) {
    const { DUMMY_STUDENTS } = await import('@/data/students');
    versionCache = hashString(JSON.stringify(DUMMY_STUDENTS)).toString(16);
  }
  return versionCache;
}

const DAY_MS = 86400000;
const utc = (ds: string) => Date.UTC(+ds.slice(0, 4), +ds.slice(5, 7) - 1, +ds.slice(8, 10));

export async function generateDummyData(): Promise<{
  students: Student[];
  sessions: SessionRecord[];
  /** 기본 선택할 '나' 학생 ID */
  meId: string;
}> {
  const { DUMMY_STUDENTS } = await import('@/data/students');
  const students: Student[] = [];
  const sessions: SessionRecord[] = [];
  let sessionId = 1;
  let meId = '';
  const today = utc(todayStr());

  for (const file of DUMMY_STUDENTS) {
    const id = dummyStudentId(file.id);
    if (file.is_me) meId = id;
    const shift = Math.round((today - utc(file.generated_on)) / DAY_MS);
    // 로컬 날짜로 변환 (shift 일 만큼 뒤로)
    const local = (ds: string, sec = 0) => new Date(+ds.slice(0, 4), +ds.slice(5, 7) - 1, +ds.slice(8, 10) + shift, 0, 0, sec);
    const dateOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    students.push({ id, name: file.name, created_at: local(file.joined, 9 * 3600).toISOString() });

    for (const s of file.sessions) {
      const [h, m, sec] = s.start.split(':').map(Number);
      const start = local(s.date, h * 3600 + m * 60 + sec);
      const [phone = 0, spacing = 0, away = 0, drowsy = 0] = s.dist;
      const distSec = phone + spacing + away + drowsy;
      const end = new Date(start.getTime() + (s.study + s.pause + distSec) * 1000);
      sessions.push({
        id: sessionId++,
        student_id: id,
        subject: s.subject,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        duration_seconds: s.study,
        pause_count: s.pauses,
        pause_seconds: s.pause,
        distraction_seconds: distSec,
        distraction_phone: phone,
        distraction_spacing: spacing,
        distraction_away: away,
        distraction_drowsy: drowsy,
        date: dateOf(start),
        created_at: end.toISOString(),
      });
    }
  }

  return { students, sessions, meId };
}
