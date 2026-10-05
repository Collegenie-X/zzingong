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

/** 컴퓨터 비전 감지 — 카메라 프레임 위에 ML Kit 신호(얼굴 각도·눈 뜸·포즈·물체)를 겹쳐 보여 주고 판정으로 이어지는 그림 */
export function VisionArt() {
  const signals = [
    { i: '🙃', t: '고개 회전', v: 'Y 38°', c: C.amber, on: true },
    { i: '👁️', t: '눈 뜸 확률', v: '0.86', c: C.green, on: false },
    { i: '✋', t: '손목 위치', v: '얼굴 앞', c: C.amber, on: true },
    { i: '📱', t: '휴대폰', v: '0.91', c: C.accent, on: true },
  ];
  // 포즈 랜드마크 (어깨 · 팔꿈치 · 손목)
  const pose: [number, number][] = [
    [96, 196],
    [204, 196],
    [218, 238],
    [236, 176],
  ];
  return (
    <svg viewBox="0 0 560 330" role="img" aria-label="카메라 화면에서 얼굴 각도, 눈 뜸, 손목 위치, 휴대폰을 찾아 가짜 공부로 판정하는 모습">
      {/* 카메라 프레임 */}
      <rect x="18" y="18" width="300" height="250" rx="16" fill="#0a1020" stroke={C.line} strokeWidth="2" />
      <circle cx="36" cy="36" r="4" fill={C.accent} className="vision-rec" />
      <text x="46" y="40" fontSize="11" fill={C.dim}>카메라 · 기기 안에서 분석</text>

      {/* 얼굴 (오른쪽으로 돌아간 상태) */}
      <ellipse cx="160" cy="116" rx="38" ry="46" fill="none" stroke={C.dim} strokeWidth="1.6" />
      {/* 얼굴 감지 상자 */}
      <rect x="114" y="62" width="96" height="108" rx="6" fill="none" stroke={C.amber} strokeWidth="1.8" strokeDasharray="6 4" />
      <rect x="114" y="48" width="74" height="16" rx="4" fill={C.amber} />
      <text x="151" y="60" fontSize="10.5" fontWeight="700" fill="#1a1200" textAnchor="middle">
        얼굴 Y 38°
      </text>
      {/* 얼굴 랜드마크 점 */}
      {[
        [150, 104],
        [176, 104],
        [168, 124],
        [156, 142],
        [174, 142],
        [132, 112],
        [190, 96],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.6" fill={C.amber} />
      ))}
      {/* 정면 기준선 vs 지금 방향 */}
      <path d="M160 116 L160 74" stroke={C.dim} strokeWidth="1.4" strokeDasharray="3 3" />
      <path d="M160 116 L196 84" stroke={C.amber} strokeWidth="2" />
      <path d="M160 92 A24 24 0 0 1 177 99" fill="none" stroke={C.amber} strokeWidth="1.6" />

      {/* 포즈 골격 */}
      <path d={`M${pose[0][0]} ${pose[0][1]} L${pose[1][0]} ${pose[1][1]} L${pose[2][0]} ${pose[2][1]} L${pose[3][0]} ${pose[3][1]}`} fill="none" stroke="#38bdf8" strokeWidth="2" opacity="0.85" />
      <path d="M160 162 L150 196" stroke="#38bdf8" strokeWidth="2" opacity="0.6" />
      {pose.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill="#0a1020" stroke="#38bdf8" strokeWidth="2" />
      ))}

      {/* 휴대폰 감지 상자 */}
      <rect x="228" y="140" width="22" height="36" rx="4" fill="#1f2a4a" stroke={C.dim} strokeWidth="1.2" />
      <rect x="220" y="132" width="38" height="52" rx="5" fill="none" stroke={C.accent} strokeWidth="2" />
      <rect x="220" y="116" width="78" height="16" rx="4" fill={C.accent} />
      <text x="259" y="128" fontSize="10.5" fontWeight="700" fill="#fff" textAnchor="middle">
        휴대폰 0.91
      </text>

      <text x="34" y="256" fontSize="10.5" fill={C.dim}>
        얼굴 감지 · 포즈 감지 · 이미지 라벨링
      </text>

      {/* 신호 → 판정 */}
      {signals.map((s, i) => (
        <g key={s.t} transform={`translate(340, ${18 + i * 44})`}>
          <rect width="202" height="36" rx="10" fill={C.panel} stroke={s.on ? s.c : C.line} strokeWidth="1.4" opacity={s.on ? 1 : 0.7} />
          <text x="18" y="24" fontSize="14" textAnchor="middle">
            {s.i}
          </text>
          <text x="36" y="23" fontSize="12" fill={C.text}>
            {s.t}
          </text>
          <text x="190" y="23" fontSize="12" fontWeight="700" fill={s.c} textAnchor="end" fontFamily="monospace">
            {s.v}
          </text>
        </g>
      ))}
      <path d="M441 196 L441 212" stroke={C.accent} strokeWidth="2" />
      <path d="M435 206 L441 214 L447 206" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" />
      <rect x="340" y="218" width="202" height="50" rx="12" fill="rgba(233,69,96,0.14)" stroke={C.accent} strokeWidth="1.8" />
      <text x="441" y="238" fontSize="11" fill={C.accent} textAnchor="middle" letterSpacing="1">
        3개 신호 · 6초 지속
      </text>
      <text x="441" y="258" fontSize="14" fontWeight="800" fill="#fff" textAnchor="middle">
        가짜 공부 · 📱 핸드폰
      </text>

      {/* 하단: 온디바이스 흐름 */}
      {['프레임', 'ML Kit 모델', '신호', '지속 시간 규칙', '태그'].map((t, i) => (
        <g key={t} transform={`translate(${18 + i * 108}, 290)`}>
          <rect width="92" height="26" rx="13" fill={i === 1 ? 'rgba(66,133,244,0.18)' : C.panel} stroke={i === 1 ? '#4285f4' : C.line} strokeWidth="1.2" />
          <text x="46" y="17.5" fontSize="11" fill={i === 1 ? '#8ab4ff' : C.text} textAnchor="middle">
            {t}
          </text>
          {i < 4 && <path d={`M96 13 L104 13`} stroke={C.dim} strokeWidth="1.4" />}
        </g>
      ))}
    </svg>
  );
}

/** 레이스 화면 — 찐공 러너가 달리고 가짜 공부 유령이 쫓아오는 실제 측정 화면을 축약한 그림 */
export function RaceArt() {
  const X0 = 40;
  const X1 = 500;
  const G = 150;
  const runnerX = X0 + (X1 - X0) * 0.58;
  const ghostX = X0 + (X1 - X0) * 0.15;
  const stats = [
    { l: '💪 찐공', v: '00:42:10', c: C.green },
    { l: '👻 가짜 공부', v: '6:20', c: C.purple },
    { l: '💎 순도', v: '87%', c: '#38bdf8' },
    { l: '🔥 콤보', v: '12:30', c: '#f97316' },
  ];
  return (
    <svg viewBox="0 0 560 330" role="img" aria-label="찐공 러너가 결승선을 향해 달리고 가짜 공부 유령이 뒤쫓는 레이스 화면">
      <defs>
        <linearGradient id="raceSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1446" />
          <stop offset="100%" stopColor="#0b1026" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="540" height="190" rx="16" fill="url(#raceSky)" stroke={C.line} strokeWidth="1.6" />
      {/* 도시 실루엣 */}
      {[30, 70, 96, 150, 210, 250, 300, 360, 410, 452, 500].map((x, i) => (
        <rect key={x} x={x} y={G - 30 - ((i * 37) % 50)} width={i % 2 ? 26 : 34} height={30 + ((i * 37) % 50)} fill="#151a3d" />
      ))}
      {[[60, 30], [180, 44], [320, 26], [430, 50], [520, 34]].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="1.4" fill="#fff" opacity="0.6" />
      ))}

      {/* 트랙 */}
      <line x1={X0} y1={G} x2={X1} y2={G} stroke="#3b4a7a" strokeWidth="3" />
      <line x1={X0} y1={G} x2={runnerX} y2={G} stroke={C.green} strokeWidth="3" />
      {[0.25, 0.5, 0.75].map((p) => (
        <g key={p}>
          <line x1={X0 + (X1 - X0) * p} y1={G - 4} x2={X0 + (X1 - X0) * p} y2={G + 4} stroke={C.dim} strokeWidth="1.4" />
          <text x={X0 + (X1 - X0) * p} y={G + 20} fontSize="10.5" fill={C.dim} textAnchor="middle">
            {p * 100}%
          </text>
        </g>
      ))}
      {/* 결승선 */}
      <line x1={X1 + 10} y1={G} x2={X1 + 10} y2={G - 70} stroke="#cbd5e1" strokeWidth="2" />
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2].map((c) => (
          <rect key={`${r}${c}`} x={X1 + 12 + c * 8} y={G - 70 + r * 6} width="8" height="6" fill={(r + c) % 2 ? '#0b1026' : '#fff'} />
        )),
      )}
      <text x={X1 + 22} y={G - 76} fontSize="11" fontWeight="800" fill="#fbbf24" textAnchor="middle">
        GOAL
      </text>

      {/* 유령 */}
      <g transform={`translate(${ghostX}, ${G})`} className="race-ghost-art">
        <path d="M-17 -6 L-17 -34 Q-17 -54 0 -54 Q17 -54 17 -34 L17 -6 L11 -12 L6 -6 L0 -12 L-6 -6 L-11 -12 Z" fill={C.purple} opacity="0.92" />
        <circle cx="-6" cy="-36" r="3.4" fill="#fff" />
        <circle cx="7" cy="-36" r="3.4" fill="#fff" />
        <text y="16" fontSize="10" fill={C.purple} textAnchor="middle">
          가짜 공부
        </text>
      </g>
      {/* 러너 */}
      <g transform={`translate(${runnerX}, ${G})`} className="race-runner-art">
        <line x1="-36" y1="-46" x2="-20" y2="-46" stroke={C.dim} strokeWidth="2" strokeLinecap="round" />
        <line x1="-40" y1="-32" x2="-22" y2="-32" stroke={C.dim} strokeWidth="2" strokeLinecap="round" />
        <circle cx="2" cy="-56" r="9" fill="#fcd9b6" />
        <path d="M-7 -60 Q2 -70 11 -60" stroke={C.accent} strokeWidth="4" fill="none" />
        <rect x="-8" y="-46" width="18" height="24" rx="5" fill={C.accent} />
        <path d="M-4 -22 L-12 -2 M6 -22 L12 -2" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
        <path d="M-8 -40 L-16 -30 M10 -40 L18 -48" stroke="#fcd9b6" strokeWidth="4" strokeLinecap="round" />
      </g>

      {/* 말풍선 */}
      <g>
        <rect x={runnerX - 34} y="58" width="68" height="22" rx="11" fill={C.green} />
        <text x={runnerX} y="73" fontSize="11.5" fontWeight="700" fill="#06210c" textAnchor="middle">
          영차영차!
        </text>
        <rect x={ghostX - 44} y="68" width="88" height="22" rx="11" fill="#2a1d4d" stroke={C.purple} strokeWidth="1.2" />
        <text x={ghostX} y="83" fontSize="11" fill="#e9d5ff" textAnchor="middle">
          거기 서~ 흐흐
        </text>
      </g>

      {/* 감지 경보 바 */}
      <rect x="10" y="212" width="540" height="44" rx="12" fill="rgba(233,69,96,0.12)" stroke={C.accent} strokeWidth="1.6" />
      <text x="28" y="239" fontSize="13" fontWeight="700" fill="#fecaca">
        🚨 가짜 공부 감지 · 📱 핸드폰 0:24
      </text>
      <rect x="418" y="220" width="122" height="28" rx="9" fill="#16a34a" />
      <text x="479" y="239" fontSize="12.5" fontWeight="800" fill="#fff" textAnchor="middle">
        💪 정신 차리기
      </text>

      {/* 통계 칩 */}
      {stats.map((s, i) => (
        <g key={s.l} transform={`translate(${10 + i * 137}, 268)`}>
          <rect width="129" height="52" rx="12" fill={C.panel} stroke={C.line} strokeWidth="1.3" />
          <text x="64.5" y="20" fontSize="11" fill={C.dim} textAnchor="middle">
            {s.l}
          </text>
          <text x="64.5" y="41" fontSize="16" fontWeight="800" fill={s.c} textAnchor="middle" fontFamily="monospace">
            {s.v}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** 사용법 — 계획 → 레이스 → 저장 흐름 */
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

/** AI 학습 리포트 — 코치 로봇 말풍선 + 등급 배지, 나 vs 반 평균 추이, 과목 밸런스 */
export function ReportArt() {
  const me = [40, 52, 46, 64, 58, 76, 84];
  const avg = [48, 50, 52, 50, 54, 55, 56];
  const px = (i: number) => 40 + i * 44;
  const py = (v: number) => 236 - v * 1.1;
  const line = (a: number[]) => a.map((v, i) => `${i ? 'L' : 'M'}${px(i)} ${py(v).toFixed(1)}`).join(' ');
  const subjects = [
    { n: '국어', w: 0.92, c: '#f97316', s: '강점', sc: C.green },
    { n: '수학', w: 0.74, c: C.purple, s: '좋아요', sc: C.green },
    { n: '영어', w: 0.46, c: C.blue, s: '조금 더', sc: '#f59e0b' },
    { n: '과학', w: 0.28, c: '#06b6d4', s: '보강', sc: C.accent },
  ];
  return (
    <svg viewBox="0 0 560 330" role="img" aria-label="코치 로봇이 등급과 함께 말해 주는 AI 학습 리포트, 반 평균 대비 추이와 과목 밸런스">
      {/* 코치 + 말풍선 + 등급 */}
      <g transform="translate(16, 14)">
        <rect width="528" height="78" rx="14" fill={C.panel} stroke={C.line} strokeWidth="1.5" />
        <g transform="translate(40, 40)">
          <line x1="0" y1="-26" x2="0" y2="-18" stroke="#94a3b8" strokeWidth="2" />
          <circle cx="0" cy="-28" r="3.5" fill="#fbbf24" />
          <rect x="-22" y="-18" width="44" height="36" rx="12" fill="#e2e8f0" />
          <rect x="-16" y="-10" width="32" height="18" rx="7" fill="#1e293b" />
          <path d="M-10 -1 q3 -4 6 0 M4 -1 q3 -4 6 0" stroke="#4ade80" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
        <text x="80" y="32" fontSize="13.5" fontWeight="800" fill="#fff">
          아주 잘하고 있어요
        </text>
        <text x="80" y="54" fontSize="12" fill={C.text}>
          최근 1주 42시간 공부 · 반 평균보다 <tspan fill={C.green} fontWeight="700">+19시간</tspan>
        </text>
        <g transform="translate(476, 39)">
          <path d="M0 -28 L24 -14 L24 14 L0 28 L-24 14 L-24 -14 Z" fill="rgba(34,197,94,0.16)" stroke={C.green} strokeWidth="2" />
          <text y="8" fontSize="22" fontWeight="900" fill={C.green} textAnchor="middle">
            A
          </text>
        </g>
        <text x="420" y="64" fontSize="10.5" fill={C.dim} textAnchor="end">
          20명 중 5등
        </text>
      </g>

      {/* 추이 */}
      <rect x="16" y="104" width="300" height="212" rx="14" fill={C.panel} stroke={C.line} strokeWidth="1.5" />
      <text x="34" y="128" fontSize="11.5" fill={C.dim}>
        공부량 흐름
      </text>
      <text x="300" y="128" fontSize="10.5" fill={C.dim} textAnchor="end">
        <tspan fill={C.accent}>━ 나</tspan>  <tspan fill="#fbbf24">┅ 반 평균</tspan>
      </text>
      <path d={`${line(me)} L${px(6)} 236 L${px(0)} 236 Z`} fill="rgba(233,69,96,0.16)" />
      <path d={line(avg)} fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="5 4" />
      <path d={line(me)} fill="none" stroke={C.accent} strokeWidth="2.6" />
      <circle cx={px(6)} cy={py(me[6])} r="5" fill="#fff" stroke={C.accent} strokeWidth="2.4" />
      {['월', '화', '수', '목', '금', '토', '일'].map((d, i) => (
        <text key={d} x={px(i)} y="258" fontSize="10.5" fill={C.dim} textAnchor="middle">
          {d}
        </text>
      ))}
      <rect x="34" y="272" width="264" height="32" rx="9" fill="rgba(251,191,36,0.1)" stroke="rgba(251,191,36,0.5)" />
      <text x="166" y="292" fontSize="11.5" fill="#fde68a" textAnchor="middle">
        🏅 칭찬 · 집중률 97%, 딴짓 없이 몰입
      </text>

      {/* 과목 밸런스 */}
      <rect x="328" y="104" width="216" height="212" rx="14" fill={C.panel} stroke={C.line} strokeWidth="1.5" />
      <text x="346" y="128" fontSize="11.5" fill={C.dim}>
        과목 밸런스
      </text>
      {subjects.map((s, i) => {
        const y = 150 + i * 30;
        return (
          <g key={s.n}>
            <text x="346" y={y + 4} fontSize="11.5" fill={s.c} fontWeight="700">
              {s.n}
            </text>
            <rect x="380" y={y - 5} width="104" height="10" rx="5" fill="#1b2545" />
            <rect x="380" y={y - 5} width={104 * s.w} height="10" rx="5" fill={s.c} />
            <line x1="440" y1={y - 8} x2="440" y2={y + 8} stroke="#fff" strokeWidth="1.4" opacity="0.7" />
            <text x="530" y={y + 4} fontSize="10.5" fill={s.sc} textAnchor="end" fontWeight="700">
              {s.s}
            </text>
          </g>
        );
      })}
      <rect x="342" y="272" width="188" height="32" rx="9" fill="rgba(56,189,248,0.1)" stroke="rgba(56,189,248,0.5)" />
      <text x="436" y="292" fontSize="11.5" fill="#bae6fd" textAnchor="middle">
        🎯 미션 · 과학 하루 18분 더
      </text>
    </svg>
  );
}

/** 프라이버시 — 영상은 기기 밖으로 나가지 않는다 */
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
