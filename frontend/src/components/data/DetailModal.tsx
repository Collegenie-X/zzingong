'use client';

// 데이터 페이지에서 표의 행을 누르면 뜨는 상세 팝업
// - 세션: 공부/일시정지/딴짓 시간, 딴짓 유형, 집중도
// - 학생: 요약 지표, 과목별 분포, 최근 14일 추이, 최근 세션
// - 과목: 요약 지표, 학생별 누적, 최근 14일 추이, 목표 달성 비율
// 팝업 안에서 학생 ↔ 세션으로 이동할 수 있도록 onOpen 으로 대상을 바꿉니다.

import { useEffect, useMemo, type CSSProperties, type ReactNode } from 'react';
import { WEEKDAYS, fmtKorean, isoHM, isoLocal, toDateStr } from '@/lib/format';
import type { SessionRecord, Student, Subject } from '@/lib/types';

export type DetailTarget =
  | { type: 'session'; id: number }
  | { type: 'student'; id: string }
  | { type: 'subject'; id: string };

interface Props {
  target: DetailTarget;
  sessions: SessionRecord[];
  students: Student[];
  subjects: Subject[];
  colorOf: (subject: string) => string;
  onOpen: (t: DetailTarget) => void;
  onClose: () => void;
}

const DISTRACTIONS = [
  { key: 'distraction_phone', label: '핸드폰', color: '#f87171' },
  { key: 'distraction_spacing', label: '멍때림', color: '#a78bfa' },
  { key: 'distraction_away', label: '자리 비움', color: '#38bdf8' },
  { key: 'distraction_drowsy', label: '졸음', color: '#fbbf24' },
] as const;

const DONE_LABEL = ['미완료', '완료', '건너뛰기'] as const;
const sum = (xs: number[]) => xs.reduce((a, x) => a + x, 0);
const fmtSec = (sec: number) => (sec > 0 && sec < 60 ? `${Math.round(sec)}초` : fmtKorean(sec));
const fmtDate = (d: string) => `${d.slice(5).replace('-', '.')} (${WEEKDAYS[new Date(d + 'T00:00:00').getDay()]})`;

/** 기준일(포함)부터 거꾸로 n일의 "YYYY-MM-DD" 목록 */
function lastDays(end: string, n: number) {
  const base = new Date(end + 'T00:00:00');
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() - (n - 1 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
}

export default function DetailModal({ target, sessions, students, subjects, colorOf, onOpen, onClose }: Props) {
  // ESC 로 닫기 + 배경 스크롤 잠금
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const nameOf = useMemo(() => {
    const m = new Map(students.map((s) => [s.id, s.name]));
    return (id: string) => m.get(id) ?? id;
  }, [students]);

  // 데이터 전체의 마지막 날짜를 추이 그래프의 기준일로 씁니다
  const lastDate = useMemo(() => sessions.reduce((m, s) => (s.date > m ? s.date : m), ''), [sessions]);

  const ctx = { sessions, subjects, colorOf, nameOf, onOpen, lastDate };
  let body: ReactNode = <p className="dm-empty">데이터를 찾을 수 없습니다.</p>;
  if (target.type === 'session') {
    const s = sessions.find((x) => x.id === target.id);
    if (s) body = <SessionDetail s={s} {...ctx} />;
  } else if (target.type === 'student') {
    const st = students.find((x) => x.id === target.id);
    if (st) body = <StudentDetail st={st} {...ctx} />;
  } else {
    const sub = subjects.find((x) => x.name === target.id);
    body = <SubjectDetail name={target.id} sub={sub} {...ctx} />;
  }

  return (
    <div className="dm-backdrop" onClick={onClose}>
      <div className="dm" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="dm-close" onClick={onClose} aria-label="닫기">
          ×
        </button>
        {body}
      </div>
    </div>
  );
}

interface Ctx {
  sessions: SessionRecord[];
  subjects: Subject[];
  colorOf: (subject: string) => string;
  nameOf: (id: string) => string;
  onOpen: (t: DetailTarget) => void;
  lastDate: string;
}

// ── 공통 조각 ──

function Chip({ name, color, big }: { name: string; color: string; big?: boolean }) {
  return (
    <span className={`chip${big ? ' chip-lg' : ''}`} style={{ '--c': color } as CSSProperties}>
      {name}
    </span>
  );
}

function Stats({ items }: { items: { label: string; value: ReactNode; sub?: ReactNode }[] }) {
  return (
    <div className="dm-stats">
      {items.map((it) => (
        <div key={it.label} className="dm-stat">
          <span className="l">{it.label}</span>
          <span className="v">{it.value}</span>
          {it.sub && <span className="s">{it.sub}</span>}
        </div>
      ))}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="dm-sec">
      <h4>
        {title}
        {hint && <small>{hint}</small>}
      </h4>
      {children}
    </section>
  );
}

/** 가로 막대 목록 (과목별 / 학생별 분포) */
function Bars({ rows }: { rows: { key: string; label: ReactNode; value: number; text: string; color: string; onClick?: () => void }[] }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="dm-bars">
      {rows.map((r) => (
        <li key={r.key} className={r.onClick ? 'link' : undefined} onClick={r.onClick}>
          <span className="lb">{r.label}</span>
          <span className="track">
            <i style={{ width: `${(r.value / max) * 100}%`, background: r.color }} />
          </span>
          <span className="val">{r.text}</span>
        </li>
      ))}
    </ul>
  );
}

/** 최근 14일 일별 공부 시간 막대 그래프 */
function Trend({ list, end, color }: { list: SessionRecord[]; end: string; color: string }) {
  const days = lastDays(end, 14);
  const byDay = new Map<string, number>();
  for (const s of list) byDay.set(s.date, (byDay.get(s.date) ?? 0) + s.duration_seconds);
  const vals = days.map((d) => byDay.get(d) ?? 0);
  const max = Math.max(...vals, 1);
  return (
    <div className="dm-trend">
      {days.map((d, i) => (
        <div key={d} className="col" title={`${d} · ${fmtSec(vals[i])}`}>
          <div className="bar">
            <i style={{ height: `${(vals[i] / max) * 100}%`, background: color, opacity: vals[i] ? 1 : 0 }} />
          </div>
          <span className={i === days.length - 1 ? 'today' : undefined}>{Number(d.slice(8))}</span>
        </div>
      ))}
    </div>
  );
}

function SessionList({ list, ctx, showStudent }: { list: SessionRecord[]; ctx: Ctx; showStudent?: boolean }) {
  return (
    <ul className="dm-list">
      {list.map((s) => (
        <li key={s.id} onClick={() => ctx.onOpen({ type: 'session', id: s.id })}>
          <Chip name={s.subject} color={ctx.colorOf(s.subject)} />
          {showStudent && <span className="who-sm">{ctx.nameOf(s.student_id)}</span>}
          <span className="when">
            {fmtDate(s.date)} {isoHM(s.start_time)}
          </span>
          <b>{fmtSec(s.duration_seconds)}</b>
          <span className="go">›</span>
        </li>
      ))}
    </ul>
  );
}

// ── 세션 상세 ──

function SessionDetail({ s, ...ctx }: { s: SessionRecord } & Ctx) {
  const total = s.duration_seconds + s.pause_seconds + s.distraction_seconds;
  const segs = [
    { label: '공부', sec: s.duration_seconds, color: ctx.colorOf(s.subject) },
    { label: '딴짓', sec: s.distraction_seconds, color: '#f87171' },
    { label: '일시정지', sec: s.pause_seconds, color: '#475569' },
  ].filter((x) => x.sec > 0);
  const focus = s.duration_seconds + s.distraction_seconds > 0 ? Math.round((s.duration_seconds / (s.duration_seconds + s.distraction_seconds)) * 100) : 100;
  const kinds = DISTRACTIONS.map((d) => ({ ...d, sec: s[d.key] })).filter((d) => d.sec > 0);

  return (
    <>
      <header className="dm-head">
        <span className="dm-kicker">세션 #{s.id}</span>
        <div className="dm-title">
          <Chip name={s.subject} color={ctx.colorOf(s.subject)} big />
          <button className="dm-link" onClick={() => ctx.onOpen({ type: 'student', id: s.student_id })}>
            <i className="avatar">{ctx.nameOf(s.student_id).slice(0, 1)}</i>
            {ctx.nameOf(s.student_id)} ›
          </button>
        </div>
        <p className="dm-sub">
          {fmtDate(s.date)} · {isoHM(s.start_time)} – {isoHM(s.end_time)}
        </p>
      </header>

      <Stats
        items={[
          { label: '공부 시간', value: fmtSec(s.duration_seconds) },
          { label: '집중도', value: `${focus}%`, sub: '공부 ÷ (공부 + 딴짓)' },
          { label: '일시정지', value: `${s.pause_count}회`, sub: s.pause_seconds ? fmtSec(s.pause_seconds) : undefined },
          { label: '딴짓', value: fmtSec(s.distraction_seconds) },
        ]}
      />

      <Section title="시간 구성" hint={`전체 ${fmtSec(total)}`}>
        <div className="dm-stack">
          {segs.map((g) => (
            <i key={g.label} style={{ flexGrow: g.sec, background: g.color }} />
          ))}
        </div>
        <div className="dm-legend">
          {segs.map((g) => (
            <span key={g.label}>
              <i style={{ background: g.color }} />
              {g.label} {Math.round((g.sec / total) * 100)}%
            </span>
          ))}
        </div>
      </Section>

      <Section title="딴짓 유형">
        {kinds.length === 0 ? (
          <p className="dm-empty">기록된 딴짓이 없어요 👏</p>
        ) : (
          <Bars rows={kinds.map((k) => ({ key: k.key, label: k.label, value: k.sec, text: fmtSec(k.sec), color: k.color }))} />
        )}
      </Section>

      <dl className="dm-meta">
        <dt>시작</dt>
        <dd>{isoLocal(s.start_time)}</dd>
        <dt>종료</dt>
        <dd>{isoLocal(s.end_time)}</dd>
        <dt>저장</dt>
        <dd>{isoLocal(s.created_at)}</dd>
      </dl>
    </>
  );
}

// ── 학생 상세 ──

function StudentDetail({ st, ...ctx }: { st: Student } & Ctx) {
  const list = ctx.sessions.filter((s) => s.student_id === st.id);
  const total = sum(list.map((s) => s.duration_seconds));
  const days = new Set(list.map((s) => s.date)).size;
  const distraction = sum(list.map((s) => s.distraction_seconds));
  const focus = total + distraction > 0 ? Math.round((total / (total + distraction)) * 100) : 100;

  const bySubject = new Map<string, number>();
  for (const s of list) bySubject.set(s.subject, (bySubject.get(s.subject) ?? 0) + s.duration_seconds);
  const subjectRows = [...bySubject.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, sec]) => ({
      key: name,
      label: <Chip name={name} color={ctx.colorOf(name)} />,
      value: sec,
      text: `${fmtSec(sec)} · ${Math.round((sec / total) * 100)}%`,
      color: ctx.colorOf(name),
    }));
  const recent = [...list].sort((a, b) => b.start_time.localeCompare(a.start_time)).slice(0, 6);

  return (
    <>
      <header className="dm-head">
        <span className="dm-kicker">학생</span>
        <div className="dm-title">
          <i className="avatar avatar-lg">{st.name.slice(0, 1)}</i>
          <h3>{st.name}</h3>
        </div>
        <p className="dm-sub">
          <span className="mono">{st.id}</span> · 가입 {toDateStr(new Date(st.created_at))}
        </p>
      </header>

      <Stats
        items={[
          { label: '누적 공부', value: fmtSec(total) },
          { label: '공부한 날', value: `${days}일`, sub: days ? `하루 평균 ${fmtSec(total / days)}` : undefined },
          { label: '세션', value: `${list.length}회`, sub: list.length ? `평균 ${fmtSec(total / list.length)}` : undefined },
          { label: '집중도', value: `${focus}%` },
        ]}
      />

      {list.length === 0 ? (
        <p className="dm-empty">아직 기록된 세션이 없습니다.</p>
      ) : (
        <>
          <Section title="최근 14일" hint="일별 공부 시간">
            <Trend list={list} end={ctx.lastDate} color="#e94560" />
          </Section>
          <Section title="과목별 공부 시간">
            <Bars rows={subjectRows} />
          </Section>
          <Section title="최근 세션" hint="눌러서 자세히 보기">
            <SessionList list={recent} ctx={ctx} />
          </Section>
        </>
      )}
    </>
  );
}

// ── 과목 상세 ──

function SubjectDetail({ name, sub, ...ctx }: { name: string; sub?: Subject } & Ctx) {
  const color = ctx.colorOf(name);
  const list = ctx.sessions.filter((s) => s.subject === name);
  const total = sum(list.map((s) => s.duration_seconds));

  // 학생-날짜별 합계로 목표 달성 비율을 계산합니다
  const perDay = new Map<string, number>();
  for (const s of list) {
    const k = `${s.student_id}|${s.date}`;
    perDay.set(k, (perDay.get(k) ?? 0) + s.duration_seconds);
  }
  const goalSec = (sub?.goal_minutes ?? 0) * 60;
  const hit = goalSec ? [...perDay.values()].filter((v) => v >= goalSec).length : 0;
  const hitRate = perDay.size && goalSec ? Math.round((hit / perDay.size) * 100) : null;

  const byStudent = new Map<string, number>();
  for (const s of list) byStudent.set(s.student_id, (byStudent.get(s.student_id) ?? 0) + s.duration_seconds);
  const studentRows = [...byStudent.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, sec], i) => ({
      key: id,
      label: (
        <span className="who-sm">
          <em>{i + 1}</em>
          {ctx.nameOf(id)}
        </span>
      ),
      value: sec,
      text: fmtSec(sec),
      color,
      onClick: () => ctx.onOpen({ type: 'student', id }),
    }));
  const recent = [...list].sort((a, b) => b.start_time.localeCompare(a.start_time)).slice(0, 5);

  return (
    <>
      <header className="dm-head">
        <span className="dm-kicker">과목</span>
        <div className="dm-title">
          <Chip name={name} color={color} big />
          {sub && <span className={`badge done-${sub.done}`}>오늘 {DONE_LABEL[sub.done]}</span>}
        </div>
        {sub && (
          <p className="dm-sub">
            하루 목표 {fmtKorean(sub.goal_minutes * 60)} · 순서 {sub.sort_order} ·{' '}
            <span className="swatch">
              <i style={{ background: color }} />
              <span className="mono">{color}</span>
            </span>
          </p>
        )}
      </header>

      <Stats
        items={[
          { label: '누적 공부', value: fmtSec(total) },
          { label: '세션', value: `${list.length}회`, sub: list.length ? `평균 ${fmtSec(total / list.length)}` : undefined },
          { label: '학생', value: `${byStudent.size}명` },
          {
            label: '목표 달성',
            value: hitRate === null ? '—' : `${hitRate}%`,
            sub: hitRate === null ? undefined : `${hit} / ${perDay.size} 학생·일`,
          },
        ]}
      />

      {list.length === 0 ? (
        <p className="dm-empty">이 과목으로 기록된 세션이 없습니다.</p>
      ) : (
        <>
          <Section title="최근 14일" hint="전체 학생 합계">
            <Trend list={list} end={ctx.lastDate} color={color} />
          </Section>
          <Section title="학생별 누적" hint="눌러서 학생 보기">
            <div className="dm-scroll">
              <Bars rows={studentRows} />
            </div>
          </Section>
          <Section title="최근 세션">
            <SessionList list={recent} ctx={ctx} showStudent />
          </Section>
        </>
      )}
    </>
  );
}
