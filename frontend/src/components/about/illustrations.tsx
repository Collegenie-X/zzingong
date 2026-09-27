// ── 소개 페이지용 커스텀 SVG 일러스트 ──
// 외부 이미지 없이 인라인 SVG로만 그립니다. 모두 순수 함수 컴포넌트.

const C = {
  line: '#2b3a63',
  dim: '#5b6b95',
  text: '#c9d4f0',
  accent: '#e94560',
  green: '#4CAF50',
  amber: '#FFC107',
  blue: '#3b82f6',
  purple: '#a855f7',
  panel: '#131c34',
};

/** 히어로 키비주얼 — 책상 앞 3시간에서 딴짓이 빠져나가고 순공만 남는 그림 */
export function HeroKeyArt() {
  const CX = 150;
  const CY = 146;
  const R = 92;
  // 시계 방향, 12시 방향이 0도
  const polar = (deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [CX + R * Math.cos(a), CY + R * Math.sin(a)];
  };
  const arc = (from: number, to: number) => {
    const [x1, y1] = polar(from);
    const [x2, y2] = polar(to);
    return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${R} ${R} 0 ${to - from > 180 ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  };
  // 순공(초록) 사이사이에 딴짓이 끼어 있는 3시간
  const segs: { a: number; b: number; c: string }[] = [
    { a: 0, b: 90, c: C.green },
    { a: 93, b: 135, c: C.accent },
    { a: 138, b: 205, c: C.green },
    { a: 208, b: 245, c: C.amber },
    { a: 248, b: 292, c: C.green },
    { a: 295, b: 320, c: C.blue },
  ];
  const escaped = [
    { i: '📱', t: '핸드폰', v: '40분', c: C.accent, y: 42 },
    { i: '😶', t: '멍때림', v: '30분', c: C.amber, y: 112 },
    { i: '🧹', t: '책상 정리', v: '18분', c: C.blue, y: 182 },
  ];

  return (
    <svg viewBox="0 0 620 280" role="img" aria-label="책상 앞 3시간에서 딴짓이 빠져나가고 순공 시간만 남는 그림">
      <defs>
        <radialGradient id="keyGlow" cx="24%" cy="52%" r="34%">
          <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#4CAF50" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="620" height="280" fill="url(#keyGlow)" />

      <text x={CX} y="28" fontSize="12" fill={C.dim} textAnchor="middle">
        책상 앞 3시간
      </text>

      {/* 링 */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1b2545" strokeWidth="19" />
      {segs.map((s, i) => (
        <path
          key={i}
          className={s.c === C.green ? 'key-ring-focus' : 'key-ring-off'}
          d={arc(s.a, s.b)}
          fill="none"
          stroke={s.c}
          strokeWidth="19"
          strokeLinecap="round"
          opacity={s.c === C.green ? 0.95 : 0.55}
        />
      ))}

      {/* 링 안쪽 */}
      <text x={CX} y={CY - 6} fontSize="30" fontWeight="700" fill={C.text} textAnchor="middle" fontFamily="monospace">
        1:32:40
      </text>
      <text x={CX} y={CY + 16} fontSize="11.5" fill={C.green} textAnchor="middle" letterSpacing="1">
        오늘 순공 시간
      </text>
      <text x={CX} y={CY + 36} fontSize="10.5" fill={C.dim} textAnchor="middle">
        집중률 51%
      </text>

      {/* 빠져나가는 딴짓 */}
      {escaped.map((e, i) => (
        <g key={e.t} className="key-escape" style={{ animationDelay: `${i * 0.7}s` }}>
          <path
            d={`M${262} ${CY + (e.y - 112) * 0.42} Q ${330} ${e.y + 26} ${382} ${e.y + 22}`}
            fill="none"
            stroke={e.c}
            strokeWidth="1.5"
            strokeDasharray="5 6"
            opacity="0.5"
          />
          <rect x="386" y={e.y} width="176" height="44" rx="14" fill={C.panel} stroke={e.c} strokeWidth="1.4" opacity="0.92" />
          <text x="410" y={e.y + 28} fontSize="16" textAnchor="middle">{e.i}</text>
          <text x="430" y={e.y + 20} fontSize="12.5" fontWeight="700" fill={e.c}>{e.t}</text>
          <text x="430" y={e.y + 35} fontSize="10.5" fill={C.dim}>덜어냄</text>
          <text x="548" y={e.y + 28} fontSize="14" fontWeight="700" fill={C.text} textAnchor="end">{e.v}</text>
        </g>
      ))}

      <text x="474" y="252" fontSize="11" fill={C.dim} textAnchor="middle">
        앉아 있었지만 공부가 아니었던 1시간 28분
      </text>
    </svg>
  );
}

/** 히어로 키비주얼 — 좁은 화면용 세로 배치 (내용은 HeroKeyArt 와 동일) */
export function HeroKeyArtNarrow() {
  const CX = 180;
  const CY = 134;
  const R = 84;
  const polar = (deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [CX + R * Math.cos(a), CY + R * Math.sin(a)];
  };
  const arc = (from: number, to: number) => {
    const [x1, y1] = polar(from);
    const [x2, y2] = polar(to);
    return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${R} ${R} 0 ${to - from > 180 ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  };
  const segs = [
    { a: 0, b: 90, c: C.green },
    { a: 93, b: 135, c: C.accent },
    { a: 138, b: 205, c: C.green },
    { a: 208, b: 245, c: C.amber },
    { a: 248, b: 292, c: C.green },
    { a: 295, b: 320, c: C.blue },
  ];
  const escaped = [
    { i: '📱', t: '핸드폰', v: '40분', c: C.accent },
    { i: '😶', t: '멍때림', v: '30분', c: C.amber },
    { i: '🧹', t: '책상 정리', v: '18분', c: C.blue },
  ];

  return (
    <svg viewBox="0 0 360 424" role="img" aria-label="책상 앞 3시간에서 딴짓이 빠져나가고 순공 시간만 남는 그림">
      <text x={CX} y="20" fontSize="12.5" fill={C.dim} textAnchor="middle">책상 앞 3시간</text>

      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1b2545" strokeWidth="18" />
      {segs.map((s, i) => (
        <path
          key={i}
          className={s.c === C.green ? 'key-ring-focus' : 'key-ring-off'}
          d={arc(s.a, s.b)}
          fill="none"
          stroke={s.c}
          strokeWidth="18"
          strokeLinecap="round"
          opacity={s.c === C.green ? 0.95 : 0.55}
        />
      ))}
      <text x={CX} y={CY - 4} fontSize="30" fontWeight="700" fill={C.text} textAnchor="middle" fontFamily="monospace">
        1:32:40
      </text>
      <text x={CX} y={CY + 18} fontSize="12" fill={C.green} textAnchor="middle">오늘 순공 시간</text>
      <text x={CX} y={CY + 37} fontSize="11" fill={C.dim} textAnchor="middle">집중률 51%</text>

      <path d={`M${CX} 236 v16`} stroke={C.line} strokeWidth="1.5" strokeDasharray="4 4" />
      <text x={CX} y="272" fontSize="12.5" fontWeight="700" fill={C.accent} textAnchor="middle">
        덜어낸 딴짓 1시간 28분
      </text>

      {escaped.map((e, i) => (
        <g key={e.t} transform={`translate(16, ${286 + i * 46})`}>
          <rect width="328" height="38" rx="12" fill={C.panel} stroke={e.c} strokeWidth="1.3" />
          <text x="26" y="25" fontSize="15" textAnchor="middle">{e.i}</text>
          <text x="46" y="24" fontSize="13" fontWeight="700" fill={e.c}>{e.t}</text>
          <text x="306" y="25" fontSize="14" fontWeight="700" fill={C.text} textAnchor="end">{e.v}</text>
        </g>
      ))}
    </svg>
  );
}

/** STAGE 01 — 책상 앞의 나와, 어디론가 흘러간 시간 */
export function HeroArt() {
  return (
    <svg viewBox="0 0 560 300" role="img" aria-label="책상에 앉은 학생과 흘러가는 시간">
      <defs>
        <radialGradient id="heroGlow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#e94560" stopOpacity="0.20" />
          <stop offset="100%" stopColor="#e94560" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="560" height="300" fill="url(#heroGlow)" />

      {/* 흘러가는 시간 점들 */}
      {[...Array(14)].map((_, i) => (
        <circle
          key={i}
          cx={60 + i * 34}
          cy={48 + (i % 3) * 13}
          r={i % 4 === 0 ? 3.4 : 2}
          fill={i % 4 === 0 ? C.accent : C.dim}
          opacity={0.25 + (i % 5) * 0.14}
        />
      ))}
      <path d="M52 62 Q 280 10 512 66" stroke={C.line} strokeWidth="1.5" fill="none" strokeDasharray="5 7" />

      {/* 물음표 */}
      <text x="432" y="128" fontSize="64" fontWeight="700" fill={C.accent} opacity="0.5">?</text>

      {/* 책상 */}
      <rect x="120" y="212" width="330" height="9" rx="4" fill={C.line} />
      <rect x="146" y="221" width="8" height="52" rx="3" fill={C.line} opacity="0.7" />
      <rect x="416" y="221" width="8" height="52" rx="3" fill={C.line} opacity="0.7" />

      {/* 노트북 + 웹캠 */}
      <path d="M296 212 L312 152 h96 l16 60 z" fill={C.panel} stroke={C.line} strokeWidth="2" />
      <rect x="316" y="158" width="88" height="48" rx="3" fill="#0c1428" stroke={C.line} />
      <circle cx="360" cy="150" r="3.6" fill={C.accent} />
      <circle cx="360" cy="150" r="8" fill="none" stroke={C.accent} strokeWidth="1.2" opacity="0.45" />
      <circle cx="360" cy="150" r="14" fill="none" stroke={C.accent} strokeWidth="1" opacity="0.2" />

      {/* 학생 */}
      <circle cx="212" cy="150" r="27" fill={C.panel} stroke={C.dim} strokeWidth="2" />
      <path d="M197 146 h10 M217 146 h10" stroke={C.text} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M203 163 q9 6 18 0" stroke={C.dim} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M166 212 q6 -36 46 -36 t46 36 z" fill={C.panel} stroke={C.dim} strokeWidth="2" />

      {/* 책 */}
      <path d="M232 212 l30 -14 30 14 z" fill={C.line} />
      <path d="M262 198 v14" stroke={C.dim} strokeWidth="1.4" />
    </svg>
  );
}

/** STAGE 02 — 내 기억 vs 기록 (진짜 집중 / 가짜 공부 / 딴짓) */
export function FakeStudyArt() {
  const real = [
    { w: 190, c: C.green, label: '진짜 집중 1시간 30분' },
    { w: 105, c: C.amber, label: '가짜 공부 50분' },
    { w: 85, c: C.accent, label: '대놓고 딴짓 40분' },
  ];
  let x = 96;
  return (
    <svg viewBox="0 0 560 270" role="img" aria-label="기억하는 공부 시간과 실제 기록의 차이">
      <text x="24" y="56" fontSize="13" fill={C.dim}>내 기억</text>
      <rect x="96" y="38" width="380" height="26" rx="8" fill={C.green} opacity="0.85" />
      <text x="286" y="56" fontSize="13" fontWeight="700" fill="#08210d" textAnchor="middle">
        3시간 내내 공부했다
      </text>

      <path d="M286 80 v20" stroke={C.dim} strokeWidth="1.4" strokeDasharray="4 4" />
      <path d="M280 94 l6 8 6 -8" fill="none" stroke={C.dim} strokeWidth="1.6" strokeLinecap="round" />

      <text x="24" y="132" fontSize="13" fill={C.dim}>기록</text>
      {real.map((s, i) => {
        const cur = x;
        x += s.w;
        return <rect key={i} x={cur} y="114" width={s.w - 3} height="26" rx="8" fill={s.c} opacity="0.85" />;
      })}
      <rect x="96" y="114" width="380" height="26" rx="8" fill="none" stroke={C.line} />

      {/* 가짜 공부 구간 강조 */}
      <path d="M288 148 v10 h103 v-10" fill="none" stroke={C.amber} strokeWidth="1.6" />
      <text x="339" y="176" fontSize="12" fontWeight="700" fill={C.amber} textAnchor="middle">
        공부처럼 보였던 시간
      </text>
      <text x="339" y="193" fontSize="11" fill={C.dim} textAnchor="middle">
        앉아는 있었지만 머리는 멈춰 있던 50분
      </text>

      {/* 범례 */}
      {real.map((s, i) => (
        <g key={`l${i}`} transform={`translate(${112 + i * 130}, 224)`}>
          <rect width="10" height="10" rx="3" fill={s.c} />
          <text x="16" y="9.5" fontSize="11.5" fill={C.text}>{s.label}</text>
        </g>
      ))}
    </svg>
  );
}

/** STAGE 03 — 집중 리듬 (시간에 따라 오르내리는 집중도) */
export function RhythmArt() {
  // 5분 간격 집중도(0~1). 초반 워밍업 → 몰입 → 핸드폰에 무너짐 → 회복 → 책상 정리로 다시 하락
  const F = [
    0.14, 0.3, 0.6, 0.79, 0.86, 0.9, 0.88, 0.9, 0.84, 0.46, 0.32, 0.6, 0.78, 0.8, 0.56, 0.3, 0.46,
    0.62, 0.55,
  ];
  const X0 = 60;
  const W = 460;
  const BASE = 206;
  const H = 150;
  const px = (i: number) => X0 + (i / (F.length - 1)) * W;
  const py = (f: number) => BASE - f * H;
  const line = F.map((f, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)} ${py(f).toFixed(1)}`).join(' ');

  return (
    <svg viewBox="0 0 560 280" role="img" aria-label="공부 시간 동안 집중도가 오르내리는 집중 리듬 그래프">
      <defs>
        <linearGradient id="rhythmFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#4CAF50" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* 집중 끊긴 구간 */}
      <rect x={px(8.6)} y="50" width={px(11) - px(8.6)} height={BASE - 50} fill={C.accent} opacity="0.12" />
      <rect x={px(13.6)} y="50" width={px(16) - px(13.6)} height={BASE - 50} fill={C.amber} opacity="0.12" />

      {/* 눈금 */}
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1={X0} y1={py(f)} x2={X0 + W} y2={py(f)} stroke={C.line} strokeWidth="1" opacity="0.6" />
          <text x={X0 - 10} y={py(f) + 4} fontSize="10" fill={C.dim} textAnchor="end">
            {f === 1 ? '몰입' : f === 0.5 ? '흔들림' : '끊김'}
          </text>
        </g>
      ))}

      <path d={`${line} L${X0 + W} ${BASE} L${X0} ${BASE} Z`} fill="url(#rhythmFill)" />
      <path d={line} fill="none" stroke={C.green} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
      {[9, 15].map((i) => (
        <circle key={i} cx={px(i)} cy={py(F[i])} r="4.5" fill="#0f0f23" stroke={C.accent} strokeWidth="2.2" />
      ))}

      {/* 주석 */}
      <text x={px(3)} y="42" fontSize="11" fill={C.dim} textAnchor="middle">집중까지 15분</text>
      <path d={`M${px(3)} 48 v${py(0.79) - 54}`} stroke={C.line} strokeWidth="1" strokeDasharray="3 3" />

      <text x={px(9.8)} y="42" fontSize="11" fontWeight="700" fill={C.accent} textAnchor="middle">
        📱 45분째 무너짐
      </text>
      <text x={px(14.8)} y="42" fontSize="11" fontWeight="700" fill={C.amber} textAnchor="middle">
        🧹 책상 정리 10분
      </text>

      {/* 시간축 */}
      <line x1={X0} y1={BASE} x2={X0 + W} y2={BASE} stroke={C.line} strokeWidth="1.5" />
      {[0, 6, 12, 18].map((i) => (
        <text key={i} x={px(i)} y={BASE + 18} fontSize="10" fill={C.dim} textAnchor="middle">
          {i * 5}분
        </text>
      ))}

      {/* 요약 */}
      {[
        { t: '최고 몰입 구간', v: '25~45분', c: C.green },
        { t: '평균 집중 지속', v: '22분', c: C.text },
        { t: '끊긴 횟수', v: '2회', c: C.accent },
      ].map((b, i) => (
        <g key={b.t} transform={`translate(${34 + i * 172}, 240)`}>
          <rect width="160" height="32" rx="10" fill={C.panel} stroke={C.line} strokeWidth="1.2" />
          <text x="12" y="20" fontSize="10.5" fill={C.dim}>{b.t}</text>
          <text x="148" y="20" fontSize="12" fontWeight="700" fill={b.c} textAnchor="end">{b.v}</text>
        </g>
      ))}
    </svg>
  );
}

/** STAGE 04 — 시선·고개·불필요한 동작 체크 + 딴짓 순간 사진 */
export function WebcamArt() {
  const items = [
    { i: '👀', t: '시선 이탈', d: '교재·화면 밖을 오래 봄', c: C.amber },
    { i: '🙃', t: '고개 돌림', d: '정면에서 벗어난 상태 지속', c: C.amber },
    { i: '📱', t: '핸드폰', d: '집어 드는 동작', c: C.accent },
    { i: '🧹', t: '책상 정리', d: '공부와 상관없는 잔동작', c: C.blue },
    { i: '🚶', t: '자리 비움', d: '화면 변화 없음', c: C.blue },
    { i: '😴', t: '졸음', d: '눈 감김 · 고개 떨굼', c: C.purple },
  ];
  return (
    <svg viewBox="0 0 560 320" role="img" aria-label="웹캠이 시선과 고개 방향, 불필요한 동작을 확인하는 모습">
      <rect x="30" y="24" width="292" height="214" rx="16" fill="#0a1020" stroke={C.line} strokeWidth="2" />

      {/* 얼굴 가이드 + 시선 방향 */}
      <ellipse cx="150" cy="108" rx="40" ry="48" fill="none" stroke={C.amber} strokeWidth="2" strokeDasharray="8 4" opacity="0.8" />
      <path d="M78 206 q22 -64 72 -56 q50 -8 72 56" fill="none" stroke={C.amber} strokeWidth="2" strokeDasharray="8 4" opacity="0.6" />
      <circle cx="137" cy="104" r="4.5" fill={C.amber} />
      <circle cx="161" cy="104" r="4.5" fill={C.amber} />
      <path d="M168 100 q42 -14 74 -34" stroke={C.amber} strokeWidth="2" strokeDasharray="5 4" fill="none" />
      <path d="M236 62 l8 4 -3 8" fill="none" stroke={C.amber} strokeWidth="2" strokeLinecap="round" />
      <text x="248" y="58" fontSize="10.5" fill={C.amber}>시선</text>

      <rect x="44" y="38" width="118" height="22" rx="11" fill="#e65100" />
      <text x="103" y="53" fontSize="11.5" fontWeight="700" fill="#ffe0b2" textAnchor="middle">
        시선 이탈 12초
      </text>

      {/* 딴짓 순간 사진 */}
      <text x="30" y="266" fontSize="10.5" fill={C.dim}>딴짓 순간 기록</text>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${30 + i * 74}, 274)`}>
          <rect width="66" height="38" rx="6" fill="#0a1020" stroke={C.accent} strokeWidth="1.2" opacity="0.9" />
          <circle cx="33" cy="16" r="8" fill="none" stroke={C.dim} strokeWidth="1.4" />
          <path d="M20 34 q6 -12 13 -11 q7 -1 13 11" fill="none" stroke={C.dim} strokeWidth="1.4" />
          <text x="60" y="11" fontSize="8" fill={C.accent} textAnchor="end">
            {['📱', '🙃', '🧹'][i]}
          </text>
        </g>
      ))}
      <text x="256" y="298" fontSize="10" fill={C.dim}>이 컴퓨터에만 남습니다</text>

      {/* 감지 항목 */}
      {items.map((v, i) => (
        <g key={v.t} transform={`translate(${346 + (i % 1) * 0}, ${22 + i * 46})`}>
          <rect width="190" height="38" rx="11" fill={C.panel} stroke={C.line} strokeWidth="1.3" />
          <text x="20" y="25" fontSize="14" textAnchor="middle">{v.i}</text>
          <text x="38" y="18" fontSize="12" fontWeight="700" fill={v.c}>{v.t}</text>
          <text x="38" y="31" fontSize="9.5" fill={C.dim}>{v.d}</text>
        </g>
      ))}
    </svg>
  );
}

/** STAGE 05 — 계획 → 타이머 → 저장 흐름 */
export function FlowArt() {
  return (
    <svg viewBox="0 0 560 220" role="img" aria-label="계획 세우기, 타이머 측정, 기록 저장으로 이어지는 흐름">
      {/* 계획 카드 */}
      <rect x="14" y="34" width="150" height="152" rx="14" fill={C.panel} stroke={C.line} strokeWidth="1.6" />
      <text x="30" y="58" fontSize="11" fill={C.dim} letterSpacing="1">오늘의 공부 계획</text>
      {[
        { c: '#f97316', n: '국어', m: '40분' },
        { c: '#3b82f6', n: '영어', m: '50분' },
        { c: '#a855f7', n: '수학', m: '90분' },
        { c: '#22c55e', n: '사회', m: '30분' },
      ].map((s, i) => (
        <g key={s.n} transform={`translate(28, ${72 + i * 27})`}>
          <circle cx="5" cy="6" r="5" fill={s.c} />
          <text x="18" y="10" fontSize="12" fill={C.text}>{s.n}</text>
          <text x="118" y="10" fontSize="10" fill={C.dim} textAnchor="end">{s.m}</text>
        </g>
      ))}

      <path d="M174 110 h32" stroke={C.dim} strokeWidth="2" />
      <path d="M200 104 l8 6 -8 6" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" />

      {/* 타이머 카드 */}
      <rect x="216" y="34" width="168" height="152" rx="14" fill={C.panel} stroke={C.accent} strokeWidth="1.6" />
      <text x="300" y="66" fontSize="13" fontWeight="700" fill="#a855f7" textAnchor="middle">수학</text>
      <text x="300" y="108" fontSize="30" fontWeight="700" fill={C.text} textAnchor="middle" fontFamily="monospace">
        00:42:18
      </text>
      <rect x="240" y="124" width="120" height="5" rx="3" fill="#1a1a40" />
      <rect x="240" y="124" width="56" height="5" rx="3" fill={C.green} />
      <rect x="240" y="146" width="54" height="24" rx="8" fill={C.green} />
      <text x="267" y="162" fontSize="11" fontWeight="700" fill="#08210d" textAnchor="middle">시작</text>
      <rect x="302" y="146" width="58" height="24" rx="8" fill="#f44336" />
      <text x="331" y="162" fontSize="11" fontWeight="700" fill="#fff" textAnchor="middle">종료</text>

      <path d="M394 110 h32" stroke={C.dim} strokeWidth="2" />
      <path d="M420 104 l8 6 -8 6" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" />

      {/* 저장 */}
      <rect x="438" y="34" width="108" height="152" rx="14" fill={C.panel} stroke={C.line} strokeWidth="1.6" />
      <text x="492" y="58" fontSize="11" fill={C.dim} textAnchor="middle">오늘의 기록</text>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(454, ${76 + i * 26})`}>
          <rect width="76" height="16" rx="5" fill="#0f1930" />
          <rect width={48 - i * 12} height="16" rx="5" fill={C.accent} opacity={0.5 - i * 0.12} />
        </g>
      ))}
      <circle cx="492" cy="162" r="15" fill="none" stroke={C.green} strokeWidth="2" />
      <path d="M485 162 l5 6 10 -12" fill="none" stroke={C.green} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** STAGE 06 — 대시보드 리포트 + AI 코멘트 */
export function ReportArt() {
  const bars = [
    { g: 58, r: 26 },
    { g: 74, r: 16 },
    { g: 40, r: 38 },
    { g: 88, r: 12 },
    { g: 66, r: 22 },
    { g: 96, r: 18 },
    { g: 80, r: 10 },
  ];
  const days = ['월', '화', '수', '목', '금', '토', '일'];
  return (
    <svg viewBox="0 0 560 280" role="img" aria-label="주간 순공 시간 그래프와 AI 코멘트">
      <rect x="14" y="20" width="330" height="200" rx="14" fill={C.panel} stroke={C.line} strokeWidth="1.6" />
      <text x="34" y="44" fontSize="11" fill={C.dim} letterSpacing="1">주간 순공 / 딴짓</text>
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1="34" y1={64 + i * 34} x2="324" y2={64 + i * 34} stroke={C.line} strokeWidth="1" opacity="0.5" />
      ))}
      {bars.map((b, i) => {
        const x = 46 + i * 40;
        const base = 166;
        return (
          <g key={i}>
            <rect x={x} y={base - b.r} width="22" height={b.r} rx="4" fill={C.accent} opacity="0.8" />
            <rect x={x} y={base - b.r - b.g} width="22" height={b.g} rx="4" fill={C.green} opacity="0.85" />
            <text x={x + 11} y={186} fontSize="10" fill={C.dim} textAnchor="middle">{days[i]}</text>
          </g>
        );
      })}
      <path
        d={bars.map((b, i) => `${i === 0 ? 'M' : 'L'}${57 + i * 40} ${166 - b.g - b.r - 12}`).join(' ')}
        fill="none"
        stroke="#60a5fa"
        strokeWidth="2"
        strokeDasharray="4 4"
        opacity="0.8"
      />
      <text x="34" y="206" fontSize="10" fill="#60a5fa">--- 반 평균</text>

      <rect x="360" y="20" width="186" height="200" rx="14" fill="#1a1a40" stroke={C.line} strokeWidth="1.6" />
      <text x="382" y="46" fontSize="11" fill={C.accent} letterSpacing="1">AI 코멘트</text>
      {[
        '수학은 목표를 넘겼어요 👏',
        '영어가 3일째 20분 미만이에요.',
        '핸드폰 시간이 어제보다',
        '12분 줄었습니다.',
        '',
        '내일은 영어부터 시작해볼까요?',
      ].map((t, i) => (
        <text key={i} x="382" y={74 + i * 22} fontSize="12" fill={t.includes('?') ? C.text : '#ccc'}>
          {t}
        </text>
      ))}
    </svg>
  );
}

/** STAGE 07 — 영상은 브라우저 밖으로 나가지 않는다 */
export function PrivacyArt() {
  return (
    <svg viewBox="0 0 560 220" role="img" aria-label="웹캠 영상이 브라우저 밖으로 전송되지 않음">
      <rect x="40" y="34" width="232" height="152" rx="14" fill={C.panel} stroke={C.line} strokeWidth="1.6" />
      <path d="M40 62 h232" stroke={C.line} strokeWidth="1.4" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={62 + i * 16} cy="48" r="4.5" fill={C.line} />
      ))}
      <rect x="64" y="82" width="86" height="64" rx="8" fill="#0a1020" stroke={C.line} />
      <ellipse cx="107" cy="106" rx="14" ry="16" fill="none" stroke={C.green} strokeWidth="1.6" strokeDasharray="5 3" />
      <path d="M86 140 q8 -22 21 -19 q13 -3 21 19" fill="none" stroke={C.green} strokeWidth="1.6" strokeDasharray="5 3" />
      <text x="166" y="98" fontSize="11" fill={C.text}>프레임 비교 · 계산</text>
      <text x="166" y="118" fontSize="11" fill={C.dim}>내 컴퓨터 안에서만</text>
      <rect x="166" y="130" width="84" height="20" rx="10" fill="#0e2415" stroke={C.green} strokeWidth="1.2" />
      <text x="208" y="144" fontSize="10.5" fill={C.green} textAnchor="middle">업로드 없음</text>

      <path d="M286 110 h72" stroke={C.accent} strokeWidth="2" strokeDasharray="6 5" />
      <path d="M352 104 l8 6 -8 6" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" />
      <circle cx="322" cy="110" r="19" fill="#0f0f23" stroke={C.accent} strokeWidth="2" />
      <path d="M312 100 l20 20 M332 100 l-20 20" stroke={C.accent} strokeWidth="2.6" strokeLinecap="round" />

      <path
        d="M392 96 q0 -30 34 -30 t34 30 q22 0 22 26 t-22 26 h-68 q-22 0 -22 -26 t22 -26 z"
        fill="none"
        stroke={C.dim}
        strokeWidth="1.8"
        opacity="0.6"
      />
      <text x="426" y="128" fontSize="11" fill={C.dim} textAnchor="middle">서버</text>
      <text x="426" y="172" fontSize="11" fill={C.dim} textAnchor="middle">영상은 전송되지 않습니다</text>
    </svg>
  );
}
