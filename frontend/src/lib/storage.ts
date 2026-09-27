// ── localStorage 래퍼 ──
// 모든 데이터 접근은 이 파일을 통해서만 이뤄집니다.
// 나중에 서버로 전환할 때는 lib/api/localApi.ts 만 서버 구현으로 교체하면 되고,
// 이 파일은 삭제하거나 캐시 용도로 남기면 됩니다.

const PREFIX = 'study-timer:';

export const KEYS = {
  students: `${PREFIX}students`,
  subjects: `${PREFIX}subjects`,
  sessions: `${PREFIX}sessions`,
  selectedStudent: `${PREFIX}student_id`,
  seeded: `${PREFIX}seeded`,
} as const;

export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 공간 부족 등은 조용히 무시 (앱 동작은 계속)
  }
}

export function removeKey(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function clearAll(): void {
  Object.values(KEYS).forEach(removeKey);
}
