// 게임 느낌의 커스텀 SVG 아이콘 모음
// - Hero: 상황에 따라 표정이 바뀌는 주인공 얼굴
// - Heart: 집중력(HP) 하트, 반 칸까지 표현
// - Gem: 과목 보석 — 완료하면 과목 색으로 빛남
// - Castle: 목표 지점 깃발 성
// - Runner: 여정 막대 위의 내 위치

export type Mood = 'fire' | 'strong' | 'sprout' | 'sleepy' | 'dizzy';

interface SizeProps {
  size?: number;
  className?: string;
  title?: string;
}

export function Hero({ mood, size = 48, className, title }: SizeProps & { mood: Mood }) {
  const skin = '#ffd29a';
  const eyes: Record<Mood, React.ReactNode> = {
    fire: (
      <>
        <path d="M17 27 l5 -3 l5 3" className="gi-line" />
        <path d="M37 27 l5 -3 l5 3" className="gi-line" />
      </>
    ),
    strong: (
      <>
        <circle cx="22" cy="27" r="3" fill="#1b1d3a" />
        <circle cx="42" cy="27" r="3" fill="#1b1d3a" />
        <circle cx="23" cy="26" r="1" fill="#fff" />
        <circle cx="43" cy="26" r="1" fill="#fff" />
      </>
    ),
    sprout: (
      <>
        <circle cx="22" cy="28" r="2.6" fill="#1b1d3a" />
        <circle cx="42" cy="28" r="2.6" fill="#1b1d3a" />
      </>
    ),
    sleepy: (
      <>
        <path d="M17 28 q5 3 10 0" className="gi-line" />
        <path d="M37 28 q5 3 10 0" className="gi-line" />
      </>
    ),
    dizzy: (
      <>
        <path d="M18 24 l7 7 M25 24 l-7 7" className="gi-line" />
        <path d="M39 24 l7 7 M46 24 l-7 7" className="gi-line" />
      </>
    ),
  };
  const mouth: Record<Mood, React.ReactNode> = {
    fire: <path d="M24 38 q8 9 16 0 z" fill="#c2185b" />,
    strong: <path d="M25 38 q7 6 14 0" className="gi-line" />,
    sprout: <path d="M27 39 q5 3 10 0" className="gi-line" />,
    sleepy: <ellipse cx="32" cy="40" rx="3" ry="2.4" fill="#1b1d3a" />,
    dizzy: <path d="M25 41 q3.5 -3 7 0 t7 0" className="gi-line" />,
  };
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={`gi-hero mood-${mood} ${className ?? ''}`} role="img" aria-label={title}>
      {title && <title>{title}</title>}
      {/* 오라 */}
      {mood === 'fire' && (
        <path className="gi-flame" d="M32 2 C40 12 52 14 52 30 C52 46 42 56 32 56 C22 56 12 46 12 30 C12 18 22 16 24 6 C28 12 30 10 32 2 Z" fill="#ff7043" opacity="0.85" />
      )}
      {/* 머리 */}
      <circle cx="32" cy="32" r="20" fill={skin} stroke="#1b1d3a" strokeWidth="2.5" />
      {/* 머리띠 (찐공 레드) */}
      <path d="M12.5 24 Q32 13 51.5 24 L51 19 Q32 8 13 19 Z" fill="#e94560" stroke="#1b1d3a" strokeWidth="2" strokeLinejoin="round" />
      <path d="M50 21 l9 -4 l-2 7 z" fill="#e94560" stroke="#1b1d3a" strokeWidth="1.6" strokeLinejoin="round" />
      {/* 볼터치 */}
      <circle cx="17" cy="35" r="3" fill="#ff8a80" opacity="0.55" />
      <circle cx="47" cy="35" r="3" fill="#ff8a80" opacity="0.55" />
      {eyes[mood]}
      {mouth[mood]}
      {/* 상황별 소품 */}
      {mood === 'sprout' && (
        <g transform="translate(32 4)">
          <path d="M0 10 V2" stroke="#43a047" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M0 4 C-8 0 -9 -6 -9 -6 C-3 -6 0 -2 0 4 Z" fill="#66bb6a" />
          <path d="M0 4 C8 0 9 -6 9 -6 C3 -6 0 -2 0 4 Z" fill="#81c784" />
        </g>
      )}
      {mood === 'sleepy' && (
        <g className="gi-zzz" fill="#90caf9" fontWeight="800" fontFamily="system-ui">
          <text x="50" y="14" fontSize="11">Z</text>
          <text x="57" y="7" fontSize="8">z</text>
        </g>
      )}
      {mood === 'strong' && <path d="M50 44 l4 -2 l1 5 l4 1 l-3 4" className="gi-sweat" fill="#4fc3f7" />}
      {mood === 'dizzy' && (
        <g className="gi-spin" fill="#ffd54f">
          <path d="M8 10 l2 4 l4 1 l-3 3 l1 4 l-4 -2 l-4 2 l1 -4 l-3 -3 l4 -1 z" />
        </g>
      )}
    </svg>
  );
}

/** fill: 0 = 빈 하트, 0.5 = 반 칸, 1 = 꽉 찬 하트 */
export function Heart({ fill, size = 18, className }: SizeProps & { fill: 0 | 0.5 | 1 }) {
  const d = 'M12 21 C5 15 2 12 2 8 C2 5 4.5 3 7 3 C9 3 11 4.5 12 6 C13 4.5 15 3 17 3 C19.5 3 22 5 22 8 C22 12 19 15 12 21 Z';
  const id = `hc-${fill}`;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
      <defs>
        <clipPath id={id}>
          <rect x="0" y="0" width={24 * fill} height="24" />
        </clipPath>
      </defs>
      <path d={d} fill="#2a2d55" stroke="#1b1d3a" strokeWidth="1.6" />
      {fill > 0 && (
        <g clipPath={`url(#${id})`}>
          <path d={d} fill="#ff4d6d" />
          <path d="M6 6.5 C5 7 4.5 8 4.6 9" stroke="#ffb3c1" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
      )}
      <path d={d} fill="none" stroke="#1b1d3a" strokeWidth="1.6" />
    </svg>
  );
}

export function Gem({ color, on, size = 18, className, title }: SizeProps & { color: string; on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={`gi-gem${on ? ' on' : ''} ${className ?? ''}`} role="img" aria-label={title}>
      {title && <title>{title}</title>}
      <path d="M6 3 H18 L22 9 L12 22 L2 9 Z" fill={on ? color : 'transparent'} stroke={on ? '#1b1d3a' : color} strokeWidth="1.6" strokeLinejoin="round" strokeDasharray={on ? undefined : '2.5 2'} />
      {on && (
        <>
          <path d="M2 9 H22 M8 3 L6.5 9 L12 22 L17.5 9 L16 3" fill="none" stroke="#1b1d3a" strokeWidth="1" opacity="0.45" />
          <path d="M6 3 L8 9 H2 Z" fill="#fff" opacity="0.45" />
        </>
      )}
    </svg>
  );
}

export function Castle({ size = 30, reached, className }: SizeProps & { reached?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={`gi-castle${reached ? ' reached' : ''} ${className ?? ''}`} aria-hidden>
      <path d="M16 2 V10" stroke="#e0e0e0" strokeWidth="1.6" />
      <path className="gi-flag" d="M16 2 L25 4.5 L16 7 Z" fill={reached ? '#ffd54f' : '#e94560'} />
      <path d="M5 30 V14 H8 V17 H11 V14 H14 V17 H18 V14 H21 V17 H24 V14 H27 V30 Z" fill="#3949ab" stroke="#1b1d3a" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M13 30 V24 a3 3 0 0 1 6 0 V30 Z" fill="#1b1d3a" />
      <rect x="8" y="20" width="3" height="3" fill={reached ? '#ffd54f' : '#7986cb'} />
      <rect x="21" y="20" width="3" height="3" fill={reached ? '#ffd54f' : '#7986cb'} />
    </svg>
  );
}

export function Runner({ size = 26, className }: SizeProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={`gi-runner ${className ?? ''}`} aria-hidden>
      <circle cx="19" cy="7" r="5" fill="#ffd29a" stroke="#1b1d3a" strokeWidth="1.6" />
      <path d="M14.5 5.5 Q19 1 23.5 5.5" stroke="#e94560" strokeWidth="2.4" fill="none" />
      <path d="M17 12 L14 20" stroke="#e94560" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M14 20 L9 23 L7 28 M14 20 L19 24 L22 29" stroke="#2e3275" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 14 L22 16 M16 14 L10 15 L8 12" stroke="#ffd29a" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Trophy({ size = 20, className }: SizeProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
      <path d="M7 3 H17 V9 a5 5 0 0 1 -10 0 Z" fill="#ffd54f" stroke="#1b1d3a" strokeWidth="1.5" />
      <path d="M7 5 H3 a4 4 0 0 0 4 5 M17 5 H21 a4 4 0 0 1 -4 5" fill="none" stroke="#1b1d3a" strokeWidth="1.5" />
      <path d="M12 14 V18 M8 21 H16 V18 H8 Z" fill="#ffb300" stroke="#1b1d3a" strokeWidth="1.5" />
      <path d="M9.5 5 V8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
