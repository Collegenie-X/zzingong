// AI 학습 리포트 전용 커스텀 SVG
// - CoachBot: 표정이 바뀌는 AI 코치 로봇
// - GradeBadge: 등급이 찍힌 리본 배지
// - KpiIcon: 요약 타일 아이콘 (책·달력·컵)
// - FocusRing: 집중률 도넛 게이지
// - NoteIcon: 칭찬 스티커 / 미션 깃발
// - TrendChart: 나 vs 반 평균 꺾은선

const INK = '#0b1220';

export type BotMood = 'cheer' | 'smile' | 'worry' | 'idle';

export function CoachBot({ mood, size = 72 }: { mood: BotMood; size?: number }) {
  const eye = '#7dd3fc';
  return (
    <svg viewBox="0 0 72 72" width={size} height={size} className={`rp-bot mood-${mood}`} role="img" aria-label="AI 코치">
      {/* 안테나 */}
      <path d="M36 14 V7" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      <circle className="rp-bot-bulb" cx="36" cy="6" r="4" fill={mood === 'worry' ? '#f59e0b' : '#e94560'} stroke={INK} strokeWidth="1.5" />
      {/* 귀 */}
      <rect x="5" y="30" width="7" height="14" rx="3" fill="#64748b" stroke={INK} strokeWidth="2" />
      <rect x="60" y="30" width="7" height="14" rx="3" fill="#64748b" stroke={INK} strokeWidth="2" />
      {/* 머리 */}
      <rect x="10" y="14" width="52" height="44" rx="14" fill="#e2e8f0" stroke={INK} strokeWidth="2.5" />
      <path d="M16 24 Q18 18 26 18" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* 얼굴 화면 */}
      <rect x="16" y="23" width="40" height="27" rx="9" fill="#111c33" stroke={INK} strokeWidth="2" />
      {mood === 'cheer' && (
        <>
          <path d="M22 35 q4 -6 8 0 M42 35 q4 -6 8 0" stroke={eye} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M30 40 q6 7 12 0 z" fill={eye} />
        </>
      )}
      {mood === 'smile' && (
        <>
          <circle cx="26" cy="33.5" r="3.2" fill={eye} />
          <circle cx="46" cy="33.5" r="3.2" fill={eye} />
          <path d="M30 41 q6 5 12 0" stroke={eye} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </>
      )}
      {mood === 'worry' && (
        <>
          <circle cx="26" cy="35" r="3" fill={eye} />
          <circle cx="46" cy="35" r="3" fill={eye} />
          <path d="M21 29 l8 2 M51 29 l-8 2" stroke={eye} strokeWidth="2" strokeLinecap="round" />
          <path d="M31 44 q5 -4 10 0" stroke={eye} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M58 20 q3 5 0 7 q-3 -2 0 -7 z" fill="#4fc3f7" />
        </>
      )}
      {mood === 'idle' && (
        <>
          <path d="M22 34 h8 M42 34 h8" stroke={eye} strokeWidth="2.6" strokeLinecap="round" />
          <ellipse cx="36" cy="42" rx="3" ry="2.2" fill={eye} />
        </>
      )}
      {/* 볼터치 */}
      {mood !== 'worry' && mood !== 'idle' && (
        <>
          <circle cx="20.5" cy="42" r="2.4" fill="#fb7185" opacity="0.7" />
          <circle cx="51.5" cy="42" r="2.4" fill="#fb7185" opacity="0.7" />
        </>
      )}
      {/* 목·어깨 */}
      <path d="M22 70 q0 -10 14 -10 q14 0 14 10 z" fill="#e94560" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="36" cy="66" r="2" fill="#fff" opacity="0.8" />
      {/* 반짝이 */}
      {mood === 'cheer' && (
        <g className="rp-bot-spark" fill="#fbbf24">
          <path d="M6 12 l1.6 4 l4 1.6 l-4 1.6 l-1.6 4 l-1.6 -4 l-4 -1.6 l4 -1.6 z" />
          <path d="M65 8 l1.1 2.8 l2.8 1.1 l-2.8 1.1 l-1.1 2.8 l-1.1 -2.8 l-2.8 -1.1 l2.8 -1.1 z" />
        </g>
      )}
    </svg>
  );
}

// 톱니 모양 배지 외곽선
const BADGE_EDGE = Array.from({ length: 32 }, (_, i) => {
  const r = i % 2 ? 22.5 : 26;
  const a = (Math.PI * 2 * i) / 32;
  return `${(32 + r * Math.sin(a)).toFixed(1)},${(28 - r * Math.cos(a)).toFixed(1)}`;
}).join(' ');

export function GradeBadge({ grade, color, size = 64 }: { grade: string; color: string; size?: number }) {
  return (
    <svg viewBox="0 0 64 72" width={size} height={size * 1.125} className="rp-badge" role="img" aria-label={`등급 ${grade}`}>
      <path d="M20 44 L14 70 L24 64 L30 72 L33 48 Z" fill="#e94560" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M44 44 L50 70 L40 64 L34 72 L31 48 Z" fill="#3b82f6" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <polygon points={BADGE_EDGE} fill={color} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="32" cy="28" r="17.5" fill="#0f172a" fillOpacity="0.16" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.4" strokeDasharray="2.5 2.5" />
      <text x="32" y="35.5" textAnchor="middle" fontSize={grade.length > 1 ? 19 : 22} fontWeight="900" fill={INK} letterSpacing="-1">
        {grade}
      </text>
    </svg>
  );
}

export type KpiKind = 'book' | 'calendar' | 'cup';

export function KpiIcon({ kind, size = 30 }: { kind: KpiKind; size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      {kind === 'book' && (
        <>
          <path d="M16 8 C12 5 7 5 3 6.5 V25 C7 23.5 12 23.5 16 26.5 Z" fill="#22c55e" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M16 8 C20 5 25 5 29 6.5 V25 C25 23.5 20 23.5 16 26.5 Z" fill="#4ade80" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M7 11 h5 M7 15 h5 M20 11 h5 M20 15 h5" stroke={INK} strokeOpacity="0.45" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
      {kind === 'calendar' && (
        <>
          <rect x="4" y="6" width="24" height="22" rx="5" fill="#e2e8f0" stroke={INK} strokeWidth="1.8" />
          <path d="M4 13 V11 a5 5 0 0 1 5 -5 h14 a5 5 0 0 1 5 5 V13 Z" fill="#8b5cf6" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M10 3.5 V8 M22 3.5 V8" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M10.5 20.5 l3.8 3.6 l7.2 -7.4" fill="none" stroke="#8b5cf6" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {kind === 'cup' && (
        <>
          <path d="M11 3 q-2 2.5 0 5 M17 3 q-2 2.5 0 5" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M22 14 h3 a4 4 0 0 1 0 8 h-3" fill="none" stroke={INK} strokeWidth="4.4" />
          <path d="M22 14 h3 a4 4 0 0 1 0 8 h-3" fill="none" stroke="#38bdf8" strokeWidth="1.8" />
          <path d="M5 11 H23 V21 a7 7 0 0 1 -7 7 H12 a7 7 0 0 1 -7 -7 Z" fill="#38bdf8" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M8.5 14.5 V20" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

/** 집중률 도넛 — 가운데 과녁 */
export function FocusRing({ pct, color, size = 30 }: { pct: number; color: string; size?: number }) {
  const r = 12;
  const len = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      <circle cx="16" cy="16" r={r} fill="none" stroke="#1e293b" strokeWidth="5" />
      <circle
        className="rp-ring"
        cx="16" cy="16" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={`${(len * Math.min(Math.max(pct, 0), 100)) / 100} ${len}`}
        transform="rotate(-90 16 16)"
      />
      <circle cx="16" cy="16" r="4.5" fill={color} fillOpacity="0.25" />
      <circle cx="16" cy="16" r="2" fill={color} />
    </svg>
  );
}

export type NoteKind = 'praise' | 'mission';

export function NoteIcon({ kind, size = 26 }: { kind: NoteKind; size?: number }) {
  return (
    <svg viewBox="0 0 28 28" width={size} height={size} aria-hidden className="rp-note-ico">
      {kind === 'praise' ? (
        <>
          <path d="M14 2 L17.4 9.6 L25.6 10.4 L19.4 15.9 L21.3 24 L14 19.7 L6.7 24 L8.6 15.9 L2.4 10.4 L10.6 9.6 Z" fill="#fbbf24" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="11.4" cy="13" r="1.2" fill={INK} />
          <circle cx="16.6" cy="13" r="1.2" fill={INK} />
          <path d="M11.5 16 q2.5 2.4 5 0" fill="none" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="13" cy="16" r="10" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="13" cy="16" r="5.5" fill="none" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="13" cy="16" r="1.8" fill="#e94560" />
          <path d="M13 16 L22 7" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
          <path d="M20 4 L21 8 L25 9 L26.5 5.5 L23.5 5 L23 2 Z" fill="#e94560" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

interface TrendProps {
  mine: number[];
  avg: number[];
  labels: string[];
}

/** 나(면+선) vs 반 평균(점선). 선은 늘어나도 굵기가 유지되도록 non-scaling-stroke 사용 */
export function TrendChart({ mine, avg, labels }: TrendProps) {
  const n = mine.length;
  // y축은 값이 있는 범위로 확대해 오르내림이 잘 보이게 (0부터 시작하지 않음)
  const hiV = Math.max(...mine, ...avg, 1);
  const loV = Math.min(...mine, ...avg);
  const pad = Math.max((hiV - loV) * 0.18, 5);
  const max = hiV + pad;
  const min = Math.max(loV - pad, 0);
  const x = (i: number) => (n > 1 ? (i / (n - 1)) * 100 : 50);
  const y = (v: number) => 100 - ((v - min) / (max - min)) * 100;
  const line = (vals: number[]) => vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(2)} ${y(v).toFixed(2)}`).join(' ');
  const dots = n <= 14;
  // 라벨은 최대 7개만
  const step = Math.ceil(n / 7);

  return (
    <div className="rp-trend">
      <div className="rp-trend-plot">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="rp-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#e94560" stopOpacity="0.4" />
              <stop offset="1" stopColor="#e94560" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[25, 50, 75].map((g) => (
            <line key={g} x1="0" x2="100" y1={g} y2={g} stroke="#1e293b" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          <path d={`${line(mine)} L${x(n - 1)} 100 L${x(0)} 100 Z`} fill="url(#rp-area)" />
          <path d={line(avg)} fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <path d={line(mine)} fill="none" stroke="#e94560" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {dots && mine.map((v, i) => (
          <i key={i} className={`rp-dot${i === n - 1 ? ' last' : ''}`} style={{ left: `${x(i)}%`, top: `${y(v)}%` }} />
        ))}
        <span className="rp-trend-max">{Math.round(hiV)}분</span>
        {min > 0 && <span className="rp-trend-min">{Math.round(loV)}분</span>}
      </div>
      <div className="rp-trend-x">
        {labels.map((l, i) => (
          <span key={i} style={{ left: `${x(i)}%`, visibility: (n - 1 - i) % step === 0 ? 'visible' : 'hidden' }}>{l}</span>
        ))}
      </div>
    </div>
  );
}
