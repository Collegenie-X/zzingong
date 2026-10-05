'use client';

// 오늘 한눈에 보기
// - 위: 주인공 얼굴 + 레벨, 오늘 전체 순공을 가로 여정 막대로 (러너가 목표 성까지 달려감)
// - 아래: 과목별 세로 막대 — 같은 눈금이라 높이로 바로 비교, 흰 선 = 목표
//   막대를 누르면 그 과목의 자세한 기록이 펼쳐집니다 (다시 누르면 닫힘)
// 학생이 선택되지 않았을 때는 안내 문구를 대신 보여줍니다.

import Link from 'next/link';
import { useState } from 'react';
import { Castle, Gem, Heart, Hero, Runner, type Mood } from '@/components/game/GameIcons';
import { fmtKorean, pct } from '@/lib/format';
import type { SessionRecord, Subject } from '@/lib/types';

interface Props {
  studentId: string;
  sessions: SessionRecord[];
  subjects: Subject[];
  /** 타이머에서 지금 선택한 과목 */
  selected?: string | null;
}

function mood(rate: number, focus: number, studied: boolean): { mood: Mood; head: string } {
  if (!studied) return { mood: 'sleepy', head: '오늘의 퀘스트를 시작해 볼까요?' };
  if (rate >= 100) return { mood: 'fire', head: '퀘스트 클리어! 오늘 완전 찐공' };
  if (focus < 70) return { mood: 'dizzy', head: '딴짓 몬스터 습격! 다시 집중!' };
  if (rate >= 60) return { mood: 'strong', head: '보스 방 앞이에요, 조금만 더!' };
  if (rate >= 25) return { mood: 'strong', head: '좋은 흐름! 쭉 전진해요' };
  return { mood: 'sprout', head: '출발! 모험이 시작됐어요' };
}

const HEARTS = 5;
const LEVEL_SEC = 30 * 60;

const DISTRACTIONS = [
  { key: 'distraction_phone', icon: '📱', label: '핸드폰' },
  { key: 'distraction_spacing', icon: '😶', label: '멍때림' },
  { key: 'distraction_away', icon: '🚶', label: '자리 비움' },
  { key: 'distraction_drowsy', icon: '😴', label: '졸음' },
] as const;

const timeOf = (iso: string) =>
  iso ? new Date(iso).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' }) : '-';

export default function TodaySummary({ studentId, sessions, subjects, selected }: Props) {
  const [open, setOpen] = useState<string | null>(null);

  if (!studentId) {
    return (
      <div className="today-summary-bar guide">
        <span className="guide-icon" aria-hidden>
          👋
        </span>
        <div className="guide-text">
          <strong>먼저 위에서 학생을 선택해 주세요.</strong>
          <span>등록된 학생이 없다면 &lsquo;+ 추가&rsquo;를 눌러 이름만 넣으면 바로 시작할 수 있어요.</span>
        </div>
        <Link href="/about" className="guide-link">
          찐공AI가 처음이라면 →
        </Link>
      </div>
    );
  }

  const study = sessions.reduce((a, s) => a + s.duration_seconds, 0);
  const distraction = sessions.reduce((a, s) => a + s.distraction_seconds, 0);
  const planned = subjects.filter((s) => s.done !== 2);
  const goalSec = planned.reduce((a, s) => a + s.goal_minutes * 60, 0);
  const rate = pct(study, goalSec);
  const focus = study + distraction > 0 ? pct(study, study + distraction) : 100;
  const m = mood(rate, focus, study > 0);
  const left = Math.max(0, goalSec - study);
  const level = Math.floor(study / LEVEL_SEC) + 1;
  const levelPct = ((study % LEVEL_SEC) / LEVEL_SEC) * 100;
  const doneCount = planned.filter((s) => s.done === 1).length;
  const cleared = goalSec > 0 && rate >= 100;

  // 여정 길: 과목별 순공을 과목 색으로 이어 붙입니다 (목표를 넘기면 전체를 길 안에 눌러 담음)
  const colorOf = (name: string) => subjects.find((s) => s.name === name)?.color ?? '#888';
  const bySubj = new Map<string, SessionRecord[]>();
  sessions.forEach((s) => bySubj.set(s.subject, [...(bySubj.get(s.subject) ?? []), s]));
  const sum = (list: SessionRecord[] | undefined, key: 'duration_seconds' | 'distraction_seconds') =>
    (list ?? []).reduce((a, s) => a + s[key], 0);
  const scale = Math.max(goalSec, study, 1);
  const segs = [...bySubj].map(([name, list]) => {
    const sec = sum(list, 'duration_seconds');
    return { name, sec, color: colorOf(name), w: (sec / scale) * 100 };
  });
  const pos = Math.min(100, (study / scale) * 100);

  // 집중력 하트: 20%당 한 칸, 반 칸 단위
  const hp = Math.round((focus / 100) * HEARTS * 2) / 2;
  const hearts = Array.from({ length: HEARTS }, (_, i) => (hp >= i + 1 ? 1 : hp >= i + 0.5 ? 0.5 : 0) as 0 | 0.5 | 1);

  // 과목 세로 막대: 모든 막대를 같은 눈금으로 → 높이로 바로 비교
  const cols = planned.map((s) => {
    const list = bySubj.get(s.name) ?? [];
    return {
      name: s.name,
      color: s.color,
      goal: s.goal_minutes * 60,
      sec: sum(list, 'duration_seconds'),
      distraction: sum(list, 'distraction_seconds'),
      done: s.done === 1,
      sessions: list,
    };
  });
  const colScale = Math.max(1, ...cols.map((c) => Math.max(c.goal, c.sec + c.distraction))) * 1.08;
  const h = (sec: number) => `${Math.min(100, (sec / colScale) * 100)}%`;
  const active = cols.find((c) => c.name === open) ?? null;

  return (
    <div className={`today-summary-bar game mood-${m.mood}${cleared ? ' cleared' : ''}`}>
      <div className="tsb-avatar">
        <Hero mood={m.mood} size={54} title={m.head} />
        <span className="tsb-lv">Lv.{level}</span>
        <div className="tsb-lvbar" title={`다음 레벨까지 ${fmtKorean(LEVEL_SEC - (study % LEVEL_SEC))}`}>
          <div style={{ width: `${levelPct}%` }} />
        </div>
      </div>

      <div className="tsb-main">
        <div className="tsb-head">
          <strong>{m.head}</strong>
          <span className="tsb-sub">
            {cleared ? `목표보다 ${fmtKorean(study - goalSec)} 더 달렸어요` : `성까지 ${fmtKorean(left)}`}
          </span>
        </div>
        <div className="tsb-times">
          <span className="study">
            <i />
            순공 <b>{fmtKorean(study)}</b>
          </span>
          <span className={`fake${distraction > 0 ? ' on' : ''}`}>
            <i />
            딴짓 <b>{fmtKorean(distraction)}</b>
          </span>
        </div>
        <div className="tsb-journey">
          <div className="tsb-road">
            {segs.map((s) => (
              <div
                key={s.name}
                className="seg"
                style={{ width: `${s.w}%`, background: s.color }}
                title={`${s.name} ${fmtKorean(s.sec)}`}
              />
            ))}
            {[25, 50, 75].map((t) => (
              <span key={t} className={`tick${pos >= t ? ' passed' : ''}`} style={{ left: `${t}%` }} />
            ))}
          </div>
          <div className="tsb-me" style={{ left: `${pos}%` }} title={`목표의 ${rate}%`}>
            <Runner size={28} />
          </div>
          <Castle size={34} reached={cleared} className="tsb-castle" />
        </div>
      </div>

      <div className="tsb-side">
        <div className={`tsb-hp${focus < 70 ? ' low' : ''}`} title={`집중 ${focus}% · 딴짓 ${fmtKorean(distraction)}`}>
          <div className="row">
            {hearts.map((f, i) => (
              <Heart key={i} fill={f} size={18} />
            ))}
          </div>
          <span className="tsb-k">집중력</span>
        </div>
      </div>

      {cols.length > 0 && (
        <div className="tsb-chart">
          <div className="tsb-chart-head">
            <span>과목별 퀘스트</span>
            <span className="tsb-k">
              보석 <b>{doneCount}</b>/{planned.length}
            </span>
          </div>
          <div className="tsb-cols" role="tablist" aria-label="과목별 오늘 기록">
            {cols.map((c) => {
              const r = pct(c.sec, c.goal);
              return (
                <button
                  key={c.name}
                  type="button"
                  role="tab"
                  aria-selected={open === c.name}
                  className={`tsb-col${c.name === selected ? ' sel' : ''}${open === c.name ? ' open' : ''}${open && open !== c.name ? ' dim' : ''}${c.done ? ' done' : ''}${c.sec === 0 ? ' zero' : ''}`}
                  style={{ '--c': c.color } as React.CSSProperties}
                  title={`${c.name} 순공 ${fmtKorean(c.sec)} · 딴짓 ${fmtKorean(c.distraction)} / 목표 ${fmtKorean(c.goal)} (${r}%)`}
                  onClick={() => setOpen(open === c.name ? null : c.name)}
                >
                  <span className="val">{c.sec > 0 ? fmtKorean(c.sec) : ''}</span>
                  <div className="well">
                    {c.goal > 0 && <span className="goal" style={{ bottom: h(c.goal) }} />}
                    <div className="stack">
                      {c.distraction > 0 && <div className="fake" style={{ height: h(c.distraction) }} />}
                      <div className="bar" style={{ height: h(c.sec) }}>
                        {c.done && <Gem color={c.color} on size={16} className="cap" />}
                      </div>
                    </div>
                  </div>
                  <span className="name">{c.name}</span>
                  {c.distraction > 0 && <span className="dval">딴짓 {fmtKorean(c.distraction)}</span>}
                </button>
              );
            })}
          </div>

          {active && (
            <div className="tsb-detail">
              <div className="tsb-detail-head">
                <span className="dot" style={{ background: active.color }} />
                <strong>{active.name}</strong>
                <span className="muted">
                  {fmtKorean(active.sec)}
                  {active.goal > 0 && <> / 목표 {fmtKorean(active.goal)} · {pct(active.sec, active.goal)}%</>}
                </span>
                <button type="button" className="close" onClick={() => setOpen(null)} aria-label="닫기">
                  ×
                </button>
              </div>
              <DetailBody
                study={active.sec}
                distraction={active.distraction}
                sessions={active.sessions}
                color={active.color}
                colorOf={colorOf}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailBody({
  study,
  distraction,
  sessions,
  color,
  colorOf,
}: {
  study: number;
  distraction: number;
  sessions: SessionRecord[];
  /** 과목 하나를 보고 있을 때 그 과목 색 */
  color?: string;
  colorOf: (name: string) => string;
}) {
  if (sessions.length === 0) return <p className="tsb-empty">아직 기록이 없어요</p>;

  const focus = study + distraction > 0 ? pct(study, study + distraction) : 100;
  const pauses = sessions.reduce((a, s) => a + s.pause_count, 0);
  const kinds = DISTRACTIONS.map((d) => ({ ...d, sec: sessions.reduce((a, s) => a + s[d.key], 0) })).filter(
    (d) => d.sec > 0,
  );

  return (
    <div className="tsb-detail-body">
      <div className="tsb-focus">
        <div className="tsb-focus-bar">
          <span className="ok" style={{ width: `${focus}%`, background: color }} />
          <span className="ng" style={{ width: `${100 - focus}%` }} />
        </div>
        <div className="tsb-focus-legend">
          <span>집중 {focus}%</span>
          <span className="ng">딴짓 {fmtKorean(distraction)}</span>
          <span>일시정지 {pauses}회</span>
        </div>
        {kinds.length > 0 && (
          <div className="tsb-kinds">
            {kinds.map((k) => (
              <span key={k.key} className="chip">
                {k.icon} {k.label} {fmtKorean(k.sec)}
              </span>
            ))}
          </div>
        )}
      </div>

      <ul className="tsb-sessions">
        {sessions.map((s) => (
          <li key={s.id}>
            <span className="dot" style={{ background: color ?? colorOf(s.subject) }} />
            {!color && <span className="subj">{s.subject}</span>}
            <span className="t">
              {timeOf(s.start_time)} – {timeOf(s.end_time)}
            </span>
            <span className="d">{fmtKorean(s.duration_seconds)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
