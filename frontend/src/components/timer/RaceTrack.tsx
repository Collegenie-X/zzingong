'use client';

// 측정 중 레이스 화면: "찐공" 러너 vs 뒤쫓아오는 "가짜 공부" 유령
// - 러너는 찐공 시간(경과 - 딴짓)만큼만 앞으로 나아갑니다
// - 유령은 가짜 공부(딴짓) 시간만큼 따라옵니다 → 딴짓이 쌓이면 따라잡힙니다
// - 딴짓 태그가 켜져 있으면 러너가 멈추고 "가짜 공부 감지" 경보가 뜹니다

import { fmtHMS, fmtShort } from '@/lib/format';
import type { FakeStatus, Tag } from './MonitorPanel';

interface Props {
  color: string;
  elapsed: number;
  goalSec: number;
  running: boolean;
  fake: FakeStatus;
  onFocusBack: () => void;
}

const FAKE_LINES: Record<Tag, { icon: string; label: string; runner: string; ghost: string }> = {
  phone: { icon: '📱', label: '핸드폰', runner: '딱 1분만…', ghost: '알림 왔다~ 흐흐' },
  spacing: { icon: '😶', label: '멍때림', runner: '…(멍)', ghost: '생각은 나중에~' },
  away: { icon: '🚶', label: '자리 비움', runner: '금방 올게!', ghost: '자리 접수 완료~' },
  drowsy: { icon: '😴', label: '졸음', runner: 'Zzz…', ghost: '푹 자라~ 흐흐' },
};

// 트랙 좌표 (viewBox 600 x 190)
const X0 = 74;
const X1 = 540;
const GROUND = 150;

function cheer(elapsed: number, combo: number): string {
  if (combo >= 1800) return '🔥 무적 모드!';
  if (combo >= 600 && elapsed % 6 < 2) return `🔥 ${Math.floor(combo / 60)}분 콤보!`;
  return elapsed % 2 === 0 ? '영차!' : '영차영차!';
}

function Bubble({ x, y, text, tone }: { x: number; y: number; text: string; tone: 'run' | 'fake' | 'ghost' | 'rest' }) {
  // 한글 1자 ≈ 12px, 영문/숫자 ≈ 7px 로 대략 폭을 잡습니다
  const w = [...text].reduce((a, ch) => a + (/[ㄱ-힝]/.test(ch) ? 12 : 8), 0) + 18;
  const left = Math.min(Math.max(x - w / 2, 4), 596 - w);
  return (
    <g className={`race-bubble ${tone}`}>
      <rect x={left} y={y - 22} width={w} height={22} rx={11} />
      <path d={`M${x - 5} ${y} L${x} ${y + 7} L${x + 5} ${y} Z`} />
      <text x={left + w / 2} y={y - 7} textAnchor="middle">
        {text}
      </text>
    </g>
  );
}

function Runner({ color }: { color: string }) {
  // 발끝이 (0,0), 오른쪽을 보고 달리는 자세
  return (
    <g className="runner-bob">
      <g className="speed-lines">
        <line x1={-34} y1={-50} x2={-18} y2={-50} />
        <line x1={-40} y1={-38} x2={-20} y2={-38} />
        <line x1={-32} y1={-26} x2={-18} y2={-26} />
      </g>
      {/* 뒷다리·뒷팔 */}
      <g className="limb leg-b">
        <rect x={-3.5} y={-24} width={7} height={24} rx={3.5} fill="#23265c" />
        <rect x={-3} y={-3} width={10} height={5} rx={2.5} fill="#e94560" />
      </g>
      <g className="limb arm-b">
        <rect x={-3} y={-46} width={6} height={18} rx={3} fill="#e8b98f" />
      </g>
      {/* 몸통 (과목 색 운동복) */}
      <rect x={-10} y={-50} width={20} height={28} rx={9} fill={color} />
      <text x={0} y={-31} textAnchor="middle" className="runner-num">
        1
      </text>
      {/* 앞다리 */}
      <g className="limb leg-f">
        <rect x={-3.5} y={-24} width={7} height={24} rx={3.5} fill="#2e3275" />
        <rect x={-3} y={-3} width={10} height={5} rx={2.5} fill="#ff6b81" />
      </g>
      {/* 머리 */}
      <g className="runner-head">
        <circle cx={2} cy={-63} r={13} fill="#ffd9b3" />
        <path d="M-11 -64 Q-9 -79 4 -77 Q14 -76 15 -66 Q8 -71 -2 -69 Z" fill="#2b2b3a" />
        {/* 머리띠 + 휘날리는 끈 */}
        <rect x={-11} y={-70} width={26} height={5} rx={2.5} fill="#e94560" />
        <g className="headband-tail">
          <path d="M-10 -68 Q-20 -72 -26 -66 Q-19 -66 -10 -66 Z" fill="#e94560" />
        </g>
        <circle className="runner-eye" cx={9} cy={-62} r={1.8} fill="#222" />
        <path className="runner-mouth" d="M8 -55 Q11 -53 13 -56" stroke="#a0522d" strokeWidth={1.5} fill="none" />
        <circle cx={6} cy={-57} r={2.2} fill="#ff9aa2" opacity={0.55} />
      </g>
      {/* 땀방울 */}
      <g className="sweat">
        <path d="M-8 -72 q-3 5 0 7 q3 -2 0 -7 z" fill="#7fd3ff" />
        <path d="M-12 -62 q-2.5 4 0 6 q2.5 -2 0 -6 z" fill="#7fd3ff" />
      </g>
      {/* 앞팔 (연필) */}
      <g className="limb arm-f">
        <rect x={-3} y={-46} width={6} height={18} rx={3} fill="#ffcfa3" />
        <g className="pencil">
          <rect x={-1.5} y={-34} width={3} height={14} fill="#ffc107" transform="rotate(-60 0 -28)" />
        </g>
        <g className="phone">
          <rect x={-4} y={-32} width={8} height={12} rx={2} fill="#333" />
          <rect x={-2.8} y={-30.5} width={5.6} height={8} rx={1} fill="#7fd3ff" />
        </g>
      </g>
    </g>
  );
}

function Ghost() {
  return (
    <g className="ghost-float">
      <path
        d="M-18 0 L-18 -26 Q-18 -46 0 -46 Q18 -46 18 -26 L18 0 L12 -6 L6 0 L0 -6 L-6 0 L-12 -6 Z"
        fill="#9c5cff"
        opacity={0.88}
      />
      <ellipse cx={-6} cy={-28} rx={3.4} ry={4.4} fill="#fff" />
      <ellipse cx={7} cy={-28} rx={3.4} ry={4.4} fill="#fff" />
      <circle cx={-4.8} cy={-27} r={1.8} fill="#1a1a2e" />
      <circle cx={8.2} cy={-27} r={1.8} fill="#1a1a2e" />
      <path d="M-5 -17 Q1 -12 7 -17" stroke="#1a1a2e" strokeWidth={1.6} fill="none" />
      {/* 유혹용 핸드폰 */}
      <g transform="translate(18 -24) rotate(14)">
        <rect x={-4} y={-7} width={9} height={14} rx={2} fill="#222" />
        <rect x={-2.6} y={-5.4} width={6.2} height={9.6} rx={1} fill="#ff6b81" className="ghost-screen" />
      </g>
      <text y={14} textAnchor="middle" className="ghost-label">
        가짜 공부
      </text>
    </g>
  );
}

export default function RaceTrack({ color, elapsed, goalSec, running, fake, onFocusBack }: Props) {
  const real = Math.max(elapsed - fake.total, 0);
  const span = X1 - X0;
  const runnerX = X0 + Math.min(real / goalSec, 1) * span;
  const ghostX = X0 - 48 + Math.min(fake.total / goalSec, 1) * span;
  const gap = runnerX - ghostX;
  const caught = fake.total > 0 && gap < 30;
  const goal = real >= goalSec;
  const purity = elapsed > 0 ? Math.round((real / elapsed) * 100) : 100;

  const mode: 'run' | 'rest' | 'fake' = !running ? 'rest' : fake.tag ? 'fake' : 'run';
  const fakeMeta = fake.tag ? FAKE_LINES[fake.tag] : null;

  let runnerLine: string;
  let runnerTone: 'run' | 'fake' | 'rest' = mode;
  if (mode === 'rest') runnerLine = '헥헥… 잠깐 쉬는 중';
  else if (fakeMeta) runnerLine = fakeMeta.runner;
  else if (goal) runnerLine = '🏁 골인! 계속 달려!';
  else runnerLine = cheer(elapsed, fake.combo);
  if (goal && mode === 'run') runnerTone = 'run';

  let ghostLine: string | null = null;
  if (fakeMeta) ghostLine = fakeMeta.ghost;
  else if (caught) ghostLine = '잡았다~!';
  else if (mode === 'run' && fake.total > 0 && gap < 90 && elapsed % 8 < 3) ghostLine = '거의 다 왔다~';

  return (
    <div className={`race race-${mode}${caught ? ' caught' : ''}${fake.combo >= 300 ? ' fever' : ''}`}>
      <svg className="race-scene" viewBox="0 0 600 190" role="img" aria-label={`찐공 ${fmtHMS(real)}, 가짜 공부 ${fmtShort(fake.total)}`}>
        <defs>
          <linearGradient id="race-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#141a3a" />
            <stop offset="1" stopColor="#25204f" />
          </linearGradient>
          <pattern id="race-check" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="#fff" />
            <rect width="4" height="4" fill="#222" />
            <rect x="4" y="4" width="4" height="4" fill="#222" />
          </pattern>
        </defs>
        <rect width="600" height="190" fill="url(#race-sky)" />

        {/* 별 */}
        <g className="race-stars" fill="#fff">
          {[
            [40, 22], [120, 40], [210, 18], [300, 34], [390, 14], [470, 44], [560, 24], [250, 56],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={1.2} />
          ))}
        </g>

        {/* 흘러가는 도시 실루엣 (두 장을 이어 붙여 반복) */}
        <g className="race-city">
          {[0, 600].map((ox) => (
            <g key={ox} transform={`translate(${ox} 0)`} fill="#1c2050">
              <rect x={10} y={92} width={36} height={58} />
              <rect x={52} y={70} width={28} height={80} />
              <rect x={90} y={104} width={44} height={46} />
              <rect x={150} y={80} width={30} height={70} />
              <rect x={190} y={96} width={52} height={54} />
              <rect x={262} y={64} width={26} height={86} />
              <rect x={298} y={100} width={40} height={50} />
              <rect x={352} y={84} width={34} height={66} />
              <rect x={398} y={110} width={48} height={40} />
              <rect x={460} y={74} width={30} height={76} />
              <rect x={500} y={98} width={42} height={52} />
              <rect x={552} y={88} width={40} height={62} />
            </g>
          ))}
        </g>

        {/* 트랙 */}
        <rect x={0} y={GROUND} width={600} height={40} fill="#2a1f45" />
        <rect x={0} y={GROUND} width={600} height={3} fill="#e94560" opacity={0.7} />
        <line className="race-lane" x1={0} y1={GROUND + 20} x2={600} y2={GROUND + 20} />

        {/* 구간 표시 */}
        {[0.25, 0.5, 0.75].map((r) => (
          <g key={r} className="race-mark">
            <line x1={X0 + span * r} y1={GROUND} x2={X0 + span * r} y2={GROUND + 10} />
            <text x={X0 + span * r} y={GROUND + 36} textAnchor="middle">
              {Math.round(r * 100)}%
            </text>
          </g>
        ))}

        {/* 출발선 · 결승선 */}
        <rect x={X0 - 2} y={GROUND} width={4} height={40} fill="#fff" opacity={0.35} />
        <g className={`race-flag${goal ? ' won' : ''}`}>
          <rect x={X1 + 18} y={GROUND} width={8} height={40} fill="url(#race-check)" />
          <line x1={X1 + 22} y1={GROUND} x2={X1 + 22} y2={GROUND - 66} stroke="#ddd" strokeWidth={2.5} />
          <path className="flag-cloth" d={`M${X1 + 23} ${GROUND - 66} h30 v20 h-30 Z`} fill="url(#race-check)" />
          <text x={X1 + 22} y={GROUND - 72} textAnchor="middle" className="race-goal-text">
            GOAL
          </text>
        </g>

        {/* 가짜 공부 유령 */}
        <g className="race-ghost" style={{ transform: `translate(${Math.max(ghostX, 20)}px, ${GROUND - 8}px)` }}>
          <Ghost />
        </g>

        {/* 러너 */}
        <g className="race-runner" style={{ transform: `translate(${runnerX}px, ${GROUND}px)` }}>
          <ellipse cx={0} cy={1} rx={14} ry={3} fill="#000" opacity={0.3} className="runner-shadow" />
          <Runner color={color} />
          {fakeMeta && (
            <text x={22} y={-78} className="runner-fake-icon">
              {fakeMeta.icon}
            </text>
          )}
        </g>

        {/* 말풍선 */}
        <Bubble key={`r-${runnerLine}`} x={runnerX} y={GROUND - 86} text={runnerLine} tone={runnerTone} />
        {ghostLine && <Bubble key={`g-${ghostLine}`} x={Math.max(ghostX, 20)} y={GROUND - 64} text={ghostLine} tone="ghost" />}

        {/* 가짜 공부 경보 */}
        {mode === 'fake' && <rect className="race-alarm" width="600" height="190" />}
      </svg>

      {mode === 'fake' && fakeMeta && (
        <div className="race-alert" role="status">
          <span className="race-alert-text">
            🚨 가짜 공부 감지 · {fakeMeta.icon} {fakeMeta.label}
            <small>러너가 멈췄어요! 유령이 쫓아와요</small>
          </span>
          <button className="race-focus-btn" onClick={onFocusBack}>
            💪 정신 차리기
          </button>
        </div>
      )}
      {mode !== 'fake' && caught && (
        <div className="race-alert caught" role="status">
          <span className="race-alert-text">
            👻 가짜 공부에게 따라잡혔어요!
            <small>딴짓 없이 달려서 다시 거리를 벌려 보세요</small>
          </span>
        </div>
      )}

      <div className="race-hud">
        <div className="hud-stat real">
          <span className="hud-lbl">💪 찐공</span>
          <span className="hud-val">{fmtHMS(real)}</span>
        </div>
        <div className={`hud-stat fake${fake.tag ? ' live' : ''}`}>
          <span className="hud-lbl">👻 가짜 공부</span>
          <span className="hud-val">{fmtShort(fake.total)}</span>
        </div>
        <div className={`hud-stat purity${purity < 80 ? ' low' : ''}`}>
          <span className="hud-lbl">💎 순도</span>
          <span className="hud-val">{purity}%</span>
        </div>
        <div className={`hud-stat combo${fake.combo >= 300 ? ' hot' : ''}`}>
          <span className="hud-lbl">🔥 콤보</span>
          <span className="hud-val">{fmtShort(fake.combo)}</span>
        </div>
      </div>
    </div>
  );
}
