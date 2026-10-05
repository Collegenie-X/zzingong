'use client';

// ── 소개 페이지 "전체 그림" 순서도 (커스텀 SVG) ──
// 계획 → AI 감지 → 레이스 → 기록 ─(숫자만)→ 반 비교 → AI 리포트 → 다시 계획.
// 위 칸은 "내 기기 안", 아래 칸은 "서버". 경계에서 영상은 막히고 숫자만 내려갑니다.
// 빛나는 토큰이 화살표를 따라 이동하며 도착한 단계를 차례로 밝힙니다 (SMIL, 한 타임라인으로 동기화).
// 넓은 화면은 가로(ㄹ자) 배치, 좁은 화면은 세로 배치를 따로 그립니다.
// 아래 "N바퀴째" 표시는 토큰이 한 바퀴 돌 때마다 예시 수치가 조금씩 나아지는 모습을 보여 줍니다.

import { useEffect, useRef, useState } from 'react';
import { hl } from './Highlight';

const C = {
  ink: '#e6ebff',
  dim: '#8c9ac4',
  faint: '#5b6b95',
  line: '#2b3a63',
  node: '#0f1530',
  accent: '#e94560',
  green: '#4ade80',
  blue: '#8ab4ff',
  red: '#f87171',
  token: '#fbbf24',
};

type Pt = [number, number];

interface StepDef {
  icon: string;
  title: string;
  /** 넓은 화면: 두 줄 설명 */
  lines: [string, string];
  /** 좁은 화면: 한 줄 설명 */
  short: string;
  href: string;
}

const STEPS: StepDef[] = [
  { icon: '🗓️', title: '계획', lines: ['과목·목표 시간으로', '==예상 종료 시각=='], short: '과목·목표 → ==예상 종료 시각==', href: '#flow' },
  { icon: '🧠', title: 'AI 감지', lines: ['카메라로 ==고개·눈·==', '==자세·휴대폰== 판단'], short: '==고개·눈·자세·휴대폰== 판단', href: '#vision' },
  { icon: '🏃', title: '레이스', lines: ['==찐공==은 달리고', '==딴짓==은 즉시 경보'], short: '==찐공==은 달리고, ==딴짓==은 경보', href: '#race' },
  { icon: '🔢', title: '기록', lines: ['순공·딴짓 유형별', '시간을 ==숫자로=='], short: '순공·딴짓 시간을 ==숫자로==', href: '#privacy' },
  { icon: '🏫', title: '반 비교', lines: ['같은 기준의 숫자로', '==반 순위·평균=='], short: '같은 기준으로 ==순위·평균==', href: '#report' },
  { icon: '🤖', title: 'AI 리포트', lines: ['등급·칭찬과', '=="하루 N분 더"== 미션'], short: '등급·칭찬·=="하루 N분 더"==', href: '#report' },
];

/** SVG 글자용 강조: `==단어==` 를 밝은 색 굵은 tspan 으로 바꿉니다 (본문의 hl() 과 같은 문법) */
function em(text: string) {
  return text.split(/(==[^=]+==)/g).map((part, i) =>
    part.length > 4 && part.startsWith('==') && part.endsWith('==') ? (
      <tspan key={i} className="ov-em">
        {part.slice(2, -2)}
      </tspan>
    ) : (
      <tspan key={i}>{part}</tspan>
    ),
  );
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Edge {
  d: string;
  label?: string;
  lx?: number;
  ly?: number;
  anchor?: 'start' | 'middle' | 'end';
}

interface Layout {
  key: 'wide' | 'narrow';
  w: number;
  h: number;
  zones: { box: Box; tone: 'device' | 'server'; label: string; note: string; noteX: number }[];
  nodes: Box[];
  loop: Box;
  edges: Edge[];
  /** 경계선 y, 숫자가 통과하는 화살표, 막힌 영상 화살표 */
  gate: { y: number; pass: Edge; passPill: Box; block: { x: number; y1: number; y2: number }; blockPill: Box };
  /** 토큰이 지나는 길 (단계 중심 → 다음 단계 중심) */
  route: Pt[];
  /** route 의 몇 번째 점에서 멈추는지 → 몇 번째 단계(0~5, 6=다시 계획) */
  stops: { at: number; node: number }[];
}

// ── 넓은 화면: 위 줄 1→4, 아래로 내려가 5←6, 왼쪽에서 다시 1로 ──
const WIDE: Layout = (() => {
  const W = 170;
  const H = 116;
  const cx = [114, 331, 548, 765];
  const row1 = 54;
  const row2 = 306;
  const nodes: Box[] = [
    ...cx.map((x) => ({ x: x - W / 2, y: row1, w: W, h: H })),
    { x: cx[3] - W / 2, y: row2, w: W, h: H },
    { x: cx[2] - W / 2, y: row2, w: W, h: H },
  ];
  const y1 = row1 + H / 2;
  const y2 = row2 + H / 2;
  const hw = W / 2;
  const loop: Box = { x: cx[0] - hw, y: y2 - 29, w: W + 14, h: 58 };
  const midX = (i: number) => (cx[i] + cx[i + 1]) / 2;
  return {
    key: 'wide',
    w: 880,
    h: 462,
    zones: [
      { box: { x: 10, y: 10, w: 860, h: 186 }, tone: 'device', label: '내 기기 안 · 온디바이스', note: '실시간 · 오프라인 OK', noteX: 852 },
      { box: { x: 10, y: 262, w: 860, h: 186 }, tone: 'server', label: '서버 · 반 전체', note: '숫자만 비교', noteX: 852 },
    ],
    nodes,
    loop,
    edges: [
      { d: `M${cx[0] + hw + 2} ${y1} H${cx[1] - hw - 6}`, label: '시작', lx: midX(0), ly: y1 - 10 },
      { d: `M${cx[1] + hw + 2} ${y1} H${cx[2] - hw - 6}`, label: '실시간', lx: midX(1), ly: y1 - 10 },
      { d: `M${cx[2] + hw + 2} ${y1} H${cx[3] - hw - 6}`, label: '저장', lx: midX(2), ly: y1 - 10 },
      { d: `M${cx[3] - hw - 2} ${y2} H${cx[2] + hw + 6}`, label: '해석', lx: midX(2), ly: y2 - 10 },
      { d: `M${cx[2] - hw - 2} ${y2} H${loop.x + loop.w + 6}`, label: '==미션==을 내일로', lx: (cx[2] - hw + loop.x + loop.w) / 2, ly: y2 - 10 },
      { d: `M${cx[0]} ${loop.y - 2} V${row1 + H + 6}`, label: '==다음 날==', lx: cx[0] + 10, ly: 234, anchor: 'start' },
    ],
    gate: {
      y: 229,
      pass: { d: `M${cx[3]} ${row1 + H + 2} V${row2 - 6}` },
      passPill: { x: cx[3] + 12, y: 215, w: 92, h: 28 },
      block: { x: cx[3] - 52, y1: row1 + H + 2, y2: 221 },
      blockPill: { x: cx[3] - 196, y: 202, w: 128, h: 26 },
    },
    route: [
      [cx[0], y1],
      [cx[1], y1],
      [cx[2], y1],
      [cx[3], y1],
      [cx[3], y2],
      [cx[2], y2],
      [cx[0], y2],
      [cx[0], y1],
    ],
    stops: [
      { at: 0, node: 0 },
      { at: 1, node: 1 },
      { at: 2, node: 2 },
      { at: 3, node: 3 },
      { at: 4, node: 4 },
      { at: 5, node: 5 },
      { at: 6, node: 6 },
    ],
  };
})();

// ── 좁은 화면: 위에서 아래로 1→6, 왼쪽 선을 타고 다시 1로 ──
const NARROW: Layout = (() => {
  const X = 48;
  const W = 288;
  const H = 76;
  const cx = X + W / 2;
  const ys = [52, 148, 244, 340, 544, 640];
  const nodes: Box[] = ys.map((y) => ({ x: X, y, w: W, h: H }));
  const mid = (i: number) => ys[i] + H / 2;
  const loop: Box = { x: 72, y: 770, w: 240, h: 44 };
  const ly = loop.y + loop.h / 2;
  const gap = (i: number) => (ys[i] + H + ys[i + 1]) / 2 + 4;
  return {
    key: 'narrow',
    w: 360,
    h: 830,
    zones: [
      { box: { x: 8, y: 8, w: 344, h: 424 }, tone: 'device', label: '내 기기 안 · 온디바이스', note: '실시간', noteX: 340 },
      { box: { x: 8, y: 500, w: 344, h: 232 }, tone: 'server', label: '서버 · 반 전체', note: '숫자만 비교', noteX: 340 },
    ],
    nodes,
    loop,
    edges: [
      { d: `M${cx} ${ys[0] + H + 2} V${ys[1] - 6}`, label: '시작', lx: cx + 10, ly: gap(0), anchor: 'start' },
      { d: `M${cx} ${ys[1] + H + 2} V${ys[2] - 6}`, label: '실시간', lx: cx + 10, ly: gap(1), anchor: 'start' },
      { d: `M${cx} ${ys[2] + H + 2} V${ys[3] - 6}`, label: '저장', lx: cx + 10, ly: gap(2), anchor: 'start' },
      { d: `M${cx} ${ys[4] + H + 2} V${ys[5] - 6}`, label: '해석', lx: cx + 10, ly: gap(4), anchor: 'start' },
      { d: `M${cx} ${ys[5] + H + 2} V${loop.y - 6}`, label: '==미션==을 내일로', lx: cx + 10, ly: (ys[5] + H + loop.y) / 2 + 4, anchor: 'start' },
      { d: `M${loop.x - 2} ${ly} H24 V${mid(0)} H${X - 6}`, label: '==다음 날==', lx: 30, ly: 470, anchor: 'start' },
    ],
    gate: {
      y: 466,
      pass: { d: `M${cx} ${ys[3] + H + 2} V${ys[4] - 6}` },
      passPill: { x: cx + 10, y: 478, w: 98, h: 24 },
      block: { x: 100, y1: ys[3] + H + 2, y2: 458 },
      blockPill: { x: 110, y: 432, w: 74, h: 22 },
    },
    route: [
      [cx, mid(0)],
      [cx, mid(1)],
      [cx, mid(2)],
      [cx, mid(3)],
      [cx, mid(4)],
      [cx, mid(5)],
      [cx, ly],
      [24, ly],
      [24, mid(0)],
      [cx, mid(0)],
    ],
    stops: [
      { at: 0, node: 0 },
      { at: 1, node: 1 },
      { at: 2, node: 2 },
      { at: 3, node: 3 },
      { at: 4, node: 4 },
      { at: 5, node: 5 },
      { at: 6, node: 6 },
    ],
  };
})();

const SPEED = 340; // px/s
const DWELL = 0.75; // 각 단계에 머무는 초

/** 토큰 이동 일정: 경로 길이 비율(keyPoints)과 시간 비율(keyTimes), 각 단계가 밝혀질 구간 */
function schedule(route: Pt[], stops: Layout['stops']) {
  const seg = route.slice(1).map((p, i) => Math.hypot(p[0] - route[i][0], p[1] - route[i][1]));
  const total = seg.reduce((a, b) => a + b, 0);
  const cum = [0];
  seg.forEach((s) => cum.push(cum[cum.length - 1] + s));
  const stopAt = new Map(stops.map((s) => [s.at, s.node]));

  // 시간 계산 (초)
  const pts: { t: number; p: number }[] = [];
  const windows: { node: number; a: number; b: number }[] = [];
  let t = 0;
  route.forEach((_, i) => {
    const p = cum[i] / total;
    if (i > 0) {
      t += seg[i - 1] / SPEED;
    }
    pts.push({ t, p });
    if (stopAt.has(i) && i < route.length - 1) {
      windows.push({ node: stopAt.get(i)!, a: t, b: t + DWELL });
      t += DWELL;
      pts.push({ t, p });
    }
  });
  const dur = t;
  const f = (v: number) => Math.min(1, Math.max(0, v / dur)).toFixed(4);
  return {
    dur,
    keyPoints: pts.map((x) => Math.min(1, x.p).toFixed(4)).join(';'),
    keyTimes: pts.map((x) => f(x.t)).join(';'),
    windows: windows.map((w) => ({ node: w.node, a: Number(f(w.a)), b: Number(f(w.b)) })),
  };
}

/** 단계가 밝혀지는 구간만 opacity 1 인 SMIL 값 */
function glowValues(a: number, b: number) {
  const e = 0.012;
  if (a <= 0) return { values: '1;1;0;0', keyTimes: `0;${b};${Math.min(b + e, 1)};1` };
  return {
    values: '0;0;1;1;0;0',
    keyTimes: `0;${Math.max(a - e, 0.0001)};${a};${b};${Math.min(b + e, 0.9999)};1`,
  };
}

const SCHEDULE = { wide: schedule(WIDE.route, WIDE.stops), narrow: schedule(NARROW.route, NARROW.stops) };

/** 한 바퀴 돌 때마다 나아지는 예시 수치 (4바퀴 뒤 처음으로) */
const LAPS = [
  { purity: 68, rank: 12, fake: 38 },
  { purity: 76, rank: 9, fake: 27 },
  { purity: 84, rank: 7, fake: 18 },
  { purity: 91, rank: 5, fake: 10 },
];

function Arrow({ e, id, cls }: { e: Edge; id: string; cls?: string }) {
  return (
    <g>
      <path className={`ov-edge ${cls ?? ''}`} d={e.d} fill="none" strokeWidth="2" markerEnd={`url(#${id})`} />
      {e.label && (
        <text x={e.lx} y={e.ly} fontSize="12" fill={C.dim} textAnchor={e.anchor ?? 'middle'}>
          {em(e.label)}
        </text>
      )}
    </g>
  );
}

function Flow({ L, animate }: { L: Layout; animate: boolean }) {
  const id = (s: string) => `ov-${L.key}-${s}`;
  const sch = SCHEDULE[L.key];
  const routeD = L.route.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
  const wide = L.key === 'wide';

  return (
    <svg
      viewBox={`0 0 ${L.w} ${L.h}`}
      role="img"
      aria-label="찐공AI 전체 순서도: 1 계획, 2 AI 감지, 3 레이스, 4 기록까지는 내 기기 안에서, 숫자 요약만 서버로 보내 5 반 비교, 6 AI 리포트, 그리고 미션이 다음 날 계획으로 이어집니다"
    >
      <defs>
        <marker id={id('arr')} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 Z" fill={C.dim} />
        </marker>
        <marker id={id('arrG')} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 Z" fill="#38bdf8" />
        </marker>
        <marker id={id('arrR')} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 Z" fill={C.red} />
        </marker>
        <radialGradient id={id('tok')}>
          <stop offset="0%" stopColor="#fff7d6" />
          <stop offset="45%" stopColor={C.token} />
          <stop offset="100%" stopColor={C.token} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 구역 */}
      {L.zones.map((z) => (
        <g key={z.label}>
          <rect
            x={z.box.x}
            y={z.box.y}
            width={z.box.w}
            height={z.box.h}
            rx="18"
            fill={z.tone === 'device' ? 'rgba(76,175,80,0.05)' : 'rgba(66,133,244,0.06)'}
            stroke={z.tone === 'device' ? 'rgba(76,175,80,0.5)' : 'rgba(66,133,244,0.55)'}
            strokeWidth="1.4"
          />
          <text x={z.box.x + 16} y={z.box.y + 27} fontSize="13.5" fontWeight="800" fill={z.tone === 'device' ? C.green : C.blue}>
            {z.label}
          </text>
          <text x={z.noteX} y={z.box.y + 27} fontSize="12" fill={C.faint} textAnchor="end">
            {z.note}
          </text>
        </g>
      ))}

      {/* 경계: 영상은 막히고, 숫자 요약만 통과 */}
      <line x1="10" x2={L.w - 10} y1={L.gate.y} y2={L.gate.y} stroke={C.faint} strokeWidth="1.2" strokeDasharray="3 5" />
      <line
        x1={L.gate.block.x}
        x2={L.gate.block.x}
        y1={L.gate.block.y1}
        y2={L.gate.block.y2 - 8}
        stroke={C.red}
        strokeWidth="2"
        strokeDasharray="4 4"
        opacity="0.85"
      />
      <g transform={`translate(${L.gate.block.x}, ${L.gate.y})`}>
        <circle r="9" fill="#2a0f18" stroke={C.red} strokeWidth="1.6" />
        <path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke={C.red} strokeWidth="2" strokeLinecap="round" />
      </g>
      <g>
        <rect {...pill(L.gate.blockPill)} fill="#2a0f18" stroke="rgba(248,113,113,0.6)" strokeDasharray="3 3" />
        <text {...pillText(L.gate.blockPill)} fill="#fca5a5">
          {wide ? '🎥 영상·사진은 멈춤' : '영상 멈춤'}
        </text>
      </g>
      <path className="ov-edge pass" d={L.gate.pass.d} fill="none" strokeWidth="2.4" markerEnd={`url(#${id('arrG')})`} />
      <g>
        <rect {...pill(L.gate.passPill)} fill="rgba(56,189,248,0.14)" stroke="rgba(56,189,248,0.6)" />
        <text {...pillText(L.gate.passPill)} fill="#bae6fd">
          숫자 요약만 ↓
        </text>
      </g>

      {/* 단계 사이 화살표 */}
      {L.edges.map((e, i) => (
        <Arrow key={i} e={e} id={id('arr')} cls={i >= L.edges.length - 2 ? 'loop' : undefined} />
      ))}

      {/* 이동하는 토큰 (단계 상자 뒤로 지나가며, 화살표 위에서만 보입니다) */}
      {animate && (
        <g>
          <circle r="11" fill={`url(#${id('tok')})`}>
            <animateMotion
              dur={`${sch.dur}s`}
              repeatCount="indefinite"
              calcMode="linear"
              keyPoints={sch.keyPoints}
              keyTimes={sch.keyTimes}
              path={routeD}
            />
          </circle>
          <circle r="3.6" fill="#fff">
            <animateMotion
              dur={`${sch.dur}s`}
              repeatCount="indefinite"
              calcMode="linear"
              keyPoints={sch.keyPoints}
              keyTimes={sch.keyTimes}
              path={routeD}
            />
          </circle>
        </g>
      )}

      {/* 단계 상자 */}
      {STEPS.map((s, i) => {
        const b = L.nodes[i];
        const win = sch.windows.find((w) => w.node === i);
        const g = win ? glowValues(win.a, win.b) : null;
        return (
          <a key={s.title} href={s.href} className="ov-node">
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="14" fill={C.node} stroke={C.line} strokeWidth="1.4" />
            {/* 토큰이 도착하면 밝아지는 테두리 */}
            <rect
              x={b.x - 1}
              y={b.y - 1}
              width={b.w + 2}
              height={b.h + 2}
              rx="15"
              fill="rgba(233,69,96,0.12)"
              stroke={C.accent}
              strokeWidth="2.4"
              opacity="0"
              className="ov-glow"
            >
              {animate && g && (
                <animate attributeName="opacity" dur={`${sch.dur}s`} repeatCount="indefinite" calcMode="linear" values={g.values} keyTimes={g.keyTimes} />
              )}
            </rect>
            <circle cx={b.x + b.w - 18} cy={wide ? b.y + 18 : b.y + b.h / 2} r="11.5" fill={C.accent} />
            <text
              x={b.x + b.w - 18}
              y={(wide ? b.y + 18 : b.y + b.h / 2) + 4}
              fontSize="11.5"
              fontWeight="800"
              fill="#fff"
              textAnchor="middle"
            >
              {i + 1}
            </text>
            {wide ? (
              <>
                <text x={b.x + 14} y={b.y + 36} fontSize="23">
                  {s.icon}
                </text>
                <text x={b.x + 14} y={b.y + 65} fontSize="17" fontWeight="800" fill={C.ink}>
                  {s.title}
                </text>
                {s.lines.map((ln, li) => (
                  <text key={ln} x={b.x + 14} y={b.y + 85 + li * 17} fontSize="12.5" fill={C.dim}>
                    {em(ln)}
                  </text>
                ))}
              </>
            ) : (
              <>
                <text x={b.x + 26} y={b.y + b.h / 2 + 8} fontSize="22" textAnchor="middle">
                  {s.icon}
                </text>
                <text x={b.x + 50} y={b.y + 33} fontSize="16" fontWeight="800" fill={C.ink}>
                  {s.title}
                </text>
                <text x={b.x + 50} y={b.y + 55} fontSize="12.5" fill={C.dim}>
                  {em(s.short)}
                </text>
              </>
            )}
          </a>
        );
      })}

      {/* 다시 계획으로 */}
      <a href="#flow" className="ov-node">
        <rect x={L.loop.x} y={L.loop.y} width={L.loop.w} height={L.loop.h} rx={L.loop.h / 2} fill="rgba(233,69,96,0.14)" stroke="rgba(233,69,96,0.6)" strokeWidth="1.4" />
        <rect x={L.loop.x - 1} y={L.loop.y - 1} width={L.loop.w + 2} height={L.loop.h + 2} rx={L.loop.h / 2 + 1} fill="none" stroke={C.token} strokeWidth="2.4" opacity="0">
          {animate &&
            (() => {
              const w = sch.windows.find((x) => x.node === 6);
              const g = w && glowValues(w.a, w.b);
              return g ? (
                <animate attributeName="opacity" dur={`${sch.dur}s`} repeatCount="indefinite" calcMode="linear" values={g.values} keyTimes={g.keyTimes} />
              ) : null;
            })()}
        </rect>
        <text x={L.loop.x + L.loop.w / 2} y={L.loop.y + (wide ? 25 : 19)} fontSize={wide ? 14.5 : 13} fontWeight="800" fill={C.ink} textAnchor="middle">
          {em('↺ 다시 ==① 계획==')}
        </text>
        <text x={L.loop.x + L.loop.w / 2} y={L.loop.y + (wide ? 43 : 35)} fontSize="11" fill="#fda4af" textAnchor="middle">
          {em('리포트 미션이 ==내일의 계획==으로')}
        </text>
      </a>
    </svg>
  );
}

function pill(b: Box) {
  return { x: b.x, y: b.y, width: b.w, height: b.h, rx: b.h / 2, strokeWidth: 1.2 };
}
function pillText(b: Box) {
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 + 4, fontSize: 11.5, fontWeight: 800, textAnchor: 'middle' as const };
}

export default function OverviewMap() {
  const rootRef = useRef<HTMLDivElement>(null);
  // 움직임 줄이기 설정이면 토큰 애니메이션 없이 정지된 순서도만 보여 줍니다
  const [animate, setAnimate] = useState(true);
  const [lap, setLap] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setAnimate(!mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // 토큰과 어긋나지 않도록, 지금 보이는 SVG 의 애니메이션 시계를 읽어 몇 바퀴째인지 계산합니다
  useEffect(() => {
    if (!animate) return;
    const t = setInterval(() => {
      const root = rootRef.current;
      if (!root) return;
      for (const key of ['wide', 'narrow'] as const) {
        const wrap = root.querySelector<HTMLElement>(`.${key}`);
        const svg = wrap?.querySelector('svg');
        if (!wrap || !svg || wrap.offsetParent === null) continue;
        setLap(Math.floor(svg.getCurrentTime() / SCHEDULE[key].dur));
        return;
      }
    }, 250);
    return () => clearInterval(t);
  }, [animate]);

  const n = lap % LAPS.length;
  const cur = LAPS[n];
  const prev = n > 0 ? LAPS[n - 1] : null;

  return (
    <div className="ov-art" ref={rootRef}>
      <div className="wide">
        <Flow L={WIDE} animate={animate} />
      </div>
      <div className="narrow">
        <Flow L={NARROW} animate={animate} />
      </div>

      {/* 한 바퀴 돌 때마다 조금씩 나아지는 예시 */}
      <div className="ov-lap" aria-hidden>
        <div className="ov-lap-head">
          <span className="ov-lap-n" key={n}>
            <b>{n + 1}</b>바퀴째
          </span>
          <span className="ov-lap-dots">
            {LAPS.map((_, i) => (
              <i key={i} className={i <= n ? 'on' : undefined} />
            ))}
          </span>
          <span className="ov-lap-hint">{hl('예시 · 돌 때마다 ==조금씩 나아집니다==')}</span>
        </div>
        <div className="ov-lap-stats">
          <div className="ov-lap-stat">
            <span className="l">{hl('==찐공 순도==')}</span>
            <span className="bar">
              <i style={{ width: `${cur.purity}%` }} />
            </span>
            <span className="v up">
              {cur.purity}%{prev && <em>+{cur.purity - prev.purity}</em>}
            </span>
          </div>
          <div className="ov-lap-stat">
            <span className="l">{hl('==가짜 공부==')}</span>
            <span className="bar fake">
              <i style={{ width: `${cur.fake * 2}%` }} />
            </span>
            <span className="v">
              {cur.fake}분{prev && <em>−{prev.fake - cur.fake}</em>}
            </span>
          </div>
          <div className="ov-lap-stat">
            <span className="l">{hl('==반 순위==')}</span>
            <span className="bar rank">
              <i style={{ width: `${((21 - cur.rank) / 20) * 100}%` }} />
            </span>
            <span className="v up">
              {cur.rank}등{prev && <em>▲{prev.rank - cur.rank}</em>}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
