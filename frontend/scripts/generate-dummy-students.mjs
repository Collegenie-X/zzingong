// ── 더미 학생 20명 데이터 생성 스크립트 (실전형) ──
// 실행:  node scripts/generate-dummy-students.mjs   (frontend 폴더에서)
//
// 고등학생 한 반 20명의 최근 DAYS(90)일 공부 기록을 "세션 단위"로 만들어
// src/data/students/<id>.json 에 학생마다 따로 저장하고, index.ts · README.md 를 다시 만듭니다.
//
// 실전처럼 보이도록 반영한 것
// - 학사 일정: 여름방학, 광복절·추석·개천절·한글날, 2학기 중간고사(D-21부터 공부량 증가)
// - 요일 패턴: 학원 가는 날은 22시 이후 짧게, 안 가는 날은 저녁 내내, 주말·방학은 오전/오후/저녁
// - 생활 리듬: 아침형(등교 전 공부) / 보통 / 올빼미형(늦게 시작, 자정 직전까지)
// - 세션 길이: 학생마다 선호 길이(25분 뽀모도로 ~ 90분 몰입)가 있고 매번 조금씩 다름
// - 쉬는 날: 하루 쉬면 다음 날도 쉬기 쉬운 연속 패턴 + 가끔 2~3일 아픈 날
// - 과목: 학원 과목 숙제 먼저, 시험 다가오면 시험 과목 위주, 주말엔 독서 많이, 같은 과목 연달아 피하기
// - 집중률: 밤 11시 이후·긴 세션은 낮아지고(졸음↑), 시험 직전엔 조금 올라감
// - 가끔 켰다가 바로 끈 1~4분짜리 세션
//
// 순위 보정: 학생마다 [3달, 1달, 1주] 목표 하루 평균(분)을 정해 두고,
// 세 구간(1달 전 이전 / 최근 1달 중 1주 전까지 / 최근 1주)의 공부량을 따로 반복 보정합니다.
// → 3달·1달·1주 순위가 아래 PERSONAS 의 의도대로 나옵니다.
// 시드 고정이라 같은 날 다시 실행하면 같은 결과가 나옵니다.
// 앱은 generated_on 과 오늘 날짜 차이만큼 날짜를 밀어서 항상 "최근 90일"로 보여 줍니다.

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src/data/students');
const DAYS = 90;
const SUBJECTS = JSON.parse(readFileSync(join(ROOT, 'src/data/subjects.json'), 'utf8')).subjects;
const SUBJ = SUBJECTS.map((s) => s.name); // 국어 영어 수학 사회 역사 과학 물리 독서

// ── 학사 일정 (2026년 2학기 기준) ──
const CALENDAR = {
  vacation: ['2026-07-22', '2026-08-16'],
  holidays: {
    '2026-08-15': '광복절',
    '2026-09-24': '추석 연휴',
    '2026-09-25': '추석',
    '2026-09-26': '추석 연휴',
    '2026-10-03': '개천절',
    '2026-10-09': '한글날',
  },
  chuseok: ['2026-09-24', '2026-09-26'],
  exam: { name: '2학기 중간고사', start: '2026-10-13', end: '2026-10-16', ramp_days: 21 },
};

// ── 학생 20명 ──
// target   하루 평균 순공(분) [3달, 1달, 1주] — 이 값으로 기간별 순위가 정해집니다
// rate     공부하는 날 비율                 academy  학원 가는 요일(0=일 … 6=토)
// subj     학원 과목 (그날 숙제 먼저)        chrono   early 아침형 / normal / night 올빼미형
// block    선호 세션 길이(분)               focus    [처음, 끝] 집중률(%)
// weekend  주말 공부량 배율                  vac      방학 공부량 배율
// exam     시험 직전 공부량 배율(D-1 기준)    bias     과목별 선호 (국 영 수 사 역 과 물 독)
// start    앱 가입 시점(90일 중 몇 번째 날부터 기록) — 생략하면 처음부터
const PERSONAS = [
  { id: 'seoyeon', name: '김서연', persona: '꾸준한 최상위', trend: '유지', target: [270, 262, 238], rate: 0.97, academy: [2, 4], subj: ['수학'], chrono: 'normal', block: 50, focus: [93, 94], weekend: 1.3, vac: 1.3, exam: 1.3, bias: [1.1, 1.1, 1.3, 0.9, 0.9, 1.1, 1.0, 0.8], note: '하루도 빠짐없이 4~5시간. 반의 기준점' },
  { id: 'junho', name: '박준호', persona: '지쳐가는 상위권', trend: '하락', target: [240, 170, 140], rate: 0.92, academy: [1, 3, 5], subj: ['수학', '과학'], chrono: 'normal', block: 60, focus: [91, 79], weekend: 1.3, vac: 1.4, exam: 1.1, bias: [0.9, 1.0, 1.5, 0.8, 0.8, 1.2, 1.4, 0.5], note: '방학 땐 1등이었지만 개학 후 점점 줄어 요즘은 중위권 페이스' },
  { id: 'haeun', name: '이하은', persona: '아침형 모범생', trend: '유지', target: [228, 238, 228], rate: 0.95, academy: [2, 4], subj: ['영어'], chrono: 'early', block: 45, focus: [90, 92], weekend: 1.2, vac: 1.2, exam: 1.3, bias: [1.3, 1.3, 0.9, 1.1, 1.1, 0.9, 0.7, 1.3], note: '등교 전 6시 반에 한 시간씩. 문과 과목 강세, 기복 없음' },
  { id: 'minjae', name: '최민재', persona: '급상승 다크호스', trend: '급상승', target: [224, 300, 330], rate: 0.9, academy: [1, 3], subj: ['수학'], chrono: 'normal', block: 70, focus: [80, 92], weekend: 1.4, vac: 1.0, exam: 1.3, bias: [1.0, 1.1, 1.4, 0.8, 0.8, 1.3, 1.3, 0.6], note: '추석 전부터 마음먹고 달리는 중. 최근 1달·1주 반 1등' },
  { id: 'dain', name: '정다인', persona: '수학 몰입형', trend: '유지', target: [212, 204, 205], rate: 0.92, academy: [1, 3, 5], subj: ['수학', '물리'], chrono: 'normal', block: 85, focus: [89, 90], weekend: 1.4, vac: 1.3, exam: 1.3, bias: [0.7, 0.9, 2.0, 0.7, 0.6, 1.2, 1.5, 0.5], note: '한 번 앉으면 80~90분. 수학·물리 반 최상위, 국어·역사는 약함' },
  { id: 'me', name: '나', is_me: true, persona: '꾸준히 성장 중', trend: '상승', target: [200, 250, 290], rate: 0.95, academy: [1, 3, 5], subj: ['수학', '영어'], chrono: 'normal', block: 50, focus: [82, 90], weekend: 1.3, vac: 1.2, exam: 1.4, bias: [1.3, 1.5, 0.5, 1.0, 1.1, 1.0, 0.4, 1.2], note: '기본 선택 학생. 3달 6등 → 1달 3등 → 1주 2등. 영어·국어 강점, 수학·물리 보강 필요' },
  { id: 'jiwoo', name: '강지우', persona: '시험 벼락치기', trend: '급상승', target: [188, 215, 256], rate: 0.82, academy: [2, 4], subj: ['영어'], chrono: 'night', block: 40, focus: [84, 82], weekend: 1.4, vac: 0.8, exam: 3.0, bias: [1.0, 1.0, 1.1, 1.1, 1.1, 1.0, 1.0, 0.5], note: '평소엔 2시간 남짓, 중간고사 3주 전부터 폭발. 최근 1주 상위권' },
  { id: 'dohyun', name: '윤도현', persona: '슬럼프 진행 중', trend: '급하락', target: [176, 95, 70], rate: 0.9, academy: [1, 3, 5], subj: ['수학'], chrono: 'night', block: 50, focus: [88, 70], weekend: 1.2, vac: 1.3, exam: 1.0, bias: [0.9, 1.0, 1.2, 1.0, 0.9, 1.2, 1.1, 0.7], note: '추석 이후 급격히 줄고 집중률도 70%대로. 시험이 다가와도 안 돌아옴' },
  { id: 'yerin', name: '장예린', persona: '성실한 중위권', trend: '유지', target: [164, 178, 180], rate: 0.93, academy: [2, 4], subj: ['국어'], chrono: 'normal', block: 45, focus: [86, 87], weekend: 1.2, vac: 1.1, exam: 1.3, bias: [1.1, 1.1, 1.0, 1.0, 1.0, 1.0, 0.9, 1.0], note: '과목 고르게, 매일 2~3시간' },
  { id: 'taeyun', name: '임태윤', persona: '슬럼프 극복', trend: '회복', target: [152, 190, 215], rate: 0.88, academy: [1, 4], subj: ['영어', '수학'], chrono: 'normal', block: 50, focus: [85, 88], weekend: 1.2, vac: 1.0, exam: 1.3, bias: [1.0, 1.2, 1.1, 0.9, 0.9, 1.0, 1.0, 0.8], note: '개학 직후 바닥을 찍고 다시 올라오는 중' },
  { id: 'soyul', name: '한소율', persona: '짧고 굵게', trend: '유지', target: [140, 140, 148], rate: 0.92, academy: [1, 3, 5], subj: ['수학'], chrono: 'early', block: 25, focus: [95, 96], weekend: 1.1, vac: 1.1, exam: 1.3, bias: [1.2, 1.1, 1.0, 1.0, 1.1, 0.9, 0.8, 1.2], note: '25분 뽀모도로. 시간은 적지만 집중률 반 1등(95%↑)' },
  { id: 'seungmin', name: '오승민', persona: '앉아만 있는 타입', trend: '유지', target: [128, 128, 125], rate: 0.9, academy: [2, 4], subj: ['수학'], chrono: 'night', block: 90, focus: [64, 66], weekend: 1.3, vac: 1.2, exam: 1.2, bias: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0], note: '한 번에 90분씩 앉아 있지만 쉬는 시간·딴짓이 많아 집중률 최하위권' },
  { id: 'jia', name: '서지아', persona: '서서히 하락', trend: '하락', target: [116, 88, 78], rate: 0.82, academy: [2, 4, 6], subj: ['영어'], chrono: 'normal', block: 40, focus: [85, 78], weekend: 1.0, vac: 1.1, exam: 1.2, bias: [1.2, 1.2, 0.8, 1.0, 1.0, 0.9, 0.7, 1.3], note: '토요일도 학원. 조금씩 줄어드는 중' },
  { id: 'woojin', name: '신우진', persona: '늦게 합류', trend: '급상승', target: [104, 200, 247], rate: 0.9, start: 40, academy: [1, 3], subj: ['수학'], chrono: 'normal', block: 50, focus: [76, 88], weekend: 1.3, vac: 1.0, exam: 1.4, bias: [0.9, 1.0, 1.2, 0.9, 0.9, 1.1, 1.1, 0.8], note: '개학 즈음 앱을 시작. 그 뒤로 매일 늘려서 최근엔 상위권' },
  { id: 'nayun', name: '권나윤', persona: '몰아서 하는 타입', trend: '들쭉날쭉', target: [90, 105, 112], rate: 0.58, academy: [2, 4], subj: ['국어'], chrono: 'night', block: 70, focus: [80, 80], weekend: 1.6, vac: 1.0, exam: 1.4, bias: [1.2, 1.1, 0.9, 1.1, 1.0, 0.9, 0.8, 1.3], note: '며칠 쉬다가 하는 날엔 3~4시간. 주말형' },
  { id: 'minseong', name: '황민성', persona: '하위권 탈출 중', trend: '상승', target: [78, 116, 135], rate: 0.8, academy: [1, 3, 5], subj: ['수학', '영어'], chrono: 'normal', block: 30, focus: [70, 82], weekend: 1.2, vac: 0.9, exam: 1.4, bias: [0.9, 1.0, 1.1, 1.0, 1.0, 1.1, 1.0, 0.8], note: '하루 40분 → 2시간으로 조금씩 늘리는 중' },
  { id: 'chaewon', name: '안채원', persona: '작심삼일', trend: '하락', target: [64, 30, 18], rate: 0.7, academy: [2, 4], subj: ['영어'], chrono: 'normal', block: 35, focus: [85, 68], weekend: 1.0, vac: 1.0, exam: 1.2, bias: [1.1, 1.2, 0.9, 1.0, 1.0, 0.9, 0.8, 1.2], note: '방학 첫 2주는 열심히, 이후 점점 손을 놓음' },
  { id: 'hyunwoo', name: '송현우', persona: '학원 위주', trend: '유지', target: [50, 52, 55], rate: 0.8, academy: [1, 2, 3, 4, 5], subj: ['수학', '영어', '과학'], chrono: 'night', block: 30, focus: [78, 79], weekend: 1.8, vac: 1.0, exam: 1.3, bias: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0], note: '평일 매일 학원이라 밤 늦게 30분 숙제. 주말에 조금 더' },
  { id: 'jiho', name: '류지호', persona: '가끔 하는 타입', trend: '유지', target: [32, 36, 38], rate: 0.33, academy: [], subj: [], chrono: 'night', block: 40, focus: [68, 70], weekend: 1.3, vac: 1.0, exam: 1.3, bias: [0.8, 1.0, 1.0, 1.1, 1.2, 1.0, 0.9, 1.0], note: '사흘에 한 번꼴로 1~2시간' },
  { id: 'sua', name: '배수아', persona: '사라진 학생', trend: '급하락', target: [14, 3, 0], rate: 0.4, academy: [], subj: [], chrono: 'normal', block: 25, focus: [72, 60], weekend: 1.0, vac: 1.0, exam: 1.0, bias: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0], note: '방학 땐 가끔 했지만 한 달 전부터 거의 기록 없음' },
];

// ── 유틸 ──
function rngOf(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { next, uniform: (lo, hi) => lo + next() * (hi - lo), randint: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)) };
}
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sum = (a) => a.reduce((x, y) => x + y, 0);
const DAY_MS = 86400000;
const utc = (ds) => Date.UTC(+ds.slice(0, 4), +ds.slice(5, 7) - 1, +ds.slice(8, 10));
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
const hms = (sec) => [Math.floor(sec / 3600), Math.floor((sec % 3600) / 60), sec % 60].map((v) => String(v).padStart(2, '0')).join(':');

const now = new Date();
const TODAY = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const DATES = Array.from({ length: DAYS }, (_, i) => iso(utc(TODAY) - (DAYS - 1 - i) * DAY_MS));
// 보정 구간: 0 = 1달 전 이전(60일), 1 = 최근 1달 중 1주 전까지(23일), 2 = 최근 1주(7일)
const SEG = DATES.map((_, i) => (i >= DAYS - 7 ? 2 : i >= DAYS - 30 ? 1 : 0));
const SEG_DAYS = [DAYS - 30, 23, 7];

/** 날짜별 학사 정보 */
const DAY_INFO = DATES.map((ds) => {
  const wd = new Date(utc(ds)).getUTCDay();
  const holiday = CALENDAR.holidays[ds] ?? null;
  const vac = ds >= CALENDAR.vacation[0] && ds <= CALENDAR.vacation[1];
  const chuseok = ds >= CALENDAR.chuseok[0] && ds <= CALENDAR.chuseok[1];
  const dday = Math.round((utc(CALENDAR.exam.start) - utc(ds)) / DAY_MS); // 시험 첫날까지 남은 날
  const inExam = ds >= CALENDAR.exam.start && ds <= CALENDAR.exam.end;
  const R = CALENDAR.exam.ramp_days;
  const ramp = inExam ? 1 : dday >= 1 && dday <= R ? (R - dday) / (R - 1) : 0;
  return { ds, wd, weekend: wd === 0 || wd === 6, holiday, vac, chuseok, ramp };
});

/** 공부 가능한 시간대 [시작분, 끝분] — 끝은 자정 전 */
function windowsOf(p, info, academy) {
  const night = p.chrono === 'night';
  const lateEnd = night ? 1439 : 1425;
  if (info.weekend || info.holiday) return [[night ? 600 : 540, 750], [810, 1080], [night ? 1170 : 1140, lateEnd]];
  if (info.vac) return academy ? [[night ? 600 : 540, 750], [1140, lateEnd]] : [[night ? 600 : 540, 750], [810, 1080], [1140, lateEnd]];
  const w = [];
  if (p.chrono === 'early') w.push([380, 450]); // 등교 전 06:20~07:30
  // 학원 가는 날: 가기 전 17:00~18:00, 다녀와서 22:15~ (시험 2주 전부터는 학원도 자습이라 독서실처럼)
  if (academy && info.ramp < 0.35) w.push([1020, 1080], [1335, 1439]);
  else w.push([night ? 1140 : 1050, lateEnd]); // 하교 후 독서실 17:30(올빼미 19:00)~
  return w;
}

/** 하루 공부량 배율 (학사 일정·요일·시험) */
function dayFactor(p, info, academy) {
  let f;
  if (info.chuseok) f = 0.35;
  else if (info.weekend || info.holiday) f = p.weekend * (info.vac ? p.vac : 1);
  else if (info.vac) f = (academy ? 0.9 : 1.2) * p.vac;
  else f = academy ? 0.45 : 1.0;
  return f * (1 + (p.exam - 1) * info.ramp);
}

// ── 한 학생의 세션 생성 (scale = 구간별 공부량 배율 [3]) ──
function simulate(p, si, scale) {
  const rng = rngOf(7000 + si * 131);
  const sessions = [];
  // 쉬는 날 연속 패턴 (마르코프): 쉰 다음 날 또 쉴 확률 0.45
  const pSkipSkip = 0.45;
  const pStudySkip = clamp(((1 - p.rate) * (1 - pSkipSkip)) / p.rate, 0, 0.95);
  let skippedYesterday = false;
  let sick = 0;
  const sickDay = rng.next() < 0.5 ? rng.randint(10, DAYS - 10) : -1;

  DAY_INFO.forEach((info, i) => {
    const t = i / (DAYS - 1);
    const academy = !info.holiday && !info.weekend && p.academy.includes(info.wd);

    // 난수 소비 순서를 매일 같게 유지 (보정 반복 사이에 패턴이 바뀌지 않도록)
    const rSkip = rng.next();
    const mood = rng.uniform(0.8, 1.2);
    const dayRng = rngOf(si * 100003 + i * 7919);

    if (i === sickDay) sick = rng.randint(2, 3);
    let skipP = skippedYesterday ? pSkipSkip : pStudySkip;
    if (academy) skipP *= 1.4;
    if (info.chuseok) skipP = Math.max(skipP, 0.6);
    skipP *= 1 - 0.7 * info.ramp;
    // 최근 1주에 공부량이 늘어나는 학생은 시험을 앞두고 거르지 않음
    const sure = SEG[i] === 2 && p.target[2] >= p.target[1] && p.rate >= 0.75;
    const skip = sick > 0 || i < (p.start ?? 0) || (!sure && rSkip < skipP);
    if (sick > 0) sick--;
    skippedYesterday = skip;
    if (skip || scale[SEG[i]] <= 0) return;

    let target = dayFactor(p, info, academy) * mood * scale[SEG[i]]; // 분
    if (target < 8) return;

    const r = dayRng;
    let prev = '';
    let first = true;
    const baseFocus = lerp(p.focus[0], p.focus[1], t);
    for (const [ws, we] of windowsOf(p, info, academy)) {
      let cur = (ws + r.randint(0, 20)) * 60 + r.randint(0, 59); // 초
      let streak = 0;
      while (target >= 3) {
        // 가끔 켰다가 바로 끈 짧은 세션
        const abandoned = r.next() < 0.025;
        let dur = abandoned ? r.uniform(1, 4) : Math.min(target, p.block * r.uniform(0.6, 1.35));
        if (!abandoned && target - dur < 8) dur = target; // 자투리는 붙여서 마무리

        // 과목 고르기
        const weights = SUBJ.map((name, k) => {
          let w = SUBJECTS[k].goal_minutes * p.bias[k];
          if (first && academy && p.subj.includes(name)) w *= 5;
          if (name === '독서') w *= (info.weekend ? 2 : 1) * (1 - 0.85 * info.ramp);
          else w *= 1 + 0.5 * info.ramp;
          if (name === prev) w *= 0.15;
          return w;
        });
        let x = r.next() * sum(weights);
        const subject = SUBJ[Math.max(0, weights.findIndex((w) => (x -= w) <= 0))];

        const startMin = cur / 60;
        let focus = baseFocus + r.uniform(-3, 3) + 2 * info.ramp;
        if (startMin >= 23 * 60) focus -= 4;
        if (dur > 70) focus -= 3;
        focus = clamp(focus, 50, 98);
        const late = startMin >= 22.5 * 60;
        const pauseK = r.uniform(0.8, 1.2);
        const distK = r.uniform(0.01, 0.04);
        const mix = late ? [0.35, 0.2, 0.1, 0.35] : focus >= 90 ? [0.3, 0.4, 0.2, 0.1] : [0.5, 0.25, 0.15, 0.1];
        const jit = mix.map(() => r.uniform(0.5, 1.5));
        const plan = (studyMin) => {
          const study = Math.max(60, Math.round(studyMin * 60));
          const pause = Math.round(study * (100 / focus - 1) * pauseK);
          const distTotal = study * distK * (100 / focus);
          const dist = mix.map((m, k) => Math.round(distTotal * m * jit[k]));
          return { study, pause, dist, span: study + pause + sum(dist) };
        };
        let s = plan(dur);
        if (cur + s.span > we * 60) {
          // 시간대 끝까지 남은 만큼만
          const room = (we * 60 - cur) / (s.span / s.study) / 60;
          if (room < 5) break;
          s = plan(room * 0.95);
        }
        sessions.push({
          date: info.ds,
          start: hms(cur),
          subject,
          study: s.study,
          pause: s.pause,
          pauses: s.pause < 45 ? 0 : Math.max(1, Math.round(s.pause / r.uniform(70, 200))),
          dist: s.dist,
        });
        target -= s.study / 60;
        prev = subject;
        first = false;
        streak++;
        // 두세 세션마다 긴 휴식
        cur += s.span + (streak % 3 === 0 ? r.randint(15, 30) : r.randint(4, 12)) * 60 + r.randint(0, 59);
        if (cur >= we * 60 - 300) break;
      }
      if (target < 3) break;
    }
  });
  return sessions;
}

// ── 구간별 목표 하루 평균 (분): [3달, 1달, 1주] → [1달 전 이전, 1달~1주, 1주] ──
const segTargets = PERSONAS.map(({ target: [m3, m1, w1] }) => [
  Math.max(0, (m3 * DAYS - m1 * 30) / SEG_DAYS[0]),
  Math.max(0, (m1 * 30 - w1 * 7) / SEG_DAYS[1]),
  w1,
]);

// ── 반복 보정: 구간마다 실제 하루 평균이 목표에 맞도록 배율 조정 ──
const segAvg = (ss, k) => sum(ss.filter((s) => SEG[DATES.indexOf(s.date)] === k).map((s) => s.study)) / 60 / SEG_DAYS[k];
const scales = segTargets.map((t) => t.map((v) => v * 0.9));
let results = [];
for (let iter = 0; iter < 60; iter++) {
  results = PERSONAS.map((p, si) => simulate(p, si, scales[si]));
  let worst = 0;
  results.forEach((ss, si) =>
    [0, 1, 2].forEach((k) => {
      const want = segTargets[si][k];
      const got = segAvg(ss, k);
      worst = Math.max(worst, Math.abs(got - want));
      if (want <= 0) scales[si][k] = 0;
      else scales[si][k] *= clamp(want / Math.max(got, 1), 0.5, 2);
    }),
  );
  if (worst < 0.8) break;
}

// ── 기간별 순위·요약 ──
const totalMin = (ss, from = DATES[0]) => sum(ss.filter((s) => s.date >= from).map((s) => s.study)) / 60;
const rankBy = (from) => {
  const v = results.map((ss) => totalMin(ss, from));
  return v.map((x) => v.filter((o) => o > x).length + 1);
};
const R3 = rankBy(DATES[0]);
const R1 = rankBy(DATES[DAYS - 30]);
const RW = rankBy(DATES[DAYS - 7]);
// 의도한 순위(target 기준)와 실제 순위 비교 + 바로 옆 순위와 하루 평균 3분 미만 차이(동점 위험) 확인
const nearTies = [[DATES[0], DAYS, '3달'], [DATES[DAYS - 30], 30, '1달'], [DATES[DAYS - 7], 7, '1주']].flatMap(([from, n, label]) => {
  const v = results.map((ss, i) => ({ name: PERSONAS[i].name, avg: totalMin(ss, from) / n })).sort((a, b) => b.avg - a.avg);
  return v.slice(1).flatMap((x, k) => (v[k].avg - x.avg < 3 && v[k].avg > 0 ? [`${label} ${v[k].name}·${x.name} 차이 ${(v[k].avg - x.avg).toFixed(1)}분/일`] : []));
});
const intended = (k) => PERSONAS.map((p) => PERSONAS.filter((o) => o.target[k] > p.target[k]).length + 1);
const mismatch = [[R3, 0], [R1, 1], [RW, 2]].flatMap(([R, k]) =>
  intended(k).flatMap((want, i) => (R[i] !== want ? [`${PERSONAS[i].name} ${['3달', '1달', '1주'][k]} ${want}등 의도 → ${R[i]}등`] : [])),
);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const WD = '일월화수목금토';
const CHRONO = { early: '아침형', normal: '보통', night: '올빼미형' };
const rows = results.map((ss, i) => {
  const p = PERSONAS[i];
  const days = new Set(ss.map((s) => s.date));
  const study = sum(ss.map((s) => s.study));
  const pause = sum(ss.map((s) => s.pause));
  const bySubj = Object.fromEntries(SUBJ.map((n) => [n, sum(ss.filter((s) => s.subject === n).map((s) => s.study))]));
  const subjSorted = SUBJ.filter((n) => bySubj[n] > 0).sort((a, b) => bySubj[b] - bySubj[a]);
  const firstDate = ss[0]?.date ?? DATES[0];
  const joined = p.is_me ? iso(utc(DATES[0]) - 3 * DAY_MS) : iso(Math.min(utc(firstDate), utc(DATES[0]) + (i % 3) * DAY_MS) - DAY_MS);
  const summary = {
    rank_3m: R3[i],
    rank_1m: R1[i],
    rank_1w: RW[i],
    avg_daily_min_3m: Math.round(totalMin(ss) / DAYS),
    avg_daily_min_1m: Math.round(totalMin(ss, DATES[DAYS - 30]) / 30),
    avg_daily_min_1w: Math.round(totalMin(ss, DATES[DAYS - 7]) / 7),
    studied_days_3m: days.size,
    sessions_3m: ss.length,
    focus_3m: study + pause ? Math.round((study / (study + pause)) * 100) : 0,
    most_subject: subjSorted[0] ?? '-',
    least_subject: subjSorted[subjSorted.length - 1] ?? '-',
  };
  const head = {
    id: p.id,
    name: p.name,
    is_me: !!p.is_me,
    persona: p.persona,
    trend: p.trend,
    note: p.note,
    generated_on: TODAY,
    joined,
    habits: {
      academy_days: p.academy.map((d) => WD[d]).join('') || '없음',
      academy_subjects: p.subj,
      chronotype: CHRONO[p.chrono],
      session_minutes: p.block,
    },
    summary,
  };
  const json =
    JSON.stringify(head, null, 2).replace(/\n}$/, ',\n') +
    '  "_sessions_comment": "한 줄 = 세션 하나. start = 시작 시각(로컬), study/pause = 순공/일시정지(초), pauses = 일시정지 횟수, dist = 딴짓(초) [폰, 멍때림, 자리비움, 졸음]",\n' +
    '  "sessions": [\n' +
    ss.map((s) => '    ' + JSON.stringify(s)).join(',\n') +
    '\n  ]\n}\n';
  writeFileSync(join(OUT, `${p.id}.json`), json);
  return { p, summary };
});

// index.ts
const ident = (id) => `s_${id}`;
writeFileSync(
  join(OUT, 'index.ts'),
  `// 자동 생성 파일 — scripts/generate-dummy-students.mjs 가 만듭니다. 직접 고치지 마세요.\n` +
    `// 학생 한 명 = JSON 파일 하나.\n\n` +
    `import type { DummyStudentFile } from '@/lib/dummy';\n` +
    PERSONAS.map((p) => `import ${ident(p.id)} from './${p.id}.json';`).join('\n') +
    `\n\nexport const DUMMY_STUDENTS = [\n` +
    PERSONAS.map((p) => `  ${ident(p.id)},`).join('\n') +
    `\n] as DummyStudentFile[];\n`,
);

// README.md — 반 명단 한눈에 보기 (3달 순위 순)
const holidays = Object.entries(CALENDAR.holidays).map(([d, n]) => `${d.slice(5)} ${n}`).join(', ');
const byRank = [...rows].sort((a, b) => a.summary.rank_3m - b.summary.rank_3m);
writeFileSync(
  join(OUT, 'README.md'),
  `# 더미 학생 20명\n\n` +
    `자동 생성 파일입니다. 학생 성향은 \`scripts/generate-dummy-students.mjs\`의 \`PERSONAS\`에서 고치고 다시 실행하세요.\n\n` +
    `- 생성일: ${TODAY} (앱은 오늘 날짜 기준으로 날짜를 밀어서 최근 ${DAYS}일로 보여 줍니다)\n` +
    `- 학사 일정: 여름방학 ${CALENDAR.vacation.join(' ~ ')}, ${CALENDAR.exam.name} ${CALENDAR.exam.start} ~ ${CALENDAR.exam.end}, 공휴일 ${holidays}\n` +
    `- 순위는 하루가 끝난 기준입니다. 앱에서는 아직 지나지 않은 오늘 세션은 빠집니다.\n\n` +
    `| 3달 | 1달 | 1주 | 이름 | 추세 | 하루 평균 3달 → 1달 → 1주 | 집중률 | 공부한 날 | 학원 | 리듬 | 유형 |\n` +
    `|---|---|---|---|---|---|---|---|---|---|---|\n` +
    byRank
      .map(({ p, summary: s }) =>
        `| ${s.rank_3m} | ${s.rank_1m} | ${s.rank_1w} | ${p.name} | ${p.trend} | ${s.avg_daily_min_3m}분 → ${s.avg_daily_min_1m}분 → ${s.avg_daily_min_1w}분 | ${s.focus_3m}% | ${s.studied_days_3m}일 | ${p.academy.map((d) => WD[d]).join('') || '-'} | ${CHRONO[p.chrono]} | ${p.persona} — ${p.note} |`,
      )
      .join('\n') +
    '\n',
);

// 콘솔 요약
console.log(`\n${PERSONAS.length}명 × ${DAYS}일 → ${OUT}`);
console.log(mismatch.length ? `⚠ 의도와 다른 순위:\n  ${mismatch.join('\n  ')}` : '✓ 3달·1달·1주 순위가 모두 의도대로입니다');
if (nearTies.length) console.log(`⚠ 동점에 가까운 순위:\n  ${nearTies.join('\n  ')}`);
console.log('\n3달 1달 1주  이름      추세      3달→1달→1주(분/일)   집중률 공부일 세션');
byRank.forEach(({ p, summary: s }) => {
  const n = (v, w = 3) => String(v).padStart(w);
  console.log(`${n(s.rank_3m)} ${n(s.rank_1m)} ${n(s.rank_1w)}   ${p.name.padEnd(4, '　')}  ${p.trend.padEnd(4, '　')}  ${n(s.avg_daily_min_3m)} →${n(s.avg_daily_min_1m)} →${n(s.avg_daily_min_1w)}     ${n(s.focus_3m)}%  ${n(s.studied_days_3m)}일 ${n(s.sessions_3m, 4)}`);
});
