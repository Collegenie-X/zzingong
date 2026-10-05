// ── 시간/날짜 포맷 유틸 ──

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 초 → "HH:MM:SS" */
export function fmtHMS(sec: number): string {
  return [Math.floor(sec / 3600), Math.floor((sec % 3600) / 60), sec % 60]
    .map((v) => String(v).padStart(2, '0'))
    .join(':');
}

/** 초 → "M:SS" (딴짓 시간 등 짧은 표기) */
export function fmtShort(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** 초 → "N시간 M분" / "M분" */
export function fmtKorean(sec: number): string {
  const m = Math.round(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m}분`;
}

/** 분 → "N시간 M분" / "M분" / "N시간" */
export function fmtMinKorean(min: number): string {
  const sign = min < 0 ? '-' : '';
  const v = Math.abs(Math.round(min));
  const h = Math.floor(v / 60);
  const m = v % 60;
  if (h === 0) return `${sign}${m}분`;
  return m === 0 ? `${sign}${h}시간` : `${sign}${h}시간 ${m}분`;
}

/** 분 → "Nh Mm" / "Mm" */
export function fmtMin(m: number): string {
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 > 0 ? (m % 60) + 'm' : ''}` : `${m}m`;
}

/** Date → "HH:MM" */
export function hm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** ISO 문자열(UTC 저장) → 로컬 "HH:MM" */
export function isoHM(iso: string): string {
  return iso ? hm(new Date(iso)) : '-';
}

/** ISO 문자열(UTC 저장) → 로컬 "YYYY-MM-DD HH:MM:SS" */
export function isoLocal(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${toDateStr(d)} ${hm(d)}:${String(d.getSeconds()).padStart(2, '0')}`;
}

/** "YYYY-MM-DD" → "M/D" */
export function dateLabel(ds: string): string {
  const d = new Date(ds + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** 오늘 날짜 "YYYY-MM-DD" (로컬 기준) */
export function todayStr(): string {
  return toDateStr(new Date());
}

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 오늘로부터 offset일 전 날짜 문자열 */
export function daysAgoStr(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return toDateStr(d);
}

export function pct(a: number, b: number): number {
  return b > 0 ? Math.round((a / b) * 100) : 0;
}
