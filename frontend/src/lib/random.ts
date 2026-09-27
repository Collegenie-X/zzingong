// ── 시드 기반 난수 생성기 (mulberry32) ──
// 더미 데이터를 항상 같은 패턴으로 재현하기 위해 사용합니다.

export function createRng(seed: number) {
  let a = seed >>> 0;
  const next = (): number => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    /** [min, max) 실수 */
    uniform: (min: number, max: number) => min + next() * (max - min),
    /** [min, max] 정수 */
    randint: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
  };
}

/** 문자열 → 32bit 해시 (학생 ID 생성용) */
export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function shortId(str: string): string {
  return hashString(str).toString(16).padStart(8, '0');
}
