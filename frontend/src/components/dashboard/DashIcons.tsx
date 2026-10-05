// 대시보드 전용 커스텀 SVG
// - PeerStrip: 반 친구 전원을 점으로 늘어놓고 내 위치를 핀으로 표시 (오른쪽일수록 앞섬)
// - Medal: 순위 숫자가 들어간 메달
// - TipIcon: 코치 한마디 아이콘

const PAD = 4; // 좌우 여백(%) — 끝에 있는 점이 잘리지 않게

const xPct = (v: number, max: number) => `${PAD + (100 - PAD * 2) * (max > 0 ? Math.min(v / max, 1) : 0)}%`;

interface StripProps {
  values: number[];
  mine: number;
  avg: number;
  color: string;
  /** 큰 버전: 높이를 키우고 '나'·'평균' 라벨 표시 */
  big?: boolean;
}

export function PeerStrip({ values, mine, avg, color, big }: StripProps) {
  const max = Math.max(...values, 1);
  const h = big ? 52 : 26;
  const cy = big ? 32 : 13;
  // 내 기록은 따로 그리므로 친구 점에서 하나만 제외
  const others = [...values];
  const meIdx = others.indexOf(mine);
  if (meIdx >= 0) others.splice(meIdx, 1);

  return (
    <svg className="peer-strip" width="100%" height={h} aria-hidden>
      <rect x="0" y={cy - 3} width="100%" height="6" rx="3" fill="#1e293b" />
      <rect x="0" y={cy - 3} width={xPct(mine, max)} height="6" rx="3" fill={color} opacity="0.35" />
      {others.map((v, i) => (
        <circle key={i} cx={xPct(v, max)} cy={cy} r={big ? 4.5 : 3.5} fill="#64748b" stroke="#0b1220" strokeWidth="1.5" />
      ))}
      {/* 반 평균 */}
      <svg x={xPct(avg, max)} y="0" overflow="visible">
        <line x1="0" x2="0" y1={cy - (big ? 11 : 9)} y2={cy + (big ? 11 : 9)} stroke="#fbbf24" strokeWidth="2" strokeDasharray="3 2" />
        {big && (
          <text x="0" y={cy + 22} textAnchor="middle" fontSize="10" fill="#fbbf24" fontWeight="700">평균</text>
        )}
      </svg>
      {/* 나 */}
      <svg x={xPct(mine, max)} y="0" overflow="visible" className="strip-me">
        {big ? (
          <>
            <path d={`M0 ${cy + 1} L-6 ${cy - 9} A8.5 8.5 0 1 1 6 ${cy - 9} Z`} fill={color} stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
            <text x="0" y={cy - 12.5} textAnchor="middle" fontSize="10" fontWeight="800" fill="#0b1220">나</text>
          </>
        ) : (
          <circle cx="0" cy={cy} r="6.5" fill={color} stroke="#fff" strokeWidth="2" />
        )}
      </svg>
    </svg>
  );
}

export function Medal({ rank, color, size = 34 }: { rank: number | null; color: string; size?: number }) {
  const empty = rank === null;
  return (
    <svg viewBox="0 0 32 36" width={size} height={size * 1.125} aria-hidden>
      <path d="M9 1 L14 13 L10 15 L4 3 Z" fill={empty ? '#334155' : '#e94560'} />
      <path d="M23 1 L18 13 L22 15 L28 3 Z" fill={empty ? '#334155' : '#3b82f6'} />
      <circle cx="16" cy="22" r="12" fill={empty ? '#1e293b' : color} stroke={empty ? '#334155' : '#0b1220'} strokeWidth="2" />
      {!empty && <circle cx="16" cy="22" r="8.5" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="1.2" />}
      <text x="16" y="26.5" textAnchor="middle" fontSize={rank !== null && rank >= 10 ? 10.5 : 12.5} fontWeight="900" fill={empty ? '#475569' : '#0b1220'}>
        {empty ? '–' : rank}
      </text>
    </svg>
  );
}

export type TipKind = 'up' | 'warn' | 'star';

export function TipIcon({ kind }: { kind: TipKind }) {
  const c = kind === 'up' ? '#22c55e' : kind === 'warn' ? '#f59e0b' : '#fbbf24';
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden className="tip-ico">
      <circle cx="12" cy="12" r="11" fill={c} fillOpacity="0.16" />
      {kind === 'up' && <path d="M6 15 L11 10 L14 13 L18 8 M14 8 H18 V12" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />}
      {kind === 'warn' && (
        <>
          <path d="M12 6 V13" stroke={c} strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="12" cy="17" r="1.6" fill={c} />
        </>
      )}
      {kind === 'star' && <path d="M12 5 L14 10 L19 10.4 L15.2 13.6 L16.4 18.6 L12 15.9 L7.6 18.6 L8.8 13.6 L5 10.4 L10 10 Z" fill={c} />}
    </svg>
  );
}
